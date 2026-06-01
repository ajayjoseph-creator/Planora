import axios from 'axios';

export const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050';
const API_URL = `${BASE_URL}/api/habits`;

// Helper to extract the current user ID
const getUserId = () => {
  try {
    const savedUser = localStorage.getItem('planora_user');
    if (savedUser) {
      const userObj = JSON.parse(savedUser);
      return userObj._id;
    }
  } catch (e) {
    console.error('Error parsing planora_user from localStorage', e);
  }
  return null;
};

// User-isolated local storage helpers for offline fallback
const getLocalHabitsKey = () => {
  const userId = getUserId();
  return userId ? `planora_habits_${userId}` : 'planora_habits_guest';
};

const getLocalHabits = () => {
  const key = getLocalHabitsKey();
  const local = localStorage.getItem(key);
  return local ? JSON.parse(local) : [];
};

const setLocalHabits = (habits) => {
  const key = getLocalHabitsKey();
  localStorage.setItem(key, JSON.stringify(habits));
};

// Axios request configuration helper with x-user-id header
const getAxiosConfig = () => {
  const userId = getUserId();
  const config = { timeout: 2500 };
  if (userId) {
    config.headers = {
      'x-user-id': userId
    };
  }
  return config;
};

// Calculate streak helper for local storage fallback
const calculateStreakLocal = (logs) => {
  if (!logs || logs.length === 0) return 0;
  const sortedLogs = [...logs].sort((a, b) => new Date(b) - new Date(a));
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const latestLogDate = new Date(sortedLogs[0]);
  latestLogDate.setHours(0, 0, 0, 0);

  if (latestLogDate < yesterday && latestLogDate.getTime() !== today.getTime()) {
    return 0;
  }

  let currentStreak = 0;
  let checkDate = new Date(latestLogDate);

  for (let i = 0; i < sortedLogs.length; i++) {
    const logDate = new Date(sortedLogs[i]);
    logDate.setHours(0, 0, 0, 0);

    if (logDate.getTime() === checkDate.getTime()) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (logDate.getTime() < checkDate.getTime()) {
      break;
    }
  }
  return currentStreak;
};

export const api = {
  isBackendOffline: false,

  async getHabits() {
    try {
      const response = await axios.get(API_URL, getAxiosConfig());
      this.isBackendOffline = false;
      return response.data;
    } catch (error) {
      console.warn('Backend server connection failed. Falling back to local storage.', error.message);
      this.isBackendOffline = true;
      // Get from local storage, calculate streaks in case days passed
      const localHabits = getLocalHabits();
      let updated = false;
      localHabits.forEach(h => {
        const oldStreak = h.streak;
        h.streak = calculateStreakLocal(h.logs);
        if (h.streak > (h.longestStreak || 0)) {
          h.longestStreak = h.streak;
        }
        if (oldStreak !== h.streak) {
          updated = true;
        }
      });
      if (updated) {
        setLocalHabits(localHabits);
      }
      return localHabits;
    }
  },

  async createHabit(habitData) {
    if (this.isBackendOffline) {
      const localHabits = getLocalHabits();
      const newHabit = {
        _id: 'local_' + Math.random().toString(36).substr(2, 9),
        ...habitData,
        streak: 0,
        longestStreak: 0,
        logs: [],
        createdAt: new Date().toISOString()
      };
      localHabits.push(newHabit);
      setLocalHabits(localHabits);
      return newHabit;
    }

    try {
      const response = await axios.post(API_URL, habitData, getAxiosConfig());
      return response.data;
    } catch (error) {
      this.isBackendOffline = true;
      return this.createHabit(habitData); // retry with local fallback
    }
  },

  async toggleHabit(id, date) {
    if (this.isBackendOffline || String(id).startsWith('local_')) {
      const localHabits = getLocalHabits();
      const habit = localHabits.find(h => h._id === id);
      if (habit) {
        if (!habit.progress) habit.progress = {};
        const logIndex = habit.logs.indexOf(date);
        if (logIndex > -1) {
          habit.logs.splice(logIndex, 1);
          habit.progress[date] = 0;
        } else {
          habit.logs.push(date);
          habit.progress[date] = habit.targetValue || 1;
        }
        habit.streak = calculateStreakLocal(habit.logs);
        if (habit.streak > (habit.longestStreak || 0)) {
          habit.longestStreak = habit.streak;
        }
        setLocalHabits(localHabits);
        return habit;
      }
      throw new Error('Habit not found in local storage');
    }

    try {
      const response = await axios.put(`${API_URL}/${id}/toggle`, { date }, getAxiosConfig());
      return response.data;
    } catch (error) {
      this.isBackendOffline = true;
      return this.toggleHabit(id, date); // retry with local fallback
    }
  },

  async updateProgress(id, date, value) {
    if (this.isBackendOffline || String(id).startsWith('local_')) {
      const localHabits = getLocalHabits();
      const habit = localHabits.find(h => h._id === id);
      if (habit) {
        if (!habit.progress) habit.progress = {};
        habit.progress[date] = Number(value);
        
        const target = habit.targetValue || 1;
        const isCompleted = Number(value) >= target;
        const logIndex = habit.logs.indexOf(date);
        
        if (isCompleted && logIndex === -1) {
          habit.logs.push(date);
        } else if (!isCompleted && logIndex > -1) {
          habit.logs.splice(logIndex, 1);
        }
        
        habit.streak = calculateStreakLocal(habit.logs);
        if (habit.streak > (habit.longestStreak || 0)) {
          habit.longestStreak = habit.streak;
        }
        setLocalHabits(localHabits);
        return habit;
      }
      throw new Error('Habit not found in local storage');
    }

    try {
      const response = await axios.put(`${API_URL}/${id}/progress`, { date, value }, getAxiosConfig());
      return response.data;
    } catch (error) {
      this.isBackendOffline = true;
      return this.updateProgress(id, date, value); // retry with local fallback
    }
  },

  async createHabitsBulk(habitsArray) {
    if (this.isBackendOffline) {
      const localHabits = getLocalHabits();
      const created = habitsArray.map(h => ({
        _id: 'local_' + Math.random().toString(36).substr(2, 9),
        title: h.title,
        description: h.description || '',
        category: h.category || 'General',
        frequency: h.frequency || 'daily',
        targetValue: h.targetValue || 1,
        unit: h.unit || 'times',
        streak: 0,
        longestStreak: 0,
        logs: [],
        progress: {},
        createdAt: new Date().toISOString()
      }));
      localHabits.push(...created);
      setLocalHabits(localHabits);
      return created;
    }

    try {
      const response = await axios.post(`${API_URL}/bulk`, { habits: habitsArray }, getAxiosConfig());
      return response.data;
    } catch (error) {
      this.isBackendOffline = true;
      return this.createHabitsBulk(habitsArray); // retry with local fallback
    }
  },

  async updateHabit(id, habitData) {
    if (this.isBackendOffline || String(id).startsWith('local_')) {
      const localHabits = getLocalHabits();
      const index = localHabits.findIndex(h => h._id === id);
      if (index > -1) {
        localHabits[index] = {
          ...localHabits[index],
          ...habitData
        };
        setLocalHabits(localHabits);
        return localHabits[index];
      }
      throw new Error('Habit not found in local storage');
    }

    try {
      const response = await axios.put(`${API_URL}/${id}`, habitData, getAxiosConfig());
      return response.data;
    } catch (error) {
      this.isBackendOffline = true;
      return this.updateHabit(id, habitData); // retry with local fallback
    }
  },

  async deleteHabit(id) {
    if (this.isBackendOffline || String(id).startsWith('local_')) {
      const localHabits = getLocalHabits();
      const filtered = localHabits.filter(h => h._id !== id);
      setLocalHabits(filtered);
      return { message: 'Deleted locally' };
    }

    try {
      await axios.delete(`${API_URL}/${id}`, getAxiosConfig());
      return { message: 'Deleted from backend' };
    } catch (error) {
      this.isBackendOffline = true;
      return this.deleteHabit(id); // retry with local fallback
    }
  }
};
