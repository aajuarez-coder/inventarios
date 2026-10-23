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
    <aside className="w-64 bg-white border-r border-slate-200 shrink-0 flex flex-col justify-between hidden md:flex">
      <div className="p-4 space-y-1">
        <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Módulos del Sistema
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs font-medium transition-all group ${
                  isActive 
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200' 
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-600'
                  }`} />
                  <span className="truncate">{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {item.count !== undefined && !isActive && (
                    <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 font-mono">
                      {item.count}
                    </span>
                  )}
                  {item.badge && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      isActive ? 'bg-white/20 text-white' : item.badgeColor
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
      <div className="p-3 border-t border-slate-100 space-y-2">
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
              currentUser.role === 'edicion_total'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : currentUser.role === 'visor'
                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                : 'bg-indigo-100 text-indigo-700 border border-indigo-200'
            }`}>
              {currentUser.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-slate-800 truncate text-[11px] leading-tight">
                {currentUser.name}
              </p>
              <span className={`inline-block text-[9px] font-bold px-1.5 py-0.2 rounded-md ${
                currentUser.role === 'edicion_total'
                  ? 'bg-emerald-50 text-emerald-700'
                  : currentUser.role === 'visor'
                  ? 'bg-amber-50 text-amber-700'
                  : 'bg-indigo-50 text-indigo-700'
              }`}>
                {currentUser.role === 'edicion_total' ? 'Edición Total' : currentUser.role === 'visor' ? 'Visor' : 'Admin TI'}
              </span>
            </div>
          </div>

          <button
            onClick={logout}
            title="Cerrar sesión"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-50/80 to-cyan-50/80 border border-indigo-100 text-xs">
          <div className="flex items-center gap-1.5 text-indigo-900 font-semibold mb-0.5 text-[11px]">
            <Sparkles className="w-3 h-3 text-indigo-600" />
            <span>Grupo Petroil TI</span>
          </div>
          <p className="text-[10px] text-slate-500 leading-tight">
            Control de activos, inventario de hardware y auditoría legal.
          </p>
        </div>
      </div>
    </aside>
  );
};
