'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function GlobalLoader() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Only trigger loading sequence if we're on the analytics page (root '/')
    if (pathname === '/') {
      setLoading(true);
      const timer = setTimeout(() => {
        setLoading(false);
      }, 2000);

      return () => clearTimeout(timer);
    } else {
      setLoading(false);
    }
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
          {/* Aesthetic 3D spinner */}
          <div className="spinner">
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
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
