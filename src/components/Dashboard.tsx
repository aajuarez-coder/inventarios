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
  Terminal,
  ShieldCheck
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

      {/* Distribution Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Category breakdown */}
        <div className="panel">
          <div className="panel-header">
            <div>
              <p className="label">Tipología de Hardware</p>
              <h3 className="text-sm font-bold tracking-wider uppercase text-[#f8fafc] mt-0.5">
                Equipos por Categoría
              </h3>
            </div>
            <span className="mono text-xs text-slate-200 font-semibold">{totalAssets} TOTAL</span>
          </div>

          <div className="space-y-3.5">
            {[
              { cat: 'laptop', label: 'Laptops / Portátiles', count: categoryCounts['laptop'] || 0, color: 'bg-[#ff8200]' },
              { cat: 'desktop', label: 'Computadoras Escritorio', count: categoryCounts['desktop'] || 0, color: 'bg-[#004a99]' },
              { cat: 'servidor', label: 'Servidores & Rack', count: categoryCounts['servidor'] || 0, color: 'bg-indigo-500' },
              { cat: 'monitor', label: 'Monitores & Displays', count: categoryCounts['monitor'] || 0, color: 'bg-amber-500' },
              { cat: 'impresora', label: 'Impresoras & Escáneres', count: categoryCounts['impresora'] || 0, color: 'bg-emerald-500' },
              { cat: 'redes', label: 'Switches y Routing', count: categoryCounts['redes'] || 0, color: 'bg-cyan-500' },
            ].map(item => {
              const pct = totalAssets > 0 ? Math.round((item.count / totalAssets) * 100) : 0;
              return (
                <div key={item.cat} className="space-y-1">
                  <div className="flex justify-between text-xs text-white">
                    <span className="font-semibold text-slate-100">{item.label}</span>
                    <span className="mono text-[11px] text-slate-200 font-bold">{item.count} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-[#0a0e14] h-1.5 rounded-[3px] overflow-hidden border border-[rgba(248,250,252,0.12)]">
                    <div 
                      className={`h-full ${item.color} transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

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
