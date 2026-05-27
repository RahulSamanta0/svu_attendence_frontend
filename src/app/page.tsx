'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { format } from 'date-fns';
import { utils, writeFile } from 'xlsx';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  Loader2,
  Search,
  SlidersHorizontal,
  Calendar,
  Download,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
  Check
} from 'lucide-react';


const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

type Person = { _id: string; name: string; employeeId: string };
type ReportRow = {
  date: string;
  personId: string;
  name: string;
  employeeId: string;
  status: 'Present' | 'Absent' | 'Late';
  checkInTime: string;
  checkOutTime: string;
  isEarlyCheckOut: boolean;
};

type Toast = {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
};

export default function AnalyticsDashboard() {
  const router = useRouter();
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [persons, setPersons] = useState<Person[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, ReportRow>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Interactive filters state
  const [showActive, setShowActive] = useState(true);
  const [showAbsent, setShowAbsent] = useState(true);
  const [showLeave, setShowLeave] = useState(true);
  const [showRoleFilter, setShowRoleFilter] = useState(false);
  const [activeRoles, setActiveRoles] = useState<string[]>([
    'UI/UX Designer',
    'Product Designer',
    'Marketing Officer',
    'Content Writer',
    'UX Engineer',
    'Software Developer'
  ]);

  const allRoles = [
    'UI/UX Designer',
    'Product Designer',
    'Marketing Officer',
    'Content Writer',
    'UX Engineer',
    'Software Developer'
  ];

  // Generate date markers for the current week (Sunday to Saturday)
  const getWeekDates = () => {
    const today = new Date();
    const currentDayOfWeek = today.getDay(); // 0 is Sunday, 6 is Saturday
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - currentDayOfWeek + i);
      return {
        dateObj: d,
        dateStr: d.toISOString().split('T')[0],
        dayNum: d.getDate(),
        dayName: d.toLocaleDateString('en-US', { weekday: 'long' }),
        isToday: d.toISOString().split('T')[0] === new Date().toISOString().split('T')[0]
      };
    });
  };

  const weekDates = getWeekDates();

  useEffect(() => {
    const validateSession = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.replace('/login');
        return;
      }
      try {
        await axios.get(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsAuthChecking(false);
        fetchDashboardData();
      } catch (err) {
        console.error('Session invalid', err);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.replace('/login');
      }
    };
    
    validateSession();
  }, [router]);

  const addToast = (message: string, type: 'success' | 'error' | 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const startDate = weekDates[0].dateStr;
      const endDate = weekDates[6].dateStr;

      const [personsRes, reportsRes] = await Promise.all([
        axios.get(`${API_URL}/persons`),
        axios.get(`${API_URL}/reports`, { params: { startDate, endDate } })
      ]);

      const lookup: Record<string, ReportRow> = {};
      
      let personsData = personsRes.data;
      let reportsData = reportsRes.data;

      setPersons(personsData);

      reportsData.forEach((r: any) => {
        const pid = typeof r.personId === 'object' ? r.personId._id : r.personId;
        const dStr = r.date.split('T')[0];
        lookup[`${pid}_${dStr}`] = r;
      });
      setAttendanceMap(lookup);
    } catch (err) {
      console.error(err);
      addToast('Failed to fetch attendance grid data.', 'error');
      setPersons([]);
      setAttendanceMap({});
    } finally {
      setLoading(false);
    }
  };

  // Mock designation based on name character code hashes
  const getDesignation = (name: string) => {
    const roles = [
      'UI/UX Designer',
      'Product Designer',
      'Marketing Officer',
      'Content Writer',
      'UX Engineer',
      'Software Developer'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return roles[Math.abs(hash) % roles.length];
  };

  const getAvatarGradient = (name: string) => {
    const gradients = [
      'from-indigo-100/80 to-indigo-50 text-indigo-700 border-indigo-200/60 shadow-indigo-100/30',
      'from-emerald-100/80 to-emerald-50 text-emerald-700 border-emerald-200/60 shadow-emerald-100/30',
      'from-rose-100/80 to-rose-50 text-rose-700 border-rose-200/60 shadow-rose-100/30',
      'from-amber-100/80 to-amber-50 text-amber-700 border-amber-200/60 shadow-amber-100/30',
      'from-sky-100/80 to-sky-50 text-sky-700 border-sky-200/60 shadow-sky-100/30',
      'from-fuchsia-100/80 to-fuchsia-50 text-fuchsia-700 border-fuchsia-200/60 shadow-fuchsia-100/30'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return gradients[Math.abs(hash) % gradients.length];
  };

  // KPIs
  const todayStr = new Date().toISOString().split('T')[0];
  const presentToday = persons.filter(p => attendanceMap[`${p._id}_${todayStr}`]?.status === 'Present').length;
  const lateToday = persons.filter(p => attendanceMap[`${p._id}_${todayStr}`]?.status === 'Late').length;
  const absentToday = persons.filter(p => attendanceMap[`${p._id}_${todayStr}`]?.status === 'Absent').length;
  const totalEmployees = persons.length;

  // Real-time search matching
  const searchedPersons = persons.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.employeeId || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Role Filtering
  const roleFilteredPersons = searchedPersons.filter(p =>
    activeRoles.includes(getDesignation(p.name))
  );

  // Capsule status filters
  const finalFilteredPersons = roleFilteredPersons.filter(person => {
    const statuses = weekDates.map(day => {
      const rec = attendanceMap[`${person._id}_${day.dateStr}`];
      if (rec) return rec.status;
      const isFuture = new Date(day.dateStr) > new Date();
      return isFuture ? 'Future' : 'Leave';
    });

    const hasActiveStatus = statuses.includes('Present') || statuses.includes('Late');
    const hasAbsentStatus = statuses.includes('Absent');
    const hasLeaveStatus = statuses.includes('Leave');

    if (!showActive && hasActiveStatus) return false;
    if (!showAbsent && hasAbsentStatus) return false;
    if (!showLeave && hasLeaveStatus) return false;

    return true;
  });

  const toggleRole = (role: string) => {
    setActiveRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const handleExcelExport = () => {
    try {
      if (finalFilteredPersons.length === 0) {
        addToast('No data available in the current grid view.', 'info');
        return;
      }

      const excelData = finalFilteredPersons.map(person => {
        const rowData: Record<string, string> = {
          Employee: person.name,
          'Employee ID': person.employeeId,
          Designation: getDesignation(person.name)
        };

        weekDates.forEach(day => {
          const rec = attendanceMap[`${person._id}_${day.dateStr}`];
          const isFuture = new Date(day.dateStr) > new Date();
          let statusText = 'Leave';
          if (rec) {
            statusText = rec.status === 'Present' ? 'Present (8 Hours)' : rec.status === 'Late' ? 'Late (4h 36m)' : 'Absent';
          } else if (isFuture) {
            statusText = '-';
          }
          rowData[`${day.dayName} (${day.dayNum})`] = statusText;
        });

        return rowData;
      });

      const worksheet = utils.json_to_sheet(excelData);
      const workbook = utils.book_new();
      utils.book_append_sheet(workbook, worksheet, "Weekly Shift Report");
      writeFile(workbook, `SVU_Weekly_Attendance_Report_${format(new Date(), 'yyyyMMdd')}.xlsx`);
      addToast('Weekly Shift Attendance Report successfully downloaded!', 'success');
    } catch (err) {
      console.error(err);
      addToast('Failed to export Excel spreadsheet.', 'error');
    }
  };

  if (isAuthChecking) {
    return (
      <div className="fixed inset-0 z-[200] bg-slate-50 flex items-center justify-center">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest animate-pulse">Authenticating...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12 text-slate-800 relative">

      {/* Toast Notification Container */}
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8, x: 50 }}
              className={`p-4 rounded-sm shadow-sm border backdrop-blur-md pointer-events-auto flex items-center gap-3 ${toast.type === 'success'
                ? 'bg-emerald-50/95 border-emerald-200/80 text-emerald-800'
                : toast.type === 'error'
                  ? 'bg-rose-50/95 border-rose-200/80 text-rose-800'
                  : 'bg-indigo-50/95 border-indigo-200/80 text-indigo-800'
                }`}
            >
              {toast.type === 'success' && <CheckCircle2 className="text-emerald-500 shrink-0" size={20} />}
              {toast.type === 'error' && <AlertCircle className="text-rose-500 shrink-0" size={20} />}
              {toast.type === 'info' && <AlertCircle className="text-indigo-500 shrink-0" size={20} />}
              <span className="text-sm font-semibold">{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Dashboard Top Title Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Employee Attendance</h1>
          <p className="text-slate-400 text-xs mt-0.5 font-medium">Analyse attendance records of employee</p>
        </div>
      </div>

      {/* KPI Cards Section matching Sage UI exactly */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">

        {/* Card 1: Present Today */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08, ease: "easeOut" }}
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          className="bg-white p-5 rounded-sm border border-emerald-200 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col justify-between min-h-[120px] group hover:border-emerald-400 hover:shadow-[0_15px_30px_rgba(16,185,129,0.08)] transition-all duration-300 cursor-pointer"
        >
          <div className="flex items-center gap-2.5 text-slate-500 text-xs font-bold">
            <div className="w-7 h-7 rounded-sm bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
              <CheckCircle2 size={14} />
            </div>
            <span>Present Today</span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-800 leading-none">{presentToday}</h3>
            <p className="text-[10px] text-slate-400 font-bold mt-1.5">
              {totalEmployees - presentToday} People Remaining
            </p>
          </div>
        </motion.div>

        {/* Card 2: Late Entry */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.14, ease: "easeOut" }}
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          className="bg-white p-5 rounded-sm border border-amber-200 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col justify-between min-h-[120px] group hover:border-amber-400 hover:shadow-[0_15px_30px_rgba(245,158,11,0.08)] transition-all duration-300 cursor-pointer"
        >
          <div className="flex items-center gap-2.5 text-slate-500 text-xs font-bold">
            <div className="w-7 h-7 rounded-sm bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
              <Clock size={14} />
            </div>
            <span>Late Entry</span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-800 leading-none">{lateToday}</h3>
            <p className="text-[10px] text-slate-400 font-bold mt-1.5">
              {presentToday - lateToday} People are on Time
            </p>
          </div>
        </motion.div>

        {/* Card 3: On Leave */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          className="bg-white p-5 rounded-sm border border-indigo-200 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col justify-between min-h-[120px] group hover:border-indigo-400 hover:shadow-[0_15px_30px_rgba(99,102,241,0.08)] transition-all duration-300 cursor-pointer"
        >
          <div className="flex items-center gap-2.5 text-slate-500 text-xs font-bold">
            <div className="w-7 h-7 rounded-sm bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
              <Sparkles size={14} />
            </div>
            <span>On Leave</span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-800 leading-none">0</h3>
            <p className="text-[10px] text-slate-400 font-bold mt-1.5">Approved Leave</p>
          </div>
        </motion.div>

        {/* Card 4: Absent */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.26, ease: "easeOut" }}
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          className="bg-white p-5 rounded-sm border border-rose-200 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col justify-between min-h-[120px] group hover:border-rose-400 hover:shadow-[0_15px_30px_rgba(244,63,94,0.08)] transition-all duration-300 cursor-pointer"
        >
          <div className="flex items-center gap-2.5 text-slate-500 text-xs font-bold">
            <div className="w-7 h-7 rounded-sm bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
              <UserX size={14} />
            </div>
            <span>Absent</span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-800 leading-none">{absentToday}</h3>
            <p className="text-[10px] text-slate-400 font-bold mt-1.5">Without Informing</p>
          </div>
        </motion.div>

      </div>

      {/* Filter and Query bar matching Sage screenshot */}
      <div className="bg-white p-4.5 rounded-md border border-slate-200 shadow-sm flex flex-col gap-4 mt-1 relative">

        {/* Secondary Filter Line */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Inner Search Box */}
          <div className="relative flex-1 w-full max-w-sm">
            <input
              type="text"
              placeholder="Search anything ..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-sm text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50 placeholder-slate-400 font-semibold"
            />
            <Search size={14} className="absolute left-3 top-3.5 text-slate-400 pointer-events-none" />
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto justify-start sm:justify-end relative">

            {/* Filter Roles dropdown */}
            <button
              onClick={() => setShowRoleFilter(prev => !prev)}
              className={`flex items-center gap-1.5 px-3.5 py-2 border rounded-sm text-xs font-bold shadow-sm cursor-pointer shrink-0 transition-colors ${showRoleFilter
                ? 'bg-indigo-50 border-indigo-250 text-indigo-755'
                : 'bg-white border-slate-200 text-slate-605 hover:bg-slate-50'
                }`}
            >
              <SlidersHorizontal size={13} className={showRoleFilter ? 'text-indigo-600' : 'text-slate-400'} /> Filter Roles ({activeRoles.length})
            </button>

            {/* Date display card */}
            <div className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 bg-white rounded-sm text-xs font-bold text-slate-600 shadow-sm shrink-0">
              <Calendar size={13} className="text-slate-400" /> {format(new Date(), 'dd, MMMM yyyy')}
            </div>

            {/* Float Role Filters Overlay */}
            <AnimatePresence>
              {showRoleFilter && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 top-11 z-30 w-56 bg-white border border-slate-200 rounded-md shadow-xl p-4 flex flex-col gap-2.5"
                >
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Roles</span>
                    <button
                      onClick={() => setActiveRoles(activeRoles.length === allRoles.length ? [] : allRoles)}
                      className="text-[9px] font-extrabold text-indigo-650 hover:underline cursor-pointer"
                    >
                      {activeRoles.length === allRoles.length ? 'Clear' : 'Select All'}
                    </button>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    {allRoles.map(role => {
                      const isSelected = activeRoles.includes(role);
                      return (
                        <button
                          key={role}
                          onClick={() => toggleRole(role)}
                          className="flex items-center justify-between text-left text-[11px] font-bold text-slate-655 hover:text-slate-900 transition-colors w-full cursor-pointer"
                        >
                          <span>{role}</span>
                          <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'
                            }`}>
                            {isSelected && <Check size={10} strokeWidth={3} />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>

        {/* Filter pills capsules matching image */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">

          {/* Active/Inactive Leave capsule */}
          {showLeave ? (
            <button
              onClick={() => {
                setShowLeave(false);
                addToast('Hidden On-Leave employees.', 'info');
              }}
              className="px-3 py-1 bg-slate-100 border border-slate-200 text-slate-655 font-bold text-[10px] rounded-sm flex items-center gap-1 cursor-pointer transition-all hover:bg-slate-200"
              title="Click to hide Leave category"
            >
              Leave <span className="text-[9px] text-slate-400 font-black ml-0.5">×</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setShowLeave(true);
                addToast('Restored On-Leave employees filter.', 'success');
              }}
              className="px-3 py-1 border border-slate-200 border-dashed text-slate-400 font-bold text-[10px] rounded-sm flex items-center gap-1 cursor-pointer hover:bg-slate-50 transition-all"
            >
              + Leave Filter
            </button>
          )}

          {/* Active/Inactive Absent capsule */}
          {showAbsent ? (
            <button
              onClick={() => {
                setShowAbsent(false);
                addToast('Hidden Absent employees.', 'info');
              }}
              className="px-3 py-1 bg-slate-100 border border-slate-200 text-slate-655 font-bold text-[10px] rounded-sm flex items-center gap-1 cursor-pointer transition-all hover:bg-slate-200"
              title="Click to hide Absent category"
            >
              Absent <span className="text-[9px] text-slate-400 font-black ml-0.5">×</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setShowAbsent(true);
                addToast('Restored Absent employees filter.', 'success');
              }}
              className="px-3 py-1 border border-slate-200 border-dashed text-slate-400 font-bold text-[10px] rounded-sm flex items-center gap-1 cursor-pointer hover:bg-slate-50 transition-all"
            >
              + Absent Filter
            </button>
          )}

          {/* Active/Inactive Active/Present capsule */}
          {showActive ? (
            <button
              onClick={() => {
                setShowActive(false);
                addToast('Hidden Present & Late employees.', 'info');
              }}
              className="px-3 py-1 bg-slate-100 border border-slate-200 text-slate-655 font-bold text-[10px] rounded-sm flex items-center gap-1 cursor-pointer transition-all hover:bg-slate-200"
              title="Click to hide Active category"
            >
              Active <span className="text-[9px] text-slate-400 font-black ml-0.5">×</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setShowActive(true);
                addToast('Restored Present & Late employees filter.', 'success');
              }}
              className="px-3 py-1 border border-slate-200 border-dashed text-slate-400 font-bold text-[10px] rounded-sm flex items-center gap-1 cursor-pointer hover:bg-slate-50 transition-all"
            >
              + Active Filter
            </button>
          )}

        </div>

      </div>

      {/* Primary Weekly Shift Attendance Grid */}
      <div className="bg-white border border-slate-200 rounded-md overflow-hidden shadow-sm mt-1">
        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center text-slate-500">
            <Loader2 size={32} className="animate-spin mb-4 text-indigo-500" />
            <p className="font-bold text-xs">Loading ledger grid...</p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[1000px]">

              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200/80">
                  <th className="px-6 py-4 font-bold text-slate-450 text-[11px] uppercase tracking-wider w-1/4">Employee</th>
                  {weekDates.map((day) => (
                    <th key={day.dateStr} className="px-4 py-4 font-bold text-slate-800 text-xs w-1/12">
                      <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-none mb-0.5">
                        {day.dayName.substring(0, 3)}
                      </span>
                      <span className="text-sm font-black leading-none">{day.dayNum}</span>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {finalFilteredPersons.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-16 text-center text-slate-400 font-bold text-xs">
                      No SVU employees match the selected filters or roles.
                    </td>
                  </tr>
                ) : (
                  finalFilteredPersons.map((person) => (
                    <tr key={person._id} className="hover:bg-slate-50/20 transition-colors">

                      {/* Employee column with avatar, name, and designation */}
                      <td className="px-5 py-3.5 flex items-center gap-3">
                        {/* Improved modern avatar with circle mask */}
                        <div className={`w-9 h-9 rounded-full bg-gradient-to-br border flex items-center justify-center font-black shrink-0 uppercase transition-transform duration-300 hover:scale-105 shadow-sm ${getAvatarGradient(person.name)}`}>
                          {person.name.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="font-bold text-slate-800 block truncate text-xs" title={person.name}>
                            {person.name}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 block mt-0.5">
                            {getDesignation(person.name)}
                          </span>
                        </div>
                      </td>

                      {/* Sunday - Saturday Columns */}
                      {weekDates.map((day) => {
                        const rec = attendanceMap[`${person._id}_${day.dateStr}`];
                        const isFuture = new Date(day.dateStr) > new Date();

                        // Visual styling based on real database records
                        if (rec) {
                          if (rec.status === 'Present') {
                            return (
                              <td key={day.dateStr} className="px-3 py-4">
                                <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-[10px] rounded-sm shadow-sm">
                                  ✓ 8 Hours
                                </span>
                              </td>
                            );
                          } else if (rec.status === 'Late') {
                            return (
                              <td key={day.dateStr} className="px-3 py-4">
                                <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-50 border border-amber-250 text-amber-705 font-bold text-[10px] rounded-sm shadow-sm">
                                  🕒 4h 36m
                                </span>
                              </td>
                            );
                          } else {
                            return (
                              <td key={day.dateStr} className="px-3 py-4">
                                <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-50 border border-rose-250 text-rose-705 font-bold text-[10px] rounded-sm shadow-sm">
                                  ⊗ Absent
                                </span>
                              </td>
                            );
                          }
                        }

                        // Fallbacks if no record exists
                        if (isFuture) {
                          // Future days render stripes
                          return (
                            <td key={day.dateStr} className="p-0 border-r border-slate-100/50">
                              <div className="w-full h-full min-h-[48px] bg-stripes bg-[length:12px_12px] opacity-25" />
                            </td>
                          );
                        }

                        // Past days with no record display Leave pill
                        return (
                          <td key={day.dateStr} className="px-3 py-4">
                            <span className="inline-flex items-center px-3 py-1.5 bg-purple-50 border border-purple-200 text-purple-800 font-bold text-[10px] rounded-sm shadow-sm">
                              Leave
                            </span>
                          </td>
                        );
                      })}

                    </tr>
                  ))
                )}
              </tbody>

            </table>
          </div>
        )}
      </div>

    </div>
  );
}
