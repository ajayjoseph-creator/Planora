import React from 'react';
import { Award, Flame, Calendar, CheckCircle } from 'lucide-react';

export default function Analytics({ habits }) {
  // 1. Calculate general stats
  const totalHabits = habits.length;
  
  // Calculate average completion rate
  // Let's look at logs for the last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  });

  let totalLogsLast7Days = 0;
  let possibleLogsLast7Days = totalHabits * 7;

  habits.forEach(h => {
    h.logs.forEach(logDate => {
      if (last7Days.includes(logDate)) {
        totalLogsLast7Days++;
      }
    });
  });

  const completionRate = possibleLogsLast7Days > 0 
    ? Math.round((totalLogsLast7Days / possibleLogsLast7Days) * 100) 
    : 0;

  // Best streak
  const bestStreak = habits.reduce((max, h) => Math.max(max, h.longestStreak || 0), 0);
  // Current active streak
  const currentStreak = habits.reduce((max, h) => Math.max(max, h.streak || 0), 0);

  // 2. Category completion stats
  const categoryStats = {};
  habits.forEach(h => {
    const cat = h.category || 'General';
    if (!categoryStats[cat]) {
      categoryStats[cat] = { count: 0, completed: 0 };
    }
    categoryStats[cat].count++;
    // count how many total logs this habit has
    categoryStats[cat].completed += h.logs.length;
  });

  const categories = Object.keys(categoryStats).map(cat => {
    const totalPossible = categoryStats[cat].count * 30; // assume 30 days window
    const rate = totalPossible > 0 ? Math.round((categoryStats[cat].completed / totalPossible) * 100) : 0;
    return {
      name: cat,
      count: categoryStats[cat].count,
      rate: Math.min(rate, 100) // cap at 100
    };
  }).sort((a, b) => b.rate - a.rate);

  // 3. Weekly trend data (how many habits completed each day)
  const weeklyData = last7Days.map(dateStr => {
    const dayLabel = new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' });
    const count = habits.filter(h => h.logs.includes(dateStr)).length;
    return { dayLabel, count, dateStr };
  }).reverse();

  // Find max completions in a single day for scale
  const maxDayCompletions = Math.max(...weeklyData.map(d => d.count), 1);

  // SVG Circular Ring config
  const radius = 50;
  const strokeWidth = 8;
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (completionRate / 100) * circumference;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Stat Cards */}
        <div className="flex-1 grid grid-cols-2 gap-4">
          <div className="glass-card rounded-2xl p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-slate-500">Total Habits</span>
              <div className="p-2 bg-blue-100/60 rounded-xl text-blue-600">
                <CheckCircle className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-slate-900">{totalHabits}</div>
              <p className="text-xs text-slate-400 mt-1">Active routines</p>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-slate-500">Current Streak</span>
              <div className="p-2 bg-orange-100/60 rounded-xl text-orange-500">
                <Flame className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-slate-900">{currentStreak} <span className="text-sm font-normal text-slate-400">days</span></div>
              <p className="text-xs text-slate-400 mt-1">Keep it burning!</p>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-slate-500">Best Streak</span>
              <div className="p-2 bg-yellow-100/60 rounded-xl text-yellow-500">
                <Award className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-slate-900">{bestStreak} <span className="text-sm font-normal text-slate-400">days</span></div>
              <p className="text-xs text-slate-400 mt-1">All-time record</p>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-slate-500">Completed Logs</span>
              <div className="p-2 bg-green-100/60 rounded-xl text-green-500">
                <Calendar className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-slate-900">
                {habits.reduce((acc, h) => acc + h.logs.length, 0)}
              </div>
              <p className="text-xs text-slate-400 mt-1">Total check-ins</p>
            </div>
          </div>
        </div>

        {/* Circular Progress Ring */}
        <div className="glass-card rounded-2xl p-6 flex flex-col items-center justify-center md:w-[260px]">
          <h3 className="text-sm font-semibold text-slate-500 mb-4 self-start">Weekly Completion</h3>
          <div className="relative flex items-center justify-center w-36 h-36">
            <svg className="w-full h-full transform -rotate-90">
              {/* Background ring */}
              <circle
                stroke="#e2e8f0"
                fill="transparent"
                strokeWidth={strokeWidth}
                r={normalizedRadius}
                cx={72}
                cy={72}
              />
              {/* Animated progress ring */}
              <circle
                stroke="#3b82f6"
                fill="transparent"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference + ' ' + circumference}
                style={{ strokeDashoffset }}
                strokeLinecap="round"
                r={normalizedRadius}
                cx={72}
                cy={72}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-3xl font-extrabold text-slate-800">{completionRate}%</span>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mt-0.5">Rate</span>
            </div>
          </div>
          <p className="text-xs text-slate-400 text-center mt-4">
            You completed {totalLogsLast7Days} check-ins out of {possibleLogsLast7Days} expected logs in the last 7 days.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Weekly Trend Chart - Beautiful SVG Bars */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-slate-500 mb-6">Activity Trend (Last 7 Days)</h3>
          <div className="flex items-end justify-between h-40 pt-4 px-2">
            {weeklyData.map((d, index) => {
              const heightPercent = d.count > 0 ? (d.count / maxDayCompletions) * 80 : 5; // minimum height
              return (
                <div key={index} className="flex flex-col items-center flex-1 group">
                  <div className="relative w-full flex justify-center">
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-md">
                      {d.count} completed
                    </div>
                    {/* Bar */}
                    <div
                      style={{ height: `${heightPercent}px` }}
                      className="w-8 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg group-hover:from-blue-500 group-hover:to-blue-300 transition-all duration-300 shadow-sm"
                    />
                  </div>
                  <span className="text-xs text-slate-400 font-medium mt-2">{d.dayLabel}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-slate-500 mb-4">Category Completion</h3>
          {habits.length === 0 ? (
            <p className="text-xs text-slate-400">No habits added yet.</p>
          ) : (
            <div className="space-y-4 max-h-[168px] overflow-y-auto pr-1">
              {categories.map((c, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-700">{c.name} ({c.count})</span>
                    <span className="text-blue-600">{c.rate}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${c.rate}%` }}
                      className="h-full bg-blue-600 rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
