import React, { useState, useEffect } from 'react';
import { useInventory } from '../context/InventoryContext';
import { useGmail } from '../context/GmailContext';
import { HardwareAsset, EmailNotification } from '../types/inventory';
import { GoogleSignInButton } from './GoogleSignInButton';
import { CustomGmailComposeModal } from './CustomGmailComposeModal';
import { EmailSimulatorModal } from './EmailSimulatorModal';
import { EmailTemplates, GmailMessageSummary } from '../services/gmailService';
import { 
  BellRing, 
  ShieldAlert, 
  Clock, 
  Mail, 
  Send, 
  CheckCircle2, 
  ExternalLink, 
  Laptop, 
  Wrench, 
  AlertTriangle,
  History,
  Inbox,
  RefreshCw,
  Search,
  PlusCircle,
  LogOut,
  Sparkles
} from 'lucide-react';
import { formatDate, formatDateTime, getWarrantyStatus, getMaintenanceStatus } from '../utils/formatters';
import confetti from 'canvas-confetti';

export const AlertsCenter: React.FC = () => {
  const { assets, employees, emailLogs, sendWarrantyEmailAlert, currentUser } = useInventory();
  const { 
    isConnected, 
    isConnecting, 
    connectGoogle, 
    disconnectGoogle, 
    gmailProfile, 
    fetchRecentMessages, 
    sendEmailWithConfirmation 
  } = useGmail();

  const [activeTab, setActiveTab] = useState<'all' | 'maintenance' | 'warranty' | 'emaillogs' | 'gmail_inbox'>('all');
  const [selectedAssetForEmail, setSelectedAssetForEmail] = useState<HardwareAsset | null>(null);
  const [showCustomCompose, setShowCustomCompose] = useState(false);
  const [composeInitialTo, setComposeInitialTo] = useState('');
  const [composeInitialSubject, setComposeInitialSubject] = useState('');

  // Gmail Inbox state
  const [gmailMessages, setGmailMessages] = useState<GmailMessageSummary[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [gmailSearchQuery, setGmailSearchQuery] = useState('');
  const [gmailError, setGmailError] = useState<string | null>(null);

  // Warranties
  const warrantyAlerts = assets
    .map(a => ({ asset: a, warranty: getWarrantyStatus(a.warrantyEndDate) }))
    .filter(item => item.warranty.status === 'por_vencer' || item.warranty.status === 'vencida')
    .sort((a, b) => a.warranty.daysRemaining - b.warranty.daysRemaining);

  // Maintenances
  const maintenanceAlerts = assets
    .map(a => ({ 
      asset: a, 
      maint: getMaintenanceStatus(a.nextMaintenanceDate),
      employee: employees.find(e => e.id === a.assignedToEmployeeId)
    }))
    .filter(item => item.maint.status === 'vencido' || item.maint.status === 'proximo')
    .sort((a, b) => a.maint.daysRemaining - b.maint.daysRemaining);

  const loadGmailMessages = async (query = '') => {
    if (!isConnected) return;
    setIsLoadingMessages(true);
    setGmailError(null);
    try {
      const msgs = await fetchRecentMessages(query, 12);
      setGmailMessages(msgs);
    } catch (err: any) {
      setGmailError(err?.message || 'Error al cargar mensajes de Gmail');
    } finally {
      setIsLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'gmail_inbox' && isConnected) {
      loadGmailMessages(gmailSearchQuery);
    }
  }, [activeTab, isConnected]);

  const handleSendWarrantyAlert = async (assetId: string) => {
    const asset = assets.find(a => a.id === assetId);
    if (!asset) return;

    const war = getWarrantyStatus(asset.warrantyEndDate);
    const assignedEmp = employees.find(e => e.id === asset.assignedToEmployeeId);

    if (isConnected) {
      const htmlBody = EmailTemplates.warrantyAlert({
        assetTag: asset.assetTag,
        assetBrandModel: `${asset.brand} ${asset.model}`,
        serialNumber: asset.serialNumber,
        supplier: asset.supplier,
        warrantyEndDate: formatDate(asset.warrantyEndDate),
        daysRemaining: war.daysRemaining,
        assignedToName: assignedEmp?.fullName
      });

      const summary = `Destinatario: compras-ti@petroil.com.mx\nAsunto: [Alerta Crítica] Vencimiento de Garantía - ${asset.assetTag}\nProveedor: ${asset.supplier}\nVence: ${formatDate(asset.warrantyEndDate)}`;

      const res = await sendEmailWithConfirmation(
        {
          to: 'compras-ti@petroil.com.mx',
          subject: `[Alerta Crítica] Vencimiento de Garantía - Placa ${asset.assetTag}`,
          htmlBody
        },
        summary
      );

      if (res.success) {
        sendWarrantyEmailAlert(assetId);
        confetti({ particleCount: 50, spread: 50 });
      }
    } else {
      sendWarrantyEmailAlert(assetId);
      alert('Alerta de vencimiento de garantía registrada en la bitácora interna de correos.');
    }
  };

  return (
    <div className="space-y-5">
      
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BellRing className="w-5 h-5 text-red-600" />
            Centro de Notificaciones & Alertas con Gmail
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitoreo preventivo de fin de garantías, avisos de mantenimiento periódico y despacho de correos vía Gmail API.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setComposeInitialTo('');
              setComposeInitialSubject('');
              setShowCustomCompose(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            Redactar Correo Gmail
          </button>

          <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            {warrantyAlerts.length} Garantías Críticas
          </span>
          <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            {maintenanceAlerts.length} Mantenimientos Urgentes
          </span>
        </div>
      </div>

      {/* Gmail Integration Status Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-4 text-white shadow-md border border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-red-400 backdrop-blur-xs shrink-0">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm">Servicio de Correo Google Workspace / Gmail</h3>
              {isConnected ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Conectado
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Desconectado
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              {isConnected 
                ? `Cuenta activa: ${gmailProfile?.emailAddress || 'Google User'} • Total mensajes: ${gmailProfile?.messagesTotal || '0'}`
                : 'Conecte su cuenta autorizada de Petroil para emitir notificaciones y responsivas reales por Gmail.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isConnected ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setActiveTab('gmail_inbox');
                  loadGmailMessages();
                }}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Inbox className="w-3.5 h-3.5" />
                Ver Bandeja Gmail
              </button>
              <button
                onClick={disconnectGoogle}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-white text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer"
                title="Cerrar sesión de Gmail"
              >
                <LogOut className="w-3.5 h-3.5" />
                Desconectar
              </button>
            </div>
          ) : (
            <GoogleSignInButton
              onClick={connectGoogle}
              disabled={isConnecting}
              label={isConnecting ? 'Conectando...' : 'Conectar Gmail'}
              size="md"
            />
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-4 text-xs font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveTab('all')}
          className={`py-2.5 border-b-2 transition-colors cursor-pointer shrink-0 ${
            activeTab === 'all' ? 'border-red-600 text-red-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Resumen de Alertas ({warrantyAlerts.length + maintenanceAlerts.length})
        </button>
        <button
          onClick={() => setActiveTab('maintenance')}
          className={`py-2.5 border-b-2 transition-colors cursor-pointer shrink-0 ${
            activeTab === 'maintenance' ? 'border-red-600 text-red-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Avisos de Mantenimiento ({maintenanceAlerts.length})
        </button>
        <button
          onClick={() => setActiveTab('warranty')}
          className={`py-2.5 border-b-2 transition-colors cursor-pointer shrink-0 ${
            activeTab === 'warranty' ? 'border-red-600 text-red-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Vencimiento de Garantías ({warrantyAlerts.length})
        </button>
        <button
          onClick={() => setActiveTab('emaillogs')}
          className={`py-2.5 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 ${
            activeTab === 'emaillogs' ? 'border-red-600 text-red-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          Bitácora ITAM ({emailLogs.length})
        </button>
        <button
          onClick={() => setActiveTab('gmail_inbox')}
          className={`py-2.5 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 ${
            activeTab === 'gmail_inbox' ? 'border-red-600 text-red-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Inbox className="w-3.5 h-3.5" />
          Bandeja Gmail & Enviados
        </button>
      </div>

      {/* Content */}
      {(activeTab === 'all' || activeTab === 'maintenance') && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              Equipos que requieren Mantenimiento Preventivo Periódico
            </h3>
            <span className="text-xs text-slate-400">Notificar a los colaboradores para entrega</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {maintenanceAlerts.map(({ asset, maint, employee }) => (
              <div 
                key={`maint-${asset.id}`} 
                className="bg-white rounded-xl border border-amber-200 p-4 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs">
                    <span className="font-mono font-bold text-red-700">[{asset.assetTag}]</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${maint.badgeClass}`}>
                      {maint.label}
                    </span>
                  </div>

                  <div className="mt-2.5">
                    <h4 className="font-bold text-sm text-slate-900">{asset.brand} {asset.model}</h4>
                    <p className="text-xs text-slate-500 font-mono">S/N: {asset.serialNumber}</p>
                    <p className="text-xs text-slate-700 mt-2">
                      Fecha Límite Programada: <strong className="text-amber-800">{formatDate(asset.nextMaintenanceDate)}</strong>
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Usuario Responsable: <strong className="text-slate-900">{employee?.fullName || 'En Almacén TI'}</strong> ({employee?.email || 'N/A'})
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                  {employee ? (
                    <button
                      onClick={() => setSelectedAssetForEmail(asset)}
                      className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      Enviar Correo de Aviso a {employee.fullName.split(' ')[0]}
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400">Equipo en almacén, programar en taller</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(activeTab === 'all' || activeTab === 'warranty') && (
        <div className="space-y-3 pt-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              Equipos con Garantía de Fábrica por Vencer o Vencida
            </h3>
            <span className="text-xs text-slate-400">Acciones con proveedores y pólizas</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {warrantyAlerts.map(({ asset, warranty }) => (
              <div 
                key={`war-${asset.id}`} 
                className="bg-white rounded-xl border border-rose-200 p-4 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs">
                    <span className="font-mono font-bold text-red-700">[{asset.assetTag}]</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${warranty.badgeClass}`}>
                      {warranty.label}
                    </span>
                  </div>

                  <div className="mt-2.5">
                    <h4 className="font-bold text-sm text-slate-900">{asset.brand} {asset.model}</h4>
                    <p className="text-xs text-slate-500 font-mono">S/N: {asset.serialNumber}</p>
                    <p className="text-xs text-slate-700 mt-2">
                      Vencimiento: <strong className="text-rose-800">{formatDate(asset.warrantyEndDate)}</strong>
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Proveedor: <span className="font-medium text-slate-800">{asset.supplier}</span> • Factura: <span className="font-mono">{asset.invoiceNumber}</span>
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end gap-2">
                  <button
                    onClick={() => handleSendWarrantyAlert(asset.id)}
                    className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {isConnected ? 'Enviar Notificación por Gmail' : 'Registrar Aviso Compras'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'emaillogs' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <span className="font-bold text-xs text-slate-800">
              Bitácora de Correos y Notificaciones Enviadas
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {emailLogs.length} notificaciones registradas
            </span>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {emailLogs.length === 0 ? (
              <p className="p-8 text-center text-slate-400">No se han despachado correos electrónicos todavía.</p>
            ) : (
              emailLogs.map(log => (
                <div key={log.id} className="p-4 hover:bg-slate-50/80 transition-colors space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 text-xs">{log.subject}</span>
                    <span className="font-mono text-[11px] text-slate-400">{formatDateTime(log.sentAt)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-500 text-[11px]">
                    <span>Destinatario: <strong className="text-slate-800 font-mono">{log.toEmail}</strong> ({log.toName})</span>
                    <span>Activo: <strong className="text-red-700 font-mono">{log.assetTag}</strong></span>
                    <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                      <CheckCircle2 className="w-3 h-3" /> Enviado
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 italic">
                    &quot;{log.contentSnippet}&quot;
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Real Gmail Inbox / Messages View */}
      {activeTab === 'gmail_inbox' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Inbox className="w-4 h-4 text-red-600" />
                Mensajes de Gmail ({gmailProfile?.emailAddress || 'Usuario Google'})
              </h3>
              <p className="text-xs text-slate-500">
                Consulta directa en tiempo real de correos mediante la API oficial de Gmail.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar en Gmail (ej. responsiva, soporte)..."
                  value={gmailSearchQuery}
                  onChange={(e) => setGmailSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') loadGmailMessages(gmailSearchQuery);
                  }}
                  className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-red-500 w-64"
                />
              </div>
              <button
                onClick={() => loadGmailMessages(gmailSearchQuery)}
                disabled={isLoadingMessages}
                className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingMessages ? 'animate-spin' : ''}`} />
                Actualizar
              </button>
            </div>
          </div>

          {!isConnected ? (
            <div className="p-8 text-center space-y-3 bg-slate-50 rounded-xl">
              <p className="text-xs text-slate-600">
                Inicie sesión con su cuenta Google autorizada para consultar los correos enviados y recibidos.
              </p>
              <GoogleSignInButton
                onClick={connectGoogle}
                disabled={isConnecting}
                label="Conectar cuenta Gmail"
                size="md"
              />
            </div>
          ) : gmailError ? (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs">
              {gmailError}
            </div>
          ) : isLoadingMessages ? (
            <div className="p-10 text-center space-y-2">
              <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-500">Consultando mensajes vía Gmail API...</p>
            </div>
          ) : gmailMessages.length === 0 ? (
            <p className="p-8 text-center text-slate-400 text-xs">No se encontraron mensajes en la bandeja con este criterio.</p>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {gmailMessages.map(msg => (
                <div key={msg.id} className="py-3 hover:bg-slate-50/70 transition-colors px-2 rounded-lg">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-slate-900 truncate">{msg.subject}</span>
                    <span className="font-mono text-[11px] text-slate-400 shrink-0">{msg.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 text-[11px] mt-1">
                    <span>De: <strong className="text-slate-700">{msg.from}</strong></span>
                    {msg.to && <span>• Para: <span className="font-mono">{msg.to}</span></span>}
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 line-clamp-1 italic text-slate-500">
                    {msg.snippet}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Simulator / Real Gmail Modal */}
      {selectedAssetForEmail && (
        <EmailSimulatorModal
          asset={selectedAssetForEmail}
          employee={employees.find(e => e.id === selectedAssetForEmail.assignedToEmployeeId)}
          onClose={() => setSelectedAssetForEmail(null)}
        />
      )}

      {/* Custom Gmail Compose Modal */}
      {showCustomCompose && (
        <CustomGmailComposeModal
          isOpen={true}
          defaultTo={composeInitialTo}
          defaultSubject={composeInitialSubject}
          onClose={() => setShowCustomCompose(false)}
        />
      )}

    </div>
  );
};
