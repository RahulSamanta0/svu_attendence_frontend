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
import Sidebar from '@/components/Sidebar';
import AuthWrapper from '@/components/AuthWrapper';
import LogoutButton from '@/components/LogoutButton';
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
      <body className={`${inter.className} bg-white text-slate-800 min-h-screen flex flex-col md:flex-row max-md:pb-16`}>
        <AuthWrapper>
          <GlobalLoader />

          {/* Modern Collapsible Sidebar */}
          <Sidebar />

          {/* Main Content Area */}
          <main className="flex-1 flex flex-col min-w-0 h-screen md:h-auto overflow-y-auto md:overflow-visible">

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
            <div className="flex flex-col items-center justify-center w-full h-full text-slate-500">
              <LogoutButton variant="mobile" />
            </div>
          </nav>
        </AuthWrapper>
      </body>
    </html>
  );
}

