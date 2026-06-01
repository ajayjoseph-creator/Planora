import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, ArrowRight, ArrowLeft, User, CheckCircle, RefreshCw, AlertCircle, Clock, Check, Sparkles, Trophy } from 'lucide-react';
import Logo from './Logo';
import axios from 'axios';

export default function Auth({ onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [authStep, setAuthStep] = useState('email'); // 'email', 'otp'
  
  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const otpRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];
  
  // Timer & alerts
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  
  // Carousel states
  const [activeSlide, setActiveSlide] = useState(0);

  // Google configuration check
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const isGoogleConfigured = clientId && 
                             !clientId.includes('your-google-client-id-here') && 
                             clientId.trim() !== '';

  // Auto-rotate slides
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide(prev => (prev === 0 ? 1 : 0));
    }, 7000);
    return () => clearInterval(interval);
  }, []);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Handle Google Login response
  const handleCredentialResponse = async (response) => {
    setLoading(true);
    setError('');
    const idToken = response.credential;
    
    try {
      const apiResponse = await axios.post('http://localhost:5050/api/auth/google', {
        credential: idToken
      });
      const loggedInUser = apiResponse.data;
      localStorage.setItem('planora_user', JSON.stringify(loggedInUser));
      onLoginSuccess(loggedInUser);
    } catch (err) {
      console.warn('Google verification failed, decoding token locally.', err.message);
      try {
        const base64Url = idToken.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          window.atob(base64)
            .split('')
            .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const payload = JSON.parse(jsonPayload);
        const decodedUser = {
          name: payload.name,
          email: payload.email,
          avatar: payload.picture,
          token: idToken
        };
        localStorage.setItem('planora_user', JSON.stringify(decodedUser));
        onLoginSuccess(decodedUser);
      } catch (decodeErr) {
        setError('Failed to authenticate Google account: ' + (err.response?.data?.message || err.message));
      }
    } finally {
      setLoading(false);
    }
  };

  // Google sign in button renderer
  useEffect(() => {
    const renderGoogleBtn = () => {
      if (window.google && isGoogleConfigured) {
        try {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleCredentialResponse
          });
          window.google.accounts.id.renderButton(
            document.getElementById("google-signin-btn"),
            { theme: "outline", size: "large", width: "380", text: "continue_with", shape: "pill" }
          );
        } catch (e) {
          console.error(e);
        }
      }
    };

    if (window.google) renderGoogleBtn();
  }, [showEmailForm, isGoogleConfigured, authStep]);

  // Main Email form submission (Handles Password login OR OTP requests)
  const handleEmailFormSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setError('');
    setInfoMessage('');

    try {
      if (isRegister) {
        // --- 1. SIGN UP STEP 1: Verify email via OTP ---
        if (!name || !password) {
          setError('Please fill in all registration fields');
          setLoading(false);
          return;
        }
        const response = await axios.post('http://localhost:5050/api/auth/register-request', {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password: password
        });

        const { isMock, mockOtp } = response.data;
        if (isMock) {
          setInfoMessage('Verification code sent. (Demo Code: ' + mockOtp + ')');
        } else {
          setInfoMessage('Verification code successfully sent to your email.');
        }
        setAuthStep('otp');
        setOtpValues(['', '', '', '', '', '']);
        setCountdown(60);
      } else {
        // --- 2. LOG IN STEPS (Email + Password -> triggers OTP) ---
        if (!password) {
          setError('Please enter your password');
          setLoading(false);
          return;
        }
        const response = await axios.post('http://localhost:5050/api/auth/login', {
          email: email.trim().toLowerCase(),
          password: password
        });

        const { isMock, mockOtp } = response.data;
        if (isMock) {
          setInfoMessage('Verification code sent. (Demo Code: ' + mockOtp + ')');
        } else {
          setInfoMessage('Verification code successfully sent to your email.');
        }
        setAuthStep('otp');
        setOtpValues(['', '', '', '', '', '']);
        setCountdown(60);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication request failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  // Submit OTP code for verification
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const otpCode = otpValues.join('');
    if (otpCode.length < 6) {
      setError('Please enter the complete 6-digit verification code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:5050/api/auth/verify-otp', {
        email: email.trim().toLowerCase(),
        otp: otpCode,
        name: isRegister ? name.trim() : null,
        password: isRegister ? password : null
      });

      const loggedInUser = response.data;
      localStorage.setItem('planora_user', JSON.stringify(loggedInUser));
      onLoginSuccess(loggedInUser);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid verification code. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle auto-focus shifts for OTP inputs
  const handleOtpInput = (value, index) => {
    if (isNaN(value)) return;
    const newValues = [...otpValues];
    newValues[index] = value.substring(value.length - 1);
    setOtpValues(newValues);

    if (value !== '' && index < 5) {
      otpRefs[index + 1].current.focus();
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === 'Backspace' && otpValues[index] === '' && index > 0) {
      otpRefs[index - 1].current.focus();
    }
  };

  const handleGoogleLoginSimulation = () => {
    setLoading(true);
    setError('');
    setTimeout(() => {
      setLoading(false);
      const mockUser = {
        name: 'Alex Mercer',
        email: 'alex.mercer@gmail.com',
        avatar: 'blue',
        token: 'google_mock_token'
      };
      localStorage.setItem('planora_user', JSON.stringify(mockUser));
      onLoginSuccess(mockUser);
    }, 1000);
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-50 overflow-hidden font-sans">
      
      {/* LEFT COLUMN: Premium Carousel Branding Screen */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-800 text-white flex-col justify-between p-16 xl:p-24 overflow-hidden select-none">
        {/* Concentric rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="absolute rounded-full border border-white/5 w-[400px] h-[400px]" />
          <div className="absolute rounded-full border border-white/5 w-[650px] h-[650px]" />
          <div className="absolute rounded-full border border-white/5 w-[900px] h-[900px]" />
        </div>

        {/* Top Header */}
        <div className="relative z-10 flex items-center gap-2">
          <Logo className="w-11 h-11" showText={true} textClass="text-2xl tracking-wide font-black text-white" />
        </div>

        {/* Center: Dynamic Carousel Graphics */}
        <div className="relative z-10 w-full h-[520px] flex items-center justify-center my-auto">
          <AnimatePresence mode="wait">
            {activeSlide === 0 ? (
              /* SLIDE 1: Floating Avatars & Dynamic Stats Badges */
              <motion.div
                key="slide-1-graphic"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.5 }}
                className="relative w-full h-full flex items-center justify-center"
              >
                <motion.div className="absolute top-8 left-6 bg-white/10 backdrop-blur-xl border border-white/20 text-white text-xs font-bold py-2.5 px-4 rounded-2xl shadow-xl flex items-center gap-2">
                  <span className="text-orange-400">🔥</span>
                  <span>15 Day Streak!</span>
                </motion.div>

                <motion.div className="absolute top-4 right-8 xl:right-16 flex items-center gap-3">
                  <div className="w-20 h-20 xl:w-24 xl:h-24 rounded-full border-4 border-white/30 overflow-hidden shadow-2xl flex items-center justify-center text-3xl font-black uppercase bg-gradient-to-tr from-rose-500 to-pink-600 text-white select-none">
                    A
                  </div>
                  <div className="bg-white/95 backdrop-blur-md text-slate-800 text-xs font-bold py-3 px-5 rounded-2xl shadow-xl border border-white flex items-center gap-2">
                    <span className="w-4.5 h-4.5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                      <CheckCircle className="w-3.5 h-3.5 fill-current" />
                    </span>
                    <div className="w-16 h-2.5 bg-slate-200 rounded-full" />
                  </div>
                </motion.div>

                <motion.div className="absolute top-1/2 -right-4 bg-white/10 backdrop-blur-xl border border-white/20 text-white text-xs font-bold py-2.5 px-4 rounded-2xl shadow-xl flex items-center gap-2">
                  <span className="text-blue-400">💧</span>
                  <span>1200 ML Drink target met</span>
                </motion.div>

                <motion.div className="absolute top-1/3 left-0 xl:left-4 flex items-center gap-3">
                  <div className="w-20 h-20 xl:w-24 xl:h-24 rounded-full border-4 border-white/30 overflow-hidden shadow-2xl flex items-center justify-center text-3xl font-black uppercase bg-gradient-to-tr from-purple-500 to-indigo-600 text-white select-none">
                    B
                  </div>
                  <div className="bg-white/95 backdrop-blur-md text-slate-800 text-xs font-bold py-3 px-5 rounded-2xl shadow-xl border border-white flex items-center gap-2">
                    <span className="w-4.5 h-4.5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                      <CheckCircle className="w-3.5 h-3.5 fill-current" />
                    </span>
                    <div className="w-16 h-2.5 bg-slate-200 rounded-full" />
                  </div>
                </motion.div>

                <motion.div className="absolute bottom-16 left-6 bg-white/10 backdrop-blur-xl border border-white/20 text-white text-xs font-bold py-2.5 px-4 rounded-2xl shadow-xl flex items-center gap-2">
                  <span className="text-emerald-400">🧘</span>
                  <span>Mindfulness completed</span>
                </motion.div>

                <motion.div className="absolute bottom-6 right-10 xl:right-20 flex items-center gap-3">
                  <div className="w-20 h-20 xl:w-24 xl:h-24 rounded-full border-4 border-white/30 overflow-hidden shadow-2xl flex items-center justify-center text-3xl font-black uppercase bg-gradient-to-tr from-blue-500 to-indigo-600 text-white select-none">
                    C
                  </div>
                  <div className="bg-white/95 backdrop-blur-md text-slate-800 text-xs font-bold py-3 px-5 rounded-2xl shadow-xl border border-white flex items-center gap-2">
                    <span className="w-4.5 h-4.5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                      <CheckCircle className="w-3.5 h-3.5 fill-current" />
                    </span>
                    <div className="w-16 h-2.5 bg-slate-200 rounded-full" />
                  </div>
                </motion.div>
              </motion.div>
            ) : (
              /* SLIDE 2: Habits/Challenges lists */
              <motion.div
                key="slide-2-graphic"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md flex flex-col gap-6 p-6 text-slate-800 bg-blue-900/35 border border-white/10 rounded-[32px] backdrop-blur-md self-center shadow-2xl"
              >
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-blue-200 flex items-center justify-between">
                    <span>Active Challenges</span>
                    <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded text-[9px] font-extrabold">Weekly</span>
                  </h4>
                  <div className="bg-white rounded-2xl p-4 flex items-center justify-between gap-3 shadow-md border border-white">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <h5 className="font-extrabold text-sm text-slate-800">Best Runners! 🏃</h5>
                        <p className="text-[10px] font-bold text-slate-400">5 days 13 hours left</p>
                      </div>
                    </div>
                    <div className="flex -space-x-2">
                      <div className="w-7.5 h-7.5 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-black uppercase bg-gradient-to-tr from-rose-500 to-pink-600 text-white select-none">S</div>
                      <div className="w-7.5 h-7.5 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-black uppercase bg-gradient-to-tr from-purple-500 to-indigo-600 text-white select-none">C</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-blue-200">Daily Routines</h4>
                  <div className="flex flex-col gap-3">
                    <div className="bg-white rounded-2xl p-3 px-4 flex items-center justify-between shadow-sm border border-slate-50">
                      <div className="flex items-center gap-3">
                        <div className="relative w-9 h-9 flex items-center justify-center">
                          <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                            <circle stroke="#f1f5f9" fill="transparent" strokeWidth="2.5" r="14" cx="18" cy="18" />
                            <circle stroke="#2563eb" fill="transparent" strokeWidth="2.5" strokeDasharray={2*Math.PI*14} strokeDashoffset={2*Math.PI*14 - 0.25*2*Math.PI*14} strokeLinecap="round" r="14" cx="18" cy="18" />
                          </svg>
                          <span className="text-blue-500 font-bold text-xs">💧</span>
                        </div>
                        <div>
                          <h6 className="font-extrabold text-xs text-slate-800">Drink the water</h6>
                          <p className="text-[9px] font-bold text-slate-400">500/2000 ML</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <div className="flex -space-x-1.5">
                          <div className="w-5.5 h-5.5 rounded-full border border-white flex items-center justify-center text-[8px] font-black uppercase bg-gradient-to-tr from-rose-500 to-pink-600 text-white select-none">S</div>
                          <div className="w-5.5 h-5.5 rounded-full border border-white flex items-center justify-center text-[8px] font-black uppercase bg-gradient-to-tr from-blue-500 to-indigo-600 text-white select-none">M</div>
                          <span className="w-5.5 h-5.5 rounded-full bg-blue-50 text-blue-600 border border-white text-[8px] font-bold flex items-center justify-center">+3</span>
                        </div>
                        <button className="w-6.5 h-6.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 font-black text-sm flex items-center justify-center">+</button>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl p-3 px-4 flex items-center justify-between shadow-sm border border-slate-50">
                      <div className="flex items-center gap-3">
                        <div className="relative w-9 h-9 flex items-center justify-center">
                          <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                            <circle stroke="#f1f5f9" fill="transparent" strokeWidth="2.5" r="14" cx="18" cy="18" />
                          </svg>
                          <span className="text-slate-500 font-bold text-xs">🚶</span>
                        </div>
                        <div>
                          <h6 className="font-extrabold text-xs text-slate-800">Walk</h6>
                          <p className="text-[9px] font-bold text-slate-400">0/10000 STEPS</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <div className="flex -space-x-1.5">
                          <div className="w-5.5 h-5.5 rounded-full border border-white flex items-center justify-center text-[8px] font-black uppercase bg-gradient-to-tr from-blue-500 to-indigo-600 text-white select-none">M</div>
                          <div className="w-5.5 h-5.5 rounded-full border border-white flex items-center justify-center text-[8px] font-black uppercase bg-gradient-to-tr from-purple-500 to-indigo-600 text-white select-none">C</div>
                        </div>
                        <button className="w-6.5 h-6.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 font-black text-sm flex items-center justify-center">+</button>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl p-3 px-4 flex items-center justify-between shadow-sm border border-slate-50">
                      <div className="flex items-center gap-3">
                        <div className="relative w-9 h-9 flex items-center justify-center">
                          <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                            <circle stroke="#f1f5f9" fill="transparent" strokeWidth="2.5" r="14" cx="18" cy="18" />
                            <circle stroke="#2563eb" fill="transparent" strokeWidth="2.5" strokeDasharray={2*Math.PI*14} strokeDashoffset={2*Math.PI*14 - 0.6*2*Math.PI*14} strokeLinecap="round" r="14" cx="18" cy="18" />
                          </svg>
                          <span className="text-slate-500 font-bold text-xs">📖</span>
                        </div>
                        <div>
                          <h6 className="font-extrabold text-xs text-slate-800">Read Books</h6>
                          <p className="text-[9px] font-bold text-slate-400">12/20 PAGES</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <div className="w-5.5 h-5.5 rounded-full border border-white flex items-center justify-center text-[8px] font-black uppercase bg-gradient-to-tr from-purple-500 to-indigo-600 text-white select-none">C</div>
                        <button className="w-6.5 h-6.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 font-black text-sm flex items-center justify-center">+</button>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl p-3 px-4 flex items-center justify-between shadow-sm border border-slate-50">
                      <div className="flex items-center gap-3">
                        <div className="relative w-9 h-9 flex items-center justify-center">
                          <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                            <circle stroke="#10b981" fill="transparent" strokeWidth="2.5" r="14" cx="18" cy="18" />
                          </svg>
                          <span className="text-emerald-500 font-bold text-xs">🧘</span>
                        </div>
                        <div>
                          <h6 className="font-extrabold text-xs text-slate-800">Meditate</h6>
                          <p className="text-[9px] font-bold text-slate-400">30/30 MIN</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <div className="w-5.5 h-5.5 rounded-full border border-white flex items-center justify-center text-[8px] font-black uppercase bg-gradient-to-tr from-rose-500 to-pink-600 text-white select-none">S</div>
                        <button className="w-6.5 h-6.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 text-xs flex items-center justify-center">
                          <Check className="w-4.5 h-4.5 stroke-[3.5]" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Section */}
        <div className="relative z-10 mt-auto space-y-4">
          <AnimatePresence mode="wait">
            {activeSlide === 0 ? (
              <motion.div
                key="slide-1-text"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-4xl xl:text-5xl font-extrabold tracking-tight leading-tight">
                  Create <br /> Good Habits
                </h2>
                <p className="text-blue-100/80 text-sm xl:text-base max-w-sm font-medium mt-3">
                  Change your life by slowly adding new healthy habits and sticking to them.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="slide-2-text"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-4xl xl:text-5xl font-extrabold tracking-tight leading-tight">
                  Track <br /> Your Progress
                </h2>
                <p className="text-blue-100/80 text-sm xl:text-base max-w-sm font-medium mt-3">
                  Everyday you become one step closer to your goal. Don't give up!
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Dots Carousel */}
          <div className="flex gap-2.5 pt-2">
            <button
              onClick={() => setActiveSlide(0)}
              className={`h-2.5 rounded-full transition-all duration-300 outline-none ${
                activeSlide === 0 ? 'w-8 bg-white' : 'w-2.5 bg-white/30 hover:bg-white/50'
              }`}
              title="Slide 1"
            />
            <button
              onClick={() => setActiveSlide(1)}
              className={`h-2.5 rounded-full transition-all duration-300 outline-none ${
                activeSlide === 1 ? 'w-8 bg-white' : 'w-2.5 bg-white/30 hover:bg-white/50'
              }`}
              title="Slide 2"
            />
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Auth Forms & OTP Screen (Highly Responsive, Completely Free of Developer Help Text) */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 sm:p-12 md:p-20 xl:p-28 relative bg-white bg-glow">
        
        {/* Mobile branding header */}
        <div className="absolute top-6 left-6 lg:hidden flex items-center gap-2 z-10">
          <Logo className="w-8 h-8" showText={true} textClass="text-lg text-slate-800 font-extrabold" />
        </div>

        <motion.div 
          className="w-full max-w-md p-8 sm:p-10 bg-white/75 backdrop-blur-xl border border-slate-100 rounded-[32px] shadow-[0_25px_60px_-15px_rgba(37,99,235,0.06)] space-y-7 z-10 mt-10 lg:mt-0"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Welcome Header */}
          <div className="space-y-2">
            <h2 className="text-3xl xl:text-4xl font-extrabold text-slate-900 tracking-tight">
              {authStep === 'otp' ? 'Verify Your Email' : (isRegister ? 'Begin Your Journey' : 'Welcome Back')}
            </h2>
            <p className="text-slate-400 font-medium text-sm xl:text-base">
              {authStep === 'otp' 
                ? `Enter the 6-digit security code sent to ${email}` 
                : (isRegister ? 'Create an account to start tracking habits.' : 'Log in to track your habits and daily streaks.')}
            </p>
          </div>

          {/* Status Alerts */}
          {error && (
            <div className="text-xs font-semibold text-red-500 bg-red-50 border border-red-100 px-4 py-3.5 rounded-2xl flex items-center gap-2 animate-pulse">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {infoMessage && (
            <div className="text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-100 px-4 py-3.5 rounded-2xl flex items-center gap-2 shadow-sm">
              <CheckCircle className="w-4 h-4 shrink-0 text-blue-500" />
              <span className="font-sans">{infoMessage}</span>
            </div>
          )}

          {/* Interactive Form States */}
          <AnimatePresence mode="wait">
            
            {authStep === 'email' ? (
              /* ================== STEP 1: LOGIN / SIGNUP EMAIL & PASSWORD FIELDS ================== */
              <motion.div
                key="email-password-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Google OAuth (Official button if configured, fallback simulation if not) */}
                <div className="space-y-4">
                  {isGoogleConfigured ? (
                    <div className="w-full flex justify-center py-1">
                      <div id="google-signin-btn" className="w-full flex justify-center"></div>
                    </div>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={handleGoogleLoginSimulation}
                      disabled={loading}
                      className="w-full py-3.5 bg-slate-50 border border-slate-200/80 hover:bg-slate-100 text-slate-700 font-bold rounded-2xl transition-all shadow-sm flex items-center justify-center gap-3 cursor-pointer"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" width="20" height="20">
                        <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69c-.29 1.5-.1.14-.1 2.92v2.42h4.08c2.39-2.2 3.77-5.44 3.77-9.2z" />
                        <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-4.08-3.16c-1.13.76-2.58 1.21-3.85 1.21-2.97 0-5.48-2-6.38-4.7H1.44v3.28C3.42 21.84 7.43 24 12 24z" />
                        <path fill="#FBBC05" d="M5.62 14.44a7.12 7.12 0 0 1 0-4.52V6.64H1.44a11.94 11.94 0 0 0 0 11.08l4.18-3.28z" />
                        <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.43 0 3.42 2.16 1.44 5.64l4.18 3.28c.9-2.7 3.41-4.7 6.38-4.7z" />
                      </svg>
                      <span className="text-sm xl:text-base">Continue with Google</span>
                    </motion.button>
                  )}

                  <div className="flex items-center gap-3 my-2.5">
                    <div className="flex-1 h-px bg-slate-200" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">or</span>
                    <div className="flex-1 h-px bg-slate-200" />
                  </div>
                </div>

                {/* Email Form fields */}
                <form onSubmit={handleEmailFormSubmit} className="space-y-4">
                  {/* Name field (signup mode only) */}
                  {isRegister && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Name</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-4.5 h-4.5" />
                        <input
                          type="text"
                          placeholder="Your full name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full pl-11 pr-4 py-3.5 bg-slate-50/50 border border-slate-200/85 rounded-2xl focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all duration-200 font-medium text-slate-800 text-sm xl:text-base shadow-sm"
                        />
                      </div>
                    </div>
                  )}

                  {/* Email field */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-4.5 h-4.5" />
                      <input
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50/50 border border-slate-200/85 rounded-2xl focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all duration-200 font-medium text-slate-800 text-sm xl:text-base shadow-sm"
                      />
                    </div>
                  </div>

                  {/* Password field */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-4.5 h-4.5" />
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50/50 border border-slate-200/85 rounded-2xl focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all duration-200 font-medium text-slate-800 text-sm xl:text-base shadow-sm"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-md shadow-blue-200 flex items-center justify-center gap-2 cursor-pointer text-sm xl:text-base mt-2"
                  >
                    {loading ? (
                      <RefreshCw className="w-4.5 h-4.5 animate-spin" />
                    ) : (
                      <>
                        <span>{isRegister ? 'Get Verification Code' : 'Log In & Send Code'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </motion.button>
                </form>

                {/* Toggle Login/Signup */}
                <div className="pt-4 text-center">
                  <p className="text-xs font-semibold text-slate-400 xl:text-sm">
                    {isRegister ? 'Already have an account?' : "Don't have an account yet?"}{' '}
                    <button
                      onClick={() => {
                        setIsRegister(!isRegister);
                        setError('');
                        setPassword('');
                      }}
                      className="text-blue-600 hover:underline font-bold cursor-pointer"
                    >
                      {isRegister ? 'Log In' : 'Sign Up'}
                    </button>
                  </p>
                </div>
              </motion.div>
            ) : (
              /* ================== STEP 2: OTP VERIFICATION CODE INPUT ================== */
              <motion.form
                key="otp-verification-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onSubmit={handleVerifyOtp}
                className="space-y-6"
              >
                {/* Visual OTP Input Fields block */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block text-center mb-2">
                    Enter the 6-digit Code
                  </label>
                  <div className="flex justify-between gap-2.5">
                    {otpValues.map((val, idx) => (
                      <input
                        key={idx}
                        ref={otpRefs[idx]}
                        type="text"
                        maxLength="1"
                        value={val}
                        onChange={(e) => handleOtpInput(e.target.value, idx)}
                        onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                        className="w-12 h-14 sm:w-14 sm:h-16 text-center text-xl sm:text-2xl font-black bg-slate-50/50 border-2 border-slate-200/80 rounded-2xl focus:border-blue-600 focus:bg-white outline-none transition-all duration-200 text-slate-800 focus:ring-4 focus:ring-blue-500/10"
                      />
                    ))}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="space-y-3 pt-2">
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-md shadow-blue-200 flex items-center justify-center gap-2 cursor-pointer text-sm xl:text-base"
                  >
                    {loading ? (
                      <RefreshCw className="w-4.5 h-4.5 animate-spin" />
                    ) : (
                      <span>Verify & Continue</span>
                    )}
                  </motion.button>

                  <div className="flex items-center justify-between text-xs px-1">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthStep('email');
                        setError('');
                        setInfoMessage('');
                      }}
                      className="text-slate-400 hover:text-slate-600 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Back
                    </button>

                    <button
                      type="button"
                      onClick={handleEmailFormSubmit}
                      disabled={countdown > 0 || loading}
                      className={`font-bold transition-colors ${
                        countdown > 0 
                          ? 'text-slate-300 cursor-not-allowed' 
                          : 'text-blue-600 hover:text-blue-800 cursor-pointer'
                      }`}
                    >
                      {countdown > 0 ? `Resend OTP (${countdown}s)` : 'Resend Verification Code'}
                    </button>
                  </div>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Feature highlights/trust signals */}
          <div className="pt-6 grid grid-cols-2 gap-4 border-t border-slate-100/60 hidden sm:grid">
            <div className="flex items-center gap-2 text-slate-400">
              <Sparkles className="w-4 h-4 text-blue-500" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Top 5% habit-builder</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Atlas Cloud Sync</span>
            </div>
          </div>

          {/* Footer Terms */}
          <p className="text-[10px] text-center font-medium text-slate-400 max-w-xs mx-auto pt-2">
            By continuing you agree to Planora's{' '}
            <a href="#terms" className="underline hover:text-slate-600">Terms of Services</a> &{' '}
            <a href="#privacy" className="underline hover:text-slate-600">Privacy Policy</a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
