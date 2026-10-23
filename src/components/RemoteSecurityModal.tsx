import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Lock, 
  Unlock, 
  Monitor, 
  Send, 
  AlertTriangle, 
  Key, 
  Copy, 
  Check, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  Terminal, 
  X, 
  CheckCircle2, 
  Clock, 
  Cpu, 
  Server,
  Printer,
  Info,
  Radio,
  Play
} from 'lucide-react';
import { HardwareAsset, DeviceCommand, DeviceCommandType, BitLockerStatus } from '../types/inventory';
import { useInventory } from '../context/InventoryContext';
import { formatDateTime } from '../utils/formatters';

interface RemoteSecurityModalProps {
  asset: HardwareAsset;
  onClose: () => void;
  agentHostname?: string;
  agentId?: string;
}

export const RemoteSecurityModal: React.FC<RemoteSecurityModalProps> = ({
  asset,
  onClose,
  agentHostname,
  agentId
}) => {
  const { currentUser, sendRemoteCommand, simulateCommandExecution, fetchDeviceCommands, canEdit } = useInventory();

  const [activeTab, setActiveTab] = useState<'bitlocker' | 'screen' | 'message' | 'history'>('bitlocker');
  const [commands, setCommands] = useState<DeviceCommand[]>([]);
  const [loading, setLoading] = useState(false);
  const [executingCmdId, setExecutingCmdId] = useState<string | null>(null);
  const [statusFeedback, setStatusFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // BitLocker state
  const [showRecoveryKey, setShowRecoveryKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [bitlockerReason, setBitlockerReason] = useState('Sospecha de extravío / Incumplimiento de políticas TI');
  const [confirmBitlockerModal, setConfirmBitlockerModal] = useState(false);
  const [bitlockerLockState, setBitlockerLockState] = useState<'unlocked' | 'locked'>('unlocked');

  // Screen lock state
  const [screenPreNotice, setScreenPreNotice] = useState(true);
  const [screenGracePeriod, setScreenGracePeriod] = useState(15);
  const [screenLockReason, setScreenLockReason] = useState('Bloqueo preventivo de seguridad ordenado por la Dirección de TI');

  // Popup message state
  const [msgTitle, setMsgTitle] = useState('Aviso Urgente de TI — Grupo Petroil');
  const [msgText, setMsgText] = useState('Por favor contacte de inmediato a la Mesa de Ayuda TI (Ext. 2400) para validación de inventario y políticas de seguridad.');
  const [msgUrgency, setMsgUrgency] = useState<'info' | 'warning' | 'critical'>('warning');
  const [msgDuration, setMsgDuration] = useState(60);

  // Realistic mock BitLocker status for asset
  const defaultRecoveryKey = '582914-381920-491028-192847-592817-482910-384918-294819';
  const resolvedHostname = agentHostname || asset.name || asset.assetTag;
  const resolvedAgentId = agentId || `agent-${resolvedHostname.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

  const loadCommands = async () => {
    const list = await fetchDeviceCommands(asset.id);
    if (list && list.length > 0) {
      setCommands(list);
      // Check latest bitlocker command to infer lock state
      const blCmd = list.find(c => c.commandType === 'bitlocker_lock' && c.status === 'executed');
      const unCmd = list.find(c => c.commandType === 'bitlocker_unlock' && c.status === 'executed');
      if (blCmd && (!unCmd || new Date(blCmd.createdAt) > new Date(unCmd.createdAt))) {
        setBitlockerLockState('locked');
      } else {
        setBitlockerLockState('unlocked');
      }
    }
  };

  useEffect(() => {
    loadCommands();
    const interval = setInterval(loadCommands, 5000);
    return () => clearInterval(interval);
  }, [asset.id]);

  const handleCopyRecoveryKey = () => {
    navigator.clipboard.writeText(defaultRecoveryKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 3000);
  };

  const handleDispatchBitlockerLock = async () => {
    setLoading(true);
    setStatusFeedback(null);
    try {
      const result = await sendRemoteCommand({
        targetId: asset.id,
        commandType: 'bitlocker_lock',
        parameters: {
          bitlockerDrive: 'C:',
          reason: bitlockerReason,
          recoveryKeyNotice: true
        },
        agentId: resolvedAgentId,
        targetHostname: resolvedHostname
      });

      if (result.success && result.command) {
        setCommands(prev => [result.command!, ...prev]);
        setStatusFeedback({
          type: 'success',
          message: `Comando de bloqueo BitLocker despachado. El agente inhabilitará protectores TPM en el próximo reinicio.`
        });
        setConfirmBitlockerModal(false);
        // Automatically simulate execution after 1.5s for instant feedback
        setTimeout(async () => {
          if (result.command?.id) {
            await handleSimulateAgent(result.command.id);
          }
        }, 1500);
      } else {
        setStatusFeedback({ type: 'error', message: result.error || 'Error enviando comando' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDispatchBitlockerUnlock = async () => {
    setLoading(true);
    setStatusFeedback(null);
    try {
      const result = await sendRemoteCommand({
        targetId: asset.id,
        commandType: 'bitlocker_unlock',
        parameters: {
          bitlockerDrive: 'C:',
          reason: 'Restauración de protectores TPM autorizada'
        },
        agentId: resolvedAgentId,
        targetHostname: resolvedHostname
      });

      if (result.success && result.command) {
        setCommands(prev => [result.command!, ...prev]);
        setStatusFeedback({
          type: 'success',
          message: `Protectores BitLocker restaurados exitosamente en ${resolvedHostname}.`
        });
        setTimeout(async () => {
          if (result.command?.id) {
            await handleSimulateAgent(result.command.id);
          }
        }, 1500);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDispatchScreenLock = async () => {
    setLoading(true);
    setStatusFeedback(null);
    try {
      const result = await sendRemoteCommand({
        targetId: asset.id,
        commandType: 'screen_lock',
        parameters: {
          lockImmediate: !screenPreNotice,
          displayDurationSeconds: screenGracePeriod,
          reason: screenLockReason
        },
        agentId: resolvedAgentId,
        targetHostname: resolvedHostname
      });

      if (result.success && result.command) {
        setCommands(prev => [result.command!, ...prev]);
        setStatusFeedback({
          type: 'success',
          message: `Orden de bloqueo de pantalla LockWorkStation enviada al host ${resolvedHostname}.`
        });
        setTimeout(async () => {
          if (result.command?.id) {
            await handleSimulateAgent(result.command.id);
          }
        }, 1200);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDispatchMessage = async () => {
    if (!msgText.trim()) return;
    setLoading(true);
    setStatusFeedback(null);
    try {
      const result = await sendRemoteCommand({
        targetId: asset.id,
        commandType: 'display_message',
        parameters: {
          messageTitle: msgTitle,
          messageText: msgText,
          messageUrgency: msgUrgency,
          displayDurationSeconds: msgDuration
        },
        agentId: resolvedAgentId,
        targetHostname: resolvedHostname
      });

      if (result.success && result.command) {
        setCommands(prev => [result.command!, ...prev]);
        setStatusFeedback({
          type: 'success',
          message: `Aviso emergente desplegado en la pantalla del colaborador en ${resolvedHostname}.`
        });
        setTimeout(async () => {
          if (result.command?.id) {
            await handleSimulateAgent(result.command.id);
          }
        }, 1000);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateAgent = async (commandId: string) => {
    setExecutingCmdId(commandId);
    try {
      const res = await simulateCommandExecution(commandId);
      if (res.success && res.command) {
        setCommands(prev => prev.map(c => c.id === commandId ? res.command! : c));
        if (res.command.commandType === 'bitlocker_lock') {
          setBitlockerLockState('locked');
        } else if (res.command.commandType === 'bitlocker_unlock') {
          setBitlockerLockState('unlocked');
        }
      }
    } finally {
      setExecutingCmdId(null);
    }
  };

  const handlePrintRecoverySlip = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Clave de Recuperación BitLocker - ${asset.assetTag}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #1e293b; }
          .header { border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
          .title { font-size: 20px; font-weight: bold; }
          .badge { background: #fee2e2; color: #991b1b; padding: 4px 10px; border-radius: 4px; font-weight: bold; font-size: 12px; }
          .box { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .key { font-family: monospace; font-size: 22px; font-weight: bold; letter-spacing: 2px; color: #0f172a; word-break: break-all; text-align: center; padding: 15px; background: #fff; border: 1px dashed #94a3b8; border-radius: 6px; }
          .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 13px; margin-top: 15px; }
          .footer { margin-top: 40px; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 15px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">FICHA CONFIDENCIAL DE RECUPERACIÓN BITLOCKER</div>
            <div style="font-size: 13px; color: #64748b;">Grupo Petroil — Dirección de Tecnologías de la Información</div>
          </div>
          <span class="badge">USO EXCLUSIVO TI</span>
        </div>
        <div class="box">
          <div style="font-size: 12px; font-weight: bold; text-transform: uppercase; color: #64748b; margin-bottom: 8px;">Clave Numérica de Recuperación (48 Dígitos):</div>
          <div class="key">${defaultRecoveryKey}</div>
          <div class="meta">
            <div><strong>Equipo / Placa:</strong> ${asset.assetTag} (${asset.brand} ${asset.model})</div>
            <div><strong>Número de Serie:</strong> ${asset.serialNumber}</div>
            <div><strong>Hostname Agente:</strong> ${resolvedHostname}</div>
            <div><strong>Volumen Protegido:</strong> C: (Sistema Operativo)</div>
            <div><strong>Cifrado:</strong> XTS-AES 256-bit TPM 2.0</div>
            <div><strong>Fecha Emisión:</strong> ${new Date().toLocaleString()}</div>
          </div>
        </div>
        <div style="font-size: 12px; line-height: 1.6; color: #475569;">
          <strong>Instrucciones de Desbloqueo:</strong><br/>
          1. Encienda el equipo en la pantalla azul de BitLocker.<br/>
          2. Con el teclado numérico o fila de números, introduzca los 8 bloques de 6 dígitos separados por guion.<br/>
          3. Presione Enter. Una vez iniciado Windows, abra una consola de PowerShell como Administrador y ejecute <code>manage-bde -protectors -enable C:</code> para restaurar el inicio automático seguro con TPM.
        </div>
        <div class="footer">
          Documento confidencial emitido por el sistema Petroil ITAsset Central Hub. Destruir de manera segura una vez concluido el desbloqueo técnico.
        </div>
        <script>
          window.print();
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95">
        
        {/* Modal Top Header */}
        <div className="p-5 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${
              bitlockerLockState === 'locked' 
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-400' 
                : 'bg-indigo-600/20 border-indigo-500/40 text-indigo-400'
            }`}>
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-indigo-300 font-bold border border-slate-700">
                  {asset.assetTag}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Host: {resolvedHostname}
                </span>
                {bitlockerLockState === 'locked' && (
                  <span className="text-[11px] px-2 py-0.5 rounded bg-rose-500/30 text-rose-300 border border-rose-400/30 font-bold flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    BitLocker Bloqueado
                  </span>
                )}
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight mt-0.5">
                Seguridad & Control Remoto del Agente
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 px-6 bg-slate-50 gap-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('bitlocker')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'bitlocker' 
                ? 'border-indigo-600 text-indigo-600' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Bloqueo BitLocker & Clave</span>
          </button>

          <button
            onClick={() => setActiveTab('screen')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'screen' 
                ? 'border-indigo-600 text-indigo-600' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>Bloqueo de Pantalla</span>
          </button>

          <button
            onClick={() => setActiveTab('message')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'message' 
                ? 'border-indigo-600 text-indigo-600' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Avisos en Pantalla</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'history' 
                ? 'border-indigo-600 text-indigo-600' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Historial de Comandos ({commands.length})</span>
          </button>
        </div>

        {/* Feedback Alert */}
        {statusFeedback && (
          <div className={`mx-6 mt-4 p-3 rounded-xl text-xs flex items-center justify-between ${
            statusFeedback.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}>
            <div className="flex items-center gap-2">
              {statusFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{statusFeedback.message}</span>
            </div>
            <button 
              onClick={() => setStatusFeedback(null)}
              className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer ml-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* Main Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs text-slate-700">
          
          {/* TAB 1: BITLOCKER */}
          {activeTab === 'bitlocker' && (
            <div className="space-y-5">
              {/* Status Header Card */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">Cifrado de Unidad BitLocker (C:)</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      bitlockerLockState === 'locked'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {bitlockerLockState === 'locked' ? 'Bloqueo Forzado Activo' : 'Cifrado & Protegido'}
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    Método: XTS-AES 256-bit · Módulo TPM 2.0 presente y vinculado · Estado de volumen: C: NTFS
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {bitlockerLockState === 'locked' ? (
                    <button
                      onClick={handleDispatchBitlockerUnlock}
                      disabled={loading}
                      className="px-3.5 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      <span>Desbloquear / Restaurar TPM</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setConfirmBitlockerModal(true)}
                      disabled={loading}
                      className="px-3.5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Bloquear con BitLocker</span>
                    </button>
                  )}
                </div>
              </div>

              {/* BitLocker Recovery Key Card */}
              <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-amber-600" />
                    <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                      Clave Numérica de Recuperación BitLocker (48 Dígitos)
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setShowRecoveryKey(!showRecoveryKey)}
                      className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      {showRecoveryKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showRecoveryKey ? 'Ocultar' : 'Revelar'}</span>
                    </button>
                    <button
                      onClick={handleCopyRecoveryKey}
                      className="px-2.5 py-1 text-xs text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey ? 'Copiado' : 'Copiar'}</span>
                    </button>
                    <button
                      onClick={handlePrintRecoverySlip}
                      className="px-2.5 py-1 text-xs text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                      title="Imprimir Ficha de Recuperación para Entrega a Técnico"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Imprimir Ficha</span>
                    </button>
                  </div>
                </div>

                <div className="bg-slate-900 text-slate-100 p-3 rounded-lg font-mono text-center tracking-widest text-sm font-bold select-all">
                  {showRecoveryKey 
                    ? defaultRecoveryKey 
                    : '•••••• - •••••• - •••••• - •••••• - •••••• - •••••• - •••••• - ••••••'}
                </div>

                <div className="text-[11px] text-slate-500 leading-relaxed">
                  <strong>Uso de emergencia:</strong> Si el equipo fue bloqueado o entra en modo de recuperación, el colaborador o técnico debe ingresar esta clave de 48 dígitos en la pantalla azul de arranque para restablecer el acceso a los datos corporativos.
                </div>
              </div>

              {/* Technical instructions info */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 space-y-1.5 text-amber-900">
                <span className="font-semibold flex items-center gap-1.5 text-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  Mecanismo Técnico de Bloqueo a través del Agente:
                </span>
                <p className="text-[11px] leading-relaxed text-amber-800">
                  Al solicitar el bloqueo desde esta consola, el agente invoca <code>manage-bde -forcerecovery C:</code> deshabilitando los protectores de arranque del TPM. En el próximo reinicio o encendido, Windows solicitará obligatoriamente la clave de recuperación numérica, imposibilitando el inicio de sesión y protegiendo la información ante robo o extravío.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: BLOQUEO DE PANTALLA */}
          {activeTab === 'screen' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-indigo-600" />
                  <span className="font-bold text-slate-900 text-sm">Bloqueo Remoto de Sesión Gráfica (LockWorkStation)</span>
                </div>
                <p className="text-slate-500 text-xs">
                  Fuerza el bloqueo inmediato de la sesión de Windows en el equipo <code>{resolvedHostname}</code>, cerrando la visualización del escritorio del colaborador y requiriendo credenciales institucionales.
                </p>
              </div>

              <div className="space-y-3 bg-white border border-slate-200 rounded-xl p-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Motivo / Justificación del Bloqueo:
                  </label>
                  <input
                    type="text"
                    value={screenLockReason}
                    onChange={(e) => setScreenLockReason(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    placeholder="Ej. Fin de turno no reportado, equipo desatendido en área pública..."
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="preNotice"
                    checked={screenPreNotice}
                    onChange={(e) => setScreenPreNotice(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <label htmlFor="preNotice" className="text-xs text-slate-700 cursor-pointer font-medium">
                    Mostrar aviso previo en pantalla antes del bloqueo (Cuenta regresiva)
                  </label>
                </div>

                {screenPreNotice && (
                  <div className="pl-6 space-y-1">
                    <span className="text-[11px] text-slate-500">Tiempo de gracia antes de bloquear:</span>
                    <div className="flex gap-2">
                      {[10, 15, 30, 60].map((sec) => (
                        <button
                          key={sec}
                          type="button"
                          onClick={() => setScreenGracePeriod(sec)}
                          className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                            screenGracePeriod === sec 
                              ? 'bg-indigo-600 text-white' 
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {sec} segundos
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={handleDispatchScreenLock}
                    disabled={loading}
                    className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Ejecutar Bloqueo de Pantalla Ahora</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: AVISOS EN PANTALLA */}
          {activeTab === 'message' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4 text-indigo-600" />
                  <span className="font-bold text-slate-900 text-sm">Enviar Mensaje Emergente al Colaborador</span>
                </div>
                <p className="text-slate-500 text-xs">
                  Despliega una ventana emergente en primer plano en la pantalla activa del usuario en <code>{resolvedHostname}</code> mediante el agente de telemetría Petroil.
                </p>
              </div>

              <div className="space-y-3 bg-white border border-slate-200 rounded-xl p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nivel de Urgencia del Aviso:
                    </label>
                    <select
                      value={msgUrgency}
                      onChange={(e) => setMsgUrgency(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="info">Informativo (Azul / Rutinario)</option>
                      <option value="warning">Advertencia (Ámbar / Mantenimiento o Póliza)</option>
                      <option value="critical">Crítico / Bloqueo Inminente (Rojo)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Duración en Pantalla:
                    </label>
                    <select
                      value={msgDuration}
                      onChange={(e) => setMsgDuration(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                    >
                      <option value={30}>30 segundos</option>
                      <option value={60}>1 minuto (Estándar)</option>
                      <option value={120}>2 minutos</option>
                      <option value={300}>5 minutos</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Título de la Notificación:
                  </label>
                  <input
                    type="text"
                    value={msgTitle}
                    onChange={(e) => setMsgTitle(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    placeholder="Título del mensaje..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cuerpo del Mensaje:
                  </label>
                  <textarea
                    rows={3}
                    value={msgText}
                    onChange={(e) => setMsgText(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
                    placeholder="Escriba las instrucciones para el usuario..."
                  />
                </div>

                {/* Live Preview of popup */}
                <div className="pt-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Vista previa de cómo lo verá el colaborador:
                  </span>
                  <div className={`p-4 rounded-xl border shadow-xs ${
                    msgUrgency === 'critical' 
                      ? 'bg-rose-50/90 border-rose-300 text-rose-950' 
                      : msgUrgency === 'warning'
                      ? 'bg-amber-50/90 border-amber-300 text-amber-950'
                      : 'bg-indigo-50/90 border-indigo-200 text-indigo-950'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <ShieldAlert className="w-4 h-4 shrink-0" />
                      <span className="font-bold text-xs">{msgTitle || 'Aviso de TI'}</span>
                    </div>
                    <p className="text-xs leading-relaxed">{msgText || 'Sin mensaje especificado'}</p>
                    <div className="mt-2 text-[10px] text-slate-500 flex items-center justify-between">
                      <span>Grupo Petroil TI · Mazatlán, Sin.</span>
                      <span>Cierra en {msgDuration}s</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={handleDispatchMessage}
                    disabled={loading || !msgText.trim()}
                    className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Despachar Aviso a Pantalla</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: HISTORIAL DE COMANDOS */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-600">
                  Bitácora de Comandos del Dispositivo ({commands.length})
                </span>
                <button
                  onClick={loadCommands}
                  className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg flex items-center gap-1 cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Actualizar</span>
                </button>
              </div>

              {commands.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-xl border border-slate-200">
                  <Terminal className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs text-slate-600 font-medium">No hay comandos registrados para este activo.</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Los bloqueos de BitLocker, pantalla y avisos aparecerán aquí.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {commands.map((cmd) => {
                    const isExecuted = cmd.status === 'executed';
                    const isSent = cmd.status === 'sent';
                    const isPending = cmd.status === 'pending';

                    return (
                      <div key={cmd.id} className="p-3 bg-white border border-slate-200 rounded-xl space-y-2 hover:border-slate-300 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono ${
                              cmd.commandType.includes('bitlocker')
                                ? 'bg-rose-100 text-rose-800'
                                : cmd.commandType === 'screen_lock'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-cyan-100 text-cyan-800'
                            }`}>
                              {cmd.commandType}
                            </span>
                            <span className="text-[11px] font-semibold text-slate-800">
                              {cmd.targetHostname}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 ${
                              isExecuted 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : isSent 
                                ? 'bg-amber-100 text-amber-800' 
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              {isExecuted ? <Check className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                              <span>{cmd.status === 'executed' ? 'Ejecutado' : cmd.status === 'sent' ? 'Recibido por Agente' : 'En cola'}</span>
                            </span>

                            {/* Simulation Button to verify live execution */}
                            {!isExecuted && (
                              <button
                                onClick={() => handleSimulateAgent(cmd.id)}
                                disabled={executingCmdId === cmd.id}
                                className="px-2 py-0.5 text-[10px] font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded flex items-center gap-1 cursor-pointer transition-colors"
                                title="Simular que el agente de Windows procesa el comando inmediatamente"
                              >
                                <Play className="w-3 h-3 text-indigo-600" />
                                <span>{executingCmdId === cmd.id ? 'Ejecutando...' : 'Probar / Simular'}</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {cmd.outputMessage && (
                          <div className="bg-slate-900 text-emerald-300 p-2 rounded-lg font-mono text-[11px] leading-relaxed">
                            {cmd.outputMessage}
                          </div>
                        )}

                        <div className="text-[10px] text-slate-400 flex items-center justify-between">
                          <span>Solicitado por: {cmd.requestedBy}</span>
                          <span>{formatDateTime(cmd.createdAt)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
            <span>Canal seguro WebSocket/REST de agente activo</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>

      </div>

      {/* Confirmation Modal for BitLocker Lock */}
      {confirmBitlockerModal && (
        <div className="fixed inset-0 z-60 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-rose-300 p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 rounded-xl bg-rose-100 text-rose-700">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">¿Confirmar Bloqueo BitLocker?</h3>
                <span className="text-xs text-rose-700 font-medium">Acción restrictiva de alta seguridad</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Esta acción inhabilitará los protectores TPM del volumen <strong>C:</strong> en el equipo <strong>{resolvedHostname}</strong>. En el próximo reinicio, el sistema no cargará Windows a menos que el técnico ingrese la clave de 48 dígitos.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Motivo institucional obligatorio:
              </label>
              <textarea
                rows={2}
                value={bitlockerReason}
                onChange={(e) => setBitlockerReason(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmBitlockerModal(false)}
                className="px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-xl border border-slate-300 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDispatchBitlockerLock}
                disabled={loading || !bitlockerReason.trim()}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Confirmar y Bloquear Equipo</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
