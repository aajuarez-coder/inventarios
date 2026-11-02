import React, { useState } from 'react';
import { HardwareAsset, PhysicalCondition } from '../types/inventory';
import { useInventory } from '../context/InventoryContext';
import { 
  X, 
  Cpu, 
  Save, 
  HardDrive, 
  Monitor, 
  Wifi, 
  Battery, 
  Tag, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  Sliders
} from 'lucide-react';

interface EditAssetSpecsModalProps {
  asset: HardwareAsset;
  onClose: () => void;
  onSuccess?: (updatedAsset: HardwareAsset) => void;
}

export const EditAssetSpecsModal: React.FC<EditAssetSpecsModalProps> = ({
  asset,
  onClose,
  onSuccess
}) => {
  const { updateAsset } = useInventory();
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // General fields
  const [brand, setBrand] = useState(asset.brand || '');
  const [model, setModel] = useState(asset.model || '');
  const [serialNumber, setSerialNumber] = useState(asset.serialNumber || '');
  const [physicalCondition, setPhysicalCondition] = useState<PhysicalCondition>(asset.physicalCondition || 'bueno');
  const [notes, setNotes] = useState(asset.notes || '');

  // Specs fields
  const [cpu, setCpu] = useState(asset.specs?.cpu || '');
  const [ram, setRam] = useState(asset.specs?.ram || '');
  const [storage, setStorage] = useState(asset.specs?.storage || '');
  const [gpu, setGpu] = useState(asset.specs?.gpu || '');
  const [os, setOs] = useState(asset.specs?.os || '');
  const [screenSize, setScreenSize] = useState(asset.specs?.screenSize || '');
  const [macAddress, setMacAddress] = useState(asset.specs?.macAddress || '');
  const [ipAddress, setIpAddress] = useState(asset.specs?.ipAddress || '');
  const [batteryHealth, setBatteryHealth] = useState(asset.specs?.batteryHealth || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brand.trim() || !model.trim() || !serialNumber.trim()) {
      setFeedback({
        type: 'error',
        message: 'Marca, Modelo y Número de Serie son campos requeridos.'
      });
      return;
    }

    setIsSaving(true);
    try {
      const updatedSpecs = {
        cpu: cpu.trim(),
        ram: ram.trim(),
        storage: storage.trim(),
        gpu: gpu.trim() || undefined,
        os: os.trim(),
        screenSize: screenSize.trim() || undefined,
        macAddress: macAddress.trim() || undefined,
        ipAddress: ipAddress.trim() || undefined,
        batteryHealth: batteryHealth.trim() || undefined
      };

      const updates: Partial<HardwareAsset> = {
        brand: brand.trim(),
        model: model.trim(),
        name: `${brand.trim()} ${model.trim()}`,
        serialNumber: serialNumber.trim(),
        physicalCondition,
        notes: notes.trim(),
        specs: updatedSpecs
      };

      updateAsset(asset.id, updates);

      const fullUpdatedAsset: HardwareAsset = {
        ...asset,
        ...updates,
        specs: updatedSpecs
      };

      setFeedback({
        type: 'success',
        message: `Especificaciones técnicas de ${asset.assetTag} actualizadas correctamente en Firestore.`
      });

      if (onSuccess) {
        onSuccess(fullUpdatedAsset);
      }

      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: `Error al guardar especificaciones: ${err.message || 'Error desconocido'}`
      });
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-300 overflow-hidden animate-in fade-in zoom-in-95 my-auto max-h-[92vh] flex flex-col text-slate-900">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-[#004a99] to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/10 border border-white/20 text-[#ff8200]">
              <Cpu className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-white/20 text-white font-bold">
                  {asset.assetTag}
                </span>
                <span className="text-[11px] text-slate-200 font-mono">
                  S/N: {asset.serialNumber}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight mt-0.5">
                Editar Especificaciones Técnicas
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className={`p-3.5 mx-5 mt-4 rounded-xl border text-xs font-semibold flex items-center gap-2 shrink-0 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}>
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-5 text-xs sm:text-sm">
          
          {/* Section: Identificación Principal */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <span className="font-bold text-slate-800 text-xs uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-[#004a99]" />
              Identificación y Datos del Chasis
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Marca *</label>
                <input
                  type="text"
                  required
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="Ej. Lenovo, Dell, HP, Apple"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium text-slate-900 focus:ring-2 focus:ring-[#ff8200]/20 focus:border-[#ff8200] outline-hidden"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Modelo *</label>
                <input
                  type="text"
                  required
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="Ej. ThinkPad T14s Gen 4"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium text-slate-900 focus:ring-2 focus:ring-[#ff8200]/20 focus:border-[#ff8200] outline-hidden"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Número de Serie (S/N) *</label>
                <input
                  type="text"
                  required
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  placeholder="Ej. PF-4J8K9L"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-mono font-medium text-slate-900 focus:ring-2 focus:ring-[#ff8200]/20 focus:border-[#ff8200] outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Section: Procesador, RAM y GPU */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <span className="font-bold text-slate-800 text-xs uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-[#004a99]" />
              Procesamiento y Rendimiento
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Procesador (CPU)</label>
                <input
                  type="text"
                  value={cpu}
                  onChange={(e) => setCpu(e.target.value)}
                  placeholder="Ej. Intel Core i7-1365U, Apple M3"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium text-slate-900 focus:ring-2 focus:ring-[#ff8200]/20 focus:border-[#ff8200] outline-hidden"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Memoria RAM</label>
                <input
                  type="text"
                  value={ram}
                  onChange={(e) => setRam(e.target.value)}
                  placeholder="Ej. 16 GB DDR5, 32 GB LPDDR5"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium text-slate-900 focus:ring-2 focus:ring-[#ff8200]/20 focus:border-[#ff8200] outline-hidden"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Tarjeta Gráfica (GPU)</label>
                <input
                  type="text"
                  value={gpu}
                  onChange={(e) => setGpu(e.target.value)}
                  placeholder="Ej. Intel Iris Xe, RTX 4060 8GB"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium text-slate-900 focus:ring-2 focus:ring-[#ff8200]/20 focus:border-[#ff8200] outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Section: Almacenamiento, SO y Pantalla */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <span className="font-bold text-slate-800 text-xs uppercase tracking-wider font-mono flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-[#004a99]" />
              Almacenamiento, Sistema Operativo & Pantalla
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Disco / Almacenamiento</label>
                <input
                  type="text"
                  value={storage}
                  onChange={(e) => setStorage(e.target.value)}
                  placeholder="Ej. 512 GB SSD NVMe M.2, 1 TB PCIe"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium text-slate-900 focus:ring-2 focus:ring-[#ff8200]/20 focus:border-[#ff8200] outline-hidden"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Sistema Operativo</label>
                <input
                  type="text"
                  value={os}
                  onChange={(e) => setOs(e.target.value)}
                  placeholder="Ej. Windows 11 Pro 64-bit, macOS 14"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium text-slate-900 focus:ring-2 focus:ring-[#ff8200]/20 focus:border-[#ff8200] outline-hidden"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Pantalla / Dimensiones</label>
                <input
                  type="text"
                  value={screenSize}
                  onChange={(e) => setScreenSize(e.target.value)}
                  placeholder="Ej. 14 pulgadas FHD IPS, 27 4K"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium text-slate-900 focus:ring-2 focus:ring-[#ff8200]/20 focus:border-[#ff8200] outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Section: Red y Batería */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <span className="font-bold text-slate-800 text-xs uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Wifi className="w-3.5 h-3.5 text-[#004a99]" />
              Conectividad & Batería
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Dirección MAC</label>
                <input
                  type="text"
                  value={macAddress}
                  onChange={(e) => setMacAddress(e.target.value.toUpperCase())}
                  placeholder="Ej. 3C:52:82:11:A4:B9"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-mono text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-[#ff8200]/20 focus:border-[#ff8200] outline-hidden"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Dirección IP Asignada</label>
                <input
                  type="text"
                  value={ipAddress}
                  onChange={(e) => setIpAddress(e.target.value)}
                  placeholder="Ej. 192.168.1.150 o DHCP"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-mono text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-[#ff8200]/20 focus:border-[#ff8200] outline-hidden"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Salud de Batería (%)</label>
                <input
                  type="text"
                  value={batteryHealth}
                  onChange={(e) => setBatteryHealth(e.target.value)}
                  placeholder="Ej. 96% (51.2 / 53.5 Wh)"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium text-slate-900 focus:ring-2 focus:ring-[#ff8200]/20 focus:border-[#ff8200] outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Section: Condición Física y Notas */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <span className="font-bold text-slate-800 text-xs uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-[#004a99]" />
              Estado Operativo y Observaciones Técnicas
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Condición Física</label>
                <select
                  value={physicalCondition}
                  onChange={(e) => setPhysicalCondition(e.target.value as PhysicalCondition)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-semibold text-slate-900 focus:ring-2 focus:ring-[#ff8200]/20 focus:border-[#ff8200] outline-hidden cursor-pointer"
                >
                  <option value="excelente">Excelente (Seminuevo / Sin desgaste visible)</option>
                  <option value="bueno">Bueno (Operativo con desgaste menor normal)</option>
                  <option value="regular">Regular (Detalles estéticos o desgaste moderado)</option>
                  <option value="dañado">Dañado (Requiere reparación o reemplazo de partes)</option>
                  <option value="obsoleto">Obsoleto (Fin de ciclo de vida / No apto)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Notas Técnicas / Observaciones</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Historial de actualizaciones, reparaciones previas o peculiaridades de hardware..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium text-slate-900 focus:ring-2 focus:ring-[#ff8200]/20 focus:border-[#ff8200] outline-hidden text-xs"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2.5 rounded-xl text-slate-700 hover:bg-slate-100 font-bold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-[#004a99] hover:bg-[#003875] text-white font-bold transition-colors shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Guardando...' : 'Guardar Especificaciones'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
