import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { useGmail } from '../context/GmailContext';
import { HardwareAsset, Employee } from '../types/inventory';
import { GoogleSignInButton } from './GoogleSignInButton';
import { EmailTemplates } from '../services/gmailService';
import { 
  Mail, 
  Send, 
  CheckCircle2, 
  Clock, 
  Laptop, 
  Calendar, 
  Building2, 
  ShieldAlert, 
  X,
  FileCheck,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { formatDate } from '../utils/formatters';
import confetti from 'canvas-confetti';

interface EmailSimulatorModalProps {
  asset: HardwareAsset;
  employee?: Employee;
  scheduledDate?: string;
  onClose: () => void;
}

export const EmailSimulatorModal: React.FC<EmailSimulatorModalProps> = ({
  asset,
  employee,
  scheduledDate,
  onClose
}) => {
  const { sendMaintenanceEmailAlert, branches, currentUser } = useInventory();
  const { isConnected, connectGoogle, isConnecting, sendEmailWithConfirmation, gmailProfile } = useGmail();

  const [customDate, setCustomDate] = useState(scheduledDate || asset.nextMaintenanceDate || '2026-10-22');
  const [locationRoom, setLocationRoom] = useState('Taller de Soporte Técnico TI (Piso 14 / Planta Baja)');
  const [backupNote, setBackupNote] = useState(true);
  const [chargerNote, setChargerNote] = useState(true);
  const [additionalNote, setAdditionalNote] = useState('');
  const [sendMode, setSendMode] = useState<'gmail' | 'local'>(isConnected ? 'gmail' : 'local');
  const [isSent, setIsSent] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const empName = employee?.fullName || 'Alejandro Juárez';
  const empEmail = employee?.email || 'aajuarez@petroil.com.mx';
  const branch = branches.find(b => b.id === asset.branchId);

  const emailSubject = `[Soporte TI] Aviso de Mantenimiento Preventivo Periódico - Equipo ${asset.assetTag}`;

  const handleSend = async () => {
    setFeedback(null);

    if (sendMode === 'gmail' && isConnected) {
      // Build corporate HTML email
      const htmlBody = EmailTemplates.maintenanceNotice({
        employeeName: empName,
        assetTag: asset.assetTag,
        assetBrandModel: `${asset.brand} ${asset.model}`,
        scheduledDate: formatDate(customDate),
        locationRoom,
        backupNote,
        chargerNote,
        additionalInstructions: additionalNote.trim() || undefined
      });

      const summary = `Destinatario: ${empName} <${empEmail}>\nAsunto: ${emailSubject}\nFecha programada: ${formatDate(customDate)}\nUbicación: ${locationRoom}`;

      const res = await sendEmailWithConfirmation(
        {
          to: empEmail,
          subject: emailSubject,
          htmlBody
        },
        summary
      );

      if (res.success) {
        // Also register in local ITAM history
        sendMaintenanceEmailAlert(asset.id, customDate, additionalNote);
        setIsSent(true);
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
        setFeedback('¡Correo oficial enviado exitosamente a la cuenta de Gmail del colaborador!');
        setTimeout(() => {
          onClose();
        }, 1800);
      } else if (res.error && !res.error.includes('cancelada')) {
        setFeedback(`Error al enviar por Gmail: ${res.error}`);
      }
    } else {
      // Standard internal log
      sendMaintenanceEmailAlert(asset.id, customDate, additionalNote);
      setIsSent(true);
      confetti({ particleCount: 60, spread: 55, origin: { y: 0.6 } });
      setFeedback('Notificación guardada en la bitácora interna de correos.');
      setTimeout(() => {
        onClose();
      }, 1800);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-300 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 max-h-[92vh]">
        
        {/* Modal Top Bar */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-red-600/30 text-red-400">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Notificador de Mantenimiento por Correo</h3>
              <p className="text-[11px] text-slate-400">Despacho oficial para el colaborador custodio del equipo</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Gmail Connection / Dispatch Mode Banner */}
        <div className="p-3 bg-slate-100 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">Modo de Envío:</span>
            <div className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => setSendMode('gmail')}
                className={`px-2.5 py-1 rounded-md font-semibold text-xs transition-all cursor-pointer ${
                  sendMode === 'gmail' 
                    ? 'bg-red-600 text-white shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Gmail API Real
              </button>
              <button
                type="button"
                onClick={() => setSendMode('local')}
                className={`px-2.5 py-1 rounded-md font-semibold text-xs transition-all cursor-pointer ${
                  sendMode === 'local' 
                    ? 'bg-slate-800 text-white shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Solo Bitácora Interna
              </button>
            </div>
          </div>

          <div>
            {isConnected ? (
              <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-medium text-[11px]">
                  Gmail: <strong>{gmailProfile?.emailAddress || 'Conectado'}</strong>
                </span>
              </div>
            ) : (
              <GoogleSignInButton
                onClick={connectGoogle}
                disabled={isConnecting}
                label={isConnecting ? 'Conectando...' : 'Conectar Gmail'}
                size="sm"
              />
            )}
          </div>
        </div>

        {/* Email Headers Form */}
        <div className="bg-slate-50 border-b border-slate-200 p-4 space-y-2 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span className="font-semibold text-slate-600">Para (Colaborador):</span>
              <div className="mt-0.5 p-2 rounded-lg border border-slate-200 bg-white font-mono text-slate-800">
                {empName} &lt;{empEmail}&gt;
              </div>
            </div>

            <div>
              <span className="font-semibold text-slate-600">De (Remitente):</span>
              <div className="mt-0.5 p-2 rounded-lg border border-slate-200 bg-white font-mono text-slate-800">
                {sendMode === 'gmail' && gmailProfile?.emailAddress 
                  ? `${currentUser.name} <${gmailProfile.emailAddress}>`
                  : 'Soporte y Mesa de Ayuda <soporte-ti@petroil.com.mx>'}
              </div>
            </div>
          </div>

          <div>
            <span className="font-semibold text-slate-600">Asunto:</span>
            <div className="mt-0.5 p-2 rounded-lg border border-slate-200 bg-white font-medium text-slate-900">
              {emailSubject}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="font-semibold text-slate-600 block mb-0.5">Fecha y Hora Programada:</label>
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white text-xs outline-hidden"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-600 block mb-0.5">Punto de Entrega / Taller TI:</label>
              <input
                type="text"
                value={locationRoom}
                onChange={(e) => setLocationRoom(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white text-xs outline-hidden"
              />
            </div>
          </div>

          {/* Options */}
          <div className="flex flex-wrap gap-4 pt-1">
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
              <input 
                type="checkbox" 
                checked={backupNote} 
                onChange={(e) => setBackupNote(e.target.checked)} 
                className="rounded text-red-600 focus:ring-red-500"
              />
              <span>Incluir recordatorio de respaldo en Google Drive</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
              <input 
                type="checkbox" 
                checked={chargerNote} 
                onChange={(e) => setChargerNote(e.target.checked)} 
                className="rounded text-red-600 focus:ring-red-500"
              />
              <span>Requerir entrega de cargador original</span>
            </label>
          </div>
        </div>

        {/* Realistic HTML Email Preview Container */}
        <div className="p-5 bg-slate-100 overflow-y-auto max-h-[45vh]">
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-4 text-xs font-sans text-slate-800">
            
            {/* Email Brand Header */}
            <div className="border-b border-indigo-100 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-slate-900 font-mono">PETROIL</span>
                <span className="text-[10px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                  Tecnologías de Información
                </span>
              </div>
              <span className="text-[10px] text-slate-400">Aviso Oficial de TI</span>
            </div>

            {/* Greeting */}
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Estimado(a) {empName},
              </p>
              <p className="text-slate-600 mt-1 leading-relaxed">
                Le saludamos cordialmente desde el departamento de Tecnologías de Información. A través del presente correo le informamos que a su equipo de cómputo corporativo asignado le corresponde su <strong>mantenimiento preventivo periódico obligatorio</strong>.
              </p>
            </div>

            {/* Equipment Card inside Email */}
            <div className="p-3.5 rounded-xl border border-red-100 bg-red-50/40 space-y-2">
              <span className="font-bold text-[11px] uppercase tracking-wider text-red-900 block">
                Ficha del Activo Informático:
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px]">Placa de Inventario:</span>
                  <strong className="font-mono text-slate-950">{asset.assetTag}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Número de Serie:</span>
                  <strong className="font-mono text-slate-800">{asset.serialNumber}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Modelo:</span>
                  <span className="text-slate-800">{asset.brand} {asset.model}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Fecha Límite:</span>
                  <strong className="text-amber-800">{formatDate(customDate)}</strong>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="space-y-2">
              <h5 className="font-bold text-xs text-slate-900">
                Instrucciones y Recomendaciones Previas:
              </h5>
              <ul className="space-y-1.5 text-slate-600 pl-4 list-disc text-[11px]">
                {backupNote && (
                  <li>
                    <strong>Respaldo de información:</strong> Por favor asegúrese de sincronizar sus archivos importantes en Google Drive corporativo previo a la entrega.
                  </li>
                )}
                {chargerNote && (
                  <li>
                    <strong>Llevar accesorios:</strong> Es indispensable presentar la computadora junto con su cargador original para pruebas de batería y voltaje.
                  </li>
                )}
                <li>
                  <strong>Duración estimada:</strong> El servicio preventivo (limpieza interna, cambio de pasta térmica, actualización y diagnóstico) toma de 45 a 60 minutos.
                </li>
                <li>
                  <strong>Lugar:</strong> Favor de acudir a: <em>{locationRoom}</em>.
                </li>
              </ul>
            </div>

            {/* CTA in email */}
            <div className="pt-2 text-center">
              <div className="inline-block px-5 py-2 rounded-lg bg-red-600 text-white font-bold text-xs shadow-xs">
                Cita Programada: {formatDate(customDate)}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-100 pt-3 text-[10px] text-slate-400 text-center">
              Mesa de Ayuda y Soporte TI • Petroil Corp • {branch?.name || 'Sede Mazatlán'} • soporte-ti@petroil.com.mx
            </div>

          </div>
        </div>

        {/* Feedback Alert if any */}
        {feedback && (
          <div className="p-3 bg-indigo-50 border-t border-indigo-100 text-indigo-900 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Modal Actions */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {sendMode === 'gmail' ? 'Se enviará por Gmail API con confirmación previa.' : 'Se guardará en el registro local.'}
          </span>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-medium cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={handleSend}
              disabled={isSent || (sendMode === 'gmail' && !isConnected)}
              className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:bg-slate-400 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              {isSent ? (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Notificación Despachada
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" /> 
                  {sendMode === 'gmail' ? 'Enviar vía Gmail' : 'Registrar Aviso'}
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
