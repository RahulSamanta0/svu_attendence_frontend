'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, AlertCircle, CheckCircle2, ArrowRight, Lock, User, Loader2, ShieldCheck } from 'lucide-react';

const API_URL = 'http://localhost:3001';

type Toast = {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
};

export default function LoginPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
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
    <div className="fixed inset-0 z-[100] flex min-h-screen font-sans bg-white">
      
      {/* Toast Notifications */}
      <div className="fixed top-6 right-6 z-[110] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8, x: 50 }}
              className={`p-4 rounded-md shadow-lg border backdrop-blur-md pointer-events-auto flex items-start gap-3 ${
                toast.type === 'success'
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

      {/* LEFT PANEL - Branding (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-[45%] relative bg-slate-950 items-center justify-center overflow-hidden flex-col p-12">
        {/* Abstract Dark Mode Background Elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[80%] h-[80%] bg-blue-600/10 blur-[150px] rounded-full pointer-events-none" />
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 max-w-lg w-full flex flex-col justify-center h-full"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-8 border border-white/10">
            <LayoutDashboard size={32} className="text-white" />
          </div>
          
          <h1 className="text-5xl font-extrabold text-white tracking-tight leading-[1.1] mb-6">
            SVU EMP Admin <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-400">
              Workspace.
            </span>
          </h1>
          
          <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-md mb-12">
            Enterprise-grade attendance tracking and roster management. Secure, lightning-fast, and designed for modern administration.
          </p>

          <div className="flex items-center gap-4 text-sm font-semibold text-slate-500 uppercase tracking-widest mt-auto border-t border-white/10 pt-8 w-fit">
            <ShieldCheck size={18} className="text-emerald-500" />
            End-to-End Encrypted
          </div>
        </motion.div>
      </div>

      {/* RIGHT PANEL - Form */}
      <div className="w-full lg:w-[55%] flex flex-col items-center justify-center bg-white relative px-6 py-12">
        
        {/* Mobile-only logo */}
        <div className="lg:hidden w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm mb-8">
          <LayoutDashboard size={24} className="text-white" />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
          className="w-full max-w-[420px]"
        >
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Welcome back</h2>
            <p className="text-slate-500 text-sm font-medium mt-2">Please enter your admin credentials to continue.</p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-6">
            
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Admin Username
              </label>
              <div className="relative group">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="name@svu.edu"
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-medium"
                  autoComplete="username"
                  required
                />
                <User size={18} className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                <a href="#" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline transition-all">
                  Forgot password?
                </a>
              </div>
              <div className="relative group">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-medium"
                  autoComplete="current-password"
                  required
                />
                <Lock size={18} className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-4 w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm py-4 px-6 rounded-xl shadow-lg shadow-slate-900/20 transition-all disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none cursor-pointer group active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform opacity-80" />
                </>
              )}
            </button>

          </form>
          
          <div className="mt-12 lg:mt-24 pt-8 border-t border-slate-100 flex items-center justify-between">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              SVU Enterprise Systems &copy; {new Date().getFullYear()}
            </p>
            <div className="flex gap-4">
               <a href="#" className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors">Help</a>
               <a href="#" className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors">Privacy</a>
            </div>
          </div>

        </motion.div>
      </div>

    </div>
  );
}
