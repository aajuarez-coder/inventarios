import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { HardwareAsset, MaintenanceRecord } from '../types/inventory';
import { 
  Wrench, 
  Calendar, 
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
  Printer
} from 'lucide-react';
import { formatDate, getMaintenanceStatus } from '../utils/formatters';
import { EmailSimulatorModal } from './EmailSimulatorModal';
import { generateInstitutionalMaintenancePdf } from '../utils/generateInstitutionalPdf';
import confetti from 'canvas-confetti';

interface MaintenanceScheduleProps {
  preselectedAsset?: HardwareAsset | null;
}

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

  const [search, setSearch] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'urgent' | 'scheduled' | 'done'>('all');
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

  // Calculate maintenance statuses
  const assetsWithMaintenance = assets.map(asset => {
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

  const filteredItems = assetsWithMaintenance.filter(({ asset, maintStatus, employee }) => {
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

  const urgentCount = assetsWithMaintenance.filter(
    item => item.maintStatus.status === 'vencido' || item.maintStatus.status === 'proximo'
  ).length;

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

  return (
    <div className="space-y-5">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Cronograma de Mantenimiento Preventivo
            </h2>
            {urgentCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                {urgentCount} por atender
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Programación periódica de limpiezas internas, pasta térmica, revisiones técnicas y alertas por correo al personal.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Institutional PDF Export Group */}
          <div className="inline-flex rounded-xl shadow-xs border border-rose-200 overflow-hidden">
            <button
              onClick={() => handleExportMaintenancePdf(false)}
              disabled={isExportingPdf}
              className="px-3.5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white font-bold text-xs transition-colors flex items-center gap-2 border-r border-rose-500 cursor-pointer shadow-xs"
              title="Descargar historial oficial de mantenimientos en PDF con logotipo de Petroil"
            >
              {isExportingPdf ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download className="w-4 h-4 text-white" />
              )}
              <span>Exportar Historial PDF</span>
            </button>
            <button
              onClick={() => handleExportMaintenancePdf(true)}
              disabled={isExportingPdf}
              className="px-2.5 py-2.5 bg-rose-700 hover:bg-rose-800 disabled:bg-rose-500 text-white transition-colors cursor-pointer"
              title="Imprimir historial institucional oficial de mantenimiento con logo Petroil"
            >
              <Printer className="w-4 h-4 text-rose-100" />
            </button>
          </div>

          <button
            onClick={() => {
              if (!canEdit) {
                alert('Acceso Denegado (Perfil Visor): El envío masivo de notificaciones está reservado para perfiles con permisos de edición (Edición Total o Soporte Técnico).');
                return;
              }
              handleSendBatchReminders();
            }}
            className={`px-3.5 py-2.5 rounded-xl font-bold text-xs transition-colors flex items-center gap-2 shadow-xs ${
              canEdit 
                ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 cursor-pointer' 
                : 'bg-slate-100 text-slate-500 border border-slate-300'
            }`}
            title="Enviar avisos por correo a todos los usuarios con mantenimiento próximo"
          >
            {canEdit ? <Send className="w-4 h-4" /> : <Lock className="w-4 h-4 text-amber-600" />}
            <span>Notificar a Todos ({urgentCount})</span>
          </button>

          <button
            onClick={() => {
              if (!canEdit) {
                alert('Acceso Denegado (Perfil Visor): Su usuario tiene permisos de solo lectura. Para registrar servicios técnicos se requiere perfil Edición Total o Soporte Técnico.');
                return;
              }
              setServiceForm({
                ...serviceForm,
                assetId: preselectedAsset?.id || (assets[0]?.id || '')
              });
              setShowNewServiceModal(true);
            }}
            className={`px-4 py-2.5 rounded-xl font-semibold text-xs transition-colors shadow-sm flex items-center gap-2 ${
              canEdit 
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 cursor-pointer' 
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-300'
            }`}
            title={canEdit ? 'Registrar servicio técnico' : 'Deshabilitado en modo Visor'}
          >
            {canEdit ? <Plus className="w-4 h-4" /> : <Lock className="w-4 h-4 text-amber-600" />}
            <span>Registrar Servicio</span>
            {!canEdit && (
              <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-medium">
                Solo Lectura
              </span>
            )}
          </button>
        </div>
      </div>

      {/* PDF Success notification */}
      {pdfMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-950 text-xs flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse" />
            <span className="font-semibold">{pdfMessage}</span>
          </div>
          <button
            onClick={() => setPdfMessage(null)}
            className="text-rose-800 hover:text-rose-950 font-bold ml-3 text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {batchSentMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>¡Notificaciones por correo enviadas exitosamente a los colaboradores correspondientes!</span>
        </div>
      )}

      {/* Filter toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por placa, modelo o colaborador asignado..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-hidden"
          />
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <button
            onClick={() => setSelectedStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              selectedStatusFilter === 'all' ? 'bg-indigo-600 text-white font-semibold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos ({assets.length})
          </button>
          <button
            onClick={() => setSelectedStatusFilter('urgent')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              selectedStatusFilter === 'urgent' ? 'bg-rose-600 text-white font-semibold' : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            Urgentes / Próximos ({urgentCount})
          </button>
          <button
            onClick={() => setSelectedStatusFilter('scheduled')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              selectedStatusFilter === 'scheduled' ? 'bg-sky-600 text-white font-semibold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Al Día
          </button>
        </div>
      </div>

      {/* Maintenance Grid / List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map(({ asset, maintStatus, employee, records }) => {
          return (
            <div 
              key={asset.id}
              className={`bg-white rounded-xl border p-4 shadow-xs flex flex-col justify-between transition-all ${
                maintStatus.status === 'vencido' 
                  ? 'border-red-300 ring-1 ring-red-200' 
                  : maintStatus.status === 'proximo'
                  ? 'border-amber-300 ring-1 ring-amber-200'
                  : 'border-slate-200 hover:border-indigo-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-1.5 font-mono font-bold text-xs text-indigo-700">
                    <Laptop className="w-3.5 h-3.5" />
                    <span>{asset.assetTag}</span>
                  </div>

                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${maintStatus.badgeClass}`}>
                    {maintStatus.label}
                  </span>
                </div>

                <div className="mt-3">
                  <h3 className="font-bold text-sm text-slate-900 leading-snug">
                    {asset.brand} {asset.model}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Serie: {asset.serialNumber}
                  </p>
                </div>

                {/* Dates breakdown */}
                <div className="mt-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Próximo Mantenimiento:</span>
                    <strong className="text-slate-900 font-mono">{formatDate(asset.nextMaintenanceDate)}</strong>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Último Servicio:</span>
                    <span className="text-slate-600 font-mono">{formatDate(asset.lastMaintenanceDate) || 'Sin registro'}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Frecuencia recomendada:</span>
                    <span className="text-slate-600">Cada {asset.maintenanceIntervalMonths || 6} meses</span>
                  </div>
                </div>

                {/* Assigned Colaborador info */}
                <div className="mt-3 text-xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                    Colaborador Notificable:
                  </span>
                  {employee ? (
                    <div className="flex items-center justify-between mt-1">
                      <div className="truncate">
                        <p className="font-semibold text-slate-900 truncate">{employee.fullName}</p>
                        <p className="text-[11px] text-slate-500 truncate">{employee.email}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-500 text-xs mt-0.5">En Almacén TI (Sin colaborador)</p>
                  )}
                </div>
              </div>

              {/* Card Actions */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                {employee && (
                  <button
                    onClick={() => setSelectedAssetForEmail(asset)}
                    className="flex-1 py-1.5 px-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold transition-colors flex items-center justify-center gap-1.5"
                    title="Previsualizar y enviar correo al usuario"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    Enviar Correo
                  </button>
                )}

                <button
                  onClick={() => {
                    setServiceForm({
                      ...serviceForm,
                      assetId: asset.id
                    });
                    setShowNewServiceModal(true);
                  }}
                  className="py-1.5 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors flex items-center gap-1"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  Realizar Servicio
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {/* Email Simulator Modal */}
      {selectedAssetForEmail && (
        <EmailSimulatorModal
          asset={selectedAssetForEmail}
          employee={employees.find(e => e.id === selectedAssetForEmail.assignedToEmployeeId)}
          onClose={() => setSelectedAssetForEmail(null)}
        />
      )}

      {/* Register Technical Service Modal */}
      {showNewServiceModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-sm">Registro de Servicio de Mantenimiento Preventivo</h3>
              </div>
              <button onClick={() => setShowNewServiceModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateService} className="p-6 overflow-y-auto space-y-4 text-xs">
              
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Equipo Atendido *</label>
                <select
                  required
                  value={serviceForm.assetId}
                  onChange={(e) => setServiceForm({ ...serviceForm, assetId: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg bg-white outline-hidden"
                >
                  <option value="">-- Seleccionar Equipo --</option>
                  {assets.map(a => (
                    <option key={a.id} value={a.id}>
                      [{a.assetTag}] {a.brand} {a.model} - S/N: {a.serialNumber}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Técnico Responsable *</label>
                  <input
                    type="text"
                    required
                    value={serviceForm.technicianName}
                    onChange={(e) => setServiceForm({ ...serviceForm, technicianName: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Costo Estimado de Insumos (MXN)</label>
                  <input
                    type="number"
                    value={serviceForm.cost}
                    onChange={(e) => setServiceForm({ ...serviceForm, cost: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded-lg outline-hidden"
                  />
                </div>
              </div>

              {/* Checklist */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-700 block uppercase tracking-wider text-[11px]">
                  Checklist Técnico Realizado (Protocolo de 7 Puntos):
                </span>
                <div className="space-y-1.5">
                  {serviceForm.tasks.map((task, idx) => (
                    <label key={idx} className="flex items-center gap-2 text-slate-700 cursor-pointer">
                      <input type="checkbox" defaultChecked className="rounded text-indigo-600" />
                      <span>{task}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Diagnóstico / Resumen del Trabajo:</label>
                <textarea
                  rows={2}
                  value={serviceForm.description}
                  onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Calificación Diagnóstica (1-100):</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={serviceForm.diagnosticScore}
                    onChange={(e) => setServiceForm({ ...serviceForm, diagnosticScore: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded-lg outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Próxima Fecha de Mantenimiento:</label>
                  <input
                    type="date"
                    required
                    value={serviceForm.nextScheduledDate}
                    onChange={(e) => setServiceForm({ ...serviceForm, nextScheduledDate: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg outline-hidden"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowNewServiceModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
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
