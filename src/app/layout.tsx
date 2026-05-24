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

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Attendance Admin Portal',
  description: 'Professional SVU Employee Attendance & Roster Directory Portal',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-50/40 text-slate-800 min-h-screen flex flex-col md:flex-row max-md:pb-16`}>

        {/* Sleek Minimalist Sidebar with Original Links - Hidden on Mobile */}
        <aside className="hidden md:flex w-64 bg-white border-r border-slate-200/60 h-screen sticky top-0 flex-col shadow-sm z-20 shrink-0">

          {/* Logo Brand Container */}
          <div className="h-16 flex items-center px-6 border-b border-slate-100/80">
            <div className="w-8.5 h-8.5 bg-indigo-600 rounded-sm flex items-center justify-center mr-3 shadow-sm shadow-indigo-100/80 shrink-0">
              <LayoutDashboard size={16} className="text-white" />
            </div>
            <h1 className="text-base font-extrabold text-slate-900 tracking-tight">AttenAdmin</h1>
          </div>

          {/* Navigation Links Group */}
          <nav className="flex-1 p-4 flex flex-col gap-1.5 mt-3">
            <p className="px-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">Main Menu</p>

            <Link
              href="/"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-sm text-xs font-bold text-slate-600 hover:text-indigo-650 hover:bg-slate-50 transition-all"
            >
              <LayoutDashboard size={16} /> Analytics
            </Link>

            <Link
              href="/attendance"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-sm text-xs font-bold text-slate-600 hover:text-indigo-650 hover:bg-slate-50 transition-all"
            >
              <CheckSquare size={16} /> Mark Attendance
            </Link>

            <Link
              href="/roster"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-sm text-xs font-bold text-slate-600 hover:text-indigo-650 hover:bg-slate-50 transition-all"
            >
              <Users size={16} /> Roster Directory
            </Link>

            <Link
              href="/reports"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-sm text-xs font-bold text-slate-600 hover:text-indigo-650 hover:bg-slate-50 transition-all"
            >
              <FileSpreadsheet size={16} /> Ledger Reports
            </Link>
          </nav>
          
          <LogoutButton />
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 h-screen md:h-auto overflow-y-auto md:overflow-visible">

          {/* Header Portal matching the Sage design rules but keeping your original title */}
          <header className="h-16 bg-white border-b border-slate-200/60 flex items-center px-4 md:px-8 shadow-sm z-10 sticky top-0 shrink-0">
            <div className="flex items-center md:hidden mr-3">
               <div className="w-7 h-7 bg-indigo-600 rounded-sm flex items-center justify-center shadow-sm shadow-indigo-100/80 shrink-0">
                 <LayoutDashboard size={14} className="text-white" />
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
