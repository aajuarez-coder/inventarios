import React, { useState } from 'react';
import { HardwareAsset, TimelineEvent, PhysicalCondition } from '../types/inventory';
import { useInventory } from '../context/InventoryContext';
import { 
  X, 
  Cpu, 
  HardDrive, 
  Layers, 
  Wifi, 
  Monitor, 
  Calendar, 
  User, 
  Building2, 
  ShieldCheck, 
  ShieldAlert, 
  Wrench, 
  Clock, 
  FileText, 
  Printer, 
  Tag, 
  DollarSign,
  AlertCircle,
  Share2,
  CheckCircle2,
  History,
  MapPin,
  Lock,
  RotateCcw,
  Trash2
} from 'lucide-react';
import { formatCurrency, formatDate, formatDateTime, getWarrantyStatus, getMaintenanceStatus, getStatusBadge, getConditionLabel } from '../utils/formatters';
import { AssetBarcode } from './AssetBarcode';
import { AssetTraceability } from './AssetTraceability';
import { RemoteSecurityModal } from './RemoteSecurityModal';

interface AssetDetailModalProps {
  asset: HardwareAsset;
  onClose: () => void;
  onOpenAssign?: (asset: HardwareAsset) => void;
  onOpenMaintenance?: (asset: HardwareAsset) => void;
  onOpenMap?: (asset: HardwareAsset) => void;
}

export const AssetDetailModal: React.FC<AssetDetailModalProps> = ({
  asset,
  onClose,
  onOpenAssign,
  onOpenMaintenance,
  onOpenMap
}) => {
  const { employees, branches, timeline, assignments, currentUser, retireAsset, returnAsset, deleteAsset, canEdit } = useInventory();
  const [activeTab, setActiveTab] = useState<'specs' | 'timeline' | 'tag'>('specs');
  const [retireReason, setRetireReason] = useState('');
  const [showRetireConfirm, setShowRetireConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnBranchId, setReturnBranchId] = useState(asset.branchId || branches[0]?.id || '');
  const [returnCondition, setReturnCondition] = useState<PhysicalCondition>(asset.physicalCondition || 'bueno');
  const [returnNotes, setReturnNotes] = useState('');

  const employee = employees.find(e => e.id === asset.assignedToEmployeeId);
  const branch = branches.find(b => b.id === asset.branchId);
  const assetTimeline = timeline.filter(t => t.assetId === asset.id);
  const currentAssignment = assignments.find(a => a.assetId === asset.id && a.status === 'activa');

  const warranty = getWarrantyStatus(asset.warrantyEndDate);
  const maintenance = getMaintenanceStatus(asset.nextMaintenanceDate);
  const statusBadge = getStatusBadge(asset.status);
  const condition = getConditionLabel(asset.physicalCondition);

  const handleRetire = () => {
    if (!retireReason.trim()) {
      alert('Por favor ingrese el motivo o dictamen técnico para la baja del equipo.');
      return;
    }
    retireAsset(asset.id, retireReason);
    setShowRetireConfirm(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-300">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm px-2 py-0.5 rounded bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 font-bold">
                  {asset.assetTag}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  S/N: {asset.serialNumber}
                </span>
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight mt-0.5">
                {asset.brand} {asset.model}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${statusBadge.className}`}>
              {statusBadge.label}
            </span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 px-6 bg-slate-50 gap-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('specs')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'specs' 
                ? 'border-indigo-600 text-indigo-600' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Cpu className="w-4 h-4" />
            Especificaciones & Hardware
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'timeline' 
                ? 'border-indigo-600 text-indigo-600' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            Trazabilidad y Línea de Tiempo
          </button>
          <button
            onClick={() => setActiveTab('tag')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'tag' 
                ? 'border-indigo-600 text-indigo-600' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Tag className="w-4 h-4" />
            Placa y Código de Barras
          </button>
        </div>

        {/* Body content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {activeTab === 'specs' && (
            <div className="space-y-6">
              
              {/* Custody and Location highlight banner */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Current assignment */}
                <div className="p-4 rounded-xl border border-slate-300 bg-slate-50 flex items-start gap-3">
                  <div className="p-2.5 rounded-lg bg-blue-100 text-blue-700">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="flex-1 text-xs">
                    <span className="text-[10.5px] uppercase font-bold text-slate-700 tracking-wider">
                      Custodia y Asignación
                    </span>
                    {employee ? (
                      <div className="mt-1">
                        <p className="font-bold text-sm text-slate-900">{employee.fullName}</p>
                        <p className="text-slate-800 font-medium">{employee.position} • {employee.department}</p>
                        <p className="text-slate-700 font-mono text-[11.5px] font-semibold mt-0.5">{employee.email}</p>
                        {currentAssignment && (
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 font-mono text-[10.5px] font-bold">
                              <FileText className="w-3 h-3" />
                              Folio Responsiva: {currentAssignment.folioResponsiva}
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setReturnBranchId(asset.branchId || branches[0]?.id || '');
                                setReturnCondition(asset.physicalCondition || 'bueno');
                                setReturnNotes('');
                                setShowReturnModal(true);
                              }}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-semibold text-[10.5px] cursor-pointer transition-colors"
                              title="Devolver este equipo al almacén"
                            >
                              <RotateCcw className="w-3 h-3 text-amber-600" />
                              <span>Devolver a Almacén</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="mt-1">
                        <p className="font-bold text-slate-900">Disponible en Almacén TI</p>
                        <p className="text-slate-700 font-medium">Sin colaborador asignado en este momento.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Location & Physical Condition */}
                <div className="p-4 rounded-xl border border-slate-300 bg-slate-50 flex items-start gap-3">
                  <div className="p-2.5 rounded-lg bg-indigo-100 text-indigo-700">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div className="flex-1 text-xs">
                    <span className="text-[10.5px] uppercase font-bold text-slate-700 tracking-wider">
                      Ubicación & Estado Físico
                    </span>
                    <p className="font-bold text-sm text-slate-900 mt-1">{branch?.name || 'Sede no especificada'}</p>
                    <p className="text-slate-800 font-medium">{asset.locationDetails || branch?.city}</p>
                    <p className={`font-bold mt-1.5 ${condition.color}`}>
                      Condición: {condition.label}
                    </p>
                  </div>
                </div>

              </div>

              {/* Hardware specifications grid */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-indigo-600" />
                  Ficha Técnica de Hardware
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg border border-slate-200 bg-white">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Procesador (CPU)</span>
                    <p className="text-xs font-medium text-slate-800 mt-0.5">{asset.specs.cpu || 'No especificado'}</p>
                  </div>

                  <div className="p-3 rounded-lg border border-slate-200 bg-white">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Memoria RAM</span>
                    <p className="text-xs font-medium text-slate-800 mt-0.5">{asset.specs.ram || 'No especificado'}</p>
                  </div>

                  <div className="p-3 rounded-lg border border-slate-200 bg-white">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Almacenamiento (Disco)</span>
                    <p className="text-xs font-medium text-slate-800 mt-0.5">{asset.specs.storage || 'No especificado'}</p>
                  </div>

                  <div className="p-3 rounded-lg border border-slate-200 bg-white">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Sistema Operativo</span>
                    <p className="text-xs font-medium text-slate-800 mt-0.5">{asset.specs.os || 'No especificado'}</p>
                  </div>

                  <div className="p-3 rounded-lg border border-slate-200 bg-white">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Pantalla / Gráficos</span>
                    <p className="text-xs font-medium text-slate-800 mt-0.5">
                      {asset.specs.screenSize ? `${asset.specs.screenSize}` : (asset.specs.gpu || 'Integrado')}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg border border-slate-200 bg-white">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Dirección MAC / Red</span>
                    <p className="text-xs font-mono font-medium text-slate-800 mt-0.5">{asset.specs.macAddress || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Maintenance & Warranty status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Warranty status card */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-indigo-600" />
                      Garantía del Fabricante
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${warranty.badgeClass}`}>
                      {warranty.label}
                    </span>
                  </div>
                  <div className="text-xs space-y-1 text-slate-600">
                    <p>Fecha fin de póliza: <strong className="text-slate-800">{formatDate(asset.warrantyEndDate)}</strong></p>
                    <p>Proveedor autorizado: <span className="text-slate-800">{asset.supplier}</span></p>
                    <p>Factura de compra: <span className="font-mono text-slate-700">{asset.invoiceNumber}</span></p>
                  </div>
                </div>

                {/* Maintenance status card */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <Wrench className="w-4 h-4 text-amber-600" />
                      Mantenimiento Preventivo
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${maintenance.badgeClass}`}>
                      {maintenance.label}
                    </span>
                  </div>
                  <div className="text-xs space-y-1 text-slate-600">
                    <p>Próximo servicio: <strong className="text-slate-800">{formatDate(asset.nextMaintenanceDate)}</strong></p>
                    <p>Último servicio realizado: <span className="text-slate-800">{formatDate(asset.lastMaintenanceDate) || 'Sin registro previo'}</span></p>
                    <p>Frecuencia periódica: Cada {asset.maintenanceIntervalMonths || 6} meses</p>
                  </div>
                </div>

              </div>

              {/* Accessories delivered */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Accesorios y Periféricos Vinculados
                </h4>
                <div className="flex flex-wrap gap-2">
                  {asset.accessoriesIncluded && asset.accessoriesIncluded.length > 0 ? (
                    asset.accessoriesIncluded.map((acc, idx) => (
                      <span key={idx} className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        {acc}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400">Sin accesorios registrados.</span>
                  )}
                </div>
              </div>

              {/* Notes */}
              {asset.notes && (
                <div className="p-3 rounded-lg bg-amber-50/60 border border-amber-200/80 text-xs text-amber-900">
                  <span className="font-bold block mb-0.5">Observaciones Técnicas:</span>
                  {asset.notes}
                </div>
              )}

            </div>
          )}

          {activeTab === 'timeline' && (
            <AssetTraceability 
              asset={asset} 
            />
          )}

          {activeTab === 'tag' && (
            <div className="max-w-md mx-auto py-4 space-y-4">
              <p className="text-xs text-slate-500 text-center">
                Etiqueta oficial de activo fijo con código de barras y QR para identificación física en chasis.
              </p>
              <AssetBarcode asset={asset} />
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {asset.status !== 'baja' && currentUser.role === 'admin_ti' && (
              <button
                onClick={() => setShowRetireConfirm(true)}
                className="text-xs text-rose-600 hover:text-rose-700 font-medium px-2 py-1 rounded hover:bg-rose-50 cursor-pointer"
              >
                Dar de Baja Definitiva
              </button>
            )}

            {(asset.status === 'baja' || asset.physicalCondition === 'obsoleto') && canEdit && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Eliminar permanentemente este equipo del inventario"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Eliminar Equipo (Baja / Obsoleto)</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {asset.status === 'disponible' && onOpenAssign && (
              <button
                onClick={() => { onClose(); onOpenAssign(asset); }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shadow-xs"
              >
                Asignar a Colaborador
              </button>
            )}

            {onOpenMaintenance && (
              <button
                onClick={() => { onClose(); onOpenMaintenance(asset); }}
                className="px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors"
              >
                Registrar Mantenimiento
              </button>
            )}

            {onOpenMap && (
              <button
                onClick={() => { onClose(); onOpenMap(asset); }}
                className="px-3.5 py-2 rounded-xl bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Ver en Mapa</span>
              </button>
            )}

            <button
              onClick={() => setShowSecurityModal(true)}
              className="px-3.5 py-2 rounded-xl bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Bloqueo BitLocker, Bloqueo de Pantalla y Envío de Avisos Emergentes"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Bloqueo BitLocker & Remoto</span>
            </button>

            {asset.status === 'asignado' && (
              <button
                type="button"
                onClick={() => {
                  setReturnBranchId(asset.branchId || branches[0]?.id || '');
                  setReturnCondition(asset.physicalCondition || 'bueno');
                  setReturnNotes('');
                  setShowReturnModal(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Devolver equipo al almacén"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Devolver a Almacén</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-xs transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>

      </div>

      {/* Remote Security & BitLocker Modal */}
      {showSecurityModal && (
        <RemoteSecurityModal
          asset={asset}
          onClose={() => setShowSecurityModal(false)}
        />
      )}

      {/* Return to Warehouse Modal */}
      {showReturnModal && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-amber-600">
                <RotateCcw className="w-5 h-5" />
                <h3 className="font-bold text-sm text-slate-900">Devolver Equipo a Almacén</h3>
              </div>
              <button onClick={() => setShowReturnModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Equipo:</span>
                <span className="font-mono font-bold text-indigo-700">{asset.assetTag} ({asset.brand} {asset.model})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Serie (S/N):</span>
                <span className="font-mono text-slate-700">{asset.serialNumber}</span>
              </div>
              {employee && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Custodio actual:</span>
                  <span className="font-medium text-slate-800">{employee.fullName}</span>
                </div>
              )}
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Almacén o Sede de Destino *
                </label>
                <select
                  value={returnBranchId}
                  onChange={(e) => setReturnBranchId(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-amber-200 outline-hidden font-medium text-xs text-slate-800"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} — {b.city} ({b.state})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Indique en qué almacén físico quedará resguardado el equipo devuelto.
                </p>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Condición Física de Recepción *
                </label>
                <select
                  value={returnCondition}
                  onChange={(e) => setReturnCondition(e.target.value as PhysicalCondition)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-amber-200 outline-hidden font-medium text-xs text-slate-800"
                >
                  <option value="excelente">Excelente - Sin detalles estéticos ni funcionales</option>
                  <option value="bueno">Bueno - Desgaste menor regular</option>
                  <option value="regular">Regular - Marcas, rayones o golpes leves</option>
                  <option value="dañado">Dañado - Requiere revisión o mantenimiento técnico</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Notas de Recepción e Inspección Técnica
                </label>
                <textarea
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  placeholder="Observaciones de entrega: cargador entregado, accesorios, estado de batería, formato de disco..."
                  rows={3}
                  className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-200 outline-hidden text-xs text-slate-800"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowReturnModal(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  returnAsset(asset.id, returnCondition, returnNotes, returnBranchId);
                  setShowReturnModal(false);
                  onClose();
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-xs cursor-pointer"
              >
                Confirmar Devolución al Almacén
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Retire confirmation modal */}
      {showRetireConfirm && (
        <div className="fixed inset-0 z-60 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-5 max-w-md w-full border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-rose-600">
              <AlertCircle className="w-5 h-5" />
              <h3 className="font-bold text-sm">Confirmar Baja del Equipo {asset.assetTag}</h3>
            </div>
            <p className="text-xs text-slate-600">
              Esta acción marcará el equipo como obsoleto o fuera de servicio. Indique el dictamen técnico o motivo formal:
            </p>
            <textarea
              value={retireReason}
              onChange={(e) => setRetireReason(e.target.value)}
              placeholder="Ej: Tarjeta madre con daño irrecuperable por sobretensión, costo de reparación no viable..."
              rows={3}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-rose-200 outline-hidden"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowRetireConfirm(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleRetire}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 cursor-pointer"
              >
                Confirmar Baja
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 rounded-xl bg-rose-100 text-rose-600">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Eliminar Equipo Definitivamente</h3>
                <p className="text-[11px] text-slate-500 font-mono">{asset.assetTag} • {asset.brand} {asset.model}</p>
              </div>
            </div>

            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 space-y-2">
              <p className="font-semibold text-rose-800">
                ¿Confirma que desea eliminar permanentemente este activo?
              </p>
              <p className="text-[11px] text-rose-700">
                El equipo está dictaminado como <strong>{asset.status === 'baja' ? 'Dado de Baja' : ''}{asset.status === 'baja' && asset.physicalCondition === 'obsoleto' ? ' y ' : ''}{asset.physicalCondition === 'obsoleto' ? 'Físicamente Obsoleto' : ''}</strong>. Al proceder, se removerá por completo de la base de datos Firestore y del catálogo de inventario activo.
              </p>
              <div className="pt-1 text-[11px] font-mono text-slate-600">
                S/N: {asset.serialNumber}
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              * Se registrará el evento de baja definitiva en la bitácora de auditoría histórica con la firma del usuario {currentUser.name}.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteAsset(asset.id);
                  setShowDeleteConfirm(false);
                  onClose();
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirmar Eliminación</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
