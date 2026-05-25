'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { format } from 'date-fns';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { motion, AnimatePresence } from 'framer-motion';
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
  ChevronRight
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

export default function ReportsPage() {
  const router = useRouter();
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [data, setData] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Custom controls
  const [preset, setPreset] = useState<'week' | 'month' | 'year' | 'custom'>('custom');
  const [searchQuery, setSearchQuery] = useState('');
  const [cardSize, setCardSize] = useState<'compact' | 'comfortable'>('comfortable');
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      router.replace('/login');
    } else {
      setIsAuthChecking(false);
      fetchReports();
    }
  }, [startDate, endDate, router]);

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

  // Preset Date Range calculations
  const applyPreset = (selectedPreset: 'week' | 'month' | 'year' | 'custom') => {
    setPreset(selectedPreset);
    if (selectedPreset === 'custom') return;

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
      workbook.creator = 'SVU System';
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
      'from-indigo-500 to-purple-600 shadow-indigo-100',
      'from-emerald-400 to-teal-600 shadow-emerald-100',
      'from-rose-400 to-pink-600 shadow-rose-100',
      'from-amber-400 to-orange-500 shadow-amber-100',
      'from-sky-400 to-blue-600 shadow-sky-100',
      'from-fuchsia-500 to-pink-600 shadow-pink-100'
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

  // Calculate filtered stats
  const totalPresent = filteredData.filter(r => r.status === 'Present').length;
  const totalAbsent = filteredData.filter(r => r.status === 'Absent').length;
  const totalLate = filteredData.filter(r => r.status === 'Late').length;
  const totalEarlyOut = filteredData.filter(r => r.isEarlyCheckOut).length;
  const totalRecords = filteredData.length;

  if (isAuthChecking) {
    return (
      <div className="fixed inset-0 z-[200] bg-slate-50 flex items-center justify-center">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest animate-pulse">Authenticating...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12 text-slate-800">

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

      {/* Modern Header Area */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/60 p-5 rounded-md border border-slate-200/60 backdrop-blur-sm shadow-sm"
      >
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-[10px] font-bold text-indigo-700 bg-indigo-50 rounded flex items-center gap-1 border border-indigo-100/50">
              <Sparkles size={11} className="animate-pulse" /> SVU Data Ledger
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">Attendance Ledger & Reports</h1>
          <p className="text-slate-500 text-xs mt-0.5">Query ledger reports, filter by ranges, and download verified staff logs.</p>
        </div>

        <button
          onClick={exportExcel}
          disabled={filteredData.length === 0}
          className="flex items-center gap-2 font-bold text-xs py-3 px-6 bg-green-600 hover:bg-green-500 hover:shadow-sm active:scale-95 text-white rounded-sm shadow-sm shadow-green-100 hover:shadow-green-250 hover:-translate-y-0.5 border border-green-700/10 transition-all disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none disabled:-translate-y-0 disabled:scale-100 disabled:border-transparent cursor-pointer shrink-0"
        >
          <Download size={14} /> Export Excel
        </button>
      </motion.div>

      {/* Date preset tags & Date filter card form */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-white p-4.5 rounded-md border border-slate-200 shadow-sm flex flex-col gap-4"
      >
        {/* Preset Tabs (Week, Month, Year, Custom) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-1.5 p-0.5 bg-slate-100 rounded-sm">
            <button
              onClick={() => applyPreset('week')}
              className={`px-3.5 py-1.5 rounded-sm text-xs font-bold transition-all cursor-pointer ${preset === 'week'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-700'
                }`}
            >
              This Week
            </button>
            <button
              onClick={() => applyPreset('month')}
              className={`px-3.5 py-1.5 rounded-sm text-xs font-bold transition-all cursor-pointer ${preset === 'month'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-700'
                }`}
            >
              This Month
            </button>
            <button
              onClick={() => applyPreset('year')}
              className={`px-3.5 py-1.5 rounded-sm text-xs font-bold transition-all cursor-pointer ${preset === 'year'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-700'
                }`}
            >
              This Year
            </button>
            <button
              onClick={() => applyPreset('custom')}
              className={`px-3.5 py-1.5 rounded-sm text-xs font-bold transition-all cursor-pointer ${preset === 'custom'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-700'
                }`}
            >
              Custom Range
            </button>
          </div>

          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 border border-slate-200/50 px-2.5 py-1 rounded-sm">
            Scope: {preset === 'custom' ? 'Custom Range Selection' : `${preset}-wise scope`}
          </span>
        </div>

        {/* Date picking forms (shows custom picks or current display range) */}
        <form onSubmit={handleFilterSubmit} className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 w-full relative">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.2">Start Date</label>
            <div className="relative">
              <input
                type="date"
                value={startDate}
                onChange={e => {
                  setStartDate(e.target.value);
                  setPreset('custom');
                }}
                className="w-full bg-slate-50/50 border border-slate-200 rounded-sm pl-9 pr-3 py-2 text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
              <Calendar size={13} className="absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div className="flex-1 w-full relative">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.2">End Date</label>
            <div className="relative">
              <input
                type="date"
                value={endDate}
                onChange={e => {
                  setEndDate(e.target.value);
                  setPreset('custom');
                }}
                className="w-full bg-slate-50/50 border border-slate-200 rounded-sm pl-9 pr-3 py-2 text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
              <Calendar size={13} className="absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div className="flex-grow w-full relative">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.2">Attendance Status</label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full bg-slate-50/50 border border-slate-200 rounded-sm px-3 py-2.2 text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
              <option value="Late">Late</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto bg-indigo-50 hover:bg-indigo-150 text-indigo-755 border border-indigo-200/50 font-bold py-2.2 px-6 rounded-sm text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          >
            <Search size={14} /> Apply Filter
          </button>
        </form>
      </motion.div>

      {/* Reports Summary KPI Analytics Grid */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-5 gap-4"
      >
        {/* Total records */}
        <div className="bg-white p-3.5 rounded-sm border border-slate-200/60 shadow-sm flex items-center gap-3">
          <div className="w-8 h-8 rounded-sm bg-slate-50 text-slate-500 flex items-center justify-center shrink-0">
            <FileSpreadsheet size={15} />
          </div>
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Total Logs</p>
            <p className="text-base font-black text-slate-800">{totalRecords}</p>
          </div>
        </div>

        {/* Present days */}
        <div className="bg-white p-3.5 rounded-sm border border-slate-200/60 shadow-sm flex items-center gap-3">
          <div className="w-8 h-8 rounded-sm bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <UserCheck size={15} />
          </div>
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Present Days</p>
            <p className="text-base font-black text-slate-800">{totalPresent}</p>
          </div>
        </div>

        {/* Absent days */}
        <div className="bg-white p-3.5 rounded-sm border border-slate-200/60 shadow-sm flex items-center gap-3">
          <div className="w-8 h-8 rounded-sm bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <UserX size={15} />
          </div>
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Absent Days</p>
            <p className="text-base font-black text-slate-800">{totalAbsent}</p>
          </div>
        </div>

        {/* Late days */}
        <div className="bg-white p-3.5 rounded-sm border border-slate-200/60 shadow-sm flex items-center gap-3">
          <div className="w-8 h-8 rounded-sm bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock size={15} />
          </div>
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Late Days</p>
            <p className="text-base font-black text-slate-800">{totalLate}</p>
          </div>
        </div>

        {/* Early Checkout days */}
        <div className="bg-white p-3.5 rounded-sm border border-slate-200/60 shadow-sm flex items-center gap-3">
          <div className="w-8 h-8 rounded-sm bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
            <TrendingUp size={15} />
          </div>
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Early Departures</p>
            <p className="text-base font-black text-slate-800">{totalEarlyOut}</p>
          </div>
        </div>
      </motion.div>

      {/* Main Ledger Table Area */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="flex flex-col gap-4"
      >
        {/* Search, Filter Bar and Sizer */}
        <div className="bg-white p-4 rounded-sm border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative flex-1 w-full max-w-sm">
            <input
              type="text"
              placeholder="Search reports by employee name or ID..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-sm text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder-slate-400 font-semibold"
            />
            <Search size={14} className="absolute left-3 top-3 text-slate-400" />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Density:</span>
            <div className="flex items-center gap-0.5 p-0.5 bg-slate-100 rounded-sm">
              <button
                onClick={() => setCardSize('compact')}
                className={`px-2.5 py-1.2 rounded-sm text-[10px] font-bold transition-all cursor-pointer ${cardSize === 'compact'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-400 hover:text-slate-700'
                  }`}
              >
                Compact
              </button>
              <button
                onClick={() => setCardSize('comfortable')}
                className={`px-2.5 py-1.2 rounded-sm text-[10px] font-bold transition-all cursor-pointer ${cardSize === 'comfortable'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-400 hover:text-slate-700'
                  }`}
              >
                Comfortable
              </button>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white border border-slate-200 rounded-md overflow-hidden shadow-sm">
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
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200/80">
                    <th className={`font-bold text-slate-400 text-[10px] uppercase tracking-widest ${cardSize === 'compact' ? 'px-4 py-3' : 'px-6 py-4'
                      }`}>
                      Date Logged
                    </th>
                    <th className={`font-bold text-slate-400 text-[10px] uppercase tracking-widest ${cardSize === 'compact' ? 'px-4 py-3' : 'px-6 py-4'
                      }`}>
                      SVU Staff Employee
                    </th>
                    <th className={`font-bold text-slate-400 text-[10px] uppercase tracking-widest ${cardSize === 'compact' ? 'px-4 py-3' : 'px-6 py-4'
                      }`}>
                      Status
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
                      Early Checkout
                    </th>
                    <th className={`font-bold text-slate-400 text-[10px] uppercase tracking-widest ${cardSize === 'compact' ? 'px-4 py-3' : 'px-6 py-4'
                      }`}>
                      Leave Reason
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-16 text-center text-slate-500 font-bold text-xs">
                        No ledger logs match the current query dates or parameters.
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((row, i) => {
                      const isCompact = cardSize === 'compact';
                      let safeDateStr = 'N/A';
                      try {
                        if (row.date) safeDateStr = format(new Date(row.date), 'MMM d, yyyy');
                      } catch (e) { }

                      return (
                        <tr key={i} className="hover:bg-slate-50/50 transition-colors text-slate-800">
                          <td className={`font-bold text-slate-800 ${isCompact ? 'px-4 py-2.2 text-[11px]' : 'px-6 py-3.5 text-xs'
                            }`}>
                            {safeDateStr}
                          </td>
                          <td className={`flex items-center gap-2.5 ${isCompact ? 'px-4 py-2.2' : 'px-6 py-3.5'
                            }`}>
                            <div className={`rounded bg-gradient-to-tr ${getAvatarGradient(row.name)} flex items-center justify-center font-bold text-white shadow-sm shrink-0 uppercase ${isCompact ? 'w-7.5 h-7.5 text-[11px]' : 'w-9 h-9 text-xs'
                              }`}>
                              {row.name.charAt(0)}
                            </div>
                            <div>
                              <span className={`font-bold text-slate-800 block leading-tight ${isCompact ? 'text-xs' : 'text-sm'
                                }`}>{row.name}</span>
                              <span className="text-[9px] font-mono text-slate-400 block mt-0.5">ID: {row.employeeId}</span>
                            </div>
                          </td>
                          <td className={isCompact ? 'px-4 py-2.2' : 'px-6 py-3.5'}>
                            <span className={`inline-flex items-center font-bold border ${isCompact ? 'px-2 py-0.5 text-[9px] rounded-md' : 'px-2.5 py-0.5 rounded text-xs'
                              } ${row.status === 'Present' ? 'bg-emerald-50 text-emerald-700 border-emerald-250' :
                                row.status === 'Absent' ? 'bg-rose-50 text-rose-700 border-rose-250' :
                                  'bg-amber-50 text-amber-700 border-amber-250'
                              }`}>
                              {row.status}
                            </span>
                          </td>
                          <td className={`font-mono font-medium ${isCompact ? 'px-4 py-2.2 text-[11px]' : 'px-6 py-3.5 text-xs'
                            }`}>
                            {row.checkInTime || '-'}
                          </td>
                          <td className={`font-mono font-medium ${isCompact ? 'px-4 py-2.2 text-[11px]' : 'px-6 py-3.5 text-xs'
                            }`}>
                            {row.checkOutTime || '-'}
                          </td>
                          <td className={isCompact ? 'px-4 py-2.2' : 'px-6 py-3.5'}>
                            {row.isEarlyCheckOut ? (
                              <span className={`inline-flex items-center bg-rose-50 border border-rose-200 text-rose-750 font-bold ${isCompact ? 'px-1.5 py-0.5 text-[9px] rounded-md' : 'px-2 py-0.5 rounded-md text-[10px]'
                                }`}>
                                Early Out
                              </span>
                            ) : (
                              <span className="text-slate-350 text-xs">-</span>
                            )}
                          </td>
                          <td className={`font-medium text-slate-600 ${isCompact ? 'px-4 py-2.2 text-[11px]' : 'px-6 py-3.5 text-xs'
                            }`}>
                            {row.leaveReason || '-'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </motion.div>

    </div>
  );
}
