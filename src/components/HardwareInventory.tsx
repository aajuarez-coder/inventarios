import React, { useState, useMemo } from 'react';
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
  Trash2,
  CheckSquare,
  Square,
  MinusSquare,
  Layers,
  ArrowRightLeft,
  Tablet,
  ExternalLink,
  Globe,
  Zap,
  DollarSign,
  RefreshCw
} from 'lucide-react';
import { formatCurrency, formatDate, getWarrantyStatus, getMaintenanceStatus, getStatusBadge, getConditionLabel } from '../utils/formatters';
import { OFFICIAL_HARDWARE_PRICES, getOfficialCost } from '../utils/hardwareCosts';
import { AssetDetailModal } from './AssetDetailModal';
import { AssetBarcode } from './AssetBarcode';
import { HardwareExtractionModal } from './HardwareExtractionModal';
import { RemoteSecurityModal } from './RemoteSecurityModal';
import { ImportHardwareModal } from './ImportHardwareModal';
import { EditAssetSpecsModal } from './EditAssetSpecsModal';
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
  const { 
    assets, 
    branches, 
    employees, 
    addAsset, 
    returnAsset, 
    deleteAsset, 
    bulkUpdateAssets, 
    bulkDeleteAssets, 
    bulkRetireAssets, 
    syncOfficialHardwareCosts,
    currentUser, 
    canEdit, 
    isViewer 
  } = useInventory();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [filterObsoleteOnly, setFilterObsoleteOnly] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [detailAsset, setDetailAsset] = useState<HardwareAsset | null>(null);
  const [editingSpecsAsset, setEditingSpecsAsset] = useState<HardwareAsset | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showExtractionModal, setShowExtractionModal] = useState(false);
  const [securityModalAsset, setSecurityModalAsset] = useState<HardwareAsset | null>(null);
  const [permissionNotice, setPermissionNotice] = useState<string | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [pdfMessage, setPdfMessage] = useState<string | null>(null);
  const [csvMessage, setCsvMessage] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [limitToTen, setLimitToTen] = useState<boolean>(true);
  const [showTariffModal, setShowTariffModal] = useState(false);
  const [isSyncingTariffs, setIsSyncingTariffs] = useState(false);
  const [tariffSyncFeedback, setTariffSyncFeedback] = useState<string | null>(null);

  const handleSyncOfficialTariffs = async () => {
    setIsSyncingTariffs(true);
    try {
      const res = await syncOfficialHardwareCosts();
      confetti({ particleCount: 75, spread: 65, origin: { y: 0.6 } });
      setTariffSyncFeedback(`✓ Tarifas oficiales Petroil aplicadas con éxito: ${res.updatedCount} equipos actualizados en la base de datos.`);
      setTimeout(() => setTariffSyncFeedback(null), 6500);
    } catch (err: any) {
      setTariffSyncFeedback(`Error al sincronizar tarifas: ${err.message || 'Error de conexión'}`);
      setTimeout(() => setTariffSyncFeedback(null), 6000);
    } finally {
      setIsSyncingTariffs(false);
    }
  };

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
    const result = exportHardwareInventoryCsv(sortedAndFilteredAssets, branches, employees);
    setCsvMessage(`Se exportaron ${result.count} equipos de hardware en formato CSV exitosamente.`);
    setTimeout(() => setCsvMessage(null), 4500);
  };

  // Bulk actions state
  const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(new Set());
  const [bulkActionFeedback, setBulkActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showBulkStatusModal, setShowBulkStatusModal] = useState(false);
  const [bulkStatusValue, setBulkStatusValue] = useState<AssetStatus>('disponible');
  const [showBulkBranchModal, setShowBulkBranchModal] = useState(false);
  const [bulkBranchValue, setBulkBranchValue] = useState<string>(branches[0]?.id || '');
  const [bulkLocationValue, setBulkLocationValue] = useState<string>('Almacén General');
  const [showBulkMaintModal, setShowBulkMaintModal] = useState(false);
  const [bulkMaintDate, setBulkMaintDate] = useState<string>('2026-11-15');
  const [bulkMaintInterval, setBulkMaintInterval] = useState<number>(6);
  const [showBulkRetireModal, setShowBulkRetireModal] = useState(false);
  const [bulkRetireReason, setBulkRetireReason] = useState<string>('Obsolescencia tecnológica y fin de ciclo de vida.');
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [isBulkExecuting, setIsBulkExecuting] = useState(false);

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
    screenSize: '',
    warrantyUrl: '',
    chargerSerial: '',
    chargerBrand: '',
    chargerModel: '',
    macAddress: '',
    status: 'disponible' as AssetStatus,
    physicalCondition: 'excelente' as PhysicalCondition,
    branchId: branches[0]?.id || 'branch-1',
    locationDetails: 'Almacén General TI',
    purchaseDate: '2026-01-15',
    purchaseCost: 15750, // Tarifa oficial Laptop HP por defecto
    supplier: 'Compusoluciones SA de CV',
    invoiceNumber: `FA-2026-${Math.floor(10000 + Math.random() * 90000)}`,
    warrantyEndDate: '2029-01-15',
    nextMaintenanceDate: '2026-11-15',
    maintenanceIntervalMonths: 6,
    accessories: ['Cargador original', 'Mochila corporativa', 'Mouse inalámbrico'],
    notes: ''
  });

  const handleCategoryChange = (cat: AssetCategory) => {
    const suggested = getOfficialCost(cat, formData.brand, formData.model, formData.screenSize);
    setFormData(prev => ({
      ...prev,
      category: cat,
      purchaseCost: suggested !== null ? suggested : prev.purchaseCost
    }));
  };

  const handleBrandChange = (brand: string) => {
    const suggested = getOfficialCost(formData.category, brand, formData.model, formData.screenSize);
    setFormData(prev => ({
      ...prev,
      brand,
      purchaseCost: suggested !== null ? suggested : prev.purchaseCost
    }));
  };

  const handleModelChange = (model: string) => {
    const suggested = getOfficialCost(formData.category, formData.brand, model, formData.screenSize);
    setFormData(prev => ({
      ...prev,
      model,
      purchaseCost: suggested !== null ? suggested : prev.purchaseCost
    }));
  };

  const obsoleteOrBajaAssets = assets.filter(a => a.status === 'baja' || a.physicalCondition === 'obsoleto');

  const categoryLabels: Record<string, string> = {
    laptop: 'Laptops / Portátiles',
    desktop: 'Computadoras de Escritorio',
    servidor: 'Servidores',
    tablet: 'Tablets / iPads',
    monitor: 'Monitores',
    impresora: 'Impresoras',
    redes: 'Redes & Switches'
  };

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: assets.length,
      laptop: 0,
      desktop: 0,
      servidor: 0,
      tablet: 0,
      monitor: 0,
      impresora: 0,
      redes: 0
    };
    assets.forEach(a => {
      if (counts[a.category] !== undefined) {
        counts[a.category]++;
      } else {
        counts[a.category] = 1;
      }
    });
    return counts;
  }, [assets]);

  const query = (externalSearch || search).toLowerCase();

  // Filter and sort assets by purchaseDate / entry date descending (más reciente primero)
  const sortedAndFilteredAssets = useMemo(() => {
    return assets
      .filter(asset => {
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
      })
      .sort((a, b) => {
        const timeA = a.purchaseDate ? new Date(a.purchaseDate).getTime() : 0;
        const timeB = b.purchaseDate ? new Date(b.purchaseDate).getTime() : 0;
        return timeB - timeA;
      });
  }, [assets, query, selectedCategory, selectedStatus, selectedBranch, filterObsoleteOnly]);

  // Display only the last 10 by default for optimal visualization and fluidity
  const displayedAssets = useMemo(() => {
    if (limitToTen) {
      return sortedAndFilteredAssets.slice(0, 10);
    }
    return sortedAndFilteredAssets;
  }, [sortedAndFilteredAssets, limitToTen]);

  // Alias for backward compatibility across the component
  const filteredAssets = displayedAssets;

  const handleToggleSelectAsset = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedAssetIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allFilteredSelected = filteredAssets.length > 0 && filteredAssets.every(a => selectedAssetIds.has(a.id));
  const someFilteredSelected = filteredAssets.some(a => selectedAssetIds.has(a.id)) && !allFilteredSelected;

  const handleToggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedAssetIds(prev => {
        const next = new Set(prev);
        filteredAssets.forEach(a => next.delete(a.id));
        return next;
      });
    } else {
      setSelectedAssetIds(prev => {
        const next = new Set(prev);
        filteredAssets.forEach(a => next.add(a.id));
        return next;
      });
    }
  };

  const handleDeselectAll = () => {
    setSelectedAssetIds(new Set());
  };

  const handleExportSelectedCsv = () => {
    const selectedList = assets.filter(a => selectedAssetIds.has(a.id));
    if (selectedList.length === 0) return;
    const result = exportHardwareInventoryCsv(selectedList, branches, employees);
    setBulkActionFeedback({
      type: 'success',
      message: `Se exportaron ${result.count} equipos seleccionados a CSV exitosamente.`
    });
    setTimeout(() => setBulkActionFeedback(null), 4500);
  };

  const handleExecuteBulkStatus = async () => {
    const ids = Array.from(selectedAssetIds);
    if (ids.length === 0) return;
    setIsBulkExecuting(true);
    try {
      const partial: Partial<HardwareAsset> = { status: bulkStatusValue };
      if (bulkStatusValue === 'disponible' || bulkStatusValue === 'baja') {
        partial.assignedToEmployeeId = undefined;
      }
      const updatedCount = await bulkUpdateAssets(ids, partial);
      setBulkActionFeedback({
        type: 'success',
        message: `Se actualizó el estado a "${bulkStatusValue}" en ${updatedCount} equipos exitosamente.`
      });
      setShowBulkStatusModal(false);
      handleDeselectAll();
    } catch (err: any) {
      setBulkActionFeedback({
        type: 'error',
        message: `Error en actualización masiva de estado: ${err.message || 'Error desconocido'}`
      });
    } finally {
      setIsBulkExecuting(false);
      setTimeout(() => setBulkActionFeedback(null), 5000);
    }
  };

  const handleExecuteBulkBranch = async () => {
    const ids = Array.from(selectedAssetIds);
    if (ids.length === 0) return;
    setIsBulkExecuting(true);
    try {
      const targetBranch = branches.find(b => b.id === bulkBranchValue);
      const updatedCount = await bulkUpdateAssets(ids, {
        branchId: bulkBranchValue,
        locationDetails: bulkLocationValue
      });
      setBulkActionFeedback({
        type: 'success',
        message: `Se reasignaron ${updatedCount} equipos a la sucursal "${targetBranch?.name || bulkBranchValue}".`
      });
      setShowBulkBranchModal(false);
      handleDeselectAll();
    } catch (err: any) {
      setBulkActionFeedback({
        type: 'error',
        message: `Error al reasignar sucursal masivamente: ${err.message || 'Error desconocido'}`
      });
    } finally {
      setIsBulkExecuting(false);
      setTimeout(() => setBulkActionFeedback(null), 5000);
    }
  };

  const handleExecuteBulkMaint = async () => {
    const ids = Array.from(selectedAssetIds);
    if (ids.length === 0) return;
    setIsBulkExecuting(true);
    try {
      const updatedCount = await bulkUpdateAssets(ids, {
        nextMaintenanceDate: bulkMaintDate,
        maintenanceIntervalMonths: Number(bulkMaintInterval) || 6
      });
      setBulkActionFeedback({
        type: 'success',
        message: `Se programó mantenimiento preventivo (${bulkMaintDate}) para ${updatedCount} equipos.`
      });
      setShowBulkMaintModal(false);
      handleDeselectAll();
    } catch (err: any) {
      setBulkActionFeedback({
        type: 'error',
        message: `Error al programar mantenimiento masivo: ${err.message || 'Error desconocido'}`
      });
    } finally {
      setIsBulkExecuting(false);
      setTimeout(() => setBulkActionFeedback(null), 5000);
    }
  };

  const handleExecuteBulkRetire = async () => {
    const ids = Array.from(selectedAssetIds);
    if (ids.length === 0) return;
    setIsBulkExecuting(true);
    try {
      const count = await bulkRetireAssets(ids, bulkRetireReason);
      setBulkActionFeedback({
        type: 'success',
        message: `Se aplicó baja técnica institucional a ${count} equipos.`
      });
      setShowBulkRetireModal(false);
      handleDeselectAll();
    } catch (err: any) {
      setBulkActionFeedback({
        type: 'error',
        message: `Error al aplicar baja masiva: ${err.message || 'Error desconocido'}`
      });
    } finally {
      setIsBulkExecuting(false);
      setTimeout(() => setBulkActionFeedback(null), 5000);
    }
  };

  const handleExecuteBulkDelete = async () => {
    const ids = Array.from(selectedAssetIds);
    if (ids.length === 0) return;

    // Check if any selected asset is currently assigned to an employee
    const assigned = assets.filter(a => ids.includes(a.id) && a.status === 'asignado');
    if (assigned.length > 0) {
      setBulkActionFeedback({
        type: 'error',
        message: `No se pueden eliminar ${assigned.length} equipos que aún están asignados a colaboradores (${assigned.slice(0, 3).map(a => a.assetTag).join(', ')}...). Debe registrarse primero su devolución a almacén o desasignación.`
      });
      setShowBulkDeleteModal(false);
      setTimeout(() => setBulkActionFeedback(null), 7000);
      return;
    }

    setIsBulkExecuting(true);
    try {
      const res = await bulkDeleteAssets(ids);
      setBulkActionFeedback({
        type: 'success',
        message: `Se eliminaron permanentemente ${res.count} equipos del inventario y base de datos.`
      });
      setShowBulkDeleteModal(false);
      handleDeselectAll();
    } catch (err: any) {
      setBulkActionFeedback({
        type: 'error',
        message: `Error al eliminar equipos masivamente: ${err.message || 'Error desconocido'}`
      });
    } finally {
      setIsBulkExecuting(false);
      setTimeout(() => setBulkActionFeedback(null), 5000);
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.serialNumber || !formData.brand || !formData.model) {
      alert('Por favor complete los campos obligatorios (Serie, Marca, Modelo).');
      return;
    }

    const isMonitor = formData.category === 'monitor';
    const isTablet = formData.category === 'tablet';

    addAsset({
      assetTag: formData.assetTag,
      serialNumber: formData.serialNumber,
      name: `${formData.brand} ${formData.model}`,
      category: formData.category,
      brand: formData.brand,
      model: formData.model,
      specs: {
        cpu: isMonitor ? 'N/A (Monitor)' : formData.cpu,
        ram: isMonitor ? 'N/A' : formData.ram,
        storage: isMonitor ? 'N/A' : formData.storage,
        os: isMonitor ? 'N/A (Pantalla)' : formData.os,
        screenSize: formData.screenSize.trim() || (isMonitor ? '24" FHD IPS' : isTablet ? '11" Retina' : undefined),
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
      warrantyUrl: formData.warrantyUrl.trim() || undefined,
      chargerSerial: formData.chargerSerial.trim() || undefined,
      chargerBrand: formData.chargerBrand.trim() || (formData.chargerSerial.trim() ? formData.brand : undefined),
      chargerModel: formData.chargerModel.trim() || undefined,
      chargerInfo: (formData.chargerSerial.trim() || formData.chargerBrand.trim() || formData.chargerModel.trim()) ? {
        serialNumber: formData.chargerSerial.trim(),
        brand: formData.chargerBrand.trim() || formData.brand,
        model: formData.chargerModel.trim()
      } : undefined,
      nextMaintenanceDate: formData.nextMaintenanceDate,
      maintenanceIntervalMonths: Number(formData.maintenanceIntervalMonths) || 6,
      accessoriesIncluded: (() => {
        const base = [...formData.accessories];
        if (formData.chargerSerial.trim()) {
          const chargerDesc = `Cargador ${formData.chargerBrand.trim() || formData.brand} ${formData.chargerModel.trim()} (S/N: ${formData.chargerSerial.trim()})`.replace(/\s+/g, ' ').trim();
          // Replace generic 'Cargador original' if present, or prepend
          const idx = base.findIndex(a => a.toLowerCase().includes('cargador'));
          if (idx !== -1) {
            base[idx] = chargerDesc;
          } else {
            base.unshift(chargerDesc);
          }
        }
        return base;
      })(),
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
        generateInstitutionalInventoryPdf(sortedAndFilteredAssets, employees, branches, {
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
      case 'desktop': return <Cpu className="w-4 h-4 text-cyan-600" />;
      case 'servidor': return <Server className="w-4 h-4 text-blue-600" />;
      case 'tablet': return <Tablet className="w-4 h-4 text-purple-600" />;
      case 'monitor': return <Monitor className="w-4 h-4 text-amber-600" />;
      case 'impresora': return <Printer className="w-4 h-4 text-emerald-600" />;
      case 'redes': return <Network className="w-4 h-4 text-rose-600" />;
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

          {/* Official Costs & Tariffs Button */}
          <button
            onClick={() => setShowTariffModal(true)}
            className="px-3.5 py-2.5 rounded-xl border border-blue-300 bg-blue-50/90 hover:bg-blue-100 text-blue-900 font-bold text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
            title="Consultar y sincronizar tarifas y costos oficiales de hardware"
          >
            <Tag className="w-4 h-4 text-blue-700" />
            <span>Tarifas Oficiales</span>
          </button>

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
                setPermissionNotice('Acceso Denegado (Perfil Visor): Su usuario tiene permisos de solo lectura. Para registrar o editar activos se requiere una cuenta con permisos de "Edición Total" o "Administrador TI".');
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

      {/* Tariff Sync notification */}
      {tariffSyncFeedback && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{tariffSyncFeedback}</span>
          </div>
          <button onClick={() => setTariffSyncFeedback(null)} className="text-emerald-700 hover:text-emerald-900 cursor-pointer">
            <X className="w-4 h-4" />
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
              className="w-full text-sm font-medium tracking-tight pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:border-[#ff8200] focus:ring-2 focus:ring-[#ff8200]/20 outline-hidden placeholder:text-slate-400 caret-[#ff8200]"
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

          {/* Category filter with counter */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 text-sm font-medium shadow-xs focus:ring-2 focus:ring-[#ff8200]/20 focus:border-[#ff8200] outline-hidden cursor-pointer"
            >
              <option value="all">Todas las Categorías ({categoryCounts.all || 0})</option>
              <option value="laptop">Laptops / Portátiles ({categoryCounts.laptop || 0})</option>
              <option value="desktop">Computadoras de Escritorio ({categoryCounts.desktop || 0})</option>
              <option value="servidor">Servidores ({categoryCounts.servidor || 0})</option>
              <option value="tablet">Tablets / iPads ({categoryCounts.tablet || 0})</option>
              <option value="monitor">Monitores ({categoryCounts.monitor || 0})</option>
              <option value="impresora">Impresoras ({categoryCounts.impresora || 0})</option>
              <option value="redes">Redes & Switches ({categoryCounts.redes || 0})</option>
            </select>

            {selectedCategory !== 'all' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-[#004a99] font-bold text-xs shadow-xs animate-in fade-in">
                <span className="w-2 h-2 rounded-full bg-[#004a99]" />
                <span>
                  Total {categoryLabels[selectedCategory] || selectedCategory}: <strong>{categoryCounts[selectedCategory] || 0}</strong> {categoryCounts[selectedCategory] === 1 ? 'equipo' : 'equipos'}
                </span>
              </span>
            )}
          </div>

          {/* Status filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 text-sm font-medium shadow-xs focus:ring-2 focus:ring-[#ff8200]/20 focus:border-[#ff8200] outline-hidden cursor-pointer"
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
            className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 text-sm font-medium shadow-xs focus:ring-2 focus:ring-[#ff8200]/20 focus:border-[#ff8200] outline-hidden cursor-pointer"
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

      {/* Bulk Action Feedback Message */}
      {bulkActionFeedback && (
        <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between ${
          bulkActionFeedback.type === 'success' 
            ? 'bg-emerald-50 border-emerald-300 text-emerald-900' 
            : 'bg-rose-50 border-rose-300 text-rose-900'
        }`}>
          <span>{bulkActionFeedback.message}</span>
          <button onClick={() => setBulkActionFeedback(null)} className="text-slate-500 hover:text-slate-800 font-bold ml-2 cursor-pointer">✕</button>
        </div>
      )}

      {/* Floating / Sticky Bulk Actions Toolbar */}
      {selectedAssetIds.size > 0 && (
        <div className="bg-[#1e293b] text-white p-3 sm:p-4 rounded-xl shadow-lg border border-slate-700 flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#ff8200] text-slate-900 font-black text-xs">
              {selectedAssetIds.size}
            </span>
            <div>
              <p className="text-sm font-bold text-white flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#ff8200]" />
                <span>{selectedAssetIds.size} {selectedAssetIds.size === 1 ? 'equipo seleccionado' : 'equipos seleccionados'}</span>
              </p>
              <p className="text-[11px] text-slate-300 font-medium">
                Acciones por lote sobre los activos de hardware marcados
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowBulkStatusModal(true)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-600 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Modificar estado de los equipos seleccionados"
            >
              <Tag className="w-3.5 h-3.5 text-amber-400" />
              <span>Cambiar Estado</span>
            </button>

            <button
              type="button"
              onClick={() => setShowBulkBranchModal(true)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-600 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Reasignar sucursal o almacén destino"
            >
              <Building2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Reasignar Sucursal</span>
            </button>

            <button
              type="button"
              onClick={() => setShowBulkMaintModal(true)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-600 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Programar fecha de mantenimiento preventivo"
            >
              <Wrench className="w-3.5 h-3.5 text-cyan-400" />
              <span>Mantenimiento</span>
            </button>

            <button
              type="button"
              onClick={() => setShowBulkRetireModal(true)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-600/50 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Baja técnica institucional de equipos"
            >
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Baja Técnica</span>
            </button>

            <button
              type="button"
              onClick={handleExportSelectedCsv}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 border border-emerald-600/50 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Exportar únicamente los seleccionados a CSV"
            >
              <Download className="w-3.5 h-3.5 text-emerald-300" />
              <span>Exportar CSV ({selectedAssetIds.size})</span>
            </button>

            {canEdit && (
              <button
                type="button"
                onClick={() => setShowBulkDeleteModal(true)}
                className="px-2.5 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-700 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Eliminación definitiva de los equipos seleccionados"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Eliminar ({selectedAssetIds.size})</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleDeselectAll}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-600 transition-colors cursor-pointer"
              title="Deseleccionar todos"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Assets Count & Fluidity Optimization Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-700 font-medium px-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
        <div className="flex items-center gap-3 flex-wrap">
          <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 hover:text-[#004a99]">
            <input
              type="checkbox"
              checked={allFilteredSelected}
              ref={el => {
                if (el) el.indeterminate = someFilteredSelected;
              }}
              onChange={handleToggleSelectAll}
              className="w-4 h-4 rounded border-slate-300 text-[#ff8200] focus:ring-[#ff8200] cursor-pointer"
            />
            <span>Seleccionar ({displayedAssets.length})</span>
          </label>

          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-sky-100/70 text-sky-900 border border-sky-200 font-semibold text-[11px]">
            <Calendar className="w-3.5 h-3.5 text-sky-700 shrink-0" />
            <span>Ordenados por Fecha de Entrada (Más reciente primero)</span>
          </span>

          {limitToTen && sortedAndFilteredAssets.length > 10 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-100/70 text-amber-900 border border-amber-300 font-bold text-[11px]">
              <Zap className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span>Vista de Fluidez: Últimos 10 equipos</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          <span className="text-[11.5px] text-slate-600 font-medium">
            Mostrando <strong className="text-slate-900 font-bold">{displayedAssets.length}</strong> de <strong className="text-slate-900 font-bold">{sortedAndFilteredAssets.length}</strong> {assets.length !== sortedAndFilteredAssets.length ? `(filtrados de ${assets.length})` : 'equipos'}
          </span>

          {sortedAndFilteredAssets.length > 10 && (
            <button
              type="button"
              onClick={() => setLimitToTen(!limitToTen)}
              className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
              title={limitToTen ? 'Ver inventario completo sin limitar a 10' : 'Volver a limitar a los 10 más recientes'}
            >
              {limitToTen ? (
                <>
                  <Eye className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Ver todo ({sortedAndFilteredAssets.length})</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 text-amber-600" />
                  <span>Mostrar solo 10 últimos</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Render Table or Grid */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-xl border border-slate-300 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-900 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={allFilteredSelected}
                      ref={el => {
                        if (el) el.indeterminate = someFilteredSelected;
                      }}
                      onChange={handleToggleSelectAll}
                      className="w-4 h-4 rounded border-slate-300 text-[#ff8200] focus:ring-[#ff8200] cursor-pointer"
                      title={allFilteredSelected ? "Deseleccionar todos" : "Seleccionar todos los mostrados"}
                    />
                  </th>
                  <th className="py-3.5 px-4 font-bold text-slate-900">Placa / Tag</th>
                  <th className="py-3.5 px-4 font-bold text-slate-900">Equipo / Hardware</th>
                  <th className="py-3.5 px-4 font-bold text-slate-900">Serie (S/N)</th>
                  <th className="py-3.5 px-4 font-bold text-slate-900">Estado</th>
                  <th className="py-3.5 px-4 font-bold text-slate-900">Ubicación / Colaborador</th>
                  <th className="py-3.5 px-4 font-bold text-slate-900">Garantía</th>
                  <th className="py-3.5 px-4 font-bold text-slate-900">Mantenimiento</th>
                  <th className="py-3.5 px-4 font-bold text-slate-900 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredAssets.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-600 font-medium text-sm">
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
                    const isSelected = selectedAssetIds.has(asset.id);

                    return (
                      <tr 
                        key={asset.id} 
                        className={`transition-colors cursor-pointer group ${
                          isSelected ? 'bg-amber-50/70 hover:bg-amber-100/60' : 'hover:bg-slate-50'
                        }`}
                        onClick={() => setDetailAsset(asset)}
                      >
                        <td className="py-3 px-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectAsset(asset.id)}
                            className="w-4 h-4 rounded border-slate-300 text-[#ff8200] focus:ring-[#ff8200] cursor-pointer"
                          />
                        </td>

                        <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(asset.category)}
                            <div>
                              <span className="text-[#004a99] font-black">{asset.assetTag}</span>
                              {asset.purchaseDate && (
                                <span className="block text-[10.5px] text-slate-500 font-sans font-medium">
                                  Entrada: <strong className="text-slate-700">{formatDate(asset.purchaseDate)}</strong>
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div>
                            <p className="font-bold text-slate-900 group-hover:text-[#004a99] transition-colors">
                              {asset.brand} {asset.model}
                            </p>
                            <p className="text-[11.5px] text-slate-700 font-medium truncate max-w-xs">
                              {asset.specs.cpu || asset.specs.storage} • {asset.specs.ram}
                            </p>
                          </div>
                        </td>

                        <td className="py-3 px-4 font-mono font-semibold text-slate-800 whitespace-nowrap">
                          {asset.serialNumber}
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full border ${statusBadge.className}`}>
                            {statusBadge.label}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          {emp ? (
                            <div>
                              <p className="font-bold text-slate-900">{emp.fullName}</p>
                              <p className="text-[11px] text-slate-700 font-medium">{emp.department} • {br?.city}</p>
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
                              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                              title="Ver ficha técnica y trazabilidad"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {canEdit && (
                              <button
                                type="button"
                                onClick={() => setEditingSpecsAsset(asset)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                                title="Editar especificaciones técnicas (CPU, RAM, Disco, GPU, SO, etc.)"
                              >
                                <Cpu className="w-4 h-4 text-[#004a99]" />
                              </button>
                            )}

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
            const isSelected = selectedAssetIds.has(asset.id);

            return (
              <div 
                key={asset.id}
                onClick={() => setDetailAsset(asset)}
                className={`rounded-xl border p-4 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected ? 'bg-amber-50/70 border-amber-300' : 'bg-white border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelectAsset(asset.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 rounded border-slate-300 text-[#ff8200] focus:ring-[#ff8200] cursor-pointer"
                      />
                      <div className="flex items-center gap-1.5 font-mono font-bold text-xs text-indigo-600">
                        {getCategoryIcon(asset.category)}
                        <span>{asset.assetTag}</span>
                      </div>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusBadge.className}`}>
                      {statusBadge.label}
                    </span>
                  </div>

                  <div className="mt-3">
                    <h3 className="font-bold text-sm text-slate-900 leading-snug">
                      {asset.brand} {asset.model}
                    </h3>
                    <p className="text-[11.5px] text-slate-700 font-mono font-medium mt-0.5">
                      S/N: {asset.serialNumber}
                    </p>
                  </div>

                  <div className="mt-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11.5px] space-y-1 text-slate-800">
                    <p className="truncate"><strong className="text-slate-900">CPU:</strong> {asset.specs.cpu || 'N/A'}</p>
                    <p><strong className="text-slate-900">RAM / Disco:</strong> {asset.specs.ram} • {asset.specs.storage}</p>
                    <p className="truncate"><strong className="text-slate-900">Ubicación:</strong> {br?.name}</p>
                    {asset.purchaseDate && (
                      <p className="text-slate-600 font-medium pt-1 border-t border-slate-200/60">
                        <strong className="text-slate-900">Entrada / Alta:</strong> {formatDate(asset.purchaseDate)}
                      </p>
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[11.5px]">
                    <span className="text-slate-700 font-semibold">Garantía:</span>
                    <span className={`px-2 py-0.5 rounded border text-[10.5px] font-bold ${warranty.badgeClass}`}>
                      {warranty.label}
                    </span>
                  </div>

                  <div className="mt-1 flex items-center justify-between text-[11.5px]">
                    <span className="text-slate-700 font-semibold">Mantenimiento:</span>
                    <span className={`px-2 py-0.5 rounded border text-[10.5px] font-bold ${maintenance.badgeClass}`}>
                      {maintenance.label}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                  <span className="text-slate-800 font-semibold truncate max-w-[140px]">
                    {emp ? emp.fullName : 'Disponible en Almacén'}
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
                    {canEdit && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setEditingSpecsAsset(asset); }}
                        className="p-1 rounded text-slate-500 hover:text-[#004a99] hover:bg-indigo-50 transition-colors cursor-pointer"
                        title="Editar especificaciones técnicas de hardware"
                      >
                        <Cpu className="w-3.5 h-3.5 text-[#004a99]" />
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

      {/* Edit Hardware Specs Modal */}
      {editingSpecsAsset && (
        <EditAssetSpecsModal
          asset={editingSpecsAsset}
          onClose={() => setEditingSpecsAsset(null)}
          onSuccess={(updated) => {
            if (detailAsset?.id === updated.id) {
              setDetailAsset(updated);
            }
          }}
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

            <form onSubmit={handleCreateSubmit} className="p-6 overflow-y-auto space-y-4 text-sm">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="font-semibold text-slate-700 text-xs sm:text-[13px] block mb-1">Placa de Inventario (Asset Tag) *</label>
                  <input
                    type="text"
                    required
                    value={formData.assetTag}
                    onChange={(e) => setFormData({ ...formData, assetTag: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl font-mono text-[13px] text-slate-900 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-[#ff8200]/20 focus:border-[#ff8200] outline-hidden uppercase caret-[#ff8200]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 text-xs sm:text-[13px] block mb-1">Número de Serie (S/N) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. PF39KLA901"
                    value={formData.serialNumber}
                    onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl font-mono text-[13px] text-slate-900 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-[#ff8200]/20 focus:border-[#ff8200] outline-hidden uppercase caret-[#ff8200]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="font-semibold text-slate-700 text-xs sm:text-[13px] block mb-1">Categoría *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleCategoryChange(e.target.value as AssetCategory)}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl bg-white text-sm font-medium text-slate-900 focus:ring-2 focus:ring-[#ff8200]/20 focus:border-[#ff8200] outline-hidden cursor-pointer"
                  >
                    <option value="laptop">Laptop / Portátil</option>
                    <option value="desktop">Computadora de Escritorio</option>
                    <option value="servidor">Servidor</option>
                    <option value="tablet">Tablet / iPad</option>
                    <option value="monitor">Monitor</option>
                    <option value="impresora">Impresora</option>
                    <option value="redes">Switch / Router</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 text-xs sm:text-[13px] block mb-1">Marca *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Lenovo, Dell, Apple, HP, Samsung"
                    value={formData.brand}
                    onChange={(e) => handleBrandChange(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 bg-white focus:ring-2 focus:ring-[#ff8200]/20 focus:border-[#ff8200] outline-hidden caret-[#ff8200]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 text-xs sm:text-[13px] block mb-1">Modelo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. ThinkPad T14, iPad Air, UltraSharp 27"
                    value={formData.model}
                    onChange={(e) => handleModelChange(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 bg-white focus:ring-2 focus:ring-[#ff8200]/20 focus:border-[#ff8200] outline-hidden caret-[#ff8200]"
                  />
                </div>
              </div>

              {/* Specs: Dynamic according to category */}
              <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 block text-xs uppercase tracking-wider font-mono">
                    {formData.category === 'monitor'
                      ? 'Especificaciones Técnicas del Monitor / Pantalla'
                      : formData.category === 'tablet'
                      ? 'Especificaciones Técnicas de la Tablet'
                      : 'Especificaciones Técnicas de Hardware'}
                  </span>
                  {formData.category === 'monitor' && (
                    <span className="text-[11px] text-amber-700 font-semibold bg-amber-100/80 px-2 py-0.5 rounded">
                      Monitor (Sin CPU/RAM/Disco/SO)
                    </span>
                  )}
                  {formData.category === 'tablet' && (
                    <span className="text-[11px] text-purple-700 font-semibold bg-purple-100/80 px-2 py-0.5 rounded">
                      Tablet (Con Tamaño de Pantalla)
                    </span>
                  )}
                </div>

                {formData.category === 'monitor' ? (
                  /* Monitor Specs: Quitar CPU, RAM, almacenamiento, SO. Añadir tamaño de pantalla */
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="text-slate-700 text-xs font-semibold block mb-1">
                        Tamaño de Pantalla *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. 24 pulgadas FHD, 27 pulgadas 4K UHD, 34 curvo"
                        value={formData.screenSize}
                        onChange={(e) => setFormData({ ...formData, screenSize: e.target.value })}
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-xl bg-white text-sm font-medium text-slate-900 focus:ring-2 focus:ring-[#ff8200]/20 focus:border-[#ff8200] outline-hidden caret-[#ff8200]"
                      />
                    </div>

                    <div>
                      <label className="text-slate-700 text-xs font-semibold block mb-1">
                        Resolución y Entradas de Video
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. 1920x1080 @ 75Hz (HDMI, DisplayPort, USB-C)"
                        value={formData.cpu}
                        onChange={(e) => setFormData({ ...formData, cpu: e.target.value })}
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-xl bg-white text-sm font-medium text-slate-900 focus:ring-2 focus:ring-[#ff8200]/20 focus:border-[#ff8200] outline-hidden caret-[#ff8200]"
                      />
                    </div>
                  </div>
                ) : formData.category === 'tablet' ? (
                  /* Tablet Specs: Añadir tamaño de pantalla, almacenamiento, SO, RAM, CPU */
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    <div>
                      <label className="text-slate-700 text-xs font-semibold block mb-1">
                        Tamaño de Pantalla *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. 10.9 pulgadas Liquid Retina, 11 AMOLED, 12.9"
                        value={formData.screenSize}
                        onChange={(e) => setFormData({ ...formData, screenSize: e.target.value })}
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-xl bg-white text-sm font-medium text-slate-900 focus:ring-2 focus:ring-[#ff8200]/20 focus:border-[#ff8200] outline-hidden caret-[#ff8200]"
                      />
                    </div>

                    <div>
                      <label className="text-slate-700 text-xs font-semibold block mb-1">Almacenamiento (Disco) *</label>
                      <input
                        type="text"
                        placeholder="Ej. 128 GB, 256 GB, 512 GB"
                        value={formData.storage}
                        onChange={(e) => setFormData({ ...formData, storage: e.target.value })}
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-xl bg-white text-sm font-medium text-slate-900 focus:ring-2 focus:ring-[#ff8200]/20 focus:border-[#ff8200] outline-hidden caret-[#ff8200]"
                      />
                    </div>

                    <div>
                      <label className="text-slate-700 text-xs font-semibold block mb-1">Sistema Operativo *</label>
                      <input
                        type="text"
                        placeholder="Ej. iPadOS 17, Android 14"
                        value={formData.os}
                        onChange={(e) => setFormData({ ...formData, os: e.target.value })}
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-xl bg-white text-sm font-medium text-slate-900 focus:ring-2 focus:ring-[#ff8200]/20 focus:border-[#ff8200] outline-hidden caret-[#ff8200]"
                      />
                    </div>

                    <div>
                      <label className="text-slate-700 text-xs font-semibold block mb-1">Procesador (Chip)</label>
                      <input
                        type="text"
                        placeholder="Ej. Apple M2, Apple A14 Bionic, Snapdragon 8 Gen 2"
                        value={formData.cpu}
                        onChange={(e) => setFormData({ ...formData, cpu: e.target.value })}
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-xl bg-white text-sm font-medium text-slate-900 focus:ring-2 focus:ring-[#ff8200]/20 focus:border-[#ff8200] outline-hidden caret-[#ff8200]"
                      />
                    </div>

                    <div>
                      <label className="text-slate-700 text-xs font-semibold block mb-1">Memoria RAM</label>
                      <input
                        type="text"
                        placeholder="Ej. 8 GB, 6 GB, 16 GB"
                        value={formData.ram}
                        onChange={(e) => setFormData({ ...formData, ram: e.target.value })}
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-xl bg-white text-sm font-medium text-slate-900 focus:ring-2 focus:ring-[#ff8200]/20 focus:border-[#ff8200] outline-hidden caret-[#ff8200]"
                      />
                    </div>
                  </div>
                ) : (
                  /* Laptop, Servidores, Escritorio: Mismos datos (CPU, RAM, Disco, SO) + tamaño de pantalla para laptops */
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="text-slate-700 text-xs font-semibold block mb-1">Procesador (CPU)</label>
                      <input
                        type="text"
                        placeholder="Ej. Intel Core i7-1365U o Apple M3, AMD Ryzen 7"
                        value={formData.cpu}
                        onChange={(e) => setFormData({ ...formData, cpu: e.target.value })}
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-xl bg-white text-sm font-medium text-slate-900 focus:ring-2 focus:ring-[#ff8200]/20 focus:border-[#ff8200] outline-hidden caret-[#ff8200]"
                      />
                    </div>

                    <div>
                      <label className="text-slate-700 text-xs font-semibold block mb-1">Memoria RAM</label>
                      <input
                        type="text"
                        placeholder="Ej. 16 GB DDR5, 32 GB DDR4"
                        value={formData.ram}
                        onChange={(e) => setFormData({ ...formData, ram: e.target.value })}
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-xl bg-white text-sm font-medium text-slate-900 focus:ring-2 focus:ring-[#ff8200]/20 focus:border-[#ff8200] outline-hidden caret-[#ff8200]"
                      />
                    </div>

                    <div>
                      <label className="text-slate-700 text-xs font-semibold block mb-1">Almacenamiento (Disco)</label>
                      <input
                        type="text"
                        placeholder="Ej. 512 GB NVMe SSD, 1 TB SSD"
                        value={formData.storage}
                        onChange={(e) => setFormData({ ...formData, storage: e.target.value })}
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-xl bg-white text-sm font-medium text-slate-900 focus:ring-2 focus:ring-[#ff8200]/20 focus:border-[#ff8200] outline-hidden caret-[#ff8200]"
                      />
                    </div>

                    <div>
                      <label className="text-slate-700 text-xs font-semibold block mb-1">Sistema Operativo</label>
                      <input
                        type="text"
                        placeholder="Ej. Windows 11 Pro 64-bit, Ubuntu Server, macOS"
                        value={formData.os}
                        onChange={(e) => setFormData({ ...formData, os: e.target.value })}
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-xl bg-white text-sm font-medium text-slate-900 focus:ring-2 focus:ring-[#ff8200]/20 focus:border-[#ff8200] outline-hidden caret-[#ff8200]"
                      />
                    </div>

                    {formData.category === 'laptop' && (
                      <div className="sm:col-span-2">
                        <label className="text-slate-700 text-xs font-semibold block mb-1">Tamaño de Pantalla</label>
                        <input
                          type="text"
                          placeholder="Ej. 14 pulgadas FHD IPS, 15.6 pulgadas"
                          value={formData.screenSize}
                          onChange={(e) => setFormData({ ...formData, screenSize: e.target.value })}
                          className="w-full px-3 py-2.5 border border-slate-300 rounded-xl bg-white text-sm font-medium text-slate-900 focus:ring-2 focus:ring-[#ff8200]/20 focus:border-[#ff8200] outline-hidden caret-[#ff8200]"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Location & Purchase */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="font-semibold text-slate-700 text-xs sm:text-[13px] block mb-1">Sucursal / Almacén *</label>
                  <select
                    value={formData.branchId}
                    onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl bg-white text-sm font-medium text-slate-900 focus:ring-2 focus:ring-[#ff8200]/20 focus:border-[#ff8200] outline-hidden cursor-pointer"
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700 text-xs sm:text-[13px] block">Costo de Compra (MXN)</label>
                    {OFFICIAL_HARDWARE_PRICES.some(p => p.cost === formData.purchaseCost) && (
                      <span className="text-[10px] text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-1.5 py-0.5 rounded font-bold">
                        Tarifa Oficial
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    value={formData.purchaseCost}
                    onChange={(e) => setFormData({ ...formData, purchaseCost: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 bg-white focus:ring-2 focus:ring-[#ff8200]/20 focus:border-[#ff8200] outline-hidden caret-[#ff8200]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 text-xs sm:text-[13px] block mb-1">Vencimiento Garantía</label>
                  <input
                    type="date"
                    value={formData.warrantyEndDate}
                    onChange={(e) => setFormData({ ...formData, warrantyEndDate: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 bg-white focus:ring-2 focus:ring-[#ff8200]/20 focus:border-[#ff8200] outline-hidden caret-[#ff8200]"
                  />
                </div>
              </div>

              {/* Presets de Tarifas Oficiales Petroil */}
              <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-200/90 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-950 flex items-center gap-1.5 uppercase tracking-wide">
                    <Tag className="w-4 h-4 text-blue-600" />
                    <span>Tarifas Oficiales Petroil (Clic para autofirmar costo y modelo)</span>
                  </span>
                  {OFFICIAL_HARDWARE_PRICES.some(p => p.cost === formData.purchaseCost) && (
                    <span className="text-[10px] text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Tarifa Oficial Aplicada
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                  {OFFICIAL_HARDWARE_PRICES.map(preset => {
                    const isSelected = formData.purchaseCost === preset.cost && formData.category === preset.category;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            purchaseCost: preset.cost,
                            category: preset.category,
                            ...(preset.brand ? { brand: preset.brand } : {}),
                            ...(preset.id === 'price-hp-laptop' ? { brand: 'HP', model: prev.model || 'EliteBook 840' } : {}),
                            ...(preset.id === 'price-asus-expertbook' ? { brand: 'ASUS', model: 'ExpertBook B1400' } : {}),
                            ...(preset.id === 'price-asus-expertbook-15' ? { brand: 'ASUS', model: 'ExpertBook 15.6" B1502', screenSize: '15.6"' } : {}),
                            ...(preset.id === 'price-lenovo-thinkpad-l' ? { brand: 'Lenovo', model: 'ThinkPad L14 Gen 4' } : {}),
                            ...(preset.id === 'price-msi-cyborg-15' ? { brand: 'MSI', model: 'Cyborg 15 (15.6")', screenSize: '15.6"' } : {}),
                            ...(preset.id === 'price-tablets' ? { brand: 'Samsung', model: 'Galaxy Tab Active' } : {}),
                            ...(preset.id === 'price-monitores' ? { brand: 'Dell Technologies', model: 'UltraSharp 24"' } : {}),
                            ...(preset.id === 'price-escritorio' ? { brand: 'Dell Technologies', model: 'OptiPlex Micro' } : {}),
                            ...(preset.id === 'price-servidores' ? { brand: 'Dell Technologies', model: 'PowerEdge R650xs' } : {}),
                            ...(preset.screenSize ? { screenSize: preset.screenSize } : {})
                          }));
                        }}
                        className={`p-2 rounded-lg text-left text-xs transition-all border cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm ring-2 ring-blue-300'
                            : 'bg-white hover:bg-blue-100/70 text-slate-800 border-slate-200 shadow-2xs'
                        }`}
                      >
                        <div className="font-bold text-[11px] truncate">{preset.label}</div>
                        <div className={`font-mono text-xs font-bold mt-0.5 ${isSelected ? 'text-blue-100' : 'text-blue-700'}`}>
                          {formatCurrency(preset.cost)}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Charger / Adaptador de Corriente Section (Anexo en Responsiva) */}
              <div className="p-4 bg-amber-50/70 rounded-xl border border-amber-200/90 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-amber-950 text-xs sm:text-[13px] flex items-center gap-1.5 uppercase tracking-wide">
                    <Zap className="w-4 h-4 text-amber-600" />
                    <span>Datos del Cargador / Adaptador de Corriente</span>
                  </label>
                  <span className="text-[10px] text-amber-800 bg-amber-100/90 border border-amber-300/60 px-2 py-0.5 rounded-md font-semibold">
                    Anexo oficial en Carta Responsiva
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 text-xs block mb-1">
                      Número de Serie del Cargador (S/N)
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: CHG-8941258 / 8S5A10..."
                      value={formData.chargerSerial}
                      onChange={(e) => setFormData({ ...formData, chargerSerial: e.target.value })}
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl bg-white text-slate-900 font-mono uppercase focus:ring-2 focus:ring-[#ff8200]/20 focus:border-[#ff8200] outline-hidden"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-semibold text-slate-700 text-xs">Marca del Cargador</label>
                      {formData.brand && (
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, chargerBrand: formData.brand })}
                          className="text-[10px] text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer font-medium"
                          title={`Copiar marca "${formData.brand}" del equipo`}
                        >
                          Usar {formData.brand}
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder="Ej: Lenovo, Dell, HP, Apple..."
                      value={formData.chargerBrand}
                      onChange={(e) => setFormData({ ...formData, chargerBrand: e.target.value })}
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-[#ff8200]/20 focus:border-[#ff8200] outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 text-xs block mb-1">
                      Modelo / Potencia del Cargador
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: 65W USB-C / PA-1650-20..."
                      value={formData.chargerModel}
                      onChange={(e) => setFormData({ ...formData, chargerModel: e.target.value })}
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-[#ff8200]/20 focus:border-[#ff8200] outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Warranty URL & Portal Access */}
              <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-800 text-xs sm:text-[13px] flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-[#004a99]" />
                    <span>URL para Acceso a la Página de Garantías del Fabricante</span>
                  </label>
                  {formData.warrantyUrl && (
                    <a
                      href={formData.warrantyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#004a99] hover:bg-[#003875] text-white font-semibold text-xs transition-colors shadow-2xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Abrir Portal de Garantía</span>
                    </a>
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://support.lenovo.com/warrantylookup o portal oficial de la marca..."
                    value={formData.warrantyUrl}
                    onChange={(e) => setFormData({ ...formData, warrantyUrl: e.target.value })}
                    className="flex-1 px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl bg-white text-slate-900 font-mono focus:ring-2 focus:ring-[#ff8200]/20 focus:border-[#ff8200] outline-hidden"
                  />
                </div>

                {/* Quick brand warranty portal buttons */}
                <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-slate-600">
                  <span className="font-semibold text-slate-500">Portales oficiales:</span>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, warrantyUrl: 'https://pcsupport.lenovo.com/mx/es/warranty-lookup#/' })}
                    className="px-2 py-0.5 rounded-md bg-white border border-slate-200 hover:border-indigo-400 hover:text-indigo-600 font-medium cursor-pointer transition-colors"
                  >
                    Lenovo
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, warrantyUrl: 'https://www.dell.com/support/home/es-mx/products?app=warranty' })}
                    className="px-2 py-0.5 rounded-md bg-white border border-slate-200 hover:border-indigo-400 hover:text-indigo-600 font-medium cursor-pointer transition-colors"
                  >
                    Dell
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, warrantyUrl: 'https://support.hp.com/mx-es/check-warranty' })}
                    className="px-2 py-0.5 rounded-md bg-white border border-slate-200 hover:border-indigo-400 hover:text-indigo-600 font-medium cursor-pointer transition-colors"
                  >
                    HP
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, warrantyUrl: 'https://checkcoverage.apple.com/' })}
                    className="px-2 py-0.5 rounded-md bg-white border border-slate-200 hover:border-indigo-400 hover:text-indigo-600 font-medium cursor-pointer transition-colors"
                  >
                    Apple
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, warrantyUrl: 'https://www.samsung.com/mx/support/your-service/warranty-check' })}
                    className="px-2 py-0.5 rounded-md bg-white border border-slate-200 hover:border-indigo-400 hover:text-indigo-600 font-medium cursor-pointer transition-colors"
                  >
                    Samsung
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium text-sm transition-colors cursor-pointer"
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

      {/* Official Hardware Tariffs & Sync Modal */}
      {showTariffModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex items-center justify-between border-b border-blue-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-700/60 border border-blue-400/30 text-white shadow-xs">
                  <Tag className="w-5 h-5 text-blue-200" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Catálogo de Tarifas y Costos Oficiales de Hardware
                  </h3>
                  <p className="text-xs text-blue-200">
                    Tarifario institucional autorizado para Grupo Petroil (Noviembre 2026)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowTariffModal(false)}
                className="p-1.5 rounded-lg text-blue-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4">
              <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900">
                <p className="font-semibold">
                  A continuación se presentan los costos unitarios oficiales para adquisiciones, valuación de activos en almacén y responsivas:
                </p>
              </div>

              {/* Pricing Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="px-4 py-3">Equipo / Categoría</th>
                      <th className="px-4 py-3">Tipo</th>
                      <th className="px-4 py-3 text-right">Costo Oficial (MXN)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-medium">
                    {OFFICIAL_HARDWARE_PRICES.map((item, idx) => (
                      <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900">{item.label}</div>
                          <div className="text-[11px] text-slate-500">{item.description}</div>
                        </td>
                        <td className="px-4 py-3 capitalize text-slate-600 font-semibold">
                          {item.category}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-sm text-[#004a99]">
                          {formatCurrency(item.cost)} MXN
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Cloud Sync info */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-slate-800 block">Sincronización con Base de Datos</span>
                  <span>Aplica estos costos oficiales a todos los activos existentes registrados en Firestore.</span>
                </div>
                <button
                  type="button"
                  onClick={handleSyncOfficialTariffs}
                  disabled={isSyncingTariffs}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingTariffs ? 'animate-spin' : ''}`} />
                  <span>{isSyncingTariffs ? 'Sincronizando...' : 'Actualizar Inventario'}</span>
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowTariffModal(false)}
                className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
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

      {/* Bulk Status Change Modal */}
      {showBulkStatusModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <p className="text-xs text-[#ff8200] font-mono font-bold uppercase">Acción Masiva de Inventario</p>
                <h3 className="font-bold text-base text-white">Cambiar Estado ({selectedAssetIds.size} equipos)</h3>
              </div>
              <button onClick={() => setShowBulkStatusModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs sm:text-sm">
              <p className="text-slate-600">
                Selecciona el nuevo estado operativo que se aplicará en lote a los <strong>{selectedAssetIds.size}</strong> equipos marcados:
              </p>

              <div>
                <label className="font-bold text-slate-800 block mb-1.5">Nuevo Estado</label>
                <select
                  value={bulkStatusValue}
                  onChange={(e) => setBulkStatusValue(e.target.value as AssetStatus)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white font-medium text-slate-900 focus:ring-2 focus:ring-[#ff8200]/20 focus:border-[#ff8200] outline-hidden cursor-pointer"
                >
                  <option value="disponible">En Almacén (Disponible para entrega)</option>
                  <option value="mantenimiento">En Taller / Mantenimiento Preventivo</option>
                  <option value="traslado">En Proceso de Traslado entre Sedes</option>
                  <option value="baja">Dado de Baja / Fuera de Operación</option>
                </select>
              </div>

              {(bulkStatusValue === 'disponible' || bulkStatusValue === 'baja') && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Aviso importante:</strong> Al cambiar a <em>{bulkStatusValue}</em>, los equipos que estén actualmente en resguardo de algún colaborador quedarán desvinculados para reflejar su ingreso a almacén.
                  </span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowBulkStatusModal(false)}
                  disabled={isBulkExecuting}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleExecuteBulkStatus}
                  disabled={isBulkExecuting}
                  className="px-4 py-2 rounded-xl bg-[#004a99] hover:bg-[#003875] text-white font-bold cursor-pointer shadow-md flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Tag className="w-4 h-4" />
                  <span>{isBulkExecuting ? 'Actualizando...' : `Aplicar a ${selectedAssetIds.size} Equipos`}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Branch Reassignment Modal */}
      {showBulkBranchModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <p className="text-xs text-indigo-400 font-mono font-bold uppercase">Acción Masiva de Sucursal</p>
                <h3 className="font-bold text-base text-white">Reasignar Sede / Almacén ({selectedAssetIds.size} equipos)</h3>
              </div>
              <button onClick={() => setShowBulkBranchModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs sm:text-sm">
              <p className="text-slate-600">
                Reubica físicamente los <strong>{selectedAssetIds.size}</strong> equipos a la siguiente sucursal y almacén:
              </p>

              <div>
                <label className="font-bold text-slate-800 block mb-1.5">Sucursal Destino *</label>
                <select
                  value={bulkBranchValue}
                  onChange={(e) => setBulkBranchValue(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white font-medium text-slate-900 focus:ring-2 focus:ring-[#ff8200]/20 focus:border-[#ff8200] outline-hidden cursor-pointer"
                >
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name} ({b.city}, {b.state})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1.5">Detalles de Ubicación Física</label>
                <input
                  type="text"
                  value={bulkLocationValue}
                  onChange={(e) => setBulkLocationValue(e.target.value)}
                  placeholder="Ej. Almacén General TI - Rack B4"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-medium text-slate-900 focus:ring-2 focus:ring-[#ff8200]/20 focus:border-[#ff8200] outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowBulkBranchModal(false)}
                  disabled={isBulkExecuting}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleExecuteBulkBranch}
                  disabled={isBulkExecuting}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer shadow-md flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Building2 className="w-4 h-4" />
                  <span>{isBulkExecuting ? 'Reasignando...' : `Reasignar ${selectedAssetIds.size} Equipos`}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Maintenance Schedule Modal */}
      {showBulkMaintModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <p className="text-xs text-cyan-400 font-mono font-bold uppercase">Mantenimiento Preventivo Masivo</p>
                <h3 className="font-bold text-base text-white">Programar Fecha ({selectedAssetIds.size} equipos)</h3>
              </div>
              <button onClick={() => setShowBulkMaintModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs sm:text-sm">
              <p className="text-slate-600">
                Establece la próxima fecha programada de servicio técnico y el intervalo de mantenimiento para los <strong>{selectedAssetIds.size}</strong> equipos:
              </p>

              <div>
                <label className="font-bold text-slate-800 block mb-1.5">Próxima Fecha de Servicio *</label>
                <input
                  type="date"
                  value={bulkMaintDate}
                  onChange={(e) => setBulkMaintDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-medium text-slate-900 focus:ring-2 focus:ring-[#ff8200]/20 focus:border-[#ff8200] outline-hidden"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1.5">Intervalo Periódico (Meses)</label>
                <select
                  value={bulkMaintInterval}
                  onChange={(e) => setBulkMaintInterval(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-medium text-slate-900 focus:ring-2 focus:ring-[#ff8200]/20 focus:border-[#ff8200] outline-hidden cursor-pointer"
                >
                  <option value={3}>Cada 3 meses (Trimestral)</option>
                  <option value={6}>Cada 6 meses (Semestral)</option>
                  <option value={12}>Cada 12 meses (Anual)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowBulkMaintModal(false)}
                  disabled={isBulkExecuting}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleExecuteBulkMaint}
                  disabled={isBulkExecuting}
                  className="px-4 py-2 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white font-bold cursor-pointer shadow-md flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Wrench className="w-4 h-4" />
                  <span>{isBulkExecuting ? 'Guardando...' : `Programar ${selectedAssetIds.size} Equipos`}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Technical Retire Modal */}
      {showBulkRetireModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <p className="text-xs text-amber-400 font-mono font-bold uppercase">Baja Técnica por Lote</p>
                <h3 className="font-bold text-base text-white">Dictamen de Baja ({selectedAssetIds.size} equipos)</h3>
              </div>
              <button onClick={() => setShowBulkRetireModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs sm:text-sm">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Procedimiento de Baja Técnica Oficial</span>
                </p>
                <p>
                  Esta operación cambiará el estado de los <strong>{selectedAssetIds.size}</strong> equipos a <strong>"baja"</strong> y su condición a <strong>"obsoleto"</strong>. Se desvinculará cualquier colaborador asignado.
                </p>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1.5">Motivo o Justificación Técnica de la Baja *</label>
                <textarea
                  rows={3}
                  value={bulkRetireReason}
                  onChange={(e) => setBulkRetireReason(e.target.value)}
                  placeholder="Ej. Obsolescencia tecnológica, daño irreparable en tarjeta madre o fin de ciclo contable de vida útil."
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-medium text-slate-900 focus:ring-2 focus:ring-[#ff8200]/20 focus:border-[#ff8200] outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowBulkRetireModal(false)}
                  disabled={isBulkExecuting}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleExecuteBulkRetire}
                  disabled={isBulkExecuting}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold cursor-pointer shadow-md flex items-center gap-1.5 disabled:opacity-50"
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>{isBulkExecuting ? 'Aplicando Baja...' : `Confirmar Baja de ${selectedAssetIds.size} Equipos`}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Permanent Delete Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-rose-900 text-white flex items-center justify-between">
              <div>
                <p className="text-xs text-rose-200 font-mono font-bold uppercase">Eliminación Masiva Definitiva</p>
                <h3 className="font-bold text-base text-white">Eliminar {selectedAssetIds.size} Equipos</h3>
              </div>
              <button onClick={() => setShowBulkDeleteModal(false)} className="text-rose-200 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs sm:text-sm">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>¡Advertencia de Acción Irreversible!</span>
                </p>
                <p>
                  Estás a punto de borrar permanentemente <strong>{selectedAssetIds.size}</strong> equipos del inventario y de la base de datos de Google Cloud Firestore.
                </p>
                <p className="text-slate-600 pt-1 font-mono text-[11px]">
                  Nota de seguridad: Los equipos que estén actualmente asignados a colaboradores no podrán eliminarse hasta registrar su devolución a almacén.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowBulkDeleteModal(false)}
                  disabled={isBulkExecuting}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleExecuteBulkDelete}
                  disabled={isBulkExecuting}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer shadow-md flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{isBulkExecuting ? 'Eliminando...' : `Eliminar ${selectedAssetIds.size} Definitivamente`}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
