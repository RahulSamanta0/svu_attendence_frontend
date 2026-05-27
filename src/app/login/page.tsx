'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Playfair_Display } from 'next/font/google';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle2, Eye, EyeOff, ArrowRight, Flag, LayoutGrid, Menu, List, Target } from 'lucide-react';

const playfair = Playfair_Display({ subsets: ['latin'], weight: ['400', '600', '700', '800'] });

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

type Toast = {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
};

export default function LoginPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: 'success' | 'error' | 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !password) {
      addToast('Please enter both username and password.', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { name, password });

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data));

      addToast('Authentication successful.', 'success');

      setTimeout(() => {
        router.push('/');
      }, 1000);

    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 401) {
        addToast('Invalid credentials. Access denied.', 'error');
      } else {
        addToast('Authentication server unreachable.', 'error');
      }
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex min-h-screen font-sans bg-[#221f1c]">

      {/* Toast Notifications */}
      <div className="fixed top-6 right-6 z-[110] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8, x: 50 }}
              className={`p-4 rounded-md shadow-lg border backdrop-blur-md pointer-events-auto flex items-start gap-3 ${toast.type === 'success'
                ? 'bg-emerald-900/90 border-emerald-700/50 text-emerald-50'
                : toast.type === 'error'
                  ? 'bg-rose-900/90 border-rose-700/50 text-rose-50'
                  : 'bg-slate-900/90 border-slate-700/50 text-slate-50'
                }`}
            >
              {toast.type === 'success' && <CheckCircle2 className="text-emerald-400 shrink-0 mt-0.5" size={18} />}
              {toast.type === 'error' && <AlertCircle className="text-rose-400 shrink-0 mt-0.5" size={18} />}
              {toast.type === 'info' && <AlertCircle className="text-blue-400 shrink-0 mt-0.5" size={18} />}
              <div className="flex flex-col">
                <span className="text-sm font-semibold">{toast.type === 'error' ? 'Authentication Failed' : 'System Notice'}</span>
                <span className="text-xs opacity-90 mt-0.5">{toast.message}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* LEFT PANEL / BACKGROUND GRAPHIC */}
      <div className="absolute inset-0 lg:relative w-full h-full lg:w-[45%] lg:h-auto flex items-center justify-center overflow-hidden z-10 bg-[#221f1c]">
        {/* Background Concentric Circles */}
        <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border-[0.5px] border-white/10 rounded-full pointer-events-none"></div>
        <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border-[0.5px] border-white/5 rounded-full pointer-events-none"></div>
        <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border-[0.5px] border-white-[0.02] rounded-full pointer-events-none"></div>

        {/* Center Text - Hidden on Mobile */}
        <motion.h1
          initial={{ opacity: 0, y: 15, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className={`relative z-20 text-[3rem] lg:text-[4.5rem] ${playfair.className} font-medium text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 tracking-tight leading-[1.1] text-center hidden lg:block`}
        >
          SVU StaffSync <br />
          AttendPro
        </motion.h1>

        {/* Animated Floating Graphic around text */}
        <div className="absolute inset-0 z-10 pointer-events-none">
          {/* Dots */}
          <motion.div className="absolute top-[20%] left-[20%] w-2 h-2 rounded-full bg-purple-400/60" animate={{ y: [0, -10, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} />
          <motion.div className="absolute top-[70%] right-[25%] w-1.5 h-1.5 rounded-full bg-gray-400/60" animate={{ y: [0, 8, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }} />
          <motion.div className="absolute bottom-[15%] left-[35%] w-2.5 h-2.5 rounded-full bg-amber-400/60" animate={{ y: [0, -12, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }} />
          <motion.div className="absolute top-[30%] right-[20%] w-3 h-3 rounded-full bg-orange-400/40" animate={{ y: [0, 10, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }} />

          {/* Purple Flag - Top Left */}
          <motion.div
            className="absolute top-[25%] left-[15%] w-20 h-20 rounded-full bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 border border-white/10 backdrop-blur-md"
            animate={{ y: [0, -15, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <Flag className="text-white" size={28} />
          </motion.div>

          {/* Blue Menu - Top Right */}
          <motion.div
            className="absolute top-[20%] right-[15%] w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/20 border border-white/10 backdrop-blur-md"
            animate={{ y: [0, -12, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          >
            <Menu className="text-white" size={24} />
          </motion.div>

          {/* Orange Grid - Mid Left */}
          <motion.div
            className="absolute top-[55%] left-[10%] w-16 h-16 rounded-full bg-orange-400 flex items-center justify-center shadow-lg shadow-orange-400/20 border border-white/10 backdrop-blur-md"
            animate={{ y: [0, -8, 0] }} transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
          >
            <LayoutGrid className="text-white" size={24} />
          </motion.div>

          {/* Yellow List - Mid Right */}
          <motion.div
            className="absolute top-[60%] right-[12%] w-16 h-16 rounded-full bg-amber-400 flex items-center justify-center shadow-lg shadow-amber-400/20 border border-white/10 backdrop-blur-md"
            animate={{ y: [0, 12, 0] }} transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
          >
            <List className="text-white" size={24} />
          </motion.div>

          {/* Green Target - Bottom Left */}
          <motion.div
            className="absolute bottom-[15%] left-[30%] w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center shadow-lg shadow-emerald-500/20 border border-white/10 backdrop-blur-md"
            animate={{ y: [0, -10, 0] }} transition={{ duration: 4.1, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
          >
            <Target className="text-white" size={20} />
          </motion.div>

          {/* Pink Check - Bottom Right */}
          <motion.div
            className="absolute bottom-[20%] right-[35%] w-12 h-12 rounded-full bg-pink-500 flex items-center justify-center shadow-lg shadow-pink-500/20 border border-white/10 backdrop-blur-md"
            animate={{ y: [0, -15, 0] }} transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut", delay: 0.7 }}
          >
            <CheckCircle2 className="text-white" size={18} />
          </motion.div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full border border-[#F14A29] flex items-center justify-center z-20 hidden lg:flex">
          <div className="w-2 h-2 rounded-full bg-[#F14A29]"></div>
        </div>
      </div>

      {/* RIGHT PANEL - Form as a Centered Popup on Mobile */}
      <div className="w-full lg:w-[55%] flex flex-col bg-transparent lg:bg-white lg:rounded-l-[3rem] shadow-none lg:shadow-[-20px_0_40px_rgba(0,0,0,0.1)] relative overflow-hidden py-10 px-6 sm:px-16 lg:px-24 xl:px-32 z-20 items-center justify-center min-h-screen">
        <div className="flex-1 flex flex-col justify-center max-w-[420px] w-full mx-auto bg-white/10 backdrop-blur-xl lg:bg-transparent rounded-[2rem] lg:rounded-none shadow-[0_20px_50px_rgba(0,0,0,0.25)] lg:shadow-none border border-white/20 lg:border-none p-6 sm:p-10 lg:p-0 my-auto">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="mb-6 lg:mb-8 text-center lg:text-left"
          >
            <motion.span
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className={`inline-block text-[9px] ${playfair.className} font-bold uppercase tracking-widest text-[#F14A29] mb-1.5 bg-white/5 border border-white/10 lg:bg-slate-50 lg:border-slate-200/50 px-2.5 py-1 rounded-sm shadow-sm`}
            >
              SVU StaffSync
            </motion.span>
            <h2 className={`text-[2.5rem] lg:text-[3rem] ${playfair.className} font-bold text-white lg:text-slate-900 tracking-tight leading-none mt-1`}>Sign In</h2>
          </motion.div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Email or Username"
                className="w-full px-6 py-[13px] bg-white border border-slate-100 rounded-full text-[14px] focus:outline-none focus:border-slate-300 focus:ring-1 focus:ring-slate-200 transition-all text-slate-800 placeholder:text-gray-400 font-semibold shadow-sm"
                autoComplete="username"
                required
              />
            </div>

            <div className="flex flex-col">
              <div className="relative group">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full pl-6 pr-12 py-[13px] bg-white border border-slate-100 rounded-full text-[14px] focus:outline-none focus:border-slate-300 focus:ring-1 focus:ring-slate-200 transition-all text-slate-800 placeholder:text-gray-400 font-semibold shadow-sm"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={22} strokeWidth={1.5} /> : <Eye size={22} strokeWidth={1.5} />}
                </button>
              </div>
              <a href="#" className="text-[12.5px] font-bold text-orange-400 lg:text-[#F14A29] hover:text-orange-300 hover:underline transition-all mt-3.5 w-fit ml-4">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full flex items-center justify-center bg-gradient-to-r from-[#F14A29] to-[#CD1976] hover:opacity-95 text-white font-bold text-[14px] py-[13.5px] px-6 rounded-full shadow-md shadow-pink-500/10 transition-all active:scale-[0.99] cursor-pointer group"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <div className="flex items-center gap-2">
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  <span>Sign In</span>
                </div>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-auto pt-8 flex flex-col sm:flex-row items-center justify-between text-[11px] text-gray-400 font-medium w-full max-w-[500px] mx-auto gap-4">
          <p>
            &copy; 2005-{new Date().getFullYear()} SVU StaffSync AttendPro
          </p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-gray-600 transition-colors">Contact Us</a>
            <a href="#" className="hover:text-gray-600 transition-colors flex items-center gap-1">
              English
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>
        </div>
      </div>

    </div>
  );
}
