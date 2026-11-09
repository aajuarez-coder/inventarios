import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { 
  Package, 
  UserCheck, 
  Wrench, 
  DollarSign, 
  ShieldAlert, 
  AlertTriangle, 
  Truck, 
  ArrowUpRight, 
  Layers, 
  Laptop, 
  Server, 
  Printer, 
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  Sparkles,
  MapPin,
  Terminal,
  ShieldCheck,
  Monitor,
  Tablet,
  Cpu,
  PieChart as PieChartIcon,
  ChevronRight,
  TrendingUp,
  BarChart3,
  BadgeDollarSign,
  Wallet
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import { formatCurrency, formatDate, getWarrantyStatus, getMaintenanceStatus } from '../utils/formatters';
import { getExpectedOfficialCost } from '../utils/hardwareCosts';
import { TabId } from './Sidebar';

interface CustomDonutTooltipProps {
  active?: boolean;
  payload?: any[];
}

const CustomDonutTooltip: React.FC<CustomDonutTooltipProps> = ({ active, payload }) => {
  if (active && payload && payload.length > 0) {
    const data = payload[0].payload;
    return (
      <div className="bg-[#131a26] border border-slate-700/80 p-3 rounded-xl shadow-2xl text-xs z-50">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: data.color }} />
          <span className="font-bold text-white text-sm">{data.name}</span>
        </div>
        <div className="space-y-1 font-mono text-[11px]">
          <div className="flex justify-between gap-4 text-slate-300">
            <span>Cantidad:</span>
            <span className="text-white font-bold">{data.value} {data.value === 1 ? 'equipo' : 'equipos'}</span>
          </div>
          <div className="flex justify-between gap-4 text-slate-300">
            <span>Distribución:</span>
            <span className="text-[#ff8200] font-bold">{data.percentage}%</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

interface CustomCostTooltipProps {
  active?: boolean;
  payload?: any[];
}

const CustomCostTooltip: React.FC<CustomCostTooltipProps> = ({ active, payload }) => {
  if (active && payload && payload.length > 0) {
    const data = payload[0].payload;
    return (
      <div className="bg-[#131a26] border border-slate-700/80 p-3.5 rounded-xl shadow-2xl text-xs z-50 min-w-[220px]">
        <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-slate-700/60">
          <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: data.color }} />
          <span className="font-bold text-white text-sm">{data.name}</span>
        </div>
        <div className="space-y-1.5 font-mono text-[11px]">
          <div className="flex justify-between gap-4 text-slate-300">
            <span>Inversión Total:</span>
            <span className="text-emerald-400 font-bold">{formatCurrency(data.totalCost)}</span>
          </div>
          <div className="flex justify-between gap-4 text-slate-300">
            <span>Cantidad:</span>
            <span className="text-white font-bold">{data.count} {data.count === 1 ? 'unidad' : 'unidades'}</span>
          </div>
          <div className="flex justify-between gap-4 text-slate-300">
            <span>Costo Promedio:</span>
            <span className="text-[#ff8200] font-bold">{formatCurrency(data.avgCost)}/u</span>
          </div>
          <div className="flex justify-between gap-4 text-slate-300">
            <span>Participación:</span>
            <span className="text-cyan-400 font-bold">{data.percentage}% del capital</span>
          </div>
        </div>
        {data.tariffReference && (
          <div className="mt-2 pt-1.5 border-t border-slate-700/40 text-[10px] text-slate-400 font-sans leading-tight">
            <span className="text-slate-500 font-medium block">Tarifa Oficial:</span>
            <span>{data.tariffReference}</span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

interface DashboardProps {
  onNavigate: (tab: TabId) => void;
  onOpenAssetDetail: (assetId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate, onOpenAssetDetail }) => {
  const { assets, employees, assignments, branches, transfers, currentUser } = useInventory();

  // Metrics
  const totalAssets = assets.length;
  const assignedAssets = assets.filter(a => a.status === 'asignado');
  const availableStock = assets.filter(a => a.status === 'disponible');
  const inMaintenance = assets.filter(a => a.status === 'mantenimiento');
  const inTransfer = assets.filter(a => a.status === 'traslado');
  const retiredAssets = assets.filter(a => a.status === 'baja');

  // Cost helper calculating manual purchaseCost or official catalog tariff
  const getAssetCost = (a: any): number => {
    if (typeof a.purchaseCost === 'number' && a.purchaseCost > 0) return a.purchaseCost;
    const expected = getExpectedOfficialCost(a);
    return expected || 0;
  };

  const totalValuation = assets
    .filter(a => a.status !== 'baja')
    .reduce((sum, a) => sum + getAssetCost(a), 0);

  const [activeCategoryIndex, setActiveCategoryIndex] = useState<number | null>(null);
  const [activeCostIndex, setActiveCostIndex] = useState<number | null>(null);
  const [costViewMode, setCostViewMode] = useState<'donut' | 'bar'>('donut');
  const [graphicsDisplayTab, setGraphicsDisplayTab] = useState<'both' | 'costs' | 'assets'>('both');

  // Category breakdown config explicitly featuring: laptop, servidores, escritorio, monitor, tablet
  const categoryConfig: {
    key: string;
    name: string;
    color: string;
    icon: React.ComponentType<{ className?: string }>;
    description: string;
  }[] = [
    { key: 'laptop', name: 'Laptops', color: '#ff8200', icon: Laptop, description: 'Laptops y equipos móviles ejecutivos' },
    { key: 'servidor', name: 'Servidores', color: '#6366f1', icon: Server, description: 'Servidores de cómputo en rack y virtualización' },
    { key: 'desktop', name: 'Escritorio', color: '#004a99', icon: Cpu, description: 'Estaciones fijas de cómputo y módulos operativos' },
    { key: 'monitor', name: 'Monitores', color: '#06b6d4', icon: Monitor, description: 'Monitores de alta definición y displays externos' },
    { key: 'tablet', name: 'Tablets', color: '#10b981', icon: Tablet, description: 'Tablets corporativas e inspección de campo' },
  ];

  const tariffDescriptions: Record<string, string> = {
    laptop: 'Tarifa: HP $15,750 | ASUS $20,000-$21,500 | ThinkPad $24,500 | MSI $28,500',
    servidor: 'Tarifa oficial: $70,000 MXN',
    desktop: 'Tarifa oficial: $8,000 MXN',
    monitor: 'Tarifa oficial: $1,800 MXN',
    tablet: 'Tarifa oficial: $2,300 MXN'
  };

  const otherCategoriesCount = assets.filter(
    a => !['laptop', 'servidor', 'desktop', 'monitor', 'tablet'].includes(a.category)
  ).length;

  const donutData = [
    ...categoryConfig.map(cfg => {
      const count = assets.filter(a => a.category === cfg.key).length;
      return {
        key: cfg.key,
        name: cfg.name,
        value: count,
        color: cfg.color,
        icon: cfg.icon,
        description: cfg.description,
        percentage: totalAssets > 0 ? Math.round((count / totalAssets) * 100) : 0
      };
    }),
    ...(otherCategoriesCount > 0 ? [{
      key: 'otros',
      name: 'Otros Equipos',
      value: otherCategoriesCount,
      color: '#a855f7',
      icon: Layers,
      description: 'Impresoras multifuncionales y telecomunicaciones',
      percentage: totalAssets > 0 ? Math.round((otherCategoriesCount / totalAssets) * 100) : 0
    }] : [])
  ];

  const activeCategoryItem = activeCategoryIndex !== null ? donutData[activeCategoryIndex] : null;

  // Cost by category breakdown config
  const costDonutData = [
    ...categoryConfig.map(cfg => {
      const categoryAssets = assets.filter(a => a.category === cfg.key && a.status !== 'baja');
      const totalCost = categoryAssets.reduce((sum, a) => sum + getAssetCost(a), 0);
      const count = categoryAssets.length;
      const avgCost = count > 0 ? Math.round(totalCost / count) : 0;
      return {
        key: cfg.key,
        name: cfg.name,
        value: totalCost,
        totalCost,
        count,
        avgCost,
        color: cfg.color,
        icon: cfg.icon,
        description: cfg.description,
        tariffReference: tariffDescriptions[cfg.key] || '',
        percentage: totalValuation > 0 ? Number(((totalCost / totalValuation) * 100).toFixed(1)) : 0
      };
    }),
    ...(otherCategoriesCount > 0 ? [{
      key: 'otros',
      name: 'Otros Equipos',
      value: assets
        .filter(a => !['laptop', 'servidor', 'desktop', 'monitor', 'tablet'].includes(a.category) && a.status !== 'baja')
        .reduce((sum, a) => sum + getAssetCost(a), 0),
      totalCost: assets
        .filter(a => !['laptop', 'servidor', 'desktop', 'monitor', 'tablet'].includes(a.category) && a.status !== 'baja')
        .reduce((sum, a) => sum + getAssetCost(a), 0),
      count: otherCategoriesCount,
      avgCost: otherCategoriesCount > 0 ? Math.round(
        assets
          .filter(a => !['laptop', 'servidor', 'desktop', 'monitor', 'tablet'].includes(a.category) && a.status !== 'baja')
          .reduce((sum, a) => sum + getAssetCost(a), 0) / otherCategoriesCount
      ) : 0,
      color: '#a855f7',
      icon: Layers,
      description: 'Impresoras y telecomunicaciones',
      tariffReference: 'Costos registrados por compra',
      percentage: totalValuation > 0 ? Number(((
        assets
          .filter(a => !['laptop', 'servidor', 'desktop', 'monitor', 'tablet'].includes(a.category) && a.status !== 'baja')
          .reduce((sum, a) => sum + getAssetCost(a), 0) / totalValuation
      ) * 100).toFixed(1)) : 0
    }] : [])
  ];

  const activeCostItem = activeCostIndex !== null ? costDonutData[activeCostIndex] : null;
  const highestCostCategory = [...costDonutData].sort((a, b) => b.totalCost - a.totalCost)[0];

  // Category breakdown
  const categoryCounts = assets.reduce((acc, a) => {
    acc[a.category] = (acc[a.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Branch breakdown
  const branchCounts = branches.map(b => {
    const count = assets.filter(a => a.branchId === b.id && a.status !== 'baja').length;
    return { branch: b, count };
  });

  // Urgent alerts
  const warrantyUrgent = assets.filter(a => {
    const st = getWarrantyStatus(a.warrantyEndDate);
    return st.status === 'por_vencer' || st.status === 'vencida';
  });

  const maintenanceUrgent = assets.filter(a => {
    const st = getMaintenanceStatus(a.nextMaintenanceDate);
    return st.status === 'vencido' || st.status === 'proximo';
  });

  const utilizationRate = totalAssets > 0 
    ? Math.round((assignedAssets.length / (totalAssets - retiredAssets.length)) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      
      {/* Top Operations Header matching Variation 11 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-2 border-b border-[rgba(248,250,252,0.1)]">
        <div>
          <p className="label flex items-center gap-2">
            <span>Control de Operaciones TI</span>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#ff8200]" />
            <span>Mazatlán, Sin.</span>
          </p>
          <h2 className="font-syne text-2xl sm:text-3xl font-extrabold tracking-tight text-[#f8fafc] mt-1 uppercase">
            PANEL GENERAL DE ACTIVOS
          </h2>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigate('inventory')}
            className="btn-primary flex items-center gap-1.5"
          >
            <Package className="w-3.5 h-3.5" />
            <span>+ NUEVO EQUIPO</span>
          </button>
          <button
            onClick={() => onNavigate('assignments')}
            className="btn-petroil flex items-center gap-1.5"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>ASIGNAR</span>
          </button>
          <button
            onClick={() => onNavigate('reports')}
            className="px-3 py-2 rounded-[6px] bg-[#131a26] hover:bg-[#1c2738] border border-[rgba(248,250,252,0.1)] text-[#f8fafc] text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-[#ff8200]" />
            <span>REPORTES</span>
          </button>
          <button
            onClick={() => onNavigate('geolocation')}
            className="px-3 py-2 rounded-[6px] bg-[#131a26] hover:bg-[#1c2738] border border-[rgba(248,250,252,0.1)] text-[#f8fafc] text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <MapPin className="w-3.5 h-3.5 text-[#10b981]" />
            <span>MAPA TI</span>
          </button>
          <button
            onClick={() => onNavigate('agent-installation')}
            className="px-3 py-2 rounded-[6px] bg-[#131a26] hover:bg-[#1c2738] border border-[rgba(248,250,252,0.1)] text-[#f8fafc] text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span>AGENTE</span>
          </button>
        </div>
      </div>

      {/* 5-Column Industrial Stat Grid (Variation 11) */}
      <div className="stat-grid">
        <div className="stat-card border-l-4 border-l-[#004a99]">
          <p className="label">Total Equipos</p>
          <div className="value font-syne text-3xl sm:text-4xl">{totalAssets}</div>
          <p className="label" style={{ color: '#10b981' }}>{utilizationRate}% EN USO</p>
        </div>
        <div className="stat-card border-l-4 border-l-[#3b82f6]">
          <p className="label">Stock Almacén</p>
          <div className="value font-syne text-3xl sm:text-4xl">{availableStock.length}</div>
          <p className="label text-[#3b82f6]">DISPONIBLES</p>
        </div>
        <div className="stat-card border-l-4 border-l-[#10b981]">
          <p className="label">Asignados</p>
          <div className="value font-syne text-3xl sm:text-4xl">{assignedAssets.length}</div>
          <p className="label text-[#10b981]">EN CUSTODIA</p>
        </div>
        <div className="stat-card border-l-4 border-l-[#ff8200]">
          <p className="label">Mantenimiento</p>
          <div 
            className="value font-syne text-3xl sm:text-4xl" 
            style={{ color: inMaintenance.length > 0 ? '#ff8200' : 'inherit' }}
          >
            {inMaintenance.length}
          </div>
          <p className="label" style={{ color: inMaintenance.length > 0 ? '#ff8200' : 'var(--ink-faint)' }}>
            {inTransfer.length > 0 ? `+${inTransfer.length} TRASLADO` : 'REVISIÓN'}
          </p>
        </div>
        <div className="stat-card border-l-4 border-l-[#8b5cf6]">
          <p className="label">Valuación Activos</p>
          <div className="value font-syne text-2xl sm:text-3xl truncate">
            {formatCurrency(totalValuation)}
          </div>
          <p className="label text-[#8b5cf6]">ADQUISICIÓN</p>
        </div>
      </div>

      {/* Selector de Vistas Gráficas en Pantalla Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#131a26] border border-[rgba(248,250,252,0.12)] p-3 px-4 rounded-xl">
        <div className="flex items-center gap-2.5">
          <span className="p-1.5 rounded-lg bg-[#004a99]/20 text-[#004a99] border border-[#004a99]/40">
            <BarChart3 className="w-4 h-4 text-cyan-400" />
          </span>
          <div>
            <h4 className="text-xs font-bold text-white tracking-wide uppercase">
              Centro de Análisis Gráfico del Inventario
            </h4>
            <p className="text-[11px] text-slate-400">
              Visualización ejecutiva de volumen físico de equipos e inversión de capital por tipo de hardware
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-[#0a0e14] p-1 rounded-lg border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setGraphicsDisplayTab('both')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              graphicsDisplayTab === 'both'
                ? 'bg-[#004a99] text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Ambas Gráficas</span>
          </button>
          <button
            onClick={() => setGraphicsDisplayTab('costs')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              graphicsDisplayTab === 'costs'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Costos y Valuación</span>
          </button>
          <button
            onClick={() => setGraphicsDisplayTab('assets')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              graphicsDisplayTab === 'assets'
                ? 'bg-[#ff8200] text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <PieChartIcon className="w-3.5 h-3.5" />
            <span>Volumen de Activos</span>
          </button>
        </div>
      </div>

      {/* 1. Category Cost Distribution Donut / Bar Chart (Recharts) - Valuación Financiera por Tipo de Equipo */}
      {(graphicsDisplayTab === 'both' || graphicsDisplayTab === 'costs') && (
        <div className="panel border border-[rgba(248,250,252,0.16)] bg-[#131a26] p-5 sm:p-6 rounded-2xl shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[rgba(248,250,252,0.1)]">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <DollarSign className="w-4 h-4" />
                </span>
                <p className="label font-bold text-emerald-400">Valuación Financiera del Inventario</p>
              </div>
              <h3 className="font-syne text-lg sm:text-xl font-bold tracking-tight text-[#f8fafc] mt-1 uppercase">
                Distribución de Costos por Tipo de Equipo
              </h3>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                Gráfico con desglose del capital invertido en laptops, servidores, computadoras de escritorio, monitores y tablets.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
              {/* Toggle Donut vs Bar */}
              <div className="flex items-center bg-[#0a0e14] p-1 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setCostViewMode('donut')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                    costViewMode === 'donut'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Ver gráfico de anillos"
                >
                  <PieChartIcon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Anillos</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCostViewMode('bar')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                    costViewMode === 'bar'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Ver barras comparativas de costos"
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Barras</span>
                </button>
              </div>

              <button
                onClick={() => onNavigate('inventory')}
                className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-mono font-bold tracking-wider uppercase transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Ir al módulo de inventario para ver costos unitarios"
              >
                <span>Detalle de Costos</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* KPI Mini-bar: Total Valuation, Top Category, Average Cost per Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-[#0a0e14] border border-[rgba(248,250,252,0.08)] flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-mono font-semibold uppercase block">Inversión Activa Total</span>
                <span className="font-syne text-xl font-bold text-emerald-400 block">{formatCurrency(totalValuation)}</span>
              </div>
              <Wallet className="w-6 h-6 text-emerald-500/40" />
            </div>

            <div className="p-3.5 rounded-xl bg-[#0a0e14] border border-[rgba(248,250,252,0.08)] flex items-center justify-between">
              <div className="min-w-0">
                <span className="text-[10px] text-slate-400 font-mono font-semibold uppercase block">Mayor Inversión</span>
                <span className="font-syne text-sm sm:text-base font-bold text-white block truncate">
                  {highestCostCategory ? `${highestCostCategory.name} (${formatCurrency(highestCostCategory.totalCost)})` : 'N/A'}
                </span>
                <span className="text-[10px] text-slate-400 font-mono block">
                  {highestCostCategory ? `${highestCostCategory.percentage}% del capital activo` : ''}
                </span>
              </div>
              <TrendingUp className="w-6 h-6 text-[#ff8200]/40 shrink-0" />
            </div>

            <div className="p-3.5 rounded-xl bg-[#0a0e14] border border-[rgba(248,250,252,0.08)] flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-mono font-semibold uppercase block">Costo Promedio Global</span>
                <span className="font-syne text-xl font-bold text-cyan-400 block">
                  {formatCurrency(totalAssets > 0 ? Math.round(totalValuation / totalAssets) : 0)}
                  <span className="text-xs text-slate-400 font-normal"> /equipo</span>
                </span>
              </div>
              <BadgeDollarSign className="w-6 h-6 text-cyan-500/40" />
            </div>
          </div>

          {/* Chart + Cost Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Recharts Container */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center">
              <div className="relative w-full max-w-[280px] h-[270px] flex items-center justify-center">
                {costViewMode === 'donut' ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip content={<CustomCostTooltip />} />
                      <Pie
                        data={costDonutData.filter(d => d.totalCost > 0).length > 0 ? costDonutData.filter(d => d.totalCost > 0) : [{ key: 'empty', name: 'Sin costos', totalCost: 1, value: 1, color: '#334155', percentage: 0 }]}
                        cx="50%"
                        cy="50%"
                        innerRadius={72}
                        outerRadius={104}
                        paddingAngle={3}
                        dataKey="totalCost"
                        nameKey="name"
                        stroke="#131a26"
                        strokeWidth={3}
                        onMouseEnter={(_, index) => setActiveCostIndex(index)}
                        onMouseLeave={() => setActiveCostIndex(null)}
                      >
                        {(costDonutData.filter(d => d.totalCost > 0).length > 0 ? costDonutData.filter(d => d.totalCost > 0) : [{ key: 'empty', name: 'Sin costos', totalCost: 1, value: 1, color: '#334155', percentage: 0 }]).map((entry, index) => (
                          <Cell
                            key={`cost-${entry.key}`}
                            fill={entry.color}
                            opacity={activeCostIndex === null || activeCostIndex === index ? 1 : 0.35}
                            className="transition-all duration-300 cursor-pointer outline-hidden"
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={costDonutData.filter(d => d.totalCost > 0)}
                      layout="vertical"
                      margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                      <XAxis
                        type="number"
                        tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                        stroke="#64748b"
                        tick={{ fontSize: 10 }}
                      />
                      <YAxis
                        dataKey="name"
                        type="category"
                        stroke="#94a3b8"
                        tick={{ fontSize: 10, fill: '#f8fafc' }}
                        width={70}
                      />
                      <Tooltip content={<CustomCostTooltip />} />
                      <Bar
                        dataKey="totalCost"
                        radius={[0, 6, 6, 0]}
                        onMouseEnter={(_, index) => setActiveCostIndex(index)}
                        onMouseLeave={() => setActiveCostIndex(null)}
                      >
                        {costDonutData.filter(d => d.totalCost > 0).map((entry, index) => (
                          <Cell
                            key={`cost-bar-${entry.key}`}
                            fill={entry.color}
                            opacity={activeCostIndex === null || activeCostIndex === index ? 1 : 0.4}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}

                {/* Center Hub Indicator (Only in Donut mode) */}
                {costViewMode === 'donut' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center select-none px-3">
                    {activeCostItem ? (
                      <div className="animate-in fade-in zoom-in-95 duration-200">
                        <span className="font-syne text-xl sm:text-2xl font-black text-white tracking-tight leading-tight block truncate max-w-[140px]">
                          {formatCurrency(activeCostItem.totalCost)}
                        </span>
                        <span 
                          className="font-mono text-[10.5px] font-black uppercase tracking-wider block mt-1 truncate max-w-[130px]"
                          style={{ color: activeCostItem.color }}
                        >
                          {activeCostItem.name}
                        </span>
                        <span className="font-mono text-[10px] text-slate-300 font-bold block mt-0.5">
                          {activeCostItem.percentage}% del total
                        </span>
                        <span className="font-mono text-[9px] text-slate-400 block">
                          {activeCostItem.count} {activeCostItem.count === 1 ? 'equipo' : 'equipos'}
                        </span>
                      </div>
                    ) : (
                      <div>
                        <span className="font-syne text-lg sm:text-xl font-black text-emerald-400 tracking-tight leading-tight block">
                          {formatCurrency(totalValuation)}
                        </span>
                        <span className="font-mono text-[9.5px] text-slate-300 font-extrabold uppercase tracking-widest block mt-1">
                          VALUACIÓN TOTAL
                        </span>
                        <span className="font-mono text-[9px] text-[#ff8200] font-bold block mt-0.5">
                          {costDonutData.filter(d => d.totalCost > 0).length} CATEGORÍAS
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <p className="text-[11px] text-slate-400 font-mono text-center mt-2 flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Pasa el cursor sobre un segmento para ver la valuación</span>
              </p>
            </div>

            {/* Category Cost Breakdown Cards */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {costDonutData.map((cat, idx) => {
                const IconComponent = cat.icon;
                const isHovered = activeCostIndex === idx;

                return (
                  <div
                    key={`cost-card-${cat.key}`}
                    onMouseEnter={() => setActiveCostIndex(idx)}
                    onMouseLeave={() => setActiveCostIndex(null)}
                    onClick={() => onNavigate('inventory')}
                    className={`p-3.5 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between group ${
                      isHovered 
                        ? 'bg-[#1c2738] border-emerald-500 shadow-md -translate-y-0.5 ring-1 ring-emerald-500/30' 
                        : 'bg-[#0a0e14] border-[rgba(248,250,252,0.1)] hover:border-[rgba(248,250,252,0.25)] hover:bg-[#101620]'
                    }`}
                    title={`Ver activos de categoría ${cat.name} en el inventario`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div 
                          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-105"
                          style={{ 
                            backgroundColor: `${cat.color}20`,
                            borderColor: `${cat.color}50`,
                            color: cat.color
                          }}
                        >
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-xs sm:text-sm text-white group-hover:text-emerald-400 transition-colors truncate">
                            {cat.name}
                          </p>
                          <p className="font-mono text-[10px] text-slate-400 font-medium truncate">
                            {cat.count} {cat.count === 1 ? 'equipo' : 'equipos'} · Prom: {formatCurrency(cat.avgCost)}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span 
                          className="font-syne font-bold text-sm sm:text-base block"
                          style={{ color: cat.color }}
                        >
                          {formatCurrency(cat.totalCost)}
                        </span>
                        <span className="font-mono text-[10px] text-emerald-400 font-bold block">
                          {cat.percentage}%
                        </span>
                      </div>
                    </div>

                    {/* Progress bar showing % of total capital */}
                    <div className="mt-3 space-y-1">
                      <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500"
                          style={{ 
                            width: `${Math.min(100, Math.max(cat.percentage > 0 ? 3 : 0, cat.percentage))}%`,
                            backgroundColor: cat.color
                          }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-[9.5px] text-slate-400 font-mono">
                        <span className="truncate max-w-[180px]">{cat.tariffReference || cat.description}</span>
                        <span className="text-slate-300 font-semibold shrink-0">{cat.percentage}% del capital</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 2. Category Distribution Donut Chart (Recharts) - Vista Rápida del Inventario */}
      {(graphicsDisplayTab === 'both' || graphicsDisplayTab === 'assets') && (
        <div className="panel border border-[rgba(248,250,252,0.16)] bg-[#131a26] p-5 sm:p-6 rounded-2xl shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[rgba(248,250,252,0.1)]">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-[#ff8200]/15 text-[#ff8200] border border-[#ff8200]/30">
                  <PieChartIcon className="w-4 h-4" />
                </span>
                <p className="label font-bold text-[#ff8200]">Vista Rápida del Inventario</p>
              </div>
              <h3 className="font-syne text-lg sm:text-xl font-bold tracking-tight text-[#f8fafc] mt-1 uppercase">
                Distribución de Activos por Categoría
              </h3>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                Gráfico de anillos con desglose técnico de laptops, servidores, computadoras de escritorio, monitores y tablets.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={() => onNavigate('inventory')}
                className="px-3.5 py-2 rounded-xl bg-[#004a99] hover:bg-[#005bbd] text-white text-xs font-mono font-bold tracking-wider uppercase transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Ir al módulo de inventario completo"
              >
                <span>Ver Inventario</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Chart + Category Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center mt-6">
            {/* Donut Chart Container */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center">
              <div className="relative w-full max-w-[280px] h-[270px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip content={<CustomDonutTooltip />} />
                    <Pie
                      data={donutData.filter(d => d.value > 0).length > 0 ? donutData.filter(d => d.value > 0) : [{ key: 'empty', name: 'Sin activos', value: 1, color: '#334155', percentage: 0 }]}
                      cx="50%"
                      cy="50%"
                      innerRadius={72}
                      outerRadius={104}
                      paddingAngle={3}
                      dataKey="value"
                      nameKey="name"
                      stroke="#131a26"
                      strokeWidth={3}
                      onMouseEnter={(_, index) => setActiveCategoryIndex(index)}
                      onMouseLeave={() => setActiveCategoryIndex(null)}
                    >
                      {(donutData.filter(d => d.value > 0).length > 0 ? donutData.filter(d => d.value > 0) : [{ key: 'empty', name: 'Sin activos', value: 1, color: '#334155', percentage: 0 }]).map((entry, index) => (
                        <Cell
                          key={entry.key}
                          fill={entry.color}
                          opacity={activeCategoryIndex === null || activeCategoryIndex === index ? 1 : 0.35}
                          className="transition-all duration-300 cursor-pointer outline-hidden"
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                {/* Center Hub Indicator */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center select-none px-4">
                  {activeCategoryItem ? (
                    <div className="animate-in fade-in zoom-in-95 duration-200">
                      <span className="font-syne text-3xl font-black text-white tracking-tight leading-none block">
                        {activeCategoryItem.value}
                      </span>
                      <span 
                        className="font-mono text-[11px] font-black uppercase tracking-wider block mt-1 truncate max-w-[130px]"
                        style={{ color: activeCategoryItem.color }}
                      >
                        {activeCategoryItem.name}
                      </span>
                      <span className="font-mono text-[10px] text-slate-300 font-bold block mt-0.5">
                        {activeCategoryItem.percentage}% del total
                      </span>
                    </div>
                  ) : (
                    <div>
                      <span className="font-syne text-3xl sm:text-4xl font-black text-[#f8fafc] tracking-tight leading-none block">
                        {totalAssets}
                      </span>
                      <span className="font-mono text-[10px] text-slate-300 font-extrabold uppercase tracking-widest block mt-1">
                        EQUIPOS TOTALES
                      </span>
                      <span className="font-mono text-[9.5px] text-[#ff8200] font-bold block mt-0.5">
                        {donutData.filter(d => d.value > 0).length} CON STOCK
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <p className="text-[11px] text-slate-400 font-mono text-center mt-2 flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#ff8200]" />
                <span>Pasa el cursor sobre un segmento o categoría</span>
              </p>
            </div>

            {/* Category Cards breakdown */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {donutData.map((cat, idx) => {
                const IconComponent = cat.icon;
                const isHovered = activeCategoryIndex === idx;

                return (
                  <div
                    key={cat.key}
                    onMouseEnter={() => setActiveCategoryIndex(idx)}
                    onMouseLeave={() => setActiveCategoryIndex(null)}
                    onClick={() => onNavigate('inventory')}
                    className={`p-3.5 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-between group ${
                      isHovered 
                        ? 'bg-[#1c2738] border-[#ff8200] shadow-md -translate-y-0.5 ring-1 ring-[#ff8200]/30' 
                        : 'bg-[#0a0e14] border-[rgba(248,250,252,0.1)] hover:border-[rgba(248,250,252,0.25)] hover:bg-[#101620]'
                    }`}
                    title={`Ver activos de categoría ${cat.name} en el inventario`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-105"
                        style={{ 
                          backgroundColor: `${cat.color}20`,
                          borderColor: `${cat.color}50`,
                          color: cat.color
                        }}
                      >
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-xs sm:text-sm text-white group-hover:text-[#ff8200] transition-colors truncate">
                            {cat.name}
                          </p>
                        </div>
                        <p className="font-mono text-[10.5px] text-slate-400 font-medium truncate">
                          {cat.description}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 pl-2">
                      <span 
                        className="font-syne font-bold text-base block"
                        style={{ color: cat.color }}
                      >
                        {cat.value}
                      </span>
                      <span className="font-mono text-[10px] text-slate-300 font-bold block">
                        {cat.percentage}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Critical Alerts Grid Blocks (Panels) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Maintenance alerts panel */}
        <div className="panel">
          <div className="panel-header">
            <div>
              <p className="label">Monitoreo Preventivo</p>
              <h3 className="text-sm font-bold tracking-wider uppercase text-[#f8fafc] mt-0.5">
                Mantenimientos Programados
              </h3>
            </div>
            <button
              onClick={() => onNavigate('maintenance')}
              className="label text-[#ff8200] hover:underline flex items-center gap-1 cursor-pointer"
            >
              Ver Cronograma <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          <div className="divide-y divide-[rgba(248,250,252,0.12)]">
            {maintenanceUrgent.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-300 font-mono font-medium">
                No hay mantenimientos vencidos ni pendientes inmediatos.
              </p>
            ) : (
              maintenanceUrgent.slice(0, 4).map(asset => {
                const emp = employees.find(e => e.id === asset.assignedToEmployeeId);
                const maint = getMaintenanceStatus(asset.nextMaintenanceDate);
                const isLate = maint.status === 'vencido';
                return (
                  <div 
                    key={asset.id} 
                    onClick={() => onOpenAssetDetail(asset.id)}
                    className="list-item hover:bg-[rgba(248,250,252,0.06)] cursor-pointer px-1.5 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="mono text-xs font-bold text-white">{asset.assetTag}</span>
                        <span className="text-xs text-slate-200 font-medium">{asset.brand} {asset.model}</span>
                      </div>
                      <p className="mono text-[10.5px] text-slate-300 mt-0.5">
                        Custodio: <span className="text-white font-semibold">{emp?.fullName || 'Stock Almacén'}</span> • Programado: <span className="text-slate-200">{formatDate(asset.nextMaintenanceDate)}</span>
                      </p>
                    </div>
                    <span className={isLate ? 'badge badge-red font-bold' : 'badge badge-amber font-bold'}>
                      {maint.label}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Warranty alerts panel */}
        <div className="panel">
          <div className="panel-header">
            <div>
              <p className="label">Garantías & Pólizas</p>
              <h3 className="text-sm font-bold tracking-wider uppercase text-[#f8fafc] mt-0.5">
                Vencimiento de Garantías
              </h3>
            </div>
            <button
              onClick={() => onNavigate('notifications')}
              className="label text-[#ff8200] hover:underline flex items-center gap-1 cursor-pointer"
            >
              Gestionar Alertas <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          <div className="divide-y divide-[rgba(248,250,252,0.12)]">
            {warrantyUrgent.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-300 font-mono font-medium">
                Todas las pólizas de garantía cuentan con vigencia activa.
              </p>
            ) : (
              warrantyUrgent.slice(0, 4).map(asset => {
                const war = getWarrantyStatus(asset.warrantyEndDate);
                const isExpired = war.status === 'vencida';
                return (
                  <div 
                    key={asset.id} 
                    onClick={() => onOpenAssetDetail(asset.id)}
                    className="list-item hover:bg-[rgba(248,250,252,0.06)] cursor-pointer px-1.5 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="mono text-xs font-bold text-white">{asset.assetTag}</span>
                        <span className="text-xs text-slate-200 font-medium">{asset.name}</span>
                      </div>
                      <p className="mono text-[10.5px] text-slate-300 mt-0.5">
                        Proveedor: <span className="text-white font-medium">{asset.supplier}</span> • Factura: <span className="text-slate-200">{asset.invoiceNumber || 'S/N'}</span>
                      </p>
                    </div>
                    <span className={isExpired ? 'badge badge-red font-bold' : 'badge badge-amber font-bold'}>
                      {war.label}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Geolocation & Custody Status Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Branch breakdown */}
        <div className="panel">
          <div className="panel-header">
            <div>
              <p className="label">Ubicación Geográfica</p>
              <h3 className="text-sm font-bold tracking-wider uppercase text-[#f8fafc] mt-0.5">
                Flota por Sucursal
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => onNavigate('geolocation')}
                className="label text-[#10b981] hover:underline flex items-center gap-1 cursor-pointer font-bold"
              >
                <MapPin className="w-3 h-3" />
                MAPA
              </button>
            </div>
          </div>

          <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
            {branchCounts.map(({ branch, count }) => {
              const pct = totalAssets > 0 ? Math.round((count / totalAssets) * 100) : 0;
              return (
                <div 
                  key={branch.id} 
                  className="p-2.5 rounded-[6px] bg-[#0a0e14] border border-[rgba(248,250,252,0.12)] hover:border-[rgba(248,250,252,0.25)] transition-colors"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-white">{branch.name}</p>
                      <p className="mono text-[10.5px] text-slate-300 font-medium">{branch.city}, {branch.state}</p>
                    </div>
                    <div className="text-right">
                      <span className="mono font-bold text-white text-sm">{count}</span>
                      <span className="label text-[8.5px] block font-bold text-slate-300">EQUIPOS</span>
                    </div>
                  </div>
                  <div className="w-full bg-[#131a26] h-1.5 rounded-[2px] mt-2 overflow-hidden">
                    <div 
                      className="h-full bg-[#004a99]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Custody status */}
        <div className="panel">
          <div className="panel-header">
            <div>
              <p className="label">Auditoría Legal</p>
              <h3 className="text-sm font-bold tracking-wider uppercase text-[#f8fafc] mt-0.5">
                Estado de Custodia
              </h3>
            </div>
            <button 
              onClick={() => onNavigate('assignments')}
              className="label text-[#ff8200] hover:underline cursor-pointer"
            >
              RESPONSIVAS
            </button>
          </div>

          <div className="space-y-2.5">
            <div className="p-3 rounded-[6px] bg-[#0a0e14] border border-[rgba(248,250,252,0.08)] text-xs flex items-center justify-between">
              <div>
                <p className="font-semibold text-[#f8fafc]">Responsivas Firmadas</p>
                <p className="mono text-[10px] text-[rgba(248,250,252,0.4)]">Con firma digital registrada</p>
              </div>
              <span className="mono font-bold text-[#10b981] text-lg">
                {assignments.filter(a => a.employeeSignatureUrl).length}
              </span>
            </div>

            <div className="p-3 rounded-[6px] bg-[#0a0e14] border border-[rgba(248,250,252,0.08)] text-xs flex items-center justify-between">
              <div>
                <p className="font-semibold text-[#f8fafc]">Pendientes de Firma</p>
                <p className="mono text-[10px] text-amber-400/80">Requieren firma del colaborador</p>
              </div>
              <span className="mono font-bold text-amber-400 text-lg">
                {assignments.filter(a => !a.employeeSignatureUrl).length}
              </span>
            </div>

            <div className="p-3 rounded-[6px] bg-[#0a0e14] border border-[rgba(248,250,252,0.08)] text-xs flex items-center justify-between">
              <div>
                <p className="font-semibold text-[#f8fafc]">Envíos entre Sedes</p>
                <p className="mono text-[10px] text-purple-400/80">Traslados en tránsito</p>
              </div>
              <span className="mono font-bold text-purple-400 text-lg">
                {transfers.filter(t => t.status === 'en_transito').length}
              </span>
            </div>

            <div className="pt-2 text-center">
              <button
                onClick={() => onNavigate('assignments')}
                className="w-full py-2.5 rounded-[6px] bg-[#004a99] hover:bg-[#005bbd] text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer mono uppercase tracking-wider shadow-xs"
              >
                + Generar Carta Responsiva
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
