import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from './Logo';

export default function SplashScreen({ onComplete }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
    }, 2800); // 2.8 seconds splash duration

    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {visible && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-700"
          initial={{ opacity: 1 }}
          exit={{ 
            y: '-100%', 
            opacity: 0,
            transition: { duration: 0.8, ease: [0.77, 0, 0.175, 1] } 
          }}
        >
          {/* Concentric radiating background circles */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <motion.div 
              className="absolute rounded-full border border-white/5 w-[300px] h-[300px]"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1.2, opacity: 1 }}
              transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
            />
            <motion.div 
              className="absolute rounded-full border border-white/5 w-[500px] h-[500px]"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1.3, opacity: 0.8 }}
              transition={{ duration: 2, delay: 0.3, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
            />
            <motion.div 
              className="absolute rounded-full border border-white/5 w-[700px] h-[700px]"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1.4, opacity: 0.5 }}
              transition={{ duration: 2.5, delay: 0.6, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
            />
          </div>

          {/* Logo and Name Container */}
          <div className="relative flex flex-col items-center gap-6 z-10">
            <motion.div
              initial={{ scale: 0.3, opacity: 0, rotate: -45 }}
              animate={{ scale: 1.1, opacity: 1, rotate: 0 }}
              transition={{ 
                type: "spring", 
                stiffness: 80, 
                damping: 15,
                duration: 1 
              }}
            >
              <Logo className="w-24 h-24" />
            </motion.div>

            <motion.h1
              className="text-5xl font-extrabold tracking-wider text-white font-sans mt-2 drop-shadow-md"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" }}
            >
              Planora
            </motion.h1>

            <motion.p
              className="text-blue-100 text-sm font-medium tracking-widest uppercase opacity-75 mt-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              transition={{ delay: 1, duration: 0.8 }}
            >
              Track your habits, shape your life
            </motion.p>
          </div>

          {/* Dynamic Loading Bar */}
          <div className="absolute bottom-16 w-48 h-1 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-white rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 2.2, ease: "easeInOut" }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
