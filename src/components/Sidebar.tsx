'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Users, 
  FileSpreadsheet, 
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  LogOut
} from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const MENU_ITEMS = [
  { title: 'Analytics', href: '/', icon: LayoutDashboard },
  { title: 'Mark Attendance', href: '/attendance', icon: CheckSquare },
  { title: 'Roster Directory', href: '/roster', icon: Users },
  { title: 'Ledger Reports', href: '/reports', icon: FileSpreadsheet },
];

export default function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(true);
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await axios.post(`${API_URL}/auth/logout`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (e) {
      console.error('Logout failed:', e);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  };

  return (
    <motion.aside
      initial={{ width: 256 }}
      animate={{ width: isExpanded ? 256 : 84 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="hidden md:flex flex-col bg-white border-r border-slate-200/60 h-screen sticky top-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-30 shrink-0 relative"
    >
      {/* Toggle Button */}
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute -right-3.5 top-8 bg-white border border-slate-200 rounded-full p-1.5 shadow-sm text-slate-400 hover:text-indigo-600 hover:shadow-md transition-all z-40"
      >
        {isExpanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>

      {/* Brand Section */}
      <div className="h-20 flex items-center px-6 mt-2 mb-4">
        <div className="flex items-center justify-center shrink-0">
          <svg viewBox="0 0 24 24" fill="currentColor" className="text-slate-900 w-8 h-8">
            <path d="M 8 0 L 16 0 L 16 8 L 24 8 L 24 16 A 8 8 0 0 0 16 24 L 8 24 L 8 16 L 0 16 L 0 8 A 8 8 0 0 0 8 0 Z" />
          </svg>
        </div>
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="ml-3 overflow-hidden whitespace-nowrap"
            >
              <h1 className="text-[13px] font-black text-slate-900 tracking-tight">SVU StaffSync AttendPro</h1>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 space-y-1.5 flex flex-col overflow-y-auto overflow-x-hidden">
        <AnimatePresence>
          {isExpanded && (
            <motion.p 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 mt-2 whitespace-nowrap"
            >
              Main Menu
            </motion.p>
          )}
        </AnimatePresence>

        {MENU_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className="relative group block"
            >
              <div className={`
                flex items-center px-3 py-2.5 rounded-xl transition-all duration-200
                ${isActive 
                  ? 'bg-indigo-50/80 text-indigo-700 font-bold shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] ring-1 ring-indigo-100/50' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-semibold'
                }
              `}>
                {/* Active Indicator Line */}
                {isActive && (
                  <motion.div 
                    layoutId="active-indicator"
                    className="absolute left-0 top-2 bottom-2 w-1 bg-indigo-600 rounded-r-full" 
                  />
                )}
                
                <div className="flex items-center justify-center shrink-0 w-6 h-6">
                  <item.icon size={18} className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.span 
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="ml-3 text-sm whitespace-nowrap"
                    >
                      {item.title}
                    </motion.span>
                  )}
                </AnimatePresence>

                {/* Tooltip when collapsed */}
                {!isExpanded && (
                  <div className="absolute left-16 px-2.5 py-1.5 bg-slate-800 text-white text-xs font-bold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-xl shadow-slate-900/20 translate-x-[-10px] group-hover:translate-x-0">
                    {item.title}
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Profile/Logout Section */}
      <div className="p-4 mt-auto border-t border-slate-100/80">
        <button 
          onClick={handleLogout}
          className={`
            w-full flex items-center p-2 rounded-xl transition-all duration-200 group relative
            hover:bg-rose-50 border border-transparent hover:border-rose-100
          `}
        >
          <div className="flex items-center justify-center shrink-0 w-9 h-9 rounded-lg bg-slate-50 group-hover:bg-rose-100 text-slate-500 group-hover:text-rose-600 transition-colors shadow-sm">
            <LogOut size={16} />
          </div>
          
          <AnimatePresence>
            {isExpanded && (
              <motion.div 
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="ml-3 overflow-hidden whitespace-nowrap text-left"
              >
                <p className="text-sm font-bold text-slate-700 group-hover:text-rose-700 transition-colors">Logout Session</p>
                <p className="text-[10px] font-semibold text-slate-400 group-hover:text-rose-400">End your shift</p>
              </motion.div>
            )}
          </AnimatePresence>

          {!isExpanded && (
            <div className="absolute left-16 px-2.5 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-xl translate-x-[-10px] group-hover:translate-x-0">
              Logout Session
            </div>
          )}
        </button>
      </div>
    </motion.aside>
  );
}
