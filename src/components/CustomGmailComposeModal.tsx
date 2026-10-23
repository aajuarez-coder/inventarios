import React, { useState } from 'react';
import { useGmail } from '../context/GmailContext';
import { useInventory } from '../context/InventoryContext';
import { GoogleSignInButton } from './GoogleSignInButton';
import { 
  Mail, 
  Send, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  User, 
  Paperclip,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CustomGmailComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTo?: string;
  defaultSubject?: string;
  defaultBody?: string;
}

export const CustomGmailComposeModal: React.FC<CustomGmailComposeModalProps> = ({
  isOpen,
  onClose,
  defaultTo = '',
  defaultSubject = '',
  defaultBody = ''
}) => {
  const { isConnected, connectGoogle, isConnecting, sendEmailWithConfirmation, gmailProfile } = useGmail();
  const { employees, currentUser } = useInventory();

  const [to, setTo] = useState(defaultTo);
  const [cc, setCc] = useState('');
  const [subject, setSubject] = useState(defaultSubject);
  const [message, setMessage] = useState(defaultBody);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleSelectEmployee = (empEmail: string) => {
    setTo(empEmail);
  };

  const applyTemplate = (templateType: 'mantenimiento' | 'recordatorio' | 'seguridad') => {
    if (templateType === 'mantenimiento') {
      setSubject('[Soporte TI Petroil] Citatorio para Mantenimiento Preventivo');
      setMessage(
        `Estimado(a) colaborador(a),\n\nLe contactamos del Departamento de TI para coordinar el mantenimiento preventivo de su equipo de cómputo asignado.\n\nFavor de confirmar su disponibilidad para esta semana o acudir directamente al taller de soporte en Planta Baja.\n\nAtentamente,\n${currentUser.name}\nTecnologías de la Información • Petroil`
      );
    } else if (templateType === 'recordatorio') {
      setSubject('[Aviso Importante TI] Firma pendiente de Carta Responsiva');
      setMessage(
        `Estimado(a) colaborador(a),\n\nLe recordamos amablemente que tiene pendiente la firma digital de su Carta Responsiva de equipo informático.\n\nPuede acceder al sistema interno o solicitar la reimpresión con el personal de TI.\n\nAtentamente,\n${currentUser.name}\nSoporte TI`
      );
    } else {
      setSubject('[Seguridad TI Petroil] Recomendaciones de Ciberseguridad y Respaldo');
      setMessage(
        `Estimado personal,\n\nSe les recuerda mantener sincronizados sus archivos de trabajo en Google Drive y no compartir contraseñas institucionales ni credenciales de red.\n\nAtentamente,\nSeguridad de la Información • Petroil TI`
      );
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!to.trim() || !subject.trim() || !message.trim()) {
      setStatusMessage({ type: 'error', text: 'Por favor complete el destinatario, asunto y mensaje.' });
      return;
    }

    // Build standard corporate HTML wrapper
    const formattedHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; line-height: 1.6;">
        <div style="background-color: #0f172a; padding: 20px 28px; border-bottom: 3px solid #dc2626;">
          <span style="background: #dc2626; color: #fff; font-size: 10px; font-weight: bold; padding: 3px 6px; border-radius: 3px;">PETROIL TI</span>
          <h2 style="color: #ffffff; margin: 8px 0 0; font-size: 16px;">${subject}</h2>
        </div>
        <div style="padding: 24px; background: #ffffff; border: 1px solid #e2e8f0; border-top: none;">
          ${message.split('\n\n').map(p => `<p style="margin: 0 0 14px;">${p.replace(/\n/g, '<br/>')}</p>`).join('')}
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0 16px;" />
          <p style="font-size: 11px; color: #64748b; margin: 0;">
            Correo enviado desde el Sistema de Gestión de Activos Informáticos de Petroil por <strong>${currentUser.name}</strong>.
          </p>
        </div>
      </div>
    `;

    const summary = `Destinatario: ${to}\nAsunto: ${subject}\n\nFragmento:\n${message.substring(0, 140)}${message.length > 140 ? '...' : ''}`;

    const res = await sendEmailWithConfirmation(
      {
        to,
        cc: cc.trim() || undefined,
        subject,
        htmlBody: formattedHtml,
        plainText: message
      },
      summary
    );

    if (res.success) {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      setStatusMessage({ type: 'success', text: 'Correo enviado con éxito a través de Gmail API.' });
      setTimeout(() => {
        onClose();
      }, 1500);
    } else if (res.error && !res.error.includes('cancelada')) {
      setStatusMessage({ type: 'error', text: res.error });
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-300 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-red-600/30 text-red-400">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Redactar Correo con Gmail</h3>
              <p className="text-[11px] text-slate-400">
                {isConnected 
                  ? `Enviando desde: ${gmailProfile?.emailAddress || 'Cuenta Google Petroil'}`
                  : 'Requiere conexión con cuenta Google para envío real'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Not connected banner */}
        {!isConnected ? (
          <div className="p-8 text-center space-y-4 bg-slate-50 border-b border-slate-200">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto shadow-xs border border-red-100">
              <Mail className="w-6 h-6" />
            </div>
            <div className="max-w-md mx-auto">
              <h4 className="font-bold text-slate-900 text-sm">Conectar con Google Workspace / Gmail</h4>
              <p className="text-xs text-slate-500 mt-1">
                Para enviar correos reales directamente desde su cuenta de correo corporativo a los colaboradores, inicie sesión con Google.
              </p>
            </div>
            <div className="pt-2">
              <GoogleSignInButton
                onClick={connectGoogle}
                disabled={isConnecting}
                label={isConnecting ? 'Conectando...' : 'Conectar con Google'}
                size="md"
              />
            </div>
          </div>
        ) : null}

        {/* Compose Form */}
        <form onSubmit={handleSend} className="p-5 overflow-y-auto space-y-4 text-xs">
          {statusMessage && (
            <div className={`p-3 rounded-xl flex items-center gap-2 ${statusMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
              {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Quick templates */}
          <div className="flex items-center gap-2 flex-wrap pb-1">
            <span className="text-slate-400 font-semibold flex items-center gap-1 text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Plantillas rápidas:
            </span>
            <button
              type="button"
              onClick={() => applyTemplate('mantenimiento')}
              className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
            >
              Mantenimiento Preventivo
            </button>
            <button
              type="button"
              onClick={() => applyTemplate('recordatorio')}
              className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
            >
              Firma de Responsiva
            </button>
            <button
              type="button"
              onClick={() => applyTemplate('seguridad')}
              className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
            >
              Seguridad TI
            </button>
          </div>

          {/* To field */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-700">Para (Destinatario):</label>
              <div className="flex items-center gap-1 text-[11px] text-slate-500">
                <span>Sugerir colaborador:</span>
                <select
                  onChange={(e) => {
                    if (e.target.value) handleSelectEmployee(e.target.value);
                  }}
                  defaultValue=""
                  className="bg-transparent border border-slate-200 rounded px-1.5 py-0.5 text-[11px] text-slate-700 outline-none"
                >
                  <option value="" disabled>Seleccionar de lista...</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.email}>
                      {emp.fullName} ({emp.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <input
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="correo@petroil.com.mx"
              required
              className="w-full p-2.5 border border-slate-300 rounded-lg bg-white font-mono text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>

          {/* Cc field */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Con Copia (Cc - opcional):</label>
            <input
              type="text"
              value={cc}
              onChange={(e) => setCc(e.target.value)}
              placeholder="soporte-ti@petroil.com.mx"
              className="w-full p-2 border border-slate-300 rounded-lg bg-white font-mono text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          {/* Subject */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Asunto:</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ej. [Soporte TI] Aviso de entrega de equipo de cómputo"
              required
              className="w-full p-2.5 border border-slate-300 rounded-lg bg-white font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          {/* Body */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Cuerpo del Mensaje:</label>
            <textarea
              rows={8}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escriba el contenido del mensaje institucional..."
              required
              className="w-full p-3 border border-slate-300 rounded-lg bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none leading-relaxed"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <div className="text-[11px] text-slate-400">
              {isConnected ? (
                <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Se enviará con la cuenta oficial Gmail
                </span>
              ) : (
                <span className="text-amber-600">Requiere conectar cuenta Google para enviar</span>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium"
              >
                Cerrar
              </button>
              <button
                type="submit"
                disabled={!isConnected}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold shadow-xs cursor-pointer transition-all"
              >
                <Send className="w-4 h-4" />
                <span>Enviar por Gmail</span>
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
};
