'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import PageHeader from '@/components/PageHeader';
import ToastNotification from '@/components/ToastNotification';
import {
  UserPlus,
  User,
  Hash,
  Loader2,
  Search,
  ArrowUpDown,
  LayoutGrid,
  List,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Users
} from 'lucide-react';


const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

type Person = { _id: string; name: string; employeeId: string };

type Toast = {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
};

export default function RosterPage() {
  const router = useRouter();
  const [persons, setPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [adding, setAdding] = useState(false);

  // Directory visual & interactive controls
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [cardSize, setCardSize] = useState<'compact' | 'comfortable'>('comfortable');
  const [sortBy, setSortBy] = useState<'name' | 'id'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    fetchPersons();
  }, []);

  const addToast = (message: string, type: 'success' | 'error' | 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const fetchPersons = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_URL}/persons`);
      if (data) {
        setPersons(data);
      }
    } catch (err) {
      console.error(err);
      addToast('Could not retrieve staff directory from server.', 'error');
      setPersons([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPerson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !employeeId) return;
    setAdding(true);
    try {
      await axios.post(`${API_URL}/persons`, { name, employeeId });
      addToast(`${name} registered successfully as SVU Employee!`, 'success');
      setName('');
      setEmployeeId('');
      fetchPersons();
    } catch (err) {
      console.error(err);
      addToast('Failed to add employee. Make sure ID is unique.', 'error');
    } finally {
      setAdding(false);
    }
  };

  // Unique avatar gradients based on first character hashes
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

  // Searching logic
  const filteredPersons = persons.filter(p => {
    const nameMatch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const rollMatch = (p.employeeId || '').toLowerCase().includes(searchQuery.toLowerCase());
    return nameMatch || rollMatch;
  });

  // Sorting logic
  const sortedPersons = [...filteredPersons].sort((a, b) => {
    let valA = '';
    let valB = '';

    if (sortBy === 'name') {
      valA = a.name.toLowerCase();
      valB = b.name.toLowerCase();
    } else if (sortBy === 'id') {
      valA = (a.employeeId || '').toLowerCase();
      valB = (b.employeeId || '').toLowerCase();
    }

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.04
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring' as const, stiffness: 100, damping: 15 }
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12 text-slate-800">

      {/* Toast Notification Container */}
      <ToastNotification toasts={toasts} onClose={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />

      <PageHeader
        title="SVU StaffSync AttendPro Directory"
        subtitle="Register new staff members and manage Sri Venkateswara University roster profiles."
        badge="Workspace"
        variant="green"
        actions={
          <span className="px-3.5 py-1.5 bg-[#FAF8F5]/80 border border-[#EADFC9]/40 text-[#6B805B] text-xs font-bold rounded-full shadow-sm">
            {persons.length} Employees Registered
          </span>
        }
      />

      {/* Two-Column Workspace Layout */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">

        {/* LEFT COLUMN: Registration Card Form */}
        <motion.div
          initial={{ opacity: 0, x: -15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.05 }}
          className="w-full lg:w-1/3 bg-[#EDE3CE] border border-white/60 rounded-[32px] p-5 shadow-[-12px_-12px_32px_#ffffff,_12px_12px_32px_rgba(180,170,150,0.35)] sticky top-6 flex flex-col gap-4"
        >
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-[#8FA47F]/10 flex items-center justify-center text-[#6B805B] border border-[#8FA47F]/20 shrink-0">
              <UserPlus size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Register Employee</h2>
              <p className="text-[10px] text-slate-500 font-bold">Add profile details to the SVU database.</p>
            </div>
          </div>

          <form onSubmit={handleAddPerson} className="flex flex-col gap-3.5">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.2">Employee Name</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-450 group-focus-within:text-indigo-600 transition-colors">
                  <User size={15} />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#EADFC9]/40 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FDA769]/20 transition-all font-bold shadow-[inset_1px_1px_2px_rgba(165,155,135,0.08)]"
                  placeholder="Full name (e.g. Dr. John Doe)"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.2">Employee ID / Code</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#FDA769] transition-colors">
                  <Hash size={15} />
                </div>
                <input
                  type="text"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#EADFC9]/40 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FDA769]/20 transition-all font-bold shadow-[inset_1px_1px_2px_rgba(165,155,135,0.08)]"
                  placeholder="Identity No. (e.g. SVU-1089)"
                  required
                />
              </div>
            </div>

            <button
               type="submit"
               disabled={adding}
               className="mt-2.5 w-full bg-[#6B805B] hover:bg-[#5A6E4B] disabled:bg-[#FAF8F5]/40 disabled:text-[#6B805B]/30 text-white font-bold py-2.5 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs"
             >
               {adding ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
               {adding ? 'Registering employee...' : 'Register Employee'}
             </button>
          </form>
        </motion.div>

        {/* RIGHT COLUMN: Interactive Active Directory */}
        <motion.div
          initial={{ opacity: 0, x: 15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.05 }}
          className="w-full flex-1 flex flex-col gap-4"
        >
          {/* Controls Bar: Searching, Filtering, Sorting, Density, and Views */}
          {/* Controls Bar: Searching, Filtering, Sorting, Density, and Views */}
          <div className="bg-[#EDE3CE] border border-white/60 rounded-[32px] p-5 shadow-[-12px_-12px_32px_#ffffff,_12px_12px_32px_rgba(180,170,150,0.35)] flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1 w-full max-w-sm">
              <input
                type="text"
                placeholder="Search by employee name or ID..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-[#EADFC9]/40 bg-[#FAF8F5] rounded-xl text-xs focus:outline-none placeholder-slate-400 font-bold shadow-[inset_1px_1px_2px_rgba(165,155,135,0.08)]"
              />
              <Search size={14} className="absolute left-3 top-3 text-[#5C6E4E] pointer-events-none" />
            </div>

            {/* Sorters, Density and Toggles */}
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">

              {/* Sorter */}
              <div className="flex items-center gap-1.5 border border-[#EADFC9]/40 rounded-xl px-2.5 py-1.5 bg-[#FAF8F5]/60 shadow-[inset_1px_1px_3px_rgba(165,155,135,0.08)]">
                <ArrowUpDown size={13} className="text-[#FDA769]" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent border-none text-[11px] font-bold text-[#FDA769] focus:outline-none cursor-pointer pr-1"
                >
                  <option value="name">Name</option>
                  <option value="id">Employee ID</option>
                </select>
                <button
                  onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                  className="p-0.5 hover:bg-[#FAF8F5]/80 rounded text-[#FDA769] transition-all cursor-pointer font-black text-xs leading-none"
                  title={sortOrder === 'asc' ? 'Sort Ascending' : 'Sort Descending'}
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>

              {/* Density sizes */}
              <div className="flex items-center gap-0.5 p-0.5 bg-[#FAF8F5] border border-[#EADFC9]/30 rounded-xl shadow-[inset_1px_1px_3px_rgba(165,155,135,0.08)]">
                <button
                  onClick={() => setCardSize('compact')}
                  className={`px-2.5 py-1.2 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${cardSize === 'compact'
                      ? 'bg-white text-[#6B805B] shadow-sm'
                      : 'text-[#FDA769]/60 hover:text-[#FDA769]'
                    }`}
                >
                  Compact
                </button>
                <button
                  onClick={() => setCardSize('comfortable')}
                  className={`px-2.5 py-1.2 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${cardSize === 'comfortable'
                      ? 'bg-white text-[#6B805B] shadow-sm'
                      : 'text-[#FDA769]/60 hover:text-[#FDA769]'
                    }`}
                >
                  Comfortable
                </button>
              </div>

              <div className="h-5 w-[1px] bg-[#EADFC9]/30 hidden sm:block" />

              {/* Layout view mode */}
              <div className="flex items-center gap-0.5 p-0.5 bg-[#FAF8F5] border border-[#EADFC9]/30 rounded-xl shadow-[inset_1px_1px_3px_rgba(165,155,135,0.08)]">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === 'grid'
                      ? 'bg-white text-[#6B805B] shadow-sm'
                      : 'text-[#FDA769]/60 hover:text-[#FDA769]'
                    }`}
                  title="Grid Cards View"
                >
                  <LayoutGrid size={13} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === 'list'
                      ? 'bg-white text-[#6B805B] shadow-sm'
                      : 'text-[#FDA769]/60 hover:text-[#FDA769]'
                    }`}
                  title="Sheet View"
                >
                  <List size={13} />
                </button>
              </div>

            </div>
          </div>

          {/* directory profiles area - scrollable without scrollbars */}
          <div className="min-h-[400px] max-h-[680px] overflow-y-auto no-scrollbar pr-1">
            {loading ? (
              /* Shimmer skeletons */
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 gap-4' : 'flex flex-col gap-3 bg-white/80 backdrop-blur-sm border border-[#EADFC9]/30 p-4 rounded-2xl shadow-sm'}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse py-2">
                    <div className="w-9 h-9 rounded bg-slate-200 shrink-0" />
                    <div className="flex-1">
                      <div className="h-3 bg-slate-200 rounded w-1/3 mb-1.5" />
                      <div className="h-2.5 bg-slate-200 rounded w-1/5" />
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
                  <Users size={24} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">No SVU Staff Enrolled</h3>
                  <p className="text-slate-500 text-xs mt-1 max-w-sm">
                    No active employee profile records match your search criteria. Try registering a new person or modifying filters.
                  </p>
                </div>
              </motion.div>
            ) : viewMode === 'grid' ? (

              /* GRID VIEW: Responsive elegant staff profiles */
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 sm:grid-cols-2 gap-4"
              >
                {sortedPersons.map((person) => {
                  const isCompact = cardSize === 'compact';
                  return (
                    <motion.div
                      key={person._id}
                      variants={itemVariants}
                      whileHover={{ y: -3, boxShadow: '0 12px 20px -8px rgba(107,128,91,0.12)' }}
                      className={`bg-white/90 backdrop-blur-sm rounded-2xl border transition-all relative overflow-hidden flex items-center gap-3 border-[#EADFC9]/45 hover:border-[#6B805B]/65 shadow-sm shadow-[#8FA47F]/5 ${isCompact ? 'p-3' : 'p-4.5'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                      <div className={`rounded-full bg-gradient-to-br border flex items-center justify-center font-black shrink-0 uppercase transition-transform duration-300 hover:scale-105 shadow-sm ${getAvatarGradient(person.name)} ${isCompact ? 'w-8 h-8 text-[11px]' : 'w-11 h-11 text-base'
                        }`}>
                        {person.name.charAt(0)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <span className={`font-bold text-slate-800 block truncate leading-tight ${isCompact ? 'text-xs' : 'text-sm'
                          }`} title={person.name}>
                          {person.name}
                        </span>
                        <span className="text-[10px] font-mono font-medium text-[#FDA769] block mt-0.5">
                          ID: {person.employeeId}
                        </span>
                      </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            ) : (

              /* LIST VIEW: Professional spacing data table list */
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-[#EDE3CE] border border-white/60 rounded-[32px] overflow-hidden shadow-[-12px_-12px_32px_#ffffff,_12px_12px_32px_rgba(180,170,150,0.35)] p-5 md:p-6 mt-1"
              >
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left border-collapse min-w-[500px] bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden shadow-sm">
                    <thead>
                      <tr className="bg-[#FAF8F5]/85 border-b border-[#EADFC9]/30">
                        <th className={`font-bold text-[#FDA769] text-[10px] uppercase tracking-widest ${cardSize === 'compact' ? 'px-4 py-3' : 'px-6 py-4'
                          }`}>
                          SVU Employee Profile
                        </th>
                        <th className={`font-bold text-[#FDA769] text-[10px] uppercase tracking-widest text-right ${cardSize === 'compact' ? 'px-4 py-3' : 'px-6 py-4'
                          }`}>
                          Employee ID Code
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EADFC9]/20 bg-white/40">
                      {sortedPersons.map((p) => {
                        const isCompact = cardSize === 'compact';
                        return (
                          <tr key={p._id} className="hover:bg-[#FAF8F5]/60 transition-colors border-b border-[#EADFC9]/25">
                            <td className={`flex items-center gap-3 ${isCompact ? 'px-4 py-2' : 'px-6 py-3.5'
                              }`}>
                              <div className={`rounded-full bg-gradient-to-br border flex items-center justify-center font-black shrink-0 uppercase transition-transform duration-300 hover:scale-105 shadow-sm ${getAvatarGradient(p.name)} ${isCompact ? 'w-8 h-8 text-[11px]' : 'w-10 h-10 text-sm'
                                }`}>
                                {p.name.charAt(0)}
                              </div>
                              <div>
                                <span className="text-xs font-bold text-slate-800 leading-none">{p.name}</span>
                                <span className="text-[9px] font-mono text-slate-400 block mt-0.5">SVU StaffSync AttendPro Registry</span>
                              </div>
                            </td>
                            <td className={`font-mono text-[#FDA769] font-bold text-xs text-right ${isCompact ? 'px-4 py-2.2' : 'px-6 py-3.5'
                              }`}>
                              {p.employeeId}
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
