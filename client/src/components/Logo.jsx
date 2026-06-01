import React from 'react';

export default function Logo({ className = "w-12 h-12", showText = false, textClass = "text-2xl text-slate-800" }) {
  return (
    <div className="flex items-center gap-2.5 select-none">
      <div className={`relative ${className} rounded-xl overflow-hidden shrink-0 shadow-sm border border-slate-100/50`}>
        {/* Concentric outer circle glow effect */}
        <div className="absolute inset-0 rounded-xl border border-blue-400/10 animate-ping-slow scale-105 pointer-events-none" />
        
        {/* Image logo */}
        <img 
          src="/logo.png" 
          alt="Planora Logo" 
          className="w-full h-full object-cover"
        />
      </div>
      
      {showText && (
        <span className={`font-extrabold tracking-tight font-sans ${textClass}`}>
          Planora
        </span>
      )}
    </div>
  );
}
