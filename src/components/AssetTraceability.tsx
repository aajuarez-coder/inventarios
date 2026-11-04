import React, { useState, useMemo, useEffect, useRef } from 'react';
import { HardwareAsset, TimelineEvent, Employee } from '../types/inventory';
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
  Info,
  Mail,
  Search,
  X,
  Building2,
  RotateCcw,
  Check,
  ChevronDown,
  Send
} from 'lucide-react';
import { formatDate, formatDateTime, formatCurrency } from '../utils/formatters';
import { CustomGmailComposeModal } from './CustomGmailComposeModal';

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
    companies,
    currentUser, 
    canEdit, 
    logEvent,
    updateAsset,
    createAssignment,
    createTransfer,
    createMaintenanceRecord
  } = useInventory();

  const currentAssignedEmp = employees.find(e => e.id === asset.assignedToEmployeeId);
  const currentBranch = branches.find(b => b.id === asset.branchId) || branches[0];

  const [filter, setFilter] = useState<TraceabilityFilter>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEventCategory, setNewEventCategory] = useState<'usuario' | 'traslado' | 'reparacion' | 'alta_hardware'>('usuario');
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newAuthor, setNewAuthor] = useState(currentUser?.name || 'Administrador TI');
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});

  // 1. Colaborador Searchable Combobox State
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(asset.assignedToEmployeeId || '');
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState('');
  const [isEmployeeDropdownOpen, setIsEmployeeDropdownOpen] = useState(false);
  const employeeDropdownRef = useRef<HTMLDivElement>(null);
  const employeeInputRef = useRef<HTMLInputElement>(null);

  // 2. Traslado de Sede State
  const [targetBranchId, setTargetBranchId] = useState<string>(
    branches.find(b => b.id !== asset.branchId)?.id || branches[1]?.id || ''
  );
  const [carrier, setCarrier] = useState('Estafeta Express Terrestre');
  const [trackingNumber, setTrackingNumber] = useState(
    () => `EST-${Math.floor(100000000 + Math.random() * 900000000)}-MX`
  );

  // 3. Reparación / Hardware State
  const [repairType, setRepairType] = useState('Mantenimiento Correctivo');
  const [technicianName, setTechnicianName] = useState(currentUser?.name || 'Soporte Técnico Petroil');
  const [repairCost, setRepairCost] = useState<number>(0);
  const [replacedParts, setReplacedParts] = useState('');
  const [diagnosticScore, setDiagnosticScore] = useState<number>(95);

  // 4. Action Feedback & Email Modal State
  const [actionFeedback, setActionFeedback] = useState<{
    type: 'usuario' | 'traslado' | 'reparacion' | 'alta_hardware';
    title: string;
    subtitle: string;
    emailData?: {
      to: string;
      subject: string;
      body: string;
    };
  } | null>(null);

  const [emailModalState, setEmailModalState] = useState<{
    isOpen: boolean;
    defaultTo: string;
    defaultSubject: string;
    defaultBody: string;
  }>({
    isOpen: false,
    defaultTo: '',
    defaultSubject: '',
    defaultBody: ''
  });

  // Click outside to close collaborator dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (employeeDropdownRef.current && !employeeDropdownRef.current.contains(event.target as Node)) {
        setIsEmployeeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filtered employees for searchable combobox
  const filteredEmployees = useMemo(() => {
    const q = employeeSearchQuery.toLowerCase().trim();
    if (!q) return employees;
    return employees.filter(e =>
      e.fullName.toLowerCase().includes(q) ||
      e.employeeNumber.toLowerCase().includes(q) ||
      (e.position && e.position.toLowerCase().includes(q)) ||
      (e.department && e.department.toLowerCase().includes(q)) ||
      (e.email && e.email.toLowerCase().includes(q))
    );
  }, [employees, employeeSearchQuery]);

  const selectedEmployeeObj = useMemo(() => {
    return employees.find(e => e.id === selectedEmployeeId);
  }, [employees, selectedEmployeeId]);

  // Sync targetBranchId when asset or branches change
  useEffect(() => {
    if (branches.length > 1 && targetBranchId === asset.branchId) {
      const other = branches.find(b => b.id !== asset.branchId);
      if (other) setTargetBranchId(other.id);
    }
  }, [asset.branchId, branches, targetBranchId]);

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

  const handleOpenAddModal = () => {
    setNewEventCategory('usuario');
    setSelectedEmployeeId(asset.assignedToEmployeeId || '');
    setEmployeeSearchQuery('');
    setIsEmployeeDropdownOpen(false);
    if (asset.assignedToEmployeeId) {
      const cur = employees.find(e => e.id === asset.assignedToEmployeeId);
      if (cur) {
        setNewTitle(`Cambio de Custodia: ${cur.fullName}`);
        setNewDescription(`Equipo actualmente asignado a ${cur.fullName} (${cur.position} · ${cur.department}).`);
      }
    } else {
      setNewTitle('Asignación de Equipo a Colaborador');
      setNewDescription('Equipo en almacén disponible para asignación.');
    }
    setShowAddModal(true);
  };

  const handleChangeCategory = (cat: 'usuario' | 'traslado' | 'reparacion' | 'alta_hardware') => {
    setNewEventCategory(cat);
    if (cat === 'usuario') {
      if (selectedEmployeeObj) {
        setNewTitle(`Cambio de Usuario: Asignación a ${selectedEmployeeObj.fullName}`);
        setNewDescription(`Reasignación y custodia de equipo entregado a ${selectedEmployeeObj.fullName} (${selectedEmployeeObj.position} · ${selectedEmployeeObj.department}). Responsiva actualizada generada.`);
      } else {
        setNewTitle('Reasignación de Usuario');
        setNewDescription('Cambio de colaborador responsable del equipo.');
      }
    } else if (cat === 'traslado') {
      const dst = branches.find(b => b.id === targetBranchId) || branches.find(b => b.id !== asset.branchId);
      setNewTitle(`Traslado de Sede: ${currentBranch.name} ➔ ${dst?.name || 'Sede Destino'}`);
      setNewDescription(`Despacho y traslado logístico del equipo hacia ${dst?.name} (${dst?.city}) vía ${carrier}. Guía: ${trackingNumber}.`);
    } else if (cat === 'reparacion') {
      setNewTitle(`Mantenimiento / Reparación: ${repairType}`);
      setNewDescription(`Servicio técnico ejecutado por ${technicianName}. Componentes: ${replacedParts || 'Ajustes, limpieza y calibración general'}. Dictamen: Operativo.`);
    } else if (cat === 'alta_hardware') {
      setNewTitle(`Actualización de Hardware: ${repairType}`);
      setNewDescription(`Upgrade o reemplazo de hardware ejecutado por ${technicianName}. Componentes: ${replacedParts || 'Mejora de memoria/almacenamiento'}. Dictamen: Operativo.`);
    }
  };

  // Handler to create and execute traceability actions
  const handleSaveNewEvent = (e: React.FormEvent) => {
    e.preventDefault();

    if (newEventCategory === 'usuario') {
      if (selectedEmployeeId) {
        const emp = employees.find(e => e.id === selectedEmployeeId);
        
        // 1. Create official assignment with responsiva folio
        const newAsg = createAssignment(
          asset.id,
          selectedEmployeeId,
          asset.accessoriesIncluded || ['Cargador original con cable de alimentación', 'Mouse inalámbrico corporativo'],
          newDescription.trim() || `Reasignación a ${emp?.fullName}`,
          newAuthor.trim() || currentUser?.name || 'Administrador TI'
        );

        // Prepare email data for Responsiva Actualizada
        const subject = `[Petroil TI] Carta Responsiva Actualizada - Folio ${newAsg.folioResponsiva} (${asset.assetTag})`;
        const body = `Estimado(a) ${emp?.fullName || 'Colaborador(a)'},\n\nLe notificamos formalmente la reasignación del siguiente equipo informático bajo su custodia y resguardo laboral:\n\n• Folio de Carta Responsiva: ${newAsg.folioResponsiva}\n• Equipo: ${asset.brand} ${asset.model}\n• Placa / Asset Tag: ${asset.assetTag}\n• Número de Serie (S/N): ${asset.serialNumber}\n• Procesador / RAM / Disco: ${asset.specs?.cpu || ''}, ${asset.specs?.ram || ''}, ${asset.specs?.storage || ''}\n• Sucursal / Planta: ${currentBranch?.name || 'Sede Petroil'}\n• Accesorios Incluidos: ${(asset.accessoriesIncluded || ['Cargador original']).join(', ')}\n\nFavor de verificar las condiciones físicas y operativas del equipo e ingresar al sistema para firmar digitalmente su Carta Responsiva.\n\nAtentamente,\n${currentUser.name}\nTecnologías de la Información • Grupo Petroil`;

        setActionFeedback({
          type: 'usuario',
          title: '¡Cambio de Colaborador Guardado Exitosamente!',
          subtitle: `Equipo ${asset.assetTag} asignado a ${emp?.fullName}. Responsiva Folio: ${newAsg.folioResponsiva}.`,
          emailData: {
            to: emp?.email || '',
            subject,
            body
          }
        });
      } else {
        // Returned to warehouse / unassigned
        updateAsset(asset.id, {
          assignedToEmployeeId: undefined,
          status: 'disponible',
          locationDetails: `Almacén TI (${currentBranch.name})`
        });

        logEvent({
          assetId: asset.id,
          type: 'devolucion',
          title: newTitle.trim() || 'Devolución de Equipo a Almacén TI',
          description: newDescription.trim() || 'Desasignación de usuario previa. Equipo disponible en almacén.',
          author: newAuthor.trim() || currentUser?.name || 'Administrador TI'
        });

        setActionFeedback({
          type: 'usuario',
          title: '¡Equipo Reingresado a Almacén TI!',
          subtitle: `El equipo ${asset.assetTag} ahora se encuentra disponible en almacén sin usuario asignado.`
        });
      }
    } else if (newEventCategory === 'traslado') {
      if (targetBranchId === asset.branchId) {
        alert('La sucursal destino debe ser distinta a la sucursal de origen.');
        return;
      }

      const dstBranch = branches.find(b => b.id === targetBranchId);
      const newTrf = createTransfer({
        assetIds: [asset.id],
        sourceBranchId: asset.branchId,
        targetBranchId,
        shipmentDate: new Date().toISOString().split('T')[0],
        estimatedArrival: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
        carrier: carrier.trim() || 'Estafeta Terrestre',
        trackingNumber: trackingNumber.trim() || `EST-${Date.now().toString().slice(-8)}`,
        status: 'en_transito',
        requestedBy: currentUser.name,
        notes: newDescription.trim() || `Traslado despachado hacia ${dstBranch?.name}`
      });

      setActionFeedback({
        type: 'traslado',
        title: '¡Traslado de Sede Registrado y Despachado!',
        subtitle: `Envío ${newTrf.folio} en ruta de ${currentBranch.name} hacia ${dstBranch?.name}. Guía: ${trackingNumber}.`
      });
    } else {
      // reparacion o alta_hardware
      const assignedEmp = employees.find(e => e.id === asset.assignedToEmployeeId);
      createMaintenanceRecord({
        assetId: asset.id,
        date: new Date().toISOString().split('T')[0],
        type: newEventCategory === 'reparacion' ? 'correctivo' : 'actualizacion_hardware',
        technicianName: technicianName.trim() || currentUser.name,
        cost: Number(repairCost) || 0,
        description: `${newTitle.trim()}: ${newDescription.trim()} ${replacedParts ? `(Piezas: ${replacedParts.trim()})` : ''}`,
        tasksCompleted: [
          newTitle.trim(),
          replacedParts.trim() ? `Instalación/Sustitución: ${replacedParts.trim()}` : 'Inspección de diagnóstico y calibración',
          'Pruebas de estrés y funcionamiento continuo'
        ],
        diagnosticScore: diagnosticScore || 95,
        nextScheduledDate: new Date(Date.now() + 86400000 * 180).toISOString().split('T')[0],
        status: 'completado',
        emailNotified: false
      });

      const emailSubject = `[Servicio TI Petroil] Reporte de ${newEventCategory === 'reparacion' ? 'Reparación / Servicio Técnico' : 'Actualización de Hardware'} - Equipo ${asset.assetTag}`;
      const emailBody = `Estimado(a) ${assignedEmp?.fullName || 'Colaborador(a)'},\n\nLe informamos que se ha registrado un evento de ${newEventCategory === 'reparacion' ? 'reparación y servicio técnico' : 'actualización de hardware'} para el equipo informático [${asset.assetTag}] ${asset.brand} ${asset.model} (S/N: ${asset.serialNumber}):\n\n• Servicio Realizado: ${newTitle.trim()}\n• Detalles Técnicos: ${newDescription.trim()}\n• Piezas / Componentes: ${replacedParts.trim() || 'Ajustes, pasta térmica y mantenimiento general'}\n• Técnico Encargado: ${technicianName.trim() || currentUser.name}\n• Calificación Diagnóstica: ${diagnosticScore}/100 Puntos\n• Estado del Equipo: Operativo y validado\n\nAtentamente,\n${currentUser.name}\nDepartamento de TI • Grupo Petroil`;

      setActionFeedback({
        type: 'reparacion',
        title: `¡Evento de ${newEventCategory === 'reparacion' ? 'Reparación' : 'Hardware'} Guardado!`,
        subtitle: `Se agregó el registro técnico a la bitácora del equipo ${asset.assetTag}.`,
        emailData: {
          to: assignedEmp?.email || currentUser.email,
          subject: emailSubject,
          body: emailBody
        }
      });
    }

    setNewTitle('');
    setNewDescription('');
    setShowAddModal(false);
  };

  const handleSendResponsivaForItem = (item: TraceabilityItem) => {
    const asg = assignments.find(a => a.folioResponsiva === item.metadata?.folioResponsiva) ||
      assignments.filter(a => a.assetId === asset.id).sort((a, b) => new Date(b.assignedDate).getTime() - new Date(a.assignedDate).getTime())[0];
    const emp = asg ? employees.find(e => e.id === asg.employeeId) : employees.find(e => e.id === asset.assignedToEmployeeId);
    const folio = asg ? asg.folioResponsiva : (item.metadata?.folioResponsiva || 'Actualización TI');

    setEmailModalState({
      isOpen: true,
      defaultTo: emp?.email || '',
      defaultSubject: `[Petroil TI] Carta Responsiva Actualizada - Folio ${folio} (${asset.assetTag})`,
      defaultBody: `Estimado(a) ${emp?.fullName || 'Colaborador(a)'},\n\nLe enviamos los datos actualizados de la Carta Responsiva del equipo [${asset.assetTag}] ${asset.brand} ${asset.model} bajo su resguardo:\n\n• Folio de Responsiva: ${folio}\n• Placa / Asset Tag: ${asset.assetTag}\n• Serie (S/N): ${asset.serialNumber}\n• Especificaciones: ${asset.specs?.cpu || ''}, ${asset.specs?.ram || ''}, ${asset.specs?.storage || ''}\n• Ubicación / Planta: ${currentBranch?.name || 'Sede Petroil'}\n\nFavor de validar su acuse de recibo y mantener las condiciones óptimas de resguardo.\n\nAtentamente,\n${currentUser.name}\nTecnologías de la Información • Grupo Petroil`
    });
  };

  const handleSendRepairEmailForItem = (item: TraceabilityItem) => {
    const assignedEmp = employees.find(e => e.id === asset.assignedToEmployeeId);
    setEmailModalState({
      isOpen: true,
      defaultTo: assignedEmp?.email || currentUser.email,
      defaultSubject: `[Servicio TI Petroil] Reporte de Servicio Técnico - Equipo ${asset.assetTag} (${item.title})`,
      defaultBody: `Estimado(a) colaborador(a),\n\nCompartimos el reporte de servicio técnico para el equipo informático [${asset.assetTag}] ${asset.brand} ${asset.model}:\n\n• Evento: ${item.title}\n• Fecha de Servicio: ${formatDate(item.date)}\n• Detalles: ${item.description}\n• Técnico Responsable: ${item.author || item.metadata?.technician || currentUser.name}\n\nAtentamente,\nSoporte TI • Grupo Petroil`
    });
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
                onClick={handleOpenAddModal}
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

      {/* Action Feedback Banner (Prompting to send responsiva or repair email) */}
      {actionFeedback && (
        <div className={`p-4 rounded-2xl border transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          actionFeedback.type === 'usuario'
            ? 'bg-indigo-50/90 border-indigo-200 text-indigo-900'
            : actionFeedback.type === 'traslado'
            ? 'bg-purple-50/90 border-purple-200 text-purple-900'
            : 'bg-emerald-50/90 border-emerald-200 text-emerald-900'
        }`}>
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-xl shrink-0 ${
              actionFeedback.type === 'usuario'
                ? 'bg-indigo-600 text-white'
                : actionFeedback.type === 'traslado'
                ? 'bg-purple-600 text-white'
                : 'bg-emerald-600 text-white'
            }`}>
              <Check className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-xs">
                {actionFeedback.title}
              </h4>
              <p className="text-xs opacity-90 mt-0.5">
                {actionFeedback.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {actionFeedback.type === 'usuario' && (
              <button
                type="button"
                onClick={() => {
                  if (actionFeedback.emailData) {
                    setEmailModalState({
                      isOpen: true,
                      defaultTo: actionFeedback.emailData.to,
                      defaultSubject: actionFeedback.emailData.subject,
                      defaultBody: actionFeedback.emailData.body
                    });
                  }
                }}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>✉️ Enviar Responsiva Actualizada</span>
              </button>
            )}

            {(actionFeedback.type === 'reparacion' || actionFeedback.type === 'alta_hardware') && (
              <button
                type="button"
                onClick={() => {
                  if (actionFeedback.emailData) {
                    setEmailModalState({
                      isOpen: true,
                      defaultTo: actionFeedback.emailData.to,
                      defaultSubject: actionFeedback.emailData.subject,
                      defaultBody: actionFeedback.emailData.body
                    });
                  }
                }}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>✉️ Enviar Notificación de Servicio por Correo</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setActionFeedback(null)}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-black/5 cursor-pointer"
              title="Cerrar aviso"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

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
                  <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100 text-xs space-y-2.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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

                    <div className="pt-2 border-t border-indigo-100 flex flex-wrap items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleSendResponsivaForItem(item)}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-[11px] flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>✉️ Enviar Responsiva Actualizada</span>
                      </button>
                      <span className="text-[10px] text-indigo-500 font-mono">
                        Folio: {item.metadata.folioResponsiva}
                      </span>
                    </div>
                  </div>
                )}

                {item.category === 'traslado' && item.metadata && (
                  <div className="p-3 rounded-xl bg-purple-50/50 border border-purple-100 text-xs space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] font-semibold uppercase text-purple-500 block">Ruta de Traslado:</span>
                        <p className="text-purple-950 font-medium flex items-center gap-1.5">
                          <span>{item.metadata.sourceBranch}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                          <span className="font-bold text-purple-900">{item.metadata.targetBranch}</span>
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold uppercase text-purple-500 block">Transportista & Guía:</span>
                        <p className="font-mono text-purple-950">
                          {item.metadata.carrier || 'Logística Interna Petroil'} {item.metadata.trackingNumber ? `· Guía: ${item.metadata.trackingNumber}` : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {(item.category === 'reparacion' || item.category === 'alta_hardware') && item.metadata && (
                  <div className="space-y-2.5 p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 text-xs">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <div>
                        <span className="text-[10px] font-semibold uppercase text-emerald-600 block">Técnico Encargado:</span>
                        <strong className="text-emerald-950 font-medium">{item.metadata.technician || 'Soporte TI'}</strong>
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

                    <div className="pt-2 border-t border-emerald-100 flex flex-wrap items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleSendRepairEmailForItem(item)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>✉️ Enviar Notificación de Servicio por Correo</span>
                      </button>
                      <span className="text-[10px] text-emerald-700 font-mono">
                        Bitácora Técnica Petroil
                      </span>
                    </div>
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
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-4 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            
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
                    Equipo: <span className="font-mono font-bold text-slate-800">{asset.assetTag}</span> ({asset.brand} {asset.model}) · Serie: {asset.serialNumber}
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
                    onClick={() => handleChangeCategory('usuario')}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      newEventCategory === 'usuario'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <User className="w-4 h-4 mx-auto mb-1 text-indigo-600" />
                    <span className="block text-xs">Cambio Usuario</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleChangeCategory('traslado')}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      newEventCategory === 'traslado'
                        ? 'border-purple-600 bg-purple-50 text-purple-700 font-bold shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Truck className="w-4 h-4 mx-auto mb-1 text-purple-600" />
                    <span className="block text-xs">Traslado Sede</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleChangeCategory('reparacion')}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      newEventCategory === 'reparacion'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-700 font-bold shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Wrench className="w-4 h-4 mx-auto mb-1 text-emerald-600" />
                    <span className="block text-xs">Reparación</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleChangeCategory('alta_hardware')}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      newEventCategory === 'alta_hardware'
                        ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Cpu className="w-4 h-4 mx-auto mb-1 text-blue-600" />
                    <span className="block text-xs">Hardware</span>
                  </button>
                </div>
              </div>

              {/* ---------------------------------------------------- */}
              {/* CATEGORY 1: CAMBIO DE USUARIO (Searchable Combobox)  */}
              {/* ---------------------------------------------------- */}
              {newEventCategory === 'usuario' && (
                <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-950 flex items-center gap-1.5 text-xs">
                      <User className="w-4 h-4 text-indigo-600" />
                      Asignación del Equipo a Colaborador
                    </span>
                    <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-100/80 px-2 py-0.5 rounded-md">
                      Búsqueda en tiempo real
                    </span>
                  </div>

                  {/* Estado actual */}
                  <div className="p-2.5 rounded-lg bg-white border border-indigo-100 text-xs flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-semibold">Titular Actual:</span>
                      <strong className="text-slate-800">
                        {currentAssignedEmp ? `${currentAssignedEmp.fullName} (${currentAssignedEmp.employeeNumber})` : '📦 Sin Asignar (En Almacén TI)'}
                      </strong>
                    </div>
                    {currentAssignedEmp && (
                      <span className="text-[10px] text-indigo-600 font-medium">
                        {currentAssignedEmp.position}
                      </span>
                    )}
                  </div>

                  {/* Selected New Collaborator Card OR Search Input */}
                  {selectedEmployeeObj ? (
                    <div className="p-3 rounded-xl bg-white border-2 border-indigo-500 shadow-xs space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                            {selectedEmployeeObj.fullName.split(' ').map(n => n[0]).slice(0, 2).join('')}
                          </div>
                          <div>
                            <strong className="text-slate-900 block font-bold text-xs">
                              {selectedEmployeeObj.fullName}
                            </strong>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1.5 flex-wrap">
                              <span className="font-mono text-indigo-600 font-semibold">{selectedEmployeeObj.employeeNumber}</span>
                              <span>•</span>
                              <span>{selectedEmployeeObj.position}</span>
                              <span>•</span>
                              <span className="text-slate-600 font-medium">{selectedEmployeeObj.department}</span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedEmployeeId('');
                            setEmployeeSearchQuery('');
                            setIsEmployeeDropdownOpen(true);
                            setTimeout(() => employeeInputRef.current?.focus(), 50);
                          }}
                          className="px-2.5 py-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 cursor-pointer transition-colors"
                        >
                          Cambiar
                        </button>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-400" />
                          {selectedEmployeeObj.email || 'Sin correo corporativo'}
                        </span>
                        <span className="text-emerald-600 font-semibold flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Seleccionado
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5 relative" ref={employeeDropdownRef}>
                      <label className="font-semibold text-slate-700 block text-xs">
                        Buscar y seleccionar nuevo colaborador:
                      </label>

                      <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                        <input
                          ref={employeeInputRef}
                          type="text"
                          value={employeeSearchQuery}
                          onChange={(e) => {
                            setEmployeeSearchQuery(e.target.value);
                            setIsEmployeeDropdownOpen(true);
                          }}
                          onFocus={() => setIsEmployeeDropdownOpen(true)}
                          placeholder="Teclea nombre, no. nómina, departamento o correo..."
                          className="w-full text-xs pl-9 pr-8 py-2 rounded-xl border border-indigo-300 focus:outline-indigo-600 bg-white shadow-xs"
                        />
                        {employeeSearchQuery ? (
                          <button
                            type="button"
                            onClick={() => {
                              setEmployeeSearchQuery('');
                              employeeInputRef.current?.focus();
                            }}
                            className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                        )}
                      </div>

                      {/* Dropdown Menu */}
                      {isEmployeeDropdownOpen && (
                        <div className="absolute left-0 right-0 z-50 mt-1 max-h-56 overflow-y-auto bg-white rounded-xl border border-slate-200 shadow-xl divide-y divide-slate-100">
                          {/* Unassign option */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedEmployeeId('unassigned');
                              setEmployeeSearchQuery('');
                              setIsEmployeeDropdownOpen(false);
                              setNewTitle(`Recepción de equipo en Almacén TI - Resguardo libre`);
                              setNewDescription(`El equipo [${asset.assetTag}] es devuelto a Almacén TI y queda disponible para nueva asignación.`);
                            }}
                            className="w-full p-2.5 text-left hover:bg-amber-50 flex items-center gap-2.5 text-amber-900 transition-colors cursor-pointer"
                          >
                            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                              <RotateCcw className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <span className="font-bold text-xs block">📦 Dejar Sin Asignar (Regresar a Almacén TI)</span>
                              <span className="text-[10px] text-amber-700">Libera al colaborador actual y deja el equipo en inventario disponible</span>
                            </div>
                          </button>

                          {filteredEmployees.length === 0 ? (
                            <div className="p-4 text-center text-slate-400 text-xs">
                              No se encontraron colaboradores coincidentes con "{employeeSearchQuery}"
                            </div>
                          ) : (
                            filteredEmployees.map(emp => (
                              <button
                                key={emp.id}
                                type="button"
                                onClick={() => {
                                  setSelectedEmployeeId(emp.id);
                                  setEmployeeSearchQuery('');
                                  setIsEmployeeDropdownOpen(false);
                                  setNewTitle(`Asignación de equipo a ${emp.fullName}`);
                                  setNewDescription(`Entrega formal del equipo informático [${asset.assetTag}] ${asset.brand} ${asset.model} (S/N: ${asset.serialNumber}) al colaborador ${emp.fullName} (${emp.position} - ${emp.department}). Se generará carta responsiva actualizada.`);
                                }}
                                className="w-full p-2 text-left hover:bg-indigo-50/70 flex items-center justify-between gap-2 transition-colors cursor-pointer text-xs"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-[11px] shrink-0">
                                    {emp.fullName.split(' ').map(n => n[0]).slice(0, 2).join('')}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="font-semibold text-slate-900 truncate">
                                      {emp.fullName}
                                    </div>
                                    <div className="text-[10px] text-slate-500 truncate flex items-center gap-1.5">
                                      <span className="font-mono text-indigo-600 font-semibold">{emp.employeeNumber}</span>
                                      <span>•</span>
                                      <span>{emp.position}</span>
                                      <span>•</span>
                                      <span>{emp.department}</span>
                                    </div>
                                  </div>
                                </div>
                                <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                                  {emp.email}
                                </span>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {selectedEmployeeId === 'unassigned' && (
                    <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <RotateCcw className="w-4 h-4 text-amber-700 shrink-0" />
                        <div>
                          <strong className="block text-xs">Equipo pasará a: Almacén TI / Disponible</strong>
                          <span className="text-[10px] text-amber-700">Se cerrará la responsiva actual del equipo.</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedEmployeeId('')}
                        className="text-xs font-semibold text-amber-800 underline hover:text-amber-900 cursor-pointer"
                      >
                        Cambiar
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ---------------------------------------------------- */}
              {/* CATEGORY 2: TRASLADO DE SEDE (Origen & Destino)       */}
              {/* ---------------------------------------------------- */}
              {newEventCategory === 'traslado' && (
                <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-950 flex items-center gap-1.5 text-xs">
                      <Truck className="w-4 h-4 text-purple-600" />
                      Logística y Traslado de Sucursal
                    </span>
                    <span className="text-[10px] font-semibold text-purple-700 bg-purple-100/80 px-2 py-0.5 rounded-md">
                      Control de Sedes
                    </span>
                  </div>

                  {/* Sucursal Origen (Ubicación actual del equipo) */}
                  <div className="p-3 rounded-xl bg-white border border-purple-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-purple-600" />
                        1. Sucursal Origen (Ubicación Actual del Equipo):
                      </span>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono font-semibold">
                        {currentBranch?.code || 'ORIGEN'}
                      </span>
                    </div>

                    <p className="text-xs font-bold text-slate-900">
                      {currentBranch ? `${currentBranch.name} (${currentBranch.code})` : 'Sede Central Petroil (Matriz)'}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {currentBranch?.address || 'Av. del Mar #1000'}, {currentBranch?.city || 'Mazatlán'}, {currentBranch?.state || 'Sinaloa'}
                    </p>
                    {currentBranch?.managerName && (
                      <p className="text-[10px] text-purple-800 font-medium">
                        Responsable de Sede: {currentBranch.managerName}
                      </p>
                    )}
                  </div>

                  {/* Sucursal Destino (Selector con opciones de sucursales dadas de alta) */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-purple-950 block">
                      2. Sucursal Destino a donde enviar el equipo:
                    </label>

                    <select
                      required
                      value={targetBranchId}
                      onChange={(e) => {
                        const targetId = e.target.value;
                        setTargetBranchId(targetId);
                        const dest = branches.find(b => b.id === targetId);
                        if (dest) {
                          setNewTitle(`Traslado de equipo: ${currentBranch?.name || 'Origen'} ➔ ${dest.name}`);
                          setNewDescription(`Movimiento físico y logístico del equipo informático [${asset.assetTag}] ${asset.brand} ${asset.model} (S/N: ${asset.serialNumber}) hacia la sede de destino ${dest.name} (${dest.city}, ${dest.state}).`);
                        }
                      }}
                      className="w-full text-xs p-2.5 rounded-xl border border-purple-300 focus:outline-purple-600 bg-white shadow-xs font-medium"
                    >
                      <option value="">-- Selecciona la sucursal de destino --</option>
                      {branches.map(b => {
                        const isCurrent = b.id === asset.branchId;
                        return (
                          <option
                            key={b.id}
                            value={b.id}
                            disabled={isCurrent}
                          >
                            [{b.code}] {b.name} - {b.city}, {b.state} {isCurrent ? '⚠️ (SUCURSAL ACTUAL / ORIGEN)' : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Transportista y Guía */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                        Transportista / Paquetería:
                      </label>
                      <input
                        type="text"
                        value={carrier}
                        onChange={(e) => setCarrier(e.target.value)}
                        placeholder="Ej: Estafeta, DHL, Mensajero Interno..."
                        className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white focus:outline-purple-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                        Número de Guía / Rastreo:
                      </label>
                      <input
                        type="text"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        placeholder="Ej: GUIA-83749219"
                        className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white font-mono focus:outline-purple-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ---------------------------------------------------- */}
              {/* CATEGORY 3 & 4: REPARACION / ALTA HARDWARE           */}
              {/* ---------------------------------------------------- */}
              {(newEventCategory === 'reparacion' || newEventCategory === 'alta_hardware') && (
                <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-950 flex items-center gap-1.5 text-xs">
                      <Wrench className="w-4 h-4 text-emerald-600" />
                      Detalles de Reparación y Hardware
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                      Genera aviso por correo
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                        Tipo de Servicio Técnico:
                      </label>
                      <select
                        value={repairType}
                        onChange={(e) => {
                          setRepairType(e.target.value);
                          setNewTitle(`${e.target.value} - ${asset.assetTag}`);
                        }}
                        className="w-full text-xs p-2 rounded-xl border border-emerald-300 bg-white focus:outline-emerald-600"
                      >
                        <option value="Mantenimiento Correctivo">Mantenimiento Correctivo</option>
                        <option value="Mantenimiento Preventivo">Mantenimiento Preventivo</option>
                        <option value="Limpieza Física y Pasta Térmica">Limpieza Física y Pasta Térmica</option>
                        <option value="Reemplazo de Pantalla">Reemplazo de Pantalla LCD/OLED</option>
                        <option value="Reemplazo de Teclado / Touchpad">Reemplazo de Teclado / Touchpad</option>
                        <option value="Reemplazo de Batería">Reemplazo de Batería</option>
                        <option value="Expansión de Memoria RAM">Expansión de Memoria RAM</option>
                        <option value="Actualización / Cambio a SSD NVMe">Actualización / Cambio a SSD NVMe</option>
                        <option value="Diagnóstico de Hardware">Diagnóstico de Hardware</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                        Técnico / Taller Responsable:
                      </label>
                      <input
                        type="text"
                        value={technicianName}
                        onChange={(e) => setTechnicianName(e.target.value)}
                        placeholder="Nombre del técnico o proveedor..."
                        className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white focus:outline-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                        Piezas / Refacciones Reemplazadas:
                      </label>
                      <input
                        type="text"
                        value={replacedParts}
                        onChange={(e) => setReplacedParts(e.target.value)}
                        placeholder="Ej: Teclado SP retroiluminado, Kingston SSD 512GB..."
                        className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white focus:outline-emerald-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                          Costo (MXN):
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={repairCost}
                          onChange={(e) => setRepairCost(parseFloat(e.target.value) || 0)}
                          className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white font-mono focus:outline-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                          Score Salud (0-100):
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={diagnosticScore}
                          onChange={(e) => setDiagnosticScore(parseInt(e.target.value) || 100)}
                          className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white font-mono focus:outline-emerald-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Title input */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Título del Evento / Bitácora:
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
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Guardar en Bitácora</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* 5. Custom Gmail Compose Modal for Responsiva and Repair Dispatches */}
      {emailModalState.isOpen && (
        <CustomGmailComposeModal
          key={`${emailModalState.defaultTo}-${emailModalState.defaultSubject}`}
          isOpen={emailModalState.isOpen}
          onClose={() => setEmailModalState(prev => ({ ...prev, isOpen: false }))}
          defaultTo={emailModalState.defaultTo}
          defaultSubject={emailModalState.defaultSubject}
          defaultBody={emailModalState.defaultBody}
        />
      )}

    </div>
  );
};

