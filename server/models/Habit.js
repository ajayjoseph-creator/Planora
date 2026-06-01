const mongoose = require('mongoose');

const HabitSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Habit must belong to a user'],
  },
  title: {
    type: String,
    required: [true, 'Please add a habit title'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  category: {
    type: String,
    default: 'General',
    enum: ['Health', 'Fitness', 'Mind', 'Work', 'Finance', 'Social', 'General'],
  },
  frequency: {
    type: String,
    default: 'daily',
    enum: ['daily', 'weekly', 'custom'],
  },
  streak: {
    type: Number,
    default: 0,
  },
  longestStreak: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  logs: {
    type: [String], // Array of date strings, e.g., '2026-06-01'
    default: [],
  },
  targetValue: {
    type: Number,
    default: 1,
  },
  unit: {
    type: String,
    default: 'times',
  },
  progress: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  }
});

// Calculate current streak based on logs
HabitSchema.methods.calculateStreak = function() {
  if (!this.logs || this.logs.length === 0) {
    this.streak = 0;
    return this.streak;
  }

  // Sort logs in descending order (newest first)
  const sortedLogs = [...this.logs].sort((a, b) => new Date(b) - new Date(a));
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const latestLogDate = new Date(sortedLogs[0]);
  latestLogDate.setHours(0, 0, 0, 0);

  // If the last log is older than yesterday, streak is broken
  if (latestLogDate < yesterday && latestLogDate.getTime() !== today.getTime()) {
    this.streak = 0;
    return this.streak;
  }

  let currentStreak = 0;
  let checkDate = new Date(latestLogDate);

  for (let i = 0; i < sortedLogs.length; i++) {
    const logDate = new Date(sortedLogs[i]);
    logDate.setHours(0, 0, 0, 0);

    // If it matches the check date, increment streak and decrement check date by 1 day
    if (logDate.getTime() === checkDate.getTime()) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (logDate.getTime() < checkDate.getTime()) {
      // If there's a gap, stop calculating
      break;
    }
  }

  this.streak = currentStreak;
  if (this.streak > this.longestStreak) {
    this.longestStreak = this.streak;
  }

  return this.streak;
};

module.exports = mongoose.model('Habit', HabitSchema);
