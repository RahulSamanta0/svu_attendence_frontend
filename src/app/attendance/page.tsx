'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import PageHeader from '@/components/PageHeader';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Clock,
  Save,
  Loader2,
  Search,
  LayoutGrid,
  List,
  AlertCircle,
  Calendar,
  Sparkles,
  TrendingUp,
  UserCheck,
  UserX,
  ArrowUpDown,
  Users
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

const isSameDay = (d1: Date, d2: Date) => {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

const getCalendarDays = (date: Date) => {
  const year = date.getFullYear();
  const month = date.getMonth();

  const firstDay = new Date(year, month, 1);
  const firstDayOfWeek = firstDay.getDay();

  const totalDays = new Date(year, month + 1, 0).getDate();
  const prevMonthTotalDays = new Date(year, month, 0).getDate();

  const days: { date: Date; isCurrentMonth: boolean }[] = [];

  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    days.push({
      date: new Date(year, month - 1, prevMonthTotalDays - i),
      isCurrentMonth: false
    });
  }

  for (let i = 1; i <= totalDays; i++) {
    days.push({
      date: new Date(year, month, i),
      isCurrentMonth: true
    });
  }

  const remainingCells = 42 - days.length;
  for (let i = 1; i <= remainingCells; i++) {
    days.push({
      date: new Date(year, month + 1, i),
      isCurrentMonth: false
    });
  }

  return days;
};

export default function AttendancePage() {
  const router = useRouter();
  const [date, setDate] = useState(() => new Date().toLocaleDateString('en-CA'));

  // Scroll active day into view automatically
  const activeDayRef = useCallback((node: HTMLButtonElement | null) => {
    if (node) {
      node.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'center' });
    }
  }, []);

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
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showCalendarPopover, setShowCalendarPopover] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());

  useEffect(() => {
    const [y, m, d] = date.split('-');
    setCalendarMonth(new Date(Number(y), Number(m) - 1, Number(d)));
  }, [date]);

  // Sorting & Size Density states
  const [sortBy, setSortBy] = useState<'name' | 'id' | 'status'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [cardSize, setCardSize] = useState<'compact' | 'comfortable'>('compact');

  // Bulk In/Out time
  const [bulkInTime, setBulkInTime] = useState('10:30');
  const [bulkOutTime, setBulkOutTime] = useState('18:00');

  useEffect(() => {
    fetchData();
  }, [date]);

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

  const localToday = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local time
  const utcToday = new Date().toISOString().split('T')[0];
  const isToday = date === localToday || date === utcToday;

  useEffect(() => {
    if (isWeekend) {
      addToast('Weekend holiday: attendance is not recorded.', 'info');
    }
  }, [isWeekend, addToast]);

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
    if (!isToday) return;
    setRecords(prev => {
      const current = prev[personId];
      if (status === 'Absent') {
        return {
          ...prev,
          [personId]: { status, checkInTime: '', checkOutTime: '', isEarlyCheckOut: false, leaveReason: current.leaveReason || '' }
        };
      }
      const updatedCheckIn = current.checkInTime || (status === 'Late' ? '12:00' : '10:30');
      const updatedCheckOut = current.checkOutTime || '18:00';
      return {
        ...prev,
        [personId]: { ...current, status, checkInTime: updatedCheckIn, checkOutTime: updatedCheckOut }
      };
    });
  };

  const handleTimeChange = (personId: string, field: 'checkInTime' | 'checkOutTime', value: string) => {
    if (!isToday) return;
    setRecords(prev => ({
      ...prev,
      [personId]: { ...prev[personId], [field]: value }
    }));
  };

  const handleEarlyToggle = (personId: string) => {
    if (!isToday) return;
    setRecords(prev => ({
      ...prev,
      [personId]: { ...prev[personId], isEarlyCheckOut: !prev[personId]?.isEarlyCheckOut }
    }));
  };

  const handleLeaveReasonChange = (personId: string, value: string) => {
    if (!isToday) return;
    setRecords(prev => ({
      ...prev,
      [personId]: { ...prev[personId], leaveReason: value }
    }));
  };

  const handleSave = async () => {
    if (!isToday) return;
    setSaving(true);
    try {
      const recordsArray = Object.entries(records).map(([personId, data]) => ({
        personId,
        status: data.status,
        checkInTime: data.checkInTime,
        checkOutTime: data.checkOutTime,
        isEarlyCheckOut: data.checkOutTime ? data.checkOutTime < '18:00' : false,
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

    for (let i = -10; i <= 10; i++) {
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
    if (!isToday) return;
    const updated = { ...records };
    persons.forEach(p => {
      const current = updated[p._id] || { status: 'Absent', checkInTime: '', checkOutTime: '', isEarlyCheckOut: false, leaveReason: '' };
      updated[p._id] = {
        ...current,
        status: 'Present',
        checkInTime: current.checkInTime || '10:30',
        checkOutTime: current.checkOutTime || '18:00'
      };
    });
    setRecords(updated);
    addToast('Marked all employees as Present', 'success');
  };

  const markAllAbsent = () => {
    if (!isToday) return;
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
    if (!isToday) return;
    setRecords(JSON.parse(JSON.stringify(originalRecords)));
    addToast('Restored original records for this date', 'info');
  };

  const applyBulkTime = (field: 'checkInTime' | 'checkOutTime', value: string) => {
    if (!isToday) return;
    setRecords(prev => {
      const updated = { ...prev };
      persons.forEach(p => {
        const rec = updated[p._id];
        if (rec && (rec.status === 'Present' || rec.status === 'Late')) {
          updated[p._id] = { ...rec, [field]: value };
        }
      });
      return updated;
    });
    addToast(`Updated ${field === 'checkInTime' ? 'In Time' : 'Out Time'} for all present members`, 'success');
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

      <PageHeader
        title="SVU StaffSync AttendPro Attendance"
        subtitle="Configure states, log times, and manage attendance records for SVU employees."
        badge="Live View"
        variant="green"
        actions={
          hasUnsavedChanges ? (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1.5 px-3 py-1 bg-rose-600 text-white font-black text-[11px] rounded-full shrink-0 shadow-md border border-rose-700/20"
            >
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              Unsaved changes
            </motion.span>
          ) : undefined
        }
      />

      {/* Statistics Cards Dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* All Members Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05, ease: "easeOut" }}
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
          onClick={() => setStatusFilter('All')}
          className={`bg-gradient-to-br from-[#7B8FA6] to-[#5A7089] p-4 rounded-2xl border border-white/20 shadow-[-6px_-6px_16px_rgba(255,255,255,0.45),_8px_8px_16px_rgba(90,112,137,0.28),_inset_2px_2px_4px_rgba(255,255,255,0.35),_inset_-2px_-2px_4px_rgba(0,0,0,0.18)] flex items-center gap-3 relative overflow-hidden group hover:shadow-[-8px_-8px_20px_rgba(255,255,255,0.55),_10px_10px_20px_rgba(90,112,137,0.38)] transition-all duration-300 cursor-pointer hover:-translate-y-0.5 ${statusFilter === 'All' ? 'ring-2 ring-blue-400 ring-offset-2 scale-[1.03] shadow-[0_0_15px_rgba(90,112,137,0.5)] z-10' : ''
            }`}
        >
          {/* SVG Silk Wave Accents with water wave animation */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 100 100" preserveAspectRatio="none">
            <motion.path
              d="M-5,82 C35,92 65,62 105,52 L105,105 L-5,105 Z"
              animate={{ y: [0, 4, -4, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              fill="#ffffff"
              opacity="0.12"
            />
            <motion.path
              d="M-5,90 C45,95 75,72 105,62 L105,105 L-5,105 Z"
              animate={{ y: [0, -4, 4, 0] }}
              transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
              fill="#ffffff"
              opacity="0.07"
            />
            <motion.path
              d="M-5,82 C35,92 65,62 105,52"
              animate={{ y: [0, 4, -4, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              fill="none"
              stroke="#ffffff"
              strokeWidth="0.5"
              opacity="0.15"
            />
          </svg>

          <div className="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-sm border border-white/10 relative z-10">
            <Users size={15} />
          </div>
          <div className="relative z-10">
            <p className="text-[9px] font-bold text-blue-100/90 uppercase tracking-widest">All Members</p>
            <p className="text-base font-black text-white">{persons.length}</p>
          </div>
        </motion.div>
        {/* Present Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08, ease: "easeOut" }}
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
          onClick={() => setStatusFilter(prev => prev === 'Present' ? 'All' : 'Present')}
          className={`bg-gradient-to-br from-[#8FA47F] to-[#6B805B] p-4 rounded-2xl border border-white/20 shadow-[-6px_-6px_16px_rgba(255,255,255,0.45),_8px_8px_16px_rgba(107,128,91,0.28),_inset_2px_2px_4px_rgba(255,255,255,0.35),_inset_-2px_-2px_4px_rgba(0,0,0,0.18)] flex items-center gap-3 relative overflow-hidden group hover:shadow-[-8px_-8px_20px_rgba(255,255,255,0.55),_10px_10px_20px_rgba(107,128,91,0.38)] transition-all duration-300 cursor-pointer hover:-translate-y-0.5 ${statusFilter === 'Present' ? 'ring-2 ring-emerald-500 ring-offset-2 scale-[1.03] shadow-[0_0_15px_rgba(107,128,91,0.5)] z-10' : ''
            }`}
        >
          {/* SVG Silk Wave Accents with water wave animation */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 100 100" preserveAspectRatio="none">
            <motion.path
              d="M-5,82 C35,92 65,62 105,52 L105,105 L-5,105 Z"
              animate={{ y: [0, 4, -4, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              fill="#ffffff"
              opacity="0.12"
            />
            <motion.path
              d="M-5,90 C45,95 75,72 105,62 L105,105 L-5,105 Z"
              animate={{ y: [0, -4, 4, 0] }}
              transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
              fill="#ffffff"
              opacity="0.07"
            />
            <motion.path
              d="M-5,82 C35,92 65,62 105,52"
              animate={{ y: [0, 4, -4, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              fill="none"
              stroke="#ffffff"
              strokeWidth="0.5"
              opacity="0.15"
            />
          </svg>

          <div className="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-sm border border-white/10 relative z-10">
            <UserCheck size={15} />
          </div>
          <div className="relative z-10">
            <p className="text-[9px] font-bold text-emerald-100/90 uppercase tracking-widest">Present</p>
            <p className="text-base font-black text-white">{totalPresent}</p>
          </div>
        </motion.div>

        {/* Absent Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.14, ease: "easeOut" }}
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
          onClick={() => setStatusFilter(prev => prev === 'Absent' ? 'All' : 'Absent')}
          className={`bg-gradient-to-br from-[#E5B5B8] to-[#C9979A] p-4 rounded-2xl border border-white/20 shadow-[-6px_-6px_16px_rgba(255,255,255,0.55),_8px_8px_16px_rgba(201,150,154,0.28),_inset_2px_2px_4px_rgba(255,255,255,0.35),_inset_-2px_-2px_4px_rgba(0,0,0,0.18)] flex items-center gap-3 relative overflow-hidden group hover:shadow-[-8px_-8px_20px_rgba(255,255,255,0.65),_10px_10px_20px_rgba(201,150,154,0.38)] transition-all duration-300 cursor-pointer hover:-translate-y-0.5 ${statusFilter === 'Absent' ? 'ring-2 ring-rose-500 ring-offset-2 scale-[1.03] shadow-[0_0_15px_rgba(201,150,154,0.5)] z-10' : ''
            }`}
        >
          {/* SVG Silk Wave Accents with water wave animation */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 100 100" preserveAspectRatio="none">
            <motion.path
              d="M-5,82 C35,92 65,62 105,52 L105,105 L-5,105 Z"
              animate={{ y: [0, 4, -4, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              fill="#ffffff"
              opacity="0.16"
            />
            <motion.path
              d="M-5,90 C45,95 75,72 105,62 L105,105 L-5,105 Z"
              animate={{ y: [0, -4, 4, 0] }}
              transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
              fill="#ffffff"
              opacity="0.09"
            />
            <motion.path
              d="M-5,82 C35,92 65,62 105,52"
              animate={{ y: [0, 4, -4, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              fill="none"
              stroke="#ffffff"
              strokeWidth="0.5"
              opacity="0.2"
            />
          </svg>

          <div className="w-8 h-8 rounded-xl bg-white/30 text-[#7A494B] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-sm border border-white/15 relative z-10">
            <UserX size={15} />
          </div>
          <div className="relative z-10">
            <p className="text-[9px] font-bold text-[#9D686B] uppercase tracking-widest">Absent</p>
            <p className="text-base font-black text-[#7A494B]">{totalAbsent}</p>
          </div>
        </motion.div>

        {/* Late Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
          onClick={() => setStatusFilter(prev => prev === 'Late' ? 'All' : 'Late')}
          className={`bg-gradient-to-br from-[#F4A236] to-[#D67A18] p-4 rounded-2xl border border-white/20 shadow-[-6px_-6px_16px_rgba(255,255,255,0.45),_8px_8px_16px_rgba(214,122,24,0.28),_inset_2px_2px_4px_rgba(255,255,255,0.35),_inset_-2px_-2px_4px_rgba(0,0,0,0.18)] flex items-center gap-3 relative overflow-hidden group hover:shadow-[-8px_-8px_20px_rgba(255,255,255,0.55),_10px_10px_20px_rgba(214,122,24,0.38)] transition-all duration-300 cursor-pointer hover:-translate-y-0.5 ${statusFilter === 'Late' ? 'ring-2 ring-amber-500 ring-offset-2 scale-[1.03] shadow-[0_0_15px_rgba(214,122,24,0.5)] z-10' : ''
            }`}
        >
          {/* SVG Silk Wave Accents with water wave animation */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 100 100" preserveAspectRatio="none">
            <motion.path
              d="M-5,82 C35,92 65,62 105,52 L105,105 L-5,105 Z"
              animate={{ y: [0, 4, -4, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              fill="#ffffff"
              opacity="0.12"
            />
            <motion.path
              d="M-5,90 C45,95 75,72 105,62 L105,105 L-5,105 Z"
              animate={{ y: [0, -4, 4, 0] }}
              transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
              fill="#ffffff"
              opacity="0.07"
            />
            <motion.path
              d="M-5,82 C35,92 65,62 105,52"
              animate={{ y: [0, 4, -4, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              fill="none"
              stroke="#ffffff"
              strokeWidth="0.5"
              opacity="0.15"
            />
          </svg>

          <div className="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-sm border border-white/10 relative z-10">
            <Clock size={15} />
          </div>
          <div className="relative z-10">
            <p className="text-[9px] font-bold text-amber-100 uppercase tracking-widest">Late</p>
            <p className="text-base font-black text-white">{totalLate}</p>
          </div>
        </motion.div>

        {/* Session Rate Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.26, ease: "easeOut" }}
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
          onClick={() => setStatusFilter('All')}
          className="bg-gradient-to-br from-[#E8C5AF] to-[#CD9B7F] p-4 rounded-2xl border border-white/20 shadow-[-6px_-6px_16px_rgba(255,255,255,0.55),_8px_8px_16px_rgba(205,155,127,0.28),_inset_2px_2px_4px_rgba(255,255,255,0.35),_inset_-2px_-2px_4px_rgba(0,0,0,0.18)] flex items-center gap-3 relative overflow-hidden group hover:shadow-[-8px_-8px_20px_rgba(255,255,255,0.65),_10px_10px_20px_rgba(205,155,127,0.38)] transition-all duration-300 cursor-pointer hover:-translate-y-0.5"
        >
          {/* SVG Silk Wave Accents with water wave animation */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 100 100" preserveAspectRatio="none">
            <motion.path
              d="M-5,82 C35,92 65,62 105,52 L105,105 L-5,105 Z"
              animate={{ y: [0, 4, -4, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              fill="#ffffff"
              opacity="0.16"
            />
            <motion.path
              d="M-5,90 C45,95 75,72 105,62 L105,105 L-5,105 Z"
              animate={{ y: [0, -4, 4, 0] }}
              transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
              fill="#ffffff"
              opacity="0.09"
            />
            <motion.path
              d="M-5,82 C35,92 65,62 105,52"
              animate={{ y: [0, 4, -4, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              fill="none"
              stroke="#ffffff"
              strokeWidth="0.5"
              opacity="0.2"
            />
          </svg>

          <div className="w-8 h-8 rounded-xl bg-white/30 text-[#604230] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-sm border border-white/15 relative z-10">
            <TrendingUp size={15} />
          </div>
          <div className="relative z-10 flex-1">
            <div className="flex items-center justify-between">
              <p className="text-[9px] font-bold text-[#825C44] uppercase tracking-widest">Session Rate</p>
              <p className="text-sm font-black text-[#604230]">{attendanceRate}%</p>
            </div>
            <div className="w-full bg-[#FAF8F5]/40 h-1.5 rounded overflow-hidden mt-1 border border-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${attendanceRate}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="bg-[#6B805B] h-full rounded"
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* View-Only Indicator Banner for Past/Future Dates */}
      {!isToday && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 px-4 py-3 bg-amber-50/80 border border-amber-200/80 text-amber-805 rounded-sm text-xs font-bold shadow-sm"
        >
          <AlertCircle size={15} className="text-amber-600 shrink-0" />
          <span>View-Only Mode: Attendance edits are locked for past/future dates. You can only modify and save attendance for the present date (Today).</span>
        </motion.div>
      )}

      {/* Two-Column Dashboard Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start mt-2">
        {/* Left Column */}
        <div className="lg:col-span-4 flex flex-col gap-6 self-start w-full">
          {/* Premium Calendar Selector Card */}
          <motion.div
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="w-full bg-[#EDE3CE] border border-white/60 rounded-[32px] p-5 md:p-6 shadow-[-12px_-12px_32px_#ffffff,_12px_12px_32px_rgba(180,170,150,0.35)] flex flex-col gap-4"
          >
            {/* Header Row: Title & Month Dropdown */}
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <h2 className="text-xl font-extrabold text-[#4E5B2E] tracking-tight leading-tight">Upcoming Shifts</h2>
                <div className="flex items-center gap-1.5 text-[#FDA769] font-bold text-xs mt-1.5">
                  <UserCheck size={14} className="stroke-[2.5]" />
                  <span>{persons.length} staff • {selectedDateObj.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })}</span>
                </div>
              </div>

              {/* Calendar Picker Box */}
              <div className="relative">
                <button
                  onClick={() => setShowCalendarPopover(!showCalendarPopover)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF8F5] border border-[#EADFC9]/40 rounded-full text-xs font-bold text-slate-750 shadow-sm hover:bg-white hover:border-[#FDA769]/45 transition-all cursor-pointer"
                >
                  <Calendar size={13} className="text-[#FDA769] shrink-0" />
                  <span>{selectedDateObj.toLocaleDateString('en-US', { month: 'long' })}</span>
                  <ChevronDown size={13} className="text-[#FDA769] shrink-0" />
                </button>

                <AnimatePresence>
                  {showCalendarPopover && (
                    <>
                      <div
                        className="fixed inset-0 z-40 bg-transparent"
                        onClick={() => setShowCalendarPopover(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: -8, scaleY: 0.95 }}
                        animate={{ opacity: 1, y: 0, scaleY: 1 }}
                        exit={{ opacity: 0, y: -8, scaleY: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute right-0 top-full mt-2 z-50 bg-[#8A9A5B] border border-[#7D8C50] rounded-2xl shadow-2xl p-4 w-72 text-white font-sans origin-top"
                      >
                        {/* Month Selector Navigation Row */}
                        <div className="flex items-center justify-between mb-4 select-none">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
                            }}
                            className="p-1 hover:bg-white/10 rounded-full text-white cursor-pointer transition-all duration-200 active:scale-90"
                          >
                            <ChevronLeft size={16} />
                          </button>
                          <span className="text-xs font-black tracking-widest uppercase">
                            {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
                            }}
                            className="p-1 hover:bg-white/10 rounded-full text-white cursor-pointer transition-all duration-200 active:scale-90"
                          >
                            <ChevronRight size={16} />
                          </button>
                        </div>

                        {/* Days of Week Header Row */}
                        <div className="grid grid-cols-7 gap-1 text-center mb-2 select-none">
                          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                            <span key={idx} className="text-[10px] font-bold text-white/50 uppercase tracking-wider">
                              {day}
                            </span>
                          ))}
                        </div>

                        {/* Calendar Days Grid */}
                        <div className="grid grid-cols-7 gap-y-1.5 gap-x-1 text-center">
                          {getCalendarDays(calendarMonth).map(({ date: cellDate, isCurrentMonth }, i) => {
                            const isSelected = isSameDay(cellDate, selectedDateObj);
                            const isCellToday = isSameDay(cellDate, new Date());

                            let btnClass = "text-xs h-7 w-7 flex items-center justify-center rounded-full font-bold transition-all duration-200 cursor-pointer relative ";

                            if (isSelected) {
                              btnClass += "bg-[#4E5B2E] text-white font-extrabold shadow-sm";
                            } else if (isCurrentMonth) {
                              btnClass += "text-white hover:bg-white/10";
                            } else {
                              btnClass += "text-white/30 hover:bg-white/5";
                            }

                            return (
                              <div key={i} className="flex justify-center items-center relative">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDate(cellDate.toISOString().split('T')[0]);
                                    setShowCalendarPopover(false);
                                  }}
                                  className={btnClass}
                                >
                                  {cellDate.getDate()}
                                  {isCellToday && !isSelected && (
                                    <span className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                                  )}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* White Day Strip Container - Horizontal Scrollable without scrollbar */}
            <div className="bg-white rounded-[24px] p-3 shadow-sm border border-slate-100/50 flex gap-2 overflow-x-auto no-scrollbar items-center mt-1">
              {getDaysOfWeek(date).map((day) => {
                const isSelected = day.dateStr === date;
                return (
                  <button
                    key={day.dateStr}
                    ref={isSelected ? activeDayRef : undefined}
                    onClick={() => setDate(day.dateStr)}
                    className={`w-11 h-11 flex-shrink-0 flex flex-col items-center justify-center rounded-full transition-all cursor-pointer ${isSelected
                        ? 'bg-[#DFFE4A] text-slate-900 border border-[#C6EE3C]/40 font-extrabold shadow-sm scale-105'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:scale-105'
                      }`}
                  >
                    <span className="text-xs font-black tracking-tight leading-none">
                      {day.dayNum}
                    </span>
                    <span className={`text-[8.5px] font-bold mt-0.5 ${isSelected ? 'text-slate-700' : 'text-slate-400'}`}>
                      {day.dayName}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Today, Yesterday, and arrows navigation footer */}
            <div className="flex items-center justify-between border-t border-[#EADFC9]/30 pt-3.5 mt-1">
              <button
                onClick={() => setDate(new Date().toISOString().split('T')[0])}
                className={`px-3 py-1.5 text-[10px] font-bold rounded-xl transition-all cursor-pointer ${date === new Date().toISOString().split('T')[0]
                    ? 'bg-[#6B805B] text-white shadow-sm border border-[#8FA47F]/20'
                    : 'bg-[#FAF8F5] border border-[#EADFC9]/30 text-[#FDA769] hover:bg-white'
                  }`}
              >
                Today
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => changeDate(-7)}
                  title="Previous Week"
                  className="p-1.5 bg-[#FAF8F5] hover:bg-white rounded-xl text-[#FDA769] border border-[#EADFC9]/30 shadow-sm transition-all hover:scale-105 cursor-pointer"
                >
                  <ChevronLeft size={14} className="stroke-[3]" />
                </button>
                <button
                  onClick={() => changeDate(7)}
                  title="Next Week"
                  className="p-1.5 bg-[#FAF8F5] hover:bg-white rounded-xl text-[#FDA769] border border-[#EADFC9]/30 shadow-sm transition-all hover:scale-105 cursor-pointer"
                >
                  <ChevronRight size={14} className="stroke-[3]" />
                </button>
              </div>

              <button
                onClick={() => {
                  const yesterday = new Date();
                  yesterday.setDate(yesterday.getDate() - 1);
                  setDate(yesterday.toISOString().split('T')[0]);
                }}
                className={`px-3 py-1.5 text-[10px] font-bold rounded-xl transition-all cursor-pointer ${date === new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split('T')[0]
                    ? 'bg-[#6B805B] text-white shadow-sm border border-[#8FA47F]/20'
                    : 'bg-[#FAF8F5] border border-[#EADFC9]/30 text-[#FDA769] hover:bg-white'
                  }`}
              >
                Yesterday
              </button>
            </div>
          </motion.div>

          {/* Shift Actions Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="bg-[#EDE3CE] border border-white/60 rounded-[32px] p-5 shadow-[-12px_-12px_32px_#ffffff,_12px_12px_32px_rgba(180,170,150,0.35)] flex flex-col gap-3"
          >
            <div className="flex flex-col">
              <h3 className="text-xs font-extrabold text-[#4E5B2E] uppercase tracking-wider">Shift Actions</h3>
              <p className="text-[10px] text-slate-500 font-bold mt-1 leading-normal">
                {!isToday
                  ? "Attendance records are locked for past/future dates."
                  : isWeekend
                    ? "No attendance logging is required on weekends."
                    : hasUnsavedChanges
                      ? "Unsaved changes detected. Click below to apply shifts."
                      : "All attendance records are up to date."}
              </p>
            </div>

            <button
              onClick={handleSave}
              disabled={saving || loading || persons.length === 0 || isWeekend || !isToday}
              className={`w-full flex items-center justify-center gap-2 font-black text-xs py-3.5 px-5 rounded-2xl transition-all shadow-md ${
                hasUnsavedChanges && isToday
                  ? 'bg-[#6B805B] hover:bg-[#5A6E4B] text-white hover:scale-[1.03] hover:shadow-lg active:scale-98 cursor-pointer border-none'
                  : 'bg-white text-[#6B805B]/60 border-2 border-[#6B805B]/40 cursor-not-allowed shadow-sm'
              } transition-all duration-300`}
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              <span>{saving ? 'Saving...' : 'Save Records'}</span>
            </button>
          </motion.div>
        </div>

        {/* Right Column: Main Roster Container */}
        <motion.div
          initial={{ opacity: 0, x: 15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className="lg:col-span-8 bg-[#EDE3CE] border border-white/60 rounded-[32px] overflow-visible shadow-[-12px_-12px_32px_#ffffff,_12px_12px_32px_rgba(180,170,150,0.35)] flex flex-col p-5 md:p-6 gap-6"
        >
          {/* Unified, Compact Filter Toolbar - Single Row */}
          <div className="w-full flex items-center gap-1.5 pb-4 border-b border-[#EADFC9]/60 flex-wrap">
            {/* Search box */}
            <div className="relative p-0.5 bg-white border border-[#5C6E4E]/60 rounded-[14px] shadow-sm transition-all duration-300 hover:scale-105 hover:border-[#6B805B] hover:shadow-md">
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-7 pr-2 py-1.5 bg-slate-50 text-[#132c10] font-black text-[11px] placeholder-[#5C6E4E]/80 rounded-[10px] focus:outline-none transition-all shadow-[inset_1px_1px_2px_rgba(0,0,0,0.06)] min-w-[100px] max-w-[140px] focus:ring-1 focus:ring-[#6B805B]/50"
              />
              <Search size={11} className="absolute left-2.5 top-2.5 text-[#5C6E4E] stroke-[2.5]" />
            </div>

            <div className="h-5 w-[1.5px] bg-[#EADFC9]/60" />

            {/* Sort Controller */}
            <div className="flex items-center gap-1 border border-[#FDA769]/80 rounded-xl px-2.5 py-1.5 bg-white shadow-sm transition-all duration-300 hover:scale-105 hover:border-[#FDA769] hover:shadow-md">
              <ArrowUpDown size={10} className="text-[#d67a18] stroke-[2.5]" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent border-none text-[10px] font-black text-[#d67a18] focus:outline-none cursor-pointer"
              >
                <option value="name">Name</option>
                <option value="id">ID</option>
                <option value="status">Status</option>
              </select>
            </div>

            <div className="h-5 w-[1.5px] bg-[#EADFC9]/60" />

            {/* Bulk Actions */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={markAllPresent}
                title="Mark All Present"
                disabled={!isToday}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-black border border-[#6B805B]/70 text-[#3b4f2c] bg-[#8FA47F]/20 hover:bg-[#6B805B] hover:text-white transition-all duration-300 hover:scale-105 hover:shadow-md active:scale-95 disabled:opacity-40 cursor-pointer"
              >
                <CheckCircle2 size={10} className="stroke-[2.5]" /> Present
              </button>
              <button
                onClick={markAllAbsent}
                title="Mark All Absent"
                disabled={!isToday}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-black border border-[#b84d4d]/70 text-[#7a2e32] bg-[#E5B5B8]/25 hover:bg-[#b84d4d] hover:text-white transition-all duration-300 hover:scale-105 hover:shadow-md active:scale-95 disabled:opacity-40 cursor-pointer"
              >
                <XCircle size={10} className="stroke-[2.5]" /> Absent
              </button>
            </div>

            <div className="flex-1" />

            {/* Bulk In/Out Time */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 border border-[#6B805B]/65 rounded-xl px-2.5 py-1.5 bg-white shadow-sm transition-all duration-300 hover:scale-105 hover:border-[#6B805B] hover:shadow-md">
                <Clock size={10} className="text-[#6B805B] stroke-[2.5]" />
                <span className="text-[9px] font-black text-[#6B805B] uppercase">In</span>
                <input
                  type="time"
                  value={bulkInTime}
                  onChange={e => {
                    setBulkInTime(e.target.value);
                    applyBulkTime('checkInTime', e.target.value);
                  }}
                  disabled={!isToday}
                  className="bg-transparent border-none text-[11px] font-black text-[#5c6e4e] focus:outline-none cursor-pointer disabled:opacity-40 w-[55px]"
                />
              </div>
              <div className="flex items-center gap-1.5 border border-[#b84d4d]/65 rounded-xl px-2.5 py-1.5 bg-white shadow-sm transition-all duration-300 hover:scale-105 hover:border-[#b84d4d] hover:shadow-md">
                <Clock size={10} className="text-[#b84d4d] stroke-[2.5]" />
                <span className="text-[9px] font-black text-[#b84d4d] uppercase">Out</span>
                <input
                  type="time"
                  value={bulkOutTime}
                  onChange={e => {
                    setBulkOutTime(e.target.value);
                    applyBulkTime('checkOutTime', e.target.value);
                  }}
                  disabled={!isToday}
                  className="bg-transparent border-none text-[11px] font-black text-[#8c3b40] focus:outline-none cursor-pointer disabled:opacity-40 w-[55px]"
                />
              </div>
            </div>

            <div className="h-5 w-[1.5px] bg-[#EADFC9]/60" />

            {/* View Mode */}
            <div className="flex items-center gap-0.5 p-0.5 bg-white border border-[#EADFC9]/80 rounded-xl shadow-sm transition-all duration-300 hover:scale-105 hover:shadow-md">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1 rounded-lg transition-all duration-200 cursor-pointer ${viewMode === 'grid'
                  ? 'bg-[#6B805B] text-white shadow-sm scale-105'
                  : 'text-[#FDA769]/80 hover:text-[#FDA769] hover:scale-105'
                  }`}
                title="Grid View"
              >
                <LayoutGrid size={11} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1 rounded-lg transition-all duration-200 cursor-pointer ${viewMode === 'list'
                  ? 'bg-[#6B805B] text-white shadow-sm scale-105'
                  : 'text-[#FDA769]/80 hover:text-[#FDA769] hover:scale-105'
                  }`}
                title="Sheet View"
              >
                <List size={11} />
              </button>
            </div>
          </div>

          {/* Main Roster Body - Vertical Scrollable without scrollbar */}
          <div className="min-h-[400px] max-h-[680px] overflow-y-auto no-scrollbar pr-1">
            {loading ? (
              /* Shimmer Skeletons */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className="bg-white/80 backdrop-blur-sm p-4.5 rounded-2xl border border-white/20 shadow-sm flex flex-col gap-3.5 animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-200/60" />
                      <div className="flex-1">
                        <div className="h-3.5 bg-slate-200/60 rounded w-3/4 mb-1.5" />
                        <div className="h-2.5 bg-slate-200/60 rounded w-1/2" />
                      </div>
                    </div>
                    <div className="h-7 bg-slate-150/50 rounded-xl" />
                    <div className="flex gap-2">
                      <div className="h-7 bg-slate-150/50 rounded-xl flex-1" />
                      <div className="h-7 bg-slate-150/50 rounded-xl flex-1" />
                    </div>
                  </div>
                ))}
              </div>
            ) : sortedPersons.length === 0 ? (
              /* Empty state */
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white/80 backdrop-blur-sm border border-[#EADFC9]/30 rounded-2xl p-10 text-center shadow-sm max-w-md mx-auto flex flex-col items-center gap-3 mt-6"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#F5F2EB] text-[#FDA769] flex items-center justify-center border border-[#EADFC9]/40 shadow-sm">
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
                    className="mt-1 px-4 py-2 bg-[#6B805B] text-white rounded-xl text-[10px] font-bold shadow-sm hover:bg-[#5A6E4B] transition-all cursor-pointer"
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
                className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
              >
                {sortedPersons.map((person) => {
                  const rec = records[person._id] || { status: 'Absent', checkInTime: '', checkOutTime: '', isEarlyCheckOut: false, leaveReason: '' };
                  const isAbsent = rec.status === 'Absent';
                  const isCompact = cardSize === 'compact';

                  return (
                    <motion.div
                  key={person._id}
                  variants={listItemVariants}
                  whileHover={{ y: -3 }}
                  className="uiverse-card flex flex-col gap-4 relative overflow-hidden transition-all duration-300"
                >
                  <div className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`rounded-full bg-gradient-to-br border flex items-center justify-center font-black shrink-0 uppercase transition-transform duration-300 hover:scale-105 shadow-sm ${getAvatarGradient(person.name)} ${
                        isCompact ? 'w-8 h-8 text-[11px]' : 'w-10 h-10 text-sm'
                      }`}>
                        {person.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <span className="font-extrabold text-[#132c10] block truncate leading-tight text-[15px]" title={person.name}>
                          {person.name}
                        </span>
                        <span className="text-[10px] font-mono font-medium text-black/60 block mt-0.5">
                          ID: {person.employeeId}
                        </span>
                      </div>
                    </div>

                    <div className="uiverse-card__menu">
                      <svg xmlns="http://www.w3.org/2000/svg" width="4" viewBox="0 0 4 20" height="20" fill="none">
                        <g fill="#000">
                          <path d="m2 4c1.10457 0 2-.89543 2-2s-.89543-2-2-2-2 .89543-2 2 .89543 2 2 2z"></path>
                          <path d="m2 12c1.10457 0 2-.8954 2-2 0-1.10457-.89543-2-2-2s-2 .89543-2 2c0 1.1046.89543 2 2 2z"></path>
                          <path d="m2 20c1.10457 0 2-.8954 2-2s-.89543-2-2-2-2 .8954-2 2 .89543 2 2 2z"></path>
                        </g>
                      </svg>
                    </div>
                  </div>

                  {/* Quick Select Buttons */}
                  <div className="bg-[#F6DB96] border border-black/10 p-0.5 rounded-full flex items-center gap-0.5">
                    {(['Present', 'Absent', 'Late'] as const).map((st) => {
                      const isActive = rec.status === st;
                      return (
                        <button
                          key={st}
                          onClick={() => handleStatusChange(person._id, st)}
                          disabled={!isToday}
                          type="button"
                          className={`flex-1 rounded-full font-bold transition-all flex items-center justify-center gap-1 cursor-pointer py-1.5 px-2 text-[10px] ${
                            isActive
                              ? st === 'Present'
                                ? 'bg-[#6B805B] text-white shadow-sm'
                                : st === 'Absent'
                                  ? 'bg-[#b84d4d] text-white shadow-sm'
                                  : 'bg-[#d67a18] text-white shadow-sm'
                              : 'text-black/75 hover:bg-black/5'
                          } disabled:opacity-50 disabled:hover:bg-transparent`}
                        >
                          {st === 'Present' && <CheckCircle2 size={11} />}
                          {st === 'Absent' && <XCircle size={11} />}
                          {st === 'Late' && <Clock size={11} />}
                          <span>{st}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* In/Out Time - Compact inline row */}
                  <div className="flex items-center gap-1.5">
                    <div className="flex-1 flex items-center justify-between border border-black/10 bg-[#FAF8F5]/60 rounded-full px-3 py-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-bold text-black uppercase">In</span>
                        <input
                          type="time"
                          value={rec.checkInTime}
                          onChange={(e) => handleTimeChange(person._id, 'checkInTime', e.target.value)}
                          disabled={isAbsent || !isToday}
                          className="bg-transparent border-none text-[11px] text-black focus:outline-none disabled:opacity-40 font-bold w-[50px]"
                        />
                      </div>
                      <Clock size={11} className="text-black/60 shrink-0" />
                    </div>
                    <div className="flex-1 flex items-center justify-between border border-black/10 bg-[#FAF8F5]/60 rounded-full px-3 py-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-bold text-black uppercase">Out</span>
                        <input
                          type="time"
                          value={rec.checkOutTime}
                          onChange={(e) => handleTimeChange(person._id, 'checkOutTime', e.target.value)}
                          disabled={isAbsent || !isToday}
                          className="bg-transparent border-none text-[11px] text-black focus:outline-none disabled:opacity-40 font-bold w-[50px]"
                        />
                      </div>
                      <Clock size={11} className="text-black/60 shrink-0" />
                    </div>
                  </div>

                  {isAbsent && (
                    <input
                      type="text"
                      value={rec.leaveReason}
                      onChange={(e) => handleLeaveReasonChange(person._id, e.target.value)}
                      disabled={!isToday}
                      placeholder={isToday ? "Leave reason..." : "-"}
                      className="w-full border border-black/10 bg-[#FAF8F5]/60 rounded-full px-3.5 py-1.5 text-[10px] text-black focus:outline-none font-bold placeholder-black/40 disabled:opacity-50"
                    />
                  )}
                </motion.div>
                  );
                })}
              </motion.div>
            ) : (

              /* LIST VIEW - Compact grid/table style with dynamic density cardSize */
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white/80 backdrop-blur-sm border border-white/40 rounded-2xl overflow-hidden shadow-sm"
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[900px]">
                    <thead>
                      <tr className="bg-[#FAF8F5]/85 border-b border-[#EADFC9]/30">
                        <th className={`font-bold text-[#FDA769] text-[10px] uppercase tracking-widest ${cardSize === 'compact' ? 'px-4 py-3' : 'px-6 py-4'
                          }`}>
                          SVU Employee
                        </th>
                        <th className={`font-bold text-[#FDA769] text-[10px] uppercase tracking-widest text-center ${cardSize === 'compact' ? 'px-4 py-3' : 'px-6 py-4'
                          }`}>
                          Status Control
                        </th>
                        <th className={`font-bold text-[#FDA769] text-[10px] uppercase tracking-widest ${cardSize === 'compact' ? 'px-4 py-3' : 'px-6 py-4'
                          }`}>
                          In-Time
                        </th>
                        <th className={`font-bold text-[#FDA769] text-[10px] uppercase tracking-widest ${cardSize === 'compact' ? 'px-4 py-3' : 'px-6 py-4'
                          }`}>
                          Out-Time
                        </th>
                        <th className={`font-bold text-[#FDA769] text-[10px] uppercase tracking-widest ${cardSize === 'compact' ? 'px-4 py-3' : 'px-6 py-4'
                          }`}>
                          Leave Reason
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EADFC9]/20 bg-white/40">
                      {sortedPersons.map((person) => {
                        const rec = records[person._id] || { status: 'Absent', checkInTime: '', checkOutTime: '', isEarlyCheckOut: false, leaveReason: '' };
                        const isAbsent = rec.status === 'Absent';
                        const isCompact = cardSize === 'compact';

                        return (
                          <tr key={person._id} className="hover:bg-[#FAF8F5]/60 transition-colors border-b border-[#EADFC9]/25">
                            <td className={`flex items-center gap-3 ${isCompact ? 'px-4 py-2' : 'px-6 py-3.5'
                              }`}>
                              <div className={`rounded-xl bg-gradient-to-br border flex items-center justify-center font-black shrink-0 uppercase transition-transform duration-300 hover:scale-105 shadow-sm ${getAvatarGradient(person.name)} ${isCompact ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm'
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
                              <div className="inline-flex items-center gap-0.5 bg-[#F5F2EB]/65 border border-[#EADFC9]/30 p-0.5 rounded-xl">
                                {(['Present', 'Absent', 'Late'] as const).map(st => {
                                  const isActive = rec.status === st;
                                  return (
                                    <button
                                      key={st}
                                      onClick={() => handleStatusChange(person._id, st)}
                                      disabled={!isToday}
                                      className={`flex items-center gap-0.5 rounded-lg font-bold transition-all cursor-pointer ${isCompact ? 'px-2.5 py-1 text-[9px]' : 'px-4 py-1.5 text-xs'
                                        } ${isActive
                                          ? st === 'Present'
                                            ? 'bg-[#6B805B] text-white shadow-sm'
                                            : st === 'Absent'
                                              ? 'bg-[#C9979A] text-[#7A494B] shadow-sm'
                                              : 'bg-[#D67A18] text-white shadow-sm'
                                          : 'text-[#FDA769]/70 hover:text-[#FDA769] hover:bg-white/50'
                                        } disabled:opacity-50 disabled:cursor-not-allowed`}
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
                                disabled={isAbsent || !isToday}
                                className={`border border-[#EADFC9]/40 bg-[#FAF8F5] rounded-xl text-[#FDA769] focus:outline-none focus:ring-2 focus:ring-[#FDA769]/20 focus:border-[#FDA769] disabled:opacity-40 disabled:bg-[#FAF8F5]/40 font-bold shadow-[inset_1px_1px_2px_rgba(165,155,135,0.08)] ${isCompact ? 'px-2 py-1 text-[11px]' : 'px-3 py-1.5 text-xs'
                                  }`}
                              />
                            </td>
                            <td className={isCompact ? 'px-4 py-2' : 'px-6 py-3.5'}>
                              <input
                                type="time"
                                value={rec.checkOutTime}
                                onChange={(e) => handleTimeChange(person._id, 'checkOutTime', e.target.value)}
                                disabled={isAbsent || !isToday}
                                className={`border border-[#EADFC9]/40 bg-[#FAF8F5] rounded-xl text-[#FDA769] focus:outline-none focus:ring-2 focus:ring-[#FDA769]/20 focus:border-[#FDA769] disabled:opacity-40 disabled:bg-[#FAF8F5]/40 font-bold shadow-[inset_1px_1px_2px_rgba(165,155,135,0.08)] ${isCompact ? 'px-2 py-1 text-[11px]' : 'px-3 py-1.5 text-xs'
                                  }`}
                              />
                            </td>
                            <td className={isCompact ? 'px-4 py-2' : 'px-6 py-3.5'}>
                              <input
                                type="text"
                                value={rec.leaveReason}
                                onChange={(e) => handleLeaveReasonChange(person._id, e.target.value)}
                                disabled={!isAbsent || !isToday}
                                placeholder={isAbsent && isToday ? "Reason" : ""}
                                className={`w-full border border-[#EADFC9]/40 bg-[#FAF8F5] rounded-xl text-[#FDA769] focus:outline-none focus:ring-2 focus:ring-[#FDA769]/20 focus:border-[#FDA769] disabled:opacity-40 disabled:bg-[#FAF8F5]/40 font-bold shadow-[inset_1px_1px_2px_rgba(165,155,135,0.08)] ${isCompact ? 'px-2 py-1 text-[11px]' : 'px-3 py-1.5 text-xs'
                                  } ${isAbsent ? 'bg-[#FAF8F5]/30' : ''}`}
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
        </motion.div>
      </div>

    </div>
  );
}
