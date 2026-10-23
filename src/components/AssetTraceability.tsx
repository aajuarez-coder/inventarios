import React, { useState, useMemo } from 'react';
import { HardwareAsset, TimelineEvent } from '../types/inventory';
import { useInventory } from '../context/InventoryContext';
import { 
  History, 
  User, 
  UserCheck, 
  UserX, 
  Truck, 
  Wrench, 
  Cpu, 
  Shield, 
  ShieldAlert, 
  MapPin, 
  Calendar, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  Plus, 
  Filter, 
  FileText, 
  Printer, 
  Award, 
  AlertTriangle,
  ArrowRight,
  Package,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';
import { formatDate, formatDateTime, formatCurrency } from '../utils/formatters';

export type TraceabilityFilter = 'all' | 'usuario' | 'traslado' | 'reparacion' | 'alta_hardware';

interface TraceabilityItem {
  id: string;
  date: string;
  timestamp: number;
  category: 'usuario' | 'traslado' | 'reparacion' | 'alta_hardware' | 'baja';
  title: string;
  description: string;
  author: string;
  badgeLabel: string;
  badgeColorClass: string;
  iconBgClass: string;
  iconColorClass: string;
  icon: React.ReactNode;
  metadata?: {
    employeeName?: string;
    employeePosition?: string;
    employeeDept?: string;
    folioResponsiva?: string;
    statusLabel?: string;
    sourceBranch?: string;
    targetBranch?: string;
    carrier?: string;
    trackingNumber?: string;
    cost?: number;
    technician?: string;
    diagnosticScore?: number;
    tasks?: string[];
    notes?: string;
  };
}

interface AssetTraceabilityProps {
  asset: HardwareAsset;
  onNavigateToEmployee?: (employeeId: string) => void;
  onNavigateToTransfer?: () => void;
  onNavigateToMaintenance?: () => void;
}

export const AssetTraceability: React.FC<AssetTraceabilityProps> = ({
  asset,
  onNavigateToEmployee,
  onNavigateToTransfer,
  onNavigateToMaintenance
}) => {
  const { 
    timeline, 
    assignments, 
    maintenanceRecords, 
    transfers, 
    employees, 
    branches, 
    currentUser, 
    canEdit, 
    logEvent 
  } = useInventory();

  const [filter, setFilter] = useState<TraceabilityFilter>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEventCategory, setNewEventCategory] = useState<'usuario' | 'traslado' | 'reparacion' | 'alta_hardware'>('reparacion');
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newAuthor, setNewAuthor] = useState(currentUser?.name || 'Administrador TI');
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});

  // Helper to toggle task list expansion
  const toggleTasks = (id: string) => {
    setExpandedTasks(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Build unified, deduplicated timeline events
  const unifiedTimeline = useMemo<TraceabilityItem[]>(() => {
    const items: TraceabilityItem[] = [];

    // 1. Process Assignments (User changes, responsivas, returns)
    const assetAssignments = assignments.filter(a => a.assetId === asset.id);
    assetAssignments.forEach(asg => {
      const emp = employees.find(e => e.id === asg.employeeId);
      const empName = emp ? emp.fullName : 'Colaborador';
      const empPos = emp ? `${emp.position} · ${emp.department}` : '';

      // Assignment delivery event
      const assignTs = new Date(asg.assignedDate).getTime() || Date.now();
      items.push({
        id: `asg-assign-${asg.id}`,
        date: asg.assignedDate,
        timestamp: assignTs,
        category: 'usuario',
        title: `Asignación a ${empName}`,
        description: `Equipo entregado en resguardo laboral mediante Responsiva Folio ${asg.folioResponsiva}. ${asg.conditionNotes ? `Condiciones: ${asg.conditionNotes}` : ''}`,
        author: asg.itStaffName || 'Administración TI',
        badgeLabel: asg.status === 'activa' ? 'Usuario Actual' : 'Asignación Previa',
        badgeColorClass: asg.status === 'activa' ? 'text-indigo-700 bg-indigo-50 border-indigo-200' : 'text-slate-600 bg-slate-100 border-slate-200',
        iconBgClass: asg.status === 'activa' ? 'bg-indigo-600' : 'bg-indigo-400',
        iconColorClass: 'text-white',
        icon: <UserCheck className="w-3.5 h-3.5" />,
        metadata: {
          employeeName: empName,
          employeePosition: empPos,
          employeeDept: emp?.department,
          folioResponsiva: asg.folioResponsiva,
          statusLabel: asg.status === 'activa' ? 'Activo en posesión' : 'Responsiva Concluida / Devuelto',
          notes: asg.signedAt ? `Firmado digitalmente el ${formatDate(asg.signedAt)}` : 'Pendiente de firma'
        }
      });

      // Return event if returnDate exists or status is devuelta
      if (asg.returnDate || asg.status === 'devuelta') {
        const returnDate = asg.returnDate || asg.assignedDate;
        const returnTs = new Date(returnDate).getTime() + 86400000; // slightly after delivery
        items.push({
          id: `asg-return-${asg.id}`,
          date: returnDate,
          timestamp: returnTs,
          category: 'usuario',
          title: `Devolución y Reingreso a Almacén`,
          description: `El colaborador ${empName} devolvió el equipo al departamento de TI. Se verificó integridad física y periféricos.`,
          author: asg.itStaffName || 'Soporte TI',
          badgeLabel: 'Devolución de Activo',
          badgeColorClass: 'text-amber-700 bg-amber-50 border-amber-200',
          iconBgClass: 'bg-amber-500',
          iconColorClass: 'text-white',
          icon: <UserX className="w-3.5 h-3.5" />,
          metadata: {
            employeeName: empName,
            folioResponsiva: asg.folioResponsiva,
            notes: asg.conditionNotes || 'Equipo entregado en buenas condiciones operativas'
          }
        });
      }
    });

    // 2. Process Transfers (Branch logistics and movements)
    const assetTransfers = transfers.filter(tr => tr.assetIds.includes(asset.id));
    assetTransfers.forEach(trf => {
      const srcBranch = branches.find(b => b.id === trf.sourceBranchId)?.name || 'Sede Origen';
      const tgtBranch = branches.find(b => b.id === trf.targetBranchId)?.name || 'Sede Destino';

      const shipTs = new Date(trf.shipmentDate).getTime() || Date.now();
      items.push({
        id: `trf-ship-${trf.id}`,
        date: trf.shipmentDate,
        timestamp: shipTs,
        category: 'traslado',
        title: `Traslado Despachado: ${srcBranch} ➔ ${tgtBranch}`,
        description: `Despacho logístico de activo bajo Folio ${trf.folio}. Transportista: ${trf.carrier}, Número de Guía: ${trf.trackingNumber}. Solicitado por: ${trf.requestedBy}.`,
        author: trf.requestedBy,
        badgeLabel: trf.status === 'en_transito' ? 'En Tránsito' : 'Traslado Despachado',
        badgeColorClass: trf.status === 'en_transito' ? 'text-amber-800 bg-amber-50 border-amber-300 animate-pulse' : 'text-purple-700 bg-purple-50 border-purple-200',
        iconBgClass: 'bg-purple-600',
        iconColorClass: 'text-white',
        icon: <Truck className="w-3.5 h-3.5" />,
        metadata: {
          sourceBranch: srcBranch,
          targetBranch: tgtBranch,
          carrier: trf.carrier,
          trackingNumber: trf.trackingNumber,
          notes: trf.notes
        }
      });

      if (trf.status === 'recibido' && trf.actualArrival) {
        const arrivalTs = new Date(trf.actualArrival).getTime() + 1000;
        items.push({
          id: `trf-arrival-${trf.id}`,
          date: trf.actualArrival,
          timestamp: arrivalTs,
          category: 'traslado',
          title: `Recepción Confirmada en ${tgtBranch}`,
          description: `El equipo arribó satisfactoriamente a la sucursal de destino. Recibido e inspeccionado por ${trf.receivedBy || 'Encargado de Almacén'}.`,
          author: trf.receivedBy || 'Almacén Destino',
          badgeLabel: 'Arribo en Sede',
          badgeColorClass: 'text-emerald-700 bg-emerald-50 border-emerald-200',
          iconBgClass: 'bg-emerald-600',
          iconColorClass: 'text-white',
          icon: <MapPin className="w-3.5 h-3.5" />,
          metadata: {
            sourceBranch: srcBranch,
            targetBranch: tgtBranch,
            notes: `Folio de movimiento: ${trf.folio}`
          }
        });
      }
    });

    // 3. Process Maintenance & Repairs
    const assetMaintenance = maintenanceRecords.filter(m => m.assetId === asset.id);
    assetMaintenance.forEach(maint => {
      const isCorrective = maint.type === 'correctivo';
      const isUpgrade = maint.type === 'actualizacion_hardware';
      const maintTs = new Date(maint.date).getTime() || Date.now();

      let label = 'Mantenimiento Preventivo';
      if (isCorrective) label = 'Reparación Correctiva';
      if (isUpgrade) label = 'Actualización Hardware';

      items.push({
        id: `maint-${maint.id}`,
        date: maint.date,
        timestamp: maintTs,
        category: 'reparacion',
        title: isCorrective ? `Reparación Técnica: ${maint.description.slice(0, 50)}...` : label,
        description: maint.description,
        author: maint.technicianName,
        badgeLabel: label,
        badgeColorClass: isCorrective 
          ? 'text-rose-700 bg-rose-50 border-rose-200' 
          : isUpgrade 
          ? 'text-cyan-700 bg-cyan-50 border-cyan-200' 
          : 'text-emerald-700 bg-emerald-50 border-emerald-200',
        iconBgClass: isCorrective ? 'bg-rose-600' : isUpgrade ? 'bg-cyan-600' : 'bg-emerald-600',
        iconColorClass: 'text-white',
        icon: <Wrench className="w-3.5 h-3.5" />,
        metadata: {
          technician: maint.technicianName,
          cost: maint.cost,
          diagnosticScore: maint.diagnosticScore,
          tasks: maint.tasksCompleted,
          notes: maint.nextScheduledDate ? `Próximo servicio programado: ${formatDate(maint.nextScheduledDate)}` : undefined
        }
      });
    });

    // 4. Process Timeline Events (Altas, Bajas, Agentes, Modificaciones)
    const assetTimelineEvents = timeline.filter(t => t.assetId === asset.id);
    assetTimelineEvents.forEach(tl => {
      // Check if duplicate of assignment, transfer, or maintenance already created
      const isDuplicate = items.some(existing => 
        Math.abs(existing.timestamp - new Date(tl.timestamp).getTime()) < 3600000 &&
        existing.title.toLowerCase().includes(tl.title.slice(0, 15).toLowerCase())
      );
      if (isDuplicate) return;

      let cat: TraceabilityItem['category'] = 'alta_hardware';
      let icon = <Cpu className="w-3.5 h-3.5" />;
      let iconBg = 'bg-slate-700';
      let badgeClass = 'text-slate-700 bg-slate-100 border-slate-200';

      if (tl.type === 'baja') {
        cat = 'baja';
        icon = <ShieldAlert className="w-3.5 h-3.5" />;
        iconBg = 'bg-rose-700';
        badgeClass = 'text-rose-700 bg-rose-50 border-rose-200';
      } else if (tl.type === 'alta') {
        cat = 'alta_hardware';
        icon = <Package className="w-3.5 h-3.5" />;
        iconBg = 'bg-blue-600';
        badgeClass = 'text-blue-700 bg-blue-50 border-blue-200';
      } else if (tl.type === 'actualizacion') {
        cat = 'alta_hardware';
        icon = <Cpu className="w-3.5 h-3.5" />;
        iconBg = 'bg-slate-800';
        badgeClass = 'text-slate-700 bg-slate-100 border-slate-200';
      } else if (tl.type === 'mantenimiento') {
        cat = 'reparacion';
        icon = <Wrench className="w-3.5 h-3.5" />;
        iconBg = 'bg-emerald-600';
        badgeClass = 'text-emerald-700 bg-emerald-50 border-emerald-200';
      } else if (tl.type === 'traslado') {
        cat = 'traslado';
        icon = <Truck className="w-3.5 h-3.5" />;
        iconBg = 'bg-purple-600';
        badgeClass = 'text-purple-700 bg-purple-50 border-purple-200';
      } else if (tl.type === 'asignacion' || tl.type === 'devolucion') {
        cat = 'usuario';
        icon = <User className="w-3.5 h-3.5" />;
        iconBg = 'bg-indigo-600';
        badgeClass = 'text-indigo-700 bg-indigo-50 border-indigo-200';
      }

      items.push({
        id: `tl-${tl.id}`,
        date: tl.timestamp,
        timestamp: new Date(tl.timestamp).getTime() || Date.now(),
        category: cat,
        title: tl.title,
        description: tl.description,
        author: tl.author,
        badgeLabel: tl.type.toUpperCase(),
        badgeColorClass: badgeClass,
        iconBgClass: iconBg,
        iconColorClass: 'text-white',
        icon,
        metadata: {
          notes: tl.metadata ? JSON.stringify(tl.metadata) : undefined
        }
      });
    });

    // 5. Synthesize Purchase / Initial Alta if no 'alta' event exists
    const hasAlta = items.some(i => i.category === 'alta_hardware' && i.title.toLowerCase().includes('ingreso') || i.title.toLowerCase().includes('alta') || i.title.toLowerCase().includes('adquisic'));
    if (!hasAlta && asset.purchaseDate) {
      const purchaseTs = new Date(asset.purchaseDate).getTime() || Date.now() - 365 * 24 * 3600 * 1000;
      items.push({
        id: `purchase-${asset.id}`,
        date: asset.purchaseDate,
        timestamp: purchaseTs,
        category: 'alta_hardware',
        title: `Ingreso Inicial al Inventario Petroil`,
        description: `Adquisición formal de equipo a través de ${asset.supplier}. Factura: ${asset.invoiceNumber}. Costo de compra: ${formatCurrency(asset.purchaseCost)} MXN. Póliza de garantía registrada hasta ${formatDate(asset.warrantyEndDate)}.`,
        author: 'Departamento de Compras TI',
        badgeLabel: 'Alta de Activo',
        badgeColorClass: 'text-blue-700 bg-blue-50 border-blue-200',
        iconBgClass: 'bg-blue-600',
        iconColorClass: 'text-white',
        icon: <Package className="w-3.5 h-3.5" />,
        metadata: {
          notes: `Proveedor: ${asset.supplier} · Factura ${asset.invoiceNumber}`
        }
      });
    }

    // Sort descending by timestamp (most recent first)
    return items.sort((a, b) => b.timestamp - a.timestamp);
  }, [asset, assignments, transfers, maintenanceRecords, timeline, employees, branches]);

  // Filter items based on active tab
  const filteredItems = useMemo(() => {
    if (filter === 'all') return unifiedTimeline;
    return unifiedTimeline.filter(item => item.category === filter);
  }, [unifiedTimeline, filter]);

  // Lifecycle Statistics Calculations
  const stats = useMemo(() => {
    const userChangesCount = unifiedTimeline.filter(i => i.category === 'usuario').length;
    const transfersCount = unifiedTimeline.filter(i => i.category === 'traslado').length;
    const repairsCount = unifiedTimeline.filter(i => i.category === 'reparacion').length;
    const totalMaintenanceCost = maintenanceRecords
      .filter(m => m.assetId === asset.id)
      .reduce((sum, m) => sum + (m.cost || 0), 0);

    // Current assigned employee
    const currentEmp = employees.find(e => e.id === asset.assignedToEmployeeId);

    // Current branch
    const currentBranch = branches.find(b => b.id === asset.branchId);

    return {
      totalEvents: unifiedTimeline.length,
      userChangesCount,
      transfersCount,
      repairsCount,
      totalMaintenanceCost,
      currentEmpName: currentEmp ? currentEmp.fullName : 'En Almacén TI',
      currentBranchName: currentBranch ? currentBranch.name : 'Sede Principal'
    };
  }, [unifiedTimeline, maintenanceRecords, asset, employees, branches]);

  // Handler to create a new manual audit note
  const handleSaveNewEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) {
      alert('Por favor ingrese el título y la descripción del evento.');
      return;
    }

    let typeMapped: TimelineEvent['type'] = 'actualizacion';
    if (newEventCategory === 'usuario') typeMapped = 'asignacion';
    if (newEventCategory === 'traslado') typeMapped = 'traslado';
    if (newEventCategory === 'reparacion') typeMapped = 'mantenimiento';

    logEvent({
      assetId: asset.id,
      type: typeMapped,
      title: newTitle.trim(),
      description: newDescription.trim(),
      author: newAuthor.trim() || currentUser?.name || 'Administrador TI'
    });

    setNewTitle('');
    setNewDescription('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header & Summary KPI Strip */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-600" />
              Línea de Tiempo y Trazabilidad del Equipo
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Registro histórico inmutable de rotación de usuarios, logística entre sedes y bitácora técnica.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {canEdit && (
              <button
                onClick={() => setShowAddModal(true)}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Registrar Evento</span>
              </button>
            )}
          </div>
        </div>

        {/* Micro-metrics summary grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-200/60 text-xs">
          
          <div className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-0.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block flex items-center gap-1">
              <User className="w-3 h-3 text-indigo-500" />
              Asignación Actual
            </span>
            <strong className="text-slate-900 block truncate font-medium">
              {stats.currentEmpName}
            </strong>
            <span className="text-[10px] text-slate-400 block truncate">
              {stats.userChangesCount} movimientos históricos
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-0.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block flex items-center gap-1">
              <MapPin className="w-3 h-3 text-purple-500" />
              Ubicación / Sede
            </span>
            <strong className="text-slate-900 block truncate font-medium">
              {stats.currentBranchName}
            </strong>
            <span className="text-[10px] text-slate-400 block truncate">
              {stats.transfersCount} traslados registrados
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-0.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block flex items-center gap-1">
              <Wrench className="w-3 h-3 text-emerald-500" />
              Servicios Técnicos
            </span>
            <strong className="text-slate-900 block font-medium">
              {stats.repairsCount} intervenciones
            </strong>
            <span className="text-[10px] text-slate-400 block truncate">
              Inversión: {formatCurrency(stats.totalMaintenanceCost)} MXN
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-0.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-500" />
              Total Eventos
            </span>
            <strong className="text-slate-900 block font-medium">
              {stats.totalEvents} registros
            </strong>
            <span className="text-[10px] text-emerald-600 font-semibold block truncate">
              Auditoría al 100%
            </span>
          </div>

        </div>
      </div>

      {/* 2. Interactive Category Filter Bar (Buttons with active states, not pills) */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl overflow-x-auto text-xs">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            filter === 'all'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Todos ({unifiedTimeline.length})</span>
        </button>

        <button
          onClick={() => setFilter('usuario')}
          className={`px-3 py-1.5 font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            filter === 'usuario'
              ? 'bg-white text-indigo-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <User className="w-3.5 h-3.5 text-indigo-600" />
          <span>Cambios de Usuario ({unifiedTimeline.filter(i => i.category === 'usuario').length})</span>
        </button>

        <button
          onClick={() => setFilter('traslado')}
          className={`px-3 py-1.5 font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            filter === 'traslado'
              ? 'bg-white text-purple-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Truck className="w-3.5 h-3.5 text-purple-600" />
          <span>Traslados ({unifiedTimeline.filter(i => i.category === 'traslado').length})</span>
        </button>

        <button
          onClick={() => setFilter('reparacion')}
          className={`px-3 py-1.5 font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            filter === 'reparacion'
              ? 'bg-white text-emerald-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Wrench className="w-3.5 h-3.5 text-emerald-600" />
          <span>Reparaciones y Servicio ({unifiedTimeline.filter(i => i.category === 'reparacion').length})</span>
        </button>

        <button
          onClick={() => setFilter('alta_hardware')}
          className={`px-3 py-1.5 font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            filter === 'alta_hardware'
              ? 'bg-white text-blue-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Package className="w-3.5 h-3.5 text-blue-600" />
          <span>Altas y Hardware ({unifiedTimeline.filter(i => i.category === 'alta_hardware' || i.category === 'baja').length})</span>
        </button>
      </div>

      {/* 3. Detailed Chronological Timeline */}
      <div className="relative pl-7 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        
        {filteredItems.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-400 space-y-2">
            <Info className="w-6 h-6 text-slate-400 mx-auto" />
            <p className="text-xs font-semibold text-slate-600">
              No hay eventos en la categoría seleccionada.
            </p>
            <p className="text-[11px] text-slate-400">
              Selecciona "Todos" para visualizar el historial completo de este activo.
            </p>
          </div>
        ) : (
          filteredItems.map((item, idx) => (
            <div key={item.id} className="relative group">
              
              {/* Timeline Connector Dot / Node */}
              <div className={`absolute -left-7 top-1.5 w-6 h-6 rounded-full flex items-center justify-center shadow-xs ring-4 ring-white ${item.iconBgClass} ${item.iconColorClass}`}>
                {item.icon}
              </div>

              {/* Event Card */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs group-hover:border-slate-300 transition-all space-y-3">
                
                {/* Event Card Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-xs text-slate-900">
                        {item.title}
                      </h4>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${item.badgeColorClass}`}>
                        {item.badgeLabel}
                      </span>
                    </div>
                  </div>

                  {/* Clean unboxed date & time (Anti-pill) */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{formatDateTime(item.date)}</span>
                  </div>
                </div>

                {/* Event Description */}
                <p className="text-xs text-slate-600 leading-relaxed">
                  {item.description}
                </p>

                {/* Specific Category Rich Details */}
                {item.category === 'usuario' && item.metadata && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2.5 rounded-lg bg-indigo-50/50 border border-indigo-100 text-xs">
                    <div>
                      <span className="text-[10px] font-semibold uppercase text-indigo-500 block">Colaborador / Titular:</span>
                      <strong className="text-indigo-950 font-medium">{item.metadata.employeeName}</strong>
                      {item.metadata.employeePosition && (
                        <p className="text-[11px] text-indigo-800">{item.metadata.employeePosition}</p>
                      )}
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold uppercase text-indigo-500 block">Documento de Responsiva:</span>
                      <span className="font-mono text-indigo-950 font-bold block">{item.metadata.folioResponsiva}</span>
                      {item.metadata.notes && (
                        <p className="text-[11px] text-indigo-700">{item.metadata.notes}</p>
                      )}
                    </div>
                  </div>
                )}

                {item.category === 'traslado' && item.metadata && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2.5 rounded-lg bg-purple-50/50 border border-purple-100 text-xs">
                    <div>
                      <span className="text-[10px] font-semibold uppercase text-purple-500 block">Ruta de Traslado:</span>
                      <p className="text-purple-950 font-medium">
                        {item.metadata.sourceBranch} <ArrowRight className="w-3 h-3 inline text-purple-600" /> {item.metadata.targetBranch}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold uppercase text-purple-500 block">Transportista & Guía:</span>
                      <p className="font-mono text-purple-950">
                        {item.metadata.carrier} {item.metadata.trackingNumber ? `· Guía: ${item.metadata.trackingNumber}` : ''}
                      </p>
                    </div>
                  </div>
                )}

                {item.category === 'reparacion' && item.metadata && (
                  <div className="space-y-2 p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-100 text-xs">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <div>
                        <span className="text-[10px] font-semibold uppercase text-emerald-600 block">Técnico Encargado:</span>
                        <strong className="text-emerald-950 font-medium">{item.metadata.technician}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold uppercase text-emerald-600 block">Costo de Servicio:</span>
                        <strong className="text-emerald-950 font-mono font-medium">
                          {item.metadata.cost ? `${formatCurrency(item.metadata.cost)} MXN` : 'Sin costo adicional'}
                        </strong>
                      </div>
                      {item.metadata.diagnosticScore !== undefined && (
                        <div>
                          <span className="text-[10px] font-semibold uppercase text-emerald-600 block">Diagnóstico Score:</span>
                          <span className="font-bold text-emerald-700">{item.metadata.diagnosticScore}/100 Puntos</span>
                        </div>
                      )}
                    </div>

                    {/* Expandable tasks list */}
                    {item.metadata.tasks && item.metadata.tasks.length > 0 && (
                      <div className="pt-1.5 border-t border-emerald-200/50">
                        <button
                          onClick={() => toggleTasks(item.id)}
                          className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>{item.metadata.tasks.length} tareas técnicas ejecutadas</span>
                          <span className="text-[10px] underline ml-1">
                            {expandedTasks[item.id] ? '(Ocultar)' : '(Ver detalles)'}
                          </span>
                        </button>

                        {expandedTasks[item.id] && (
                          <ul className="mt-2 space-y-1 text-[11px] text-emerald-900 bg-white/60 p-2 rounded-lg border border-emerald-100 list-disc list-inside">
                            {item.metadata.tasks.map((task, tidx) => (
                              <li key={tidx}>{task}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Footer metadata: Author & audit proof */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>
                    Registrado por: <strong className="text-slate-700 font-medium">{item.author}</strong>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    ID Ref: {item.id.slice(0, 16)}
                  </span>
                </div>

              </div>

            </div>
          ))
        )}

      </div>

      {/* 4. Modal to Add New Manual Traceability Event */}
      {showAddModal && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Registrar Evento de Trazabilidad
                  </h3>
                  <p className="text-xs text-slate-500">
                    Equipo: {asset.assetTag} ({asset.brand} {asset.model})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveNewEvent} className="space-y-4 text-xs">
              
              {/* Category Picker */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1.5">
                  Tipo de Cambio o Movimiento:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewEventCategory('usuario')}
                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                      newEventCategory === 'usuario'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <User className="w-4 h-4 mx-auto mb-1 text-indigo-600" />
                    <span>Cambio Usuario</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewEventCategory('traslado')}
                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                      newEventCategory === 'traslado'
                        ? 'border-purple-600 bg-purple-50 text-purple-700 font-bold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Truck className="w-4 h-4 mx-auto mb-1 text-purple-600" />
                    <span>Traslado Sede</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewEventCategory('reparacion')}
                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                      newEventCategory === 'reparacion'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-700 font-bold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Wrench className="w-4 h-4 mx-auto mb-1 text-emerald-600" />
                    <span>Reparación</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewEventCategory('alta_hardware')}
                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                      newEventCategory === 'alta_hardware'
                        ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Cpu className="w-4 h-4 mx-auto mb-1 text-blue-600" />
                    <span>Hardware</span>
                  </button>
                </div>
              </div>

              {/* Title input */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Título del Evento / Cambio:
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ej: Reemplazo de teclado corporativo por falla de teclas"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-indigo-500 bg-slate-50"
                />
              </div>

              {/* Description input */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Detalles y Observaciones Técnicas:
                </label>
                <textarea
                  required
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Describa el motivo, piezas involucradas, colaborador responsable o dictamen técnico..."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-indigo-500 bg-slate-50"
                />
              </div>

              {/* Author input */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Responsable / Registrado por:
                </label>
                <input
                  type="text"
                  required
                  value={newAuthor}
                  onChange={(e) => setNewAuthor(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-indigo-500 bg-slate-50"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors cursor-pointer shadow-xs"
                >
                  Guardar en Bitácora
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
