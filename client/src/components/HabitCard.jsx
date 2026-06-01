import React from 'react';
import { motion } from 'framer-motion';
import { Check, Plus, Flame, Award, Edit2, Trash2 } from 'lucide-react';

const CATEGORIES_COLOR = {
  Health: { border: 'border-red-100', text: 'text-red-500', fill: 'stroke-red-500', bg: 'bg-red-50', glow: 'bg-red-500/5' },
  Fitness: { border: 'border-orange-100', text: 'text-orange-500', fill: 'stroke-orange-500', bg: 'bg-orange-50', glow: 'bg-orange-500/5' },
  Mind: { border: 'border-purple-100', text: 'text-purple-500', fill: 'stroke-purple-500', bg: 'bg-purple-50', glow: 'bg-purple-500/5' },
  Work: { border: 'border-blue-100', text: 'text-blue-500', fill: 'stroke-blue-500', bg: 'bg-blue-50', glow: 'bg-blue-500/5' },
  Finance: { border: 'border-green-100', text: 'text-green-500', fill: 'stroke-green-500', bg: 'bg-green-50', glow: 'bg-green-500/5' },
  Social: { border: 'border-pink-100', text: 'text-pink-500', fill: 'stroke-pink-500', bg: 'bg-pink-50', glow: 'bg-pink-500/5' },
  General: { border: 'border-slate-200/60', text: 'text-slate-500', fill: 'stroke-slate-500', bg: 'bg-slate-50', glow: 'bg-slate-500/5' },
};

// Map keywords in titles to dynamic emojis for rich visual appearance
const getHabitEmoji = (title, category) => {
  const t = title.toLowerCase();
  if (t.includes('water') || t.includes('drink') || t.includes('hydration')) return '💧';
  if (t.includes('walk') || t.includes('run') || t.includes('jog') || t.includes('step')) return '🚶';
  if (t.includes('read') || t.includes('book') || t.includes('study')) return '📖';
  if (t.includes('meditat') || t.includes('mindful') || t.includes('yoga') || t.includes('breath')) return '🧘';
  if (t.includes('exercise') || t.includes('gym') || t.includes('workout') || t.includes('stretch') || t.includes('pushup')) return '💪';
  if (t.includes('eat') || t.includes('food') || t.includes('meal') || t.includes('diet') || t.includes('salad')) return '🥗';
  if (t.includes('journal') || t.includes('write') || t.includes('diary')) return '📝';
  if (t.includes('sleep') || t.includes('bed') || t.includes('early')) return '😴';
  if (t.includes('code') || t.includes('program') || t.includes('dev')) return '💻';
  if (t.includes('save') || t.includes('money') || t.includes('spend') || t.includes('budget')) return '💰';
  if (t.includes('call') || t.includes('family') || t.includes('friend') || t.includes('talk')) return '📞';
  if (t.includes('skin') || t.includes('face') || t.includes('care') || t.includes('brush')) return '✨';
  
  // Category fallback emojis
  switch(category) {
    case 'Health': return '❤️';
    case 'Fitness': return '⚡';
    case 'Mind': return '🧠';
    case 'Work': return '💼';
    case 'Finance': return '💵';
    case 'Social': return '🤝';
    default: return '✨';
  }
};

const getIncrementStep = (unit) => {
  const u = unit.toLowerCase();
  if (u === 'ml') return 250;
  if (u === 'steps') return 1000;
  if (u === 'mins' || u === 'min') return 5;
  if (u === 'pages' || u === 'page') return 5;
  return 1;
};

export default function HabitCard({ habit, onToggle, onProgressChange, onEdit, onDelete, dateStr }) {
  const colorScheme = CATEGORIES_COLOR[habit.category] || CATEGORIES_COLOR.General;
  const emoji = getHabitEmoji(habit.title, habit.category);

  // Extract current progress value for the selected date
  const progressValue = habit.progress && habit.progress[dateStr] !== undefined
    ? Number(habit.progress[dateStr])
    : (habit.logs.includes(dateStr) ? habit.targetValue : 0);

  const isCompleted = progressValue >= habit.targetValue;
  const progressPercent = Math.min(100, Math.round((progressValue / habit.targetValue) * 100));

  // Circular progress dimensions
  const radius = 22;
  const strokeWidth = 3;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  const handleIncrement = (e) => {
    e.stopPropagation();
    if (isCompleted) {
      // Toggle completed -> resets to 0
      onProgressChange(habit._id, dateStr, 0);
    } else {
      const step = getIncrementStep(habit.unit);
      const nextVal = progressValue + step;
      if (nextVal >= habit.targetValue) {
        onProgressChange(habit._id, dateStr, habit.targetValue);
      } else {
        onProgressChange(habit._id, dateStr, nextVal);
      }
    }
  };

  const handleInstaToggle = (e) => {
    e.stopPropagation();
    if (isCompleted) {
      onProgressChange(habit._id, dateStr, 0);
    } else {
      onProgressChange(habit._id, dateStr, habit.targetValue);
    }
  };

  // Mock list of friends who are also completing this habit (matching mockup)
  const mockFriends = [
    { name: 'Mert', avatar: '/avatar_man.png' },
    { name: 'Sarah', avatar: '/avatar_woman_1.png' },
    { name: 'Chloe', avatar: '/avatar_woman_2.png' }
  ].slice(0, 1 + (habit.title.charCodeAt(0) % 3)); // dynamically select 1-3 friends based on title hash

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25 }}
      className="bg-white border border-slate-100 hover:shadow-lg hover:border-slate-200/80 transition-all duration-300 rounded-3xl p-4.5 relative overflow-hidden group flex items-center justify-between gap-4"
    >
      {/* Background Subtle Glow */}
      <div className={`absolute top-0 right-0 w-24 h-24 -mr-6 -mt-6 ${colorScheme.glow} rounded-full blur-xl pointer-events-none group-hover:scale-110 transition-transform duration-300`} />

      {/* Left side: Circular Progress Circle and Emoji */}
      <div className="flex items-center gap-4.5">
        <div 
          onClick={handleInstaToggle}
          className="relative w-14 h-14 flex items-center justify-center cursor-pointer select-none group/circle"
          title="Click to toggle complete"
        >
          {/* Circular SVG Track */}
          <svg className="w-full h-full transform -rotate-90">
            <circle 
              stroke="#f1f5f9" 
              fill="transparent" 
              strokeWidth={strokeWidth} 
              r={radius} 
              cx="28" 
              cy="28" 
            />
            <motion.circle
              stroke={isCompleted ? '#10b981' : '#3b82f6'} 
              fill="transparent" 
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              animate={{ strokeDashoffset }}
              transition={{ type: 'spring', stiffness: 60, damping: 15 }}
              strokeLinecap="round"
              r={radius}
              cx="28"
              cy="28"
            />
          </svg>
          {/* Emoji in the center */}
          <span className="absolute text-xl group-hover/circle:scale-110 transition-transform duration-200">
            {emoji}
          </span>
        </div>

        {/* Middle section: Info, progress text, and social avatars */}
        <div className="flex flex-col">
          <h4 
            onClick={() => onEdit(habit)}
            className="font-bold text-slate-800 text-base leading-tight hover:text-blue-600 transition-colors cursor-pointer"
          >
            {habit.title}
          </h4>
          <span className="text-[11px] font-semibold text-slate-400 uppercase mt-0.5 tracking-wider">
            {progressValue}/{habit.targetValue} {habit.unit}
          </span>

          {/* Bottom row of info: Streaks and Friends */}
          <div className="flex items-center gap-3 mt-2">
            {/* Streaks */}
            <span className="flex items-center gap-0.5 text-[10px] font-bold text-orange-500 bg-orange-50/60 border border-orange-100/30 px-2 py-0.5 rounded-full">
              <Flame className="w-3 h-3 fill-current" />
              {habit.streak || 0}d
            </span>

            {/* Overlapping Friend Avatars */}
            <div className="flex -space-x-1.5 overflow-hidden">
              {mockFriends.map((friend, i) => {
                const initial = friend.name.charAt(0);
                const colors = [
                  'bg-blue-500 text-white',
                  'bg-rose-500 text-white',
                  'bg-emerald-500 text-white',
                  'bg-purple-500 text-white',
                  'bg-amber-500 text-white'
                ];
                const color = colors[friend.name.charCodeAt(0) % colors.length];
                return (
                  <div 
                    key={i} 
                    className={`w-5 h-5 rounded-full border border-white flex items-center justify-center text-[8px] font-extrabold shadow-sm uppercase ${color}`}
                    title={`${friend.name} is tracking this`}
                  >
                    {initial}
                  </div>
                );
              })}
              {habit.title.length % 2 === 0 && (
                <div className="w-5 h-5 rounded-full border border-white bg-slate-50 flex items-center justify-center text-[8px] font-bold text-slate-400">
                  +3
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right side: Increment / Check Button */}
      <div className="flex items-center gap-3">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleIncrement}
          className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${
            isCompleted
              ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-100'
              : 'border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-blue-50/30 hover:text-blue-500'
          }`}
          title={isCompleted ? 'Reset progress' : `Add +${getIncrementStep(habit.unit)} ${habit.unit}`}
        >
          {isCompleted ? (
            <Check className="w-5 h-5 stroke-[3]" />
          ) : (
            <Plus className="w-5 h-5 stroke-[2.5]" />
          )}
        </motion.button>
      </div>

      {/* Edit and Delete Actions on Hover */}
      <div className="absolute top-2 right-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(habit); }}
          className="p-1 bg-white border border-slate-100 shadow-sm rounded-lg text-slate-400 hover:text-blue-500 transition-all hover:bg-slate-50"
          title="Edit Details"
        >
          <Edit2 className="w-3 h-3" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(habit._id); }}
          className="p-1 bg-white border border-slate-100 shadow-sm rounded-lg text-slate-400 hover:text-red-500 transition-all hover:bg-slate-50"
          title="Delete"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </motion.div>
  );
}
