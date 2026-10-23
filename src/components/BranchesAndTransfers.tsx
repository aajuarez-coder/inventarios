import React, { useState } from 'react';
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
  Check
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

  // Transfer form
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>(
    preselectedAsset ? [preselectedAsset.id] : []
  );
  const [sourceBranchId, setSourceBranchId] = useState(preselectedAsset?.branchId || branches[0]?.id || '');
  const [targetBranchId, setTargetBranchId] = useState(branches[1]?.id || '');
  const [carrier, setCarrier] = useState('Estafeta Express Terrestre');
  const [trackingNumber, setTrackingNumber] = useState(`EST-${Math.floor(100000000 + Math.random() * 900000000)}-MX`);
  const [estimatedArrival, setEstimatedArrival] = useState('2026-10-21');
  const [transferNotes, setTransferNotes] = useState('Traslado de equipo embalado con protección anti-impacto.');

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

  const availableSourceAssets = assets.filter(a => a.branchId === sourceBranchId && a.status !== 'baja');

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
            onClick={() => setShowNewTransferModal(true)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shadow-sm shadow-indigo-200 flex items-center gap-2"
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
                  <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Origen:</span>
                      <strong className="text-slate-900 block truncate">{src?.city || 'Sede Origen'}</strong>
                      <span className="text-[11px] text-slate-500">{src?.name}</span>
                    </div>

                    <ArrowRight className="w-5 h-5 text-indigo-400 shrink-0 mx-2" />

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Destino:</span>
                      <strong className="text-slate-900 block truncate">{dst?.city || 'Sede Destino'}</strong>
                      <span className="text-[11px] text-slate-500">{dst?.name}</span>
                    </div>
                  </div>

                  {/* Logistics info */}
                  <div className="text-xs space-y-1 text-slate-600">
                    <p>Paquetería: <strong className="text-slate-800">{trf.carrier}</strong></p>
                    <p className="font-mono">Guía de rastreo: <strong className="text-indigo-900">{trf.trackingNumber}</strong></p>
                    <p>Fecha de despacho: {formatDate(trf.shipmentDate)} • Estimado arribo: {formatDate(trf.estimatedArrival)}</p>
                    {trf.actualArrival && (
                      <p className="text-emerald-700 font-medium">Recibido el {formatDate(trf.actualArrival)} por {trf.receivedBy}</p>
                    )}
                  </div>

                  {/* Assets list */}
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Equipos en el Envío ({transferAssets.length}):
                    </span>
                    <div className="space-y-1">
                      {transferAssets.map(a => (
                        <div key={a.id} className="text-[11px] font-mono text-slate-700 flex items-center justify-between">
                          <span>[{a.assetTag}] {a.brand} {a.model}</span>
                          <span className="text-slate-400">S/N: {a.serialNumber}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action */}
                  {isInFlight && (
                    <div className="pt-2">
                      <button
                        onClick={() => setReceivingTransfer(trf)}
                        className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Confirmar Arribo a Almacén Destino
                      </button>
                    </div>
                  )}

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

      {/* New Transfer Modal */}
      {showNewTransferModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-sm">Nuevo Traslado de Equipos entre Sucursales</h3>
              </div>
              <button onClick={() => setShowNewTransferModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTransferSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Sucursal Origen *</label>
                  <select
                    value={sourceBranchId}
                    onChange={(e) => setSourceBranchId(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white outline-hidden"
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name} ({b.city})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Sucursal Destino *</label>
                  <select
                    value={targetBranchId}
                    onChange={(e) => setTargetBranchId(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white outline-hidden"
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name} ({b.city})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Asset picker */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Seleccionar Equipo(s) a Enviar:
                </label>
                <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-lg p-2 space-y-1 bg-slate-50">
                  {availableSourceAssets.length === 0 ? (
                    <p className="text-slate-400 text-[11px] p-2">No hay equipos en la sucursal de origen.</p>
                  ) : (
                    availableSourceAssets.map(a => (
                      <label key={a.id} className="flex items-center gap-2 text-slate-700 p-1.5 hover:bg-white rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedAssetIds.includes(a.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedAssetIds([...selectedAssetIds, a.id]);
                            } else {
                              setSelectedAssetIds(selectedAssetIds.filter(id => id !== a.id));
                            }
                          }}
                          className="rounded text-indigo-600"
                        />
                        <span className="font-mono font-bold text-indigo-700">[{a.assetTag}]</span>
                        <span>{a.brand} {a.model} - S/N: {a.serialNumber}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Empresa de Transporte / Paquetería</label>
                  <input
                    type="text"
                    value={carrier}
                    onChange={(e) => setCarrier(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Número de Guía</label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Fecha Estimada de Llegada</label>
                <input
                  type="date"
                  value={estimatedArrival}
                  onChange={(e) => setEstimatedArrival(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowNewTransferModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                >
                  Confirmar y Generar Folio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                <label className="font-semibold text-slate-700 block mb-1">Nombre de quien recibe:</label>
                <input
                  type="text"
                  value={receivedByName}
                  onChange={(e) => setReceivedByName(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg outline-hidden"
                />
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
