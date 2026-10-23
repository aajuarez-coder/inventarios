import React, { useState, useMemo } from 'react';
import { 
  Repeat, 
  Search, 
  Plus, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Laptop, 
  User, 
  FileText, 
  Printer, 
  Check, 
  X, 
  ArrowRight, 
  Eye, 
  ShieldAlert, 
  PenTool, 
  Package, 
  Download, 
  HelpCircle,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { EquipmentLoan, LoanStatus, PhysicalCondition, HardwareAsset, Employee } from '../types/inventory';
import { formatDate, formatDateTime } from '../utils/formatters';
import { DigitalSignaturePad } from './DigitalSignaturePad';
import { RemoteSecurityModal } from './RemoteSecurityModal';

interface EquipmentLoansManagerProps {
  onOpenAssetDetail?: (assetId: string) => void;
}

export const EquipmentLoansManager: React.FC<EquipmentLoansManagerProps> = ({ onOpenAssetDetail }) => {
  const { 
    loans, 
    assets, 
    employees, 
    currentUser, 
    createLoan, 
    returnLoan, 
    cancelLoan, 
    canEdit, 
    hasPermission 
  } = useInventory();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<LoanStatus | 'todos'>('todos');
  const [showNewLoanModal, setShowNewLoanModal] = useState(false);
  const [returningLoan, setReturningLoan] = useState<EquipmentLoan | null>(null);
  const [securityModalAsset, setSecurityModalAsset] = useState<HardwareAsset | null>(null);
  const [viewingLoanDetail, setViewingLoanDetail] = useState<EquipmentLoan | null>(null);

  // New Loan Form State
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [expectedReturnDate, setExpectedReturnDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [purpose, setPurpose] = useState<EquipmentLoan['purpose']>('viaje_trabajo');
  const [purposeDescription, setPurposeDescription] = useState('');
  const [conditionOnCheckout, setConditionOnCheckout] = useState<PhysicalCondition>('excelente');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [accessories, setAccessories] = useState<string[]>([
    'Cargador original',
    'Mochila / Maletín protector',
    'Mouse inalámbrico'
  ]);
  const [newAccessoryInput, setNewAccessoryInput] = useState('');
  const [employeeSignature, setEmployeeSignature] = useState<string | null>(null);
  const [showSignaturePad, setShowSignaturePad] = useState(false);

  // Return Loan Form State
  const [conditionOnReturn, setConditionOnReturn] = useState<PhysicalCondition>('bueno');
  const [returnNotes, setReturnNotes] = useState('');
  const [returnSignature, setReturnSignature] = useState<string | null>(null);
  const [showReturnSignaturePad, setShowReturnSignaturePad] = useState(false);

  // Assets available for loan (status is disponible or currently in warehouse)
  const availableAssets = useMemo(() => {
    return assets.filter(a => a.status === 'disponible');
  }, [assets]);

  // Calculations for days remaining or overdue
  const getLoanTiming = (expectedDateStr: string, actualDateStr?: string, status?: LoanStatus) => {
    if (status === 'devuelto') {
      return { label: 'Completado', className: 'text-slate-500 bg-slate-100', days: 0, isOverdue: false };
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(expectedDateStr);
    target.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        label: `${Math.abs(diffDays)} días de retraso`,
        className: 'text-rose-700 bg-rose-50 border border-rose-200 font-semibold',
        days: diffDays,
        isOverdue: true
      };
    } else if (diffDays === 0) {
      return {
        label: 'Vence hoy',
        className: 'text-amber-800 bg-amber-50 border border-amber-200 font-semibold',
        days: 0,
        isOverdue: false
      };
    } else {
      return {
        label: `${diffDays} días restantes`,
        className: 'text-indigo-700 bg-indigo-50 border border-indigo-200',
        days: diffDays,
        isOverdue: false
      };
    }
  };

  // Filtered Loans
  const filteredLoans = useMemo(() => {
    return loans.filter(l => {
      // Status filter
      if (statusFilter !== 'todos') {
        if (statusFilter === 'vencido') {
          const timing = getLoanTiming(l.expectedReturnDate, l.actualReturnDate, l.status);
          if (!timing.isOverdue && l.status !== 'vencido') return false;
        } else if (l.status !== statusFilter) {
          return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const asset = assets.find(a => a.id === l.assetId);
        const emp = employees.find(e => e.id === l.employeeId);
        return (
          l.folio.toLowerCase().includes(q) ||
          l.purposeDescription.toLowerCase().includes(q) ||
          asset?.assetTag.toLowerCase().includes(q) ||
          asset?.model.toLowerCase().includes(q) ||
          asset?.brand.toLowerCase().includes(q) ||
          emp?.fullName.toLowerCase().includes(q) ||
          emp?.email.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [loans, statusFilter, searchQuery, assets, employees]);

  // Metrics
  const activeCount = loans.filter(l => l.status === 'activo').length;
  const overdueCount = loans.filter(l => {
    const t = getLoanTiming(l.expectedReturnDate, l.actualReturnDate, l.status);
    return (t.isOverdue || l.status === 'vencido') && l.status !== 'devuelto';
  }).length;
  const returnedCount = loans.filter(l => l.status === 'devuelto').length;

  const handleCreateLoanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetId || !selectedEmployeeId) {
      alert('Por favor seleccione el equipo y el colaborador receptor.');
      return;
    }

    createLoan({
      assetId: selectedAssetId,
      employeeId: selectedEmployeeId,
      startDate: new Date(startDate).toISOString(),
      expectedReturnDate: new Date(expectedReturnDate).toISOString(),
      purpose,
      purposeDescription: purposeDescription || 'Préstamo temporal de equipo para actividades corporativas',
      accessoriesIncluded: accessories,
      conditionOnCheckout,
      deliveryNotes,
      technicianOutName: currentUser.name,
      employeeSignatureCheckout: employeeSignature || undefined
    });

    // Reset form
    setSelectedAssetId('');
    setSelectedEmployeeId('');
    setPurposeDescription('');
    setDeliveryNotes('');
    setEmployeeSignature(null);
    setShowNewLoanModal(false);
  };

  const handleReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!returningLoan) return;

    returnLoan(
      returningLoan.id,
      conditionOnReturn,
      returnNotes || 'Equipo retornado y verificado por personal de TI.',
      currentUser.name,
      returnSignature || undefined
    );

    setReturningLoan(null);
    setReturnSignature(null);
    setReturnNotes('');
  };

  const handlePrintLoanReceipt = (loan: EquipmentLoan) => {
    const asset = assets.find(a => a.id === loan.assetId);
    const emp = employees.find(e => e.id === loan.employeeId);

    const printWin = window.open('', '_blank');
    if (!printWin) return;

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Vale de Préstamo de Equipo - ${loan.folio}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 35px; color: #0f172a; line-height: 1.5; }
          .header { border-bottom: 2px solid #0f172a; padding-bottom: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
          .title { font-size: 20px; font-weight: bold; }
          .folio { font-family: monospace; font-size: 16px; font-weight: bold; background: #e0e7ff; color: #3730a3; padding: 4px 10px; border-radius: 6px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; font-size: 13px; }
          .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; }
          .card-title { font-weight: bold; font-size: 12px; text-transform: uppercase; color: #475569; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
          .accessories { margin-top: 15px; padding: 12px; background: #f1f5f9; border-radius: 6px; font-size: 12px; }
          .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 40px; }
          .sig-box { border-top: 1px solid #94a3b8; padding-top: 8px; text-align: center; font-size: 12px; }
          .sig-img { max-height: 60px; max-width: 180px; object-fit: contain; margin-bottom: 4px; }
          .terms { font-size: 11px; color: #64748b; margin-top: 25px; line-height: 1.4; border-top: 1px dashed #cbd5e1; padding-top: 15px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">VALE DE SALIDA Y PRÉSTAMO TEMPORAL DE HARDWARE</div>
            <div style="font-size: 12px; color: #64748b;">Grupo Petroil — Dirección de Tecnologías de la Información</div>
          </div>
          <span class="folio">${loan.folio}</span>
        </div>

        <div class="grid">
          <div class="card">
            <div class="card-title">Datos del Activo Prestado</div>
            <div><strong>Placa / Tag:</strong> ${asset?.assetTag || 'N/A'}</div>
            <div><strong>Equipo:</strong> ${asset?.brand} ${asset?.model}</div>
            <div><strong>Número de Serie:</strong> ${asset?.serialNumber}</div>
            <div><strong>Condición al Salir:</strong> ${loan.conditionOnCheckout.toUpperCase()}</div>
          </div>

          <div class="card">
            <div class="card-title">Datos del Colaborador Solicitante</div>
            <div><strong>Nombre:</strong> ${emp?.fullName || 'N/A'}</div>
            <div><strong>No. Nómina:</strong> ${emp?.employeeNumber || 'N/A'}</div>
            <div><strong>Puesto:</strong> ${emp?.position || 'N/A'}</div>
            <div><strong>Departamento:</strong> ${emp?.department || 'N/A'}</div>
          </div>
        </div>

        <div class="card" style="margin-bottom: 20px;">
          <div class="card-title">Período y Finalidad del Préstamo</div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 13px;">
            <div><strong>Fecha de Salida:</strong> ${formatDate(loan.startDate)}</div>
            <div><strong>Fecha Estimada de Devolución:</strong> ${formatDate(loan.expectedReturnDate)}</div>
          </div>
          <div style="font-size: 13px; margin-top: 8px;"><strong>Motivo:</strong> ${loan.purposeDescription}</div>
          ${loan.deliveryNotes ? `<div style="font-size: 12px; color: #475569; margin-top: 4px;"><strong>Notas:</strong> ${loan.deliveryNotes}</div>` : ''}
        </div>

        <div class="accessories">
          <strong>Accesorios y Periféricos Incluidos en el Préstamo:</strong>
          <ul style="margin: 6px 0 0 20px;">
            ${loan.accessoriesIncluded.map(a => `<li>${a}</li>`).join('')}
          </ul>
        </div>

        <div class="terms">
          <strong>Cláusula de Responsabilidad:</strong> El solicitante asume la guarda y custodia del equipo aquí descrito, comprometiéndose a destinarlo exclusivamente para actividades laborales de Grupo Petroil y devolverlo en la fecha indicada en las mismas condiciones en que fue recibido. Cualquier daño por negligencia o extravío deberá reportarse inmediatamente al área de TI.
        </div>

        <div class="signatures">
          <div class="sig-box">
            ${loan.employeeSignatureCheckout 
              ? `<img src="${loan.employeeSignatureCheckout}" class="sig-img" alt="Firma Colaborador"/><br/>` 
              : '<div style="height: 50px;"></div>'}
            <strong>${emp?.fullName || 'Colaborador Solicitante'}</strong><br/>
            Firma de Recibido en Conformidad
          </div>

          <div class="sig-box">
            <div style="height: 50px; padding-top: 25px; color: #047857; font-weight: bold; font-size: 11px;">✓ AUTORIZADO POR TI</div>
            <strong>${loan.technicianOutName}</strong><br/>
            Personal de TI Entrega
          </div>
        </div>

        <script>
          window.print();
        </script>
      </body>
      </html>
    `);
    printWin.document.close();
  };

  const handleAddAccessory = () => {
    if (newAccessoryInput.trim() && !accessories.includes(newAccessoryInput.trim())) {
      setAccessories([...accessories, newAccessoryInput.trim()]);
      setNewAccessoryInput('');
    }
  };

  const handleRemoveAccessory = (acc: string) => {
    setAccessories(accessories.filter(a => a !== acc));
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full">
              Gestión de Salidas Provisionales
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500">Mesa de Préstamos TI</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Préstamos Temporales de Hardware
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Control de equipos y periféricos prestados temporalmente por viajes, guardias, capacitaciones o eventos.
          </p>
        </div>

        <button
          onClick={() => setShowNewLoanModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Préstamo de Equipo</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Activos en Préstamo</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Repeat className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">{activeCount}</div>
          <div className="text-xs text-slate-500 mt-1">Equipos fuera de almacén</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">Préstamos Vencidos</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-rose-600 mt-2">{overdueCount}</div>
          <div className="text-xs text-slate-500 mt-1">Superaron fecha de devolución</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Devueltos Exitosos</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-700 mt-2">{returnedCount}</div>
          <div className="text-xs text-slate-500 mt-1">Reincorporados al almacén</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Equipos Disponibles</span>
            <div className="p-2 bg-slate-100 text-slate-700 rounded-xl">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">{availableAssets.length}</div>
          <div className="text-xs text-slate-500 mt-1">Listos para ser prestados</div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por folio, colaborador, placa, modelo..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>

        {/* Status segmented filters */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
          <button
            onClick={() => setStatusFilter('todos')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              statusFilter === 'todos' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            Todos ({loans.length})
          </button>
          <button
            onClick={() => setStatusFilter('activo')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              statusFilter === 'activo' ? 'bg-white text-indigo-700 shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            Activos ({activeCount})
          </button>
          <button
            onClick={() => setStatusFilter('vencido')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              statusFilter === 'vencido' ? 'bg-white text-rose-700 shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            Vencidos ({overdueCount})
          </button>
          <button
            onClick={() => setStatusFilter('devuelto')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              statusFilter === 'devuelto' ? 'bg-white text-emerald-700 shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            Devueltos ({returnedCount})
          </button>
        </div>
      </div>

      {/* Loans Table / List */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {filteredLoans.length === 0 ? (
          <div className="text-center py-12 p-6">
            <Repeat className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-700">No se encontraron préstamos</h3>
            <p className="text-xs text-slate-400 mt-1">Ajuste los filtros o registre un nuevo préstamo temporal.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Folio & Activo</th>
                  <th className="py-3.5 px-4">Colaborador Solicitante</th>
                  <th className="py-3.5 px-4">Motivo / Destino</th>
                  <th className="py-3.5 px-4">Período de Salida</th>
                  <th className="py-3.5 px-4">Estado & Semáforo</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredLoans.map((loan) => {
                  const asset = assets.find(a => a.id === loan.assetId);
                  const emp = employees.find(e => e.id === loan.employeeId);
                  const timing = getLoanTiming(loan.expectedReturnDate, loan.actualReturnDate, loan.status);

                  return (
                    <tr key={loan.id} className="hover:bg-slate-50/70 transition-colors group">
                      {/* Folio & Asset */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-xl bg-slate-100 text-slate-700 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                            <Laptop className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-slate-900 text-xs">
                                {loan.folio}
                              </span>
                              <span className="font-mono text-[11px] text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded font-semibold">
                                {asset?.assetTag || 'EQ-DESCONOCIDO'}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-500 truncate block max-w-[180px]">
                              {asset ? `${asset.brand} ${asset.model}` : 'Equipo de préstamo'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Employee */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center font-bold text-[11px] text-slate-700 shrink-0">
                            {emp?.fullName ? emp.fullName.charAt(0) : 'U'}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800">{emp?.fullName || 'Personal'}</div>
                            <div className="text-[10px] text-slate-400">{emp?.department || 'Área'}</div>
                          </div>
                        </div>
                      </td>

                      {/* Purpose */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <span className="font-medium text-slate-800 block truncate" title={loan.purposeDescription}>
                          {loan.purposeDescription}
                        </span>
                        <span className="text-[10px] text-slate-400 capitalize">
                          {loan.purpose.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Dates */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="text-[11px]">
                          <span className="text-slate-400">Salida:</span> {formatDate(loan.startDate)}
                        </div>
                        <div className="text-[11px]">
                          <span className="text-slate-400">Límite:</span> {formatDate(loan.expectedReturnDate)}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1 items-start">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            loan.status === 'devuelto'
                              ? 'bg-emerald-100 text-emerald-800'
                              : timing.isOverdue
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-indigo-100 text-indigo-800'
                          }`}>
                            {loan.status === 'devuelto' ? 'Devuelto' : timing.isOverdue ? 'Vencido' : 'En Préstamo'}
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${timing.className}`}>
                            {timing.label}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Print PDF slip */}
                          <button
                            onClick={() => handlePrintLoanReceipt(loan)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer transition-colors"
                            title="Imprimir Vale de Salida / Préstamo en PDF"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {/* Security & BitLocker Remote Lock if asset found */}
                          {asset && (
                            <button
                              onClick={() => setSecurityModalAsset(asset)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
                              title="Seguridad Remota: Bloqueo BitLocker / Pantalla"
                            >
                              <ShieldAlert className="w-4 h-4" />
                            </button>
                          )}

                          {/* Return Action if active or overdue */}
                          {loan.status !== 'devuelto' && loan.status !== 'cancelado' && (
                            <button
                              onClick={() => {
                                setReturningLoan(loan);
                                setConditionOnReturn(loan.conditionOnCheckout);
                              }}
                              className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
                            >
                              Devolver
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: NUEVO PRÉSTAMO DE EQUIPO */}
      {showNewLoanModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-300">
                  <Repeat className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Registrar Nuevo Préstamo de Equipo</h3>
                  <p className="text-xs text-slate-400">Salida provisional con asignación temporal y firma</p>
                </div>
              </div>
              <button 
                onClick={() => setShowNewLoanModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateLoanSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
              {/* Asset & Employee Pickers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Equipo de Almacén a Prestar *
                  </label>
                  <select
                    value={selectedAssetId}
                    onChange={(e) => setSelectedAssetId(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="">-- Seleccionar Equipo Disponible --</option>
                    {availableAssets.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.assetTag} - {a.brand} {a.model} ({a.category})
                      </option>
                    ))}
                  </select>
                  {availableAssets.length === 0 && (
                    <span className="text-[11px] text-amber-600 mt-1 block">
                      No hay equipos en almacén con estado disponible.
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Colaborador Receptor (Solicitante) *
                  </label>
                  <select
                    value={selectedEmployeeId}
                    onChange={(e) => setSelectedEmployeeId(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="">-- Seleccionar Colaborador --</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.fullName} ({emp.department} - {emp.position})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dates & Purpose */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Fecha de Salida:
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Fecha Prevista Devolución:
                  </label>
                  <input
                    type="date"
                    value={expectedReturnDate}
                    onChange={(e) => setExpectedReturnDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Motivo / Tipo de Salida:
                  </label>
                  <select
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="viaje_trabajo">Viaje de Trabajo / Comisión</option>
                    <option value="capacitacion">Capacitación / Congreso</option>
                    <option value="reparacion_temporal">Préstamo por Reparación</option>
                    <option value="guardia">Guardia Técnica / Soporte</option>
                    <option value="evento_corporativo">Evento Corporativo</option>
                    <option value="otro">Otro Motivo</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Descripción o Destino de la Comisión:
                </label>
                <input
                  type="text"
                  value={purposeDescription}
                  onChange={(e) => setPurposeDescription(e.target.value)}
                  placeholder="Ej. Auditoría técnica en Planta Mazatlán, sustituto provisional..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* Accessories Checklist */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Accesorios y Periféricos Entregados:
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {accessories.map((acc) => (
                    <span 
                      key={acc} 
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs"
                    >
                      <span>{acc}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAccessory(acc)}
                        className="text-slate-400 hover:text-rose-600 ml-1 cursor-pointer"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newAccessoryInput}
                    onChange={(e) => setNewAccessoryInput(e.target.value)}
                    placeholder="Agregar accesorio (ej. Adaptador HDMI, Candado...)"
                    className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddAccessory}
                    className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
                  >
                    + Agregar
                  </button>
                </div>
              </div>

              {/* Condition & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Condición Física al Entregar:
                  </label>
                  <select
                    value={conditionOnCheckout}
                    onChange={(e) => setConditionOnCheckout(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="excelente">Excelente (Sin detalles)</option>
                    <option value="bueno">Bueno (Desgaste menor normal)</option>
                    <option value="regular">Regular (Marcas visibles)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Técnico Responsable que Entrega:
                  </label>
                  <input
                    type="text"
                    value={currentUser.name}
                    readOnly
                    className="w-full px-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-medium"
                  />
                </div>
              </div>

              {/* Digital Signature */}
              <div className="border border-slate-200 rounded-xl p-3.5 space-y-2 bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800 text-xs flex items-center gap-1.5">
                    <PenTool className="w-3.5 h-3.5 text-indigo-600" />
                    Firma Digital del Colaborador Receptor (Opcional):
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowSignaturePad(!showSignaturePad)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                  >
                    {showSignaturePad ? 'Cerrar Panel' : employeeSignature ? 'Modificar Firma' : '+ Capturar Firma'}
                  </button>
                </div>

                {employeeSignature && !showSignaturePad && (
                  <div className="p-2 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img src={employeeSignature} alt="Firma" className="h-8 max-w-[120px] object-contain" />
                      <span className="text-[11px] text-emerald-700 font-semibold">✓ Firma capturada</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEmployeeSignature(null)}
                      className="text-xs text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      Eliminar
                    </button>
                  </div>
                )}

                {showSignaturePad && (
                  <div className="mt-2">
                    <DigitalSignaturePad
                      signerRole="employee"
                      signerName={employees.find(e => e.id === selectedEmployeeId)?.fullName || 'Colaborador'}
                      onSaveSignature={(dataUrl: string) => {
                        setEmployeeSignature(dataUrl);
                        setShowSignaturePad(false);
                      }}
                      onCancel={() => setShowSignaturePad(false)}
                    />
                  </div>
                )}
              </div>

              {/* Modal Buttons */}
              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewLoanModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-xl border border-slate-300 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!selectedAssetId || !selectedEmployeeId}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  Registrar Salida y Generar Vale
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REGISTRAR DEVOLUCIÓN DE PRÉSTAMO */}
      {returningLoan && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95">
            <div className="p-5 bg-emerald-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-800 text-emerald-200">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Recepción y Devolución de Equipo</h3>
                  <span className="font-mono text-xs text-emerald-300 font-bold">{returningLoan.folio}</span>
                </div>
              </div>
              <button 
                onClick={() => setReturningLoan(null)}
                className="p-1.5 text-emerald-300 hover:text-white rounded-lg hover:bg-emerald-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReturnSubmit} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Activo a Reincorporar:
                </span>
                <span className="font-bold text-slate-900 text-sm">
                  {assets.find(a => a.id === returningLoan.assetId)?.brand} {assets.find(a => a.id === returningLoan.assetId)?.model}
                </span>
                <div className="text-[11px] text-slate-500">
                  Colaborador que devuelve: <strong>{employees.find(e => e.id === returningLoan.employeeId)?.fullName}</strong>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Condición Física al Recibir en Almacén:
                </label>
                <select
                  value={conditionOnReturn}
                  onChange={(e) => setConditionOnReturn(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
                >
                  <option value="excelente">Excelente (Sin daños)</option>
                  <option value="bueno">Bueno (Operativo con desgaste normal)</option>
                  <option value="regular">Regular (Requiere mantenimiento preventivo)</option>
                  <option value="dañado">Dañado (Requiere reparación técnica)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Observaciones de Entrega / Checklist de Accesorios:
                </label>
                <textarea
                  rows={3}
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  placeholder="Se reciben cargador, cables y mochila completos. Equipo enciende correctamente..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                />
              </div>

              {/* Digital Signature on Return */}
              <div className="border border-slate-200 rounded-xl p-3.5 space-y-2 bg-slate-50">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800 text-xs flex items-center gap-1.5">
                    <PenTool className="w-3.5 h-3.5 text-emerald-600" />
                    Firma de Devolución del Colaborador (Opcional):
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowReturnSignaturePad(!showReturnSignaturePad)}
                    className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold cursor-pointer"
                  >
                    {showReturnSignaturePad ? 'Cerrar' : returnSignature ? 'Modificar' : '+ Capturar Firma'}
                  </button>
                </div>

                {returnSignature && !showReturnSignaturePad && (
                  <div className="p-2 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                    <img src={returnSignature} alt="Firma" className="h-8 max-w-[120px] object-contain" />
                    <button
                      type="button"
                      onClick={() => setReturnSignature(null)}
                      className="text-xs text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      Eliminar
                    </button>
                  </div>
                )}

                {showReturnSignaturePad && (
                  <div className="mt-2">
                    <DigitalSignaturePad
                      signerRole="employee"
                      signerName={employees.find(e => e.id === returningLoan.employeeId)?.fullName || 'Colaborador'}
                      onSaveSignature={(dataUrl: string) => {
                        setReturnSignature(dataUrl);
                        setShowReturnSignaturePad(false);
                      }}
                      onCancel={() => setShowReturnSignaturePad(false)}
                    />
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReturningLoan(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-xl border border-slate-300 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Confirmar Devolución & Reincorporar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REMOTE SECURITY & BITLOCKER MODAL */}
      {securityModalAsset && (
        <RemoteSecurityModal
          asset={securityModalAsset}
          onClose={() => setSecurityModalAsset(null)}
        />
      )}

    </div>
  );
};
