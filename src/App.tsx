import React, { useState } from 'react';
import { InventoryProvider, useInventory } from './context/InventoryContext';
import { GmailProvider } from './context/GmailContext';
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
    <div className="min-h-screen bg-[#0a0e14] text-[#f8fafc] flex flex-col antialiased selection:bg-[#ff8200] selection:text-white">
      
      {/* Top Header */}
      <Header
        onSearch={handleGlobalSearch}
        searchQuery={globalSearch}
        onOpenAlerts={() => setCurrentTab('notifications')}
        onOpenSettings={() => setCurrentTab('users')}
      />

      {/* Active Role Status Notification Banner */}
      {isViewer && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-xs flex flex-wrap items-center justify-between text-amber-200 font-medium no-print">
          <div className="flex items-center gap-2">
            <span className="badge badge-amber font-mono">
              MODO VISOR AUDITOR
            </span>
            <span className="text-[rgba(248,250,252,0.7)]">
              Conectado como <em>{currentUser.name}</em> ({currentUser.email}). Modo solo lectura: consulta de inventario, fichas técnicas y reportes. Edición restringida.
            </span>
          </div>
          <button
            onClick={logout}
            title="Para cambiar de operador debe cerrar la sesión actual"
            className="ml-auto mt-1 sm:mt-0 px-2.5 py-1 rounded-[4px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] font-mono uppercase tracking-wider transition-colors cursor-pointer border border-amber-500/30 flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      )}

      {currentUser.role === 'edicion_total' && (
        <div className="bg-[#131a26] border-b border-[rgba(248,250,252,0.08)] px-4 py-1.5 text-xs flex items-center justify-between text-[rgba(248,250,252,0.7)] font-medium no-print hidden sm:flex">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
            <span className="text-[11px]">
              <strong className="text-[#f8fafc]">Perfil Edición Total Activo:</strong> Conectado como <em>{currentUser.name}</em>. Privilegios de administrador maestro habilitados.
            </span>
          </div>
          <span className="badge text-[9px] bg-emerald-500/10 text-[#10b981] border border-emerald-500/30 font-mono">
            MODO MAESTRO HABILITADO
          </span>
        </div>
      )}

      {/* Mobile navigation bar */}
      <div className="md:hidden bg-[#131a26] border-b border-[rgba(248,250,252,0.12)] px-4 py-2 flex items-center justify-between no-print">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-[6px] text-[rgba(248,250,252,0.8)] hover:bg-[#1c2738] flex items-center gap-2 text-xs font-semibold"
        >
          {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          <span className="font-mono text-[11px] uppercase">Módulos</span>
        </button>
        <span className="label text-[#ff8200] uppercase font-bold">
          {currentTab}
        </span>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-[#131a26] border-b border-[rgba(248,250,252,0.12)] p-3 grid grid-cols-2 gap-2 z-20 no-print animate-in fade-in">
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
                className={`p-2 rounded-[6px] text-xs font-medium flex items-center gap-2 font-mono transition-colors ${
                  isActive ? 'bg-[#004a99] text-white font-semibold' : 'text-[rgba(248,250,252,0.7)] hover:bg-white/[0.04]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Main Workspace */}
      <div className="flex-1 flex w-full">
        
        {/* Left Desktop Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => {
            setCurrentTab(tab);
            setGlobalSearch('');
          }}
        />

        {/* Content Pane */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-y-auto technical-grid">
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

      {/* Technical Industrial Footer */}
      <footer className="border-t border-[rgba(242,239,235,0.12)] py-2.5 px-6 flex flex-wrap items-center justify-between text-xs label bg-[#111113] text-[rgba(242,239,235,0.5)] no-print">
        <span className="font-mono text-[10px] tracking-wider">
          © 2026 GRUPO PETROIL TI DIVISION • CONTROL CENTRAL DE HARDWARE & INVENTARIOS
        </span>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 font-mono text-[10px] text-[#10b981]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
            BITLOCKER ORCHESTRATION ONLINE
          </span>
          <span className="font-mono text-[10px] text-[rgba(242,239,235,0.4)]">
            STABLE BUILD 2.4.0
          </span>
        </div>
      </footer>

    </div>
  );
};

export default function App() {
  return (
    <InventoryProvider>
      <GmailProvider>
        <AppContent />
      </GmailProvider>
    </InventoryProvider>
  );
}

