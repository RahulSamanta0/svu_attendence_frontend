'use client';

import { motion, AnimatePresence } from 'framer-motion';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastNotificationProps {
  toasts: Toast[];
  onClose: (id: string) => void;
}

export default function ToastNotification({ toasts, onClose }: ToastNotificationProps) {
  const getColors = (type: Toast['type']) => {
    switch (type) {
      case 'success':
        return {
          stroke: '#10B981',
          fill: '#10B981',
          titleColor: 'text-[#10B981]',
          titleText: 'Success !',
          bgClass: 'bg-gradient-to-r from-emerald-400/20 to-emerald-500/5 border-emerald-400/30 shadow-emerald-500/20',
        };
      case 'error':
        return {
          stroke: '#EF4444',
          fill: '#EF4444',
          titleColor: 'text-red-500',
          titleText: 'Error !',
          bgClass: 'bg-gradient-to-r from-red-400/20 to-red-500/5 border-red-400/30 shadow-red-500/20',
        };
      case 'info':
      default:
        return {
          stroke: '#6366F1',
          fill: '#6366F1',
          titleColor: 'text-indigo-500',
          titleText: 'Info !',
          bgClass: 'bg-gradient-to-r from-indigo-400/20 to-indigo-500/5 border-indigo-400/30 shadow-indigo-500/20',
        };
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col-reverse gap-3 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const { stroke, fill, titleColor, titleText, bgClass } = getColors(toast.type);

          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, x: 80, scale: 0.9, y: 20 }}
              animate={{
                opacity: 1,
                x: 0,
                scale: 1,
                y: 0,
                transition: {
                  type: 'spring',
                  stiffness: 300,
                  damping: 24,
                  mass: 0.8,
                },
              }}
              exit={{
                opacity: 0,
                scale: 0.85,
                x: 60,
                transition: {
                  duration: 0.2,
                  ease: 'easeInOut',
                },
              }}
              className={`relative z-50 flex w-full h-24 overflow-hidden backdrop-blur-xl shadow-xl rounded-xl border pointer-events-auto ${bgClass}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" height="96" width="16" className="shrink-0">
                <path
                  strokeLinecap="round"
                  strokeWidth="2"
                  stroke={stroke}
                  fill={fill}
                  d="M 8 0 
                     Q 4 4.8, 8 9.6 
                     T 8 19.2 
                     Q 4 24, 8 28.8 
                     T 8 38.4 
                     Q 4 43.2, 8 48 
                     T 8 57.6 
                     Q 4 62.4, 8 67.2 
                     T 8 76.8 
                     Q 4 81.6, 8 86.4 
                     T 8 96 
                     L 0 96 
                     L 0 0 
                     Z"
                ></path>
              </svg>
              <div className="mx-3.5 overflow-hidden w-full flex flex-col justify-center">
                <p className={`text-md font-bold leading-5 mr-3 overflow-hidden text-ellipsis whitespace-nowrap ${titleColor}`}>
                  {titleText}
                </p>
                <p className="overflow-hidden leading-4 text-slate-500 text-[11px] font-medium mt-1 pr-2 break-words max-h-12 line-clamp-2">
                  {toast.message}
                </p>
              </div>
              <button
                onClick={() => onClose(toast.id)}
                className="w-12 flex items-center justify-center shrink-0 cursor-pointer focus:outline-none hover:bg-slate-50/50 transition-colors"
              >
                <svg
                  className="w-5 h-5 opacity-60 hover:opacity-100 transition-opacity"
                  fill="none"
                  stroke={stroke}
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
