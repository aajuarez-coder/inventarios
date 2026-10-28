import React, { useState, useMemo } from 'react';
import { useInventory } from '../context/InventoryContext';
import { HardwareAsset, MaintenanceRecord, Employee, Branch } from '../types/inventory';
import { 
  Wrench, 
  Calendar as CalendarIcon, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Mail, 
  Plus, 
  Search, 
  User, 
  Laptop, 
  FileCheck, 
  ChevronRight,
  Filter,
  X,
  Sparkles,
  Send,
  Lock,
  Download,
  Printer,
  CalendarCheck,
  CalendarClock,
  History,
  LayoutGrid,
  ListOrdered,
  Building2,
  RotateCcw
} from 'lucide-react';
import { formatDate, getMaintenanceStatus } from '../utils/formatters';
import { EmailSimulatorModal } from './EmailSimulatorModal';
import { MaintenanceCalendar } from './MaintenanceCalendar';
import { generateInstitutionalMaintenancePdf } from '../utils/generateInstitutionalPdf';
import confetti from 'canvas-confetti';

interface MaintenanceScheduleProps {
  preselectedAsset?: HardwareAsset | null;
}

type MaintenanceViewMode = 'calendar' | 'timeline' | 'cards' | 'history';

export const MaintenanceSchedule: React.FC<MaintenanceScheduleProps> = ({ preselectedAsset }) => {
  const { 
    assets, 
    employees, 
    branches,
    maintenanceRecords, 
    createMaintenanceRecord, 
    completeMaintenance, 
    sendMaintenanceEmailAlert,
    currentUser,
    canEdit,
    isViewer
  } = useInventory();

  // View mode tab state (Defaults to 'calendar' as requested)
  const [viewMode, setViewMode] = useState<MaintenanceViewMode>('calendar');

  const [search, setSearch] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'urgent' | 'scheduled'>('all');
  const [selectedAssetForEmail, setSelectedAssetForEmail] = useState<HardwareAsset | null>(null);
  const [showNewServiceModal, setShowNewServiceModal] = useState(Boolean(preselectedAsset));
  const [targetAssetForService, setTargetAssetForService] = useState<HardwareAsset | null>(preselectedAsset || null);
  const [batchSentMessage, setBatchSentMessage] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [pdfMessage, setPdfMessage] = useState<string | null>(null);

  // New Service Form
  const [serviceForm, setServiceForm] = useState({
    assetId: preselectedAsset?.id || '',
    technicianName: currentUser.name,
    cost: 450,
    type: 'preventivo' as const,
    description: 'Mantenimiento preventivo periódico: Limpieza física de disipador térmico, cambio de pasta térmica de alto rendimiento y chequeo de salud de componentes.',
    tasks: [
      'Limpieza física de disipador y soplado de ventiladores',
      'Renovación de pasta térmica en procesador (CPU)',
      'Limpieza de puertos, teclado y pantalla con productos antiestáticos',
      'Diagnóstico de salud de almacenamiento SSD (S.M.A.R.T.)',
      'Actualización de parches críticos de seguridad y BIOS',
      'Verificación de salud de batería y calibración de ciclos',
      'Pruebas de estrés térmico y temperaturas operativas'
    ],
    diagnosticScore: 98,
    nextScheduledDate: '2027-04-16' // 6 months ahead
  });

  // Calculate maintenance statuses for catalog cards
  const assetsWithMaintenance = useMemo(() => {
    return assets.map(asset => {
      const maintStatus = getMaintenanceStatus(asset.nextMaintenanceDate);
      const employee = employees.find(e => e.id === asset.assignedToEmployeeId);
      const records = maintenanceRecords.filter(m => m.assetId === asset.id);
      return {
        asset,
        maintStatus,
        employee,
        records
      };
    });
  }, [assets, employees, maintenanceRecords]);

  const filteredItems = useMemo(() => {
    return assetsWithMaintenance.filter(({ asset, maintStatus, employee }) => {
      const q = search.toLowerCase();
      const matchesSearch = 
        asset.assetTag.toLowerCase().includes(q) ||
        asset.name.toLowerCase().includes(q) ||
        asset.serialNumber.toLowerCase().includes(q) ||
        (employee && employee.fullName.toLowerCase().includes(q));

      let matchesFilter = true;
      if (selectedStatusFilter === 'urgent') {
        matchesFilter = maintStatus.status === 'vencido' || maintStatus.status === 'proximo';
      } else if (selectedStatusFilter === 'scheduled') {
        matchesFilter = maintStatus.status === 'al_dia';
      }

      return matchesSearch && matchesFilter;
    });
  }, [assetsWithMaintenance, search, selectedStatusFilter]);

  const urgentCount = assetsWithMaintenance.filter(
    item => item.maintStatus.status === 'vencido' || item.maintStatus.status === 'proximo'
  ).length;

  // Chronological future timeline of scheduled maintenances
  const futureTimeline = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const items: Array<{
      asset: HardwareAsset;
      employee?: Employee;
      branch?: Branch;
      dateStr: string;
      daysRemaining: number;
      isProjected: boolean;
      cycle: number;
      status: 'vencido' | 'hoy' | 'proximo' | 'programado' | 'futuro';
    }> = [];

    const activeAssets = assets.filter(a => a.status !== 'baja');

    activeAssets.forEach(asset => {
      const employee = employees.find(e => e.id === asset.assignedToEmployeeId);
      const branch = branches.find(b => b.id === asset.branchId);
      const interval = asset.maintenanceIntervalMonths || 6;

      if (asset.nextMaintenanceDate) {
        const nextDate = asset.nextMaintenanceDate;
        const diffMs = new Date(nextDate).getTime() - new Date(today).getTime();
        const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        let status: 'vencido' | 'hoy' | 'proximo' | 'programado' | 'futuro' = 'programado';
        if (daysRemaining < 0) status = 'vencido';
        else if (daysRemaining === 0) status = 'hoy';
        else if (daysRemaining <= 14) status = 'proximo';

        items.push({
          asset,
          employee,
          branch,
          dateStr: nextDate,
          daysRemaining,
          isProjected: false,
          cycle: 0,
          status
        });

        // Add 2 projected future cycles
        const [startY, startM, startD] = nextDate.split('-').map(Number);
        if (startY && startM && startD) {
          for (let c = 1; c <= 2; c++) {
            const projectedMonthIndex = (startM - 1) + (c * interval);
            const projYear = startY + Math.floor(projectedMonthIndex / 12);
            const projMonth = (projectedMonthIndex % 12) + 1;
            const projDateStr = `${projYear}-${String(projMonth).padStart(2, '0')}-${String(startD).padStart(2, '0')}`;
            const projDiffMs = new Date(projDateStr).getTime() - new Date(today).getTime();
            const projDaysRemaining = Math.ceil(projDiffMs / (1000 * 60 * 60 * 24));

            items.push({
              asset,
              employee,
              branch,
              dateStr: projDateStr,
              daysRemaining: projDaysRemaining,
              isProjected: true,
              cycle: c,
              status: 'futuro'
            });
          }
        }
      }
    });

    // Sort chronologically
    return items.sort((a, b) => a.dateStr.localeCompare(b.dateStr));
  }, [assets, employees, branches]);

  const handleCreateService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceForm.assetId) {
      alert('Por favor seleccione el equipo.');
      return;
    }

    createMaintenanceRecord({
      assetId: serviceForm.assetId,
      date: new Date().toISOString().split('T')[0],
      type: serviceForm.type,
      technicianName: serviceForm.technicianName,
      cost: Number(serviceForm.cost) || 0,
      description: serviceForm.description,
      tasksCompleted: serviceForm.tasks,
      diagnosticScore: serviceForm.diagnosticScore,
      nextScheduledDate: serviceForm.nextScheduledDate,
      status: 'completado',
      emailNotified: false
    });

    confetti({ particleCount: 50, spread: 50 });
    setShowNewServiceModal(false);
  };

  const handleSendBatchReminders = () => {
    const urgentAssets = assetsWithMaintenance.filter(
      item => (item.maintStatus.status === 'vencido' || item.maintStatus.status === 'proximo') && item.asset.assignedToEmployeeId
    );

    if (urgentAssets.length === 0) {
      alert('No hay equipos asignados con mantenimientos pendientes para notificar.');
      return;
    }

    urgentAssets.forEach(item => {
      sendMaintenanceEmailAlert(item.asset.id, item.asset.nextMaintenanceDate);
    });

    setBatchSentMessage(true);
    confetti({ particleCount: 80, spread: 70 });
    setTimeout(() => setBatchSentMessage(false), 4000);
  };

  const handleExportMaintenancePdf = (withPrint: boolean = false) => {
    setIsExportingPdf(true);
    setPdfMessage('Generando reporte institucional de mantenimiento con logo Petroil en PDF...');

    setTimeout(() => {
      try {
        generateInstitutionalMaintenancePdf(maintenanceRecords, assets, branches, {
          generatedBy: currentUser.name,
          branchFilterName: 'Historial Integral Corporativo (Todas las Sedes)',
          openPrintDialog: withPrint
        });
        confetti({ particleCount: 65, spread: 60, origin: { y: 0.7 } });
        setPdfMessage(
          withPrint 
            ? '✓ Reporte PDF generado e inicializado cuadro de impresión institucional con logo Petroil.'
            : '✓ Historial institucional de mantenimiento exportado exitosamente en PDF con logo Petroil.'
        );
        setTimeout(() => setPdfMessage(null), 5000);
      } catch (err) {
        console.error('Error al generar PDF de mantenimiento:', err);
        alert('Ocurrió un error al generar el PDF institucional de mantenimiento.');
      } finally {
        setIsExportingPdf(false);
      }
    }, 120);
  };

  const handleOpenServiceModalForAsset = (asset: HardwareAsset, scheduledDate?: string) => {
    setServiceForm({
      ...serviceForm,
      assetId: asset.id,
      description: `Mantenimiento preventivo correspondiente al ciclo del ${scheduledDate || asset.nextMaintenanceDate}: Limpieza física de disipador, renovación de pasta térmica y pruebas de diagnóstico.`
    });
    setShowNewServiceModal(true);
  };

  return (
    <div className="space-y-5">
      
      {/* Top Banner (Variation 11) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#131a26] p-5 rounded-[6px] border border-[rgba(248,250,252,0.1)] shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-syne text-xl font-extrabold uppercase text-[#f8fafc] tracking-tight">
              Control & Calendario de Mantenimiento Preventivo
            </h2>
            {urgentCount > 0 && (
              <span className="px-2 py-0.5 rounded-[4px] text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                {urgentCount} POR ATENDER
              </span>
            )}
          </div>
          <p className="label text-[10px] text-[rgba(248,250,252,0.5)] mt-1 font-mono">
            Monitoreo en tiempo real de fechas programadas, proyecciones futuras, órdenes de servicio y alertas por correo al personal.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Institutional PDF Export Group */}
          <div className="inline-flex rounded-[6px] shadow-xs border border-[rgba(248,250,252,0.15)] overflow-hidden">
            <button
              onClick={() => handleExportMaintenancePdf(false)}
              disabled={isExportingPdf}
              className="px-3 py-2 bg-[#004a99] hover:bg-[#005bbd] disabled:opacity-50 text-white font-mono font-bold text-xs transition-colors flex items-center gap-2 border-r border-[rgba(248,250,252,0.15)] cursor-pointer"
              title="Descargar historial oficial de mantenimientos en PDF con logotipo de Petroil"
            >
              {isExportingPdf ? (
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5 text-white" />
              )}
              <span>Exportar PDF</span>
            </button>
            <button
              onClick={() => handleExportMaintenancePdf(true)}
              disabled={isExportingPdf}
              className="px-2.5 py-2 bg-[#003875] hover:bg-[#004a99] disabled:opacity-50 text-white transition-colors cursor-pointer"
              title="Imprimir historial oficial de mantenimiento con logo Petroil"
            >
              <Printer className="w-3.5 h-3.5 text-blue-200" />
            </button>
          </div>

          <button
            onClick={() => {
              if (!canEdit) {
                alert('Acceso Denegado (Perfil Visor): El envío masivo de notificaciones está reservado para perfiles con permisos de edición.');
                return;
              }
              handleSendBatchReminders();
            }}
            className={`px-3 py-2 rounded-[6px] font-mono font-bold text-xs uppercase tracking-wider transition-colors flex items-center gap-2 shadow-xs ${
              canEdit 
                ? 'bg-[#ff8200] hover:bg-[#ff9426] text-slate-950 cursor-pointer' 
                : 'bg-[#0a0e14] text-[rgba(248,250,252,0.5)] border border-[rgba(248,250,252,0.1)]'
            }`}
            title="Enviar avisos por correo a todos los usuarios con mantenimiento próximo"
          >
            {canEdit ? <Send className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5 text-amber-500" />}
            <span>Avisar ({urgentCount})</span>
          </button>

          <button
            onClick={() => {
              if (!canEdit) {
                alert('Acceso Denegado (Perfil Visor): Su usuario tiene permisos de solo lectura.');
                return;
              }
              setServiceForm({
                ...serviceForm,
                assetId: preselectedAsset?.id || (assets[0]?.id || '')
              });
              setShowNewServiceModal(true);
            }}
            className={`px-3.5 py-2 rounded-[6px] font-mono font-bold text-xs uppercase tracking-wider transition-colors flex items-center gap-2 ${
              canEdit 
                ? 'bg-[#10b981] hover:bg-[#059669] text-white shadow-xs cursor-pointer' 
                : 'bg-[#0a0e14] text-[rgba(248,250,252,0.5)] border border-[rgba(248,250,252,0.1)]'
            }`}
            title={canEdit ? 'Registrar servicio técnico' : 'Deshabilitado en modo Visor'}
          >
            {canEdit ? <Plus className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5 text-amber-500" />}
            <span>+ Registrar Servicio</span>
          </button>
        </div>
      </div>

      {/* PDF Success notification */}
      {pdfMessage && (
        <div className="p-3.5 rounded-[6px] bg-[#004a99]/20 border border-[#004a99]/40 text-cyan-200 text-xs flex items-center justify-between shadow-xs animate-in fade-in font-mono">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#004a99] animate-pulse" />
            <span>{pdfMessage}</span>
          </div>
          <button
            onClick={() => setPdfMessage(null)}
            className="text-white hover:text-[#ff8200] font-bold ml-3 text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {batchSentMessage && (
        <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-[6px] text-xs text-emerald-200 flex items-center gap-2 animate-in fade-in font-mono">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>¡Notificaciones institucionales por correo enviadas exitosamente a los colaboradores correspondientes!</span>
        </div>
      )}

      {/* View Mode Switcher Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-1.5 rounded-[6px] bg-[#131a26] border border-[rgba(248,250,252,0.1)]">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-3.5 py-2 rounded-[4px] font-mono text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
              viewMode === 'calendar'
                ? 'bg-[#004a99] text-white shadow-sm'
                : 'text-[rgba(248,250,252,0.6)] hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5 text-[#ff8200]" />
            <span>Calendario Mensual & Futuro</span>
          </button>

          <button
            onClick={() => setViewMode('timeline')}
            className={`px-3.5 py-2 rounded-[4px] font-mono text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
              viewMode === 'timeline'
                ? 'bg-[#004a99] text-white shadow-sm'
                : 'text-[rgba(248,250,252,0.6)] hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5 text-cyan-400" />
            <span>Línea de Tiempo Cronológica</span>
          </button>

          <button
            onClick={() => setViewMode('cards')}
            className={`px-3.5 py-2 rounded-[4px] font-mono text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
              viewMode === 'cards'
                ? 'bg-[#004a99] text-white shadow-sm'
                : 'text-[rgba(248,250,252,0.6)] hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5 text-emerald-400" />
            <span>Catálogo de Equipos ({assets.length})</span>
          </button>

          <button
            onClick={() => setViewMode('history')}
            className={`px-3.5 py-2 rounded-[4px] font-mono text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
              viewMode === 'history'
                ? 'bg-[#004a99] text-white shadow-sm'
                : 'text-[rgba(248,250,252,0.6)] hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <History className="w-3.5 h-3.5 text-amber-400" />
            <span>Historial Realizado ({maintenanceRecords.length})</span>
          </button>
        </div>

        <span className="label text-[9px] text-[rgba(248,250,252,0.4)] pr-2 font-mono hidden md:block">
          {viewMode === 'calendar' ? 'Vista interactiva mensual con proyecciones' : viewMode === 'timeline' ? 'Listado cronológico de fechas próximas y futuras' : viewMode === 'cards' ? 'Fichas técnicas individuales' : 'Registro de servicios completados'}
        </span>
      </div>

      {/* Main Content Area based on View Mode */}
      {viewMode === 'calendar' && (
        <MaintenanceCalendar
          onOpenServiceModal={handleOpenServiceModalForAsset}
          onOpenEmailModal={(asset) => setSelectedAssetForEmail(asset)}
        />
      )}

      {viewMode === 'timeline' && (
        <div className="p-5 rounded-[6px] bg-[#131a26] border border-[rgba(248,250,252,0.1)] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[rgba(248,250,252,0.1)] gap-2">
            <div>
              <p className="label text-[#ff8200] font-mono">Cronograma Secuencial</p>
              <h3 className="font-syne text-base font-bold text-[#f8fafc] uppercase">
                Próximos Mantenimientos Programados y Futuros
              </h3>
            </div>
            <span className="label text-[10px] text-[rgba(248,250,252,0.6)] font-mono">
              Mostrando {futureTimeline.length} eventos programados y proyectados
            </span>
          </div>

          <div className="divide-y divide-[rgba(248,250,252,0.06)]">
            {futureTimeline.map((item, idx) => {
              const isPast = item.daysRemaining < 0;
              const isToday = item.daysRemaining === 0;
              const isNear = item.daysRemaining > 0 && item.daysRemaining <= 14;

              return (
                <div 
                  key={`${item.asset.id}-${item.dateStr}-${idx}`}
                  className="py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-white/[0.02] px-2 rounded-[4px] transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`p-2.5 rounded-[4px] shrink-0 font-mono text-center min-w-[70px] ${
                      isPast 
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                        : isToday 
                        ? 'bg-[#ff8200]/20 text-[#ff8200] border border-[#ff8200]/30 animate-pulse' 
                        : isNear 
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                        : 'bg-[#004a99]/20 text-blue-300 border border-[#004a99]/30'
                    }`}>
                      <span className="block text-[10px] uppercase font-bold">
                        {isPast ? 'VENCIDO' : isToday ? 'HOY' : isNear ? 'PRÓXIMO' : 'PROGRAMADO'}
                      </span>
                      <strong className="block text-xs mt-0.5">{item.dateStr}</strong>
                      <span className="block text-[9px] opacity-75">
                        {isPast ? `${Math.abs(item.daysRemaining)}d atraso` : isToday ? 'Inmediato' : `En ${item.daysRemaining}d`}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-[#f8fafc]">{item.asset.assetTag}</span>
                        <span className="text-xs text-[rgba(248,250,252,0.8)] font-semibold">{item.asset.brand} {item.asset.model}</span>
                        {item.isProjected && (
                          <span className="label text-[9px] px-1.5 py-0.2 rounded-[4px] bg-[#004a99]/30 text-cyan-300 border border-[#004a99]/40 font-mono">
                            Proyección Ciclo #{item.cycle}
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-[rgba(248,250,252,0.5)] font-mono mt-1">
                        Custodio: <strong className="text-[rgba(248,250,252,0.8)]">{item.employee?.fullName || 'Stock Almacén TI'}</strong> • Sede: {item.branch?.name || 'Mazatlán'} • Frecuencia: Cada {item.asset.maintenanceIntervalMonths || 6}m
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleOpenServiceModalForAsset(item.asset, item.dateStr)}
                      disabled={!canEdit}
                      className="px-3 py-1.5 rounded-[4px] bg-[#ff8200] hover:bg-[#ff9426] disabled:opacity-50 text-white font-mono text-xs font-bold uppercase transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      <span>Atender</span>
                    </button>

                    {item.employee && (
                      <button
                        onClick={() => setSelectedAssetForEmail(item.asset)}
                        className="px-3 py-1.5 rounded-[4px] bg-[#004a99] hover:bg-[#005bbd] text-white font-mono text-xs transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Notificar</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {viewMode === 'cards' && (
        <div className="space-y-4">
          {/* Filter toolbar */}
          <div className="bg-[#131a26] p-4 rounded-[6px] border border-[rgba(248,250,252,0.1)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="relative w-full max-w-md">
              <Search className="w-4 h-4 text-[rgba(248,250,252,0.4)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por placa, modelo o colaborador asignado..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#0a0e14] border border-[rgba(248,250,252,0.1)] rounded-[6px] pl-9 pr-3 py-2 text-xs text-[#f8fafc] placeholder:text-[rgba(248,250,252,0.35)] focus:border-[#ff8200] outline-hidden font-mono"
              />
            </div>

            <div className="flex items-center gap-1.5 self-start sm:self-auto">
              <button
                onClick={() => setSelectedStatusFilter('all')}
                className={`px-3 py-1.5 rounded-[4px] font-mono text-xs transition-colors cursor-pointer ${
                  selectedStatusFilter === 'all' ? 'bg-[#004a99] text-white font-semibold' : 'bg-[#0a0e14] text-[rgba(248,250,252,0.6)] hover:bg-white/[0.04]'
                }`}
              >
                Todos ({assets.length})
              </button>
              <button
                onClick={() => setSelectedStatusFilter('urgent')}
                className={`px-3 py-1.5 rounded-[4px] font-mono text-xs transition-colors cursor-pointer ${
                  selectedStatusFilter === 'urgent' ? 'bg-rose-600 text-white font-semibold' : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                }`}
              >
                Urgentes ({urgentCount})
              </button>
              <button
                onClick={() => setSelectedStatusFilter('scheduled')}
                className={`px-3 py-1.5 rounded-[4px] font-mono text-xs transition-colors cursor-pointer ${
                  selectedStatusFilter === 'scheduled' ? 'bg-[#ff8200] text-slate-950 font-bold' : 'bg-[#0a0e14] text-[rgba(248,250,252,0.6)] hover:bg-white/[0.04]'
                }`}
              >
                Al Día
              </button>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map(({ asset, maintStatus, employee, records }) => {
              const isUrgent = maintStatus.status === 'vencido' || maintStatus.status === 'proximo';

              return (
                <div 
                  key={asset.id}
                  className={`bg-[#131a26] rounded-[6px] border p-4 shadow-xl flex flex-col justify-between transition-all ${
                    isUrgent 
                      ? 'border-rose-500/40 ring-1 ring-rose-500/20' 
                      : 'border-[rgba(248,250,252,0.1)] hover:border-[rgba(248,250,252,0.25)]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-[rgba(248,250,252,0.08)]">
                      <div className="flex items-center gap-1.5 font-mono font-bold text-xs text-[#f8fafc]">
                        <Laptop className="w-3.5 h-3.5 text-[#ff8200]" />
                        <span>{asset.assetTag}</span>
                      </div>

                      <span className={`label text-[9px] px-2 py-0.5 rounded-[4px] font-mono ${
                        isUrgent 
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {maintStatus.label}
                      </span>
                    </div>

                    <div className="mt-3">
                      <h3 className="font-bold text-sm text-[#f8fafc] leading-snug">
                        {asset.brand} {asset.model}
                      </h3>
                      <p className="text-[11px] text-[rgba(248,250,252,0.4)] font-mono">
                        Serie: {asset.serialNumber}
                      </p>
                    </div>

                    {/* Dates breakdown */}
                    <div className="mt-3 p-2.5 rounded-[4px] bg-[#0a0e14] border border-[rgba(248,250,252,0.08)] text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[rgba(248,250,252,0.5)] font-mono text-[11px]">Próximo Mantenimiento:</span>
                        <strong className="text-white font-mono">{formatDate(asset.nextMaintenanceDate)}</strong>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-[rgba(248,250,252,0.4)] font-mono">Último Servicio:</span>
                        <span className="text-[rgba(248,250,252,0.8)] font-mono">{formatDate(asset.lastMaintenanceDate) || 'Sin registro'}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-[rgba(248,250,252,0.4)] font-mono">Frecuencia:</span>
                        <span className="text-[#ff8200] font-mono">Cada {asset.maintenanceIntervalMonths || 6} meses</span>
                      </div>
                    </div>

                    {/* Assigned Colaborador info */}
                    <div className="mt-3 text-xs">
                      <span className="label text-[9px] text-[rgba(248,250,252,0.4)] block font-mono">
                        Colaborador Custodio:
                      </span>
                      {employee ? (
                        <div className="mt-1">
                          <p className="font-semibold text-[#f8fafc] truncate text-xs">{employee.fullName}</p>
                          <p className="text-[10px] text-[rgba(248,250,252,0.5)] font-mono truncate">{employee.email}</p>
                        </div>
                      ) : (
                        <p className="text-[rgba(248,250,252,0.4)] text-xs mt-0.5 font-mono">En Almacén TI (Sin colaborador)</p>
                      )}
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="mt-4 pt-3 border-t border-[rgba(248,250,252,0.08)] flex items-center justify-between gap-2 text-xs">
                    {employee && (
                      <button
                        onClick={() => setSelectedAssetForEmail(asset)}
                        className="flex-1 py-1.5 px-2 rounded-[4px] bg-[#004a99] hover:bg-[#005bbd] text-white font-mono text-[10px] font-bold uppercase transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        title="Previsualizar y enviar correo al usuario"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Aviso</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleOpenServiceModalForAsset(asset)}
                      disabled={!canEdit}
                      className="py-1.5 px-3 rounded-[4px] bg-[#ff8200] hover:bg-[#ff9426] disabled:opacity-50 text-white font-mono text-[10px] font-bold uppercase transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      <span>Servicio</span>
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      )}

      {viewMode === 'history' && (
        <div className="p-5 rounded-[6px] bg-[#131a26] border border-[rgba(248,250,252,0.1)] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[rgba(248,250,252,0.1)]">
            <div>
              <p className="label text-[#ff8200] font-mono">Auditoría Técnica</p>
              <h3 className="font-syne text-base font-bold text-[#f8fafc] uppercase">
                Historial de Servicios Técnicos Completados
              </h3>
            </div>
            <span className="label text-[10px] text-[rgba(248,250,252,0.5)] font-mono">
              Total: {maintenanceRecords.length} registros
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-[rgba(248,250,252,0.1)] text-[rgba(248,250,252,0.4)] text-[10px] uppercase">
                  <th className="py-2.5 px-3">Fecha</th>
                  <th className="py-2.5 px-3">Equipo</th>
                  <th className="py-2.5 px-3">Tipo</th>
                  <th className="py-2.5 px-3">Técnico</th>
                  <th className="py-2.5 px-3">Descripción</th>
                  <th className="py-2.5 px-3">Próximo</th>
                  <th className="py-2.5 px-3 text-right">Diagnóstico</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(248,250,252,0.06)]">
                {maintenanceRecords.map(rec => {
                  const asset = assets.find(a => a.id === rec.assetId);
                  return (
                    <tr key={rec.id} className="hover:bg-white/[0.02] text-[rgba(248,250,252,0.85)]">
                      <td className="py-3 px-3 text-white font-bold">{rec.date}</td>
                      <td className="py-3 px-3">
                        <strong className="text-[#ff8200]">{asset?.assetTag || rec.assetId}</strong>
                        <span className="block text-[10px] text-[rgba(248,250,252,0.4)]">{asset?.brand} {asset?.model}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="label text-[9px] px-1.5 py-0.5 rounded-[3px] bg-[#004a99]/20 text-cyan-300 border border-[#004a99]/30">
                          {rec.type.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-3">{rec.technicianName}</td>
                      <td className="py-3 px-3 max-w-xs truncate text-[11px] text-[rgba(248,250,252,0.6)]">{rec.description}</td>
                      <td className="py-3 px-3 text-white font-bold">{rec.nextScheduledDate}</td>
                      <td className="py-3 px-3 text-right">
                        <span className="text-emerald-400 font-bold">{rec.diagnosticScore || 100}%</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Email Simulator Modal */}
      {selectedAssetForEmail && (
        <EmailSimulatorModal
          asset={selectedAssetForEmail}
          employee={employees.find(e => e.id === selectedAssetForEmail.assignedToEmployeeId)}
          onClose={() => setSelectedAssetForEmail(null)}
        />
      )}

      {/* Register Technical Service Modal (Styled in Variation 11) */}
      {showNewServiceModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#131a26] rounded-[6px] shadow-2xl max-w-2xl w-full border border-[rgba(248,250,252,0.15)] overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95">
            <div className="p-4 bg-[#0a0e14] border-b border-[rgba(248,250,252,0.1)] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-[#ff8200]" />
                <h3 className="font-syne font-bold text-sm uppercase">Registro de Servicio de Mantenimiento Preventivo</h3>
              </div>
              <button onClick={() => setShowNewServiceModal(false)} className="text-[rgba(248,250,252,0.5)] hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateService} className="p-6 overflow-y-auto space-y-4 text-xs font-mono">
              
              <div>
                <label className="font-semibold text-[rgba(248,250,252,0.8)] block mb-1 text-[11px] uppercase">Equipo Atendido *</label>
                <select
                  required
                  value={serviceForm.assetId}
                  onChange={(e) => setServiceForm({ ...serviceForm, assetId: e.target.value })}
                  className="w-full p-2.5 border border-[rgba(248,250,252,0.15)] rounded-[6px] bg-[#0a0e14] text-[#f8fafc] outline-hidden focus:border-[#ff8200]"
                >
                  <option value="" className="bg-[#131a26]">-- Seleccionar Equipo --</option>
                  {assets.map(a => (
                    <option key={a.id} value={a.id} className="bg-[#131a26]">
                      [{a.assetTag}] {a.brand} {a.model} - S/N: {a.serialNumber}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[rgba(248,250,252,0.8)] block mb-1 text-[11px] uppercase">Técnico Responsable *</label>
                  <input
                    type="text"
                    required
                    value={serviceForm.technicianName}
                    onChange={(e) => setServiceForm({ ...serviceForm, technicianName: e.target.value })}
                    className="w-full p-2 border border-[rgba(248,250,252,0.15)] rounded-[6px] bg-[#0a0e14] text-[#f8fafc] outline-hidden focus:border-[#ff8200]"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[rgba(248,250,252,0.8)] block mb-1 text-[11px] uppercase">Costo Estimado Insumos (MXN)</label>
                  <input
                    type="number"
                    value={serviceForm.cost}
                    onChange={(e) => setServiceForm({ ...serviceForm, cost: Number(e.target.value) })}
                    className="w-full p-2 border border-[rgba(248,250,252,0.15)] rounded-[6px] bg-[#0a0e14] text-[#f8fafc] outline-hidden focus:border-[#ff8200]"
                  />
                </div>
              </div>

              {/* Checklist */}
              <div className="p-3.5 bg-[#0a0e14] rounded-[6px] border border-[rgba(248,250,252,0.1)] space-y-2">
                <span className="font-bold text-[#ff8200] block uppercase tracking-wider text-[11px]">
                  Checklist Técnico Realizado (Protocolo de 7 Puntos):
                </span>
                <div className="space-y-1.5">
                  {serviceForm.tasks.map((task, idx) => (
                    <label key={idx} className="flex items-center gap-2 text-[rgba(248,250,252,0.8)] cursor-pointer text-xs">
                      <input type="checkbox" defaultChecked className="rounded accent-[#ff8200] bg-[#131a26]" />
                      <span>{task}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-semibold text-[rgba(248,250,252,0.8)] block mb-1 text-[11px] uppercase">Diagnóstico / Resumen del Trabajo:</label>
                <textarea
                  rows={2}
                  value={serviceForm.description}
                  onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                  className="w-full p-2 border border-[rgba(248,250,252,0.15)] rounded-[6px] bg-[#0a0e14] text-[#f8fafc] outline-hidden focus:border-[#ff8200]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[rgba(248,250,252,0.8)] block mb-1 text-[11px] uppercase">Calificación Diagnóstica (1-100):</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={serviceForm.diagnosticScore}
                    onChange={(e) => setServiceForm({ ...serviceForm, diagnosticScore: Number(e.target.value) })}
                    className="w-full p-2 border border-[rgba(248,250,252,0.15)] rounded-[6px] bg-[#0a0e14] text-[#f8fafc] outline-hidden focus:border-[#ff8200]"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[rgba(248,250,252,0.8)] block mb-1 text-[11px] uppercase">Próxima Fecha de Mantenimiento:</label>
                  <input
                    type="date"
                    required
                    value={serviceForm.nextScheduledDate}
                    onChange={(e) => setServiceForm({ ...serviceForm, nextScheduledDate: e.target.value })}
                    className="w-full p-2 border border-[rgba(248,250,252,0.15)] rounded-[6px] bg-[#0a0e14] text-[#f8fafc] outline-hidden focus:border-[#ff8200]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[rgba(248,250,252,0.1)]">
                <button
                  type="button"
                  onClick={() => setShowNewServiceModal(false)}
                  className="px-4 py-2 rounded-[4px] text-[rgba(248,250,252,0.7)] hover:bg-white/[0.04] font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-[4px] bg-[#004a99] hover:bg-[#005bbd] text-white font-bold uppercase tracking-wider cursor-pointer shadow-xs"
                >
                  Finalizar y Guardar Mantenimiento
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
