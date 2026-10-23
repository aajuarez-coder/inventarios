import React from 'react';
import { Send, AlertTriangle, X, ShieldCheck, Mail } from 'lucide-react';

interface GmailConfirmSendModalProps {
  isOpen: boolean;
  to: string;
  subject: string;
  summary: string;
  senderEmail?: string;
  isSending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const GmailConfirmSendModal: React.FC<GmailConfirmSendModalProps> = ({
  isOpen,
  to,
  subject,
  summary,
  senderEmail,
  isSending = false,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-300 overflow-hidden animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-600/30 text-red-400 flex items-center justify-center">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Confirmación de Envío por Gmail</h3>
              <p className="text-[11px] text-slate-400">Autorización explícita para enviar correo desde su cuenta</p>
            </div>
          </div>
          <button 
            onClick={onCancel}
            disabled={isSending}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 leading-relaxed">
              <span className="font-semibold block mb-0.5">Autorización requerida:</span>
              Está a punto de enviar un correo electrónico real a través de la API de Gmail en nombre de su cuenta autenticada 
              {senderEmail && <strong className="font-semibold"> ({senderEmail})</strong>}.
            </div>
          </div>

          <div className="space-y-2 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-500 font-medium">Destinatario:</span>
              <div className="font-semibold text-slate-900 mt-0.5">{to}</div>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Asunto:</span>
              <div className="font-semibold text-slate-900 mt-0.5">{subject}</div>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Resumen del contenido:</span>
              <div className="text-slate-700 mt-0.5 whitespace-pre-wrap">{summary}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-slate-100/70 p-2.5 rounded-lg">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>El correo quedará registrado en su carpeta de &quot;Enviados&quot; de Gmail y en la bitácora interna de ITAM.</span>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSending}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSending}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-all focus:ring-2 focus:ring-red-500 focus:ring-offset-1 disabled:opacity-50 cursor-pointer"
          >
            {isSending ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Enviando por Gmail...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Confirmar y Enviar Correo</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
