import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Calendar, ArrowRight, ArrowLeft, RefreshCw, Sparkles, Heart, Check } from 'lucide-react';
import Logo from './Logo';
import axios from 'axios';

// Preset habits the user can pick from during onboarding
const PRESET_HABITS = [
  { title: 'Drink Water',       emoji: '💧', category: 'Health',  description: 'Stay hydrated throughout the day' },
  { title: 'Morning Walk',      emoji: '🚶', category: 'Fitness', description: '30 minutes of walking every morning' },
  { title: 'Read Books',        emoji: '📖', category: 'Mind',    description: 'Read at least 15 pages daily' },
  { title: 'Meditate',          emoji: '🧘', category: 'Mind',    description: '10 minutes of mindfulness meditation' },
  { title: 'Exercise',          emoji: '💪', category: 'Fitness', description: 'Workout or gym session' },
  { title: 'Healthy Eating',    emoji: '🥗', category: 'Health',  description: 'Eat clean and balanced meals' },
  { title: 'Journal Writing',   emoji: '📝', category: 'Mind',    description: 'Write your thoughts and reflections' },
  { title: 'Sleep Early',       emoji: '😴', category: 'Health',  description: 'Be in bed before 11 PM' },
  { title: 'No Social Media',   emoji: '📵', category: 'Mind',    description: 'Limit scrolling to under 30 minutes' },
  { title: 'Learn Something',   emoji: '🎓', category: 'Work',    description: 'Spend 30 mins learning a new skill' },
  { title: 'Practice Coding',   emoji: '💻', category: 'Work',    description: 'Solve problems or build projects' },
  { title: 'Save Money',        emoji: '💰', category: 'Finance', description: 'Track spending and save daily' },
  { title: 'Stretch',           emoji: '🤸', category: 'Fitness', description: '10 minutes of stretching exercises' },
  { title: 'Drink Green Tea',   emoji: '🍵', category: 'Health',  description: 'Replace coffee with green tea' },
  { title: 'Call Family',       emoji: '📞', category: 'Social',  description: 'Stay connected with loved ones' },
  { title: 'Skincare Routine',  emoji: '✨', category: 'Health',  description: 'Morning & night skincare steps' },
];

export default function Onboarding({ user, onComplete }) {
  const [step, setStep] = useState(1); // 1 = profile, 2 = choose habits
  const [nickname, setNickname] = useState(user?.name || '');
  const [birthday, setBirthday] = useState('');
  const [selectedHabits, setSelectedHabits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Toggle habit selection
  const toggleHabit = (index) => {
    setSelectedHabits(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  // Step 1 → Step 2
  const handleGoToStep2 = () => {
    if (!nickname.trim()) {
      setError('Please enter your preferred name');
      return;
    }
    setError('');
    setStep(2);
  };

  // Final submit: save profile + create selected habits
  const handleFinalSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      // 1. Save profile
      const profileRes = await axios.put('http://localhost:5050/api/auth/complete-profile', {
        email: user.email,
        name: nickname.trim(),
        birthday: birthday || ''
      });

      const updatedUser = profileRes.data;
      localStorage.setItem('planora_user', JSON.stringify(updatedUser));

      // 2. Create selected habits
      const userId = updatedUser._id;
      for (const idx of selectedHabits) {
        const habit = PRESET_HABITS[idx];
        try {
          await axios.post('http://localhost:5050/api/habits', {
            title: habit.title,
            description: habit.description,
            category: habit.category,
            frequency: 'daily',
          }, {
            headers: { 'x-user-id': userId }
          });
        } catch (habitErr) {
          console.warn('Failed to create habit:', habit.title, habitErr.message);
        }
      }

      onComplete(updatedUser);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Age preview
  const getAgePreview = () => {
    if (!birthday) return null;
    const today = new Date();
    const birth = new Date(birthday);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age > 0 ? age : null;
  };
  const agePreview = getAgePreview();

  // Left panel content changes per step
  const leftPanelContent = {
    1: {
      badges: [
        { emoji: '🎉', text: 'Welcome aboard!' },
        { emoji: '🚀', text: "Let's go!" },
      ],
      title: <>Almost There!<br /><span className="text-blue-200">Tell Us About You</span></>,
      description: "We'd love to know what to call you! Set up your profile and we'll personalize your entire habit-building experience.",
      features: [
        { icon: '✨', text: 'Personalized greetings every day' },
        { icon: '🎂', text: 'Birthday reminders & celebrations' },
        { icon: '📊', text: 'Custom progress tracking just for you' },
      ],
    },
    2: {
      badges: [
        { emoji: '🏆', text: 'Choose wisely!' },
        { emoji: '⚡', text: 'Start strong!' },
      ],
      title: <>Pick Your<br /><span className="text-blue-200">First Habits</span></>,
      description: "Select the habits you want to start with. Don't worry, you can always add more later from the dashboard!",
      features: [
        { icon: '🔥', text: 'Build daily streaks from day one' },
        { icon: '📈', text: 'Track your progress visually' },
        { icon: '🎯', text: 'Stay consistent and level up' },
      ],
    },
  };

  const panel = leftPanelContent[step];

  return (
    <div className="min-h-screen w-full flex bg-slate-50 overflow-hidden font-sans">

      {/* LEFT COLUMN */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 text-white flex-col justify-between p-16 xl:p-24 overflow-hidden select-none">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 -left-20 w-[400px] h-[400px] rounded-full bg-white/5 blur-3xl" />
          <div className="absolute bottom-1/4 -right-20 w-[300px] h-[300px] rounded-full bg-blue-400/10 blur-3xl" />
          <div className="absolute top-10 right-10 w-[200px] h-[200px] rounded-full border border-white/5" />
          <div className="absolute bottom-20 left-10 w-[350px] h-[350px] rounded-full border border-white/5" />
        </div>

        <div className="relative z-10 flex items-center gap-2">
          <Logo className="w-11 h-11" showText={true} textClass="text-2xl tracking-wide font-black text-white" />
        </div>

        <AnimatePresence mode="wait">
          <motion.div 
            key={`left-panel-${step}`}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
            className="relative z-10 my-auto space-y-8"
          >
            <div className="flex gap-3 mb-6">
              {panel.badges.map((b, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.15 }}
                  className="bg-white/10 backdrop-blur-xl border border-white/20 text-white text-sm font-bold py-3 px-5 rounded-2xl shadow-xl flex items-center gap-2"
                >
                  <span className="text-lg">{b.emoji}</span>
                  <span>{b.text}</span>
                </motion.div>
              ))}
            </div>

            <h1 className="text-4xl xl:text-5xl font-extrabold tracking-tight leading-tight">
              {panel.title}
            </h1>

            <p className="text-blue-100/70 text-sm xl:text-base max-w-sm font-medium leading-relaxed">
              {panel.description}
            </p>

            <div className="space-y-3 pt-4">
              {panel.features.map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-blue-100/80 font-medium">
                  <span className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-base">{item.icon}</span>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Bottom step indicators */}
        <div className="relative z-10 flex gap-2">
          <div className={`h-2.5 rounded-full transition-all duration-300 ${step === 1 ? 'w-8 bg-white' : 'w-2.5 bg-white/30'}`} />
          <div className={`h-2.5 rounded-full transition-all duration-300 ${step === 2 ? 'w-8 bg-white' : 'w-2.5 bg-white/30'}`} />
        </div>
      </div>

      {/* RIGHT COLUMN */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 md:p-16 xl:p-24 relative bg-white bg-glow overflow-y-auto">
        
        <div className="absolute top-6 left-6 lg:hidden flex items-center gap-2 z-10">
          <Logo className="w-8 h-8" showText={true} textClass="text-lg text-slate-800 font-extrabold" />
        </div>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            /* =================== STEP 1: Name + Birthday =================== */
            <motion.div 
              key="step-1"
              className="w-full max-w-md p-8 sm:p-10 bg-white/75 backdrop-blur-xl border border-slate-100 rounded-[32px] shadow-[0_25px_60px_-15px_rgba(37,99,235,0.06)] space-y-7 z-10 mt-10 lg:mt-0"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4 }}
            >
              <div className="space-y-2">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                    <Sparkles className="w-6 h-6" />
                  </div>
                </div>
                <h2 className="text-3xl xl:text-4xl font-extrabold text-slate-900 tracking-tight">
                  Set Up Your Profile
                </h2>
                <p className="text-slate-400 font-medium text-sm xl:text-base">
                  What should we call you? This is how you'll appear in Planora.
                </p>
              </div>

              {error && (
                <div className="text-xs font-semibold text-red-500 bg-red-50 border border-red-100 px-4 py-3.5 rounded-2xl">
                  {error}
                </div>
              )}

              <div className="space-y-5">
                {/* Nickname */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Your Preferred Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-4.5 h-4.5" />
                    <input
                      type="text"
                      placeholder="e.g. Ajay, Alex, Sam..."
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-50/50 border border-slate-200/85 rounded-2xl focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all duration-200 font-medium text-slate-800 text-sm xl:text-base shadow-sm"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Birthday */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    Birthday
                    <span className="text-slate-300 normal-case tracking-normal font-medium">(optional)</span>
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-4.5 h-4.5" />
                    <input
                      type="date"
                      value={birthday}
                      onChange={(e) => setBirthday(e.target.value)}
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-50/50 border border-slate-200/85 rounded-2xl focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all duration-200 font-medium text-slate-800 text-sm xl:text-base shadow-sm"
                    />
                  </div>
                  {agePreview !== null && (
                    <motion.p 
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs font-semibold text-blue-500 pl-1 flex items-center gap-1"
                    >
                      <Heart className="w-3 h-3" />
                      {agePreview} years young!
                    </motion.p>
                  )}
                </div>

                {/* Preview Card */}
                {nickname.trim() && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100/60 rounded-2xl p-4 flex items-center gap-4"
                  >
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-md">
                      {nickname.trim().charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-extrabold text-slate-800">
                        Good Morning, {nickname.trim().split(' ')[0]}! 👋
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Preview of your dashboard greeting
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Next Button */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="button"
                  onClick={handleGoToStep2}
                  disabled={!nickname.trim()}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-200/50 flex items-center justify-center gap-2 cursor-pointer text-sm xl:text-base mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>Next: Choose Habits</span>
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </div>

              <p className="text-[10px] text-center font-medium text-slate-400 max-w-xs mx-auto">
                Step 1 of 2 · You can update these later in settings.
              </p>
            </motion.div>
          ) : (
            /* =================== STEP 2: Choose Your First Habits =================== */
            <motion.div 
              key="step-2"
              className="w-full max-w-lg p-8 sm:p-10 bg-white/75 backdrop-blur-xl border border-slate-100 rounded-[32px] shadow-[0_25px_60px_-15px_rgba(37,99,235,0.06)] space-y-6 z-10 mt-10 lg:mt-0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.4 }}
            >
              <div className="space-y-2">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-orange-200">
                    <span className="text-2xl">🎯</span>
                  </div>
                </div>
                <h2 className="text-2xl xl:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Choose Your First Habits
                </h2>
                <p className="text-slate-400 font-medium text-sm">
                  Pick the ones you want to build. You can always add more from the dashboard.
                </p>
              </div>

              {error && (
                <div className="text-xs font-semibold text-red-500 bg-red-50 border border-red-100 px-4 py-3 rounded-2xl">
                  {error}
                </div>
              )}

              {/* Habits Grid */}
              <div className="grid grid-cols-2 gap-3 max-h-[340px] overflow-y-auto pr-1 scrollbar-none">
                {PRESET_HABITS.map((habit, idx) => {
                  const isSelected = selectedHabits.includes(idx);
                  return (
                    <motion.button
                      key={idx}
                      type="button"
                      onClick={() => toggleHabit(idx)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`relative flex flex-col items-start gap-2 p-4 rounded-2xl border-2 transition-all duration-200 text-left cursor-pointer ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50/60 shadow-md shadow-blue-100/50'
                          : 'border-slate-100 bg-slate-50/30 hover:border-slate-200 hover:bg-white'
                      }`}
                    >
                      {/* Checkmark badge */}
                      {isSelected && (
                        <motion.div 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-2.5 right-2.5 w-5.5 h-5.5 rounded-full bg-blue-600 flex items-center justify-center"
                        >
                          <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                        </motion.div>
                      )}

                      <div className="flex items-center gap-2.5">
                        <span className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-xl shadow-sm">
                          {habit.emoji}
                        </span>
                      </div>
                      <div>
                        <p className={`text-sm font-bold ${isSelected ? 'text-blue-700' : 'text-slate-800'}`}>
                          {habit.title}
                        </p>
                        <p className="text-[10px] font-medium text-slate-400 leading-tight mt-0.5">
                          {habit.description}
                        </p>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Selected count */}
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-400">
                  {selectedHabits.length === 0 
                    ? 'No habits selected yet' 
                    : `${selectedHabits.length} habit${selectedHabits.length > 1 ? 's' : ''} selected`}
                </p>
                <div className="flex gap-1.5">
                  {PRESET_HABITS.slice(0, 6).map((_, i) => (
                    <div key={i} className={`w-1.5 h-1.5 rounded-full ${selectedHabits.includes(i) ? 'bg-blue-500' : 'bg-slate-200'}`} />
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setStep(1); setError(''); }}
                  className="flex items-center gap-1.5 px-5 py-3.5 border border-slate-200 rounded-2xl text-slate-500 font-semibold hover:bg-slate-50 transition-colors text-sm cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={loading}
                  className="flex-1 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-200/50 flex items-center justify-center gap-2 cursor-pointer text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <RefreshCw className="w-4.5 h-4.5 animate-spin" />
                  ) : (
                    <>
                      <span>{selectedHabits.length > 0 ? `Start with ${selectedHabits.length} Habit${selectedHabits.length > 1 ? 's' : ''}` : 'Skip & Start'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </motion.button>
              </div>

              <p className="text-[10px] text-center font-medium text-slate-400 max-w-xs mx-auto">
                Step 2 of 2 · You can skip this and add habits later.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
