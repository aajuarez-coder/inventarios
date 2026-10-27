import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { HardwareAsset, AssetCategory, AssetStatus, PhysicalCondition } from '../types/inventory';
import { 
  Laptop, 
  Monitor, 
  Server, 
  Printer, 
  Network, 
  Plus, 
  Filter, 
  Search, 
  Grid, 
  List, 
  Eye, 
  UserCheck, 
  Wrench, 
  Building2, 
  Tag, 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  Cpu, 
  Calendar,
  X,
  Sparkles,
  Terminal,
  FileCode,
  Lock,
  AlertCircle,
  MapPin,
  Download,
  Printer as PrinterIcon,
  RotateCcw,
  FileSpreadsheet,
  Upload,
  Trash2
} from 'lucide-react';
import { formatCurrency, formatDate, getWarrantyStatus, getMaintenanceStatus, getStatusBadge, getConditionLabel } from '../utils/formatters';
import { AssetDetailModal } from './AssetDetailModal';
import { AssetBarcode } from './AssetBarcode';
import { HardwareExtractionModal } from './HardwareExtractionModal';
import { RemoteSecurityModal } from './RemoteSecurityModal';
import { ImportHardwareModal } from './ImportHardwareModal';
import { generateInstitutionalInventoryPdf } from '../utils/generateInstitutionalPdf';
import { exportHardwareInventoryCsv } from '../utils/exportCsv';
import confetti from 'canvas-confetti';

interface HardwareInventoryProps {
  onOpenAssign: (asset: HardwareAsset) => void;
  onOpenMaintenance: (asset: HardwareAsset) => void;
  onOpenTransfer: (asset: HardwareAsset) => void;
  onOpenMap?: (asset: HardwareAsset) => void;
  externalSearch?: string;
}

export const HardwareInventory: React.FC<HardwareInventoryProps> = ({
  onOpenAssign,
  onOpenMaintenance,
  onOpenTransfer,
  onOpenMap,
  externalSearch = ''
}) => {
  const { assets, branches, employees, addAsset, returnAsset, deleteAsset, currentUser, canEdit, isViewer } = useInventory();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [filterObsoleteOnly, setFilterObsoleteOnly] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [detailAsset, setDetailAsset] = useState<HardwareAsset | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showExtractionModal, setShowExtractionModal] = useState(false);
  const [securityModalAsset, setSecurityModalAsset] = useState<HardwareAsset | null>(null);
  const [permissionNotice, setPermissionNotice] = useState<string | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [pdfMessage, setPdfMessage] = useState<string | null>(null);
  const [csvMessage, setCsvMessage] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);

  // Asset Deletion state (for decommissioned / 'baja' & obsolete / 'obsoleto' assets)
  const [assetToDelete, setAssetToDelete] = useState<HardwareAsset | null>(null);
  const [deleteFeedback, setDeleteFeedback] = useState<string | null>(null);

  const handleConfirmDelete = () => {
    if (!assetToDelete) return;
    const tag = assetToDelete.assetTag;
    const name = `${assetToDelete.brand} ${assetToDelete.model}`;
    deleteAsset(assetToDelete.id);
    setDeleteFeedback(`Equipo ${tag} (${name}) eliminado permanentemente del catálogo e inventario.`);
    setTimeout(() => setDeleteFeedback(null), 5000);
    setAssetToDelete(null);
    if (detailAsset?.id === assetToDelete.id) {
      setDetailAsset(null);
    }
  };

  const handleExportCsv = () => {
    const result = exportHardwareInventoryCsv(filteredAssets, branches, employees);
    setCsvMessage(`Se exportaron ${result.count} equipos de hardware en formato CSV exitosamente.`);
    setTimeout(() => setCsvMessage(null), 4500);
  };

  // Return to warehouse modal states
  const [returnModalAsset, setReturnModalAsset] = useState<HardwareAsset | null>(null);
  const [returnBranchId, setReturnBranchId] = useState<string>('');
  const [returnCondition, setReturnCondition] = useState<string>('bueno');
  const [returnNotes, setReturnNotes] = useState<string>('Recepción y retorno ordinario a stock de almacén TI.');
  const [returnSuccessMsg, setReturnSuccessMsg] = useState<string | null>(null);

  const handleOpenReturnModal = (asset: HardwareAsset) => {
    setReturnModalAsset(asset);
    setReturnBranchId(asset.branchId || branches[0]?.id || '');
    setReturnCondition(asset.physicalCondition || 'bueno');
    setReturnNotes(`Devolución de equipo placa ${asset.assetTag}. Reingreso a inventario disponible.`);
  };

  const handleConfirmAssetReturn = () => {
    if (!returnModalAsset) return;
    returnAsset(returnModalAsset.id, returnCondition, returnNotes, returnBranchId);
    const targetBranch = branches.find(b => b.id === returnBranchId);
    setReturnSuccessMsg(`Equipo ${returnModalAsset.assetTag} (${returnModalAsset.brand} ${returnModalAsset.model}) reincorporado exitosamente al almacén "${targetBranch?.name || 'Sede TI'}".`);
    setTimeout(() => setReturnSuccessMsg(null), 4500);
    setReturnModalAsset(null);
    if (detailAsset?.id === returnModalAsset.id) {
      setDetailAsset(null);
    }
  };

  // New Asset form state
  const [formData, setFormData] = useState({
    assetTag: `EQ-${new Date().getFullYear()}-${(assets.length + 1).toString().padStart(3, '0')}`,
    serialNumber: '',
    name: '',
    category: 'laptop' as AssetCategory,
    brand: '',
    model: '',
    cpu: '',
    ram: '16 GB DDR5',
    storage: '512 GB SSD NVMe',
    os: 'Windows 11 Pro',
    macAddress: '',
    status: 'disponible' as AssetStatus,
    physicalCondition: 'excelente' as PhysicalCondition,
    branchId: branches[0]?.id || 'branch-1',
    locationDetails: 'Almacén General TI',
    purchaseDate: '2026-01-15',
    purchaseCost: 24500,
    supplier: 'Compusoluciones SA de CV',
    invoiceNumber: `FA-2026-${Math.floor(10000 + Math.random() * 90000)}`,
    warrantyEndDate: '2029-01-15',
    nextMaintenanceDate: '2026-11-15',
    maintenanceIntervalMonths: 6,
    accessories: ['Cargador original', 'Mochila corporativa', 'Mouse inalámbrico'],
    notes: ''
  });

  const obsoleteOrBajaAssets = assets.filter(a => a.status === 'baja' || a.physicalCondition === 'obsoleto');

  const query = (externalSearch || search).toLowerCase();

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = 
      asset.assetTag.toLowerCase().includes(query) ||
      asset.serialNumber.toLowerCase().includes(query) ||
      asset.name.toLowerCase().includes(query) ||
      asset.brand.toLowerCase().includes(query) ||
      asset.model.toLowerCase().includes(query) ||
      (asset.specs.cpu && asset.specs.cpu.toLowerCase().includes(query));

    const matchesCategory = selectedCategory === 'all' || asset.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || asset.status === selectedStatus;
    const matchesBranch = selectedBranch === 'all' || asset.branchId === selectedBranch;
    const matchesObsolete = !filterObsoleteOnly || (asset.status === 'baja' || asset.physicalCondition === 'obsoleto');

    return matchesSearch && matchesCategory && matchesStatus && matchesBranch && matchesObsolete;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.serialNumber || !formData.brand || !formData.model) {
      alert('Por favor complete los campos obligatorios (Serie, Marca, Modelo).');
      return;
    }

    addAsset({
      assetTag: formData.assetTag,
      serialNumber: formData.serialNumber,
      name: `${formData.brand} ${formData.model}`,
      category: formData.category,
      brand: formData.brand,
      model: formData.model,
      specs: {
        cpu: formData.cpu,
        ram: formData.ram,
        storage: formData.storage,
        os: formData.os,
        macAddress: formData.macAddress
      },
      status: formData.status,
      physicalCondition: formData.physicalCondition,
      branchId: formData.branchId,
      locationDetails: formData.locationDetails,
      purchaseDate: formData.purchaseDate,
      purchaseCost: Number(formData.purchaseCost) || 0,
      currency: 'MXN',
      supplier: formData.supplier,
      invoiceNumber: formData.invoiceNumber,
      warrantyEndDate: formData.warrantyEndDate,
      nextMaintenanceDate: formData.nextMaintenanceDate,
      maintenanceIntervalMonths: Number(formData.maintenanceIntervalMonths) || 6,
      accessoriesIncluded: formData.accessories,
      notes: formData.notes
    });

    setShowNewModal(false);
  };

  const handleExportInstitutionalPdf = (withPrint: boolean = false) => {
    setIsExportingPdf(true);
    setPdfMessage('Generando reporte institucional de inventario con logo Petroil en PDF...');

    setTimeout(() => {
      try {
        const branchObj = selectedBranch !== 'all' ? branches.find(b => b.id === selectedBranch) : undefined;
        generateInstitutionalInventoryPdf(filteredAssets, employees, branches, {
          generatedBy: currentUser.name,
          branchFilterName: branchObj ? `${branchObj.name} (${branchObj.city})` : 'Consolidado Corporativo (Todas las Sedes)',
          openPrintDialog: withPrint
        });
        confetti({ particleCount: 65, spread: 60, origin: { y: 0.7 } });
        setPdfMessage(
          withPrint 
            ? '✓ Reporte PDF generado e inicializado cuadro de impresión institucional con logo Petroil.'
            : '✓ Reporte institucional en PDF descargado exitosamente con membrete oficial Petroil.'
        );
        setTimeout(() => setPdfMessage(null), 5000);
      } catch (err) {
        console.error('Error al generar PDF institucional de inventario:', err);
        alert('Ocurrió un error al generar el PDF institucional de inventario.');
      } finally {
        setIsExportingPdf(false);
      }
    }, 120);
  };

  const getCategoryIcon = (cat: AssetCategory) => {
    switch (cat) {
      case 'laptop': return <Laptop className="w-4 h-4 text-indigo-600" />;
      case 'desktop': return <Monitor className="w-4 h-4 text-cyan-600" />;
      case 'servidor': return <Server className="w-4 h-4 text-blue-600" />;
      case 'impresora': return <Printer className="w-4 h-4 text-emerald-600" />;
      case 'redes': return <Network className="w-4 h-4 text-purple-600" />;
      default: return <Cpu className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-5">
      
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Inventario de Hardware y Equipos
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Registro técnico, números de serie, especificaciones de procesador/RAM/disco y estado de resguardo.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Export Institutional PDF (Petroil) */}
          <div className="inline-flex rounded-xl shadow-xs border border-rose-200 overflow-hidden">
            <button
              onClick={() => handleExportInstitutionalPdf(false)}
              disabled={isExportingPdf}
              className="px-3.5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white font-bold text-xs transition-colors flex items-center gap-2 border-r border-rose-500 cursor-pointer shadow-xs"
              title="Descargar listado oficial de inventario en PDF con logotipo institucional de Petroil"
            >
              {isExportingPdf ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download className="w-4 h-4 text-white" />
              )}
              <span>Exportar PDF Petroil</span>
            </button>
            <button
              onClick={() => handleExportInstitutionalPdf(true)}
              disabled={isExportingPdf}
              className="px-2.5 py-2.5 bg-rose-700 hover:bg-rose-800 disabled:bg-rose-500 text-white transition-colors cursor-pointer"
              title="Imprimir reporte oficial institucional con membrete y logo de Petroil"
            >
              <PrinterIcon className="w-4 h-4 text-rose-100" />
            </button>
          </div>

          {/* Export CSV button */}
          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
            title="Descargar inventario completo de hardware en formato CSV para Microsoft Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>Exportar CSV</span>
          </button>

          {/* Import CSV button */}
          <button
            onClick={() => {
              if (!canEdit) {
                setPermissionNotice('Acceso Denegado (Perfil Visor): Su usuario tiene permisos de solo lectura. Para importar activos se requiere el perfil de edición o Administrador TI.');
                setTimeout(() => setPermissionNotice(null), 7000);
                return;
              }
              setShowImportModal(true);
            }}
            className="px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
            title="Cargar equipos masivamente desde archivo CSV"
          >
            <Upload className="w-4 h-4 text-indigo-600" />
            <span>Importar CSV</span>
          </button>

          <button
            onClick={() => setShowExtractionModal(true)}
            className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors shadow-xs flex items-center gap-2 cursor-pointer"
            title="Extraer CPU, RAM, Serial y specs de Windows o macOS mediante script"
          >
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span>Extraer Datos (Script)</span>
          </button>

          <button
            onClick={() => {
              if (!canEdit) {
                setPermissionNotice('Acceso Denegado (Perfil Visor): Su usuario tiene permisos de solo lectura. Para registrar o editar activos se requiere el perfil de "Edición Total" o "Administrador TI". Puede cambiar de rol en la esquina superior derecha.');
                setTimeout(() => setPermissionNotice(null), 7000);
                return;
              }
              setFormData({
                ...formData,
                assetTag: `EQ-${new Date().getFullYear()}-${(assets.length + 1).toString().padStart(3, '0')}`
              });
              setShowNewModal(true);
            }}
            className={`px-4 py-2.5 rounded-xl font-semibold text-xs transition-colors shadow-xs flex items-center gap-2 ${
              canEdit 
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 cursor-pointer' 
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-300'
            }`}
            title={canEdit ? 'Registrar nuevo equipo de cómputo' : 'Deshabilitado en modo Visor (Solo lectura)'}
          >
            {canEdit ? <Plus className="w-4 h-4" /> : <Lock className="w-4 h-4 text-amber-600" />}
            <span>Registrar Nuevo Equipo</span>
            {!canEdit && (
              <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-medium">
                Solo Lectura
              </span>
            )}
          </button>
        </div>
      </div>

      {/* CSV Export Success notification */}
      {csvMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
            <span className="font-semibold">{csvMessage}</span>
          </div>
          <button
            onClick={() => setCsvMessage(null)}
            className="text-emerald-800 hover:text-emerald-950 font-bold ml-3 text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Return Success notification */}
      {returnSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
            <span className="font-semibold">{returnSuccessMsg}</span>
          </div>
          <button
            onClick={() => setReturnSuccessMsg(null)}
            className="text-emerald-800 hover:text-emerald-950 font-bold ml-3 text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

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

      {/* Asset Deletion Success notification */}
      {deleteFeedback && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-950 text-xs flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <div className="p-1 rounded-md bg-rose-100 text-rose-700">
              <Trash2 className="w-4 h-4 shrink-0" />
            </div>
            <span className="font-semibold">{deleteFeedback}</span>
          </div>
          <button
            onClick={() => setDeleteFeedback(null)}
            className="text-rose-800 hover:text-rose-950 font-bold ml-3 text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Permission alert banner if triggered */}
      {permissionNotice && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{permissionNotice}</span>
          </div>
          <button 
            onClick={() => setPermissionNotice(null)} 
            className="text-amber-800 hover:text-amber-950 font-bold ml-3 text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filters and search toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Search box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filtrar por placa, serie, marca, modelo, procesador..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-hidden"
            />
            {search && (
              <button 
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* View mode toggle */}
          <div className="flex items-center gap-1.5 self-end md:self-auto">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg border text-xs transition-colors ${
                viewMode === 'table' ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-semibold' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
              title="Vista de tabla"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg border text-xs transition-colors ${
                viewMode === 'grid' ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-semibold' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
              title="Vista de tarjetas"
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dropdown filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1 text-slate-400 mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filtros:</span>
          </div>

          {/* Category filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 text-xs focus:ring-2 focus:ring-indigo-100 outline-hidden"
          >
            <option value="all">Todas las Categorías</option>
            <option value="laptop">Laptops / Portátiles</option>
            <option value="desktop">Computadoras de Escritorio</option>
            <option value="servidor">Servidores</option>
            <option value="monitor">Monitores</option>
            <option value="impresora">Impresoras</option>
            <option value="redes">Redes & Switches</option>
          </select>

          {/* Status filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 text-xs focus:ring-2 focus:ring-indigo-100 outline-hidden"
          >
            <option value="all">Todos los Estados</option>
            <option value="disponible">En Almacén (Disponibles)</option>
            <option value="asignado">Asignados a Colaborador</option>
            <option value="mantenimiento">En Taller / Mantenimiento</option>
            <option value="traslado">En Traslado</option>
            <option value="baja">Dados de Baja</option>
          </select>

          {/* Branch filter */}
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 text-xs focus:ring-2 focus:ring-indigo-100 outline-hidden"
          >
            <option value="all">Todas las Sucursales</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>

          {/* Quick filter for Obsolete / Decommissioned equipment */}
          {obsoleteOrBajaAssets.length > 0 && (
            <button
              type="button"
              onClick={() => setFilterObsoleteOnly(prev => !prev)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                filterObsoleteOnly
                  ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                  : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
              }`}
              title="Filtrar únicamente equipos dados de baja o clasificados como obsoletos para depuración o eliminación"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Baja / Obsoletos ({obsoleteOrBajaAssets.length})</span>
              {filterObsoleteOnly && (
                <span className="text-[10px] bg-rose-700 px-1.5 py-0.2 rounded text-white font-mono">Activo</span>
              )}
            </button>
          )}

          {(selectedCategory !== 'all' || selectedStatus !== 'all' || selectedBranch !== 'all' || filterObsoleteOnly || search) && (
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSelectedStatus('all');
                setSelectedBranch('all');
                setFilterObsoleteOnly(false);
                setSearch('');
              }}
              className="text-indigo-600 hover:text-indigo-800 text-xs font-medium ml-auto"
            >
              Restablecer filtros
            </button>
          )}
        </div>
      </div>

      {/* Assets Count indicator */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>Mostrando <strong>{filteredAssets.length}</strong> de <strong>{assets.length}</strong> equipos registrados</span>
      </div>

      {/* Render Table or Grid */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Placa / Tag</th>
                  <th className="py-3 px-4">Equipo / Hardware</th>
                  <th className="py-3 px-4">Serie (S/N)</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4">Ubicación / Colaborador</th>
                  <th className="py-3 px-4">Garantía</th>
                  <th className="py-3 px-4">Mantenimiento</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAssets.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No se encontraron equipos con los criterios de búsqueda aplicados.
                    </td>
                  </tr>
                ) : (
                  filteredAssets.map(asset => {
                    const emp = employees.find(e => e.id === asset.assignedToEmployeeId);
                    const br = branches.find(b => b.id === asset.branchId);
                    const statusBadge = getStatusBadge(asset.status);
                    const warranty = getWarrantyStatus(asset.warrantyEndDate);
                    const maintenance = getMaintenanceStatus(asset.nextMaintenanceDate);

                    return (
                      <tr 
                        key={asset.id} 
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                        onClick={() => setDetailAsset(asset)}
                      >
                        <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(asset.category)}
                            <span className="text-indigo-600">{asset.assetTag}</span>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div>
                            <p className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                              {asset.brand} {asset.model}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate max-w-xs">
                              {asset.specs.cpu || asset.specs.storage} • {asset.specs.ram}
                            </p>
                          </div>
                        </td>

                        <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                          {asset.serialNumber}
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusBadge.className}`}>
                            {statusBadge.label}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          {emp ? (
                            <div>
                              <p className="font-medium text-slate-800">{emp.fullName}</p>
                              <p className="text-[10px] text-slate-500">{emp.department} • {br?.city}</p>
                            </div>
                          ) : (
                            <div>
                              <p className="text-slate-700 font-medium">{br?.name}</p>
                              <p className="text-[10px] text-slate-400">{asset.locationDetails || 'Almacén'}</p>
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${warranty.badgeClass}`}>
                            {warranty.label}
                          </span>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${maintenance.badgeClass}`}>
                            {maintenance.label}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setDetailAsset(asset)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                              title="Ver ficha técnica y trazabilidad"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {asset.status === 'disponible' && (
                              <button
                                onClick={() => onOpenAssign(asset)}
                                className="px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-[11px] transition-colors"
                                title="Asignar a colaborador"
                              >
                                Asignar
                              </button>
                            )}

                            {asset.status === 'asignado' && (
                              <button
                                onClick={() => handleOpenReturnModal(asset)}
                                className="px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold text-[11px] transition-colors flex items-center gap-1 border border-amber-200 cursor-pointer"
                                title="Devolver equipo al almacén"
                              >
                                <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                                <span>Devolver</span>
                              </button>
                            )}

                            <button
                              onClick={() => onOpenMaintenance(asset)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                              title="Mantenimiento preventivo"
                            >
                              <Wrench className="w-4 h-4" />
                            </button>

                            {onOpenMap && (
                              <button
                                onClick={() => onOpenMap(asset)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                                title="Ver ubicación en mapa"
                              >
                                <MapPin className="w-4 h-4" />
                              </button>
                            )}

                            <button
                              onClick={() => setSecurityModalAsset(asset)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Seguridad: Bloqueo BitLocker, Bloqueo de Pantalla y Avisos"
                            >
                              <ShieldAlert className="w-4 h-4" />
                            </button>

                            {/* Botón de Eliminar Activo (Especialmente visible para equipos dados de baja u obsoletos) */}
                            {canEdit && (
                              <button
                                onClick={() => {
                                  if (asset.status === 'asignado') {
                                    setPermissionNotice(`No es posible eliminar el equipo ${asset.assetTag} mientras esté asignado a un colaborador. Debe registrarse primero su devolución a almacén.`);
                                    setTimeout(() => setPermissionNotice(null), 6000);
                                    return;
                                  }
                                  setAssetToDelete(asset);
                                }}
                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                  asset.status === 'baja' || asset.physicalCondition === 'obsoleto'
                                    ? 'text-rose-600 hover:text-white hover:bg-rose-600 bg-rose-50 border border-rose-200'
                                    : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                                }`}
                                title={
                                  asset.status === 'baja' || asset.physicalCondition === 'obsoleto'
                                    ? 'Eliminar definitivamente este equipo dado de baja u obsoleto del catálogo'
                                    : 'Eliminar equipo del catálogo'
                                }
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid view */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAssets.map(asset => {
            const emp = employees.find(e => e.id === asset.assignedToEmployeeId);
            const br = branches.find(b => b.id === asset.branchId);
            const statusBadge = getStatusBadge(asset.status);
            const warranty = getWarrantyStatus(asset.warrantyEndDate);
            const maintenance = getMaintenanceStatus(asset.nextMaintenanceDate);

            return (
              <div 
                key={asset.id}
                onClick={() => setDetailAsset(asset)}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-1.5 font-mono font-bold text-xs text-indigo-600">
                      {getCategoryIcon(asset.category)}
                      <span>{asset.assetTag}</span>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusBadge.className}`}>
                      {statusBadge.label}
                    </span>
                  </div>

                  <div className="mt-3">
                    <h3 className="font-bold text-sm text-slate-900 leading-snug">
                      {asset.brand} {asset.model}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                      S/N: {asset.serialNumber}
                    </p>
                  </div>

                  <div className="mt-3 p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-[11px] space-y-1 text-slate-600">
                    <p className="truncate"><strong>CPU:</strong> {asset.specs.cpu || 'N/A'}</p>
                    <p><strong>RAM / Disco:</strong> {asset.specs.ram} • {asset.specs.storage}</p>
                    <p className="truncate"><strong>Ubicación:</strong> {br?.name}</p>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Garantía:</span>
                    <span className={`px-1.5 py-0.5 rounded border text-[10px] font-semibold ${warranty.badgeClass}`}>
                      {warranty.label}
                    </span>
                  </div>

                  <div className="mt-1 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Mantenimiento:</span>
                    <span className={`px-1.5 py-0.5 rounded border text-[10px] font-semibold ${maintenance.badgeClass}`}>
                      {maintenance.label}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 truncate max-w-[130px]">
                    {emp ? emp.fullName : 'Disponible'}
                  </span>
                    <div className="flex items-center gap-1.5">
                    {asset.status === 'asignado' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleOpenReturnModal(asset); }}
                        className="px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold text-[10px] transition-colors flex items-center gap-1 border border-amber-200 cursor-pointer"
                        title="Devolver equipo al almacén"
                      >
                        <RotateCcw className="w-3 h-3 text-amber-600" />
                        <span>Devolver</span>
                      </button>
                    )}
                    {canEdit && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (asset.status === 'asignado') {
                            setPermissionNotice(`No es posible eliminar el equipo ${asset.assetTag} mientras esté asignado a un colaborador. Debe registrarse primero su devolución a almacén.`);
                            setTimeout(() => setPermissionNotice(null), 6000);
                            return;
                          }
                          setAssetToDelete(asset);
                        }}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          asset.status === 'baja' || asset.physicalCondition === 'obsoleto'
                            ? 'text-rose-600 hover:text-white hover:bg-rose-600 bg-rose-50 border border-rose-200'
                            : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                        }`}
                        title={
                          asset.status === 'baja' || asset.physicalCondition === 'obsoleto'
                            ? 'Eliminar definitivamente este equipo dado de baja u obsoleto'
                            : 'Eliminar equipo'
                        }
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); setDetailAsset(asset); }}
                      className="text-indigo-600 font-semibold hover:text-indigo-800 text-xs"
                    >
                      Detalles →
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Asset Detail Modal */}
      {detailAsset && (
        <AssetDetailModal
          asset={detailAsset}
          onClose={() => setDetailAsset(null)}
          onOpenAssign={onOpenAssign}
          onOpenMaintenance={onOpenMaintenance}
          onOpenMap={onOpenMap}
        />
      )}

      {/* Delete Confirmation Modal for Decommissioned / Obsolete Assets */}
      {assetToDelete && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5 text-rose-600">
                <div className="p-2 rounded-xl bg-rose-100 text-rose-600">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Eliminar Equipo Definitivamente</h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {assetToDelete.assetTag}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setAssetToDelete(null)} 
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Asset quick card */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between items-start">
                <span className="text-slate-500">Equipo:</span>
                <span className="font-semibold text-slate-900 text-right">
                  {assetToDelete.brand} {assetToDelete.model}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Serie (S/N):</span>
                <span className="font-mono text-slate-700">{assetToDelete.serialNumber}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Estado / Condición:</span>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getStatusBadge(assetToDelete.status).className}`}>
                    {getStatusBadge(assetToDelete.status).label}
                  </span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 ${getConditionLabel(assetToDelete.physicalCondition).color}`}>
                    {getConditionLabel(assetToDelete.physicalCondition).label}
                  </span>
                </div>
              </div>
              {assetToDelete.notes && (
                <div className="pt-1.5 border-t border-slate-200/60 text-[11px] text-slate-600">
                  <span className="font-semibold block text-slate-700">Notas técnicas:</span>
                  <p className="truncate italic">{assetToDelete.notes}</p>
                </div>
              )}
            </div>

            {/* Reason highlight */}
            {(assetToDelete.status === 'baja' || assetToDelete.physicalCondition === 'obsoleto') ? (
              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Equipo apto para depuración</p>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    Este equipo está catalogado como <strong>{assetToDelete.status === 'baja' ? 'Dado de Baja' : ''}{assetToDelete.status === 'baja' && assetToDelete.physicalCondition === 'obsoleto' ? ' y ' : ''}{assetToDelete.physicalCondition === 'obsoleto' ? 'Físicamente Obsoleto' : ''}</strong>. Al confirmar, se depurará del catálogo de inventario activo.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-rose-50/80 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Advertencia de depuración</p>
                  <p className="text-[11px] text-rose-800 mt-0.5">
                    La eliminación es permanente en Firestore y solo debe realizarse si el equipo fue dado de baja o registrado por error.
                  </p>
                </div>
              </div>
            )}

            <p className="text-[11px] text-slate-500">
              * Se eliminará el registro de Firestore y se guardará un evento formal de baja en la bitácora de auditoría y trazabilidad con su firma de usuario.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setAssetToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirmar y Eliminar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Register New Asset Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Laptop className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-sm">Registrar Nuevo Equipo en Inventario</h3>
              </div>
              <button 
                onClick={() => setShowNewModal(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Placa de Inventario (Asset Tag) *</label>
                  <input
                    type="text"
                    required
                    value={formData.assetTag}
                    onChange={(e) => setFormData({ ...formData, assetTag: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-indigo-100 outline-hidden"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Número de Serie (S/N) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. PF39KLA901"
                    value={formData.serialNumber}
                    onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-indigo-100 outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Categoría *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as AssetCategory })}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white outline-hidden"
                  >
                    <option value="laptop">Laptop / Portátil</option>
                    <option value="desktop">Computadora de Escritorio</option>
                    <option value="servidor">Servidor</option>
                    <option value="monitor">Monitor</option>
                    <option value="impresora">Impresora</option>
                    <option value="redes">Switch / Router</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Marca *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Lenovo, Dell, Apple, HP"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg outline-hidden"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Modelo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. ThinkPad T14 Gen 4"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg outline-hidden"
                  />
                </div>
              </div>

              {/* Specs */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <span className="font-bold text-slate-700 block text-[11px] uppercase tracking-wider">
                  Especificaciones Técnicas de Hardware
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-600 block mb-1">Procesador (CPU)</label>
                    <input
                      type="text"
                      placeholder="Ej. Intel Core i7-1365U o Apple M3"
                      value={formData.cpu}
                      onChange={(e) => setFormData({ ...formData, cpu: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-lg bg-white outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="text-slate-600 block mb-1">Memoria RAM</label>
                    <input
                      type="text"
                      value={formData.ram}
                      onChange={(e) => setFormData({ ...formData, ram: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-lg bg-white outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="text-slate-600 block mb-1">Almacenamiento (Disco)</label>
                    <input
                      type="text"
                      value={formData.storage}
                      onChange={(e) => setFormData({ ...formData, storage: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-lg bg-white outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="text-slate-600 block mb-1">Sistema Operativo</label>
                    <input
                      type="text"
                      value={formData.os}
                      onChange={(e) => setFormData({ ...formData, os: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-lg bg-white outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Location & Purchase */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Sucursal / Almacén *</label>
                  <select
                    value={formData.branchId}
                    onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white outline-hidden"
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Costo de Compra (MXN)</label>
                  <input
                    type="number"
                    value={formData.purchaseCost}
                    onChange={(e) => setFormData({ ...formData, purchaseCost: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded-lg outline-hidden"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Vencimiento Garantía</label>
                  <input
                    type="date"
                    value={formData.warrantyEndDate}
                    onChange={(e) => setFormData({ ...formData, warrantyEndDate: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg outline-hidden"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs"
                >
                  Guardar en Inventario
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Hardware Extraction Modal (Windows PowerShell & macOS Shell) */}
      {showExtractionModal && (
        <HardwareExtractionModal
          onClose={() => setShowExtractionModal(false)}
        />
      )}

      {/* Remote Security & BitLocker Modal */}
      {securityModalAsset && (
        <RemoteSecurityModal
          asset={securityModalAsset}
          onClose={() => setSecurityModalAsset(null)}
        />
      )}

      {/* Return to Warehouse Modal */}
      {returnModalAsset && (() => {
        const assignedEmp = employees.find(e => e.id === returnModalAsset.assignedToEmployeeId);
        const currentBr = branches.find(b => b.id === returnModalAsset.branchId);

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-amber-400" />
                  <div>
                    <h3 className="font-bold text-sm">Devolver Equipo a Almacén</h3>
                    <p className="text-[11px] text-slate-300">Reingreso a stock disponible y liberación de resguardo</p>
                  </div>
                </div>
                <button 
                  onClick={() => setReturnModalAsset(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs">
                {/* Equipment & Custody Summary Card */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-indigo-700 text-sm">[{returnModalAsset.assetTag}]</span>
                    <span className="font-bold text-slate-900">{returnModalAsset.brand} {returnModalAsset.model}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 font-mono text-[11px]">
                    <span>Serie: {returnModalAsset.serialNumber}</span>
                    <span>Sede actual: {currentBr?.name || 'Sede TI'}</span>
                  </div>
                  {assignedEmp && (
                    <div className="pt-1.5 border-t border-slate-200 text-slate-700 flex items-center justify-between">
                      <span className="text-slate-500">Colaborador en resguardo:</span>
                      <strong className="text-indigo-800">{assignedEmp.fullName} ({assignedEmp.department})</strong>
                    </div>
                  )}
                </div>

                {/* Warehouse selector (Crucial User Requirement) */}
                <div>
                  <label className="font-semibold text-slate-800 block mb-1">
                    1. Seleccione Almacén / Sede de Devolución *
                  </label>
                  <select
                    value={returnBranchId}
                    onChange={(e) => setReturnBranchId(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg bg-white outline-hidden font-medium text-slate-800 focus:ring-2 focus:ring-indigo-100"
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.city}) {b.isMainWarehouse ? '★ Hub Central' : ''}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-500 mt-1">
                    El equipo quedará inmediatamente disponible en el inventario de la sede seleccionada.
                  </p>
                </div>

                {/* Physical Condition on Return */}
                <div>
                  <label className="font-semibold text-slate-800 block mb-1">
                    2. Estado Físico del Equipo al Devolver *
                  </label>
                  <select
                    value={returnCondition}
                    onChange={(e) => setReturnCondition(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg bg-white outline-hidden"
                  >
                    <option value="excelente">Excelente (Óptimas condiciones cosméticas y de hardware)</option>
                    <option value="bueno">Bueno (Desgaste natural ligero de operación)</option>
                    <option value="regular">Regular (Detalles estéticos o rayones superficiales)</option>
                    <option value="dañado">Dañado (Requiere reparación o revisión en laboratorio)</option>
                  </select>
                </div>

                {/* Return Notes */}
                <div>
                  <label className="font-semibold text-slate-800 block mb-1">
                    3. Observaciones / Notas de Recepción
                  </label>
                  <textarea
                    rows={2}
                    value={returnNotes}
                    onChange={(e) => setReturnNotes(e.target.value)}
                    placeholder="Detalles de entrega, accesorios recibidos (cargador, mochila), etc."
                    className="w-full p-2 border border-slate-300 rounded-lg outline-hidden"
                  />
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setReturnModalAsset(null)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmAssetReturn}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold cursor-pointer shadow-sm shadow-amber-200 flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Confirmar Devolución al Almacén</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* CSV Import Modal */}
      {showImportModal && (
        <ImportHardwareModal
          onClose={() => setShowImportModal(false)}
          onSuccess={(count) => {
            setCsvMessage(`¡Éxito! Se importaron ${count} equipos de hardware exitosamente al inventario.`);
            setTimeout(() => setCsvMessage(null), 5000);
          }}
        />
      )}

    </div>
  );
};
