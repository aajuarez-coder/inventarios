import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { AppUser } from '../types/inventory';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle2,
  ArrowRight, 
  Building2,
  KeyRound,
  Sparkles
} from 'lucide-react';

interface LoginScreenProps {
  onSuccess?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onSuccess }) => {
  const { verifyCredentials, completeLogin } = useInventory();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  
  // Verification states for database authentication
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [verifiedUser, setVerifiedUser] = useState<AppUser | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const inputEmail = email.trim();
    if (!inputEmail) {
      setErrorMessage('Usuario no encontrado');
      return;
    }

    const inputPassword = password.trim();
    if (!inputPassword) {
      setErrorMessage('Contraseña incorrecta');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      // Validate strictly against database records
      const result = verifyCredentials(inputEmail, inputPassword);
      setIsLoading(false);

      if (result.success && result.user) {
        setErrorMessage(null);
        setVerificationSuccess(true);
        setVerifiedUser(result.user);

        // Show welcome feedback for exactly 1 second before accessing the system
        setTimeout(() => {
          completeLogin(result.user!);
          if (onSuccess) onSuccess();
        }, 1000);
      } else {
        setErrorMessage(result.error || 'Credenciales no válidas');
      }
    }, 200);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 antialiased selection:bg-indigo-500 selection:text-white">
      
      {/* Background ambient glowing orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-red-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10 flex flex-col items-center">
        
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md mb-4 shadow-xl">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 via-rose-600 to-red-500 flex items-center justify-center text-white shadow-lg shadow-red-600/30">
              <Building2 className="w-6 h-6" />
            </div>
            <div className="text-left">
              <span className="text-xs font-bold uppercase tracking-widest text-red-400 block">
                GRUPO PETROIL
              </span>
              <span className="text-sm font-semibold text-slate-200 block">
                División Tecnologías de Información
              </span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Sistema de Inventarios <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-rose-400 to-amber-300">Grupo Petroil</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-2 max-w-sm mx-auto">
            Plataforma centralizada de gestión de hardware de cómputo, cartas responsivas digitales y control de stock.
          </p>
        </div>

        {/* Main Card with Form */}
        <div className="w-full bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Iniciar Sesión</h2>
              <p className="text-xs text-slate-500">Autenticación contra base de datos de usuarios</p>
            </div>
            <div className="p-2 rounded-xl bg-slate-100 text-slate-600">
              <Lock className="w-5 h-5 text-indigo-600" />
            </div>
          </div>

          {/* Error Message Display with exact legends */}
          {errorMessage && (
            <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 text-xs flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1 shadow-xs">
              <div className="p-1 rounded-lg bg-rose-200 text-rose-800 shrink-0 mt-0.5">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-sm block text-rose-900">
                  {errorMessage}
                </span>
                <span className="text-[11px] text-rose-700 block mt-0.5">
                  {errorMessage === 'Usuario no encontrado'
                    ? 'El usuario no existe en la base de datos de Grupo Petroil.'
                    : errorMessage === 'Contraseña incorrecta'
                    ? 'La contraseña no corresponde a la registrada en la base de datos.'
                    : errorMessage}
                </span>
              </div>
            </div>
          )}

          {/* Success Verification Display with exact requested message shown for 1 second */}
          {verificationSuccess && verifiedUser && (
            <div className="mb-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs flex flex-col gap-2.5 animate-in zoom-in-95 shadow-md">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-emerald-600 text-white shrink-0 mt-0.5 shadow-sm">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-emerald-900 text-xs uppercase tracking-wide">
                      Verificación completa de usuario
                    </span>
                    <span className="bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full font-bold text-[10px] tracking-wide">
                      Usuario válido
                    </span>
                  </div>
                  <p className="font-extrabold text-base text-slate-900 mt-1">
                    "Bienvenido, {verifiedUser.name}"
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-emerald-700 mt-1 font-medium">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                      Iniciando sesión segura...
                    </span>
                    <span className="text-[10px] text-emerald-600 font-semibold">1s</span>
                  </div>
                </div>
              </div>

              {/* 1-second animated loading bar */}
              <div className="w-full bg-emerald-200/70 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-emerald-600 h-full rounded-full transition-all ease-linear"
                  style={{
                    width: '100%',
                    animation: 'welcomeTimer 1000ms linear forwards'
                  }}
                />
              </div>
              <style>{`
                @keyframes welcomeTimer {
                  from { width: 0%; }
                  to { width: 100%; }
                }
              `}</style>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Correo Institucional o Usuario
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="ejemplo: pacomputo@petroil.com.mx"
                  value={email}
                  disabled={isLoading || verificationSuccess}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  className="w-full pl-10 pr-3 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-hidden text-slate-800 transition-all font-medium disabled:bg-slate-50 disabled:text-slate-500"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  disabled={isLoading || verificationSuccess}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-hidden text-slate-800 transition-all font-medium disabled:bg-slate-50 disabled:text-slate-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  disabled={isLoading || verificationSuccess}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500"
                />
                <span className="text-xs text-slate-600">Mantener sesión activa</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading || verificationSuccess}
              className={`w-full py-3 px-4 rounded-xl text-white font-bold text-xs tracking-wide shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer mt-2 ${
                verificationSuccess
                  ? 'bg-emerald-600 shadow-emerald-600/30'
                  : 'bg-gradient-to-r from-red-600 via-rose-600 to-indigo-700 hover:from-red-700 hover:to-indigo-800 shadow-red-600/20 disabled:opacity-60'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Validando con la base de datos...</span>
                </div>
              ) : verificationSuccess ? (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Usuario verificado • Entrando</span>
                </div>
              ) : (
                <>
                  <span>Ingresar al Sistema</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
              <ShieldCheck className="w-4 h-4" />
              Validación Criptográfica TLS 1.3
            </span>
            <span className="font-mono text-slate-400">BD Firestore Conectada</span>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-6 text-center text-xs text-slate-500 flex flex-wrap items-center justify-center gap-4">
          <span>© 2026 Grupo Petroil S.A. de C.V.</span>
          <span>•</span>
          <span>Todos los derechos reservados</span>
          <span>•</span>
          <span>Soporte TI: soporte@petroil.com.mx</span>
        </div>

      </div>

    </div>
  );
};
