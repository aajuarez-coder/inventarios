import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  APIProvider, 
  Map, 
  AdvancedMarker, 
  Pin, 
  InfoWindow, 
  useMap,
  ControlPosition,
  MapControl
} from '@vis.gl/react-google-maps';
import { useInventory } from '../context/InventoryContext';
import { Branch, HardwareAsset, Transfer, AssetCategory, AssetStatus } from '../types/inventory';
import { 
  Building2, 
  Truck, 
  Laptop, 
  Server, 
  Monitor, 
  Network, 
  MapPin, 
  Navigation, 
  Search, 
  Filter, 
  Layers, 
  DollarSign, 
  Phone, 
  User, 
  Crosshair, 
  Maximize2, 
  RotateCcw, 
  Info, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  Map as MapIcon,
  Wifi,
  Sparkles
} from 'lucide-react';
import { formatCurrency, formatDate, calculateDistanceKm, getStatusBadge } from '../utils/formatters';

interface GeolocationModuleProps {
  onOpenAssetDetail?: (assetId: string) => void;
  onOpenTransferModal?: (asset?: HardwareAsset) => void;
  preselectedAssetId?: string | null;
  preselectedBranchId?: string | null;
}

// Fallback Google Maps API Key provided in environment or configuration
const GOOGLE_MAPS_API_KEY = 
  (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) || 
  'AIzaSyDgOgyv812j6uSpT_WsLsEUfS-5HdSk1JI';

// Default center of Mexico
const DEFAULT_CENTER = { lat: 23.6345, lng: -102.5528 };
const DEFAULT_ZOOM = 5;

// Component to programmatically manipulate map camera (pan, zoom)
const MapCameraController: React.FC<{
  targetCoords: { lat: number; lng: number } | null;
  targetZoom?: number;
}> = ({ targetCoords, targetZoom }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !targetCoords) return;
    map.panTo(targetCoords);
    if (targetZoom) {
      map.setZoom(targetZoom);
    }
  }, [map, targetCoords, targetZoom]);

  return null;
};

// Component to draw connection lines between branches for transfers
const TransferPolyline: React.FC<{
  path: Array<{ lat: number; lng: number }>;
  color?: string;
}> = ({ path, color = '#6366f1' }) => {
  const map = useMap();

  useEffect(() => {
    const googleMaps = (window as any).google?.maps;
    if (!map || !googleMaps || path.length < 2) return;

    const polyline = new googleMaps.Polyline({
      path,
      geodesic: true,
      strokeColor: color,
      strokeOpacity: 0.85,
      strokeWeight: 3.5,
      map
    });

    return () => {
      polyline.setMap(null);
    };
  }, [map, path, color]);

  return null;
};

export const GeolocationModule: React.FC<GeolocationModuleProps> = ({
  onOpenAssetDetail,
  onOpenTransferModal,
  preselectedAssetId,
  preselectedBranchId
}) => {
  const { branches, assets, transfers, employees, canEdit, currentUser } = useInventory();

  // Filters state
  const [selectedBranchId, setSelectedBranchId] = useState<string>(preselectedBranchId || 'all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAssetMarkers, setShowAssetMarkers] = useState<boolean>(true);
  const [showTransferRoutes, setShowTransferRoutes] = useState<boolean>(true);
  
  // Selection and InfoWindow State
  const [activeBranchInfoWindow, setActiveBranchInfoWindow] = useState<Branch | null>(null);
  const [activeAssetInfoWindow, setActiveAssetInfoWindow] = useState<HardwareAsset | null>(null);
  const [activeTransferInfoWindow, setActiveTransferInfoWindow] = useState<Transfer | null>(null);

  // Camera Target
  const [cameraTarget, setCameraTarget] = useState<{ lat: number; lng: number } | null>(null);
  const [cameraZoom, setCameraZoom] = useState<number>(DEFAULT_ZOOM);

  // User Geolocation (GPS / Network / Corporate Sede)
  interface GpsNotice {
    type: 'success' | 'info' | 'corporate';
    title: string;
    message: string;
    method: 'gps' | 'network' | 'corporate_branch';
    locationName?: string;
  }
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState<boolean>(false);
  const [gpsNotice, setGpsNotice] = useState<GpsNotice | null>(null);

  // Sidebar / list toggle
  const [activeTab, setActiveTab] = useState<'sedes' | 'equipos' | 'traslados'>('sedes');

  // On mount or preselection change
  useEffect(() => {
    if (preselectedBranchId) {
      const b = branches.find(item => item.id === preselectedBranchId);
      if (b) {
        setSelectedBranchId(b.id);
        setCameraTarget({ lat: b.latitude, lng: b.longitude });
        setCameraZoom(13);
        setActiveBranchInfoWindow(b);
      }
    }
  }, [preselectedBranchId, branches]);

  useEffect(() => {
    if (preselectedAssetId) {
      const a = assets.find(item => item.id === preselectedAssetId);
      if (a) {
        const br = branches.find(b => b.id === a.branchId);
        const lat = a.latitude || br?.latitude || 19.4270;
        const lng = a.longitude || br?.longitude || -99.1677;
        setCameraTarget({ lat, lng });
        setCameraZoom(15);
        setActiveAssetInfoWindow(a);
        setShowAssetMarkers(true);
      }
    }
  }, [preselectedAssetId, assets, branches]);

  // Compute deterministic coordinate for each asset based on its branch so they don't stack directly on top
  const assetsWithCoords = useMemo(() => {
    return assets.map((asset, index) => {
      const branch = branches.find(b => b.id === asset.branchId);
      const baseLat = branch ? branch.latitude : 19.4270;
      const baseLng = branch ? branch.longitude : -99.1677;

      // Deterministic pseudo-offset around branch campus (within ~200-500 meters)
      // Uses asset ID hash
      let hash = 0;
      for (let i = 0; i < asset.id.length; i++) {
        hash = (hash << 5) - hash + asset.id.charCodeAt(i);
        hash |= 0;
      }
      const angle = (Math.abs(hash) % 360) * (Math.PI / 180);
      const radius = 0.0015 + ((Math.abs(hash) % 10) * 0.0004); // ~150m to ~500m

      const lat = asset.latitude ?? (baseLat + Math.sin(angle) * radius);
      const lng = asset.longitude ?? (baseLng + Math.cos(angle) * radius);

      return {
        ...asset,
        calculatedLat: lat,
        calculatedLng: lng,
        branchName: branch ? branch.name : 'Sede Desconocida',
        branchCity: branch ? branch.city : 'Sin ciudad'
      };
    });
  }, [assets, branches]);

  // Filtered assets
  const filteredAssets = useMemo(() => {
    return assetsWithCoords.filter(asset => {
      // Branch filter
      if (selectedBranchId !== 'all' && asset.branchId !== selectedBranchId) {
        return false;
      }
      // Category filter
      if (selectedCategory !== 'all' && asset.category !== selectedCategory) {
        return false;
      }
      // Status filter
      if (selectedStatus !== 'all' && asset.status !== selectedStatus) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const emp = employees.find(e => e.id === asset.assignedToEmployeeId);
        const matchTag = asset.assetTag.toLowerCase().includes(q);
        const matchModel = asset.model.toLowerCase().includes(q);
        const matchSerial = asset.serialNumber.toLowerCase().includes(q);
        const matchBranch = asset.branchName.toLowerCase().includes(q);
        const matchEmp = emp?.fullName.toLowerCase().includes(q);
        if (!matchTag && !matchModel && !matchSerial && !matchBranch && !matchEmp) {
          return false;
        }
      }
      return true;
    });
  }, [assetsWithCoords, selectedBranchId, selectedCategory, selectedStatus, searchQuery, employees]);

  // In-transit transfers
  const activeTransfers = useMemo(() => {
    return transfers.filter(t => t.status === 'en_transito');
  }, [transfers]);

  // KPIs
  const totalValuation = useMemo(() => {
    return assets.reduce((sum, a) => sum + (a.purchaseCost || 0), 0);
  }, [assets]);

  const activeInTransitCount = useMemo(() => {
    return assets.filter(a => a.status === 'traslado').length;
  }, [assets]);

  // Fallback resolver when browser hardware GPS is restricted by permissions policy or unavailable
  const locateByNetworkOrCorporateBranch = useCallback(async (reasonText?: string) => {
    // 1. Attempt location estimation via backend IP resolver
    try {
      const res = await fetch('/api/geolocation/lookup');
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data.lat === 'number' && typeof data.lng === 'number') {
          const coords = { lat: data.lat, lng: data.lng };
          setUserLocation(coords);
          setCameraTarget(coords);
          setCameraZoom(13);

          if (data.method === 'ip') {
            setGpsNotice({
              type: 'info',
              title: `Ubicación estimada por Red IP (${data.city}, ${data.state})`,
              message: `Posición aproximada detectada mediante conexión de red corporativa. El sensor GPS de hardware está restringido en este visor web seguro/iframe.`,
              method: 'network',
              locationName: `${data.city}, ${data.state}`
            });
            return;
          }
        }
      }
    } catch (e) {
      console.info('[Geolocation] Lookup endpoint bypassed:', e);
    }

    // 2. Fallback to user's assigned corporate branch or Matriz Corporativa Mazatlán
    const userEmp = employees.find(e => e.email?.toLowerCase() === currentUser?.email?.toLowerCase());
    const userBranch = 
      branches.find(b => b.id === userEmp?.branchId) ||
      branches.find(b => currentUser?.branchName && b.name.toLowerCase().includes(currentUser.branchName.toLowerCase())) ||
      branches.find(b => b.code.includes('MZT')) || 
      branches.find(b => b.isMainWarehouse) ||
      branches[0];

    if (userBranch) {
      const coords = { lat: userBranch.latitude, lng: userBranch.longitude };
      setUserLocation(coords);
      setCameraTarget(coords);
      setCameraZoom(14);
      setActiveBranchInfoWindow(userBranch);
      setSelectedBranchId(userBranch.id);
      setGpsNotice({
        type: 'corporate',
        title: `Centrado en ${userBranch.name} (${userBranch.city})`,
        message: `La directiva de seguridad del navegador iframe restringe el GPS físico. Se ubicó y enfocó automáticamente su sede corporativa de adscripción.`,
        method: 'corporate_branch',
        locationName: `${userBranch.name} - ${userBranch.city}`
      });
    }
  }, [branches, employees, currentUser]);

  // Request browser geolocation with seamless graceful fallback
  const handleGetMyLocation = useCallback(() => {
    setGpsLoading(true);
    setGpsNotice(null);

    // If geolocation is missing completely
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      locateByNetworkOrCorporateBranch('Navegador sin sensor GPS')
        .finally(() => setGpsLoading(false));
      return;
    }

    let responded = false;
    const fallbackTimer = setTimeout(() => {
      if (!responded) {
        responded = true;
        locateByNetworkOrCorporateBranch('Tiempo de espera GPS')
          .finally(() => setGpsLoading(false));
      }
    }, 3500);

    try {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (responded) return;
          responded = true;
          clearTimeout(fallbackTimer);
          const coords = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          };
          setUserLocation(coords);
          setCameraTarget(coords);
          setCameraZoom(14);
          setGpsLoading(false);
          setGpsNotice({
            type: 'success',
            title: 'Ubicación GPS precisa detectada',
            message: 'Se ha ubicado su posición física mediante el sensor del dispositivo.',
            method: 'gps',
            locationName: 'Coordenadas GPS Dispositivo'
          });
        },
        (err) => {
          if (responded) return;
          responded = true;
          clearTimeout(fallbackTimer);
          console.info('[Geolocation] Hardware GPS restricted by permissions policy:', err.message);
          // Never display "Geolocation has been disabled in this document by permissions policy"
          // Smoothly fall back to IP / Corporate Headquarters
          locateByNetworkOrCorporateBranch(err.message)
            .finally(() => setGpsLoading(false));
        },
        { enableHighAccuracy: false, timeout: 3000, maximumAge: 60000 }
      );
    } catch (e: any) {
      if (responded) return;
      responded = true;
      clearTimeout(fallbackTimer);
      locateByNetworkOrCorporateBranch(e?.message || 'Error de permisos')
        .finally(() => setGpsLoading(false));
    }
  }, [locateByNetworkOrCorporateBranch]);

  const handleResetCamera = () => {
    setCameraTarget(DEFAULT_CENTER);
    setCameraZoom(DEFAULT_ZOOM);
    setSelectedBranchId('all');
    setActiveBranchInfoWindow(null);
    setActiveAssetInfoWindow(null);
    setActiveTransferInfoWindow(null);
    setGpsNotice(null);
  };

  const handleFocusBranch = (branch: Branch) => {
    setCameraTarget({ lat: branch.latitude, lng: branch.longitude });
    setCameraZoom(13);
    setActiveBranchInfoWindow(branch);
    setActiveAssetInfoWindow(null);
  };

  const handleFocusAsset = (asset: typeof assetsWithCoords[0]) => {
    setCameraTarget({ lat: asset.calculatedLat, lng: asset.calculatedLng });
    setCameraZoom(16);
    setActiveAssetInfoWindow(asset);
    setActiveBranchInfoWindow(null);
    setShowAssetMarkers(true);
  };

  // Helper for category pin colors
  const getCategoryColor = (cat: AssetCategory) => {
    switch (cat) {
      case 'laptop': return '#2563eb'; // Blue
      case 'servidor': return '#7c3aed'; // Purple
      case 'desktop': return '#0891b2'; // Cyan
      case 'redes': return '#d97706'; // Amber
      case 'monitor': return '#059669'; // Emerald
      case 'tablet': return '#4f46e5'; // Indigo
      default: return '#475569';
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Top Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <MapPin className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Geolocalización & Mapa de Activos TI
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200">
                  Google Maps Live
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Supervisión geográfica en tiempo real de sucursales, flota de cómputo corporativo y rutas logísticas de traslado.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleGetMyLocation}
            disabled={gpsLoading}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Localizar posición mediante GPS, Red o Sede Corporativa"
          >
            <Crosshair className={`w-3.5 h-3.5 text-indigo-600 ${gpsLoading ? 'animate-spin' : ''}`} />
            <span>{gpsLoading ? 'Localizando...' : 'Mi Ubicación'}</span>
          </button>

          <button
            onClick={() => locateByNetworkOrCorporateBranch('Selección directa de sede')}
            className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer border border-indigo-200/60"
            title="Centrar mapa en su Sede Corporativa de Adscripción"
          >
            <Building2 className="w-3.5 h-3.5 text-indigo-600" />
            <span>Mi Sede</span>
          </button>

          <button
            onClick={handleResetCamera}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Centrar mapa en México completo"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Panorama Nacional</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-medium text-slate-400 block truncate">Sedes Conectadas</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold text-slate-900">{branches.length}</span>
              <span className="text-[10px] text-emerald-600 font-medium">República Mexicana</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <Laptop className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-medium text-slate-400 block truncate">Equipos Geolocalizados</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold text-slate-900">{filteredAssets.length}</span>
              <span className="text-[10px] text-slate-500 font-mono">/ {assets.length} tot.</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-medium text-slate-400 block truncate">Activos en Traslado</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold text-purple-700">{activeInTransitCount}</span>
              <span className="text-[10px] text-purple-600 font-medium">en ruta interestatal</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-medium text-slate-400 block truncate">Inversión en Sedes</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-bold text-slate-900 truncate">
                {formatCurrency(totalValuation)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Search Input */}
          <div className="relative min-w-[180px] sm:min-w-[220px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar placa, serie, modelo o colaborador..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-slate-50/50"
            />
          </div>

          {/* Sede Selector */}
          <div className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedBranchId}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedBranchId(val);
                if (val !== 'all') {
                  const b = branches.find(item => item.id === val);
                  if (b) {
                    setCameraTarget({ lat: b.latitude, lng: b.longitude });
                    setCameraZoom(13);
                    setActiveBranchInfoWindow(b);
                  }
                }
              }}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Todas las Sedes ({branches.length})</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.city} - {b.name}</option>
              ))}
            </select>
          </div>

          {/* Category Selector */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Todas las Categorías</option>
            <option value="laptop">Laptops</option>
            <option value="desktop">Desktops</option>
            <option value="servidor">Servidores</option>
            <option value="redes">Redes & Switches</option>
            <option value="monitor">Monitores</option>
            <option value="tablet">Tablets</option>
          </select>

          {/* Status Selector */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Todos los Estados</option>
            <option value="asignado">Asignados</option>
            <option value="disponible">En Almacén / Disponibles</option>
            <option value="mantenimiento">En Mantenimiento</option>
            <option value="traslado">En Traslado</option>
          </select>
        </div>

        {/* Layer Toggles */}
        <div className="flex items-center gap-3 border-t sm:border-t-0 sm:border-l border-slate-200 pt-2 sm:pt-0 sm:pl-3">
          <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 font-medium select-none">
            <input
              type="checkbox"
              checked={showAssetMarkers}
              onChange={(e) => setShowAssetMarkers(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            <span>Pines de Equipos</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 font-medium select-none">
            <input
              type="checkbox"
              checked={showTransferRoutes}
              onChange={(e) => setShowTransferRoutes(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            <span>Rutas Traslados</span>
          </label>
        </div>
      </div>

      {gpsNotice && (
        <div className={`p-3.5 rounded-2xl border text-xs flex items-start justify-between gap-3 animate-in fade-in transition-all ${
          gpsNotice.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
            : gpsNotice.type === 'corporate'
            ? 'bg-amber-50/80 border-amber-200 text-amber-950'
            : 'bg-indigo-50 border-indigo-200 text-indigo-950'
        }`}>
          <div className="flex items-start gap-2.5">
            {gpsNotice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            ) : gpsNotice.type === 'corporate' ? (
              <Building2 className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            ) : (
              <Wifi className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
            )}
            <div>
              <div className="font-bold text-[13px] flex items-center gap-2 flex-wrap">
                <span>{gpsNotice.title}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/80 border border-current/20 font-semibold uppercase">
                  {gpsNotice.method === 'gps' ? 'GPS Dispositivo' : gpsNotice.method === 'network' ? 'Red IP' : 'Sede Corporativa'}
                </span>
              </div>
              <p className="mt-0.5 text-slate-600 leading-relaxed">
                {gpsNotice.message}
              </p>
            </div>
          </div>
          <button 
            onClick={() => setGpsNotice(null)} 
            className="text-slate-400 hover:text-slate-700 font-bold p-1 cursor-pointer transition-colors"
            title="Cerrar aviso"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Map & Interactive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Google Map Box (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-2 shadow-xs flex flex-col h-[600px] min-h-[550px]">
          <div className="relative w-full h-full rounded-xl overflow-hidden bg-slate-100">
            <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
              <Map
                mapId="DEMO_MAP_ID"
                defaultCenter={DEFAULT_CENTER}
                defaultZoom={DEFAULT_ZOOM}
                gestureHandling="greedy"
                disableDefaultUI={false}
                internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                style={{ width: '100%', height: '100%' }}
              >
                <MapCameraController targetCoords={cameraTarget} targetZoom={cameraZoom} />

                {/* Sede Quick Jump Buttons inside Map */}
                <MapControl position={ControlPosition.TOP_LEFT}>
                  <div className="m-2.5 bg-white/95 backdrop-blur-xs p-1.5 rounded-xl shadow-md border border-slate-200 flex items-center gap-1 text-[11px] font-semibold text-slate-700 overflow-x-auto max-w-[calc(100vw-60px)]">
                    <span className="px-2 text-slate-400 uppercase tracking-wider text-[9px] font-bold shrink-0">
                      Sedes TI:
                    </span>
                    {branches.map(b => (
                      <button
                        key={b.id}
                        onClick={() => handleFocusBranch(b)}
                        className={`px-2.5 py-1 rounded-lg transition-colors shrink-0 cursor-pointer ${
                          selectedBranchId === b.id
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        {b.city}
                      </button>
                    ))}
                  </div>
                </MapControl>

                {/* Branch Markers */}
                {branches.map(branch => {
                  const branchAssets = assets.filter(a => a.branchId === branch.id);
                  const isSelected = selectedBranchId === branch.id;

                  return (
                    <AdvancedMarker
                      key={`branch-${branch.id}`}
                      position={{ lat: branch.latitude, lng: branch.longitude }}
                      onClick={() => {
                        setActiveBranchInfoWindow(branch);
                        setActiveAssetInfoWindow(null);
                        setSelectedBranchId(branch.id);
                      }}
                      title={`${branch.name} - ${branch.city}`}
                    >
                      <div className="group relative flex flex-col items-center cursor-pointer transition-transform hover:scale-110">
                        <div className={`px-2.5 py-1.5 rounded-xl shadow-lg border-2 flex items-center gap-1.5 ${
                          branch.isMainWarehouse 
                            ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white border-amber-300' 
                            : isSelected
                            ? 'bg-indigo-600 text-white border-white ring-4 ring-indigo-300'
                            : 'bg-slate-900 text-white border-slate-700'
                        }`}>
                          <Building2 className="w-3.5 h-3.5" />
                          <span className="font-bold text-[11px] whitespace-nowrap">{branch.city}</span>
                          <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px] font-mono font-bold">
                            {branchAssets.length}
                          </span>
                        </div>
                        <div className="w-2 h-2 bg-slate-900 rotate-45 -mt-1 shadow-xs" />
                      </div>
                    </AdvancedMarker>
                  );
                })}

                {/* Individual Equipment Markers (if enabled) */}
                {showAssetMarkers && filteredAssets.map(asset => {
                  const color = getCategoryColor(asset.category);
                  const isSelected = activeAssetInfoWindow?.id === asset.id;

                  return (
                    <AdvancedMarker
                      key={`asset-${asset.id}`}
                      position={{ lat: asset.calculatedLat, lng: asset.calculatedLng }}
                      onClick={() => {
                        setActiveAssetInfoWindow(asset);
                        setActiveBranchInfoWindow(null);
                      }}
                      title={`${asset.assetTag}: ${asset.brand} ${asset.model}`}
                    >
                      <div className={`cursor-pointer transition-transform hover:scale-125 ${
                        isSelected ? 'scale-125 z-30 ring-4 ring-indigo-400 rounded-full' : 'z-10'
                      }`}>
                        <Pin
                          background={color}
                          borderColor="#ffffff"
                          glyphColor="#ffffff"
                          scale={0.8}
                        />
                      </div>
                    </AdvancedMarker>
                  );
                })}

                {/* Transfer Routes Polylines & In-Transit Truck Markers */}
                {showTransferRoutes && activeTransfers.map(trf => {
                  const source = branches.find(b => b.id === trf.sourceBranchId);
                  const target = branches.find(b => b.id === trf.targetBranchId);

                  if (!source || !target) return null;

                  const midLat = (source.latitude + target.latitude) / 2;
                  const midLng = (source.longitude + target.longitude) / 2;

                  return (
                    <React.Fragment key={`trf-route-${trf.id}`}>
                      {/* Connection Route */}
                      <TransferPolyline
                        path={[
                          { lat: source.latitude, lng: source.longitude },
                          { lat: target.latitude, lng: target.longitude }
                        ]}
                        color="#8b5cf6"
                      />

                      {/* In Transit Marker */}
                      <AdvancedMarker
                        position={{ lat: midLat, lng: midLng }}
                        onClick={() => {
                          setActiveTransferInfoWindow(trf);
                          setActiveBranchInfoWindow(null);
                          setActiveAssetInfoWindow(null);
                        }}
                        title={`En tránsito: ${trf.folio} (${source.city} -> ${target.city})`}
                      >
                        <div className="bg-purple-600 text-white p-1.5 rounded-full shadow-lg border-2 border-white animate-bounce cursor-pointer flex items-center justify-center">
                          <Truck className="w-4 h-4" />
                        </div>
                      </AdvancedMarker>
                    </React.Fragment>
                  );
                })}

                {/* User Current GPS Location Marker */}
                {userLocation && (
                  <AdvancedMarker
                    position={userLocation}
                    title="Tu Ubicación Actual"
                  >
                    <div className="relative flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-blue-500/30 animate-ping absolute" />
                      <div className="w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-md relative z-10" />
                    </div>
                  </AdvancedMarker>
                )}

                {/* InfoWindow for Selected Branch */}
                {activeBranchInfoWindow && (
                  <InfoWindow
                    position={{
                      lat: activeBranchInfoWindow.latitude,
                      lng: activeBranchInfoWindow.longitude
                    }}
                    onCloseClick={() => setActiveBranchInfoWindow(null)}
                  >
                    <div className="p-2 max-w-xs text-slate-900 text-xs font-sans">
                      <div className="flex items-center gap-2 border-b border-slate-100 pb-2 mb-2">
                        <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-mono text-[10px] text-indigo-600 font-bold block">
                            {activeBranchInfoWindow.code}
                          </span>
                          <h4 className="font-bold text-slate-900 leading-tight">
                            {activeBranchInfoWindow.name}
                          </h4>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-[11px] text-slate-600 mb-3">
                        <p className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{activeBranchInfoWindow.address}, {activeBranchInfoWindow.city}</span>
                        </p>
                        <p className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>Responsable: <strong>{activeBranchInfoWindow.managerName}</strong></span>
                        </p>
                        <p className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{activeBranchInfoWindow.phone}</span>
                        </p>
                      </div>

                      {/* Stock stats */}
                      {(() => {
                        const branchAssets = assets.filter(a => a.branchId === activeBranchInfoWindow.id);
                        const assigned = branchAssets.filter(a => a.status === 'asignado').length;
                        const available = branchAssets.filter(a => a.status === 'disponible').length;
                        const valuation = branchAssets.reduce((sum, a) => sum + (a.purchaseCost || 0), 0);

                        return (
                          <div className="bg-slate-50 p-2 rounded-lg border border-slate-200/80 mb-2.5">
                            <div className="flex justify-between items-center text-[10px] text-slate-500 mb-1">
                              <span>Total Equipos: <strong>{branchAssets.length}</strong></span>
                              <span>Valor: <strong className="text-emerald-700">{formatCurrency(valuation)}</strong></span>
                            </div>
                            <div className="grid grid-cols-2 gap-1 text-[10px]">
                              <span className="bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded font-medium">
                                {assigned} asignados
                              </span>
                              <span className="bg-blue-50 text-blue-800 px-1.5 py-0.5 rounded font-medium">
                                {available} en almacén
                              </span>
                            </div>
                          </div>
                        );
                      })()}

                      <button
                        onClick={() => {
                          setSelectedBranchId(activeBranchInfoWindow.id);
                          setActiveTab('equipos');
                        }}
                        className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-center transition-colors text-[11px] cursor-pointer flex items-center justify-center gap-1"
                      >
                        <span>Ver lista de equipos de esta sede</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </InfoWindow>
                )}

                {/* InfoWindow for Selected Asset */}
                {activeAssetInfoWindow && (
                  <InfoWindow
                    position={{
                      lat: (activeAssetInfoWindow as any).calculatedLat || activeAssetInfoWindow.latitude || 19.4270,
                      lng: (activeAssetInfoWindow as any).calculatedLng || activeAssetInfoWindow.longitude || -99.1677
                    }}
                    onCloseClick={() => setActiveAssetInfoWindow(null)}
                  >
                    <div className="p-2 max-w-xs text-slate-900 text-xs font-sans">
                      <div className="flex items-center gap-2 border-b border-slate-100 pb-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                          {activeAssetInfoWindow.category === 'servidor' ? (
                            <Server className="w-4 h-4" />
                          ) : (
                            <Laptop className="w-4 h-4" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 font-bold">
                            {activeAssetInfoWindow.assetTag}
                          </span>
                          <h4 className="font-bold text-slate-900 text-xs truncate">
                            {activeAssetInfoWindow.brand} {activeAssetInfoWindow.model}
                          </h4>
                        </div>
                      </div>

                      <div className="space-y-1 text-[11px] text-slate-600 mb-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Estado:</span>
                          <span className="font-semibold capitalize text-slate-800">
                            {activeAssetInfoWindow.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Sede:</span>
                          <span className="font-medium text-slate-800">
                            {branches.find(b => b.id === activeAssetInfoWindow.branchId)?.city || 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Ubicación física:</span>
                          <span className="font-medium text-slate-800 truncate max-w-[140px]" title={activeAssetInfoWindow.locationDetails}>
                            {activeAssetInfoWindow.locationDetails}
                          </span>
                        </div>

                        {activeAssetInfoWindow.assignedToEmployeeId && (
                          <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                            <span className="text-slate-400">Asignado a:</span>
                            <span className="font-bold text-indigo-900 truncate max-w-[140px]">
                              {employees.find(e => e.id === activeAssetInfoWindow.assignedToEmployeeId)?.fullName || 'Colaborador'}
                            </span>
                          </div>
                        )}

                        {activeAssetInfoWindow.specs.ipAddress && (
                          <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                            <span>IP Asignada:</span>
                            <span>{activeAssetInfoWindow.specs.ipAddress}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        {onOpenAssetDetail && (
                          <button
                            onClick={() => onOpenAssetDetail(activeAssetInfoWindow.id)}
                            className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-center transition-colors text-[10px] cursor-pointer flex items-center justify-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Ficha Técnica</span>
                          </button>
                        )}
                        {canEdit && onOpenTransferModal && (
                          <button
                            onClick={() => onOpenTransferModal(activeAssetInfoWindow)}
                            className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg transition-colors text-[10px] cursor-pointer flex items-center justify-center gap-1"
                            title="Despachar traslado a otra sede"
                          >
                            <Truck className="w-3 h-3" />
                            <span>Trasladar</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </InfoWindow>
                )}

                {/* InfoWindow for Active In-Transit Transfer */}
                {activeTransferInfoWindow && (
                  <InfoWindow
                    position={{
                      lat: (branches.find(b => b.id === activeTransferInfoWindow.sourceBranchId)?.latitude || 19.4) * 0.5 + 
                           (branches.find(b => b.id === activeTransferInfoWindow.targetBranchId)?.latitude || 32.5) * 0.5,
                      lng: (branches.find(b => b.id === activeTransferInfoWindow.sourceBranchId)?.longitude || -99.1) * 0.5 + 
                           (branches.find(b => b.id === activeTransferInfoWindow.targetBranchId)?.longitude || -117.0) * 0.5
                    }}
                    onCloseClick={() => setActiveTransferInfoWindow(null)}
                  >
                    <div className="p-2 max-w-xs text-slate-900 text-xs font-sans">
                      <div className="flex items-center gap-2 border-b border-purple-100 pb-2 mb-2">
                        <div className="p-1.5 rounded-lg bg-purple-100 text-purple-700">
                          <Truck className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-mono text-[10px] font-bold text-purple-700">
                            {activeTransferInfoWindow.folio}
                          </span>
                          <h4 className="font-bold text-slate-900">
                            Traslado Interestatal en Ruta
                          </h4>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-[11px] text-slate-600 mb-2">
                        <div className="flex items-center gap-2 font-medium">
                          <span className="text-slate-800">
                            {branches.find(b => b.id === activeTransferInfoWindow.sourceBranchId)?.city}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-purple-600" />
                          <span className="text-slate-800">
                            {branches.find(b => b.id === activeTransferInfoWindow.targetBranchId)?.city}
                          </span>
                        </div>

                        <p className="text-[10px]">
                          Transportista: <strong>{activeTransferInfoWindow.carrier}</strong>
                        </p>
                        <p className="text-[10px] font-mono">
                          Guía: <strong>{activeTransferInfoWindow.trackingNumber}</strong>
                        </p>
                        <p className="text-[10px]">
                          Llegada estimada: <strong>{formatDate(activeTransferInfoWindow.estimatedArrival)}</strong>
                        </p>
                        <p className="text-[10px] text-slate-500">
                          Equipos a bordo: <strong>{activeTransferInfoWindow.assetIds.length} unidades</strong>
                        </p>
                      </div>
                    </div>
                  </InfoWindow>
                )}

              </Map>
            </APIProvider>
          </div>
        </div>

        {/* Side Panel: Directory & Filtered Items (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col h-[600px] min-h-[550px]">
          
          {/* Subtabs */}
          <div className="flex border-b border-slate-200 pb-2 mb-3 gap-1">
            <button
              onClick={() => setActiveTab('sedes')}
              className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'sedes' 
                  ? 'bg-indigo-600 text-white shadow-xs' 
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Sedes ({branches.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('equipos')}
              className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'equipos' 
                  ? 'bg-indigo-600 text-white shadow-xs' 
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Laptop className="w-3.5 h-3.5" />
              <span>Equipos ({filteredAssets.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('traslados')}
              className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'traslados' 
                  ? 'bg-indigo-600 text-white shadow-xs' 
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Rutas ({activeTransfers.length})</span>
            </button>
          </div>

          {/* Tab 1: Sedes Directory */}
          {activeTab === 'sedes' && (
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {branches.map(branch => {
                const branchAssets = assets.filter(a => a.branchId === branch.id);
                const isSelected = selectedBranchId === branch.id;
                const distance = userLocation ? calculateDistanceKm(
                  userLocation.lat,
                  userLocation.lng,
                  branch.latitude,
                  branch.longitude
                ) : null;

                return (
                  <div
                    key={branch.id}
                    className={`p-3 rounded-xl border transition-all ${
                      isSelected 
                        ? 'border-indigo-500 bg-indigo-50/50 shadow-xs ring-2 ring-indigo-200' 
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold text-slate-500">
                            {branch.code}
                          </span>
                          {branch.isMainWarehouse && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 font-bold">
                              Almacén Central
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-slate-900 text-xs mt-0.5">
                          {branch.name}
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          {branch.city}, {branch.state}
                        </p>
                      </div>

                      <button
                        onClick={() => handleFocusBranch(branch)}
                        className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors shrink-0 cursor-pointer"
                        title="Ver en el mapa"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-100">
                      <span className="text-slate-600 font-medium">
                        {branchAssets.length} equipos registrados
                      </span>
                      {distance !== null && (
                        <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-full">
                          a {distance} km de ti
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Tab 2: Equipos Filtered Directory */}
          {activeTab === 'equipos' && (
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {filteredAssets.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  <Laptop className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p>No se encontraron equipos con los filtros seleccionados.</p>
                </div>
              ) : (
                filteredAssets.map(asset => {
                  const emp = employees.find(e => e.id === asset.assignedToEmployeeId);
                  const isSelected = activeAssetInfoWindow?.id === asset.id;

                  return (
                    <div
                      key={asset.id}
                      className={`p-2.5 rounded-xl border text-xs transition-all ${
                        isSelected 
                          ? 'border-indigo-500 bg-indigo-50/50 shadow-xs' 
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded">
                              {asset.assetTag}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {asset.branchCity}
                            </span>
                          </div>
                          <h5 className="font-semibold text-slate-900 truncate mt-0.5">
                            {asset.brand} {asset.model}
                          </h5>
                          {emp && (
                            <p className="text-[11px] text-slate-500 truncate">
                              Custodia: <strong>{emp.fullName}</strong>
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleFocusAsset(asset)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                            title="Centrar en el mapa"
                          >
                            <Navigation className="w-3.5 h-3.5" />
                          </button>
                          {onOpenAssetDetail && (
                            <button
                              onClick={() => onOpenAssetDetail(asset.id)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                              title="Ver ficha técnica"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Tab 3: Active Transfer Routes */}
          {activeTab === 'traslados' && (
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {activeTransfers.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  <Truck className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p>No hay traslados activos en tránsito interestatal en este momento.</p>
                </div>
              ) : (
                activeTransfers.map(trf => {
                  const source = branches.find(b => b.id === trf.sourceBranchId);
                  const target = branches.find(b => b.id === trf.targetBranchId);

                  return (
                    <div
                      key={trf.id}
                      className="p-3 rounded-xl border border-purple-200 bg-purple-50/40 text-xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] font-bold text-purple-800">
                          {trf.folio}
                        </span>
                        <span className="text-[9px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full font-bold">
                          En Tránsito
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                        <span>{source?.city || 'Origen'}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-purple-600" />
                        <span>{target?.city || 'Destino'}</span>
                      </div>

                      <div className="text-[11px] text-slate-600 space-y-0.5">
                        <p>Paquetería: <strong>{trf.carrier}</strong></p>
                        <p className="font-mono text-[10px]">Guía: <strong>{trf.trackingNumber}</strong></p>
                        <p>Llegada estimada: <strong>{formatDate(trf.estimatedArrival)}</strong></p>
                        <p>Equipos: <strong>{trf.assetIds.length}</strong> unidades en ruta</p>
                      </div>

                      <button
                        onClick={() => {
                          if (source && target) {
                            const midLat = (source.latitude + target.latitude) / 2;
                            const midLng = (source.longitude + target.longitude) / 2;
                            setCameraTarget({ lat: midLat, lng: midLng });
                            setCameraZoom(7);
                            setActiveTransferInfoWindow(trf);
                            setShowTransferRoutes(true);
                          }
                        }}
                        className="w-full py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold text-[11px] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Navigation className="w-3 h-3" />
                        <span>Rastrear Ruta en Mapa</span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Footer of Side Panel */}
          <div className="pt-3 border-t border-slate-100 mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>GeoTI Petroil v2.0</span>
            </span>
            <span className="text-slate-400">
              {branches.length} Sedes Nacionales
            </span>
          </div>

        </div>

      </div>

    </div>
  );
};
