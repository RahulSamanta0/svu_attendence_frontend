'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function GlobalLoader() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          className="fixed inset-0 z-[9999] bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-5"
        >
          {/* iPhone-style Activity Indicator */}
          <div className="iphone-spinner text-slate-500" style={{ width: 48, height: 48 }}>
            {Array.from({ length: 12 }).map((_, i) => (
              <span key={i} />
            ))}
          </div>

          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-[11px] font-semibold text-slate-400 tracking-[0.25em] uppercase"
          >
            SVU StaffSync AttendPro
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
