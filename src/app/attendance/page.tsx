'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
  Save,
  Loader2,
  Search,
  LayoutGrid,
  List,
  RotateCcw,
  AlertCircle,
  Calendar,
  Sparkles,
  TrendingUp,
  UserCheck,
  UserX,
  ArrowUpDown
} from 'lucide-react';


const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

type Person = { _id: string; name: string; employeeId: string };
type Status = 'Present' | 'Absent' | 'Late';

type AttendanceRecord = {
  status: Status;
  checkInTime: string;
  checkOutTime: string;
  isEarlyCheckOut: boolean;
  leaveReason: string;
};

type Toast = {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
};

export default function AttendancePage() {
  const router = useRouter();
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [records, setRecords] = useState<Record<string, AttendanceRecord>>({});
  const [originalRecords, setOriginalRecords] = useState<Record<string, AttendanceRecord>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Custom interactive controls
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Present' | 'Absent' | 'Late'>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Sorting & Size Density states
  const [sortBy, setSortBy] = useState<'name' | 'id' | 'status'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [cardSize, setCardSize] = useState<'compact' | 'comfortable'>('comfortable');

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      router.replace('/login');
    } else {
      setIsAuthChecking(false);
      fetchData();
    }
  }, [date, router]);

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const [year, month, day] = date.split('-');
  const selectedDateObj = new Date(Number(year), Number(month) - 1, Number(day));
  const isWeekend = selectedDateObj.getDay() === 0 || selectedDateObj.getDay() === 6;

  useEffect(() => {
    if (isWeekend && !isAuthChecking) {
      addToast('Weekend holiday: attendance is not recorded.', 'info');
    }
  }, [isWeekend, addToast, isAuthChecking]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [personsRes, attRes] = await Promise.all([
        axios.get(`${API_URL}/persons`),
        axios.get(`${API_URL}/attendance`, { params: { date } })
      ]);

      let personsData = personsRes.data;
      let reportsData = attRes.data?.records;

      setPersons(personsData);

      const newRecords: Record<string, AttendanceRecord> = {};

      // Initialize defaults for staff members
      personsData.forEach((p: Person) => {
        newRecords[p._id] = { status: 'Absent', checkInTime: '', checkOutTime: '', isEarlyCheckOut: false, leaveReason: '' };
      });

      if (reportsData) {
        reportsData.forEach((r: any) => {
          const pid = typeof r.personId === 'object' ? r.personId._id : r.personId;
          newRecords[pid] = {
            status: r.status,
            checkInTime: r.checkInTime || '',
            checkOutTime: r.checkOutTime || '',
            isEarlyCheckOut: r.isEarlyCheckOut || false,
            leaveReason: r.leaveReason || ''
          };
        });
      }
      setRecords(newRecords);
      setOriginalRecords(JSON.parse(JSON.stringify(newRecords)));
    } catch (err) {
      console.error(err);
      addToast('Failed to retrieve roster data from server.', 'error');
      setPersons([]);
      setRecords({});
      setOriginalRecords({});
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (personId: string, status: Status) => {
    setRecords(prev => {
      const current = prev[personId];
      if (status === 'Absent') {
        return {
          ...prev,
          [personId]: { status, checkInTime: '', checkOutTime: '', isEarlyCheckOut: false, leaveReason: current.leaveReason || '' }
        };
      }
      const updatedCheckIn = current.checkInTime || (status === 'Late' ? '12:00' : '11:30');
      const updatedCheckOut = current.checkOutTime || '19:00';
      return {
        ...prev,
        [personId]: { ...current, status, checkInTime: updatedCheckIn, checkOutTime: updatedCheckOut }
      };
    });
  };

  const handleTimeChange = (personId: string, field: 'checkInTime' | 'checkOutTime', value: string) => {
    setRecords(prev => ({
      ...prev,
      [personId]: { ...prev[personId], [field]: value }
    }));
  };

  const handleEarlyToggle = (personId: string) => {
    setRecords(prev => ({
      ...prev,
      [personId]: { ...prev[personId], isEarlyCheckOut: !prev[personId]?.isEarlyCheckOut }
    }));
  };

  const handleLeaveReasonChange = (personId: string, value: string) => {
    setRecords(prev => ({
      ...prev,
      [personId]: { ...prev[personId], leaveReason: value }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const recordsArray = Object.entries(records).map(([personId, data]) => ({
        personId,
        status: data.status,
        checkInTime: data.checkInTime,
        checkOutTime: data.checkOutTime,
        isEarlyCheckOut: data.checkOutTime ? data.checkOutTime < '19:00' : false,
        leaveReason: data.leaveReason
      }));
      await axios.post(`${API_URL}/attendance`, { date, records: recordsArray });
      setOriginalRecords(JSON.parse(JSON.stringify(records)));
      addToast('All attendance records successfully updated!', 'success');
    } catch (err) {
      console.error(err);
      addToast('Could not save attendance data. Please try again.', 'error');
    } finally {
      setTimeout(() => setSaving(false), 300);
    }
  };

  const changeDate = (days: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    setDate(d.toISOString().split('T')[0]);
  };

  const getDaysOfWeek = (centerDateStr: string) => {
    const days = [];
    const centerDate = new Date(centerDateStr);

    for (let i = -3; i <= 3; i++) {
      const d = new Date(centerDate);
      d.setDate(centerDate.getDate() + i);
      const dStr = d.toISOString().split('T')[0];
      days.push({
        dateStr: dStr,
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNum: d.getDate(),
        monthName: d.toLocaleDateString('en-US', { month: 'short' }),
        isToday: dStr === new Date().toISOString().split('T')[0]
      });
    }
    return days;
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
    const index = Math.abs(hash) % gradients.length;
    return gradients[index];
  };

  const markAllPresent = () => {
    const updated = { ...records };
    persons.forEach(p => {
      const current = updated[p._id] || { status: 'Absent', checkInTime: '', checkOutTime: '', isEarlyCheckOut: false, leaveReason: '' };
      updated[p._id] = {
        ...current,
        status: 'Present',
        checkInTime: current.checkInTime || '11:30',
        checkOutTime: current.checkOutTime || '19:00'
      };
    });
    setRecords(updated);
    addToast('Marked all employees as Present', 'success');
  };

  const markAllAbsent = () => {
    const updated = { ...records };
    persons.forEach(p => {
      updated[p._id] = {
        status: 'Absent',
        checkInTime: '',
        checkOutTime: '',
        isEarlyCheckOut: false,
        leaveReason: ''
      };
    });
    setRecords(updated);
    addToast('Marked all employees as Absent', 'info');
  };

  const resetToOriginal = () => {
    setRecords(JSON.parse(JSON.stringify(originalRecords)));
    addToast('Restored original records for this date', 'info');
  };

  // KPIs
  const totalPresent = Object.values(records).filter(s => s.status === 'Present').length;
  const totalAbsent = Object.values(records).filter(s => s.status === 'Absent').length;
  const totalLate = Object.values(records).filter(s => s.status === 'Late').length;
  const totalRecorded = persons.length;
  const attendanceRate = totalRecorded > 0 ? Math.round(((totalPresent + totalLate) / totalRecorded) * 100) : 0;

  // Unsaved changes tracker
  const hasUnsavedChanges = JSON.stringify(records) !== JSON.stringify(originalRecords);

  // Filters logic
  const filteredPersons = persons.filter(p => {
    const nameMatch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const rollMatch = (p.employeeId || '').toLowerCase().includes(searchQuery.toLowerCase());
    return nameMatch || rollMatch;
  });

  const finalPersons = filteredPersons.filter(p => {
    if (statusFilter === 'All') return true;
    const rec = records[p._id];
    return rec?.status === statusFilter;
  });

  // Sorting logic
  const sortedPersons = [...finalPersons].sort((a, b) => {
    let valA = '';
    let valB = '';

    if (sortBy === 'name') {
      valA = a.name.toLowerCase();
      valB = b.name.toLowerCase();
    } else if (sortBy === 'id') {
      valA = (a.employeeId || '').toLowerCase();
      valB = (b.employeeId || '').toLowerCase();
    } else if (sortBy === 'status') {
      valA = records[a._id]?.status || 'Absent';
      valB = records[b._id]?.status || 'Absent';
    }

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // Framer Motion Animation Settings
  const listContainerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.04
      }
    }
  };

  const listItemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring' as const, stiffness: 100, damping: 15 }
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
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12 text-slate-800">

      {/* Toast Notifications */}
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

      {/* Modern Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/60 p-5 rounded-md border border-slate-200/60 backdrop-blur-sm shadow-sm"
      >
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="px-2.5 py-1 bg-indigo-50 border border-indigo-100 rounded-full flex items-center gap-1.5 w-fit text-indigo-700 font-bold text-[10px] tracking-wide">
              <Sparkles size={11} className="animate-pulse" /> SVU StaffSync AttendPro
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live View</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">SVU StaffSync AttendPro Attendance</h1>
          <p className="text-slate-500 text-xs mt-0.5">Configure states, log times, and manage attendance records for SVU employees.</p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {hasUnsavedChanges && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1.2 px-2.5 py-1.2 bg-amber-50 border border-amber-200 text-amber-700 font-bold text-[11px] rounded shrink-0"
            >
              <span className="w-1.5 h-1.5 rounded bg-amber-500 animate-ping" />
              Unsaved changes
            </motion.span>
          )}

          <button
            onClick={handleSave}
            disabled={saving || loading || persons.length === 0 || isWeekend}
            className={`flex items-center gap-1.5 font-bold text-xs py-2.5 px-5 rounded-sm transition-all shadow-sm ${hasUnsavedChanges
              ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100 hover:shadow-sm hover:-translate-y-0.5'
              : 'bg-slate-800 hover:bg-slate-950 text-white shadow-sm'
              } disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none disabled:-translate-y-0 cursor-pointer`}
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? 'Saving...' : 'Save Records'}
          </button>
        </div>
      </motion.div>

      {/* ULTRA-COMPACT Horizontal Date Navigator Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex flex-col md:flex-row items-center justify-between gap-5 bg-white/70 backdrop-blur-xl p-3 md:p-4 rounded-sm border border-white shadow-sm ring-1 ring-slate-200/50"
      >
        {/* Left: Date Selection Block */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative shrink-0">
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="pl-9 pr-3 py-2.5 bg-white border border-slate-200/60 rounded-sm text-slate-700 font-extrabold text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400/50 focus:border-indigo-400/50 transition-all shadow-sm w-36"
            />
            <Calendar size={14} className="absolute left-3 top-2.5 text-indigo-500 pointer-events-none" />
          </div>

          <div className="flex gap-1.5 p-1 bg-slate-100/50 rounded-sm border border-slate-200/50">
            <button
              onClick={() => setDate(new Date().toISOString().split('T')[0])}
              className={`px-3.5 py-1.5 text-[10.5px] font-bold rounded-sm transition-all cursor-pointer tracking-wide ${date === new Date().toISOString().split('T')[0]
                ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/50'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/30 border border-transparent'
                }`}
            >
              Today
            </button>
            <button
              onClick={() => {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                setDate(yesterday.toISOString().split('T')[0]);
              }}
              className={`px-3.5 py-1.5 text-[10.5px] font-bold rounded-sm transition-all cursor-pointer tracking-wide border border-transparent ${date === (new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split('T')[0])
                ? 'bg-white text-indigo-600 shadow-sm border-slate-200/50'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/30'
                }`}
            >
              Yesterday
            </button>
          </div>
        </div>

        {/* Right: Slim Horizontal Day Strip */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end flex-1 max-w-xl">
          <button
            onClick={() => changeDate(-1)}
            className="p-2 bg-white hover:bg-slate-50 rounded-sm text-slate-500 border border-slate-200/60 shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0 hover:text-indigo-600 hover:border-indigo-200"
          >
            <ChevronLeft size={16} />
          </button>

          <div className="flex gap-1.5 flex-1 max-w-md overflow-x-auto hide-scrollbar px-1 py-1">
            {getDaysOfWeek(date).map((day) => {
              const isSelected = day.dateStr === date;
              return (
                <button
                  key={day.dateStr}
                  onClick={() => setDate(day.dateStr)}
                  className={`flex flex-col items-center justify-center py-2 px-1.5 rounded-sm transition-all cursor-pointer min-w-[50px] shrink-0 transform ${isSelected
                    ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-md shadow-indigo-500/30 scale-105 border border-indigo-400'
                    : 'bg-transparent hover:bg-white text-slate-500 border border-transparent hover:border-slate-200/60 hover:shadow-sm hover:scale-105 hover:text-indigo-600'
                    }`}
                >
                  <span className={`text-[9px] font-extrabold uppercase tracking-widest ${isSelected ? 'text-indigo-100' : 'opacity-70'}`}>
                    {day.dayName}
                  </span>
                  <span className={`text-base font-black tracking-tight leading-none mt-1 ${isSelected ? 'text-white' : ''}`}>
                    {day.dayNum}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => changeDate(1)}
            className="p-2 bg-white hover:bg-slate-50 rounded-sm text-slate-500 border border-slate-200/60 shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0 hover:text-indigo-600 hover:border-indigo-200"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </motion.div>

      {/* Statistics Cards Dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08, ease: "easeOut" }}
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          className="bg-white p-5 rounded-sm border border-emerald-200 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex items-center justify-between group hover:border-emerald-400 hover:shadow-[0_15px_30px_rgba(16,185,129,0.08)] transition-all duration-300 cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-sm bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <UserCheck size={18} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Present</p>
              <p className="text-xl font-black text-slate-800 mt-0.5">{totalPresent}</p>
            </div>
          </div>
          <span className="hidden sm:inline-block text-[10px] font-bold px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-100">
            Active
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.14, ease: "easeOut" }}
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          className="bg-white p-5 rounded-sm border border-rose-200 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex items-center justify-between group hover:border-rose-400 hover:shadow-[0_15px_30px_rgba(244,63,94,0.08)] transition-all duration-300 cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-sm bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <UserX size={18} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Absent</p>
              <p className="text-xl font-black text-slate-800 mt-0.5">{totalAbsent}</p>
            </div>
          </div>
          <span className="hidden sm:inline-block text-[10px] font-bold px-1.5 py-0.5 bg-rose-50 text-rose-700 rounded-md border border-rose-100">
            Out
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          className="bg-white p-5 rounded-sm border border-amber-200 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex items-center justify-between group hover:border-amber-400 hover:shadow-[0_15px_30px_rgba(245,158,11,0.08)] transition-all duration-300 cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-sm bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Clock size={18} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Late</p>
              <p className="text-xl font-black text-slate-800 mt-0.5">{totalLate}</p>
            </div>
          </div>
          <span className="hidden sm:inline-block text-[10px] font-bold px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded-md border border-amber-100">
            Delayed
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.26, ease: "easeOut" }}
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          className="bg-white p-5 rounded-sm border border-indigo-200 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:border-indigo-400 hover:shadow-[0_15px_30px_rgba(99,102,241,0.08)] transition-all duration-300 flex flex-col justify-center cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-sm bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <TrendingUp size={13} />
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Session Rate</p>
            </div>
            <span className="text-xs font-black text-indigo-600">{attendanceRate}%</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${attendanceRate}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="bg-indigo-600 h-full rounded"
            />
          </div>
        </motion.div>
      </div>

      {/* Main interactive controls: Search, Filters, Sorters, Bulk Actions & Density */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-white p-4 rounded-sm border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
          {/* Search box */}
          <div className="relative flex-1 max-w-sm">
            <input
              type="text"
              placeholder="Search employees by name or ID..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-sm text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder-slate-400 font-semibold"
            />
            <Search size={14} className="absolute left-3 top-3 text-slate-400" />
          </div>

          {/* Status filter pills */}
          <div className="flex items-center gap-1 overflow-x-auto py-0.5">
            {(['All', 'Present', 'Absent', 'Late'] as const).map(filter => {
              const isSelected = statusFilter === filter;
              const count = filter === 'All'
                ? persons.length
                : Object.values(records).filter(r => r.status === filter).length;

              return (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`px-3 py-1.5 rounded-sm text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer ${isSelected
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-50 border border-slate-100 text-slate-500 hover:text-slate-800'
                    }`}
                >
                  {filter} <span className={`ml-0.5 px-1 py-0.2 rounded text-[9px] ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                    }`}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right controls: Sorting + Bulk Actions + Density + View toggles */}
        <div className="flex flex-wrap items-center gap-3 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100">

          {/* Sort Controller */}
          <div className="flex items-center gap-1.5 border border-slate-200/80 rounded-sm px-2.5 py-1.5 bg-slate-50/50 shrink-0">
            <ArrowUpDown size={13} className="text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent border-none text-[11px] font-bold text-slate-700 focus:outline-none cursor-pointer pr-1"
            >
              <option value="name">Name</option>
              <option value="id">Employee ID</option>
              <option value="status">Status</option>
            </select>
            <button
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="p-0.5 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-800 transition-all cursor-pointer font-black text-xs leading-none"
              title={sortOrder === 'asc' ? 'Sort Ascending' : 'Sort Descending'}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>

          {/* Size / Density Toggler */}
          <div className="flex items-center gap-0.5 p-0.5 bg-slate-100 rounded-sm shrink-0">
            <button
              onClick={() => setCardSize('compact')}
              className={`px-2.5 py-1.2 rounded-sm text-[10px] font-bold transition-all cursor-pointer ${cardSize === 'compact'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-400 hover:text-slate-700'
                }`}
              title="Compact View"
            >
              Compact
            </button>
            <button
              onClick={() => setCardSize('comfortable')}
              className={`px-2.5 py-1.2 rounded-sm text-[10px] font-bold transition-all cursor-pointer ${cardSize === 'comfortable'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-400 hover:text-slate-700'
                }`}
              title="Comfortable View"
            >
              Spacious
            </button>
          </div>

          <div className="h-5 w-[1px] bg-slate-200 hidden sm:block" />

          {/* Bulk Actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={markAllPresent}
              title="Mark All Present"
              className="flex items-center gap-1 px-3 py-1.5 rounded-sm text-[10px] font-bold border border-emerald-250 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-all cursor-pointer"
            >
              <CheckCircle2 size={12} /> Present
            </button>

            <button
              onClick={markAllAbsent}
              title="Mark All Absent"
              className="flex items-center gap-1 px-3 py-1.5 rounded-sm text-[10px] font-bold border border-rose-250 text-rose-700 bg-rose-50 hover:bg-rose-100 transition-all cursor-pointer"
            >
              <XCircle size={12} /> Absent
            </button>

            <button
              onClick={resetToOriginal}
              title="Reset"
              disabled={!hasUnsavedChanges}
              className="p-1.5 rounded-sm border border-slate-200 text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition-all cursor-pointer"
            >
              <RotateCcw size={13} />
            </button>
          </div>

          <div className="h-5 w-[1px] bg-slate-200 hidden sm:block" />

          {/* View Mode */}
          <div className="flex items-center gap-0.5 p-0.5 bg-slate-100 rounded-sm">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-sm transition-all cursor-pointer ${viewMode === 'grid'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-400 hover:text-slate-700'
                }`}
              title="Grid View"
            >
              <LayoutGrid size={13} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-sm transition-all cursor-pointer ${viewMode === 'list'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-400 hover:text-slate-700'
                }`}
              title="Sheet View"
            >
              <List size={13} />
            </button>
          </div>

        </div>
      </motion.div>

      {/* Main Roster Body */}
      <div className="min-h-[400px]">
        {loading ? (
          /* Shimmer Skeletons */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-white p-4 rounded-sm border border-slate-100 shadow-sm flex flex-col gap-3 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-slate-200" />
                  <div className="flex-1">
                    <div className="h-3.5 bg-slate-200 rounded w-3/4 mb-1.5" />
                    <div className="h-2.5 bg-slate-200 rounded w-1/2" />
                  </div>
                </div>
                <div className="h-7 bg-slate-100 rounded-sm" />
                <div className="flex gap-2">
                  <div className="h-7 bg-slate-100 rounded-sm flex-1" />
                  <div className="h-7 bg-slate-100 rounded-sm flex-1" />
                </div>
              </div>
            ))}
          </div>
        ) : sortedPersons.length === 0 ? (
          /* Empty state */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-slate-200/80 rounded-sm p-10 text-center shadow-sm max-w-md mx-auto flex flex-col items-center gap-3 mt-6"
          >
            <div className="w-14 h-14 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Search size={24} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">No SVU Employees Found</h3>
              <p className="text-slate-500 text-xs mt-1 max-w-sm">
                We couldn&apos;t find matching records. Try adjusting your search query, status filters, or check the Employee directory.
              </p>
            </div>
            {statusFilter !== 'All' && (
              <button
                onClick={() => setStatusFilter('All')}
                className="mt-1 px-3.5 py-1.5 bg-indigo-600 text-white rounded-sm text-[10px] font-bold shadow-sm hover:bg-indigo-700 transition-all cursor-pointer"
              >
                Clear Status Filters
              </button>
            )}
          </motion.div>
        ) : viewMode === 'grid' ? (

          /* GRID VIEW - Respects the selected cardSize density */
          <motion.div
            variants={listContainerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            {sortedPersons.map((person) => {
              const rec = records[person._id] || { status: 'Absent', checkInTime: '', checkOutTime: '', isEarlyCheckOut: false, leaveReason: '' };
              const isAbsent = rec.status === 'Absent';
              const isCompact = cardSize === 'compact';

              return (
                <motion.div
                  key={person._id}
                  variants={listItemVariants}
                  whileHover={{ y: -3, boxShadow: '0 8px 12px -3px rgba(0, 0, 0, 0.05)' }}
                  className={`bg-white rounded-sm border transition-all relative overflow-hidden flex flex-col ${isCompact ? 'p-3.5 gap-2.5' : 'p-4.5 gap-3.5'
                    } ${isAbsent
                      ? 'border-slate-100 opacity-90'
                      : rec.status === 'Present'
                        ? 'border-emerald-100 shadow-sm hover:border-emerald-300'
                        : 'border-amber-100 shadow-sm hover:border-amber-300'
                    }`}
                >
                  {/* Top visual strip color indicator */}
                  <div className={`absolute top-0 left-0 right-0 h-0.5 ${isAbsent
                    ? 'bg-slate-200'
                    : rec.status === 'Present'
                      ? 'bg-emerald-500'
                      : 'bg-amber-500'
                    }`} />

                  {/* Profile Header */}
                  <div className="flex items-center gap-3">
                    <div className={`rounded-full bg-gradient-to-br border flex items-center justify-center font-black shrink-0 uppercase transition-transform duration-300 hover:scale-105 shadow-sm ${getAvatarGradient(person.name)} ${isCompact ? 'w-8 h-8 text-[11px]' : 'w-10 h-10 text-sm'
                      }`}>
                      {person.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <span className={`font-bold text-slate-800 block truncate leading-tight ${isCompact ? 'text-xs' : 'text-sm'
                        }`} title={person.name}>
                        {person.name}
                      </span>
                      <span className="text-[10px] font-mono font-medium text-slate-400 block mt-0.5">
                        {person.employeeId}
                      </span>
                    </div>
                  </div>

                  {/* Quick Select Buttons */}
                  <div className="bg-slate-50/80 border border-slate-100 p-0.5 rounded-sm flex items-center gap-0.5">
                    {(['Present', 'Absent', 'Late'] as const).map((st) => {
                      const isActive = rec.status === st;
                      return (
                        <button
                          key={st}
                          onClick={() => handleStatusChange(person._id, st)}
                          type="button"
                          className={`flex-1 rounded-md font-bold transition-all flex items-center justify-center gap-0.5 cursor-pointer ${isCompact ? 'py-1 text-[9px]' : 'py-1.5 text-[11px]'
                            } ${isActive
                              ? st === 'Present'
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : st === 'Absent'
                                  ? 'bg-rose-600 text-white shadow-sm'
                                  : 'bg-amber-500 text-white shadow-sm'
                              : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/50'
                            }`}
                        >
                          {st === 'Present' && <CheckCircle2 size={isCompact ? 10 : 12} />}
                          {st === 'Absent' && <XCircle size={isCompact ? 10 : 12} />}
                          {st === 'Late' && <Clock size={isCompact ? 10 : 12} />}
                          <span>{st}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Settings Box: CheckIn, CheckOut, Early Switch */}
                  <div className="flex flex-col gap-2 pt-0.5">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-0.5">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">In</label>
                        <input
                          type="time"
                          value={rec.checkInTime}
                          onChange={(e) => handleTimeChange(person._id, 'checkInTime', e.target.value)}
                          disabled={isAbsent}
                          className="w-full border border-slate-200 rounded-sm px-2 py-1 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-40 disabled:bg-slate-50 font-semibold"
                        />
                      </div>

                      <div className="flex flex-col gap-0.5">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Out</label>
                        <input
                          type="time"
                          value={rec.checkOutTime}
                          onChange={(e) => handleTimeChange(person._id, 'checkOutTime', e.target.value)}
                          disabled={isAbsent}
                          className="w-full border border-slate-200 rounded-sm px-2 py-1 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-40 disabled:bg-slate-50 font-semibold"
                        />
                      </div>
                    </div>

                    {isAbsent && (
                      <div className="flex flex-col gap-0.5 mt-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Reason for Leave</label>
                        <input
                          type="text"
                          value={rec.leaveReason}
                          onChange={(e) => handleLeaveReasonChange(person._id, e.target.value)}
                          placeholder="E.g. Sick, Vacation"
                          className="w-full border border-slate-200 rounded-sm px-2 py-1 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/50 font-semibold bg-rose-50/30"
                        />
                      </div>
                    )}
                  </div>

                </motion.div>
              );
            })}
          </motion.div>
        ) : (

          /* LIST VIEW - Compact grid/table style with dynamic density cardSize */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white border border-slate-200 rounded-sm overflow-hidden shadow-sm"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200/80">
                    <th className={`font-bold text-slate-400 text-[10px] uppercase tracking-widest ${cardSize === 'compact' ? 'px-4 py-3' : 'px-6 py-4'
                      }`}>
                      SVU Employee
                    </th>
                    <th className={`font-bold text-slate-400 text-[10px] uppercase tracking-widest text-center ${cardSize === 'compact' ? 'px-4 py-3' : 'px-6 py-4'
                      }`}>
                      Status Control
                    </th>
                    <th className={`font-bold text-slate-400 text-[10px] uppercase tracking-widest ${cardSize === 'compact' ? 'px-4 py-3' : 'px-6 py-4'
                      }`}>
                      In-Time
                    </th>
                    <th className={`font-bold text-slate-400 text-[10px] uppercase tracking-widest ${cardSize === 'compact' ? 'px-4 py-3' : 'px-6 py-4'
                      }`}>
                      Out-Time
                    </th>
                    <th className={`font-bold text-slate-400 text-[10px] uppercase tracking-widest ${cardSize === 'compact' ? 'px-4 py-3' : 'px-6 py-4'
                      }`}>
                      Leave Reason
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedPersons.map((person) => {
                    const rec = records[person._id] || { status: 'Absent', checkInTime: '', checkOutTime: '', isEarlyCheckOut: false, leaveReason: '' };
                    const isAbsent = rec.status === 'Absent';
                    const isCompact = cardSize === 'compact';

                    return (
                      <tr key={person._id} className="hover:bg-slate-50/50 transition-colors">
                        <td className={`flex items-center gap-3 ${isCompact ? 'px-4 py-2' : 'px-6 py-3.5'
                          }`}>
                          <div className={`rounded-full bg-gradient-to-br border flex items-center justify-center font-black shrink-0 uppercase transition-transform duration-300 hover:scale-105 shadow-sm ${getAvatarGradient(person.name)} ${isCompact ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm'
                            }`}>
                            {person.name.charAt(0)}
                          </div>
                          <div>
                            <span className={`font-bold text-slate-800 block leading-tight ${isCompact ? 'text-xs' : 'text-sm'
                              }`}>{person.name}</span>
                            <span className="text-[9px] font-mono text-slate-400 block mt-0.5">{person.employeeId}</span>
                          </div>
                        </td>
                        <td className={`text-center ${isCompact ? 'px-4 py-2' : 'px-6 py-3.5'}`}>
                          <div className="inline-flex items-center gap-0.5 bg-slate-100 border border-slate-200/50 p-0.5 rounded-sm">
                            {(['Present', 'Absent', 'Late'] as const).map(st => {
                              const isActive = rec.status === st;
                              return (
                                <button
                                  key={st}
                                  onClick={() => handleStatusChange(person._id, st)}
                                  className={`flex items-center gap-0.5 rounded-sm font-bold transition-all cursor-pointer ${isCompact ? 'px-2.5 py-1 text-[9px]' : 'px-4 py-1.5 text-xs'
                                    } ${isActive
                                      ? st === 'Present'
                                        ? 'bg-emerald-600 text-white shadow-sm'
                                        : st === 'Absent'
                                          ? 'bg-rose-600 text-white shadow-sm'
                                          : 'bg-amber-500 text-white shadow-sm'
                                      : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/40'
                                    }`}
                                >
                                  {st === 'Present' && <CheckCircle2 size={isCompact ? 10 : 12} />}
                                  {st === 'Absent' && <XCircle size={isCompact ? 10 : 12} />}
                                  {st === 'Late' && <Clock size={isCompact ? 10 : 12} />}
                                  <span>{st}</span>
                                </button>
                              );
                            })}
                          </div>
                        </td>
                        <td className={isCompact ? 'px-4 py-2' : 'px-6 py-3.5'}>
                          <input
                            type="time"
                            value={rec.checkInTime}
                            onChange={(e) => handleTimeChange(person._id, 'checkInTime', e.target.value)}
                            disabled={isAbsent}
                            className={`border border-slate-200 rounded-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-40 disabled:bg-slate-50 font-bold ${isCompact ? 'px-2 py-1 text-[11px]' : 'px-3 py-1.5 text-xs'
                              }`}
                          />
                        </td>
                        <td className={isCompact ? 'px-4 py-2' : 'px-6 py-3.5'}>
                          <input
                            type="time"
                            value={rec.checkOutTime}
                            onChange={(e) => handleTimeChange(person._id, 'checkOutTime', e.target.value)}
                            disabled={isAbsent}
                            className={`border border-slate-200 rounded-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-40 disabled:bg-slate-50 font-bold ${isCompact ? 'px-2 py-1 text-[11px]' : 'px-3 py-1.5 text-xs'
                              }`}
                          />
                        </td>
                        <td className={isCompact ? 'px-4 py-2' : 'px-6 py-3.5'}>
                          <input
                            type="text"
                            value={rec.leaveReason}
                            onChange={(e) => handleLeaveReasonChange(person._id, e.target.value)}
                            disabled={!isAbsent}
                            placeholder={isAbsent ? "Reason" : ""}
                            className={`w-full border border-slate-200 rounded-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/50 disabled:opacity-40 disabled:bg-slate-50 font-bold ${isCompact ? 'px-2 py-1 text-[11px]' : 'px-3 py-1.5 text-xs'
                              } ${isAbsent ? 'bg-rose-50/30' : ''}`}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>

    </div>
  );
}
