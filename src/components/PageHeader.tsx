'use client';

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  subtitle: string;
  badge?: string;
  badgeIcon?: React.ReactNode;
  actions?: React.ReactNode;
  variant?: 'white' | 'green' | 'sky';
}

export default function PageHeader({
  title,
  subtitle,
  badge,
  badgeIcon,
  actions,
  variant = 'white'
}: PageHeaderProps) {
  if (variant === 'sky') {
    return (
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10 w-full mb-6 mt-2">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight drop-shadow-sm leading-tight">{title}</h1>
          <p className="text-sky-100 text-xs mt-1 font-bold drop-shadow-sm">{subtitle}</p>
        </div>
        {actions && <div className="shrink-0 self-end sm:self-center">{actions}</div>}
      </div>
    );
  }

  if (variant === 'green') {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-gradient-to-br from-[#819648] via-[#ABC270] to-[#C2DA88] p-6 rounded-md border border-[#9CAE65]/50 shadow-[0_12px_24px_-4px_rgba(107,126,57,0.3),_0_4px_12px_-2px_rgba(107,126,57,0.15)] w-full mb-6 text-white"
      >
        {/* Decorative backdrop shapes for premium shades & depth */}
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute right-20 -bottom-20 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="px-2.5 py-1 bg-white/20 border border-white/10 rounded-full flex items-center gap-1.5 w-fit text-white font-bold text-[10px] tracking-wide uppercase">
                {badgeIcon || <Sparkles size={11} className="text-white animate-pulse" />} {badge || 'SVU StaffSync AttendPro'}
              </div>
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight mt-0.5">{title}</h1>
            <p className="text-[#2F3E1E] text-xs font-bold mt-1 leading-snug">{subtitle}</p>
          </div>
          {actions && <div className="shrink-0 self-start sm:self-center">{actions}</div>}
        </div>
      </motion.div>
    );
  }

  // Default white glassmorphic variant (for attendance and roster)
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/60 p-5 rounded-md border border-slate-200/60 backdrop-blur-sm shadow-sm w-full mb-6"
    >
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="px-2.5 py-1 bg-indigo-50 border border-indigo-100 rounded-full flex items-center gap-1.5 w-fit text-indigo-700 font-bold text-[10px] tracking-wide uppercase">
            {badgeIcon || <Sparkles size={11} className="animate-pulse text-indigo-600" />} {badge || 'SVU StaffSync AttendPro'}
          </div>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">{title}</h1>
        <p className="text-slate-500 text-xs mt-1 leading-snug">{subtitle}</p>
      </div>
      {actions && <div className="shrink-0 self-start sm:self-center">{actions}</div>}
    </motion.div>
  );
}
