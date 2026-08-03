'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function GlobalLoader() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: 'easeInOut' }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-4"
        >
          {/* Apple iOS Activity Indicator — 12 pill-shaped bars */}
          <div
            role="status"
            aria-label="Loading"
            aria-live="polite"
            className="iphone-spinner"
            style={{
              '--spinner-size':  '96px',
              '--spinner-color': '#3a3a3c',
              '--spinner-speed': '1s',
              '--bar-width':     '9px',
              '--bar-height':    '24px',
              '--bar-gap':       '14px',
            } as React.CSSProperties}
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <span key={i} aria-hidden="true" />
            ))}
          </div>

          {/* Subtle label */}
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="text-[11px] font-medium text-slate-400 tracking-[0.22em] uppercase select-none"
            aria-hidden="true"
          >
            SVU StaffSync AttendPro
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

