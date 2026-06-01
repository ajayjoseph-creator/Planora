import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Heart, Flame, Brain, Briefcase, DollarSign, Users, Grid } from 'lucide-react';

const CATEGORIES = [
  { name: 'General', icon: Grid, color: 'bg-slate-100 text-slate-600 border-slate-200' },
  { name: 'Health', icon: Heart, color: 'bg-red-50 text-red-500 border-red-100' },
  { name: 'Fitness', icon: Flame, color: 'bg-orange-50 text-orange-500 border-orange-100' },
  { name: 'Mind', icon: Brain, color: 'bg-purple-50 text-purple-500 border-purple-100' },
  { name: 'Work', icon: Briefcase, color: 'bg-blue-50 text-blue-500 border-blue-100' },
  { name: 'Finance', icon: DollarSign, color: 'bg-green-50 text-green-500 border-green-100' },
  { name: 'Social', icon: Users, color: 'bg-pink-50 text-pink-500 border-pink-100' },
];

export default function AddHabitModal({ isOpen, onClose, onSave, editingHabit = null }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('General');
  const [frequency, setFrequency] = useState('daily');
  const [targetValue, setTargetValue] = useState(1);
  const [unit, setUnit] = useState('times');
  const [error, setError] = useState('');

  // Populate data if we are editing an existing habit
  useEffect(() => {
    if (editingHabit) {
      setTitle(editingHabit.title || '');
      setDescription(editingHabit.description || '');
      setCategory(editingHabit.category || 'General');
      setFrequency(editingHabit.frequency || 'daily');
      setTargetValue(editingHabit.targetValue || 1);
      setUnit(editingHabit.unit || 'times');
    } else {
      setTitle('');
      setDescription('');
      setCategory('General');
      setFrequency('daily');
      setTargetValue(1);
      setUnit('times');
    }
    setError('');
  }, [editingHabit, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Habit title is required');
      return;
    }
    onSave({
      title: title.trim(),
      description: description.trim(),
      category,
      frequency,
      targetValue: Number(targetValue) || 1,
      unit: unit.trim() || 'times',
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop Blur */}
          <motion.div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal Container */}
          <motion.div
            className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100/80 z-10"
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: "spring", duration: 0.5 }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4.5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 animate-pulse text-blue-200" />
                <div className="flex flex-col">
                  <h3 className="font-extrabold text-lg leading-tight">
                    {editingHabit ? 'Modify Habit' : 'Create New Habit'}
                  </h3>
                  <span className="text-[10px] text-blue-100/90 font-medium">Design your daily routine</span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-white/10 rounded-xl transition-all text-white/95"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="text-xs font-semibold text-red-500 bg-red-50 border border-red-100 px-3 py-2 rounded-xl">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  {/* Title Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      What is your habit's name?
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Morning Meditation, Read Books"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-2xl bg-slate-50/80 border border-slate-100 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none text-slate-800 font-semibold text-sm placeholder-slate-400"
                    />
                  </div>

                  {/* Description Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Description / Motivation (Optional)
                    </label>
                    <textarea
                      placeholder="e.g. 15 mins daily, improve focus"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows="3"
                      className="w-full px-4 py-2.5 rounded-2xl bg-slate-50/80 border border-slate-100 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none text-slate-800 font-semibold text-sm placeholder-slate-400 resize-none"
                    />
                  </div>

                  {/* Frequency Selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Frequency
                    </label>
                    <div className="flex gap-2">
                      {['daily', 'weekly'].map((freq) => (
                        <button
                          type="button"
                          key={freq}
                          onClick={() => setFrequency(freq)}
                          className={`flex-1 py-2 rounded-2xl border text-xs font-bold capitalize transition-all ${
                            frequency === freq
                              ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-100'
                              : 'bg-white border-slate-200/60 text-slate-500 hover:text-slate-800 hover:bg-slate-50/50'
                          }`}
                        >
                          {freq}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  {/* Category selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Choose Category
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {CATEGORIES.map((cat) => {
                        const IconComp = cat.icon;
                        const isSelected = category === cat.name;

                        // Parse signature background colors for selected states
                        let activeStyle = "border-slate-100 hover:border-slate-200 bg-white";
                        if (isSelected) {
                          if (cat.name === 'Health') activeStyle = "border-red-400 bg-red-50/40 text-red-500 scale-[1.03]";
                          else if (cat.name === 'Fitness') activeStyle = "border-orange-400 bg-orange-50/40 text-orange-600 scale-[1.03]";
                          else if (cat.name === 'Mind') activeStyle = "border-purple-400 bg-purple-50/40 text-purple-600 scale-[1.03]";
                          else if (cat.name === 'Work') activeStyle = "border-blue-400 bg-blue-50/40 text-blue-600 scale-[1.03]";
                          else if (cat.name === 'Finance') activeStyle = "border-green-400 bg-green-50/40 text-green-600 scale-[1.03]";
                          else if (cat.name === 'Social') activeStyle = "border-pink-400 bg-pink-50/40 text-pink-600 scale-[1.03]";
                          else activeStyle = "border-slate-400 bg-slate-100 text-slate-700 scale-[1.03]";
                        }

                        return (
                          <button
                            type="button"
                            key={cat.name}
                            onClick={() => setCategory(cat.name)}
                            className={`flex items-center gap-1.5 p-1.5 rounded-xl border transition-all justify-start shadow-sm hover:shadow ${activeStyle}`}
                          >
                            <div className={`p-1 rounded-lg ${cat.color} shrink-0 ${isSelected ? 'shadow-sm' : ''}`}>
                              <IconComp className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-[10px] font-extrabold tracking-tight truncate">{cat.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Daily Target Goal & Unit */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Daily Goal Target
                      </label>
                      <input
                        type="number"
                        min="1"
                        placeholder="e.g. 2000"
                        value={targetValue}
                        onChange={(e) => setTargetValue(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full px-4 py-2 rounded-2xl bg-slate-50/80 border border-slate-100 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none text-slate-800 font-semibold text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Unit
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. ml"
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                        className="w-full px-4 py-2 rounded-2xl bg-slate-50/80 border border-slate-100 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none text-slate-800 font-semibold text-sm"
                      />
                    </div>
                  </div>

                  {/* Quick Unit Presets */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quick Presets:</span>
                    <div className="flex flex-wrap gap-1.5 animate-fade-in">
                      {[
                        { label: 'Water (ml)', target: 2000, unit: 'ml' },
                        { label: 'Walk (steps)', target: 10000, unit: 'steps' },
                        { label: 'Mind (mins)', target: 15, unit: 'mins' },
                        { label: 'Read (pages)', target: 20, unit: 'pages' },
                        { label: 'Simple count', target: 1, unit: 'times' }
                      ].map((preset, idx) => (
                        <button
                          type="button"
                          key={idx}
                          onClick={() => {
                            setTargetValue(preset.target);
                            setUnit(preset.unit);
                          }}
                          className="px-2.5 py-1 text-[9px] font-extrabold bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-xl text-slate-500 transition-colors"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-3 border-t border-slate-100 justify-end mt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 border border-slate-200 rounded-2xl text-slate-600 font-bold hover:bg-slate-50 transition-colors text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-8 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-100 text-xs"
                >
                  {editingHabit ? 'Save Changes' : 'Add Habit'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
export { CATEGORIES };
