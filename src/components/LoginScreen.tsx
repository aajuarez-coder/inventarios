import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { SYSTEM_USERS } from '../data/mockData';
import { AppUser, UserRole } from '../types/inventory';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Sparkles,
  User,
  Shield,
  Layers,
  Database,
  Building2,
  FileText,
  KeyRound,
  Terminal
} from 'lucide-react';

interface LoginScreenProps {
  onSuccess?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onSuccess }) => {
  const { login, systemUsers, setCurrentUser } = useInventory();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const inputEmail = email.trim();
    if (!inputEmail) {
      setErrorMessage('Por favor ingrese su usuario o correo institucional.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      // Default to demo password if empty so the user is never blocked
      const pwd = password.trim() || 'admin123';
      const result = login(inputEmail, pwd);
      setIsLoading(false);
      if (result.success) {
        if (onSuccess) onSuccess();
      } else {
        setErrorMessage(result.error || 'Credenciales no válidas.');
      }
    }, 250);
  };

  const handleQuickLogin = (user: AppUser) => {
    setEmail(user.email);
    setPassword(user.password || 'admin123');
    setErrorMessage(null);
    setIsLoading(true);
    
    setTimeout(() => {
      const result = login(user.email, user.password || 'admin123');
      setIsLoading(false);
      if (result.success) {
        if (onSuccess) onSuccess();
      } else {
        setErrorMessage(result.error || 'Error al iniciar sesión con este perfil.');
      }
    }, 250);
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'edicion_total':
        return {
          label: 'Edición Total (Acceso Maestro)',
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
          desc: 'Privilegios completos: altas, modificaciones, bajas, firmas y configuración.'
        };
      case 'admin_ti':
        return {
          label: 'Administrador TI',
          bg: 'bg-indigo-50 text-indigo-800 border-indigo-300',
          desc: 'Gestión de hardware, asignación de equipos, servidores y mantenimiento.'
        };
      case 'visor':
        return {
          label: 'Visor (Solo Lectura / Auditoría)',
          bg: 'bg-amber-50 text-amber-800 border-amber-300',
          desc: 'Modo auditoría: consulta de inventario, trazabilidad y reportes en PDF sin permisos de edición.'
        };
      case 'soporte_tecnico':
        return {
          label: 'Soporte Técnico',
          bg: 'bg-sky-50 text-sky-800 border-sky-300',
          desc: 'Ejecución de mantenimientos preventivos y correctivos.'
        };
      case 'almacenista':
        return {
          label: 'Almacén & Traslados',
          bg: 'bg-purple-50 text-purple-800 border-purple-300',
          desc: 'Control de existencias en almacén y envíos entre sucursales.'
        };
      default:
        return {
          label: 'Colaborador',
          bg: 'bg-slate-50 text-slate-800 border-slate-300',
          desc: 'Acceso estándar.'
        };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 antialiased selection:bg-indigo-500 selection:text-white">
      
      {/* Background ambient glowing orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-red-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-5xl relative z-10 flex flex-col items-center">
        
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

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Sistema de Inventarios <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-rose-400 to-amber-300">Grupo Petroil</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-2 max-w-xl mx-auto">
            Plataforma centralizada de gestión de hardware de cómputo, cartas responsivas digitales, cronograma de mantenimiento y trazabilidad de sucursales.
          </p>
        </div>

        {/* Main Card with Form & Quick Access Profiles */}
        <div className="w-full bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          
          {/* Left Column: Traditional Login Form (5 cols) */}
          <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-100 bg-white">
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Iniciar Sesión</h2>
                  <p className="text-xs text-slate-500">Ingrese sus credenciales de acceso</p>
                </div>
                <div className="p-2 rounded-xl bg-slate-100 text-slate-600">
                  <Lock className="w-5 h-5 text-indigo-600" />
                </div>
              </div>

              {/* Direct Detected Account Login Banner */}
              <div className="mb-5 p-3.5 rounded-2xl bg-gradient-to-r from-red-600/10 via-rose-500/10 to-indigo-600/10 border border-red-200/80 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[11px] font-bold text-slate-800">Cuenta de Usuario Detectada</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 bg-red-100/80 px-2 py-0.5 rounded-full">
                    Edición Total
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">pacomputo@petroil.com.mx</p>
                    <p className="text-[11px] text-slate-500 truncate">Administrador de Cómputo TI</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('pacomputo@petroil.com.mx');
                      setPassword('admin123');
                      setIsLoading(true);
                      setTimeout(() => {
                        const res = login('pacomputo@petroil.com.mx', 'admin123');
                        setIsLoading(false);
                        if (res.success && onSuccess) onSuccess();
                      }, 200);
                    }}
                    className="shrink-0 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span>Entrar ya</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {errorMessage && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Correo Institucional o Usuario
                    </label>
                  </div>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="ejemplo: pacomputo@petroil.com.mx"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-hidden text-slate-800 transition-all font-medium"
                      autoFocus
                    />
                  </div>
                  {/* Quick select pills */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <button
                      type="button"
                      onClick={() => { setEmail('pacomputo@petroil.com.mx'); setPassword('admin123'); }}
                      className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                    >
                      pacomputo
                    </button>
                    <button
                      type="button"
                      onClick={() => { setEmail('admin@petroil.com.mx'); setPassword('admin123'); }}
                      className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                    >
                      admin
                    </button>
                    <button
                      type="button"
                      onClick={() => { setEmail('visor@petroil.com.mx'); setPassword('visor123'); }}
                      className="text-[10px] px-2 py-0.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-medium transition-colors"
                    >
                      visor (solo lectura)
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Contraseña
                    </label>
                    <span className="text-[11px] text-indigo-600 font-medium cursor-pointer hover:underline" onClick={() => setPassword('admin123')}>
                      Ver demo (admin123)
                    </span>
                  </div>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-hidden text-slate-800 transition-all font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
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
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500"
                    />
                    <span className="text-xs text-slate-600">Mantener sesión activa</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-indigo-700 hover:from-red-700 hover:to-indigo-800 text-white font-bold text-xs tracking-wide shadow-lg shadow-red-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer mt-2"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Ingresar al Sistema</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
                <ShieldCheck className="w-4 h-4" />
                Seguridad TLS 1.3 Cifrada
              </span>
              <span className="font-mono text-slate-400">v2.4 ITAM</span>
            </div>
          </div>

          {/* Right Column: Interactive Role Profiles (7 cols) */}
          <div className="lg:col-span-7 p-6 sm:p-8 bg-slate-50/70 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Acceso Rápido por Perfil (Demostración de Roles)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Seleccione un usuario para acceder de forma instantánea con sus permisos correspondientes:
                  </p>
                </div>
              </div>

              {/* Profiles Grid */}
              <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                {(systemUsers || SYSTEM_USERS).map((user) => {
                  const badge = getRoleBadge(user.role);
                  const isEdicionTotal = user.role === 'edicion_total';
                  const isVisor = user.role === 'visor';

                  return (
                    <div
                      key={user.id}
                      onClick={() => handleQuickLogin(user)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer group flex items-start gap-3 relative ${
                        isEdicionTotal 
                          ? 'bg-gradient-to-r from-emerald-500/10 via-white to-white border-emerald-300 hover:border-emerald-500 hover:shadow-md'
                          : isVisor
                          ? 'bg-gradient-to-r from-amber-500/10 via-white to-white border-amber-300 hover:border-amber-500 hover:shadow-md'
                          : 'bg-white border-slate-200 hover:border-indigo-400 hover:shadow-sm'
                      }`}
                    >
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        {user.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt={user.name}
                            className="w-11 h-11 rounded-xl object-cover border border-slate-200 shadow-xs"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                            {user.name.charAt(0)}
                          </div>
                        )}
                        <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-xs ${
                          isEdicionTotal ? 'bg-emerald-600' : isVisor ? 'bg-amber-600' : 'bg-indigo-600'
                        }`}>
                          {isEdicionTotal ? '★' : isVisor ? '👁' : '✓'}
                        </span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center justify-between gap-1 mb-0.5">
                          <span className="font-bold text-xs text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {user.name}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.bg}`}>
                            {badge.label}
                          </span>
                        </div>

                        <p className="text-[11px] font-medium text-slate-500 mb-1">
                          {user.email} • <span className="text-slate-400">{user.branchName}</span>
                        </p>

                        <p className="text-[11px] text-slate-600 leading-tight">
                          {badge.desc}
                        </p>
                      </div>

                      {/* Quick Action Button */}
                      <div className="shrink-0 self-center">
                        <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 group-hover:bg-indigo-600 group-hover:text-white text-slate-700 text-[11px] font-semibold transition-all">
                          Entrar
                          <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Note on Role Access */}
            <div className="mt-4 p-3 rounded-xl bg-indigo-50/70 border border-indigo-100 text-[11px] text-slate-600 flex items-start gap-2.5">
              <Shield className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-indigo-950 font-semibold">Garantía de Control de Accesos:</strong>
                <span className="text-slate-600 ml-1">
                  El perfil <strong>Edición Total</strong> habilita botones de alta, edición técnica, borrado y firmas. El perfil <strong>Visor</strong> mantiene la interfaz en solo lectura protegiendo la integridad de auditoría sin opción a alteraciones.
                </span>
              </div>
            </div>

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
