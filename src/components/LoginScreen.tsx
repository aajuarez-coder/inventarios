import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { useGmail } from '../context/GmailContext';
import { googleSignIn, logoutGoogle } from '../services/googleAuth';
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
  KeyRound,
  Sparkles,
  Zap
} from 'lucide-react';

interface LoginScreenProps {
  onSuccess?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onSuccess }) => {
  const { verifyCredentials, verifyGoogleLogin, completeLogin } = useInventory();
  const { refreshProfile } = useGmail();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  
  // Verification states for database authentication
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [verifiedUser, setVerifiedUser] = useState<AppUser | null>(null);

  // Handle Corporate Google Sign-In
  const handleGoogleLogin = async () => {
    setErrorMessage(null);
    setIsGoogleLoading(true);

    try {
      const result = await googleSignIn();
      if (!result || !result.user) {
        // User closed or canceled popup
        setIsGoogleLoading(false);
        return;
      }

      const userEmail = result.user.email || '';
      const displayName = result.user.displayName;

      // Validate against corporate database
      const verification = verifyGoogleLogin(userEmail, displayName);

      if (verification.success && verification.user) {
        setErrorMessage(null);
        setVerificationSuccess(true);
        setVerifiedUser(verification.user);

        // Warm up Gmail profile connection in background
        refreshProfile().catch(() => {});

        // Show welcome feedback for exactly 1 second before accessing the system
        setTimeout(() => {
          completeLogin(verification.user!);
          if (onSuccess) onSuccess();
        }, 1000);
      } else {
        // User not authorized or not found in corporate records
        await logoutGoogle();
        setErrorMessage(verification.error || 'Usuario no encontrado');
      }
    } catch (err: any) {
      console.error('Error during Google sign-in:', err);
      if (
        err?.code === 'auth/popup-closed-by-user' ||
        err?.code === 'auth/cancelled-popup-request' ||
        err?.message?.includes('popup-closed-by-user')
      ) {
        // Window closed by operator, no action needed
      } else if (err?.code === 'auth/unauthorized-domain' || err?.message?.includes('unauthorized-domain')) {
        setErrorMessage(err.message || 'Dominio no autorizado para Google Auth en Firebase.');
      } else {
        setErrorMessage(err?.message || 'Error al conectar con la cuenta corporativa de Google.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

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
    <div className="min-h-screen bg-[#0a0e14] text-[#f8fafc] flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 antialiased selection:bg-[#ff8200] selection:text-white technical-grid">
      
      {/* Background ambient glowing orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-[#004a99]/15 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-[#ff8200]/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10 flex flex-col items-center">
        
        {/* Brand header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-[6px] bg-[#131a26] border border-[rgba(248,250,252,0.1)] backdrop-blur-md mb-4 shadow-xl">
            <div className="w-10 h-10 rounded-[4px] bg-white p-1 flex items-center justify-center shadow-md">
              <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
                <path d="M50 8C50 8 22 42 22 64C22 79.464 34.536 92 50 92C65.464 92 78 79.464 78 64C78 42 50 8 50 8Z" fill="#004a99"/>
                <path d="M50 24C50 24 32 50 32 66C32 75.941 40.059 84 50 84C59.941 84 68 75.941 68 66C68 50 50 24 50 24Z" fill="#ff8200"/>
                <circle cx="50" cy="68" r="8" fill="#ffffff" />
              </svg>
            </div>
            <div className="text-left">
              <span className="font-syne text-xs font-black uppercase tracking-widest text-[#ff8200] block">
                GRUPO PETROIL
              </span>
              <span className="label text-[9px] text-[rgba(248,250,252,0.6)] block font-mono">
                División Tecnologías de Información
              </span>
            </div>
          </div>

          <h1 className="font-syne text-2xl sm:text-3xl font-extrabold text-[#f8fafc] tracking-tight uppercase">
            INVENTARIOS <span className="text-[#ff8200]">| GRUPO PETROIL</span>
          </h1>
          <p className="text-[rgba(248,250,252,0.5)] text-xs mt-2 max-w-sm mx-auto font-mono">
            Plataforma centralizada de gestión de hardware, seguridad remota BitLocker y cartas responsivas.
          </p>
        </div>

        {/* Main Card with Form */}
        <div className="w-full bg-[#131a26] rounded-[6px] shadow-2xl border border-[rgba(248,250,252,0.1)] overflow-hidden p-6 sm:p-8">
          <div className="flex items-center justify-between mb-5 pb-4 border-b border-[rgba(248,250,252,0.1)]">
            <div>
              <h2 className="font-syne text-base font-bold text-[#f8fafc] uppercase tracking-wide">Acceso al Sistema</h2>
              <p className="label text-[9px] text-[rgba(248,250,252,0.5)] mt-0.5">Autenticación Corporativa Unificada</p>
            </div>
            <div className="p-2 rounded-[6px] bg-[#0a0e14] text-[#ff8200] border border-[rgba(248,250,252,0.1)]">
              <Lock className="w-5 h-5" />
            </div>
          </div>

          {/* Error Message Display with exact legends */}
          {errorMessage && (
            <div className="mb-4 p-3.5 rounded-[6px] bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1 shadow-xs">
              <div className="p-1 rounded-[4px] bg-rose-500/20 text-rose-400 shrink-0 mt-0.5">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-sm block text-rose-300 font-mono">
                  {errorMessage}
                </span>
                <span className="text-[11px] text-rose-300/80 block mt-0.5 font-mono">
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
            <div className="mb-4 p-4 rounded-[6px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-xs flex flex-col gap-2.5 animate-in zoom-in-95 shadow-md">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-[4px] bg-emerald-600 text-white shrink-0 mt-0.5 shadow-sm">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-emerald-300 text-xs uppercase tracking-wide font-mono">
                      Verificación completa de usuario
                    </span>
                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-[4px] font-bold text-[10px] tracking-wide font-mono">
                      Usuario válido
                    </span>
                  </div>
                  <p className="font-extrabold text-base text-[#f8fafc] mt-1 font-syne">
                    "Bienvenido, {verifiedUser.name}"
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-emerald-400 mt-1 font-medium font-mono">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                      Iniciando sesión segura con servicios Google integrados...
                    </span>
                    <span className="text-[10px] text-emerald-400 font-semibold">1s</span>
                  </div>
                </div>
              </div>

              {/* 1-second animated loading bar */}
              <div className="w-full bg-emerald-950/60 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all ease-linear"
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

          {/* Primary Action: Google Corporate Sign-in with Integrated Gmail Services */}
          <div className="space-y-3 mb-6">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading || isLoading || verificationSuccess}
              className="w-full py-3 px-4 rounded-[6px] bg-[#004a99] hover:bg-[#003875] border border-[rgba(248,250,252,0.2)] text-white font-semibold text-xs transition-all shadow-lg shadow-[#004a99]/20 flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 group"
            >
              {isGoogleLoading ? (
                <div className="flex items-center gap-2 font-mono">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Conectando con Google Corporativo...</span>
                </div>
              ) : (
                <>
                  {/* Google SVG Icon */}
                  <div className="w-5 h-5 bg-white rounded-full p-0.5 flex items-center justify-center shrink-0 shadow-sm">
                    <svg viewBox="0 0 24 24" className="w-4 h-4">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <span className="block font-medium tracking-wide">
                      Ingresar con Google Corporativo
                    </span>
                    <span className="block text-[10px] text-white/70 font-mono truncate">
                      @petroil.com.mx • Habilita envío de alertas y Gmail
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-white/70 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>

            <div className="p-2.5 rounded-[4px] bg-[#0a0e14]/70 border border-[rgba(248,250,252,0.06)] text-[11px] text-[rgba(248,250,252,0.6)] flex items-start gap-2">
              <Zap className="w-3.5 h-3.5 text-[#ff8200] shrink-0 mt-0.5" />
              <span>
                <strong className="text-[#f8fafc] font-medium">Conexión unificada:</strong> Al ingresar con Google corporativo, la plataforma conecta automáticamente Gmail para envío directo de cartas responsivas y alertas de mantenimiento sin requerir inicios de sesión adicionales.
              </span>
            </div>
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-5">
            <div className="border-t border-[rgba(248,250,252,0.1)] w-full" />
            <span className="bg-[#131a26] px-3 text-[10px] text-[rgba(248,250,252,0.4)] uppercase font-mono tracking-wider shrink-0">
              o credenciales de operador local
            </span>
            <div className="border-t border-[rgba(248,250,252,0.1)] w-full" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[rgba(248,250,252,0.8)] mb-1.5 font-mono uppercase tracking-wider text-[10px]">
                Correo Institucional o Usuario
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[rgba(248,250,252,0.4)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="ejemplo: pacomputo@petroil.com.mx"
                  value={email}
                  disabled={isLoading || isGoogleLoading || verificationSuccess}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  className="w-full pl-10 pr-3 py-2.5 text-xs rounded-[6px] bg-[#0a0e14] border border-[rgba(248,250,252,0.1)] focus:border-[#ff8200] focus:ring-1 focus:ring-[#ff8200]/30 outline-hidden text-[#f8fafc] transition-all font-mono placeholder:text-[rgba(248,250,252,0.3)] disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[rgba(248,250,252,0.8)] mb-1.5 font-mono uppercase tracking-wider text-[10px]">
                Contraseña
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-[rgba(248,250,252,0.4)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  disabled={isLoading || isGoogleLoading || verificationSuccess}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  className="w-full pl-10 pr-10 py-2.5 text-xs rounded-[6px] bg-[#0a0e14] border border-[rgba(248,250,252,0.1)] focus:border-[#ff8200] focus:ring-1 focus:ring-[#ff8200]/30 outline-hidden text-[#f8fafc] transition-all font-mono placeholder:text-[rgba(248,250,252,0.3)] disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgba(248,250,252,0.4)] hover:text-[#f8fafc] cursor-pointer"
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
                  disabled={isLoading || isGoogleLoading || verificationSuccess}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded-[3px] accent-[#ff8200] bg-[#0a0e14] border-[rgba(248,250,252,0.2)]"
                />
                <span className="text-xs text-[rgba(248,250,252,0.6)] font-mono">Mantener sesión activa</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading || isGoogleLoading || verificationSuccess}
              className={`w-full py-3 px-4 rounded-[6px] text-white font-bold text-xs uppercase tracking-wider font-mono shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer mt-2 ${
                verificationSuccess
                  ? 'bg-emerald-600 shadow-emerald-600/30'
                  : 'bg-[#ff8200] hover:bg-[#ff9426] shadow-[#ff8200]/20 disabled:opacity-60'
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
                  <span>Ingresar con Credenciales</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-[rgba(248,250,252,0.1)] text-[11px] text-[rgba(248,250,252,0.5)] flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium font-mono">
              <ShieldCheck className="w-4 h-4" />
              Validación TLS 1.3 & Firebase Auth
            </span>
            <span className="font-mono text-[10px] text-[rgba(248,250,252,0.4)]">BD Corporativa Activa</span>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-6 text-center text-xs text-[rgba(248,250,252,0.4)] flex flex-wrap items-center justify-center gap-4 font-mono text-[11px]">
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

