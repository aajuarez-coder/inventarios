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
  Mail,
  Lock
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
    <header className="sticky top-0 z-30 bg-[#131a26] border-b border-[rgba(248,250,252,0.1)] text-[#f8fafc] h-[72px]">
      <div className="w-full px-4 sm:px-6 h-full flex items-center justify-between gap-4">
        
        {/* Brand */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-[42px] h-[42px] bg-white rounded-[4px] p-1 flex items-center justify-center shadow-sm">
            <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
              <path d="M50 8C50 8 22 42 22 64C22 79.464 34.536 92 50 92C65.464 92 78 79.464 78 64C78 42 50 8 50 8Z" fill="#004a99"/>
              <path d="M50 24C50 24 32 50 32 66C32 75.941 40.059 84 50 84C59.941 84 68 75.941 68 66C68 50 50 24 50 24Z" fill="#ff8200"/>
              <circle cx="50" cy="68" r="8" fill="#ffffff" />
            </svg>
          </div>
          <div>
            <h1 className="font-syne text-[0.95rem] sm:text-base font-extrabold tracking-tight text-[#f8fafc] flex items-center gap-1.5 uppercase">
              INVENTARIOS <span className="text-[#ff8200] font-black">| GRUPO PETROIL</span>
            </h1>
            <p className="label text-[9px] text-[rgba(248,250,252,0.5)] hidden sm:block">
              División TI • Mazatlán, Sin.
            </p>
          </div>
        </div>

        {/* Search bar */}
        <div className="flex-1 max-w-[500px] mx-4 hidden md:block">
          <div className="relative">
            <Search className="w-4 h-4 text-[rgba(248,250,252,0.4)] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por placa, serie, colaborador, marca o modelo..."
              value={searchQuery}
              onChange={(e) => onSearch(e.target.value)}
              className="w-full bg-[#0a0e14] hover:bg-[#0e141d] focus:bg-[#0a0e14] text-[0.85rem] pl-10 pr-8 py-2.5 rounded-[6px] border border-[rgba(248,250,252,0.1)] focus:border-[#ff8200] focus:ring-1 focus:ring-[#ff8200]/30 transition-all outline-hidden text-[#f8fafc] placeholder:text-[rgba(248,250,252,0.35)]"
            />
            {searchQuery && (
              <button 
                onClick={() => onSearch('')} 
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[rgba(248,250,252,0.4)] hover:text-[#f8fafc]"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Cloud Sync Status Indicator */}
          <div 
            onClick={forceCloudSync}
            title={`Base de datos en la nube provisionada y activa. Última sincronización: ${lastCloudSyncTime}. Haz clic para sincronizar.`}
            className="label hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xs bg-[#1a1a1c] border border-[rgba(242,239,235,0.12)] cursor-pointer hover:border-[rgba(242,239,235,0.25)] transition-colors"
          >
            <div className={`w-2 h-2 rounded-full ${isCloudSyncing ? 'bg-amber-400 animate-ping' : 'bg-[#10b981]'}`} />
            <span className="font-mono text-[10px] tracking-wider text-[#f2efeb] uppercase font-medium">
              {isCloudSyncing ? 'Sincronizando...' : 'Cloud Database Active'}
            </span>
          </div>

          {/* Gmail API Status Button */}
          <div className="relative">
            {isGmailConnected ? (
              <div>
                <button
                  type="button"
                  onClick={() => setShowGmailMenu(!showGmailMenu)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xs bg-[#1a1a1c] hover:bg-[#232326] border border-[rgba(242,239,235,0.15)] text-xs font-semibold text-[#f2efeb] transition-colors cursor-pointer"
                  title="Gmail conectado vía Google OAuth. Clic para gestionar."
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
                  <Mail className="w-3.5 h-3.5 text-[#ff8200] shrink-0" />
                  <span className="hidden sm:inline font-mono text-[10px] uppercase">
                    {gmailProfile?.emailAddress?.split('@')[0] || 'GMAIL'}
                  </span>
                  <ChevronDown className="w-3 h-3 text-[rgba(248,250,252,0.5)]" />
                </button>

                {showGmailMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-[#131a26] rounded-[6px] shadow-2xl border border-[rgba(248,250,252,0.15)] p-3 z-50 animate-in fade-in zoom-in-95 text-xs space-y-2 text-[#f8fafc]">
                    <div className="border-b border-[rgba(248,250,252,0.1)] pb-2">
                      <span className="label text-[9px] block">Cuenta Google Conectada</span>
                      <strong className="text-[#f8fafc] font-mono block truncate mt-0.5">{gmailProfile?.emailAddress || 'Conectado'}</strong>
                      <span className="text-[10px] text-[#10b981] font-mono">API de Gmail operativa</span>
                    </div>
                    <div className="pt-1 flex justify-between items-center">
                      <button
                        onClick={() => {
                          setShowGmailMenu(false);
                          onOpenAlerts();
                        }}
                        className="text-[#ff8200] hover:underline font-mono text-[10px] uppercase font-bold"
                      >
                        Abrir Alertas
                      </button>
                      <button
                        onClick={() => {
                          setShowGmailMenu(false);
                          disconnectGoogle();
                        }}
                        className="text-[rgba(248,250,252,0.6)] hover:text-rose-400 text-[10px] font-mono flex items-center gap-1 uppercase"
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
                <button
                  onClick={connectGoogle}
                  disabled={isGmailConnecting}
                  className="font-mono uppercase text-[10px] tracking-wider px-3 py-1.5 rounded-[6px] border border-[rgba(248,250,252,0.15)] bg-[#131a26] hover:bg-[#1c2738] text-[#f8fafc] font-medium transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isGmailConnecting ? 'Conectando...' : 'GMAIL CONNECT'}
                </button>
              </div>
            )}
          </div>

          {/* Notifications bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotificationsMenu(!showNotificationsMenu)}
              className="relative p-2 rounded-[6px] text-[rgba(248,250,252,0.7)] hover:bg-[#131a26] hover:text-[#f8fafc] transition-colors cursor-pointer border border-transparent hover:border-[rgba(248,250,252,0.1)]"
              title="Alertas del sistema"
            >
              <Bell className="w-4 h-4" />
              {totalUrgentCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#ff8200] text-white text-[9px] font-mono font-bold flex items-center justify-center animate-pulse">
                  {totalUrgentCount}
                </span>
              )}
            </button>

            {/* Notifications preview dropdown */}
            {showNotificationsMenu && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#1a1a1c] rounded-xs shadow-2xl border border-[rgba(242,239,235,0.15)] py-3 z-50 animate-in fade-in zoom-in-95 text-[#f2efeb]">
                <div className="px-4 pb-2 border-b border-[rgba(242,239,235,0.12)] flex items-center justify-between">
                  <span className="font-syne uppercase text-xs tracking-wider text-[#f2efeb] flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-[#ff4d4d]" />
                    Alertas Críticas ({totalUrgentCount})
                  </span>
                  <button 
                    onClick={() => { setShowNotificationsMenu(false); onOpenAlerts(); }}
                    className="label text-[#ff4d4d] hover:underline"
                  >
                    Ver todas
                  </button>
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-[rgba(242,239,235,0.08)] px-2">
                  {totalUrgentCount === 0 ? (
                    <div className="py-6 text-center text-[rgba(242,239,235,0.5)] text-xs flex flex-col items-center">
                      <CheckCircle2 className="w-8 h-8 text-[#10b981] mb-2" />
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
                            className="p-2.5 hover:bg-[#202024] rounded-xs cursor-pointer transition-colors"
                          >
                            <div className="flex items-center justify-between text-xs font-semibold text-[#f2efeb]">
                              <span className="flex items-center gap-1.5">
                                <Wrench className="w-3.5 h-3.5 text-amber-400" />
                                {asset.assetTag} - {asset.name}
                              </span>
                              <span className="badge badge-amber">
                                {maint.label}
                              </span>
                            </div>
                            <p className="text-[11px] text-[rgba(242,239,235,0.5)] mt-1">
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
                            className="p-2.5 hover:bg-[#202024] rounded-xs cursor-pointer transition-colors"
                          >
                            <div className="flex items-center justify-between text-xs font-semibold text-[#f2efeb]">
                              <span className="flex items-center gap-1.5">
                                <ShieldAlert className="w-3.5 h-3.5 text-[#ff4d4d]" />
                                {asset.assetTag} (Garantía)
                              </span>
                              <span className="badge badge-red">
                                {war.label}
                              </span>
                            </div>
                            <p className="text-[11px] text-[rgba(242,239,235,0.5)] mt-1">
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
          <div className="hidden sm:flex items-center gap-1 border-l border-[rgba(242,239,235,0.12)] pl-3">
            <button
              onClick={exportDataJSON}
              title="Descargar copia de seguridad en JSON"
              className="p-2 rounded-xs text-[rgba(242,239,235,0.7)] hover:bg-[#1a1a1c] hover:text-[#f2efeb] transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
            </button>
            <label 
              title="Importar base de datos JSON" 
              className="p-2 rounded-xs text-[rgba(242,239,235,0.7)] hover:bg-[#1a1a1c] hover:text-[#f2efeb] transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          {/* User & Role Switcher */}
          <div className="relative border-l border-[rgba(248,250,252,0.12)] pl-3">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-2.5 p-1.5 rounded-[6px] hover:bg-[#1c2738] transition-colors text-left cursor-pointer border border-transparent hover:border-[rgba(248,250,252,0.1)]"
            >
              <div className="relative">
                <div className="w-8 h-8 rounded-[6px] bg-[#004a99] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  {currentUser.name.charAt(0)}
                </div>
                <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border border-[#0a0e14] flex items-center justify-center text-[7px] font-bold text-white ${
                  currentUser.role === 'edicion_total'
                    ? 'bg-[#10b981]'
                    : currentUser.role === 'visor'
                    ? 'bg-amber-500'
                    : 'bg-[#ff8200]'
                }`}>
                  {currentUser.role === 'edicion_total' ? '★' : currentUser.role === 'visor' ? '👁' : '✓'}
                </span>
              </div>

              <div className="hidden md:block">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-semibold text-[#f8fafc] leading-tight">
                    {currentUser.name.split(' ')[0]} {currentUser.name.split(' ')[1] || ''}
                  </p>
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="badge text-[9px] py-0 px-1 border border-[rgba(248,250,252,0.15)] text-[rgba(248,250,252,0.7)]">
                    {currentUser.role === 'edicion_total' ? 'Edición Total' : currentUser.role === 'visor' ? 'Visor' : currentUser.roleTitle?.split('/')[0] || 'Admin TI'}
                  </span>
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[rgba(248,250,252,0.4)]" />
            </button>

            {/* User Profile Card - Profile switching blocked for security */}
            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-84 bg-[#131a26] rounded-[6px] shadow-2xl border border-[rgba(248,250,252,0.15)] py-3 z-50 animate-in fade-in zoom-in-95 text-[#f8fafc]">
                <div className="px-4 pb-2.5 border-b border-[rgba(248,250,252,0.1)] flex items-center justify-between">
                  <div>
                    <p className="font-syne text-xs uppercase tracking-wider text-[#f8fafc] font-bold">Perfil del Operador</p>
                    <p className="label text-[9px] text-[rgba(248,250,252,0.5)]">Sesión activa protegida</p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[9px] font-mono px-2 py-0.5 rounded-[4px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    En línea
                  </span>
                </div>

                {/* Operator info details */}
                <div className="p-3.5 space-y-3 bg-[#0a0e14]/50 my-2 mx-2.5 rounded-[6px] border border-[rgba(248,250,252,0.06)]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[6px] bg-[#004a99] text-white flex items-center justify-center font-bold text-sm shadow-md shrink-0">
                      {currentUser.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-[#f8fafc] truncate font-syne">{currentUser.name}</h4>
                      <p className="text-[11px] text-[rgba(248,250,252,0.6)] font-mono truncate">{currentUser.email}</p>
                      <span className="inline-block mt-1 badge text-[9px] bg-[#004a99]/30 text-sky-300 border border-[#004a99]/50 font-mono">
                        {currentUser.roleTitle || (currentUser.role === 'edicion_total' ? 'Administrador Maestro' : 'Operador TI')}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[rgba(248,250,252,0.08)] space-y-1.5 text-[11px] font-mono">
                    <div className="flex items-center justify-between text-[rgba(248,250,252,0.7)]">
                      <span className="text-[rgba(248,250,252,0.4)]">Sede Asignada:</span>
                      <span className="font-semibold text-[#f8fafc] truncate max-w-[170px]">{currentUser.branchName || 'Corporativo Central'}</span>
                    </div>
                    <div className="flex items-center justify-between text-[rgba(248,250,252,0.7)]">
                      <span className="text-[rgba(248,250,252,0.4)]">Nivel de Acceso:</span>
                      <span className={`font-semibold ${canEdit ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {canEdit ? 'Escritura & Control Total' : 'Solo Lectura (Visor)'}
                      </span>
                    </div>
                  </div>

                  {/* Security Notice: Profile switching is explicitly blocked */}
                  <div className="p-2.5 rounded-[4px] bg-[#131a26] border border-amber-500/20 text-[10px] text-amber-200/90 flex items-start gap-2">
                    <Lock className="w-3.5 h-3.5 text-[#ff8200] shrink-0 mt-0.5" />
                    <span className="leading-tight font-mono">
                      <strong className="text-amber-100">Cambio de perfil no permitido:</strong> Por seguridad de auditoría, para ingresar con otro operador debe cerrar la sesión e ingresar con sus credenciales.
                    </span>
                  </div>
                </div>

                {canEdit && (
                  <div className="p-1.5 border-t border-[rgba(248,250,252,0.1)]">
                    <button
                      onClick={() => {
                        setShowRoleMenu(false);
                        onOpenSettings();
                      }}
                      className="w-full px-3 py-1.5 rounded-[6px] bg-[#1c2738] hover:bg-[#253347] text-[#f8fafc] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-[rgba(248,250,252,0.1)] font-mono text-[11px] uppercase"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-[#ff8200]" />
                      <span>Directorio de Usuarios & Permisos</span>
                    </button>
                  </div>
                )}

                <div className="p-1.5 border-t border-[rgba(248,250,252,0.1)]">
                  <button
                    onClick={() => {
                      setShowRoleMenu(false);
                      disconnectGoogle().catch(() => {});
                      logout();
                    }}
                    className="w-full px-3 py-2 rounded-[6px] bg-rose-500/10 hover:bg-rose-500/20 text-[#ff8200] text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer border border-rose-500/20 font-mono text-[11px] uppercase shadow-xs"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Cerrar Sesión</span>
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
