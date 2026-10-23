import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { 
  Cloud, 
  CloudCheck, 
  Bell, 
  User, 
  Download, 
  Upload, 
  RefreshCw, 
  Search, 
  ShieldAlert, 
  CheckCircle2, 
  Wrench,
  Building2,
  SlidersHorizontal,
  ChevronDown,
  Clock,
  LogOut,
  Eye,
  ShieldCheck,
  Mail
} from 'lucide-react';
import { getWarrantyStatus, getMaintenanceStatus } from '../utils/formatters';
import { AppUser, UserRole } from '../types/inventory';
import { useGmail } from '../context/GmailContext';
import { GoogleSignInButton } from './GoogleSignInButton';

interface HeaderProps {
  onSearch: (query: string) => void;
  searchQuery: string;
  onOpenAlerts: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onSearch,
  searchQuery,
  onOpenAlerts,
  onOpenSettings
}) => {
  const { 
    currentUser, 
    setCurrentUser, 
    systemUsers,
    logout,
    canEdit,
    isViewer,
    isCloudSyncing, 
    lastCloudSyncTime, 
    assets, 
    forceCloudSync,
    exportDataJSON,
    importDataJSON
  } = useInventory();

  const {
    isConnected: isGmailConnected,
    isConnecting: isGmailConnecting,
    connectGoogle,
    disconnectGoogle,
    gmailProfile
  } = useGmail();

  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotificationsMenu, setShowNotificationsMenu] = useState(false);
  const [showGmailMenu, setShowGmailMenu] = useState(false);

  // Calculate urgent notifications count
  const warrantyAlerts = assets.filter(a => {
    const st = getWarrantyStatus(a.warrantyEndDate);
    return st.status === 'por_vencer' || st.status === 'vencida';
  });

  const maintenanceAlerts = assets.filter(a => {
    const st = getMaintenanceStatus(a.nextMaintenanceDate);
    return st.status === 'vencido' || st.status === 'proximo';
  });

  const totalUrgentCount = warrantyAlerts.length + maintenanceAlerts.length;

  const handleUserSelect = (user: AppUser) => {
    setCurrentUser(user);
    setShowRoleMenu(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = importDataJSON(content);
        if (success) {
          alert('Base de datos importada exitosamente desde el archivo.');
        } else {
          alert('Error al leer el archivo JSON.');
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 via-rose-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-red-200">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base sm:text-lg text-slate-900 tracking-tight leading-none">
                Sistema de Inventarios <span className="text-red-600 font-extrabold">Grupo Petroil</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Control de Hardware, Responsivas, Mantenimiento y Sucursales
            </p>
          </div>
        </div>

        {/* Search bar */}
        <div className="flex-1 max-w-md hidden md:block">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por placa, serie, colaborador, marca o modelo..."
              value={searchQuery}
              onChange={(e) => onSearch(e.target.value)}
              className="w-full bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-xs pl-9 pr-4 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all outline-hidden text-slate-800"
            />
            {searchQuery && (
              <button 
                onClick={() => onSearch('')} 
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Gmail API Status Button */}
          <div className="relative">
            {isGmailConnected ? (
              <div>
                <button
                  type="button"
                  onClick={() => setShowGmailMenu(!showGmailMenu)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold text-emerald-800 transition-colors cursor-pointer"
                  title="Gmail conectado vía Google OAuth. Clic para gestionar."
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <Mail className="w-3.5 h-3.5 text-red-600 shrink-0" />
                  <span className="hidden sm:inline font-mono text-[11px]">
                    {gmailProfile?.emailAddress?.split('@')[0] || 'Gmail'}
                  </span>
                  <ChevronDown className="w-3 h-3 text-emerald-700" />
                </button>

                {showGmailMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-50 animate-in fade-in zoom-in-95 text-xs space-y-2">
                    <div className="border-b border-slate-100 pb-2">
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Cuenta Google Conectada</span>
                      <strong className="text-slate-900 font-mono block truncate mt-0.5">{gmailProfile?.emailAddress || 'Conectado'}</strong>
                      <span className="text-[11px] text-emerald-700 font-medium">API de Gmail operativa</span>
                    </div>
                    <div className="pt-1 flex justify-between items-center">
                      <button
                        onClick={() => {
                          setShowGmailMenu(false);
                          onOpenAlerts();
                        }}
                        className="text-red-600 hover:text-red-800 font-semibold text-[11px]"
                      >
                        Abrir Bandeja / Alertas
                      </button>
                      <button
                        onClick={() => {
                          setShowGmailMenu(false);
                          disconnectGoogle();
                        }}
                        className="text-slate-500 hover:text-rose-600 text-[11px] flex items-center gap-1"
                      >
                        <LogOut className="w-3 h-3" />
                        Desconectar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden sm:block">
                <GoogleSignInButton
                  onClick={connectGoogle}
                  disabled={isGmailConnecting}
                  label={isGmailConnecting ? 'Conectando...' : 'Conectar Gmail'}
                  size="sm"
                />
              </div>
            )}
          </div>

          {/* Cloud Sync Status Indicator */}
          <div 
            onClick={forceCloudSync}
            title={`Base de datos en la nube provisionada y activa (Proyecto: gen-lang-client-0946159343, Región: us-east1). Última sincronización: ${lastCloudSyncTime}. Haz clic para forzar sincronización.`}
            className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs cursor-pointer hover:bg-slate-100 transition-colors"
          >
            <div className={`w-2 h-2 rounded-full ${isCloudSyncing ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'}`} />
            <span className="text-slate-600 font-medium flex items-center gap-1">
              <Cloud className="w-3.5 h-3.5 text-indigo-600" />
              {isCloudSyncing ? 'Sincronizando...' : 'Base en la Nube Activa'}
            </span>
            <span className="text-[10px] text-slate-400 font-mono hidden xl:inline">
              {lastCloudSyncTime}
            </span>
          </div>

          {/* Notifications bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotificationsMenu(!showNotificationsMenu)}
              className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              title="Alertas del sistema"
            >
              <Bell className="w-5 h-5" />
              {totalUrgentCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center animate-bounce">
                  {totalUrgentCount}
                </span>
              )}
            </button>

            {/* Notifications preview dropdown */}
            {showNotificationsMenu && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 py-3 z-50 animate-in fade-in zoom-in-95">
                <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                  <span className="font-semibold text-sm text-slate-900 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-amber-500" />
                    Alertas Críticas ({totalUrgentCount})
                  </span>
                  <button 
                    onClick={() => { setShowNotificationsMenu(false); onOpenAlerts(); }}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    Ver todas
                  </button>
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 px-2">
                  {totalUrgentCount === 0 ? (
                    <div className="py-6 text-center text-slate-500 text-xs flex flex-col items-center">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
                      Todos los equipos están al día y con garantías vigentes.
                    </div>
                  ) : (
                    <>
                      {maintenanceAlerts.map(asset => {
                        const maint = getMaintenanceStatus(asset.nextMaintenanceDate);
                        return (
                          <div 
                            key={`maint-${asset.id}`} 
                            onClick={() => { setShowNotificationsMenu(false); onOpenAlerts(); }}
                            className="p-2.5 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                          >
                            <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                              <span className="flex items-center gap-1.5">
                                <Wrench className="w-3.5 h-3.5 text-amber-500" />
                                {asset.assetTag} - {asset.name}
                              </span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded border ${maint.badgeClass}`}>
                                {maint.label}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1">
                              Mantenimiento periódico preventivo programado para el {asset.nextMaintenanceDate}.
                            </p>
                          </div>
                        );
                      })}

                      {warrantyAlerts.map(asset => {
                        const war = getWarrantyStatus(asset.warrantyEndDate);
                        return (
                          <div 
                            key={`war-${asset.id}`}
                            onClick={() => { setShowNotificationsMenu(false); onOpenAlerts(); }}
                            className="p-2.5 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                          >
                            <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                              <span className="flex items-center gap-1.5">
                                <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                                {asset.assetTag} (Garantía)
                              </span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded border ${war.badgeClass}`}>
                                {war.label}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1">
                              Vencimiento: {asset.warrantyEndDate}. Proveedor: {asset.supplier}.
                            </p>
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Quick Backup/Export button */}
          <div className="hidden sm:flex items-center gap-1 border-l border-slate-200 pl-3">
            <button
              onClick={exportDataJSON}
              title="Descargar copia de seguridad en JSON"
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-indigo-600 transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>
            <label 
              title="Importar base de datos JSON" 
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-indigo-600 transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          {/* User & Role Switcher */}
          <div className="relative border-l border-slate-200 pl-3">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 transition-colors text-left"
            >
              <div className="relative">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs border shadow-xs ${
                  currentUser.role === 'edicion_total'
                    ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                    : currentUser.role === 'visor'
                    ? 'bg-amber-100 border-amber-300 text-amber-800'
                    : 'bg-indigo-100 border-indigo-200 text-indigo-700'
                }`}>
                  {currentUser.name.charAt(0)}
                </div>
                <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-bold text-white ${
                  currentUser.role === 'edicion_total'
                    ? 'bg-emerald-600'
                    : currentUser.role === 'visor'
                    ? 'bg-amber-600'
                    : 'bg-indigo-600'
                }`}>
                  {currentUser.role === 'edicion_total' ? '★' : currentUser.role === 'visor' ? '👁' : '✓'}
                </span>
              </div>

              <div className="hidden md:block">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold text-slate-900 leading-tight">
                    {currentUser.name.split(' ')[0]} {currentUser.name.split(' ')[1] || ''}
                  </p>
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                    currentUser.role === 'edicion_total'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : currentUser.role === 'visor'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  }`}>
                    {currentUser.role === 'edicion_total' ? 'Edición Total' : currentUser.role === 'visor' ? 'Visor (Solo Lectura)' : currentUser.roleTitle.split('/')[0]}
                  </span>
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Role Switcher Menu */}
            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2.5 z-50 animate-in fade-in zoom-in-95">
                <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-900">Operadores del Sistema</p>
                    <p className="text-[11px] text-slate-500">Cambiar operador activo:</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowRoleMenu(false);
                      onOpenSettings();
                    }}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                  >
                    Gestionar
                  </button>
                </div>
                
                <div className="py-1 px-1.5 space-y-1 max-h-60 overflow-y-auto">
                  {(systemUsers || []).map(user => {
                    const isSelected = currentUser.id === user.id;
                    const isEdicion = user.role === 'edicion_total';
                    const isVis = user.role === 'visor';

                    return (
                      <button
                        key={user.id}
                        onClick={() => handleUserSelect(user)}
                        className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between text-xs transition-colors cursor-pointer ${
                          isSelected 
                            ? 'bg-indigo-50/90 font-semibold text-indigo-950 border border-indigo-200' 
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-900 truncate">{user.name}</span>
                            {isEdicion && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-bold shrink-0">
                                Total
                              </span>
                            )}
                            {isVis && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 font-bold shrink-0">
                                Visor
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 truncate">{user.email} • {user.roleTitle}</p>
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="p-1.5 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setShowRoleMenu(false);
                      onOpenSettings();
                    }}
                    className="w-full px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer mb-1"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Administrar Usuarios & Permisos</span>
                  </button>
                </div>

                <div className="px-3.5 py-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
                  <span>Sede: <strong className="text-slate-700">{currentUser.branchName?.split('(')[0] || 'Corporativo'}</strong></span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${canEdit ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                    {canEdit ? 'Escritura Activa' : 'Solo Lectura'}
                  </span>
                </div>

                <div className="p-1.5 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setShowRoleMenu(false);
                      logout();
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 hover:bg-rose-50 text-rose-700 hover:text-rose-800 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Cerrar Sesión / Salir a Pantalla de Login</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
};
