const express = require('express');
const router = express.Router();
const Habit = require('../models/Habit');

// @desc    Get all habits
// @route   GET /api/habits
router.get('/', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized. User ID is required' });
    }

    const habits = await Habit.find({ userId }).sort({ createdAt: -1 });
    
    // Recalculate streak for all habits in case days passed
    let modified = false;
    for (let habit of habits) {
      const oldStreak = habit.streak;
      habit.calculateStreak();
      if (oldStreak !== habit.streak) {
        await habit.save();
      }
    }
    
    res.status(200).json(habits);
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
});

// @desc    Create a habit
// @route   POST /api/habits
router.post('/', async (req, res) => {
  try {
    const { title, description, category, frequency, targetValue, unit } = req.body;
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized. User ID is required' });
    }
    
    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const newHabit = new Habit({
      userId,
      title,
      description,
      category,
      frequency,
      targetValue: targetValue || 1,
      unit: unit || 'times',
      progress: {}
    });

    const savedHabit = await newHabit.save();
    res.status(201).json(savedHabit);
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
});

// @desc    Bulk create habits
// @route   POST /api/habits/bulk
router.post('/bulk', async (req, res) => {
  try {
    const { habits } = req.body; // Array of habit objects
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized. User ID is required' });
    }

    if (!habits || !Array.isArray(habits)) {
      return res.status(400).json({ message: 'Habits array is required' });
    }

    const habitsToCreate = habits.map(h => ({
      userId,
      title: h.title,
      description: h.description || '',
      category: h.category || 'General',
      frequency: h.frequency || 'daily',
      targetValue: h.targetValue || 1,
      unit: h.unit || 'times',
      progress: {}
    }));

    const savedHabits = await Habit.insertMany(habitsToCreate);
    res.status(201).json(savedHabits);
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
});

// @desc    Toggle habit completion for a specific date
// @route   PUT /api/habits/:id/toggle
router.put('/:id/toggle', async (req, res) => {
  try {
    const { date } = req.body; // Expected format: 'YYYY-MM-DD'
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized. User ID is required' });
    }
    if (!date) {
      return res.status(400).json({ message: 'Date is required' });
    }

    const habit = await Habit.findOne({ _id: req.params.id, userId });
    if (!habit) {
      return res.status(404).json({ message: 'Habit not found or unauthorized' });
    }

    if (!habit.progress) {
      habit.progress = {};
    }

    const logIndex = habit.logs.indexOf(date);
    if (logIndex > -1) {
      // Date exists, so untoggle (remove it)
      habit.logs.splice(logIndex, 1);
      habit.progress[date] = 0;
    } else {
      // Date doesn't exist, toggle (add it)
      habit.logs.push(date);
      habit.progress[date] = habit.targetValue || 1;
    }

    habit.markModified('progress');

    // Recalculate streak
    habit.calculateStreak();
    await habit.save();

    res.status(200).json(habit);
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
});

// @desc    Update progress for a specific date
// @route   PUT /api/habits/:id/progress
router.put('/:id/progress', async (req, res) => {
  try {
    const { date, value } = req.body; // value is numeric progress
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized. User ID is required' });
    }
    if (!date || value === undefined) {
      return res.status(400).json({ message: 'Date and value are required' });
    }

    const habit = await Habit.findOne({ _id: req.params.id, userId });
    if (!habit) {
      return res.status(404).json({ message: 'Habit not found or unauthorized' });
    }

    if (!habit.progress) {
      habit.progress = {};
    }

    const numValue = Number(value);
    habit.progress[date] = numValue;

    const target = habit.targetValue || 1;
    const isCompleted = numValue >= target;
    const logIndex = habit.logs.indexOf(date);

    if (isCompleted && logIndex === -1) {
      habit.logs.push(date);
    } else if (!isCompleted && logIndex > -1) {
      habit.logs.splice(logIndex, 1);
    }

    habit.markModified('progress');
    habit.calculateStreak();
    await habit.save();

    res.status(200).json(habit);
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
});

// @desc    Update a habit
// @route   PUT /api/habits/:id
router.put('/:id', async (req, res) => {
  try {
    const { title, description, category, frequency, targetValue, unit } = req.body;
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized. User ID is required' });
    }
    
    let habit = await Habit.findOne({ _id: req.params.id, userId });
    if (!habit) {
      return res.status(404).json({ message: 'Habit not found or unauthorized' });
    }

    if (title) habit.title = title;
    if (description !== undefined) habit.description = description;
    if (category) habit.category = category;
    if (frequency) habit.frequency = frequency;
    if (targetValue !== undefined) habit.targetValue = targetValue;
    if (unit !== undefined) habit.unit = unit;

    // Recalculate streak
    habit.calculateStreak();
    await habit.save();

    res.status(200).json(habit);
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
});

// @desc    Delete a habit
// @route   DELETE /api/habits/:id
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized. User ID is required' });
    }

    const habit = await Habit.findOne({ _id: req.params.id, userId });
    if (!habit) {
      return res.status(404).json({ message: 'Habit not found or unauthorized' });
    }

    await Habit.deleteOne({ _id: req.params.id, userId });
    res.status(200).json({ message: 'Habit deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
});

module.exports = router;
