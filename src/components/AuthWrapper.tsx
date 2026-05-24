'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setIsAuthenticated(false);
        if (pathname !== '/login') {
          router.replace('/login');
        } else {
          setIsChecking(false);
        }
      } else {
        setIsAuthenticated(true);
        if (pathname === '/login') {
          router.replace('/');
        } else {
          setIsChecking(false);
        }
      }
    };

    checkAuth();
  }, [pathname, router]);

  // Show a full-screen loading spinner while checking auth to prevent FOUC
  // (Flash Of Unauthenticated Content)
  if (isChecking) {
    return (
      <div className="fixed inset-0 z-[200] bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-indigo-600" size={32} />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest animate-pulse">
            Authenticating...
          </p>
        </div>
      </div>
    );
  }

  // If we are authenticated, or we are on the login page, render the layout
  return <>{children}</>;
}
