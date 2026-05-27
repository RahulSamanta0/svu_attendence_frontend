import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  FileSpreadsheet,
  CheckSquare
} from 'lucide-react';
import LogoutButton from '@/components/LogoutButton';
import UserProfile from '@/components/UserProfile';
import Sidebar from '@/components/Sidebar';

import GlobalLoader from '@/components/GlobalLoader';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Attendance Admin Portal',
  description: 'Professional SVU StaffSync AttendPro Portal',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-50/40 text-slate-800 min-h-screen flex flex-col md:flex-row max-md:pb-16`}>
        <GlobalLoader />

        {/* Modern Collapsible Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 h-screen md:h-auto overflow-y-auto md:overflow-visible">

          {/* Header Portal matching the Sage design rules but keeping your original title */}
          <header className="h-16 bg-white border-b border-slate-200/60 flex items-center px-4 md:px-8 shadow-sm z-10 sticky top-0 shrink-0">
            <div className="flex items-center md:hidden mr-3">
              <div className="flex items-center justify-center shrink-0">
                <svg viewBox="0 0 24 24" fill="currentColor" className="text-slate-900 w-6 h-6">
                  <path d="M 8 0 L 16 0 L 16 8 L 24 8 L 24 16 A 8 8 0 0 0 16 24 L 8 24 L 8 16 L 0 16 L 0 8 A 8 8 0 0 0 8 0 Z" />
                </svg>
              </div>
            </div>
            <h2 className="text-[10px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Dashboard Portal</h2>

            <div className="ml-auto flex items-center">
              <UserProfile variant="header" />
              <LogoutButton variant="header" />
            </div>
          </header>

          {/* Page Body Viewport */}
          <div className="p-4 md:p-8 flex-1 overflow-x-hidden">
            {children}
          </div>

        </main>

        {/* Mobile Bottom Tab Bar */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around items-center h-16 z-50 pb-safe">
          <Link href="/" className="flex flex-col items-center justify-center gap-1 w-full h-full text-slate-500 hover:text-indigo-600">
            <LayoutDashboard size={20} />
            <span className="text-[9px] font-bold">Analytics</span>
          </Link>
          <Link href="/attendance" className="flex flex-col items-center justify-center gap-1 w-full h-full text-slate-500 hover:text-indigo-600">
            <CheckSquare size={20} />
            <span className="text-[9px] font-bold">Attend</span>
          </Link>
          <Link href="/roster" className="flex flex-col items-center justify-center gap-1 w-full h-full text-slate-500 hover:text-indigo-600">
            <Users size={20} />
            <span className="text-[9px] font-bold">Roster</span>
          </Link>
          <Link href="/reports" className="flex flex-col items-center justify-center gap-1 w-full h-full text-slate-500 hover:text-indigo-600">
            <FileSpreadsheet size={20} />
            <span className="text-[9px] font-bold">Reports</span>
          </Link>
        </nav>
      </body>
    </html>
  );
}
