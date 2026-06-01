import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Search, AlertCircle, BarChart3, ListTodo, RefreshCw, LogOut, 
  CheckCircle2, Calendar, Bell, Compass, User as UserIcon, Flame, Clock, 
  Users, ArrowRight, BookOpen, Trophy, Sparkles, ChevronRight, Check
} from 'lucide-react';
import SplashScreen from './components/SplashScreen';
import Logo from './components/Logo';
import HabitCard from './components/HabitCard';
import AddHabitModal from './components/AddHabitModal';
import Analytics from './components/Analytics';
import Auth from './components/Auth';
import Onboarding from './components/Onboarding';
import { api, BASE_URL } from './api';

// Preset Catalog habits if the user has 0 habits
const CATALOG_HABITS = [
  { title: 'Drink Water', emoji: '💧', category: 'Health', targetValue: 2000, unit: 'ml', description: 'Drink water throughout the day' },
  { title: 'Morning Walk', emoji: '🚶', category: 'Fitness', targetValue: 10000, unit: 'steps', description: '10,000 steps morning walk' },
  { title: 'Read Books', emoji: '📖', category: 'Mind', targetValue: 15, unit: 'pages', description: 'Read at least 15 pages daily' },
  { title: 'Meditate', emoji: '🧘', category: 'Mind', targetValue: 10, unit: 'mins', description: '10 mins mindfulness meditation' },
  { title: 'Workout', emoji: '💪', category: 'Fitness', targetValue: 1, unit: 'times', description: 'Exercise or gym session' },
  { title: 'Healthy Eating', emoji: '🥗', category: 'Health', targetValue: 3, unit: 'times', description: 'Eat clean and balanced meals' },
  { title: 'Journal Writing', emoji: '📝', category: 'Mind', targetValue: 1, unit: 'times', description: 'Reflect and write your thoughts' },
  { title: 'Sleep Early', emoji: '😴', category: 'Health', targetValue: 1, unit: 'times', description: 'Go to bed before 11 PM' },
  { title: 'Learn Coding', emoji: '💻', category: 'Work', targetValue: 45, unit: 'mins', description: 'Practice coding or build projects' },
  { title: 'Save Money', emoji: '💰', category: 'Finance', targetValue: 1, unit: 'times', description: 'Track spending and budget daily' },
  { title: 'Stretch', emoji: '🤸', category: 'Fitness', targetValue: 10, unit: 'mins', description: '10 mins stretching exercises' },
  { title: 'Drink Green Tea', emoji: '🍵', category: 'Health', targetValue: 2, unit: 'cups', description: 'Healthy green tea beverage' },
  { title: 'Call Family', emoji: '📞', category: 'Social', targetValue: 1, unit: 'times', description: 'Connect with your loved ones' },
  { title: 'Skincare', emoji: '✨', category: 'Health', targetValue: 2, unit: 'times', description: 'Morning and evening routine' }
];

// Utility helper for avatar styles
const getAvatarStyle = (avatarKey) => {
  const styles = {
    blue: 'bg-gradient-to-tr from-blue-500 to-indigo-600 text-white shadow-sm shadow-blue-100',
    rose: 'bg-gradient-to-tr from-rose-500 to-pink-600 text-white shadow-sm shadow-rose-100',
    emerald: 'bg-gradient-to-tr from-emerald-500 to-teal-600 text-white shadow-sm shadow-emerald-100',
    purple: 'bg-gradient-to-tr from-purple-500 to-indigo-600 text-white shadow-sm shadow-purple-100',
    amber: 'bg-gradient-to-tr from-amber-500 to-orange-600 text-white shadow-sm shadow-amber-100',
    dark: 'bg-gradient-to-tr from-slate-700 to-slate-900 text-white shadow-sm shadow-slate-100',
  };
  
  if (avatarKey === '/avatar_woman_1.png') return styles.rose;
  if (avatarKey === '/avatar_woman_2.png') return styles.purple;
  if (avatarKey === '/avatar_man.png') return styles.blue;
  
  return styles[avatarKey] || styles.blue;
};

const renderUserAvatar = (user, sizeClasses = "w-10 h-10 rounded-xl text-sm font-bold shadow-sm") => {
  const initial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';
  const styleClass = getAvatarStyle(user?.avatar);
  return (
    <div className={`${sizeClasses} flex items-center justify-center select-none uppercase font-black ${styleClass}`}>
      {initial}
    </div>
  );
};

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [user, setUser] = useState(null);
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'explore' | 'stats' | 'profile'
  const [homeSubTab, setHomeSubTab] = useState('today'); // 'today' | 'clubs'
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Date scroller selected date
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Catalog selected indices (empty state multi-select)
  const [selectedCatalogIndexes, setSelectedCatalogIndexes] = useState([0, 1, 2, 3]);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  
  // Offline state banner
  const [isOffline, setIsOffline] = useState(false);

  // Mock clubs state
  const [clubs, setClubs] = useState([
    { id: 1, name: '5 AM Club 🌅', description: 'Wake up early and win the morning together.', members: 128, joined: false },
    { id: 2, name: 'Water Chuggers 💧', description: 'Stay perfectly hydrated throughout the day.', members: 94, joined: true },
    { id: 3, name: 'Running Club 🏃', description: 'A community running for a healthy mind and body.', members: 215, joined: false },
    { id: 4, name: 'Daily Zen 🧘', description: '10-20 minutes of community meditation.', members: 82, joined: false }
  ]);

  // Mock challenges state
  const [challenges, setChallenges] = useState([
    { id: 'c1', title: 'Best Runners! 🏃', timeLeft: '5 days 13 hours left', joined: true, count: 2, progress: 40 },
    { id: 'c2', title: 'Sugar Detox 🍏', timeLeft: '2 days 4 hours left', joined: false, count: 5, progress: 0 },
    { id: 'c3', title: 'Read-a-Thon 📚', timeLeft: '10 days left', joined: false, count: 1, progress: 10 }
  ]);

  // Fetch habits
  const fetchHabits = async () => {
    setLoading(true);
    try {
      const data = await api.getHabits();
      setHabits(data);
      setIsOffline(api.isBackendOffline);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Auth load check on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('planora_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // Fetch habits when splash completes and user is authenticated and profile is completed
  useEffect(() => {
    if (!showSplash && user && user.profileCompleted !== false) {
      fetchHabits();
    }
  }, [showSplash, user]);

  // Handle onboarding completion
  const handleOnboardingComplete = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('planora_user', JSON.stringify(updatedUser));
  };

  // Cycle avatars (color styles) inside user profile tab
  const handleCycleAvatar = async () => {
    if (!user) return;
    const colorStyles = ['blue', 'rose', 'emerald', 'purple', 'amber', 'dark'];
    
    let currentStyle = user.avatar || 'blue';
    if (currentStyle === '/avatar_woman_1.png') currentStyle = 'rose';
    else if (currentStyle === '/avatar_woman_2.png') currentStyle = 'purple';
    else if (currentStyle === '/avatar_man.png') currentStyle = 'blue';
    
    const currentIdx = colorStyles.indexOf(currentStyle);
    const nextIdx = currentIdx === -1 ? 0 : (currentIdx + 1) % colorStyles.length;
    const newAvatar = colorStyles[nextIdx];

    const updatedUser = { ...user, avatar: newAvatar };
    setUser(updatedUser);
    localStorage.setItem('planora_user', JSON.stringify(updatedUser));

    // Update in backend silently
    try {
      if (user.email) {
        await axios.put(`${BASE_URL}/api/auth/complete-profile`, {
          email: user.email,
          name: user.name,
          birthday: user.birthday,
          avatar: newAvatar
        });
      }
    } catch (e) {
      console.warn('Silent avatar sync failed:', e.message);
    }
  };

  // Toggle habit check log (full completion toggle)
  const handleToggleHabit = async (id, dateStr) => {
    try {
      const updated = await api.toggleHabit(id, dateStr);
      setHabits(prev => prev.map(h => h._id === id ? updated : h));
      setIsOffline(api.isBackendOffline);
    } catch (err) {
      console.error(err);
    }
  };

  // Progress Logging Change handler (incremental)
  const handleProgressChange = async (id, dateStr, newValue) => {
    try {
      const updated = await api.updateProgress(id, dateStr, newValue);
      setHabits(prev => prev.map(h => h._id === id ? updated : h));
      setIsOffline(api.isBackendOffline);
    } catch (err) {
      console.error(err);
    }
  };

  // Create or Update Habit
  const handleSaveHabit = async (habitData) => {
    try {
      if (editingHabit) {
        const updated = await api.updateHabit(editingHabit._id, habitData);
        setHabits(prev => prev.map(h => h._id === editingHabit._id ? updated : h));
      } else {
        const created = await api.createHabit(habitData);
        setHabits(prev => [created, ...prev]);
      }
      setIsOffline(api.isBackendOffline);
      setEditingHabit(null);
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Habit
  const handleDeleteHabit = async (id) => {
    if (window.confirm('Are you sure you want to delete this habit?')) {
      try {
        await api.deleteHabit(id);
        setHabits(prev => prev.filter(h => h._id !== id));
        setIsOffline(api.isBackendOffline);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Bulk create preset habits from the fullscreen empty state Catalog
  const handleBulkActivate = async () => {
    if (selectedCatalogIndexes.length === 0) return;
    setLoading(true);
    try {
      const list = selectedCatalogIndexes.map(idx => ({
        title: CATALOG_HABITS[idx].title,
        description: CATALOG_HABITS[idx].description,
        category: CATALOG_HABITS[idx].category,
        targetValue: CATALOG_HABITS[idx].targetValue,
        unit: CATALOG_HABITS[idx].unit,
        frequency: 'daily'
      }));
      const created = await api.createHabitsBulk(list);
      setHabits(created);
    } catch (err) {
      console.error('Error activating catalog habits:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCatalogSelection = (idx) => {
    setSelectedCatalogIndexes(prev => 
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  // Trigger modal for editing
  const handleTriggerEdit = (habit) => {
    setEditingHabit(habit);
    setIsModalOpen(true);
  };

  // Trigger modal for creating
  const handleTriggerCreate = () => {
    setEditingHabit(null);
    setIsModalOpen(true);
  };

  // Logout action handler
  const handleLogout = () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      localStorage.removeItem('planora_user');
      setUser(null);
      setHabits([]);
    }
  };

  // Toggle Join Club
  const handleToggleJoinClub = (clubId) => {
    setClubs(prev => prev.map(c => 
      c.id === clubId ? { ...c, joined: !c.joined, members: c.joined ? c.members - 1 : c.members + 1 } : c
    ));
  };

  // Toggle Join Challenge
  const handleToggleJoinChallenge = (challengeId) => {
    setChallenges(prev => prev.map(c => 
      c.id === challengeId ? { ...c, joined: !c.joined, count: c.joined ? c.count - 1 : c.count + 1, progress: c.joined ? 0 : 10 } : c
    ));
  };

  // Filter habits by category and search term
  const filteredHabits = habits.filter(h => {
    const matchesCategory = selectedCategory === 'All' || h.category === selectedCategory;
    const matchesSearch = h.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (h.description && h.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Calculate today completion details
  const todayStr = new Date().toISOString().split('T')[0];
  const completedTodayCount = habits.filter(h => {
    const progressVal = h.progress && h.progress[selectedDate] !== undefined
      ? h.progress[selectedDate]
      : (h.logs.includes(selectedDate) ? h.targetValue : 0);
    return progressVal >= h.targetValue;
  }).length;
  
  const totalHabitsCount = habits.length;
  const completionPercentage = totalHabitsCount > 0 
    ? Math.round((completedTodayCount / totalHabitsCount) * 100) 
    : 0;

  // Nice greetings based on time
  const getGreeting = () => {
    const hrs = new Date().getHours();
    if (hrs < 12) return 'Good Morning';
    if (hrs < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Calculate age for Profile
  const getUserAge = () => {
    if (!user || !user.birthday) return null;
    const birth = new Date(user.birthday);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  // Generate Date Scroller items (Current week Sunday to Saturday)
  const getWeekDays = () => {
    const current = new Date();
    const week = [];
    const sunday = new Date(current);
    sunday.setDate(current.getDate() - current.getDay());
    for (let i = 0; i < 7; i++) {
      const day = new Date(sunday);
      day.setDate(sunday.getDate() + i);
      week.push(day);
    }
    return week;
  };
  const weekDays = getWeekDays();

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  // If splash finished but user is not authenticated, show Auth Page
  if (!user) {
    return <Auth onLoginSuccess={(loggedInUser) => setUser(loggedInUser)} />;
  }

  // If user is authenticated but hasn't completed profile, show Onboarding
  if (user.profileCompleted === false) {
    return <Onboarding user={user} onComplete={handleOnboardingComplete} />;
  }

  // Render navigation tab icons helper
  const navItems = [
    { id: 'home', label: 'Routines', icon: ListTodo },
    { id: 'stats', label: 'Analytics', icon: BarChart3 },
    { id: 'profile', label: 'Profile', icon: UserIcon }
  ];

  return (
    <div className="min-h-screen bg-slate-50 bg-glow flex flex-col md:flex-row font-sans text-slate-800">
      
      {/* ----------------- SIDEBAR (DESKTOP) ----------------- */}
      <aside className="hidden md:flex flex-col w-64 bg-white/70 backdrop-blur-md border-r border-slate-200/50 sticky top-0 h-screen z-30 p-5 shrink-0 justify-between">
        <div className="flex flex-col gap-8">
          {/* Logo */}
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="flex items-center gap-2 px-2"
          >
            <Logo className="w-9 h-9" showText={true} textClass="text-xl text-slate-800 font-extrabold" />
          </motion.div>

          {/* Quick Create button */}
          <motion.button
            whileHover={{ 
              scale: 1.02,
              boxShadow: "0 10px 15px -3px rgba(37, 99, 235, 0.15), 0 4px 6px -4px rgba(37, 99, 235, 0.15)"
            }}
            whileTap={{ scale: 0.98 }}
            onClick={handleTriggerCreate}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-2xl text-sm font-bold shadow-md shadow-blue-100 hover:from-blue-700 hover:to-indigo-700 transition-all w-full group/create"
          >
            <Plus className="w-5 h-5 stroke-[2.5] group-hover/create:rotate-90 transition-transform duration-350 ease-out" />
            <span>Create New Habit</span>
          </motion.button>

          {/* Sidebar Navigation items */}
          <nav className="flex flex-col gap-1.5 relative">
            {navItems.map((item) => {
              const IconComp = item.icon;
              const isActive = activeTab === item.id;
              return (
                <motion.button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  whileHover="hover"
                  whileTap={{ scale: 0.98 }}
                  className={`relative flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-colors duration-200 select-none w-full text-left outline-none ${
                    isActive ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {/* Sliding Spring background pill */}
                  {isActive && (
                    <motion.div
                      layoutId="activeSidebarIndicator"
                      className="absolute inset-0 bg-blue-50/95 rounded-2xl -z-10 border-l-4 border-blue-600"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}

                  {/* Playful shake icon on hover */}
                  <motion.div
                    variants={{
                      hover: { scale: 1.1, rotate: [0, -10, 10, 0] }
                    }}
                    transition={{ duration: 0.3 }}
                    className="relative z-10 flex items-center justify-center"
                  >
                    <IconComp className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[2]'}`} />
                  </motion.div>

                  <motion.span
                    variants={{
                      hover: { x: 3 }
                    }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="relative z-10 font-bold"
                  >
                    {item.label}
                  </motion.span>
                </motion.button>
              );
            })}
          </nav>
        </div>

        {/* Desktop Profile Info & Logout */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex flex-col gap-4 border-t border-slate-100 pt-5"
        >
          <motion.div 
            whileHover={{ x: 2 }}
            onClick={() => setActiveTab('profile')}
            className="flex items-center gap-3 px-2 cursor-pointer group"
          >
            <div className="group-hover:scale-105 transition-transform duration-200">
              {renderUserAvatar(user, "w-10 h-10 rounded-xl text-sm border border-slate-100")}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-slate-800 truncate group-hover:text-blue-600 transition-colors">{user.name}</span>
              <span className="text-[10px] font-semibold text-slate-400 truncate">{user.email}</span>
            </div>
          </motion.div>
          <motion.button
            onClick={handleLogout}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="flex items-center justify-center gap-2 py-2.5 border border-slate-200/60 rounded-xl text-xs font-bold text-slate-500 hover:text-red-500 hover:bg-red-50/20 hover:border-red-100 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </motion.button>
        </motion.div>
      </aside>

      {/* ----------------- MOBILE TOP BAR ----------------- */}
      <header className="md:hidden flex items-center justify-between bg-white border-b border-slate-200/40 px-5 py-3 sticky top-0 z-30">
        <button 
          onClick={() => {
            const today = new Date().toISOString().split('T')[0];
            setSelectedDate(today);
            setActiveTab('home');
          }} 
          className="p-2.5 border border-slate-200/50 rounded-xl text-slate-500 hover:bg-slate-50 transition-colors"
          title="Go to Today"
        >
          <Calendar className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          {/* Notification icon */}
          <button className="p-2 border border-slate-200/40 rounded-xl text-slate-400 relative">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
          </button>
          {/* Avatar button */}
          <div 
            onClick={() => setActiveTab('profile')}
            className="cursor-pointer"
          >
            {renderUserAvatar(user, "w-8 h-8 rounded-xl text-xs border border-slate-100")}
          </div>
        </div>
      </header>

      {/* Offline Mode Banner */}
      <AnimatePresence>
        {isOffline && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="w-full bg-blue-50 border-b border-blue-100 px-6 py-2.5 text-center text-xs font-semibold text-blue-700 flex items-center justify-center gap-2 z-20"
          >
            <AlertCircle className="w-4 h-4 text-blue-500 animate-pulse" />
            <span>Running Offline Mode. Progress is stored in local storage fallback.</span>
            <button onClick={fetchHabits} className="ml-2 underline flex items-center gap-1 hover:text-blue-900">
              <RefreshCw className="w-3 h-3 animate-spin-slow" /> Reconnect
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ----------------- MAIN PANEL CONTAINER ----------------- */}
      <main className="flex-1 flex flex-col p-4 md:p-8 lg:p-10 w-full pb-28 md:pb-8 gap-6 md:gap-8">

        {/* 1. GREETING HEADER (Only on routines screen) */}
        {activeTab === 'home' && habits.length > 0 && (
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight leading-none">
                Hi, {user.name.split(' ')[0]} 👋
              </h2>
              <p className="text-slate-400 font-medium text-xs md:text-sm mt-1">
                Let's make habits together!
              </p>
            </div>
            
            {/* Today's completion stats capsule */}
            <div className="bg-white border border-slate-100 flex items-center gap-3.5 px-4.5 py-2.5 rounded-2xl shadow-sm">
              <div className="relative w-9 h-9 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle stroke="#f1f5f9" fill="transparent" strokeWidth="2.5" r="14" cx="18" cy="18" />
                  <circle
                    stroke="#2563eb"
                    fill="transparent"
                    strokeWidth="2.5"
                    strokeDasharray={2 * Math.PI * 14}
                    strokeDashoffset={2 * Math.PI * 14 - (completionPercentage / 100) * 2 * Math.PI * 14}
                    strokeLinecap="round"
                    r="14"
                    cx="18"
                    cy="18"
                  />
                </svg>
                <span className="absolute text-[9px] font-extrabold text-slate-700">{completionPercentage}%</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-800 leading-tight">
                  {completedTodayCount} of {totalHabitsCount} completed
                </span>
                <span className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider mt-0.5">
                  Today's routines progress
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 2. TAB ROUTER SCREENS */}
        <AnimatePresence mode="wait">
          
          {/* TAB: ROUTINES (MAIN DASHBOARD) */}
          {activeTab === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-6"
            >
              {/* IF USER HAS ZERO HABITS: Render fullscreen catalog selection */}
              {habits.length === 0 ? (
                <div className="flex flex-col gap-5 py-4 w-full">
                  <div className="text-center space-y-2 mb-4">
                    <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">
                      Choose Your First Habits
                    </h2>
                    <p className="text-slate-500 font-medium text-sm max-w-md mx-auto">
                      Select one or more of these popular routines to kickstart your tracking, or customize your own!
                    </p>
                  </div>

                  {/* Multi-select Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4.5">
                    {CATALOG_HABITS.map((item, idx) => {
                      const isSelected = selectedCatalogIndexes.includes(idx);
                      return (
                        <motion.div
                          key={idx}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleToggleCatalogSelection(idx)}
                          className={`cursor-pointer rounded-2xl p-4.5 border transition-all flex flex-col justify-between h-32 relative overflow-hidden group ${
                            isSelected 
                              ? 'bg-blue-500 border-blue-500 text-white shadow-lg shadow-blue-100'
                              : 'bg-white border-slate-100 hover:border-slate-200 text-slate-800'
                          }`}
                        >
                          {/* Checked Checkbox Overlay */}
                          <div className="flex justify-between items-start">
                            <span className="text-2xl">{item.emoji}</span>
                            <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                              isSelected 
                                ? 'bg-white border-white text-blue-600'
                                : 'border-slate-200 bg-slate-50 text-transparent'
                            }`}>
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          </div>

                          <div className="flex flex-col mt-auto">
                            <span className={`font-bold text-sm tracking-tight truncate ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                              {item.title}
                            </span>
                            <span className={`text-[10px] font-semibold mt-0.5 ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                              Goal: {item.targetValue} {item.unit}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center items-center">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleBulkActivate}
                      disabled={loading || selectedCatalogIndexes.length === 0}
                      className="w-full sm:w-64 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3 px-6 rounded-2xl transition-all shadow-md shadow-blue-100/50 disabled:opacity-60 flex items-center justify-center gap-2 text-xs uppercase tracking-wider cursor-pointer"
                    >
                      {loading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <span>Activate Selected ({selectedCatalogIndexes.length})</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleTriggerCreate}
                      className="w-full sm:w-64 py-3 px-6 border border-slate-200 bg-white hover:bg-slate-50 transition-all font-bold text-slate-600 rounded-2xl flex items-center justify-center gap-2 text-xs uppercase tracking-wider cursor-pointer"
                    >
                      Create Custom Habit
                    </motion.button>
                  </div>
                </div>
              ) : (
                /* OTHERWISE: Normal routines dashboard content */
                <>
                  {/* Today vs Clubs segmented control tabs */}
                  <div className="flex bg-slate-200/50 p-1.5 rounded-2xl max-w-sm mx-auto md:mx-0">
                    <button
                      onClick={() => setHomeSubTab('today')}
                      className={`flex-1 text-center py-2.5 rounded-xl text-xs font-extrabold tracking-wider uppercase transition-all ${
                        homeSubTab === 'today'
                          ? 'bg-white text-slate-800 shadow-sm'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Today
                    </button>
                    <button
                      onClick={() => setHomeSubTab('clubs')}
                      className={`flex-1 text-center py-2.5 rounded-xl text-xs font-extrabold tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 ${
                        homeSubTab === 'clubs'
                          ? 'bg-white text-slate-800 shadow-sm'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <span>Clubs</span>
                      <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-md font-extrabold">2</span>
                    </button>
                  </div>

                  {homeSubTab === 'today' ? (
                    <>
                      {/* Date Scroller Container */}
                      <div className="-mx-4 md:mx-0 px-4 md:px-0 flex gap-2.5 overflow-x-auto w-full max-w-2xl pb-2 scrollbar-none justify-start md:justify-between">
                        {weekDays.map((day, idx) => {
                          const dateString = day.toISOString().split('T')[0];
                          const dayNum = day.getDate();
                          const dayLabel = day.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
                          const isSelected = selectedDate === dateString;
                          
                          // Check if today is this date to highlight the label
                          const isRealToday = new Date().toISOString().split('T')[0] === dateString;

                          return (
                            <motion.button
                              whileTap={{ scale: 0.95 }}
                              key={idx}
                              onClick={() => setSelectedDate(dateString)}
                              className={`flex-1 min-w-[48px] py-3 rounded-2xl flex flex-col items-center justify-center border transition-all ${
                                isSelected
                                  ? 'bg-white border-blue-600 text-blue-600 shadow-md scale-105 shadow-blue-50'
                                  : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                              }`}
                            >
                              <span className={`text-base font-extrabold ${isSelected ? 'text-blue-600' : 'text-slate-800'}`}>
                                {dayNum}
                              </span>
                              <span className={`text-[9px] font-extrabold mt-1 tracking-wider ${
                                isSelected ? 'text-blue-600' : isRealToday ? 'text-blue-500 font-extrabold' : 'text-slate-400'
                              }`}>
                                {dayLabel}
                              </span>
                            </motion.button>
                          );
                        })}
                      </div>

                      {/* Challenges Section */}
                      <div className="flex flex-col gap-3">
                        <div className="flex justify-between items-center">
                          <h3 className="font-extrabold text-slate-800 text-lg">Challenges</h3>
                        </div>

                        {/* Challenges Cards grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {challenges.filter(c => c.joined).map((challenge) => (
                            <div key={challenge.id} className="bg-white border border-slate-100 p-4 rounded-3xl flex flex-col shadow-sm gap-3 relative overflow-hidden group">
                              <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-blue-50 border border-blue-100 rounded-2xl text-blue-500">
                                  <Clock className="w-5 h-5" />
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="font-extrabold text-sm text-slate-800 truncate">{challenge.title}</span>
                                  <span className="text-[10px] font-bold text-slate-400 mt-0.5">{challenge.timeLeft}</span>
                                </div>
                              </div>
                              <div className="flex items-center justify-between pt-1 text-[11px] font-bold text-slate-400 border-t border-slate-50">
                                <span>{challenge.count} friends joined</span>
                                <div className="flex -space-x-1">
                                  <div className="w-4.5 h-4.5 rounded-full border border-white bg-blue-500 text-white flex items-center justify-center text-[7px] font-black uppercase">M</div>
                                  <div className="w-4.5 h-4.5 rounded-full border border-white bg-rose-500 text-white flex items-center justify-center text-[7px] font-black uppercase">S</div>
                                </div>
                              </div>

                              {/* Progress bar inside challenge card */}
                              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                                <div 
                                  className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-300"
                                  style={{ width: `${challenge.progress}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Habits Section */}
                      <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-center">
                          <h3 className="font-extrabold text-slate-800 text-lg">Habits</h3>
                          <button 
                            onClick={handleTriggerCreate}
                            className="text-[10px] uppercase font-extrabold tracking-wider text-blue-600 hover:underline"
                          >
                            Add Custom
                          </button>
                        </div>

                        {/* Search and Category filters */}
                        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                          {/* Sleek horizontal categories list */}
                          <div className="-mx-4 sm:mx-0 px-4 sm:px-0 flex gap-2 overflow-x-auto w-full sm:w-auto pb-2 scrollbar-none">
                            {['All', 'Health', 'Fitness', 'Mind', 'Work', 'Finance', 'Social'].map((catName) => {
                              const isSelected = selectedCategory === catName;
                              return (
                                <button
                                  key={catName}
                                  onClick={() => setSelectedCategory(catName)}
                                  className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all border shrink-0 ${
                                    isSelected
                                      ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-50 scale-105'
                                      : 'bg-white border-slate-100 text-slate-400 hover:text-slate-800 hover:border-slate-200'
                                  }`}
                                >
                                  {catName}
                                </button>
                              );
                            })}
                          </div>

                          {/* Search bar */}
                          <div className="relative w-full sm:w-56 shrink-0">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                            <input
                              type="text"
                              placeholder="Search habits..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-white border border-slate-200/80 rounded-xl focus:border-blue-500 focus:ring focus:ring-blue-50 outline-none transition-all font-semibold"
                            />
                          </div>
                        </div>

                        {/* Dynamic Habits list Grid */}
                        {loading ? (
                          <div className="flex flex-col items-center justify-center py-16 gap-3">
                            <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
                            <span className="text-xs font-semibold text-slate-400">Loading your habits...</span>
                          </div>
                        ) : filteredHabits.length === 0 ? (
                          <div className="bg-white border border-slate-100 rounded-3xl p-10 text-center flex flex-col items-center justify-center">
                            <CheckCircle2 className="w-10 h-10 text-slate-300 stroke-[1.5] mb-2" />
                            <h4 className="font-bold text-sm text-slate-700">No habits match your filters</h4>
                            <p className="text-xs text-slate-400 max-w-xs mt-1">Try clearing search or filters, or create a custom routine.</p>
                          </div>
                        ) : (
                          <motion.div 
                            layout
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                          >
                            <AnimatePresence mode="popLayout">
                              {filteredHabits.map((habit) => (
                                <HabitCard
                                  key={habit._id}
                                  habit={habit}
                                  dateStr={selectedDate}
                                  onToggle={handleToggleHabit}
                                  onProgressChange={handleProgressChange}
                                  onEdit={handleTriggerEdit}
                                  onDelete={handleDeleteHabit}
                                />
                              ))}
                            </AnimatePresence>
                          </motion.div>
                        )}
                      </div>
                    </>
                  ) : (
                    /* SUB-TAB: CLUBS */
                    <div className="flex flex-col gap-4 animate-fade-in">
                      <div className="flex justify-between items-center">
                        <h3 className="font-extrabold text-slate-800 text-lg">My Clubs</h3>
                        <span className="text-xs text-slate-400 font-bold">2 active clubs</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4.5">
                        {clubs.filter(c => c.joined).map((club) => (
                          <div key={club.id} className="bg-white border border-slate-100 p-5 rounded-3xl flex flex-col shadow-sm gap-3 group relative overflow-hidden">
                            <div className="flex justify-between items-start">
                              <span className="text-sm font-extrabold text-slate-800 group-hover:text-blue-600 transition-colors">
                                {club.name}
                              </span>
                              <span className="text-[10px] font-extrabold bg-emerald-50 border border-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full">
                                Joined
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed min-h-[36px]">
                              {club.description}
                            </p>
                            <div className="flex items-center justify-between border-t border-slate-50 pt-3 text-[11px] font-bold text-slate-400 mt-1">
                              <div className="flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5 text-slate-400" />
                                <span>{club.members} members</span>
                              </div>
                              <button 
                                onClick={() => handleToggleJoinClub(club.id)}
                                className="text-[10px] text-red-500 font-bold hover:underline"
                              >
                                Leave
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}



          {/* TAB: STATS (ANALYTICS SCREEN) */}
          {activeTab === 'stats' && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Analytics habits={habits} />
            </motion.div>
          )}

          {/* TAB: PROFILE (USER PROFILE SCREEN) */}
          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-xl mx-auto w-full flex flex-col gap-6"
            >
              {/* Profile Card */}
              <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col items-center text-center gap-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 -mr-6 -mt-6 bg-blue-500/5 rounded-full blur-xl pointer-events-none" />

                {/* Cycle avatar on tap */}
                <div 
                  onClick={handleCycleAvatar}
                  className="relative w-24 h-24 rounded-3xl border-2 border-slate-200 shadow-md cursor-pointer group flex items-center justify-center select-none overflow-hidden animate-gradient-bg"
                  title="Click to cycle color style"
                >
                  {renderUserAvatar(user, "w-full h-full text-3xl group-hover:scale-105 transition-transform")}
                  <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold transition-opacity">
                    Change Style
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <h3 className="font-extrabold text-xl text-slate-800">{user.name}</h3>
                  <span className="text-xs text-slate-400 font-semibold">{user.email}</span>
                </div>

                {/* Nickname and Birthdate details */}
                <div className="w-full border-t border-slate-50 pt-4 mt-2 grid grid-cols-2 gap-4 text-left">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Nickname</span>
                    <span className="text-sm font-bold text-slate-700">{user.name}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Birthdate</span>
                    <span className="text-sm font-bold text-slate-700">
                      {user.birthday ? new Date(user.birthday).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not set'}
                    </span>
                  </div>
                  {user.birthday && (
                    <div className="col-span-2 flex flex-col gap-0.5">
                      <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Age Profile</span>
                      <span className="text-sm font-bold text-blue-600">{getUserAge()} years young! 🌟</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Statistics details */}
              <div className="grid grid-cols-3 gap-3.5">
                <div className="bg-white border border-slate-100 rounded-2xl p-3.5 text-center flex flex-col shadow-sm gap-1">
                  <span className="text-2xl font-extrabold text-slate-800">{totalHabitsCount}</span>
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Total Habits</span>
                </div>
                <div className="bg-white border border-slate-100 rounded-2xl p-3.5 text-center flex flex-col shadow-sm gap-1">
                  <span className="text-2xl font-extrabold text-orange-500">
                    {habits.length > 0 ? Math.max(...habits.map(h => h.streak || 0)) : 0}d
                  </span>
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Best Streak</span>
                </div>
                <div className="bg-white border border-slate-100 rounded-2xl p-3.5 text-center flex flex-col shadow-sm gap-1">
                  <span className="text-2xl font-extrabold text-blue-600">
                    {habits.reduce((acc, h) => acc + h.logs.length, 0)}
                  </span>
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Total Logs</span>
                </div>
              </div>

              {/* Settings / Sign out */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleLogout}
                  className="w-full py-3.5 bg-red-500/10 border border-red-200/50 hover:bg-red-500 text-red-500 hover:text-white font-bold rounded-2xl transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Sign Out of Account</span>
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* ----------------- MOBILE FLOATING BOTTOM NAV BAR ----------------- */}
      <nav className="md:hidden fixed bottom-6 left-5 right-5 z-40 bg-white/90 backdrop-blur-md border border-slate-200/50 shadow-xl rounded-3xl py-3 px-6 flex items-center justify-around">
        <button
          onClick={() => setActiveTab('home')}
          className={`p-2.5 rounded-xl transition-all flex flex-col items-center justify-center ${
            activeTab === 'home' ? 'text-blue-600 scale-110' : 'text-slate-400'
          }`}
          title="Routines"
        >
          <ListTodo className={`w-6 h-6 ${activeTab === 'home' ? 'stroke-[2.5]' : 'stroke-[2]'}`} />
        </button>

        <button
          onClick={() => setActiveTab('stats')}
          className={`p-2.5 rounded-xl transition-all flex flex-col items-center justify-center ${
            activeTab === 'stats' ? 'text-blue-600 scale-110' : 'text-slate-400'
          }`}
          title="Analytics"
        >
          <BarChart3 className={`w-6 h-6 ${activeTab === 'stats' ? 'stroke-[2.5]' : 'stroke-[2]'}`} />
        </button>

        {/* Floating Plus button in center of Mobile Navigation */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleTriggerCreate}
          className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-200 shrink-0"
          title="Create Habit"
        >
          <Plus className="w-6 h-6 stroke-[3]" />
        </motion.button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`p-2.5 rounded-xl transition-all flex flex-col items-center justify-center ${
            activeTab === 'profile' ? 'text-blue-600 scale-110' : 'text-slate-400'
          }`}
          title="Profile"
        >
          <UserIcon className={`w-6 h-6 ${activeTab === 'profile' ? 'stroke-[2.5]' : 'stroke-[2]'}`} />
        </button>
      </nav>

      {/* Add Habit Modal Dialog */}
      <AddHabitModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveHabit}
        editingHabit={editingHabit}
      />
    </div>
  );
}
