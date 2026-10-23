import React from 'react';
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
  Terminal
} from 'lucide-react';
import { formatCurrency, formatDate, getWarrantyStatus, getMaintenanceStatus } from '../utils/formatters';
import { TabId } from './Sidebar';

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

  const totalValuation = assets
    .filter(a => a.status !== 'baja')
    .reduce((sum, a) => sum + (a.purchaseCost || 0), 0);

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
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/20 via-cyan-500/10 to-transparent pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                Panel Central de Control TI
              </span>
              <span className="text-xs text-slate-400">
                Fecha del sistema: 16 de Octubre, 2026
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Gestión Integral de Activos de Cómputo
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Monitoreo en tiempo real de inventario de hardware, equipos en stock de almacén, cartas responsivas firmadas y calendario de mantenimientos preventivos.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onNavigate('inventory')}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors shadow-md shadow-indigo-600/30 flex items-center gap-2"
            >
              <Package className="w-3.5 h-3.5" />
              Nuevo Equipo
            </button>
            <button
              onClick={() => onNavigate('assignments')}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs backdrop-blur-xs transition-colors border border-white/10 flex items-center gap-2"
            >
              <UserCheck className="w-3.5 h-3.5" />
              Asignar Equipo
            </button>
            <button
              onClick={() => onNavigate('reports')}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs backdrop-blur-xs transition-colors border border-white/10 flex items-center gap-2"
            >
              Imprimir Reporte
            </button>
            <button
              onClick={() => onNavigate('geolocation')}
              className="px-3.5 py-2 rounded-xl bg-indigo-500/30 hover:bg-indigo-500/45 text-white font-semibold text-xs backdrop-blur-xs transition-colors border border-indigo-400/40 flex items-center gap-2"
            >
              <MapPin className="w-3.5 h-3.5 text-indigo-300" />
              Mapa de Flota TI
            </button>
            <button
              onClick={() => onNavigate('agent-installation')}
              className="px-3.5 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/35 text-cyan-100 font-semibold text-xs backdrop-blur-xs transition-colors border border-cyan-400/30 flex items-center gap-2"
            >
              <Terminal className="w-3.5 h-3.5 text-cyan-300" />
              Instalar Agente
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* KPI 1: Total Assets */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-indigo-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Total de Equipos</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 font-mono">{totalAssets}</p>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
            <span className="text-emerald-600 font-semibold">{utilizationRate}%</span> en uso activo
          </div>
        </div>

        {/* KPI 2: Available Stock in Warehouse */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Stock en Almacén</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 font-mono">{availableStock.length}</p>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
            <CheckCircle className="w-3 h-3" /> Listos para entrega
          </div>
        </div>

        {/* KPI 3: Assigned to employees */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-blue-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Asignados a Personal</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 font-mono">{assignedAssets.length}</p>
          <div className="mt-1 text-[11px] text-slate-500">
            Con carta responsiva
          </div>
        </div>

        {/* KPI 4: In maintenance / workshop */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-amber-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">En Mantenimiento</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-600 font-mono">{inMaintenance.length}</p>
          <div className="mt-1 text-[11px] text-amber-700 font-medium">
            {inTransfer.length > 0 ? `+ ${inTransfer.length} en traslado` : 'En revisión técnica'}
          </div>
        </div>

        {/* KPI 5: Inventory Valuation */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-cyan-300 transition-colors col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Valoración de Activos</span>
            <div className="w-7 h-7 rounded-lg bg-cyan-50 text-cyan-700 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg font-bold text-slate-900 font-mono truncate">
            {formatCurrency(totalValuation)}
          </p>
          <div className="mt-1 text-[11px] text-slate-500">
            Costo de adquisición
          </div>
        </div>

      </div>

      {/* Critical Alerts Banner Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Maintenance alerts box */}
        <div className="bg-white rounded-xl border border-amber-200 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-slate-900">
                  Mantenimiento Preventivo Periódico
                </h3>
                <p className="text-xs text-slate-500">
                  Equipos con servicio atrasado o programado para los próximos 14 días
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('maintenance')}
              className="text-xs text-amber-700 font-semibold hover:text-amber-800 flex items-center gap-1"
            >
              Ver Cronograma <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-3 divide-y divide-slate-100">
            {maintenanceUrgent.length === 0 ? (
              <p className="py-4 text-center text-xs text-slate-400">
                No hay mantenimientos pendientes por realizar.
              </p>
            ) : (
              maintenanceUrgent.slice(0, 3).map(asset => {
                const emp = employees.find(e => e.id === asset.assignedToEmployeeId);
                const maint = getMaintenanceStatus(asset.nextMaintenanceDate);
                return (
                  <div key={asset.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900">{asset.assetTag}</span>
                        <span className="text-slate-600">{asset.brand} {asset.model}</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Usuario: <span className="font-medium text-slate-700">{emp?.fullName || 'En Almacén'}</span> • Programado: {formatDate(asset.nextMaintenanceDate)}
                      </p>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${maint.badgeClass}`}>
                      {maint.label}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Warranty alerts box */}
        <div className="bg-white rounded-xl border border-rose-200 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-rose-100 text-rose-700">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-slate-900">
                  Alertas de Vencimiento de Garantía
                </h3>
                <p className="text-xs text-slate-500">
                  Pólizas de fabricante por expirar en menos de 30 días o vencidas
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('notifications')}
              className="text-xs text-rose-700 font-semibold hover:text-rose-800 flex items-center gap-1"
            >
              Gestionar Alertas <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-3 divide-y divide-slate-100">
            {warrantyUrgent.length === 0 ? (
              <p className="py-4 text-center text-xs text-slate-400">
                Todas las pólizas de garantía se encuentran con vigencia amplia.
              </p>
            ) : (
              warrantyUrgent.slice(0, 3).map(asset => {
                const war = getWarrantyStatus(asset.warrantyEndDate);
                return (
                  <div key={asset.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900">{asset.assetTag}</span>
                        <span className="text-slate-600">{asset.name}</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Proveedor: {asset.supplier} • Factura: {asset.invoiceNumber}
                      </p>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${war.badgeClass}`}>
                      {war.label}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Distribution Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Category breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Laptop className="w-4 h-4 text-indigo-600" />
              Equipos por Categoría
            </h3>
            <span className="text-xs text-slate-400 font-mono">{totalAssets} total</span>
          </div>

          <div className="space-y-3">
            {[
              { cat: 'laptop', label: 'Laptops / Portátiles', count: categoryCounts['laptop'] || 0, color: 'bg-indigo-600' },
              { cat: 'desktop', label: 'Computadoras de Escritorio', count: categoryCounts['desktop'] || 0, color: 'bg-cyan-500' },
              { cat: 'servidor', label: 'Servidores & Infraestructura', count: categoryCounts['servidor'] || 0, color: 'bg-blue-600' },
              { cat: 'monitor', label: 'Monitores & Pantallas', count: categoryCounts['monitor'] || 0, color: 'bg-amber-500' },
              { cat: 'impresora', label: 'Impresoras Multifuncionales', count: categoryCounts['impresora'] || 0, color: 'bg-emerald-500' },
              { cat: 'redes', label: 'Switches y Equipos de Red', count: categoryCounts['redes'] || 0, color: 'bg-purple-600' },
            ].map(item => {
              const pct = totalAssets > 0 ? Math.round((item.count / totalAssets) * 100) : 0;
              return (
                <div key={item.cat} className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-700">
                    <span className="font-medium">{item.label}</span>
                    <span className="font-mono text-slate-500">{item.count} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${item.color} rounded-full transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Branch breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-600" />
              Inventario por Sucursal
            </h3>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => onNavigate('geolocation')}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
              >
                <MapPin className="w-3 h-3" />
                Mapa
              </button>
              <button 
                onClick={() => onNavigate('branches')}
                className="text-xs text-slate-500 hover:text-slate-700 font-medium"
              >
                Sedes
              </button>
            </div>
          </div>

          <div className="space-y-3.5">
            {branchCounts.map(({ branch, count }) => {
              const pct = totalAssets > 0 ? Math.round((count / totalAssets) * 100) : 0;
              return (
                <div key={branch.id} className="p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-slate-900">{branch.name}</p>
                      <p className="text-[11px] text-slate-500">{branch.city}, {branch.state}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-slate-800 text-sm">{count}</span>
                      <span className="text-[10px] text-slate-400 block">equipos</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick stock status & recent activities */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-indigo-600" />
              Estado de Custodia
            </h3>
            <button 
              onClick={() => onNavigate('assignments')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Responsivas
            </button>
          </div>

          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-800">Responsivas Firmadas</p>
                <p className="text-[11px] text-slate-500">Con firma digital de entrega</p>
              </div>
              <span className="font-mono font-bold text-emerald-600 text-base">
                {assignments.filter(a => a.employeeSignatureUrl).length}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs flex items-center justify-between">
              <div>
                <p className="font-medium text-amber-900">Pendientes de Firma</p>
                <p className="text-[11px] text-amber-700">Requieren firma del colaborador</p>
              </div>
              <span className="font-mono font-bold text-amber-700 text-base">
                {assignments.filter(a => !a.employeeSignatureUrl).length}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-purple-50 border border-purple-200 text-xs flex items-center justify-between">
              <div>
                <p className="font-medium text-purple-900">Envíos entre Sedes</p>
                <p className="text-[11px] text-purple-700">Traslados en tránsito activo</p>
              </div>
              <span className="font-mono font-bold text-purple-700 text-base">
                {transfers.filter(t => t.status === 'en_transito').length}
              </span>
            </div>

            <div className="pt-2 text-center">
              <button
                onClick={() => onNavigate('assignments')}
                className="w-full py-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                Generar Nueva Carta Responsiva
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
