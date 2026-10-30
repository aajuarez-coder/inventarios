import React from 'react';
import { 
  LayoutDashboard, 
  Laptop, 
  Users, 
  FileText, 
  Wrench, 
  Truck, 
  BellRing, 
  Printer, 
  GitBranch,
  ShieldAlert,
  Calendar,
  Sparkles,
  LogOut,
  MapPin,
  Terminal,
  BookOpen,
  Repeat
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { getWarrantyStatus, getMaintenanceStatus } from '../utils/formatters';

export type TabId = 
  | 'dashboard'
  | 'inventory'
  | 'employees'
  | 'assignments'
  | 'loans'
  | 'maintenance'
  | 'branches'
  | 'geolocation'
  | 'agent-installation'
  | 'notifications'
  | 'reports'
  | 'users'
  | 'manual';

interface SidebarProps {
  currentTab: TabId;
  onSelectTab: (tab: TabId) => void;
  collapsed?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const { assets, assignments, loans, maintenanceRecords, transfers, currentUser, systemUsers, logout } = useInventory();

  // Badges
  const pendingSignatures = assignments.filter(a => !a.employeeSignatureUrl).length;
  const activeLoansCount = loans ? loans.filter(l => l.status === 'activo').length : 0;
  
  const urgentMaint = assets.filter(a => {
    const st = getMaintenanceStatus(a.nextMaintenanceDate);
    return st.status === 'vencido' || st.status === 'proximo';
  }).length;

  const transfersInFlight = transfers.filter(t => t.status === 'en_transito').length;

  const navItems = [
    {
      id: 'dashboard' as TabId,
      label: 'Estadísticas Almacén',
      icon: LayoutDashboard,
      description: 'Métricas de stock y KPIs'
    },
    {
      id: 'inventory' as TabId,
      label: 'Inventario Hardware',
      icon: Laptop,
      count: assets.length,
      description: 'Catálogo de equipos y specs'
    },
    {
      id: 'employees' as TabId,
      label: 'Colaboradores',
      icon: Users,
      description: 'Personal y equipos en custodia'
    },
    {
      id: 'assignments' as TabId,
      label: 'Cartas Responsivas',
      icon: FileText,
      badge: pendingSignatures > 0 ? `${pendingSignatures} pend.` : undefined,
      badgeColor: 'bg-amber-100 text-amber-800',
      description: 'Asignaciones y firmas digitales'
    },
    {
      id: 'loans' as TabId,
      label: 'Préstamos de Equipos',
      icon: Repeat,
      badge: activeLoansCount > 0 ? `${activeLoansCount} act.` : undefined,
      badgeColor: 'bg-indigo-100 text-indigo-800',
      description: 'Salidas temporales por viaje o comisión'
    },
    {
      id: 'maintenance' as TabId,
      label: 'Mantenimiento Preventivo',
      icon: Wrench,
      badge: urgentMaint > 0 ? `${urgentMaint} avisos` : undefined,
      badgeColor: 'bg-rose-100 text-rose-800',
      description: 'Cronograma y checklists técnicos'
    },
    {
      id: 'branches' as TabId,
      label: 'Sucursales & Traslados',
      icon: Truck,
      badge: transfersInFlight > 0 ? `${transfersInFlight} en ruta` : undefined,
      badgeColor: 'bg-purple-100 text-purple-800',
      description: 'Sedes y envíos con guía'
    },
    {
      id: 'geolocation' as TabId,
      label: 'Geolocalización TI',
      icon: MapPin,
      badge: 'Mapa',
      badgeColor: 'bg-emerald-100 text-emerald-800',
      description: 'Mapa satelital/vectores de sedes y activos'
    },
    {
      id: 'agent-installation' as TabId,
      label: 'Instalación de Agente',
      icon: Terminal,
      badge: 'Win/Mac/Linux',
      badgeColor: 'bg-cyan-100 text-cyan-800',
      description: 'Telemetría e inventario automatizado'
    },
    {
      id: 'notifications' as TabId,
      label: 'Alertas & Enviar Correos',
      icon: BellRing,
      description: 'Avisos de mantenimiento y garantías'
    },
    {
      id: 'reports' as TabId,
      label: 'Imprimir Reportes',
      icon: Printer,
      description: 'Formatos PDF, auditoría y CSV'
    },
    {
      id: 'users' as TabId,
      label: 'Usuarios & Permisos',
      icon: ShieldAlert,
      count: systemUsers?.length || 0,
      description: 'Cuentas de acceso y roles RBAC'
    },
    {
      id: 'manual' as TabId,
      label: 'Manual de Usuario',
      icon: BookOpen,
      badge: 'Guía',
      badgeColor: 'bg-indigo-100 text-indigo-800',
      description: 'Documentación oficial y procedimientos'
    }
  ];

  return (
    <aside className="w-[260px] bg-[#131a26] border-r border-[rgba(248,250,252,0.14)] shrink-0 flex flex-col justify-between hidden md:flex text-[#f8fafc]">
      <div className="py-6 px-3 space-y-1 overflow-y-auto">
        <p className="label px-3 mb-2 text-[0.7rem] text-slate-300 uppercase tracking-[0.15em] font-mono font-bold">
          Navegación & Módulos
        </p>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-[6px] text-left text-[0.875rem] font-medium transition-all group cursor-pointer ${
                  isActive 
                    ? 'bg-[#004a99] text-white shadow-xs font-bold' 
                    : 'text-slate-200 hover:bg-white/[0.08] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-white' : 'text-slate-300 group-hover:text-white'
                  }`} />
                  <span className="truncate">{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {item.count !== undefined && !isActive && (
                    <span className="mono text-[10.5px] font-semibold px-1.5 py-0.5 rounded-[4px] bg-[#0a0e14] text-slate-200 border border-[rgba(248,250,252,0.22)]">
                      {item.count}
                    </span>
                  )}
                  {item.badge && (
                    <span className={`mono text-[9.5px] font-bold px-1.5 py-0.5 rounded-[4px] ${
                      isActive 
                        ? 'bg-white/20 text-white border border-white/30' 
                        : 'bg-[#0a0e14] text-amber-300 border border-amber-500/35'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom system card & User Profile */}
      <div className="p-3 border-t border-[rgba(248,250,252,0.14)] space-y-2">
        <div className="p-2.5 rounded-[6px] bg-[#0a0e14] border border-[rgba(248,250,252,0.18)] text-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-[6px] bg-[#004a99] text-white flex items-center justify-center font-extrabold text-sm shrink-0 font-syne shadow-xs">
              {currentUser.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-white truncate text-[11.5px] leading-tight">
                {currentUser.name}
              </p>
              <span className="label text-[9.5px] text-[#ff9426] font-mono font-bold block mt-0.5">
                {currentUser.role === 'edicion_total' ? 'MODO MAESTRO' : currentUser.role === 'visor' ? 'MODO VISOR' : 'ADMIN TI'}
              </span>
            </div>
          </div>

          <button
            onClick={logout}
            title="Cerrar sesión"
            className="p-1.5 rounded-[4px] text-slate-300 hover:text-[#ff8200] hover:bg-white/[0.08] transition-colors shrink-0 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
