import React, { useState, useEffect } from 'react';
import { useInventory } from '../context/InventoryContext';
import { Branch, Transfer, HardwareAsset } from '../types/inventory';
import { 
  Building2, 
  Truck, 
  Plus, 
  MapPin, 
  Phone, 
  User, 
  Package, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  Search, 
  X,
  FileText,
  Edit3,
  Trash2,
  AlertTriangle,
  Check,
  Printer
} from 'lucide-react';
import { formatDate } from '../utils/formatters';

interface BranchesAndTransfersProps {
  preselectedAsset?: HardwareAsset | null;
  onOpenMap?: (branchId: string) => void;
}

export const BranchesAndTransfers: React.FC<BranchesAndTransfersProps> = ({ 
  preselectedAsset,
  onOpenMap 
}) => {
  const { 
    branches, 
    transfers, 
    assets, 
    employees,
    companies,
    createTransfer, 
    confirmTransferArrival, 
    addBranch, 
    updateBranch,
    deleteBranch,
    currentUser,
    canEdit
  } = useInventory();

  const [activeSubTab, setActiveSubTab] = useState<'transfers' | 'branches'>('transfers');
  const [showNewTransferModal, setShowNewTransferModal] = useState(Boolean(preselectedAsset));
  const [showNewBranchModal, setShowNewBranchModal] = useState(false);
  const [receivingTransfer, setReceivingTransfer] = useState<Transfer | null>(null);
  const [receivedByName, setReceivedByName] = useState(currentUser.name);

  // Edit & Delete state for Branches
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [branchToDelete, setBranchToDelete] = useState<Branch | null>(null);
  const [branchActionFeedback, setBranchActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [editBranchForm, setEditBranchForm] = useState<Branch>({
    id: '',
    code: '',
    name: '',
    city: '',
    state: '',
    address: '',
    phone: '',
    managerName: '',
    isMainWarehouse: false,
    latitude: 19.4270,
    longitude: -99.1677
  });

  const [selectedTransferForView, setSelectedTransferForView] = useState<Transfer | null>(null);

  // Transfer form
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>(
    preselectedAsset ? [preselectedAsset.id] : []
  );
  const [sourceBranchId, setSourceBranchId] = useState(preselectedAsset?.branchId || branches[0]?.id || '');
  const [targetBranchId, setTargetBranchId] = useState(
    branches.find(b => b.id !== (preselectedAsset?.branchId || branches[0]?.id))?.id || branches[1]?.id || ''
  );
  const [carrier, setCarrier] = useState('Estafeta Express Terrestre');
  const [trackingNumber, setTrackingNumber] = useState(`EST-${Math.floor(100000000 + Math.random() * 900000000)}-MX`);
  const [estimatedArrival, setEstimatedArrival] = useState('2026-10-21');
  const [transferNotes, setTransferNotes] = useState('Traslado de equipo embalado con protección anti-impacto.');

  // Ensure sourceBranchId and targetBranchId always point to valid registered branches dadas de alta
  useEffect(() => {
    if (branches.length > 0) {
      if (!sourceBranchId || !branches.some(b => b.id === sourceBranchId)) {
        const initialSrc = preselectedAsset?.branchId && branches.some(b => b.id === preselectedAsset.branchId)
          ? preselectedAsset.branchId
          : branches[0]?.id || '';
        setSourceBranchId(initialSrc);
      }
      if (!targetBranchId || !branches.some(b => b.id === targetBranchId) || (targetBranchId === sourceBranchId && branches.length > 1)) {
        const nextTarget = branches.find(b => b.id !== sourceBranchId) || branches[0];
        if (nextTarget && nextTarget.id !== targetBranchId) {
          setTargetBranchId(nextTarget.id);
        }
      }
    }
  }, [branches, preselectedAsset, sourceBranchId]);

  const sourceBranch = branches.find(b => b.id === sourceBranchId);
  const targetBranch = branches.find(b => b.id === targetBranchId);

  const handleOpenNewTransferModal = () => {
    const initialSrc = preselectedAsset?.branchId && branches.some(b => b.id === preselectedAsset.branchId)
      ? preselectedAsset.branchId
      : (sourceBranchId && branches.some(b => b.id === sourceBranchId) ? sourceBranchId : branches[0]?.id || '');
    setSourceBranchId(initialSrc);
    const initialDst = branches.find(b => b.id !== initialSrc)?.id || branches[1]?.id || '';
    setTargetBranchId(initialDst);
    if (preselectedAsset) {
      setSelectedAssetIds([preselectedAsset.id]);
    } else {
      setSelectedAssetIds([]);
    }
    setShowNewTransferModal(true);
  };

  // Branch form
  const [newBranchForm, setNewBranchForm] = useState({
    code: `SUC-0${branches.length + 1}`,
    name: '',
    city: '',
    state: '',
    address: '',
    phone: '+52 (00) 0000-0000',
    managerName: '',
    isMainWarehouse: false,
    latitude: 19.4270,
    longitude: -99.1677
  });

  const [transferAssetSearch, setTransferAssetSearch] = useState('');

  const availableSourceAssets = assets.filter(a => a.branchId === sourceBranchId && a.status !== 'baja');

  const filteredSourceAssets = React.useMemo(() => {
    const q = transferAssetSearch.toLowerCase().trim();
    if (!q) return availableSourceAssets;
    return availableSourceAssets.filter(a =>
      a.assetTag.toLowerCase().includes(q) ||
      a.brand.toLowerCase().includes(q) ||
      a.model.toLowerCase().includes(q) ||
      a.serialNumber.toLowerCase().includes(q) ||
      a.category.toLowerCase().includes(q) ||
      (a.specs?.cpu && a.specs.cpu.toLowerCase().includes(q)) ||
      (a.specs?.ram && a.specs.ram.toLowerCase().includes(q))
    );
  }, [availableSourceAssets, transferAssetSearch]);

  const handleCreateTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedAssetIds.length === 0) {
      alert('Por favor seleccione al menos un equipo para trasladar.');
      return;
    }
    if (sourceBranchId === targetBranchId) {
      alert('La sucursal de origen y destino deben ser distintas.');
      return;
    }

    createTransfer({
      assetIds: selectedAssetIds,
      sourceBranchId,
      targetBranchId,
      shipmentDate: new Date().toISOString().split('T')[0],
      estimatedArrival,
      carrier,
      trackingNumber,
      status: 'en_transito',
      requestedBy: currentUser.name,
      notes: transferNotes
    });

    setShowNewTransferModal(false);
  };

  const handleConfirmArrivalSubmit = () => {
    if (!receivingTransfer) return;
    confirmTransferArrival(receivingTransfer.id, receivedByName || currentUser.name);
    setReceivingTransfer(null);
  };

  const handleCreateBranchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchForm.name || !newBranchForm.city) {
      alert('Por favor complete los campos obligatorios de la sucursal.');
      return;
    }

    addBranch(newBranchForm);
    setShowNewBranchModal(false);
    setBranchActionFeedback({ type: 'success', message: `Sucursal "${newBranchForm.name}" registrada exitosamente.` });
    setTimeout(() => setBranchActionFeedback(null), 3500);
  };

  const handleOpenEditBranch = (branch: Branch) => {
    setEditingBranch(branch);
    setEditBranchForm({
      id: branch.id,
      code: branch.code,
      name: branch.name,
      city: branch.city,
      state: branch.state,
      address: branch.address,
      phone: branch.phone,
      managerName: branch.managerName,
      isMainWarehouse: Boolean(branch.isMainWarehouse),
      latitude: branch.latitude,
      longitude: branch.longitude
    });
  };

  const handleUpdateBranchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editBranchForm.name.trim() || !editBranchForm.city.trim() || !editBranchForm.code.trim()) {
      setBranchActionFeedback({ type: 'error', message: 'Complete los campos obligatorios: Código, Nombre y Ciudad.' });
      setTimeout(() => setBranchActionFeedback(null), 4000);
      return;
    }

    updateBranch(editBranchForm.id, {
      code: editBranchForm.code.trim(),
      name: editBranchForm.name.trim(),
      city: editBranchForm.city.trim(),
      state: editBranchForm.state.trim(),
      address: editBranchForm.address.trim(),
      phone: editBranchForm.phone.trim(),
      managerName: editBranchForm.managerName.trim(),
      isMainWarehouse: editBranchForm.isMainWarehouse,
      latitude: Number(editBranchForm.latitude) || 19.4270,
      longitude: Number(editBranchForm.longitude) || -99.1677
    });

    setEditingBranch(null);
    setBranchActionFeedback({ type: 'success', message: `Sucursal "${editBranchForm.name}" actualizada con éxito.` });
    setTimeout(() => setBranchActionFeedback(null), 3500);
  };

  const handleConfirmDeleteBranch = () => {
    if (!branchToDelete) return;
    const result = deleteBranch(branchToDelete.id);
    if (result.success) {
      setBranchActionFeedback({ type: 'success', message: `Sucursal "${branchToDelete.name}" eliminada del inventario.` });
      setBranchToDelete(null);
      setTimeout(() => setBranchActionFeedback(null), 3500);
    } else {
      setBranchActionFeedback({ type: 'error', message: result.error || 'No fue posible eliminar la sucursal.' });
      setBranchToDelete(null);
      setTimeout(() => setBranchActionFeedback(null), 5500);
    }
  };

  return (
    <div className="space-y-5">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Sucursales & Traslado de Equipos
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Control de inventario por sede geográfica, envíos entre plantas con número de guía y confirmación de recepción.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenNewTransferModal}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shadow-sm shadow-indigo-200 flex items-center gap-2 cursor-pointer"
          >
            <Truck className="w-4 h-4" />
            Despachar Traslado
          </button>
          <button
            onClick={() => setShowNewBranchModal(true)}
            className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors flex items-center gap-2"
          >
            <Building2 className="w-4 h-4" />
            Nueva Sucursal
          </button>
        </div>
      </div>

      {/* Action Feedback Banner */}
      {branchActionFeedback && (
        <div className={`p-4 rounded-xl flex items-center justify-between text-xs font-semibold animate-in fade-in ${
          branchActionFeedback.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
            : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            {branchActionFeedback.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{branchActionFeedback.message}</span>
          </div>
          <button 
            onClick={() => setBranchActionFeedback(null)}
            className="text-slate-400 hover:text-slate-700 ml-3"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2 text-xs font-semibold">
        <button
          onClick={() => setActiveSubTab('transfers')}
          className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
            activeSubTab === 'transfers' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Truck className="w-4 h-4" />
          Traslados & Envíos ({transfers.length})
        </button>
        <button
          onClick={() => setActiveSubTab('branches')}
          className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
            activeSubTab === 'branches' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Sedes & Almacenes ({branches.length})
        </button>
      </div>

      {activeSubTab === 'transfers' ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {transfers.map(trf => {
              const src = branches.find(b => b.id === trf.sourceBranchId);
              const dst = branches.find(b => b.id === trf.targetBranchId);
              const transferAssets = assets.filter(a => trf.assetIds.includes(a.id));
              const isInFlight = trf.status === 'en_transito';

              return (
                <div 
                  key={trf.id}
                  className={`bg-white rounded-xl border p-4 shadow-xs space-y-3 ${
                    isInFlight ? 'border-purple-300 ring-1 ring-purple-100' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="font-mono font-bold text-xs text-indigo-700">{trf.folio}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                      isInFlight ? 'bg-purple-50 text-purple-700 border-purple-200 animate-pulse' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      {isInFlight ? 'En Tránsito' : 'Recibido en Destino'}
                    </span>
                  </div>

                  {/* Route */}
                  <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg text-xs border border-slate-200">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-700 block">Origen:</span>
                      <strong className="text-slate-900 block truncate">{src?.city || 'Sede Origen'}</strong>
                      <span className="text-[11.5px] text-slate-700 font-medium">{src?.name}</span>
                    </div>

                    <ArrowRight className="w-5 h-5 text-[#004a99] shrink-0 mx-2" />

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-700 block">Destino:</span>
                      <strong className="text-slate-900 block truncate">{dst?.city || 'Sede Destino'}</strong>
                      <span className="text-[11.5px] text-slate-700 font-medium">{dst?.name}</span>
                    </div>
                  </div>

                  {/* Logistics info */}
                  <div className="text-xs space-y-1 text-slate-800 font-medium">
                    <p>Paquetería: <strong className="text-slate-900">{trf.carrier}</strong></p>
                    <p className="font-mono">Guía de rastreo: <strong className="text-[#004a99] font-bold">{trf.trackingNumber}</strong></p>
                    <p className="text-slate-700">Fecha de despacho: <strong className="text-slate-900">{formatDate(trf.shipmentDate)}</strong> • Estimado arribo: <strong className="text-slate-900">{formatDate(trf.estimatedArrival)}</strong></p>
                    {trf.actualArrival && (
                      <p className="text-emerald-800 font-bold">Recibido el {formatDate(trf.actualArrival)} por {trf.receivedBy}</p>
                    )}
                  </div>

                  {/* Assets list */}
                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-[10.5px] uppercase font-bold text-slate-800 block mb-1">
                      Equipos en el Envío ({transferAssets.length}):
                    </span>
                    <div className="space-y-1">
                      {transferAssets.map(a => (
                        <div key={a.id} className="text-[11.5px] font-mono text-slate-800 flex items-center justify-between">
                          <span className="font-semibold text-slate-900">[{a.assetTag}] {a.brand} {a.model}</span>
                          <span className="text-slate-700 font-bold">S/N: {a.serialNumber}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedTransferForView(trf)}
                      className="w-full sm:flex-1 py-2 px-3 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-[#004a99]" />
                      Ver Ficha de Traslado
                    </button>
                    {isInFlight && (
                      <button
                        onClick={() => setReceivingTransfer(trf)}
                        className="w-full sm:flex-1 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Confirmar Arribo
                      </button>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Branches catalog */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {branches.map(branch => {
            const branchAssets = assets.filter(a => a.branchId === branch.id && a.status !== 'baja');
            const availableStock = branchAssets.filter(a => a.status === 'disponible').length;
            const assignedCount = branchAssets.filter(a => a.status === 'asignado').length;

            return (
              <div key={branch.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="font-mono text-xs font-bold text-indigo-700">{branch.code}</span>
                    {branch.isMainWarehouse && (
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                        Almacén Central
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 mt-2">{branch.name}</h3>
                  <p className="text-xs text-indigo-600 font-medium">{branch.city}, {branch.state}</p>

                  <div className="mt-2 text-slate-500 text-[11px] space-y-1">
                    <div className="flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>{branch.address}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Responsable: {branch.managerName}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{branch.phone}</span>
                    </div>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Stock Disponible:</span>
                    <strong className="text-emerald-600 font-mono text-sm">{availableStock}</strong>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 block text-[10px]">Total Equipos:</span>
                    <strong className="text-slate-900 font-mono text-sm">{branchAssets.length}</strong>
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  {onOpenMap && (
                    <button
                      onClick={() => onOpenMap(branch.id)}
                      className="w-full py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Localizar en Mapa</span>
                    </button>
                  )}

                  <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => handleOpenEditBranch(branch)}
                      className="py-1.5 px-2 rounded-lg border border-slate-200 bg-white hover:bg-indigo-50 hover:border-indigo-300 text-slate-700 hover:text-indigo-700 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      title="Editar todos los campos de la sucursal"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Editar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setBranchToDelete(branch)}
                      className="py-1.5 px-2 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-300 text-slate-700 hover:text-rose-600 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      title="Eliminar sucursal del sistema"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                      <span>Eliminar</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Ficha de Traslado - Modal de Nuevo Traslado entre Sucursales */}
      {showNewTransferModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Ficha de Traslado de Equipos entre Sucursales</h3>
                  <p className="text-[11px] text-slate-400">Seleccione la sucursal origen y sucursal destino dadas de alta en el sistema</p>
                </div>
              </div>
              <button 
                onClick={() => setShowNewTransferModal(false)} 
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTransferSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
              {/* Origin & Destination Branch Selectors with Registered Branches */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Sucursal Origen */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-800 text-xs sm:text-[13px] flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-[#004a99]" />
                      <span>Sucursal Origen *</span>
                    </label>
                    <span className="text-[10px] text-slate-700 font-bold bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                      {branches.length} dadas de alta
                    </span>
                  </div>
                  
                  <select
                    required
                    value={sourceBranchId}
                    onChange={(e) => {
                      const newSrc = e.target.value;
                      setSourceBranchId(newSrc);
                      setSelectedAssetIds([]);
                      if (targetBranchId === newSrc) {
                        const nextDst = branches.find(b => b.id !== newSrc);
                        if (nextDst) setTargetBranchId(nextDst.id);
                      }
                    }}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl bg-white text-slate-900 font-semibold text-xs focus:ring-2 focus:ring-[#ff8200]/20 focus:border-[#ff8200] outline-hidden cursor-pointer shadow-2xs"
                  >
                    <option value="">-- Seleccionar Sucursal Origen ({branches.length} disponibles) --</option>
                    {branches.map(b => {
                      const comp = companies?.find(c => c.id === b.companyId);
                      return (
                        <option key={b.id} value={b.id}>
                          {b.code ? `[${b.code}] ` : ''}{b.name} — {b.city}{b.state ? `, ${b.state}` : ''} {comp ? `(${comp.name})` : ''} {b.isMainWarehouse ? '★ [Almacén Central]' : ''}
                        </option>
                      );
                    })}
                  </select>

                  {/* Detalle de Sucursal Origen seleccionada */}
                  {sourceBranch ? (
                    <div className="mt-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{sourceBranch.name}</span>
                        {sourceBranch.code && (
                          <span className="font-mono text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-bold">
                            {sourceBranch.code}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                        <span>{sourceBranch.address || `${sourceBranch.city}, ${sourceBranch.state}`}</span>
                      </p>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                        <span>Encargado: <strong className="text-slate-800">{sourceBranch.managerName || 'No asignado'}</strong></span>
                        {sourceBranch.phone && <span>Tel: {sourceBranch.phone}</span>}
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-amber-600 mt-1 font-medium">
                      * Seleccione una sucursal dada de alta como punto de partida
                    </p>
                  )}
                </div>

                {/* Sucursal Destino */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-800 text-xs sm:text-[13px] flex items-center gap-1.5">
                      <Truck className="w-4 h-4 text-emerald-600" />
                      <span>Sucursal Destino *</span>
                    </label>
                    <span className="text-[10px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Recepción de equipos
                    </span>
                  </div>

                  <select
                    required
                    value={targetBranchId}
                    onChange={(e) => setTargetBranchId(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl bg-white text-slate-900 font-semibold text-xs focus:ring-2 focus:ring-[#ff8200]/20 focus:border-[#ff8200] outline-hidden cursor-pointer shadow-2xs"
                  >
                    <option value="">-- Seleccionar Sucursal Destino ({branches.length} disponibles) --</option>
                    {branches.map(b => {
                      const isSource = b.id === sourceBranchId;
                      const comp = companies?.find(c => c.id === b.companyId);
                      return (
                        <option key={b.id} value={b.id} disabled={isSource}>
                          {b.code ? `[${b.code}] ` : ''}{b.name} — {b.city}{b.state ? `, ${b.state}` : ''} {comp ? `(${comp.name})` : ''} {b.isMainWarehouse ? '★ [Almacén Central]' : ''} {isSource ? '(⚠️ Origen seleccionado)' : ''}
                        </option>
                      );
                    })}
                  </select>

                  {/* Detalle de Sucursal Destino seleccionada */}
                  {targetBranch ? (
                    <div className="mt-2 p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-slate-700 space-y-1 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-950">{targetBranch.name}</span>
                        {targetBranch.code && (
                          <span className="font-mono text-[10px] bg-emerald-200/80 text-emerald-900 px-1.5 py-0.5 rounded font-bold">
                            {targetBranch.code}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-emerald-800 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>{targetBranch.address || `${targetBranch.city}, ${targetBranch.state}`}</span>
                      </p>
                      <div className="flex items-center justify-between text-[11px] text-emerald-800 pt-1 border-t border-emerald-200/60">
                        <span>Receptor: <strong className="text-emerald-950">{targetBranch.managerName || 'Encargado Sede'}</strong></span>
                        {targetBranch.phone && <span>Tel: {targetBranch.phone}</span>}
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-amber-600 mt-1 font-medium">
                      * Seleccione una sucursal dada de alta como destino final
                    </p>
                  )}
                </div>
              </div>

              {/* Asset picker with live typeable search filter */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-semibold text-slate-800 block text-xs">
                    Seleccionar Equipo(s) a Enviar desde {sourceBranch ? `"${sourceBranch.name}"` : 'Origen'} *
                  </label>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {selectedAssetIds.length} de {availableSourceAssets.length} seleccionados
                  </span>
                </div>

                {/* Real-time search bar for equipment */}
                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={transferAssetSearch}
                    onChange={(e) => setTransferAssetSearch(e.target.value)}
                    placeholder="Teclee placa, marca, modelo, serie o procesador para buscar..."
                    className="w-full pl-8.5 pr-8 py-1.5 text-xs border border-slate-300 rounded-lg bg-slate-50 focus:bg-white text-slate-900 focus:ring-2 focus:ring-[#ff8200]/20 focus:border-[#ff8200] outline-hidden placeholder:text-slate-400 font-medium"
                  />
                  {transferAssetSearch && (
                    <button
                      type="button"
                      onClick={() => setTransferAssetSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Quick actions for filtered assets */}
                {availableSourceAssets.length > 0 && (
                  <div className="flex items-center justify-between text-[11px] mb-1.5 px-1 text-slate-500">
                    <span>
                      {filteredSourceAssets.length} equipos mostrados {transferAssetSearch ? `(filtrados por "${transferAssetSearch}")` : ''}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const idsToAdd = filteredSourceAssets.map(a => a.id);
                          setSelectedAssetIds(Array.from(new Set([...selectedAssetIds, ...idsToAdd])));
                        }}
                        className="text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                      >
                        Seleccionar filtrados
                      </button>
                      <span>•</span>
                      <button
                        type="button"
                        onClick={() => setSelectedAssetIds([])}
                        className="text-slate-500 hover:text-slate-700 cursor-pointer"
                      >
                        Deseleccionar todos
                      </button>
                    </div>
                  </div>
                )}

                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl p-2 space-y-1 bg-slate-50">
                  {availableSourceAssets.length === 0 ? (
                    <p className="text-slate-500 text-[11px] p-3 text-center">
                      No hay equipos registrados en el inventario de la sucursal de origen seleccionada.
                    </p>
                  ) : filteredSourceAssets.length === 0 ? (
                    <p className="text-slate-500 text-[11px] p-3 text-center">
                      No se encontraron equipos que coincidan con "{transferAssetSearch}".
                    </p>
                  ) : (
                    filteredSourceAssets.map(a => {
                      const isChecked = selectedAssetIds.includes(a.id);
                      return (
                        <label 
                          key={a.id} 
                          className={`flex items-center justify-between text-slate-800 p-2 rounded-lg cursor-pointer transition-colors border ${
                            isChecked ? 'bg-indigo-50 border-indigo-200 text-indigo-950 font-medium' : 'hover:bg-white border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedAssetIds([...selectedAssetIds, a.id]);
                                } else {
                                  setSelectedAssetIds(selectedAssetIds.filter(id => id !== a.id));
                                }
                              }}
                              className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                            />
                            <span className="font-mono font-bold text-xs text-indigo-700 bg-white px-1.5 py-0.5 rounded border border-indigo-100">
                              [{a.assetTag}]
                            </span>
                            <span className="truncate text-xs font-semibold">{a.brand} {a.model}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            <span className="font-mono text-[10.5px] text-slate-500">S/N: {a.serialNumber}</span>
                            <span className="text-[10px] uppercase font-mono px-1 py-0.2 rounded bg-slate-200 text-slate-700">
                              {a.category}
                            </span>
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Carrier & Tracking */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Empresa de Transporte / Paquetería</label>
                  <input
                    type="text"
                    value={carrier}
                    onChange={(e) => setCarrier(e.target.value)}
                    placeholder="Ej. Estafeta, DHL, Transporte Interno Petroil..."
                    className="w-full p-2.5 border border-slate-300 rounded-xl outline-hidden focus:ring-2 focus:ring-[#ff8200]/20 focus:border-[#ff8200]"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Número de Guía</label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-mono outline-hidden focus:ring-2 focus:ring-[#ff8200]/20 focus:border-[#ff8200]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Fecha Estimada de Llegada</label>
                  <input
                    type="date"
                    value={estimatedArrival}
                    onChange={(e) => setEstimatedArrival(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl outline-hidden focus:ring-2 focus:ring-[#ff8200]/20 focus:border-[#ff8200]"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Notas / Motivo del Traslado</label>
                  <input
                    type="text"
                    value={transferNotes}
                    onChange={(e) => setTransferNotes(e.target.value)}
                    placeholder="Ej. Reubicación de personal, reposición de hardware..."
                    className="w-full p-2.5 border border-slate-300 rounded-xl outline-hidden focus:ring-2 focus:ring-[#ff8200]/20 focus:border-[#ff8200]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowNewTransferModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer shadow-sm transition-colors"
                >
                  Confirmar y Generar Folio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable / Viewable Ficha de Traslado Modal */}
      {selectedTransferForView && (() => {
        const trf = selectedTransferForView;
        const src = branches.find(b => b.id === trf.sourceBranchId);
        const dst = branches.find(b => b.id === trf.targetBranchId);
        const transferAssets = assets.filter(a => trf.assetIds.includes(a.id));
        const compSrc = companies?.find(c => c.id === src?.companyId);
        const compDst = companies?.find(c => c.id === dst?.companyId);

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95">
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between no-print">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-400" />
                  <h3 className="font-bold text-sm">Ficha Técnica Oficial de Traslado - {trf.folio}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Imprimir Ficha
                  </button>
                  <button onClick={() => setSelectedTransferForView(null)} className="text-slate-400 hover:text-white cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-800">
                {/* Header institutional */}
                <div className="flex items-center justify-between border-b pb-4 border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#004a99] text-white flex items-center justify-center font-bold text-lg">
                      P
                    </div>
                    <div>
                      <h4 className="font-bold text-base text-slate-900">GRUPO PETROIL • TECNOLOGÍAS DE INFORMACIÓN</h4>
                      <p className="text-xs text-slate-500">Comprobante y Hoja de Despacho de Traslado de Activos</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-base text-[#004a99] block">{trf.folio}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      trf.status === 'en_transito' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      {trf.status === 'en_transito' ? 'En Tránsito' : 'Recibido en Destino'}
                    </span>
                  </div>
                </div>

                {/* Branches Origin and Destination */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#004a99] block">
                      📍 Sucursal de Origen (Despacho)
                    </span>
                    <p className="font-bold text-slate-900 text-sm">{src?.name || 'Sede Origen'}</p>
                    {src?.code && <p className="font-mono text-[11px] text-slate-500">Código: {src.code}</p>}
                    {compSrc && <p className="text-[11px] text-slate-600">Empresa: {compSrc.name}</p>}
                    <p className="text-[11px] text-slate-600">{src?.address || `${src?.city}, ${src?.state}`}</p>
                    <p className="text-[11px] text-slate-700 pt-1 border-t border-slate-200">
                      Encargado: <strong>{src?.managerName || 'No especificado'}</strong> {src?.phone ? `• Tel: ${src.phone}` : ''}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                      🚚 Sucursal de Destino (Recepción)
                    </span>
                    <p className="font-bold text-emerald-950 text-sm">{dst?.name || 'Sede Destino'}</p>
                    {dst?.code && <p className="font-mono text-[11px] text-emerald-800">Código: {dst.code}</p>}
                    {compDst && <p className="text-[11px] text-emerald-800">Empresa: {compDst.name}</p>}
                    <p className="text-[11px] text-emerald-800">{dst?.address || `${dst?.city}, ${dst?.state}`}</p>
                    <p className="text-[11px] text-emerald-900 pt-1 border-t border-emerald-200">
                      Receptor: <strong>{dst?.managerName || 'Encargado Sede'}</strong> {dst?.phone ? `• Tel: ${dst.phone}` : ''}
                    </p>
                  </div>
                </div>

                {/* Logistics */}
                <div className="p-3.5 rounded-xl border border-slate-200 space-y-2 bg-white">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Paquetería:</span>
                      <strong className="text-slate-900">{trf.carrier}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Número de Guía:</span>
                      <strong className="font-mono text-[#004a99]">{trf.trackingNumber}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Fecha de Envío:</span>
                      <strong className="text-slate-900">{formatDate(trf.shipmentDate)}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Estimado Llegada:</span>
                      <strong className="text-slate-900">{formatDate(trf.estimatedArrival)}</strong>
                    </div>
                  </div>
                  {trf.actualArrival && (
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-emerald-800 font-semibold">
                      <span>✓ Recibido el: {formatDate(trf.actualArrival)}</span>
                      <span>Receptor autorizado: {trf.receivedBy}</span>
                    </div>
                  )}
                  {trf.notes && (
                    <p className="text-[11px] text-slate-600 pt-1 italic">
                      Observaciones: {trf.notes}
                    </p>
                  )}
                </div>

                {/* Assets Table */}
                <div>
                  <span className="font-bold text-xs text-slate-900 block mb-2">
                    Equipos Amparados por este Traslado ({transferAssets.length}):
                  </span>
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px]">
                        <tr>
                          <th className="py-2 px-3">Placa / Tag</th>
                          <th className="py-2 px-3">Equipo</th>
                          <th className="py-2 px-3">Serie (S/N)</th>
                          <th className="py-2 px-3">Especificaciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {transferAssets.map(a => (
                          <tr key={a.id} className="hover:bg-slate-50">
                            <td className="py-2 px-3 font-mono font-bold text-[#004a99]">[{a.assetTag}]</td>
                            <td className="py-2 px-3 text-slate-900">{a.brand} {a.model}</td>
                            <td className="py-2 px-3 font-mono text-slate-600">{a.serialNumber}</td>
                            <td className="py-2 px-3 text-slate-500">{a.specs.ram}, {a.specs.storage}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Signatures */}
                <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-200">
                  <div className="text-center space-y-1">
                    <div className="h-14 border-b border-dashed border-slate-300 flex items-end justify-center pb-1 text-slate-400 text-[10px]">
                      {trf.requestedBy || 'Despachado por TI'}
                    </div>
                    <p className="font-bold text-slate-800 text-xs">Firma de Entrega / Despacho</p>
                    <p className="text-[10px] text-slate-500">Sucursal Origen ({src?.name || 'Origen'})</p>
                  </div>
                  <div className="text-center space-y-1">
                    <div className="h-14 border-b border-dashed border-slate-300 flex items-end justify-center pb-1 text-slate-400 text-[10px]">
                      {trf.receivedBy || 'Pendiente de Recepción'}
                    </div>
                    <p className="font-bold text-slate-800 text-xs">Firma de Conformidad / Recepción</p>
                    <p className="text-[10px] text-slate-500">Sucursal Destino ({dst?.name || 'Destino'})</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end no-print">
                <button
                  onClick={() => setSelectedTransferForView(null)}
                  className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold cursor-pointer"
                >
                  Cerrar Ficha
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Confirm Arrival Modal */}
      {receivingTransfer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Confirmar Recepción de Traslado</h3>
              <button onClick={() => setReceivingTransfer(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-600">
                Al confirmar, los equipos ingresarán al almacén disponible de la sucursal destino.
              </p>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Nombre de quien recibe (Colaborador / Encargado):
                </label>
                <input
                  type="text"
                  list="receiving-employees-datalist"
                  placeholder="Teclee nombre o nómina del colaborador receptor..."
                  value={receivedByName}
                  onChange={(e) => setReceivedByName(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl outline-hidden focus:ring-2 focus:ring-[#ff8200]/20 focus:border-[#ff8200] text-xs font-medium"
                />
                <datalist id="receiving-employees-datalist">
                  {employees.map(e => (
                    <option key={e.id} value={e.fullName}>
                      {e.fullName} ({e.position} - {e.department}) [#{e.employeeNumber}]
                    </option>
                  ))}
                </datalist>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  onClick={() => setReceivingTransfer(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmArrivalSubmit}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                >
                  Confirmar y Dar Entrada
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Branch Modal */}
      {showNewBranchModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Registrar Nueva Sucursal / Sede</h3>
              <button onClick={() => setShowNewBranchModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBranchSubmit} className="p-6 space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nombre de la Sucursal *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Planta Química Veracruz"
                  value={newBranchForm.name}
                  onChange={(e) => setNewBranchForm({ ...newBranchForm, name: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Ciudad *</label>
                  <input
                    type="text"
                    required
                    placeholder="Veracruz"
                    value={newBranchForm.city}
                    onChange={(e) => setNewBranchForm({ ...newBranchForm, city: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Estado</label>
                  <input
                    type="text"
                    placeholder="Veracruz"
                    value={newBranchForm.state}
                    onChange={(e) => setNewBranchForm({ ...newBranchForm, state: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Dirección Completa</label>
                <input
                  type="text"
                  placeholder="Zona Portuaria, Calle Principal 10"
                  value={newBranchForm.address}
                  onChange={(e) => setNewBranchForm({ ...newBranchForm, address: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg outline-hidden"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Responsable / Administrador</label>
                <input
                  type="text"
                  placeholder="Ing. Laura Ramos"
                  value={newBranchForm.managerName}
                  onChange={(e) => setNewBranchForm({ ...newBranchForm, managerName: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Latitud GPS</label>
                  <input
                    type="number"
                    step="0.0001"
                    placeholder="19.4270"
                    value={newBranchForm.latitude}
                    onChange={(e) => setNewBranchForm({ ...newBranchForm, latitude: parseFloat(e.target.value) || 19.4270 })}
                    className="w-full p-2 border border-slate-300 rounded-lg outline-hidden font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Longitud GPS</label>
                  <input
                    type="number"
                    step="0.0001"
                    placeholder="-99.1677"
                    value={newBranchForm.longitude}
                    onChange={(e) => setNewBranchForm({ ...newBranchForm, longitude: parseFloat(e.target.value) || -99.1677 })}
                    className="w-full p-2 border border-slate-300 rounded-lg outline-hidden font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowNewBranchModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                >
                  Guardar Sucursal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Branch Modal */}
      {editingBranch && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-sm">Editar Sucursal / Almacén ({editingBranch.code})</h3>
              </div>
              <button onClick={() => setEditingBranch(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateBranchSubmit} className="p-6 space-y-3.5 text-xs overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Código de Sede *</label>
                  <input
                    type="text"
                    required
                    value={editBranchForm.code}
                    onChange={(e) => setEditBranchForm({ ...editBranchForm, code: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg outline-hidden font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Tipo de Sede</label>
                  <label className="flex items-center gap-2 mt-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editBranchForm.isMainWarehouse}
                      onChange={(e) => setEditBranchForm({ ...editBranchForm, isMainWarehouse: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-medium text-slate-700 text-xs">Almacén Central (Hub)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nombre de la Sucursal *</label>
                <input
                  type="text"
                  required
                  value={editBranchForm.name}
                  onChange={(e) => setEditBranchForm({ ...editBranchForm, name: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Ciudad *</label>
                  <input
                    type="text"
                    required
                    value={editBranchForm.city}
                    onChange={(e) => setEditBranchForm({ ...editBranchForm, city: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Estado</label>
                  <input
                    type="text"
                    value={editBranchForm.state}
                    onChange={(e) => setEditBranchForm({ ...editBranchForm, state: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Dirección Completa</label>
                <input
                  type="text"
                  value={editBranchForm.address}
                  onChange={(e) => setEditBranchForm({ ...editBranchForm, address: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Responsable / Encargado</label>
                  <input
                    type="text"
                    value={editBranchForm.managerName}
                    onChange={(e) => setEditBranchForm({ ...editBranchForm, managerName: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Teléfono Institucional</label>
                  <input
                    type="text"
                    value={editBranchForm.phone}
                    onChange={(e) => setEditBranchForm({ ...editBranchForm, phone: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Latitud GPS</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={editBranchForm.latitude}
                    onChange={(e) => setEditBranchForm({ ...editBranchForm, latitude: parseFloat(e.target.value) || 19.4270 })}
                    className="w-full p-2 border border-slate-300 rounded-lg outline-hidden font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Longitud GPS</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={editBranchForm.longitude}
                    onChange={(e) => setEditBranchForm({ ...editBranchForm, longitude: parseFloat(e.target.value) || -99.1677 })}
                    className="w-full p-2 border border-slate-300 rounded-lg outline-hidden font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingBranch(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer shadow-sm shadow-indigo-200"
                >
                  Actualizar Sucursal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Branch Confirmation Dialog */}
      {branchToDelete && (() => {
        const branchAssetsCount = assets.filter(a => a.branchId === branchToDelete.id && a.status !== 'baja').length;
        const branchEmployeesCount = employees.filter(e => e.branchId === branchToDelete.id && e.status !== 'baja').length;
        const hasDependencies = branchAssetsCount > 0 || branchEmployeesCount > 0 || branches.length <= 1;

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
              <div className="p-4 bg-rose-600 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trash2 className="w-5 h-5 text-white" />
                  <h3 className="font-bold text-sm">Eliminar Sucursal / Almacén</h3>
                </div>
                <button onClick={() => setBranchToDelete(null)} className="text-white/80 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs">
                <p className="text-slate-700 text-sm">
                  ¿Está seguro de eliminar permanentemente la sucursal <strong className="text-slate-900">{branchToDelete.name}</strong> ({branchToDelete.code})?
                </p>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5">
                  <div className="flex justify-between text-slate-600">
                    <span>Equipos registrados en esta sede:</span>
                    <strong className={branchAssetsCount > 0 ? 'text-amber-600' : 'text-slate-700'}>{branchAssetsCount}</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Colaboradores asignados a esta sede:</span>
                    <strong className={branchEmployeesCount > 0 ? 'text-amber-600' : 'text-slate-700'}>{branchEmployeesCount}</strong>
                  </div>
                </div>

                {hasDependencies && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Acción con restricciones:</p>
                      <p className="text-[11px] mt-0.5">
                        {branches.length <= 1 
                          ? 'No puede eliminar la única sede activa en el sistema.' 
                          : 'Debe reubicar o transferir primero los equipos y colaboradores adscritos antes de eliminar la sucursal.'}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setBranchToDelete(null)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDeleteBranch}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold cursor-pointer shadow-sm shadow-rose-200"
                  >
                    Confirmar Eliminación
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
};
