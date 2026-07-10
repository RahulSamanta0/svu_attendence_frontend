'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { format } from 'date-fns';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { motion, AnimatePresence } from 'framer-motion';
import PageHeader from '@/components/PageHeader';
import ToastNotification from '@/components/ToastNotification';
import {
  Download,
  Search,
  Loader2,
  Calendar,
  Sparkles,
  TrendingUp,
  UserCheck,
  UserX,
  Clock,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  RotateCcw
} from 'lucide-react';


const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

type ReportRow = {
  date: string;
  personId: string;
  name: string;
  employeeId: string;
  status: 'Present' | 'Absent' | 'Late';
  checkInTime: string;
  checkOutTime: string;
  isEarlyCheckOut: boolean;
  leaveReason?: string;
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

const isBetween = (date: Date, start: Date, end: Date) => {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const s = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
  const e = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();
  return d >= s && d <= e;
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

export default function ReportsPage() {
  const router = useRouter();
  const [data, setData] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Calendar States
  const [showCalendar, setShowCalendar] = useState(false);
  const [tempStartDate, setTempStartDate] = useState<Date | null>(null);
  const [tempEndDate, setTempEndDate] = useState<Date | null>(null);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());

  // Grouped date expanded states
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});

  // Custom controls
  const [preset, setPreset] = useState<'week' | 'month' | 'year' | 'custom'>('custom');
  const [searchQuery, setSearchQuery] = useState('');
  const cardSize = 'comfortable';
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    fetchReports();
  }, [startDate, endDate]);


  const addToast = (message: string, type: 'success' | 'error' | 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/reports`, {
        params: {
          startDate: startDate || undefined,
          endDate: endDate || undefined
        }
      });
      if (res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to retrieve reports from server.', 'error');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setStatusFilter('');
    setPreset('custom');
    setSearchQuery('');
    addToast('Filters successfully reset.', 'info');
  };

  const openCalendar = () => {
    setTempStartDate(startDate ? new Date(startDate) : null);
    setTempEndDate(endDate ? new Date(endDate) : null);
    setCalendarMonth(startDate ? new Date(startDate) : new Date());
    setShowCalendar(true);
  };

  const handleDateClick = (clickedDate: Date) => {
    if (!tempStartDate || (tempStartDate && tempEndDate)) {
      setTempStartDate(clickedDate);
      setTempEndDate(null);
    } else {
      if (clickedDate < tempStartDate) {
        setTempStartDate(clickedDate);
        setTempEndDate(null);
      } else {
        setTempEndDate(clickedDate);
        const startStr = tempStartDate.toISOString().split('T')[0];
        const endStr = clickedDate.toISOString().split('T')[0];
        setStartDate(startStr);
        setEndDate(endStr);
        setPreset('custom');
        setShowCalendar(false);
        addToast('Applied custom date range.', 'info');
      }
    }
  };

  // Preset Date Range calculations
  const applyPreset = (selectedPreset: 'week' | 'month' | 'year' | 'custom') => {
    setPreset(selectedPreset);
    if (selectedPreset === 'custom') {
      openCalendar();
      return;
    }

    const today = new Date();
    let start = new Date();

    if (selectedPreset === 'week') {
      // Calculate start of current week (Monday)
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1);
      start = new Date(today.setDate(diff));
    } else if (selectedPreset === 'month') {
      // Start of current month
      start = new Date(today.getFullYear(), today.getMonth(), 1);
    } else if (selectedPreset === 'year') {
      // Start of current year
      start = new Date(today.getFullYear(), 0, 1);
    }

    const startStr = start.toISOString().split('T')[0];
    const endStr = new Date().toISOString().split('T')[0];

    setStartDate(startStr);
    setEndDate(endStr);

    // Update temp states for calendar sync
    setTempStartDate(start);
    setTempEndDate(new Date());

    addToast(`Applied date filter: ${selectedPreset} wise.`, 'info');
  };

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReports();
  };

  const exportExcel = async () => {
    try {
      if (filteredData.length === 0) {
        addToast('No data available to export.', 'info');
        return;
      }

      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'SVU StaffSync AttendPro';
      workbook.created = new Date();

      const worksheet = workbook.addWorksheet('Attendance Report', {
        views: [{ state: 'frozen', ySplit: 1 }] // Freeze header row
      });

      worksheet.columns = [
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Name', key: 'name', width: 25 },
        { header: 'ID / Employee ID', key: 'employeeId', width: 20 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Check In', key: 'checkIn', width: 15 },
        { header: 'Check Out', key: 'checkOut', width: 15 },
        { header: 'Early Checkout', key: 'earlyCheckout', width: 15 },
        { header: 'Leave Reason', key: 'leaveReason', width: 25 }
      ];

      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
      headerRow.height = 25;

      filteredData.forEach((row, index) => {
        let safeDate = 'N/A';
        try {
          if (row.date) safeDate = format(new Date(row.date), 'yyyy-MM-dd');
        } catch (e) { }

        const addedRow = worksheet.addRow({
          date: safeDate,
          name: row.name,
          employeeId: row.employeeId || '-',
          status: row.status,
          checkIn: row.checkInTime || '-',
          checkOut: row.checkOutTime || '-',
          earlyCheckout: row.isEarlyCheckOut ? 'Yes' : 'No',
          leaveReason: row.leaveReason || '-'
        });

        if (index % 2 === 0) {
          addedRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
        }

        addedRow.eachCell((cell, colNumber) => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
          };
          if (colNumber !== 2 && colNumber !== 8) {
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
          } else {
            cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
          }
        });

        const statusCell = addedRow.getCell('status');
        statusCell.font = { bold: true };
        if (row.status === 'Present') statusCell.font.color = { argb: 'FF15803D' };
        else if (row.status === 'Absent') statusCell.font.color = { argb: 'FFBE123C' };
        else if (row.status === 'Late') statusCell.font.color = { argb: 'FFB45309' };
      });

      worksheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: filteredData.length + 1, column: 8 }
      };

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      const filename = `SVU_Attendance_Report_${preset !== 'custom' ? preset : 'custom'}_${format(new Date(), 'yyyyMMdd')}.xlsx`;
      saveAs(blob, filename);
      addToast(`Excel report successfully downloaded!`, 'success');
    } catch (err) {
      console.error("Export Error: ", err);
      addToast("Failed to export Excel file. See console.", "error");
    }
  };

  // Avatar CSS gradients based on character hashes
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

  // Real-time filters and search matching
  const filteredData = data.filter(row => {
    // Status Filter
    if (statusFilter && row.status !== statusFilter) return false;

    // Search Query
    const nameMatch = row.name.toLowerCase().includes(searchQuery.toLowerCase());
    const rollMatch = (row.employeeId || '').toLowerCase().includes(searchQuery.toLowerCase());
    return nameMatch || rollMatch;
  });

  // Group filteredData by date
  const groupedByDate = filteredData.reduce((acc, row) => {
    const dateKey = row.date; // e.g. "2026-07-02"
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(row);
    return acc;
  }, {} as Record<string, ReportRow[]>);

  // Sort dates descending
  const sortedDates = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a));

  const toggleDate = (dateKey: string) => {
    setExpandedDates(prev => ({
      ...prev,
      [dateKey]: !prev[dateKey]
    }));
  };

  // Calculate filtered stats
  const totalPresent = filteredData.filter(r => r.status === 'Present').length;
  const totalAbsent = filteredData.filter(r => r.status === 'Absent').length;
  const totalLate = filteredData.filter(r => r.status === 'Late').length;
  const totalEarlyOut = filteredData.filter(r => r.isEarlyCheckOut).length;
  const totalRecords = filteredData.length;

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12 text-slate-800">

      {/* Toast Notification Container */}
      <ToastNotification toasts={toasts} onClose={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />

      <PageHeader
        title="Attendance Ledger & Reports"
        subtitle="Query ledger reports, filter by ranges, and download verified staff logs."
        badge="SVU StaffSync AttendPro"
        variant="green"
      />

      {/* Reports Summary KPI Analytics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Total records (Speckled Sand/Beige Stone) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08, ease: "easeOut" }}
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
          className="bg-gradient-to-br from-[#F2EDE4] to-[#DDD5C7] p-4 rounded-2xl border border-white/30 shadow-[-6px_-6px_16px_rgba(255,255,255,0.95),_8px_8px_16px_rgba(180,170,150,0.28),_inset_2px_2px_4px_rgba(255,255,255,0.6),_inset_-2px_-2px_4px_rgba(0,0,0,0.06)] flex items-center gap-3 relative overflow-hidden group hover:shadow-[-8px_-8px_20px_rgba(255,255,255,1),_10px_10px_20px_rgba(180,170,150,0.38)] transition-all duration-300 cursor-pointer hover:-translate-y-0.5"
        >
          {/* SVG Silk Wave Accents with water wave animation */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 100 100" preserveAspectRatio="none">
            <motion.path
              d="M-5,82 C35,92 65,62 105,52 L105,105 L-5,105 Z"
              animate={{
                y: [0, 4, -4, 0]
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              fill="#000000"
              opacity="0.03"
            />
            <motion.path
              d="M-5,90 C45,95 75,72 105,62 L105,105 L-5,105 Z"
              animate={{
                y: [0, -4, 4, 0]
              }}
              transition={{
                duration: 11,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              fill="#000000"
              opacity="0.02"
            />
            <motion.path
              d="M-5,82 C35,92 65,62 105,52"
              animate={{
                y: [0, 4, -4, 0]
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              fill="none"
              stroke="#000000"
              strokeWidth="0.5"
              opacity="0.04"
            />
          </svg>

          <div className="w-8 h-8 rounded-xl bg-[#DDD5C7]/50 text-[#5A5043] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-sm border border-black/5 relative z-10">
            <FileSpreadsheet size={15} />
          </div>
          <div className="relative z-10">
            <p className="text-[9px] font-bold text-[#8C806F] uppercase tracking-widest">Total Logs</p>
            <p className="text-base font-black text-[#5A5043]">{totalRecords}</p>
          </div>
        </motion.div>

        {/* Present days (Sage/Olive Green Stone) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.13, ease: "easeOut" }}
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
          className="bg-gradient-to-br from-[#8FA47F] to-[#6B805B] p-4 rounded-2xl border border-white/20 shadow-[-6px_-6px_16px_rgba(255,255,255,0.45),_8px_8px_16px_rgba(107,128,91,0.28),_inset_2px_2px_4px_rgba(255,255,255,0.35),_inset_-2px_-2px_4px_rgba(0,0,0,0.18)] flex items-center gap-3 relative overflow-hidden group hover:shadow-[-8px_-8px_20px_rgba(255,255,255,0.55),_10px_10px_20px_rgba(107,128,91,0.38)] transition-all duration-300 cursor-pointer hover:-translate-y-0.5"
        >
          {/* SVG Silk Wave Accents with water wave animation */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 100 100" preserveAspectRatio="none">
            <motion.path
              d="M-5,82 C35,92 65,62 105,52 L105,105 L-5,105 Z"
              animate={{
                y: [0, 4, -4, 0]
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              fill="#ffffff"
              opacity="0.12"
            />
            <motion.path
              d="M-5,90 C45,95 75,72 105,62 L105,105 L-5,105 Z"
              animate={{
                y: [0, -4, 4, 0]
              }}
              transition={{
                duration: 11,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              fill="#ffffff"
              opacity="0.07"
            />
            <motion.path
              d="M-5,82 C35,92 65,62 105,52"
              animate={{
                y: [0, 4, -4, 0]
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut"
              }}
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
            <p className="text-[9px] font-bold text-emerald-105 uppercase tracking-widest">Present Days</p>
            <p className="text-base font-black text-white">{totalPresent}</p>
          </div>
        </motion.div>

        {/* Absent days (Soft Pink/Rose Stone) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.18, ease: "easeOut" }}
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
          className="bg-gradient-to-br from-[#E5B5B8] to-[#C9979A] p-4 rounded-2xl border border-white/20 shadow-[-6px_-6px_16px_rgba(255,255,255,0.55),_8px_8px_16px_rgba(201,150,154,0.28),_inset_2px_2px_4px_rgba(255,255,255,0.35),_inset_-2px_-2px_4px_rgba(0,0,0,0.18)] flex items-center gap-3 relative overflow-hidden group hover:shadow-[-8px_-8px_20px_rgba(255,255,255,0.65),_10px_10px_20px_rgba(201,150,154,0.38)] transition-all duration-300 cursor-pointer hover:-translate-y-0.5"
        >
          {/* SVG Silk Wave Accents with water wave animation */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 100 100" preserveAspectRatio="none">
            <motion.path
              d="M-5,82 C35,92 65,62 105,52 L105,105 L-5,105 Z"
              animate={{
                y: [0, 4, -4, 0]
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              fill="#ffffff"
              opacity="0.16"
            />
            <motion.path
              d="M-5,90 C45,95 75,72 105,62 L105,105 L-5,105 Z"
              animate={{
                y: [0, -4, 4, 0]
              }}
              transition={{
                duration: 11,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              fill="#ffffff"
              opacity="0.09"
            />
            <motion.path
              d="M-5,82 C35,92 65,62 105,52"
              animate={{
                y: [0, 4, -4, 0]
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut"
              }}
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
            <p className="text-[9px] font-bold text-[#9D686B] uppercase tracking-widest">Absent Days</p>
            <p className="text-base font-black text-[#7A494B]">{totalAbsent}</p>
          </div>
        </motion.div>

        {/* Late days (Honey Amber/Orange Stone) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.23, ease: "easeOut" }}
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
          className="bg-gradient-to-br from-[#F4A236] to-[#D67A18] p-4 rounded-2xl border border-white/20 shadow-[-6px_-6px_16px_rgba(255,255,255,0.45),_8px_8px_16px_rgba(214,122,24,0.28),_inset_2px_2px_4px_rgba(255,255,255,0.35),_inset_-2px_-2px_4px_rgba(0,0,0,0.18)] flex items-center gap-3 relative overflow-hidden group hover:shadow-[-8px_-8px_20px_rgba(255,255,255,0.55),_10px_10px_20px_rgba(214,122,24,0.38)] transition-all duration-300 cursor-pointer hover:-translate-y-0.5"
        >
          {/* SVG Silk Wave Accents with water wave animation */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 100 100" preserveAspectRatio="none">
            <motion.path
              d="M-5,82 C35,92 65,62 105,52 L105,105 L-5,105 Z"
              animate={{
                y: [0, 4, -4, 0]
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              fill="#ffffff"
              opacity="0.12"
            />
            <motion.path
              d="M-5,90 C45,95 75,72 105,62 L105,105 L-5,105 Z"
              animate={{
                y: [0, -4, 4, 0]
              }}
              transition={{
                duration: 11,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              fill="#ffffff"
              opacity="0.07"
            />
            <motion.path
              d="M-5,82 C35,92 65,62 105,52"
              animate={{
                y: [0, 4, -4, 0]
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut"
              }}
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
            <p className="text-[9px] font-bold text-amber-100 uppercase tracking-widest">Late Days</p>
            <p className="text-base font-black text-white">{totalLate}</p>
          </div>
        </motion.div>

        {/* Early Checkout days (Premium Warm Peach-Nude Stone) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.28, ease: "easeOut" }}
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
          className="bg-gradient-to-br from-[#E8C5AF] to-[#CD9B7F] p-4 rounded-2xl border border-white/20 shadow-[-6px_-6px_16px_rgba(255,255,255,0.55),_8px_8px_16px_rgba(205,155,127,0.28),_inset_2px_2px_4px_rgba(255,255,255,0.35),_inset_-2px_-2px_4px_rgba(0,0,0,0.18)] flex items-center gap-3 relative overflow-hidden group hover:shadow-[-8px_-8px_20px_rgba(255,255,255,0.65),_10px_10px_20px_rgba(205,155,127,0.38)] transition-all duration-300 cursor-pointer hover:-translate-y-0.5"
        >
          {/* SVG Silk Wave Accents with water wave animation */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 100 100" preserveAspectRatio="none">
            <motion.path
              d="M-5,82 C35,92 65,62 105,52 L105,105 L-5,105 Z"
              animate={{
                y: [0, 4, -4, 0]
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              fill="#ffffff"
              opacity="0.16"
            />
            <motion.path
              d="M-5,90 C45,95 75,72 105,62 L105,105 L-5,105 Z"
              animate={{
                y: [0, -4, 4, 0]
              }}
              transition={{
                duration: 11,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              fill="#ffffff"
              opacity="0.09"
            />
            <motion.path
              d="M-5,82 C35,92 65,62 105,52"
              animate={{
                y: [0, 4, -4, 0]
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              fill="none"
              stroke="#ffffff"
              strokeWidth="0.5"
              opacity="0.2"
            />
          </svg>

          <div className="w-8 h-8 rounded-xl bg-white/30 text-[#604230] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-sm border border-white/15 relative z-10">
            <TrendingUp size={15} />
          </div>
          <div className="relative z-10">
            <p className="text-[9px] font-bold text-[#825C44] uppercase tracking-widest">Early Departures</p>
            <p className="text-base font-black text-[#604230]">{totalEarlyOut}</p>
          </div>
        </motion.div>
      </div>

      {/* Main Ledger Table Area */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-[#EDE3CE] border border-white/60 rounded-[32px] overflow-visible shadow-[-12px_-12px_32px_#ffffff,_12px_12px_32px_rgba(180,170,150,0.35)] flex flex-col"
      >
        {/* Merged Filter & Search Toolbar Header */}
        <div className="bg-[#EDE3CE]/30 border-b border-[#EADFC9]/30 p-5 md:p-6 flex flex-col gap-5 rounded-t-[32px]">
          {/* Top Row: Title, Search & Density */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-black text-[#2E3F13] tracking-tight uppercase flex items-center gap-2">
                <FileSpreadsheet size={15} className="text-[#2E3F13] stroke-[2.5]" /> Attendance Ledger Logs
              </h2>
              <p className="text-[10px] text-slate-600 font-bold mt-0.5">Filter ranges, status categories, and search names to view staff logs</p>
            </div>

            <div className="flex items-center gap-3 w-full lg:w-auto">
              {/* Search Box */}
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Search staff name or ID..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-[#FAF8F5] border border-[#FDA769]/80 rounded-2xl text-xs text-[#8A4F19] focus:outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-[#FDA769] transition-all placeholder-[#8A4F19]/70 font-black shadow-[inset_2px_2px_5px_rgba(165,155,135,0.18),_inset_-3px_-3px_6px_#ffffff]"
                />
                <Search size={14} className="absolute left-3 top-3 text-[#8A4F19] stroke-[2.5]" />
              </div>
            </div>
          </div>

          {/* Bottom Row: Filter Dropdowns and Actions */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-4 border-t border-[#E3DEC3]/25">
            <div className="flex flex-wrap items-center gap-4 flex-1">
              {/* Preset Selector */}
              <div className="flex flex-col gap-1.5 w-full sm:flex-1 min-w-[150px]">
                <label className="block text-[9px] font-extrabold text-[#8A4F19] uppercase tracking-widest">
                  Preset Range
                </label>
                <div className="relative">
                  <select
                    value={preset}
                    onChange={e => applyPreset(e.target.value as any)}
                    className="w-full appearance-none bg-[#FAF8F5] border border-[#FDA769]/65 rounded-2xl pl-3 pr-8 py-2.5 text-xs text-[#8A4F19] font-black focus:outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-[#FDA769] transition-all shadow-[inset_2px_2px_5px_rgba(165,155,135,0.18),_inset_-3px_-3px_6px_#ffffff] cursor-pointer"
                  >
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="year">This Year</option>
                    <option value="custom">Custom Range</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#8A4F19]">
                    <ChevronRight size={14} className="rotate-90" />
                  </div>
                </div>
              </div>

              {/* Custom Date Range Picker */}
              <div className="flex flex-col gap-1.5 w-full sm:flex-1 min-w-[200px] relative">
                <label className="block text-[9px] font-extrabold text-[#8A4F19] uppercase tracking-widest">
                  Select Date Range
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      if (showCalendar) setShowCalendar(false);
                      else openCalendar();
                    }}
                    className="w-full bg-[#FAF8F5] border border-[#FDA769]/65 rounded-2xl pl-9 pr-3 py-2.5 text-xs text-[#8A4F19] font-black focus:outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-[#FDA769] transition-all shadow-[inset_2px_2px_5px_rgba(165,155,135,0.18),_inset_-3px_-3px_6px_#ffffff] cursor-pointer flex items-center justify-between text-left"
                  >
                    <span>
                      {startDate && endDate
                        ? `${format(new Date(startDate), 'MMM d, yyyy')} - ${format(new Date(endDate), 'MMM d, yyyy')}`
                        : 'Select Date Range'}
                    </span>
                    <Calendar size={14} className="text-[#8A4F19] shrink-0 ml-2" />
                  </button>

                  {/* Calendar Popover */}
                  <AnimatePresence>
                    {showCalendar && (
                      <>
                        <div
                          className="fixed inset-0 z-40 bg-transparent"
                          onClick={() => {
                            setShowCalendar(false);
                            setTempStartDate(startDate ? new Date(startDate) : null);
                            setTempEndDate(endDate ? new Date(endDate) : null);
                          }}
                        />
                        <motion.div
                          initial={{ opacity: 0, y: -8, scaleY: 0.95 }}
                          animate={{ opacity: 1, y: 0, scaleY: 1 }}
                          exit={{ opacity: 0, y: -8, scaleY: 0.95 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                          className="absolute top-full left-0 right-0 z-50 mt-1 bg-[#8A9A5B] border border-[#7D8C50] rounded-2xl shadow-2xl overflow-hidden flex flex-col font-sans origin-top"
                        >
                          {/* Sage Green Calendar Header & Month Grid Section */}
                          <div className="p-5 pb-5 text-white select-none">
                            {/* Month Selector Navigation Row */}
                            <div className="flex items-center justify-between mb-4">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
                                }}
                                className="p-1.5 hover:bg-white/10 rounded-full text-white cursor-pointer transition-all duration-200 active:scale-90"
                              >
                                <ChevronLeft size={16} />
                              </button>
                              <span className="text-xs font-black tracking-widest uppercase">
                                {format(calendarMonth, 'MMMM yyyy')}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
                                }}
                                className="p-1.5 hover:bg-white/10 rounded-full text-white cursor-pointer transition-all duration-200 active:scale-90"
                              >
                                <ChevronRight size={16} />
                              </button>
                            </div>

                            {/* Days of Week Header Row */}
                            <div className="grid grid-cols-7 gap-1 text-center mb-2">
                              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                                <span key={idx} className="text-[10px] font-bold text-white/50 uppercase tracking-wider">
                                  {day}
                                </span>
                              ))}
                            </div>

                            {/* Calendar Days Grid */}
                            <div className="grid grid-cols-7 gap-y-1.5 gap-x-1 text-center">
                              {getCalendarDays(calendarMonth).map(({ date, isCurrentMonth }, i) => {
                                const isToday = isSameDay(date, new Date());
                                const isSelectedStart = tempStartDate && isSameDay(date, tempStartDate);
                                const isSelectedEnd = tempEndDate && isSameDay(date, tempEndDate);
                                const isInRange = tempStartDate && tempEndDate && isBetween(date, tempStartDate, tempEndDate);

                                let btnClass = "text-xs h-8 w-8 flex items-center justify-center rounded-full font-bold transition-all duration-200 cursor-pointer relative ";

                                if (isSelectedStart || isSelectedEnd) {
                                  btnClass += "bg-[#4E5B2E] text-white font-extrabold shadow-sm";
                                } else if (isInRange) {
                                  btnClass += "bg-white/20 text-white font-bold";
                                } else if (isCurrentMonth) {
                                  btnClass += "text-white hover:bg-white/10";
                                } else {
                                  btnClass += "text-white/30 hover:bg-white/5";
                                }

                                const todayIndicator = isToday && !isSelectedStart && !isSelectedEnd;

                                return (
                                  <div key={i} className="flex justify-center items-center relative">
                                    <button
                                      key={i}
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDateClick(date);
                                      }}
                                      className={btnClass}
                                    >
                                      {date.getDate()}
                                      {todayIndicator && (
                                        <span className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full" />
                                      )}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Status Filter */}
              <div className="flex flex-col gap-1.5 w-full sm:flex-1 min-w-[150px]">
                <label className="block text-[9px] font-extrabold text-[#8A4F19] uppercase tracking-widest">
                  Attendance Status
                </label>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#FDA769]/65 rounded-2xl px-3 py-2.5 text-xs text-[#8A4F19] font-black focus:outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-[#FDA769] transition-all shadow-[inset_2px_2px_5px_rgba(165,155,135,0.18),_inset_-3px_-3px_6px_#ffffff] cursor-pointer"
                >
                  <option value="">All Statuses</option>
                  <option value="Present">Present</option>
                  <option value="Absent">Absent</option>
                  <option value="Late">Late</option>
                </select>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 w-full md:w-auto shrink-0 flex-wrap sm:flex-nowrap">
              <button
                onClick={handleResetFilters}
                className="flex-1 md:flex-none px-4 py-2.5 bg-white hover:bg-slate-50 text-[#8A4F19] font-black rounded-2xl text-xs transition-all border border-[#FDA769]/65 shadow-[-4px_-4px_12px_#ffffff,_6px_6px_12px_rgba(165,155,135,0.12)] hover:-translate-y-1 hover:shadow-[-6px_-6px_16px_#ffffff,_8px_8px_16px_rgba(165,155,135,0.18)] active:translate-y-0.5 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw size={14} className="stroke-[2.5]" /> Reset Filters
              </button>
              <button
                onClick={fetchReports}
                className="flex-1 md:flex-none px-5 py-2.5 bg-[#FDA769] hover:bg-[#e09156] text-white font-bold rounded-2xl text-xs transition-all border border-white/20 shadow-[-4px_-4px_12px_#ffffff,_6px_6px_12px_rgba(165,155,135,0.25),_inset_2px_2px_4px_rgba(255,255,255,0.4),_inset_-2px_-2px_4px_rgba(0,0,0,0.15)] hover:-translate-y-1 hover:shadow-[-6px_-6px_16px_#ffffff,_8px_8px_16px_rgba(165,155,135,0.32)] active:translate-y-0.5 active:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.18),_inset_-3px_-3px_6px_rgba(255,255,255,0.2)] flex items-center justify-center gap-2 cursor-pointer"
              >
                <Search size={14} /> Apply Filter
              </button>
              <button
                onClick={exportExcel}
                disabled={filteredData.length === 0}
                className="flex-1 md:flex-none px-5 py-2.5 bg-[#ABC270] hover:bg-[#9CAE65] text-white font-bold rounded-2xl text-xs transition-all border border-white/20 shadow-[-4px_-4px_12px_#ffffff,_6px_6px_12px_rgba(165,155,135,0.25),_inset_2px_2px_4px_rgba(255,255,255,0.4),_inset_-2px_-2px_4px_rgba(0,0,0,0.15)] hover:-translate-y-1 hover:shadow-[-6px_-6px_16px_#ffffff,_8px_8px_16px_rgba(165,155,135,0.32)] active:translate-y-0.5 active:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.18),_inset_-3px_-3px_6px_rgba(255,255,255,0.2)] disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none disabled:-translate-y-0 disabled:scale-100 cursor-pointer flex items-center justify-center gap-2"
              >
                <Download size={14} /> Export Excel
              </button>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div>
          {loading ? (
            /* Shimmer Skeleton Loader */
            <div className="p-12 flex flex-col gap-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse py-2">
                  <div className="w-8 h-8 rounded bg-slate-200 shrink-0" />
                  <div className="flex-grow flex items-center justify-between gap-6">
                    <div className="h-3 bg-slate-200 rounded w-1/4" />
                    <div className="h-3 bg-slate-200 rounded w-1/6" />
                    <div className="h-3 bg-slate-200 rounded w-1/12" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="w-full p-4 flex flex-col gap-4">
              {filteredData.length === 0 ? (
                <div className="px-6 py-16 text-center text-slate-500 font-bold text-xs bg-white rounded-md border border-slate-200/60 shadow-sm">
                  No ledger logs match the current query dates or parameters.
                </div>
              ) : (
                sortedDates.map((dateKey) => {
                  const isCompact = false;
                  let safeDateStr = 'N/A';
                  try {
                    if (dateKey) safeDateStr = format(new Date(dateKey), 'EEEE, MMMM d, yyyy');
                  } catch (e) { }

                  const isExpanded = !!expandedDates[dateKey];
                  const dayLogs = groupedByDate[dateKey];

                  return (
                    <div key={dateKey} className="flex flex-col">
                      <div
                        onClick={() => toggleDate(dateKey)}
                        className="px-6 py-3 bg-white hover:bg-slate-50/80 border-2 border-[#ABC270] cursor-pointer select-none flex items-center justify-between rounded-full shadow-[0_6px_15px_-3px_rgba(107,126,57,0.15),_0_2px_6px_-2px_rgba(107,126,57,0.1)] hover:shadow-[0_12px_24px_-5px_rgba(107,126,57,0.25)] text-[#6B7E39] transition-all hover:translate-x-0.5 active:translate-x-0"
                      >
                        <div className="flex items-center gap-2.5">
                          <ChevronRight
                            size={16}
                            className={`text-[#6B7E39] transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                          />
                          <span className="font-extrabold text-[#6B7E39] text-xs tracking-wide">{safeDateStr}</span>
                        </div>
                        <span className="text-[10px] font-extrabold text-[#6B7E39] bg-[#ABC270]/10 border border-[#9CAE65]/30 px-2.5 py-0.5 rounded-full shadow-sm">
                          {dayLogs.length} {dayLogs.length === 1 ? 'record' : 'records'}
                        </span>
                      </div>

                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.22, ease: 'easeInOut' }}
                            className="overflow-hidden bg-white rounded-md border border-slate-200/50 shadow-md mx-2 sm:mx-4 mt-3"
                          >
                            {/* Desktop Table View (Visible on medium screens and up) */}
                            <table className="hidden md:table w-full text-left border-collapse table-fixed">
                              <thead>
                                <tr className="bg-slate-50/40 border-b border-slate-200/40 text-slate-400">
                                  <th className={`w-[28%] font-bold text-[9px] uppercase tracking-widest ${isCompact ? 'px-4 py-2.5' : 'px-6 py-3.5'}`}>
                                    SVU Staff Employee
                                  </th>
                                  <th className={`w-[12%] font-bold text-[9px] uppercase tracking-widest ${isCompact ? 'px-4 py-2.5' : 'px-6 py-3.5'}`}>
                                    Status
                                  </th>
                                  <th className={`w-[12%] font-bold text-[9px] uppercase tracking-widest ${isCompact ? 'px-4 py-2.5' : 'px-6 py-3.5'}`}>
                                    In-Time
                                  </th>
                                  <th className={`w-[12%] font-bold text-[9px] uppercase tracking-widest ${isCompact ? 'px-4 py-2.5' : 'px-6 py-3.5'}`}>
                                    Out-Time
                                  </th>
                                  <th className={`w-[15%] font-bold text-[9px] uppercase tracking-widest ${isCompact ? 'px-4 py-2.5' : 'px-6 py-3.5'}`}>
                                    Early Checkout
                                  </th>
                                  <th className={`w-[21%] font-bold text-[9px] uppercase tracking-widest ${isCompact ? 'px-4 py-2.5' : 'px-6 py-3.5'}`}>
                                    Leave Reason
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {dayLogs.map((row, idx) => (
                                  <tr key={idx} className="hover:bg-slate-50/40 transition-colors text-slate-800 border-b border-slate-100/55 last:border-b-0">
                                    <td className={`w-[28%] flex items-center gap-3 ${isCompact ? 'px-4 py-2' : 'px-6 py-3.5'}`}>
                                      <div className={`rounded-full bg-gradient-to-br border flex items-center justify-center font-black shrink-0 uppercase transition-transform duration-300 hover:scale-105 shadow-sm ${getAvatarGradient(row.name)} ${isCompact ? 'w-8 h-8 text-[11px]' : 'w-10 h-10 text-sm'
                                        }`}>
                                        {row.name.charAt(0)}
                                      </div>
                                      <div>
                                        <span className={`font-bold text-slate-800 block leading-tight ${isCompact ? 'text-xs' : 'text-sm'
                                          }`}>{row.name}</span>
                                        <span className="text-[9px] font-mono text-slate-400 block mt-0.5">ID: {row.employeeId}</span>
                                      </div>
                                    </td>
                                    <td className={`w-[12%] ${isCompact ? 'px-4 py-2.2' : 'px-6 py-3.5'}`}>
                                      <span className={`inline-flex items-center font-bold border ${isCompact ? 'px-2 py-0.5 text-[9px] rounded-md' : 'px-2.5 py-0.5 rounded text-xs'
                                        } ${row.status === 'Present' ? 'bg-emerald-50 text-emerald-700 border-emerald-250' :
                                          row.status === 'Absent' ? 'bg-rose-50 text-rose-700 border-rose-250' :
                                            'bg-amber-50 text-amber-700 border-amber-250'
                                        }`}>
                                        {row.status}
                                      </span>
                                    </td>
                                    <td className={`w-[12%] font-mono font-medium ${isCompact ? 'px-4 py-2.2 text-[11px]' : 'px-6 py-3.5 text-xs'
                                      }`}>
                                      {row.checkInTime || '-'}
                                    </td>
                                    <td className={`w-[12%] font-mono font-medium ${isCompact ? 'px-4 py-2.2 text-[11px]' : 'px-6 py-3.5 text-xs'
                                      }`}>
                                      {row.checkOutTime || '-'}
                                    </td>
                                    <td className={`w-[15%] ${isCompact ? 'px-4 py-2.2' : 'px-6 py-3.5'}`}>
                                      {row.isEarlyCheckOut ? (
                                        <span className={`inline-flex items-center bg-rose-50 border border-rose-200 text-rose-750 font-bold ${isCompact ? 'px-1.5 py-0.5 text-[9px] rounded-md' : 'px-2 py-0.5 rounded-md text-[10px]'
                                          }`}>
                                          Early Out
                                        </span>
                                      ) : (
                                        <span className="text-slate-350 text-xs">-</span>
                                      )}
                                    </td>
                                    <td className={`w-[21%] font-medium text-slate-600 ${isCompact ? 'px-4 py-2.2 text-[11px]' : 'px-6 py-3.5 text-xs'
                                      }`}>
                                      {row.leaveReason || '-'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>

                            {/* Mobile Card List View (Visible on small screens) */}
                            <div className="block md:hidden divide-y divide-slate-100">
                              {dayLogs.map((row, idx) => (
                                <div key={idx} className="p-4 flex flex-col gap-3 hover:bg-slate-50/40 transition-colors">
                                  {/* Employee Header */}
                                  <div className="flex items-center gap-3">
                                    <div className={`rounded-full bg-gradient-to-br border flex items-center justify-center font-black shrink-0 uppercase shadow-sm ${getAvatarGradient(row.name)} w-9 h-9 text-xs`}>
                                      {row.name.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <span className="font-bold text-slate-800 block text-xs truncate">{row.name}</span>
                                      <span className="text-[9px] font-mono text-slate-400 block mt-0.5">ID: {row.employeeId}</span>
                                    </div>

                                    {/* Status Badge */}
                                    <span className={`inline-flex items-center font-bold border px-2 py-0.5 rounded text-[10px] ${row.status === 'Present' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                      row.status === 'Absent' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                        'bg-amber-50 text-amber-700 border-amber-250'
                                      }`}>
                                      {row.status}
                                    </span>
                                  </div>

                                  {/* Timings & Early Out */}
                                  <div className="grid grid-cols-2 gap-2 bg-slate-50/50 p-2.5 rounded border border-slate-100 text-[11px] font-medium text-slate-600">
                                    <div className="flex flex-col gap-0.5">
                                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">In-Time</span>
                                      <span className="font-mono text-slate-800">{row.checkInTime || '-'}</span>
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Out-Time</span>
                                      <span className="font-mono text-slate-800">{row.checkOutTime || '-'}</span>
                                    </div>
                                  </div>

                                  {/* Additional Status Details */}
                                  {(row.isEarlyCheckOut || row.leaveReason) && (
                                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                                      {row.isEarlyCheckOut && (
                                        <span className="inline-flex items-center bg-rose-50 border border-rose-200 text-rose-750 font-bold px-1.5 py-0.5 rounded-md text-[9px]">
                                          Early Out
                                        </span>
                                      )}
                                      {row.leaveReason && (
                                        <div className="flex-1 text-[10px] text-slate-500 font-medium">
                                          <span className="font-bold text-slate-400 mr-1">Reason:</span>
                                          {row.leaveReason}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </motion.div>

    </div>
  );
}
