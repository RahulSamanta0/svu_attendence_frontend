'use client';

import axios from 'axios';
import { LogOut } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function LogoutButton({ 
  variant = 'sidebar' 
}: { 
  variant?: 'sidebar' | 'header' | 'mobile' 
}) {
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

  if (variant === 'header') {
    return (
      <button 
        onClick={handleLogout}
        className="flex items-center gap-2 px-3 py-1.5 rounded-sm bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 transition-colors text-xs font-bold border border-rose-200/50 ml-auto"
      >
        <LogOut size={14} />
        <span className="hidden sm:inline">Logout</span>
      </button>
    );
  }

  if (variant === 'mobile') {
    return (
      <button 
        onClick={handleLogout}
        className="flex flex-col items-center justify-center gap-1 w-full h-full text-slate-500 hover:text-rose-600 transition-colors"
      >
        <LogOut size={20} />
        <span className="text-[9px] font-bold">Logout</span>
      </button>
    );
  }

  // Sidebar variant (default)
  return (
    <div className="p-4 mt-auto border-t border-slate-100/80">
      <button 
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-3 px-3.5 py-2.5 rounded-sm bg-slate-50 text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-all text-xs font-bold border border-slate-200/50"
      >
        <LogOut size={16} />
        Logout Session
      </button>
    </div>
  );
}
