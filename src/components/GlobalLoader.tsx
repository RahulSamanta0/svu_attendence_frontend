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
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] bg-white/5 backdrop-blur-sm flex flex-col items-center justify-center"
        >
          {/* Aesthetic multi-shape loader */}
          <div className="flex items-center justify-center scale-90">
            <div className="loader">
              <svg viewBox="0 0 80 80">
                <circle r="32" cy="40" cx="40" id="test"></circle>
              </svg>
            </div>

            <div className="loader triangle">
              <svg viewBox="0 0 86 80">
                <polygon points="43 8 79 72 7 72"></polygon>
              </svg>
            </div>

            <div className="loader">
              <svg viewBox="0 0 80 80">
                <rect height="64" width="64" y="8" x="8"></rect>
              </svg>
            </div>
          </div>
          
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-14 text-xs font-black text-indigo-950/80 tracking-[0.3em] uppercase drop-shadow-sm"
          >
            SVU StaffSync AttendPro
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
