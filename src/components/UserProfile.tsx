'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { User } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function UserProfile({ variant = 'sidebar' }: { variant?: 'sidebar' | 'header' }) {
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

  if (variant === 'header') {
    return (
      <div className="flex items-center gap-2 mr-4">
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-xs font-bold text-slate-800">{userName}</span>
          <span className="text-[9px] font-black uppercase tracking-widest text-indigo-500">{userRole}</span>
        </div>
        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shadow-sm border border-indigo-200">
          {userName.charAt(0).toUpperCase()}
        </div>
      </div>
    );
  }

  // Sidebar variant
  return (
    <div className="px-6 py-4 border-b border-slate-100/80 bg-slate-50/50 flex items-center gap-3">
      <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm shadow-indigo-200 shrink-0">
        {userName.charAt(0).toUpperCase()}
      </div>
      <div className="flex flex-col overflow-hidden">
        <span className="text-sm font-bold text-slate-800 truncate">{userName}</span>
        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 truncate">{userRole}</span>
      </div>
    </div>
  );
}
