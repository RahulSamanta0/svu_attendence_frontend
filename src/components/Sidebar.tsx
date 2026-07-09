'use client';

import { useState, useEffect } from 'react';
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
  LogOut,
  Power
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
  const [userName, setUserName] = useState<string>('Admin User');
  const [userRole, setUserRole] = useState<string>('Administrator');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        // First try local storage
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          if (user.name) {
            setUserName(user.name);
            setUserRole(user.role || 'Administrator');
            return;
          }
        }

        // If not in local storage or malformed, fetch from backend
        const response = await axios.get(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data && response.data.user && response.data.user.name) {
          setUserName(response.data.user.name);
          setUserRole(response.data.user.role || 'Administrator');
          localStorage.setItem('user', JSON.stringify(response.data.user));
        }
      } catch (e) {
        console.error('Failed to parse or fetch user data', e);
      }
    };

    fetchUser();
  }, []);

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
      className="hidden md:flex flex-col bg-gradient-to-b from-[#FFE09E] via-[#FEC868] to-[#FDA769] border-r border-[#FDA769]/30 h-screen sticky top-0 shadow-[8px_0_30px_rgba(253,167,105,0.15)] z-30 shrink-0 relative"
    >
      {/* Decorative premium glows inside the sidebar (contained within an overflow-hidden absolute layer so the toggle button is not clipped) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -left-16 -top-16 w-36 h-36 bg-white/25 rounded-full blur-2xl" />
        <div className="absolute right-0 bottom-10 w-44 h-44 bg-white/20 rounded-full blur-3xl" />
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute -right-3.5 top-8 bg-white/85 backdrop-blur-md border border-[#FDA769]/30 rounded-full p-1.5 shadow-md text-slate-700 hover:text-amber-950 hover:shadow-lg transition-all z-40"
      >
        {isExpanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>

      {/* Brand Section */}
      <div className="h-20 flex items-center px-6 mt-2 mb-4 relative z-10">
        <div className="flex items-center justify-center shrink-0">
          <svg viewBox="0 0 24 24" fill="currentColor" className="text-amber-950 w-8 h-8 drop-shadow-sm">
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
              <h1 className="text-[13px] font-black text-amber-950 tracking-tight">SVU StaffSync AttendPro</h1>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 space-y-1.5 flex flex-col overflow-y-auto overflow-x-hidden relative z-10">
        <AnimatePresence>
          {isExpanded && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-2 text-[10px] font-black text-amber-900/60 uppercase tracking-widest mb-2 mt-2 whitespace-nowrap"
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
                  ? 'bg-white/40 text-amber-950 font-bold shadow-[0_4px_12px_rgba(107,70,17,0.08),_inset_0_1px_1px_rgba(255,255,255,0.4)] border border-white/20'
                  : 'text-amber-900/80 hover:bg-white/20 hover:text-amber-950 font-semibold'
                }
              `}>
                {/* Active Indicator Line */}
                {isActive && (
                  <motion.div
                    layoutId="active-indicator"
                    className="absolute left-0 top-2 bottom-2 w-1 bg-amber-950 rounded-r-full"
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

      {/* Bottom Profile & Logout Section */}
      <div className={`p-4 mt-auto border-t border-[#FDA769]/25 relative z-10 flex flex-col gap-3 ${!isExpanded ? 'items-center' : ''}`}>
        {isExpanded ? (
          /* Profile Section with Inline Logout Icon Button */
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/25 border border-white/15 shadow-sm w-full">
            <div className="w-9 h-9 rounded-full bg-amber-950 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm border border-amber-900/10">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-black text-amber-950 truncate leading-snug">{userName}</span>
              <span className="text-[9px] font-black uppercase tracking-widest text-amber-900/70 truncate leading-none mt-0.5">{userRole}</span>
            </div>

            {/* Embedded Logout Icon Button */}
            <button
              onClick={handleLogout}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-white/25 hover:bg-rose-600/80 text-amber-950 hover:text-white transition-all shadow-[inset_1px_1px_2px_rgba(255,255,255,0.4),_inset_-1px_-1px_2px_rgba(0,0,0,0.1),_2px_2px_5px_rgba(107,70,17,0.06)] border border-white/10 shrink-0 group/logout relative"
              title="Logout Session"
            >
              <Power size={13} className="stroke-[2.5]" />
              {/* Tooltip on Hover */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2.5 py-1 bg-amber-950 text-white text-[10px] font-bold rounded-md shadow-lg opacity-0 pointer-events-none group-hover/logout:opacity-100 transition-opacity whitespace-nowrap z-50">
                Logout Session
              </div>
            </button>
          </div>
        ) : (
          <>
            {/* Profile Avatar with Tooltip */}
            <div className="relative group/profile cursor-pointer">
              <div className="w-9 h-9 rounded-full bg-amber-950 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm border border-amber-900/10 animate-pulse">
                {userName.charAt(0).toUpperCase()}
              </div>
              {/* Tooltip */}
              <div className="absolute left-16 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-slate-800 text-white text-xs font-bold rounded-lg opacity-0 invisible group-hover/profile:opacity-100 group-hover/profile:visible transition-all whitespace-nowrap z-50 shadow-xl shadow-slate-900/20 translate-x-[-10px] group-hover/profile:translate-x-0">
                <div className="font-black">{userName}</div>
                <div className="text-[9px] text-slate-300 font-bold uppercase tracking-widest">{userRole}</div>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center justify-center w-9 h-9 rounded-full bg-white/20 hover:bg-rose-600/80 text-amber-950 hover:text-white transition-all shadow-[inset_1px_1px_2px_rgba(255,255,255,0.4),_inset_-1px_-1px_2px_rgba(0,0,0,0.1),_2px_2px_5px_rgba(107,70,17,0.06)] border border-white/10 group relative"
            >
              <Power size={14} className="stroke-[2.5]" />
              {/* Tooltip */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2.5 py-1 bg-amber-950 text-white text-[10px] font-bold rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                Logout Session
              </div>
            </button>
          </>
        )}
      </div>
    </motion.aside>
  );
}
