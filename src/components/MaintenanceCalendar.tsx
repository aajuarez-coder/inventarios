import React, { useState, useMemo } from 'react';
import { useInventory } from '../context/InventoryContext';
import { HardwareAsset, Employee, Branch } from '../types/inventory';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Wrench, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Mail, 
  User, 
  Building2, 
  Laptop, 
  Filter, 
  Search, 
  RotateCcw,
  Sparkles,
  ArrowRight,
  CalendarCheck,
  CalendarClock,
  Layers
} from 'lucide-react';
import { formatDate } from '../utils/formatters';

export interface CalendarMaintenanceEvent {
  id: string;
  asset: HardwareAsset;
  dateStr: string; // YYYY-MM-DD
  isProjected: boolean;
  cycleNumber: number; // 0 for nextMaintenanceDate, 1, 2, 3 for future cycles
  employee?: Employee;
  branch?: Branch;
  status: 'vencido' | 'hoy' | 'proximo' | 'programado' | 'futuro_proyectado';
}

interface MaintenanceCalendarProps {
  onOpenServiceModal: (asset: HardwareAsset, scheduledDate?: string) => void;
  onOpenEmailModal: (asset: HardwareAsset) => void;
}

export const MaintenanceCalendar: React.FC<MaintenanceCalendarProps> = ({
  onOpenServiceModal,
  onOpenEmailModal
}) => {
  const { assets, employees, branches, updateAsset, canEdit } = useInventory();

  // Navigation State
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDayEvents, setSelectedDayEvents] = useState<{ dateStr: string; events: CalendarMaintenanceEvent[] } | null>(null);
  const [calendarFilter, setCalendarFilter] = useState<'all' | 'urgent' | 'scheduled' | 'projected'>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Reschedule state
  const [reschedulingAsset, setReschedulingAsset] = useState<HardwareAsset | null>(null);
  const [newScheduleDate, setNewScheduleDate] = useState('');
  const [rescheduleNotes, setRescheduleNotes] = useState('');
  const [rescheduleSuccess, setRescheduleSuccess] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  // Today string for comparison (YYYY-MM-DD)
  const todayStr = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }, []);

  // Compute all scheduled and projected maintenance events
  const allEvents = useMemo(() => {
    const events: CalendarMaintenanceEvent[] = [];
    const activeAssets = assets.filter(a => a.status !== 'baja');

    activeAssets.forEach(asset => {
      const employee = employees.find(e => e.id === asset.assignedToEmployeeId);
      const branch = branches.find(b => b.id === asset.branchId);
      const interval = asset.maintenanceIntervalMonths || 6;

      // 1. Direct Next Scheduled Date
      if (asset.nextMaintenanceDate) {
        const nextDate = asset.nextMaintenanceDate;
        let status: CalendarMaintenanceEvent['status'] = 'programado';

        if (nextDate < todayStr) {
          status = 'vencido';
        } else if (nextDate === todayStr) {
          status = 'hoy';
        } else {
          // Check if within 14 days
          const diffDays = Math.ceil((new Date(nextDate).getTime() - new Date(todayStr).getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays <= 14) {
            status = 'proximo';
          }
        }

        events.push({
          id: `${asset.id}-direct`,
          asset,
          dateStr: nextDate,
          isProjected: false,
          cycleNumber: 0,
          employee,
          branch,
          status
        });

        // 2. Project future recurring maintenance cycles (up to 4 future cycles across the next 2 years)
        const [startY, startM, startD] = nextDate.split('-').map(Number);
        if (startY && startM && startD) {
          for (let cycle = 1; cycle <= 4; cycle++) {
            const projectedMonthIndex = (startM - 1) + (cycle * interval);
            const projYear = startY + Math.floor(projectedMonthIndex / 12);
            const projMonth = (projectedMonthIndex % 12) + 1;
            const projDateStr = `${projYear}-${String(projMonth).padStart(2, '0')}-${String(startD).padStart(2, '0')}`;

            events.push({
              id: `${asset.id}-proj-${cycle}`,
              asset,
              dateStr: projDateStr,
              isProjected: true,
              cycleNumber: cycle,
              employee,
              branch,
              status: 'futuro_proyectado'
            });
          }
        }
      }
    });

    return events;
  }, [assets, employees, branches, todayStr]);

  // Filter events based on active filters
  const filteredEvents = useMemo(() => {
    return allEvents.filter(event => {
      // Branch filter
      if (branchFilter !== 'all' && event.asset.branchId !== branchFilter) {
        return false;
      }

      // Status/Urgency filter
      if (calendarFilter === 'urgent') {
        if (event.status !== 'vencido' && event.status !== 'hoy' && event.status !== 'proximo') {
          return false;
        }
      } else if (calendarFilter === 'scheduled') {
        if (event.isProjected) return false;
      } else if (calendarFilter === 'projected') {
        if (!event.isProjected) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTag = event.asset.assetTag.toLowerCase().includes(q);
        const matchesName = event.asset.name.toLowerCase().includes(q);
        const matchesModel = `${event.asset.brand} ${event.asset.model}`.toLowerCase().includes(q);
        const matchesEmp = event.employee?.fullName.toLowerCase().includes(q) || false;
        if (!matchesTag && !matchesName && !matchesModel && !matchesEmp) {
          return false;
        }
      }

      return true;
    });
  }, [allEvents, branchFilter, calendarFilter, searchQuery]);

  // Calendar matrix calculation for current month
  const calendarDays = useMemo(() => {
    // First day of current month
    const firstDayOfMonth = new Date(year, month, 1);
    // 0 = Sunday, 1 = Monday, ..., 6 = Saturday. In Spanish calendar, start with Monday = 0
    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6; // Sunday is index 6

    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const totalDaysInPrevMonth = new Date(year, month, 0).getDate();

    interface DayCell {
      dayNumber: number;
      dateStr: string;
      isCurrentMonth: boolean;
      isToday: boolean;
      events: CalendarMaintenanceEvent[];
    }

    const days: DayCell[] = [];

    // Previous month padding days
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dayNum = totalDaysInPrevMonth - i;
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      days.push({
        dayNumber: dayNum,
        dateStr,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        events: filteredEvents.filter(e => e.dateStr === dateStr)
      });
    }

    // Current month days
    for (let dayNum = 1; dayNum <= totalDaysInMonth; dayNum++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      days.push({
        dayNumber: dayNum,
        dateStr,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        events: filteredEvents.filter(e => e.dateStr === dateStr)
      });
    }

    // Next month padding days to complete 35 or 42 cells
    const remainingCells = (7 - (days.length % 7)) % 7;
    for (let dayNum = 1; dayNum <= remainingCells; dayNum++) {
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      days.push({
        dayNumber: dayNum,
        dateStr,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        events: filteredEvents.filter(e => e.dateStr === dateStr)
      });
    }

    return days;
  }, [year, month, filteredEvents, todayStr]);

  // Statistics for the current month
  const currentMonthStats = useMemo(() => {
    const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    const thisMonthEvents = allEvents.filter(e => e.dateStr.startsWith(monthPrefix));

    return {
      total: thisMonthEvents.length,
      direct: thisMonthEvents.filter(e => !e.isProjected).length,
      projected: thisMonthEvents.filter(e => e.isProjected).length,
      urgent: thisMonthEvents.filter(e => e.status === 'vencido' || e.status === 'hoy' || e.status === 'proximo').length,
    };
  }, [allEvents, year, month]);

  // Navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDayEvents(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDayEvents(null);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
    setSelectedDayEvents(null);
  };

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const weekDayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  // Handle rescheduling
  const handleConfirmReschedule = () => {
    if (!reschedulingAsset || !newScheduleDate) return;

    updateAsset(reschedulingAsset.id, {
      nextMaintenanceDate: newScheduleDate,
      notes: rescheduleNotes 
        ? `${reschedulingAsset.notes || ''} [Reprogramado mantenimiento al ${newScheduleDate}: ${rescheduleNotes}]`.trim() 
        : reschedulingAsset.notes
    });

    setRescheduleSuccess(true);
    setTimeout(() => {
      setRescheduleSuccess(false);
      setReschedulingAsset(null);
      setNewScheduleDate('');
      setRescheduleNotes('');
      // Refresh selected day if it was open
      setSelectedDayEvents(null);
    }, 1200);
  };

  return (
    <div className="space-y-4">
      
      {/* Calendar Top Control Header */}
      <div className="p-4 rounded-[6px] bg-[#131a26] border border-[rgba(248,250,252,0.1)] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Month Navigator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-[#0a0e14] border border-[rgba(248,250,252,0.1)] rounded-[6px] p-0.5">
            <button
              onClick={handlePrevMonth}
              title="Mes anterior"
              className="p-2 text-[rgba(248,250,252,0.7)] hover:text-white hover:bg-white/[0.04] rounded-[4px] transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-3 py-1.5 text-xs font-mono font-medium text-[rgba(248,250,252,0.8)] hover:text-white transition-colors cursor-pointer"
            >
              HOY
            </button>
            <button
              onClick={handleNextMonth}
              title="Mes siguiente"
              className="p-2 text-[rgba(248,250,252,0.7)] hover:text-white hover:bg-white/[0.04] rounded-[4px] transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div>
            <h2 className="font-syne text-lg sm:text-xl font-extrabold uppercase text-[#f8fafc] flex items-center gap-2">
              <span>{monthNames[month]}</span>
              <span className="text-[#ff8200]">{year}</span>
            </h2>
            <p className="label text-[9px] text-[rgba(248,250,252,0.5)]">
              Calendario Preventivo Corporativo TI
            </p>
          </div>
        </div>

        {/* Quick Month KPI Strip */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="px-3 py-1.5 rounded-[6px] bg-[#0a0e14] border border-[rgba(248,250,252,0.1)] flex items-center gap-2">
            <CalendarCheck className="w-3.5 h-3.5 text-[#004a99]" />
            <span className="text-[rgba(248,250,252,0.7)]">Este mes:</span>
            <strong className="font-mono text-[#f8fafc] font-bold">{currentMonthStats.total}</strong>
          </div>

          {currentMonthStats.urgent > 0 && (
            <div className="px-3 py-1.5 rounded-[6px] bg-rose-500/10 border border-rose-500/20 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-rose-300 font-mono text-[11px] font-semibold">
                {currentMonthStats.urgent} Urgentes / Por Vencer
              </span>
            </div>
          )}

          <div className="px-3 py-1.5 rounded-[6px] bg-[#004a99]/20 border border-[#004a99]/40 flex items-center gap-2">
            <CalendarClock className="w-3.5 h-3.5 text-[#ff8200]" />
            <span className="text-cyan-200 font-mono text-[11px]">
              {currentMonthStats.projected} Proyecciones Futuras
            </span>
          </div>
        </div>

      </div>

      {/* Filter and Search Bar for Calendar */}
      <div className="p-3.5 rounded-[6px] bg-[#131a26] border border-[rgba(248,250,252,0.1)] flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        
        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 text-[rgba(248,250,252,0.4)] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por placa, equipo o colaborador..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0a0e14] border border-[rgba(248,250,252,0.1)] rounded-[6px] pl-9 pr-3 py-1.5 text-xs text-[#f8fafc] placeholder:text-[rgba(248,250,252,0.35)] focus:border-[#ff8200] outline-hidden font-mono"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Branch filter */}
          <div className="flex items-center gap-1.5 bg-[#0a0e14] border border-[rgba(248,250,252,0.1)] rounded-[6px] px-2 py-1">
            <Building2 className="w-3.5 h-3.5 text-[rgba(248,250,252,0.4)]" />
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="bg-transparent text-[#f8fafc] text-xs outline-hidden cursor-pointer font-mono"
            >
              <option value="all" className="bg-[#131a26] text-white">Todas las Sedes</option>
              {branches.map(b => (
                <option key={b.id} value={b.id} className="bg-[#131a26] text-white">
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Urgency buttons */}
          <div className="inline-flex rounded-[6px] bg-[#0a0e14] p-0.5 border border-[rgba(248,250,252,0.1)]">
            <button
              onClick={() => setCalendarFilter('all')}
              className={`px-2.5 py-1 rounded-[4px] font-mono text-[11px] transition-colors cursor-pointer ${
                calendarFilter === 'all' 
                  ? 'bg-[#004a99] text-white font-semibold' 
                  : 'text-[rgba(248,250,252,0.6)] hover:text-white'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setCalendarFilter('urgent')}
              className={`px-2.5 py-1 rounded-[4px] font-mono text-[11px] transition-colors cursor-pointer ${
                calendarFilter === 'urgent' 
                  ? 'bg-rose-600 text-white font-semibold' 
                  : 'text-rose-400 hover:text-rose-300'
              }`}
            >
              Urgentes
            </button>
            <button
              onClick={() => setCalendarFilter('scheduled')}
              className={`px-2.5 py-1 rounded-[4px] font-mono text-[11px] transition-colors cursor-pointer ${
                calendarFilter === 'scheduled' 
                  ? 'bg-[#ff8200] text-slate-950 font-bold' 
                  : 'text-[rgba(248,250,252,0.6)] hover:text-white'
              }`}
            >
              Programados
            </button>
            <button
              onClick={() => setCalendarFilter('projected')}
              className={`px-2.5 py-1 rounded-[4px] font-mono text-[11px] transition-colors cursor-pointer ${
                calendarFilter === 'projected' 
                  ? 'bg-indigo-600 text-white font-semibold' 
                  : 'text-[rgba(248,250,252,0.6)] hover:text-white'
              }`}
            >
              Futuros Proyectados
            </button>
          </div>
        </div>

      </div>

      {/* Main 7-Day Calendar Grid */}
      <div className="bg-[#131a26] rounded-[6px] border border-[rgba(248,250,252,0.1)] overflow-hidden shadow-xl">
        
        {/* Days of week header */}
        <div className="grid grid-cols-7 border-b border-[rgba(248,250,252,0.1)] bg-[#0a0e14]">
          {weekDayNames.map((dayName, idx) => (
            <div 
              key={dayName} 
              className={`py-2 text-center font-mono text-[11px] font-bold tracking-wider uppercase ${
                idx >= 5 ? 'text-[rgba(248,250,252,0.4)]' : 'text-[#ff8200]'
              }`}
            >
              {dayName}
            </div>
          ))}
        </div>

        {/* Days cells */}
        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-[rgba(248,250,252,0.06)]">
          {calendarDays.map((cell, idx) => {
            const hasEvents = cell.events.length > 0;
            const isSelected = selectedDayEvents?.dateStr === cell.dateStr;
            const hasUrgent = cell.events.some(e => e.status === 'vencido' || e.status === 'hoy');

            return (
              <div
                key={`${cell.dateStr}-${idx}`}
                onClick={() => {
                  if (hasEvents) {
                    setSelectedDayEvents({ dateStr: cell.dateStr, events: cell.events });
                  } else {
                    setSelectedDayEvents(null);
                  }
                }}
                className={`min-h-[96px] sm:min-h-[115px] p-1.5 sm:p-2 transition-all flex flex-col justify-between ${
                  cell.isCurrentMonth ? 'bg-[#131a26]' : 'bg-[#0a0e14]/60 opacity-40'
                } ${
                  hasEvents ? 'cursor-pointer hover:bg-white/[0.04]' : 'cursor-default'
                } ${
                  isSelected ? 'ring-2 ring-[#ff8200] bg-[#1a2538]' : ''
                } ${
                  cell.isToday ? 'border-t-2 border-t-[#004a99] bg-[#004a99]/5' : ''
                }`}
              >
                {/* Day Header */}
                <div className="flex items-center justify-between mb-1">
                  <span className={`font-mono text-xs font-semibold ${
                    cell.isToday 
                      ? 'w-6 h-6 rounded-full bg-[#004a99] text-white flex items-center justify-center font-bold shadow-xs' 
                      : cell.isCurrentMonth ? 'text-[#f8fafc]' : 'text-[rgba(248,250,252,0.4)]'
                  }`}>
                    {cell.dayNumber}
                  </span>

                  {cell.isToday && (
                    <span className="hidden sm:inline-block label text-[8px] text-[#ff8200] font-mono font-bold">
                      HOY
                    </span>
                  )}

                  {hasEvents && (
                    <span className={`font-mono text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      hasUrgent 
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                        : 'bg-[#004a99]/20 text-[#60a5fa] border border-[#004a99]/30'
                    }`}>
                      {cell.events.length}
                    </span>
                  )}
                </div>

                {/* Event Chips (rendered up to 2, then +X more) */}
                <div className="space-y-1 flex-1 overflow-hidden">
                  {cell.events.slice(0, 2).map((ev) => {
                    const isUrgent = ev.status === 'vencido' || ev.status === 'hoy';
                    const isNear = ev.status === 'proximo';
                    const isProj = ev.isProjected;

                    return (
                      <div
                        key={ev.id}
                        title={`${ev.asset.assetTag} - ${ev.asset.name} (${ev.employee?.fullName || 'Almacén'})`}
                        className={`px-1.5 py-0.5 rounded-[4px] text-[10px] font-mono truncate flex items-center gap-1 border transition-all ${
                          isUrgent
                            ? 'bg-rose-500/20 border-rose-500/40 text-rose-200'
                            : isNear
                            ? 'bg-amber-500/20 border-amber-500/40 text-amber-200'
                            : isProj
                            ? 'bg-[#004a99]/30 border-[#004a99]/40 text-cyan-200'
                            : 'bg-[#ff8200]/15 border-[#ff8200]/30 text-[#ff8200]'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          isUrgent ? 'bg-rose-500 animate-ping' : isNear ? 'bg-amber-400' : isProj ? 'bg-[#38bdf8]' : 'bg-[#ff8200]'
                        }`} />
                        <span className="truncate font-semibold">{ev.asset.assetTag}</span>
                        <span className="hidden sm:inline text-[8px] opacity-70 truncate">{ev.asset.model}</span>
                      </div>
                    );
                  })}

                  {cell.events.length > 2 && (
                    <p className="text-[9px] font-mono text-[rgba(248,250,252,0.5)] pl-1">
                      +{cell.events.length - 2} más...
                    </p>
                  )}
                </div>

              </div>
            );
          })}
        </div>

      </div>

      {/* Legend strip */}
      <div className="p-3 rounded-[6px] bg-[#131a26] border border-[rgba(248,250,252,0.1)] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <span className="label text-[10px] text-[rgba(248,250,252,0.5)]">Simbología del Calendario:</span>
          
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span className="text-[11px] text-[rgba(248,250,252,0.8)] font-mono">Vencido / Requerido</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="text-[11px] text-[rgba(248,250,252,0.8)] font-mono">Próximo (&le; 14 días)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff8200]" />
            <span className="text-[11px] text-[rgba(248,250,252,0.8)] font-mono">Programado Inmediato</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#38bdf8]" />
            <span className="text-[11px] text-[rgba(248,250,252,0.8)] font-mono">Proyección Futura (Ciclo Preventivo)</span>
          </div>
        </div>

        <span className="font-mono text-[10px] text-[rgba(248,250,252,0.4)]">
          Haz clic en cualquier día con equipos para ver detalles y gestionar
        </span>
      </div>

      {/* Detail Slideover / Modal for Selected Day */}
      {selectedDayEvents && (
        <div className="p-5 rounded-[6px] bg-[#131a26] border-2 border-[#ff8200]/60 shadow-2xl animate-in fade-in slide-in-from-bottom-2 space-y-4">
          <div className="flex items-start justify-between pb-3 border-b border-[rgba(248,250,252,0.1)]">
            <div>
              <p className="label text-[#ff8200] font-mono">Equipos Programados para Mantenimiento</p>
              <h3 className="font-syne text-lg font-bold text-[#f8fafc] uppercase mt-0.5 flex items-center gap-2">
                <span>{formatDate(selectedDayEvents.dateStr)}</span>
                <span className="text-xs px-2 py-0.5 rounded-[4px] bg-[#004a99] text-white font-mono">
                  {selectedDayEvents.events.length} {selectedDayEvents.events.length === 1 ? 'Equipo' : 'Equipos'}
                </span>
              </h3>
            </div>
            <button
              onClick={() => setSelectedDayEvents(null)}
              className="p-1 rounded-[4px] text-[rgba(248,250,252,0.5)] hover:text-white hover:bg-white/[0.04] transition-colors cursor-pointer"
            >
              ✕ Cerrar
            </button>
          </div>

          {/* List of assets on this date */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {selectedDayEvents.events.map(ev => {
              const isPast = ev.status === 'vencido';
              const isProj = ev.isProjected;

              return (
                <div 
                  key={ev.id}
                  className="p-3.5 rounded-[6px] bg-[#0a0e14] border border-[rgba(248,250,252,0.1)] hover:border-[rgba(248,250,252,0.25)] transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Top Tag & Status */}
                    <div className="flex items-center justify-between pb-2 border-b border-[rgba(248,250,252,0.08)]">
                      <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-[#f8fafc]">
                        <Laptop className="w-3.5 h-3.5 text-[#ff8200]" />
                        <span>{ev.asset.assetTag}</span>
                      </div>

                      <span className={`label text-[9px] px-2 py-0.5 rounded-[4px] font-mono ${
                        isPast 
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                          : isProj
                          ? 'bg-[#004a99]/20 text-[#60a5fa] border border-[#004a99]/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {isPast ? 'VENCIDO' : isProj ? `FUTURO (CICLO #${ev.cycleNumber})` : 'PROGRAMADO'}
                      </span>
                    </div>

                    {/* Hardware info */}
                    <div className="mt-2.5">
                      <p className="font-bold text-xs text-[#f8fafc]">
                        {ev.asset.brand} {ev.asset.model}
                      </p>
                      <p className="text-[10px] text-[rgba(248,250,252,0.4)] font-mono">
                        Serie: {ev.asset.serialNumber} • {ev.asset.category.toUpperCase()}
                      </p>
                    </div>

                    {/* Custodian and branch */}
                    <div className="mt-2 text-xs space-y-1 bg-[#131a26] p-2 rounded-[4px] border border-[rgba(248,250,252,0.06)]">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-[rgba(248,250,252,0.4)] font-mono">Custodio:</span>
                        <span className="text-[#f8fafc] font-medium truncate max-w-[140px]">
                          {ev.employee?.fullName || 'Stock Almacén TI'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-[rgba(248,250,252,0.4)] font-mono">Sede:</span>
                        <span className="text-[rgba(248,250,252,0.8)] truncate max-w-[140px]">
                          {ev.branch?.name || 'Mazatlán'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-[rgba(248,250,252,0.4)] font-mono">Frecuencia:</span>
                        <span className="text-[#ff8200] font-mono">
                          Cada {ev.asset.maintenanceIntervalMonths || 6} meses
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="mt-3 pt-2.5 border-t border-[rgba(248,250,252,0.08)] flex items-center gap-1.5">
                    <button
                      onClick={() => onOpenServiceModal(ev.asset, selectedDayEvents.dateStr)}
                      disabled={!canEdit}
                      className="flex-1 py-1.5 px-2 rounded-[4px] bg-[#ff8200] hover:bg-[#ff9426] disabled:opacity-50 text-white font-mono text-[10px] font-bold uppercase transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      title="Registrar servicio preventivo para este equipo"
                    >
                      <Wrench className="w-3 h-3" />
                      <span>Servicio</span>
                    </button>

                    {ev.employee && (
                      <button
                        onClick={() => onOpenEmailModal(ev.asset)}
                        className="py-1.5 px-2 rounded-[4px] bg-[#004a99] hover:bg-[#005bbd] text-white font-mono text-[10px] transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        title="Enviar correo institucional con recordatorio"
                      >
                        <Mail className="w-3 h-3" />
                        <span>Aviso</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setReschedulingAsset(ev.asset);
                        setNewScheduleDate(ev.asset.nextMaintenanceDate);
                      }}
                      disabled={!canEdit}
                      className="py-1.5 px-2 rounded-[4px] bg-[#131a26] hover:bg-[#1e2a3c] disabled:opacity-50 text-[rgba(248,250,252,0.8)] border border-[rgba(248,250,252,0.1)] font-mono text-[10px] transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      title="Reprogramar fecha de mantenimiento"
                    >
                      <RotateCcw className="w-3 h-3 text-[#ff8200]" />
                      <span>Mover</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {reschedulingAsset && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-[6px] bg-[#131a26] border border-[rgba(248,250,252,0.15)] shadow-2xl p-5 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(248,250,252,0.1)]">
              <div>
                <p className="label text-[#ff8200] font-mono">Modificación de Cronograma</p>
                <h3 className="font-syne text-base font-bold text-[#f8fafc] uppercase">
                  Reprogramar Mantenimiento
                </h3>
              </div>
              <button
                onClick={() => setReschedulingAsset(null)}
                className="text-[rgba(248,250,252,0.5)] hover:text-white"
              >
                ✕
              </button>
            </div>

            {rescheduleSuccess ? (
              <div className="p-4 rounded-[6px] bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2 font-mono">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Fecha reprogramada exitosamente en la base de datos corporativa.</span>
              </div>
            ) : (
              <div className="space-y-3.5 text-xs">
                <div className="p-2.5 rounded-[4px] bg-[#0a0e14] border border-[rgba(248,250,252,0.08)]">
                  <p className="font-bold text-[#f8fafc]">{reschedulingAsset.assetTag} - {reschedulingAsset.brand} {reschedulingAsset.model}</p>
                  <p className="text-[10px] text-[rgba(248,250,252,0.5)] font-mono mt-0.5">
                    Fecha actual programada: <strong className="text-white">{reschedulingAsset.nextMaintenanceDate}</strong>
                  </p>
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase text-[rgba(248,250,252,0.6)] mb-1">
                    Nueva Fecha de Mantenimiento Programada
                  </label>
                  <input
                    type="date"
                    value={newScheduleDate}
                    onChange={(e) => setNewScheduleDate(e.target.value)}
                    className="w-full bg-[#0a0e14] border border-[rgba(248,250,252,0.15)] rounded-[6px] px-3 py-2 text-xs text-[#f8fafc] font-mono focus:border-[#ff8200] outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase text-[rgba(248,250,252,0.6)] mb-1">
                    Motivo / Observación de Reprogramación (Opcional)
                  </label>
                  <textarea
                    rows={2}
                    value={rescheduleNotes}
                    onChange={(e) => setRescheduleNotes(e.target.value)}
                    placeholder="Ej. Solicitud de usuario por viaje laboral o requerimiento de taller..."
                    className="w-full bg-[#0a0e14] border border-[rgba(248,250,252,0.15)] rounded-[6px] px-3 py-2 text-xs text-[#f8fafc] placeholder:text-[rgba(248,250,252,0.3)] focus:border-[#ff8200] outline-hidden"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[rgba(248,250,252,0.1)]">
                  <button
                    onClick={() => setReschedulingAsset(null)}
                    className="px-3 py-2 rounded-[4px] bg-[#0a0e14] hover:bg-[#1a2538] text-[rgba(248,250,252,0.7)] text-xs font-mono transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirmReschedule}
                    disabled={!newScheduleDate}
                    className="px-4 py-2 rounded-[4px] bg-[#ff8200] hover:bg-[#ff9426] disabled:opacity-50 text-white font-mono text-xs font-bold uppercase transition-colors cursor-pointer shadow-xs"
                  >
                    Guardar Nueva Fecha
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
