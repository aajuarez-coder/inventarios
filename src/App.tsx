import React, { useState } from 'react';
import { InventoryProvider, useInventory } from './context/InventoryContext';
import { Header } from './components/Header';
import { Sidebar, TabId } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { HardwareInventory } from './components/HardwareInventory';
import { EmployeesDirectory } from './components/EmployeesDirectory';
import { AssignmentsManager } from './components/AssignmentsManager';
import { MaintenanceSchedule } from './components/MaintenanceSchedule';
import { BranchesAndTransfers } from './components/BranchesAndTransfers';
import { AlertsCenter } from './components/AlertsCenter';
import { ReportsCenter } from './components/ReportsCenter';
import { AssetDetailModal } from './components/AssetDetailModal';
import { LoginScreen } from './components/LoginScreen';
import { SystemUsersManager } from './components/SystemUsersManager';
import { GeolocationModule } from './components/GeolocationModule';
import { AgentInstallation } from './components/AgentInstallation';
import { UserManual } from './components/UserManual';
import { EquipmentLoansManager } from './components/EquipmentLoansManager';
import { HardwareAsset, Employee } from './types/inventory';
import { 
  Laptop, 
  LayoutDashboard, 
  Users, 
  FileText, 
  Wrench, 
  Truck, 
  BellRing, 
  Printer, 
  Menu, 
  X,
  Eye,
  ShieldCheck,
  LogOut,
  MapPin,
  Terminal,
  BookOpen,
  Repeat
} from 'lucide-react';

const AppContent: React.FC = () => {
  const { assets, isAuthenticated, currentUser, logout, isViewer, canEdit } = useInventory();
  const [currentTab, setCurrentTab] = useState<TabId>('dashboard');
  const [globalSearch, setGlobalSearch] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Cross-module pre-selections
  const [preselectedAsset, setPreselectedAsset] = useState<HardwareAsset | null>(null);
  const [preselectedEmployee, setPreselectedEmployee] = useState<Employee | null>(null);
  const [preselectedBranchId, setPreselectedBranchId] = useState<string | null>(null);
  const [viewDetailAsset, setViewDetailAsset] = useState<HardwareAsset | null>(null);

  // If user is not authenticated, show the login screen
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  const handleGlobalSearch = (query: string) => {
    setGlobalSearch(query);
    if (query.trim() && currentTab !== 'inventory') {
      setCurrentTab('inventory');
    }
  };

  const handleAssignAsset = (asset: HardwareAsset) => {
    setPreselectedAsset(asset);
    setPreselectedEmployee(null);
    setCurrentTab('assignments');
  };

  const handleAssignToEmployee = (employee: Employee) => {
    setPreselectedEmployee(employee);
    setPreselectedAsset(null);
    setCurrentTab('assignments');
  };

  const handleMaintenanceForAsset = (asset: HardwareAsset) => {
    setPreselectedAsset(asset);
    setCurrentTab('maintenance');
  };

  const handleTransferAsset = (asset: HardwareAsset) => {
    setPreselectedAsset(asset);
    setCurrentTab('branches');
  };

  const handleOpenMapForAsset = (asset: HardwareAsset) => {
    setPreselectedAsset(asset);
    setPreselectedBranchId(asset.branchId);
    setCurrentTab('geolocation');
  };

  const handleOpenMapForBranch = (branchId: string) => {
    setPreselectedBranchId(branchId);
    setPreselectedAsset(null);
    setCurrentTab('geolocation');
  };

  const handleOpenAssetDetail = (assetId: string) => {
    const found = assets.find(a => a.id === assetId);
    if (found) {
      setViewDetailAsset(found);
    }
  };

  const mobileNavItems = [
    { id: 'dashboard' as TabId, label: 'Inicio', icon: LayoutDashboard },
    { id: 'inventory' as TabId, label: 'Equipos', icon: Laptop },
    { id: 'employees' as TabId, label: 'Personal', icon: Users },
    { id: 'assignments' as TabId, label: 'Responsivas', icon: FileText },
    { id: 'loans' as TabId, label: 'Préstamos', icon: Repeat },
    { id: 'maintenance' as TabId, label: 'Servicio', icon: Wrench },
    { id: 'branches' as TabId, label: 'Traslados', icon: Truck },
    { id: 'geolocation' as TabId, label: 'Geolocalización', icon: MapPin },
    { id: 'agent-installation' as TabId, label: 'Instalación de Agente', icon: Terminal },
    { id: 'notifications' as TabId, label: 'Alertas', icon: BellRing },
    { id: 'reports' as TabId, label: 'Reportes', icon: Printer },
    { id: 'users' as TabId, label: 'Usuarios', icon: ShieldCheck },
    { id: 'manual' as TabId, label: 'Manual', icon: BookOpen },
  ];

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col antialiased">
      
      {/* Top Header */}
      <Header
        onSearch={handleGlobalSearch}
        searchQuery={globalSearch}
        onOpenAlerts={() => setCurrentTab('notifications')}
        onOpenSettings={() => setCurrentTab('users')}
      />

      {/* Active Role Status Notification Banner */}
      {isViewer && (
        <div className="bg-amber-500/15 border-b border-amber-300/90 px-4 py-2.5 text-xs flex flex-wrap items-center justify-between text-amber-950 font-medium no-print">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] shrink-0 font-bold">
              👁
            </div>
            <span>
              <strong>Modo Visor (Solo Lectura) Activo:</strong> Conectado como <em>{currentUser.name}</em> ({currentUser.email}). Modo de auditoría habilitado: puedes consultar todo el inventario, ver fichas técnicas, cronogramas y generar reportes consolidados en PDF. La edición y registro de registros están restringidos.
            </span>
          </div>
          <button
            onClick={logout}
            className="ml-auto mt-1 sm:mt-0 px-3 py-1 rounded-lg bg-amber-200 hover:bg-amber-300 text-amber-950 text-xs font-bold transition-colors cursor-pointer"
          >
            Cambiar de Perfil / Salir
          </button>
        </div>
      )}

      {currentUser.role === 'edicion_total' && (
        <div className="bg-emerald-500/10 border-b border-emerald-300/80 px-4 py-1.5 text-xs flex items-center justify-between text-emerald-950 font-medium no-print hidden sm:flex">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>
              <strong>Perfil Edición Total Activo:</strong> Conectado como <em>{currentUser.name}</em>. Privilegios de administrador maestro (altas, modificaciones técnicas, bajas, firmas y asignaciones habilitadas).
            </span>
          </div>
          <span className="text-[10px] text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full font-bold">
            Modo Maestro Habilitado
          </span>
        </div>
      )}

      {/* Mobile navigation bar */}
      <div className="md:hidden bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between no-print">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg text-slate-700 hover:bg-slate-100 flex items-center gap-2 text-xs font-semibold"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          <span>Módulos del Sistema</span>
        </button>
        <span className="text-xs font-bold text-indigo-600 capitalize">
          {currentTab}
        </span>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 p-3 grid grid-cols-2 gap-2 z-20 no-print animate-in fade-in">
          {mobileNavItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`p-2 rounded-lg text-xs font-medium flex items-center gap-2 ${
                  isActive ? 'bg-indigo-600 text-white' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Main Workspace */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        
        {/* Left Desktop Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => {
            setCurrentTab(tab);
            setGlobalSearch('');
          }}
        />

        {/* Content Pane */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-y-auto">
          {currentTab === 'dashboard' && (
            <Dashboard 
              onNavigate={(tab) => setCurrentTab(tab)} 
              onOpenAssetDetail={handleOpenAssetDetail}
            />
          )}

          {currentTab === 'inventory' && (
            <HardwareInventory
              onOpenAssign={handleAssignAsset}
              onOpenMaintenance={handleMaintenanceForAsset}
              onOpenTransfer={handleTransferAsset}
              onOpenMap={handleOpenMapForAsset}
              externalSearch={globalSearch}
            />
          )}

          {currentTab === 'employees' && (
            <EmployeesDirectory
              onAssignToEmployee={handleAssignToEmployee}
              onViewAssetDetail={(asset) => setViewDetailAsset(asset)}
            />
          )}

          {currentTab === 'assignments' && (
            <AssignmentsManager
              preselectedAsset={preselectedAsset}
              preselectedEmployee={preselectedEmployee}
              onClearPreselections={() => {
                setPreselectedAsset(null);
                setPreselectedEmployee(null);
              }}
            />
          )}

          {currentTab === 'loans' && (
            <EquipmentLoansManager
              onOpenAssetDetail={handleOpenAssetDetail}
            />
          )}

          {currentTab === 'maintenance' && (
            <MaintenanceSchedule
              preselectedAsset={preselectedAsset}
            />
          )}

          {currentTab === 'branches' && (
            <BranchesAndTransfers
              preselectedAsset={preselectedAsset}
              onOpenMap={handleOpenMapForBranch}
            />
          )}

          {currentTab === 'geolocation' && (
            <GeolocationModule
              onOpenAssetDetail={handleOpenAssetDetail}
              onOpenTransferModal={(asset) => asset && handleTransferAsset(asset)}
              preselectedAssetId={preselectedAsset?.id}
              preselectedBranchId={preselectedBranchId}
            />
          )}

          {currentTab === 'agent-installation' && (
            <AgentInstallation 
              onNavigateToInventory={() => setCurrentTab('inventory')}
              onOpenAssetDetail={handleOpenAssetDetail}
            />
          )}

          {currentTab === 'notifications' && (
            <AlertsCenter />
          )}

          {currentTab === 'reports' && (
            <ReportsCenter />
          )}

          {currentTab === 'users' && (
            <SystemUsersManager />
          )}

          {currentTab === 'manual' && (
            <UserManual onNavigate={(tab) => setCurrentTab(tab)} />
          )}
        </main>
      </div>

      {/* Global Asset Detail Modal if triggered from any tab */}
      {viewDetailAsset && (
        <AssetDetailModal
          asset={viewDetailAsset}
          onClose={() => setViewDetailAsset(null)}
          onOpenAssign={handleAssignAsset}
          onOpenMaintenance={handleMaintenanceForAsset}
          onOpenMap={handleOpenMapForAsset}
        />
      )}

    </div>
  );
};

import { GmailProvider } from './context/GmailContext';

export default function App() {
  return (
    <InventoryProvider>
      <GmailProvider>
        <AppContent />
      </GmailProvider>
    </InventoryProvider>
  );
}

