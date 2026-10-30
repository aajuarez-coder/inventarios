import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { AppUser, UserRole, UserPermissions } from '../types/inventory';
import { 
  ROLE_CONFIGS, 
  ALL_PERMISSIONS, 
  getDefaultPermissionsForRole 
} from '../utils/permissionHelpers';
import { 
  ShieldCheck, 
  UserPlus, 
  Search, 
  Filter, 
  ShieldAlert, 
  Check, 
  X, 
  KeyRound, 
  Building2, 
  Mail, 
  User, 
  Trash2, 
  Edit3, 
  Power, 
  Eye, 
  EyeOff, 
  Lock, 
  Info, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle,
  LogIn,
  Sliders,
  FileText,
  Laptop
} from 'lucide-react';

export const SystemUsersManager: React.FC = () => {
  const { 
    systemUsers, 
    currentUser, 
    branches, 
    addSystemUser, 
    updateSystemUser, 
    deleteSystemUser, 
    toggleUserStatus, 
    canEdit,
    hasPermission
  } = useInventory();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showMatrix, setShowMatrix] = useState(false);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<AppUser | null>(null);
  const [newPasswordValue, setNewPasswordValue] = useState('admin123');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(null);

  // Form states for Add/Edit
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('admin123');
  const [formRole, setFormRole] = useState<UserRole>('admin_ti');
  const [formBranch, setFormBranch] = useState(branches[0]?.name || 'Corporativo Torre Central (CDMX)');
  const [formStatus, setFormStatus] = useState<'activo' | 'inactivo'>('activo');
  const [formAvatarUrl, setFormAvatarUrl] = useState('');
  const [formPermissions, setFormPermissions] = useState<UserPermissions>(getDefaultPermissionsForRole('admin_ti'));
  const [customPermissionsMode, setCustomPermissionsMode] = useState(false);
  const [userToDelete, setUserToDelete] = useState<AppUser | null>(null);

  const canManageUsers = hasPermission('canManageUsers') && canEdit;

  const showNotification = (msg: string, isError = false) => {
    if (isError) {
      setActionErrorMessage(msg);
      setTimeout(() => setActionErrorMessage(null), 4000);
    } else {
      setActionSuccessMessage(msg);
      setTimeout(() => setActionSuccessMessage(null), 3500);
    }
  };

  const handleOpenAddModal = () => {
    setEditingUser(null);
    setFormName('');
    setFormEmail('');
    setFormPassword('admin123');
    setFormRole('admin_ti');
    setFormBranch(branches[0]?.name || 'Corporativo Torre Central (CDMX)');
    setFormStatus('activo');
    setFormAvatarUrl('');
    setFormPermissions(getDefaultPermissionsForRole('admin_ti'));
    setCustomPermissionsMode(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: AppUser) => {
    setEditingUser(user);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormPassword(user.password || 'admin123');
    setFormRole(user.role);
    setFormBranch(user.branchName || branches[0]?.name || 'Corporativo Torre Central (CDMX)');
    setFormStatus(user.status || 'activo');
    setFormAvatarUrl(user.avatarUrl || '');
    const userPerms = user.permissions || getDefaultPermissionsForRole(user.role);
    setFormPermissions(userPerms);
    setCustomPermissionsMode(user.role === 'personalizado');
    setIsModalOpen(true);
  };

  const handleRoleChange = (newRole: UserRole) => {
    setFormRole(newRole);
    if (newRole !== 'personalizado') {
      const defaultPerms = getDefaultPermissionsForRole(newRole);
      setFormPermissions(defaultPerms);
      setCustomPermissionsMode(false);
    } else {
      setCustomPermissionsMode(true);
    }
  };

  const handlePermissionToggle = (key: keyof UserPermissions) => {
    setFormPermissions(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      // If toggled manually, switch role label to customized if different
      setFormRole('personalizado');
      setCustomPermissionsMode(true);
      return updated;
    });
  };

  const handleSubmitUserForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim()) {
      showNotification('Por favor complete los campos obligatorios.', true);
      return;
    }

    const emailClean = formEmail.trim().toLowerCase();

    // Check duplicate email
    const duplicate = systemUsers.find(u => u.email.toLowerCase() === emailClean && u.id !== editingUser?.id);
    if (duplicate) {
      showNotification(`El correo institucional "${emailClean}" ya está asignado a otro usuario.`, true);
      return;
    }

    const roleConfig = ROLE_CONFIGS[formRole] || ROLE_CONFIGS.admin_ti;

    if (editingUser) {
      updateSystemUser(editingUser.id, {
        name: formName.trim(),
        email: emailClean,
        password: formPassword.trim() || 'admin123',
        role: formRole,
        roleTitle: formRole === 'personalizado' ? 'Operador Personalizado' : roleConfig.title,
        branchName: formBranch,
        status: formStatus,
        avatarUrl: formAvatarUrl.trim() || undefined,
        permissions: formPermissions,
        canEdit: !formPermissions.isReadOnly
      });
      showNotification(`Usuario "${formName}" actualizado exitosamente.`);
    } else {
      addSystemUser({
        name: formName.trim(),
        email: emailClean,
        password: formPassword.trim() || 'admin123',
        role: formRole,
        roleTitle: formRole === 'personalizado' ? 'Operador Personalizado' : roleConfig.title,
        branchName: formBranch,
        status: formStatus,
        avatarUrl: formAvatarUrl.trim() || undefined,
        permissions: formPermissions,
        canEdit: !formPermissions.isReadOnly
      });
      showNotification(`Usuario "${formName}" dado de alta exitosamente en el sistema.`);
    }

    setIsModalOpen(false);
  };

  const handleConfirmDeleteModalUser = () => {
    if (!userToDelete) return;
    const result = deleteSystemUser(userToDelete.id);
    if (result.success) {
      showNotification(`Cuenta de usuario "${userToDelete.email}" eliminada del sistema.`);
      setUserToDelete(null);
    } else {
      showNotification(result.error || 'No se pudo eliminar el usuario.', true);
      setUserToDelete(null);
    }
  };

  const handleDeleteUser = (user: AppUser) => {
    setUserToDelete(user);
  };

  const handleSaveResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordUser) return;
    if (!newPasswordValue.trim()) {
      showNotification('La contraseña no puede estar vacía.', true);
      return;
    }

    updateSystemUser(resetPasswordUser.id, {
      password: newPasswordValue.trim()
    });

    showNotification(`Contraseña restablecida exitosamente para ${resetPasswordUser.name}.`);
    setResetPasswordUser(null);
  };

  // Filter users
  const filteredUsers = systemUsers.filter(u => {
    const matchesSearch = 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.branchName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.roleTitle?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || (u.status || 'activo') === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Metrics
  const totalActive = systemUsers.filter(u => u.status !== 'inactivo').length;
  const totalAdmins = systemUsers.filter(u => u.role === 'edicion_total' || u.role === 'admin_ti').length;
  const totalViewers = systemUsers.filter(u => u.role === 'visor').length;
  const totalTechnicians = systemUsers.filter(u => u.role === 'soporte_tecnico' || u.role === 'almacenista').length;

  return (
    <div className="space-y-6">
      
      {/* Top Banner Alert / Toast Notifications */}
      {actionSuccessMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-300 text-emerald-950 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccessMessage}</span>
        </div>
      )}
      {actionErrorMessage && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-300 text-rose-950 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{actionErrorMessage}</span>
        </div>
      )}

      {/* Distinction Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-indigo-600/10 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-indigo-300 text-[11px] font-bold uppercase tracking-wider backdrop-blur-md">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              Seguridad & Control de Acceso (RBAC)
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Gestión de Usuarios del Sistema
            </h1>
            
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Administración de cuentas con acceso al software, asignación de roles operativos y matriz de permisos granulares.
            </p>

            {/* Note distinguishing system operators from hardware recipients */}
            <div className="pt-2">
              <div className="inline-flex items-start gap-2 p-3 rounded-xl bg-indigo-900/40 border border-indigo-500/30 text-[11px] text-indigo-200">
                <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Aclaración importante:</strong> Los <em>Usuarios del Sistema</em> son los operadores que inician sesión en la plataforma con privilegios de software (Admin, Visor, Técnico). Esto es independiente del módulo de <strong>Colaboradores</strong>, donde se registra al personal de la empresa que recibe equipos de cómputo en resguardo físico.
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              onClick={() => setShowMatrix(!showMatrix)}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold border border-white/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sliders className="w-4 h-4 text-indigo-300" />
              <span>{showMatrix ? 'Ocultar Matriz' : 'Ver Matriz de Permisos'}</span>
            </button>

            <button
              onClick={handleOpenAddModal}
              disabled={!canManageUsers}
              title={!canManageUsers ? 'Se requieren permisos de Administrador para dar de alta usuarios' : ''}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                canManageUsers
                  ? 'bg-gradient-to-r from-red-600 via-rose-600 to-indigo-600 hover:from-red-700 hover:to-indigo-700 text-white shadow-red-600/25'
                  : 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-60'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Dar de Alta Usuario</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-300 shadow-xs">
          <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
            Cuentas Activas
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{totalActive}</span>
            <span className="text-xs text-slate-700 font-semibold">de {systemUsers.length} total</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-300 shadow-xs">
          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block mb-1">
            Administradores
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-800">{totalAdmins}</span>
            <span className="text-xs text-slate-700 font-semibold">Edición total & TI</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-300 shadow-xs">
          <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block mb-1">
            Visores (Solo Lectura)
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-800">{totalViewers}</span>
            <span className="text-xs text-slate-700 font-semibold">Modo auditoría</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-300 shadow-xs">
          <span className="text-[11px] font-bold text-indigo-800 uppercase tracking-wider block mb-1">
            Soporte & Almacén
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-indigo-800">{totalTechnicians}</span>
            <span className="text-xs text-slate-700 font-semibold">Módulos específicos</span>
          </div>
        </div>
      </div>

      {/* Permissions Matrix Drawer (Toggleable) */}
      {showMatrix && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md animate-in fade-in space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-600" />
                Matriz Comparativa de Roles y Permisos de Acceso
              </h2>
              <p className="text-xs text-slate-500">
                Resumen de capacidades del sistema según el rol asignado a cada cuenta de usuario:
              </p>
            </div>
            <button
              onClick={() => setShowMatrix(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="py-3 px-4 font-bold text-slate-700">Módulo / Permiso</th>
                  <th className="py-3 px-3 font-bold text-emerald-800 text-center">Edición Total</th>
                  <th className="py-3 px-3 font-bold text-indigo-800 text-center">Admin TI</th>
                  <th className="py-3 px-3 font-bold text-amber-800 text-center">Visor</th>
                  <th className="py-3 px-3 font-bold text-sky-800 text-center">Soporte Técnico</th>
                  <th className="py-3 px-3 font-bold text-purple-800 text-center">Almacenista</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ALL_PERMISSIONS.map(perm => {
                  const edicion = getDefaultPermissionsForRole('edicion_total')[perm.key];
                  const adminTi = getDefaultPermissionsForRole('admin_ti')[perm.key];
                  const visor = getDefaultPermissionsForRole('visor')[perm.key];
                  const soporte = getDefaultPermissionsForRole('soporte_tecnico')[perm.key];
                  const almacen = getDefaultPermissionsForRole('almacenista')[perm.key];

                  return (
                    <tr key={perm.key} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-4">
                        <p className="font-semibold text-slate-800">{perm.label}</p>
                        <p className="text-[10px] text-slate-400">{perm.description}</p>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {edicion ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {adminTi ? <Check className="w-4 h-4 text-indigo-600 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {visor ? <Check className="w-4 h-4 text-amber-600 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {soporte ? <Check className="w-4 h-4 text-sky-600 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {almacen ? <Check className="w-4 h-4 text-purple-600 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Filters & Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-300 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre, correo @petroil o sucursal..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs bg-slate-50 border border-slate-300 focus:bg-white focus:border-[#004a99] focus:ring-2 focus:ring-[#004a99]/15 outline-hidden font-bold text-slate-900 placeholder:text-slate-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Role selector filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 px-3 py-2 rounded-xl text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-600" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-transparent font-bold text-slate-900 outline-hidden cursor-pointer"
            >
              <option value="all">Todos los Roles</option>
              <option value="edicion_total">Edición Total (Maestro)</option>
              <option value="admin_ti">Administrador TI</option>
              <option value="visor">Visor (Solo Lectura)</option>
              <option value="soporte_tecnico">Soporte Técnico</option>
              <option value="almacenista">Almacenista</option>
              <option value="personalizado">Personalizado</option>
            </select>
          </div>

          {/* Status selector filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 px-3 py-2 rounded-xl text-xs">
            <span className="text-slate-800 font-bold">Estado:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent font-bold text-slate-900 outline-hidden cursor-pointer"
            >
              <option value="all">Todos los Estados</option>
              <option value="activo">Solo Activos</option>
              <option value="inactivo">Solo Inactivos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map((user) => {
          const isCurrentUser = currentUser.id === user.id;
          const roleCfg = ROLE_CONFIGS[user.role] || ROLE_CONFIGS.admin_ti;
          const isActive = user.status !== 'inactivo';

          return (
            <div
              key={user.id}
              className={`bg-white rounded-2xl border p-5 transition-all flex flex-col justify-between shadow-xs hover:shadow-md relative group ${
                isCurrentUser 
                  ? 'border-indigo-400 ring-2 ring-indigo-100 bg-gradient-to-b from-indigo-50/30 to-white' 
                  : !isActive 
                  ? 'opacity-70 border-slate-200 bg-slate-50/60'
                  : 'border-slate-200'
              }`}
            >
              {/* Header card info */}
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {user.avatarUrl ? (
                        <img 
                          src={user.avatarUrl} 
                          alt={user.name} 
                          className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shadow-xs"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-800 to-indigo-900 text-white font-extrabold flex items-center justify-center text-sm shadow-xs">
                          {user.name.charAt(0)}
                        </div>
                      )}
                      <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white shadow-xs ${
                        isActive ? 'bg-emerald-500' : 'bg-slate-400'
                      }`} title={isActive ? 'Usuario Activo' : 'Usuario Suspendido'} />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-sm text-slate-900 truncate">
                          {user.name}
                        </h3>
                        {isCurrentUser && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-indigo-100 text-indigo-800 font-extrabold uppercase shrink-0">
                            Tú
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{user.email}</span>
                      </p>
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border shrink-0 ${roleCfg.badgeClass}`}>
                    {roleCfg.badgeLabel}
                  </span>
                </div>

                {/* Branch and Role Info */}
                <div className="space-y-1.5 py-2 border-t border-slate-100 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      Sede:
                    </span>
                    <span className="font-medium truncate max-w-[170px]">{user.branchName}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                      Modo:
                    </span>
                    <span className={`font-bold text-[11px] ${user.canEdit ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {user.canEdit ? 'Escritura & Edición' : 'Solo Lectura'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-slate-400">Estado:</span>
                    <span className={`font-bold text-[11px] px-1.5 py-0.2 rounded-md ${
                      isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {isActive ? 'Activo' : 'Suspendido'}
                    </span>
                  </div>
                </div>

                {/* Key permissions pills */}
                <div className="pt-2 flex flex-wrap gap-1">
                  {user.permissions?.canManageAssets && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                      Inventario
                    </span>
                  )}
                  {user.permissions?.canManageAssignments && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                      Responsivas
                    </span>
                  )}
                  {user.permissions?.canSignDocuments && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                      Firma TI
                    </span>
                  )}
                  {user.permissions?.canManageMaintenance && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                      Mantenimiento
                    </span>
                  )}
                  {user.permissions?.canManageTransfers && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                      Traslados
                    </span>
                  )}
                  {user.permissions?.canManageUsers && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
                      Admin Usuarios
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                <div className="flex items-center justify-between gap-1">
                  {/* Security session status badge - Direct profile switching blocked */}
                  {isCurrentUser ? (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Sesión en uso
                    </span>
                  ) : (
                    <span 
                      className="inline-flex items-center gap-1 text-[11px] text-slate-500 bg-slate-50 px-2 py-1 rounded-md border border-slate-200/80"
                    >
                      <Lock className="w-3 h-3 text-slate-400" />
                      <span className="font-mono text-[10px]">Cuenta Registrada</span>
                    </span>
                  )}

                  <div className="flex items-center gap-1 ml-auto">
                    {/* Reset Password */}
                    <button
                      type="button"
                      onClick={() => {
                        setResetPasswordUser(user);
                        setNewPasswordValue('admin123');
                        setShowNewPassword(false);
                      }}
                      title="Cambiar o restablecer contraseña"
                      className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                    </button>

                    {/* Toggle Active/Inactive */}
                    {!isCurrentUser && (
                      <button
                        type="button"
                        onClick={() => toggleUserStatus(user.id)}
                        title={isActive ? 'Suspender usuario' : 'Activar usuario'}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          isActive 
                            ? 'text-slate-500 hover:text-amber-600 hover:bg-amber-50' 
                            : 'text-emerald-600 hover:bg-emerald-50'
                        }`}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Primary Edit & Delete buttons */}
                <div className="grid grid-cols-2 gap-1.5 pt-1.5 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(user)}
                    className="py-1.5 px-2 rounded-lg border border-slate-200 bg-white hover:bg-indigo-50 hover:border-indigo-300 text-slate-700 hover:text-indigo-700 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    title="Editar todos los campos de este usuario"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Editar</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => handleDeleteUser(user)}
                    disabled={isCurrentUser}
                    className={`py-1.5 px-2 rounded-lg border text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                      isCurrentUser
                        ? 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed'
                        : 'border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-300 text-slate-700 hover:text-rose-600 cursor-pointer'
                    }`}
                    title={isCurrentUser ? 'No es posible eliminar su propia cuenta en sesión activa' : 'Eliminar usuario del sistema'}
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                    <span>Eliminar</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredUsers.length === 0 && (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
          <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No se encontraron usuarios</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            No hay operadores del sistema que coincidan con los filtros de búsqueda seleccionados.
          </p>
        </div>
      )}

      {/* MODAL: ALTA Y EDICIÓN DE USUARIO DEL SISTEMA */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 sm:p-8 animate-in fade-in zoom-in-95 my-8 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-indigo-600" />
                  {editingUser ? 'Editar Usuario del Sistema' : 'Dar de Alta Nuevo Usuario'}
                </h2>
                <p className="text-xs text-slate-500">
                  {editingUser 
                    ? `Modificando credenciales y permisos para ${editingUser.email}` 
                    : 'Cree una cuenta para que un operador de TI pueda ingresar al software'}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitUserForm} className="space-y-4">
              {/* Basic Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Nombre Completo del Operador *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ej. Ing. Fernando Soto"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Correo Institucional (@petroil.com.mx) *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="ej. fsoto@petroil.com.mx"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Contraseña de Acceso *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Mínimo 6 caracteres"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-medium focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Sucursal o Sede Principal *
                  </label>
                  <select
                    value={formBranch}
                    onChange={(e) => setFormBranch(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-hidden bg-white"
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.name}>{b.name} ({b.city})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status and Avatar URL fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Estatus de la Cuenta *
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as 'activo' | 'inactivo')}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-hidden bg-white"
                  >
                    <option value="activo">Cuenta Activa (Acceso Habilitado)</option>
                    <option value="inactivo">Cuenta Suspendida / Inactiva</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    URL de Fotografía / Avatar (Opcional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={formAvatarUrl}
                    onChange={(e) => setFormAvatarUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-hidden"
                  />
                </div>
              </div>

              {/* Role Selection Cards */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Rol del Sistema (Perfil de Acceso) *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {(['edicion_total', 'admin_ti', 'visor', 'soporte_tecnico', 'almacenista', 'personalizado'] as UserRole[]).map((r) => {
                    const cfg = ROLE_CONFIGS[r];
                    const isSelected = formRole === r;

                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => handleRoleChange(r)}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/80 ring-2 ring-indigo-200 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs text-slate-900">{cfg.badgeLabel}</span>
                          <span className={`w-2.5 h-2.5 rounded-full ${cfg.dotClass}`} />
                        </div>
                        <p className="text-[10px] text-slate-500 leading-tight">
                          {cfg.description.slice(0, 70)}...
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Granular Permissions Section */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <label className="text-xs font-bold text-slate-800 block">
                      Permisos Específicos de la Cuenta
                    </label>
                    <p className="text-[11px] text-slate-500">
                      {customPermissionsMode 
                        ? 'Configuración personalizada manual habilitada.' 
                        : 'Permisos determinados automáticamente por el rol seleccionado.'}
                    </p>
                  </div>
                  {customPermissionsMode && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 border border-cyan-300">
                      Personalizado
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 max-h-56 overflow-y-auto">
                  {ALL_PERMISSIONS.map(perm => {
                    const isEnabled = Boolean(formPermissions[perm.key]);

                    return (
                      <label 
                        key={perm.key}
                        className={`flex items-start gap-2.5 p-2 rounded-xl cursor-pointer transition-colors ${
                          isEnabled ? 'bg-white shadow-2xs border border-indigo-100' : 'hover:bg-slate-100/70'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isEnabled}
                          onChange={() => handlePermissionToggle(perm.key)}
                          className="mt-0.5 w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500"
                        />
                        <div className="min-w-0">
                          <span className="text-xs font-semibold text-slate-800 block">
                            {perm.label}
                          </span>
                          <span className="text-[10px] text-slate-500 block leading-tight">
                            {perm.description}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Status Toggle */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs font-semibold text-slate-700">Estado de la cuenta:</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setFormStatus('activo')}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                      formStatus === 'activo' 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Activo
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormStatus('inactivo')}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                      formStatus === 'inactivo' 
                        ? 'bg-rose-600 text-white' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Suspendido
                  </button>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200 transition-all cursor-pointer"
                >
                  {editingUser ? 'Guardar Cambios' : 'Dar de Alta Cuenta'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* MODAL: RESET PASSWORD */}
      {resetPasswordUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Restablecer Contraseña</h3>
                  <p className="text-xs text-slate-500">{resetPasswordUser.email}</p>
                </div>
              </div>
              <button
                onClick={() => setResetPasswordUser(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Nueva Contraseña para el Operador
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPasswordValue}
                    onChange={(e) => setNewPasswordValue(e.target.value)}
                    className="w-full px-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-medium focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setNewPasswordValue('admin123')}
                    className="text-[10px] text-indigo-600 hover:underline font-semibold"
                  >
                    Usar default: admin123
                  </button>
                  <span className="text-slate-300">•</span>
                  <button
                    type="button"
                    onClick={() => setNewPasswordValue(`Petroil${Math.floor(1000 + Math.random() * 9000)}!`)}
                    className="text-[10px] text-indigo-600 hover:underline font-semibold"
                  >
                    Generar aleatoria
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResetPasswordUser(null)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200"
                >
                  Actualizar Contraseña
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-rose-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-white" />
                <h3 className="font-bold text-sm">Eliminar Usuario del Sistema</h3>
              </div>
              <button onClick={() => setUserToDelete(null)} className="text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-700 text-sm">
                ¿Está seguro de revocar el acceso y eliminar permanentemente la cuenta de <strong className="text-slate-900">{userToDelete.name}</strong> ({userToDelete.email})?
              </p>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span>Rol asignado:</span>
                  <strong className="text-slate-900">{userToDelete.roleTitle}</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Sede:</span>
                  <strong className="text-slate-900">{userToDelete.branchName}</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Estatus:</span>
                  <strong className="text-slate-900 capitalize">{userToDelete.status || 'activo'}</strong>
                </div>
              </div>

              {userToDelete.id === currentUser.id && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <p className="text-[11px]">
                    No puede eliminar su propia cuenta mientras esté en sesión activa.
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setUserToDelete(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteModalUser}
                  disabled={userToDelete.id === currentUser.id}
                  className={`px-4 py-2 rounded-xl text-white font-semibold transition-all shadow-sm ${
                    userToDelete.id === currentUser.id
                      ? 'bg-slate-300 cursor-not-allowed'
                      : 'bg-rose-600 hover:bg-rose-700 cursor-pointer shadow-rose-200'
                  }`}
                >
                  Confirmar Eliminación
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
