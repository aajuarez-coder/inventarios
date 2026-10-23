export type AssetCategory = 
  | 'laptop'
  | 'desktop'
  | 'servidor'
  | 'monitor'
  | 'impresora'
  | 'redes'
  | 'tablet'
  | 'periferico';

export type AssetStatus = 
  | 'disponible' // En almacén
  | 'asignado'   // En uso por colaborador
  | 'mantenimiento' // En taller / soporte
  | 'baja'       // Desechado / Obsoleto
  | 'traslado';   // En tránsito entre sucursales

export type PhysicalCondition = 'excelente' | 'bueno' | 'regular' | 'dañado';

export interface HardwareSpecs {
  cpu: string;
  ram: string; // e.g., "16 GB DDR5"
  storage: string; // e.g., "512 GB NVMe SSD"
  gpu?: string;
  os: string;
  screenSize?: string;
  macAddress?: string;
  ipAddress?: string;
  batteryHealth?: string;
}

export interface HardwareAsset {
  id: string;
  assetTag: string; // Placa de inventario e.g., "EQ-2024-001"
  serialNumber: string;
  name: string;
  category: AssetCategory;
  brand: string;
  model: string;
  specs: HardwareSpecs;
  status: AssetStatus;
  physicalCondition: PhysicalCondition;
  branchId: string;
  locationDetails: string; // e.g. "Almacén Central Estante A3", "Piso 2 Escritorio 14"
  assignedToEmployeeId?: string;
  assignedDate?: string;
  purchaseDate: string;
  purchaseCost: number;
  currency: string;
  supplier: string;
  invoiceNumber: string;
  warrantyEndDate: string;
  lastMaintenanceDate?: string;
  nextMaintenanceDate: string;
  maintenanceIntervalMonths: number; // e.g., 6 months
  accessoriesIncluded: string[]; // e.g., ["Cargador 65W", "Mochila", "Mouse inalámbrico"]
  notes?: string;
  imageUrl?: string;
  latitude?: number;
  longitude?: number;
  lastGeoSync?: string;
}

export interface Employee {
  id: string;
  employeeNumber: string;
  fullName: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  branchId: string;
  status: 'activo' | 'licencia' | 'baja';
  hireDate: string;
  avatarUrl?: string;
}

export interface Assignment {
  id: string;
  folioResponsiva: string; // e.g., "RESP-2026-0042"
  assetId: string;
  employeeId: string;
  assignedDate: string;
  returnDate?: string;
  status: 'activa' | 'devuelta' | 'revocada';
  accessoriesDelivered: string[];
  employeeSignatureUrl?: string; // Data URL from canvas
  itStaffSignatureUrl?: string;
  itStaffName: string;
  conditionNotes: string;
  signedAt?: string;
  clausesAccepted: boolean;
}

export interface MaintenanceRecord {
  id: string;
  assetId: string;
  date: string;
  type: 'preventivo' | 'correctivo' | 'actualizacion_hardware' | 'limpieza_profunda';
  technicianName: string;
  cost: number;
  description: string;
  tasksCompleted: string[];
  diagnosticScore?: number; // 1-100
  nextScheduledDate: string;
  status: 'completado' | 'programado' | 'cancelado';
  emailNotified: boolean;
  emailNotifiedAt?: string;
}

export interface Branch {
  id: string;
  code: string;
  name: string;
  city: string;
  state: string;
  address: string;
  phone: string;
  managerName: string;
  isMainWarehouse: boolean;
  latitude: number;
  longitude: number;
}

export interface Transfer {
  id: string;
  folio: string; // e.g., "TRAS-2026-018"
  assetIds: string[];
  sourceBranchId: string;
  targetBranchId: string;
  shipmentDate: string;
  estimatedArrival: string;
  actualArrival?: string;
  carrier: string; // e.g. "DHL Express", "Transporte Interno"
  trackingNumber: string;
  status: 'en_transito' | 'recibido' | 'cancelado';
  requestedBy: string;
  receivedBy?: string;
  notes?: string;
}

export interface TimelineEvent {
  id: string;
  assetId: string;
  timestamp: string;
  type: 'alta' | 'asignacion' | 'devolucion' | 'mantenimiento' | 'traslado' | 'baja' | 'actualizacion' | 'bloqueo_bitlocker' | 'desbloqueo_bitlocker' | 'bloqueo_pantalla' | 'aviso_pantalla' | 'prestamo' | 'prestamo_devolucion';
  title: string;
  description: string;
  author: string;
  metadata?: Record<string, any>;
}

export interface EmailNotification {
  id: string;
  toEmail: string;
  toName: string;
  assetTag: string;
  assetName: string;
  subject: string;
  type: 'mantenimiento_preventivo' | 'garantia_por_vencer' | 'responsiva_pendiente' | 'alerta_almacen';
  scheduledDate?: string;
  sentAt: string;
  status: 'enviado' | 'programado';
  contentSnippet: string;
}

export type DeviceCommandType = 
  | 'bitlocker_lock'     // Exige clave de recuperación BitLocker en próximo reinicio o bloquea volumen
  | 'bitlocker_unlock'   // Restaura protectores BitLocker normales
  | 'screen_lock'        // Bloquea sesión inmediatamente (LockWorkStation)
  | 'display_message'    // Muestra cuadro de diálogo / aviso emergente institucional en pantalla
  | 'isolate_network';   // Aislamiento de red preventiva

export type DeviceCommandStatus = 'pending' | 'sent' | 'executed' | 'failed' | 'cancelled';

export interface DeviceCommand {
  id: string;
  assetId?: string;
  agentId: string;
  targetHostname: string;
  commandType: DeviceCommandType;
  parameters: {
    messageTitle?: string;
    messageText?: string;
    messageUrgency?: 'info' | 'warning' | 'critical';
    displayDurationSeconds?: number;
    lockImmediate?: boolean;
    reason?: string;
    bitlockerDrive?: string; // e.g. "C:"
    recoveryKeyNotice?: boolean;
  };
  status: DeviceCommandStatus;
  createdAt: string;
  dispatchedAt?: string;
  executedAt?: string;
  outputMessage?: string;
  requestedBy: string;
}

export interface BitLockerStatus {
  drive: string;
  encryptionMethod: string;
  protectionStatus: 'Protegido' | 'Desprotegido' | 'Bloqueado' | 'No Configurado';
  lockState: 'locked' | 'unlocked';
  recoveryKeyId?: string;
  recoveryKey?: string; // Llave numérica de 48 dígitos
  tpmPresent: boolean;
  lastStatusCheck: string;
}

export type LoanStatus = 'activo' | 'vencido' | 'devuelto' | 'cancelado';

export interface EquipmentLoan {
  id: string;
  folio: string; // e.g., "PREST-2026-001"
  assetId: string;
  employeeId: string;
  startDate: string;          // Fecha de entrega/salida
  expectedReturnDate: string; // Fecha programada de devolución
  actualReturnDate?: string;  // Fecha real en que se devolvió
  purpose: 'viaje_trabajo' | 'capacitacion' | 'reparacion_temporal' | 'guardia' | 'evento_corporativo' | 'otro';
  purposeDescription: string;
  accessoriesIncluded: string[]; // Cargador, Mochila, Adaptador HDMI, Candado Kensington, Mouse
  status: LoanStatus;
  conditionOnCheckout: PhysicalCondition;
  conditionOnReturn?: PhysicalCondition;
  deliveryNotes?: string;
  returnNotes?: string;
  technicianOutName: string;
  technicianInName?: string;
  employeeSignatureCheckout?: string; // Firma digital al recibir
  employeeSignatureReturn?: string;   // Firma digital al devolver
  itSignatureCheckout?: string;
  itSignatureReturn?: string;
  createdAt: string;
}

export type UserRole = 
  | 'edicion_total'     // Administrador general con acceso de escritura/edición completa
  | 'admin_ti'          // Administrador de Infraestructura TI
  | 'visor'             // Perfil Visor (Solo Lectura, auditoría sin permisos de edición)
  | 'soporte_tecnico'   // Mantenimiento y soporte técnico
  | 'almacenista'       // Encargado de almacén y logística
  | 'personalizado';    // Permisos personalizados configurados manualmente

export interface UserPermissions {
  canManageAssets: boolean;       // Crear, editar y actualizar equipos de hardware
  canDeleteAssets: boolean;       // Eliminar o dar de baja definitiva equipos
  canManageAssignments: boolean;  // Asignar equipos y crear cartas responsivas
  canSignDocuments: boolean;      // Firmar responsivas digitalmente como TI
  canManageMaintenance: boolean;  // Registrar y concluir mantenimientos
  canManageTransfers: boolean;    // Despachar y recibir traslados entre sucursales
  canManageEmployees: boolean;    // Registrar o modificar datos de colaboradores
  canManageUsers: boolean;        // Crear, editar o dar de baja usuarios del sistema
  canExportReports: boolean;      // Generar reportes PDF y exportar copias de seguridad
  isReadOnly: boolean;            // Modo global de solo lectura (auditoría)
  canManageLoans?: boolean;       // Crear y registrar devoluciones de préstamos de equipo
  canSendRemoteCommands?: boolean; // Ejecutar bloqueo BitLocker, pantalla y avisos
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  roleTitle: string;
  branchName: string;
  avatarUrl?: string;
  canEdit: boolean;
  status?: 'activo' | 'inactivo';
  createdAt?: string;
  lastLogin?: string;
  permissions?: UserPermissions;
}


