import { UserRole, UserPermissions } from '../types/inventory';

export interface PermissionDefinition {
  key: keyof UserPermissions;
  label: string;
  description: string;
  category: 'Equipos & Hardware' | 'Responsivas & Custodia' | 'Operación TI' | 'Seguridad & Sistema';
}

export const ALL_PERMISSIONS: PermissionDefinition[] = [
  {
    key: 'canManageAssets',
    label: 'Alta y Edición de Hardware',
    description: 'Registrar nuevos equipos, modificar especificaciones técnicas y actualizar números de serie.',
    category: 'Equipos & Hardware'
  },
  {
    key: 'canDeleteAssets',
    label: 'Baja y Eliminación de Activos',
    description: 'Dar de baja formal por dictamen técnico o eliminar registros del catálogo.',
    category: 'Equipos & Hardware'
  },
  {
    key: 'canManageAssignments',
    label: 'Asignaciones a Colaboradores',
    description: 'Vincular equipos a personal y generar nuevas cartas responsivas.',
    category: 'Responsivas & Custodia'
  },
  {
    key: 'canSignDocuments',
    label: 'Firma Digital de Responsivas',
    description: 'Firmar actas de entrega/recepción en representación del área de TI.',
    category: 'Responsivas & Custodia'
  },
  {
    key: 'canManageMaintenance',
    label: 'Mantenimiento Preventivo',
    description: 'Crear programas de servicio, checklists de mantenimiento y registrar calificaciones diagnósticas.',
    category: 'Operación TI'
  },
  {
    key: 'canManageTransfers',
    label: 'Traslados entre Sucursales',
    description: 'Generar guías de envío, despachar traslados y confirmar recepción en destino.',
    category: 'Operación TI'
  },
  {
    key: 'canManageEmployees',
    label: 'Gestión de Directorio de Colaboradores',
    description: 'Registrar o actualizar personal corporativo receptor de hardware.',
    category: 'Responsivas & Custodia'
  },
  {
    key: 'canManageUsers',
    label: 'Administración de Usuarios del Sistema',
    description: 'Dar de alta operadores del software, asignar roles y configurar permisos de acceso.',
    category: 'Seguridad & Sistema'
  },
  {
    key: 'canExportReports',
    label: 'Reportes PDF y Exportación',
    description: 'Descargar reportes ejecutivos consolidados, inventarios en PDF y copias de seguridad JSON.',
    category: 'Seguridad & Sistema'
  },
  {
    key: 'canManageLoans',
    label: 'Préstamos Temporales de Hardware',
    description: 'Generar vales de salida temporal, prestar accesorios y registrar devoluciones de equipos.',
    category: 'Responsivas & Custodia'
  },
  {
    key: 'canSendRemoteCommands',
    label: 'Bloqueo BitLocker y Comandos Remotos',
    description: 'Bloqueo de volumen BitLocker, bloqueo de pantalla y envío de avisos emergentes al agente.',
    category: 'Seguridad & Sistema'
  },
  {
    key: 'isReadOnly',
    label: 'Modo Auditoría (Solo Consulta)',
    description: 'Restringe todas las operaciones de escritura o alteración en el sistema.',
    category: 'Seguridad & Sistema'
  }
];

export function getDefaultPermissionsForRole(role: UserRole): UserPermissions {
  switch (role) {
    case 'edicion_total':
      return {
        canManageAssets: true,
        canDeleteAssets: true,
        canManageAssignments: true,
        canSignDocuments: true,
        canManageMaintenance: true,
        canManageTransfers: true,
        canManageEmployees: true,
        canManageUsers: true,
        canExportReports: true,
        isReadOnly: false,
        canManageLoans: true,
        canSendRemoteCommands: true
      };
    case 'admin_ti':
      return {
        canManageAssets: true,
        canDeleteAssets: false,
        canManageAssignments: true,
        canSignDocuments: true,
        canManageMaintenance: true,
        canManageTransfers: true,
        canManageEmployees: true,
        canManageUsers: true,
        canExportReports: true,
        isReadOnly: false,
        canManageLoans: true,
        canSendRemoteCommands: true
      };
    case 'visor':
      return {
        canManageAssets: false,
        canDeleteAssets: false,
        canManageAssignments: false,
        canSignDocuments: false,
        canManageMaintenance: false,
        canManageTransfers: false,
        canManageEmployees: false,
        canManageUsers: false,
        canExportReports: true,
        isReadOnly: true,
        canManageLoans: false,
        canSendRemoteCommands: false
      };
    case 'soporte_tecnico':
      return {
        canManageAssets: true,
        canDeleteAssets: false,
        canManageAssignments: false,
        canSignDocuments: false,
        canManageMaintenance: true,
        canManageTransfers: false,
        canManageEmployees: false,
        canManageUsers: false,
        canExportReports: true,
        isReadOnly: false,
        canManageLoans: true,
        canSendRemoteCommands: true
      };
    case 'almacenista':
      return {
        canManageAssets: true,
        canDeleteAssets: false,
        canManageAssignments: false,
        canSignDocuments: false,
        canManageMaintenance: false,
        canManageTransfers: true,
        canManageEmployees: false,
        canManageUsers: false,
        canExportReports: true,
        isReadOnly: false,
        canManageLoans: true,
        canSendRemoteCommands: false
      };
    case 'personalizado':
      return {
        canManageAssets: true,
        canDeleteAssets: false,
        canManageAssignments: true,
        canSignDocuments: false,
        canManageMaintenance: true,
        canManageTransfers: true,
        canManageEmployees: false,
        canManageUsers: false,
        canExportReports: true,
        isReadOnly: false,
        canManageLoans: true,
        canSendRemoteCommands: false
      };
    default:
      return {
        canManageAssets: true,
        canDeleteAssets: false,
        canManageAssignments: true,
        canSignDocuments: false,
        canManageMaintenance: true,
        canManageTransfers: true,
        canManageEmployees: false,
        canManageUsers: false,
        canExportReports: true,
        isReadOnly: false,
        canManageLoans: true,
        canSendRemoteCommands: false
      };
  }
}

export interface RoleConfig {
  role: UserRole;
  title: string;
  badgeLabel: string;
  badgeClass: string;
  dotClass: string;
  description: string;
}

export const ROLE_CONFIGS: Record<UserRole, RoleConfig> = {
  edicion_total: {
    role: 'edicion_total',
    title: 'Administrador Maestro (Edición Total)',
    badgeLabel: 'Edición Total',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    dotClass: 'bg-emerald-500',
    description: 'Acceso irrestricto: altas, bajas, firmas de responsivas, traslados, mantenimientos y control total de usuarios.'
  },
  admin_ti: {
    role: 'admin_ti',
    title: 'Administrador de Infraestructura TI',
    badgeLabel: 'Admin TI',
    badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-300',
    dotClass: 'bg-indigo-500',
    description: 'Gestión completa de hardware, asignaciones, traslados y mantenimientos. No puede eliminar equipos sin dictamen.'
  },
  visor: {
    role: 'visor',
    title: 'Visor / Auditor (Solo Lectura)',
    badgeLabel: 'Visor (Solo Lectura)',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-300',
    dotClass: 'bg-amber-500',
    description: 'Modo auditoría y consulta. Inspección de inventarios, trazabilidad y descarga de reportes PDF sin alteración.'
  },
  soporte_tecnico: {
    role: 'soporte_tecnico',
    title: 'Técnico de Soporte & Mantenimiento',
    badgeLabel: 'Soporte Técnico',
    badgeClass: 'bg-sky-50 text-sky-800 border-sky-300',
    dotClass: 'bg-sky-500',
    description: 'Ejecución de cronogramas preventivos, diagnóstico de equipos y registro de checklists de servicio.'
  },
  almacenista: {
    role: 'almacenista',
    title: 'Encargado de Almacén & Traslados',
    badgeLabel: 'Almacén & Traslados',
    badgeClass: 'bg-purple-50 text-purple-800 border-purple-300',
    dotClass: 'bg-purple-500',
    description: 'Control de inventario en almacén y gestión logística de envíos y recepciones entre sucursales.'
  },
  personalizado: {
    role: 'personalizado',
    title: 'Perfil con Permisos Personalizados',
    badgeLabel: 'Personalizado',
    badgeClass: 'bg-cyan-50 text-cyan-800 border-cyan-300',
    dotClass: 'bg-cyan-500',
    description: 'Permisos granulares configurados a la medida de la función específica del operador.'
  }
};
