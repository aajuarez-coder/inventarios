import { 
  HardwareAsset, 
  Employee, 
  Assignment, 
  MaintenanceRecord, 
  Branch, 
  Transfer, 
  TimelineEvent, 
  EmailNotification,
  AppUser,
  EquipmentLoan
} from '../types/inventory';

export const INITIAL_BRANCHES: Branch[] = [
  {
    id: 'branch-1',
    code: 'SUC-CDMX-01',
    name: 'Corporativo Torre Central',
    city: 'Ciudad de México',
    state: 'CDMX',
    address: 'Av. Paseo de la Reforma 250, Piso 14, Cuauhtémoc',
    phone: '+52 (55) 5123-4567',
    managerName: 'Ing. Carlos Mendoza',
    isMainWarehouse: true,
    latitude: 19.4270,
    longitude: -99.1677,
  },
  {
    id: 'branch-2',
    code: 'SUC-MTY-02',
    name: 'Planta de Operaciones Monterrey',
    city: 'Monterrey',
    state: 'Nuevo León',
    address: 'Parque Industrial Apodaca, Nave 4',
    phone: '+52 (81) 8900-1122',
    managerName: 'Lic. Laura Elizondo',
    isMainWarehouse: false,
    latitude: 25.7788,
    longitude: -100.1873,
  },
  {
    id: 'branch-3',
    code: 'SUC-GDL-03',
    name: 'Centro Tecnológico Guadalajara',
    city: 'Guadalajara',
    state: 'Jalisco',
    address: 'Av. Américas 1500, Puerta de Hierro',
    phone: '+52 (33) 3678-9900',
    managerName: 'Ing. Rodrigo Solís',
    isMainWarehouse: false,
    latitude: 20.7099,
    longitude: -103.4145,
  },
  {
    id: 'branch-4',
    code: 'SUC-TIJ-04',
    name: 'Sucursal Frontera Tijuana',
    city: 'Tijuana',
    state: 'Baja California',
    address: 'Zona Río, Blvd. Sánchez Taboada 1020',
    phone: '+52 (664) 634-8800',
    managerName: 'Ing. Mariana Valenzuela',
    isMainWarehouse: false,
    latitude: 32.5255,
    longitude: -117.0215,
  },
  {
    id: 'branch-5',
    code: 'SUC-MZT-05',
    name: 'Matriz Corporativa Mazatlán',
    city: 'Mazatlán',
    state: 'Sinaloa',
    address: 'Av. del Mar 1100, Flamingos, 82149 Mazatlán, Sin.',
    phone: '+52 (669) 989-1000',
    managerName: 'Lic. Roberto Carrillo',
    isMainWarehouse: false,
    latitude: 23.2393,
    longitude: -106.4212,
  }
];

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'emp-1',
    employeeNumber: 'EMP-1042',
    fullName: 'Alejandro Juárez',
    email: 'aajuarez@petroil.com.mx',
    phone: '+52 (55) 4432-9011',
    department: 'Tecnologías de Información',
    position: 'Arquitecto de Soluciones TI',
    branchId: 'branch-1',
    status: 'activo',
    hireDate: '2022-03-15',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
  },
  {
    id: 'emp-2',
    employeeNumber: 'EMP-1088',
    fullName: 'Sofía Villarreal Castillo',
    email: 'svillarreal@petroil.com.mx',
    phone: '+52 (81) 1244-5566',
    department: 'Finanzas y Contabilidad',
    position: 'Gerente de Contraloría',
    branchId: 'branch-2',
    status: 'activo',
    hireDate: '2021-08-01',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=250&q=80',
  },
  {
    id: 'emp-3',
    employeeNumber: 'EMP-1120',
    fullName: 'David Morales Herrera',
    email: 'dmorales@petroil.com.mx',
    phone: '+52 (33) 9876-1234',
    department: 'Logística y Operaciones',
    position: 'Coordinador de Cadena de Suministro',
    branchId: 'branch-3',
    status: 'activo',
    hireDate: '2023-01-10',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
  },
  {
    id: 'emp-4',
    employeeNumber: 'EMP-1145',
    fullName: 'Mariana Ríos Domínguez',
    email: 'mrios@petroil.com.mx',
    phone: '+52 (55) 7788-9900',
    department: 'Recursos Humanos',
    position: 'Especialista en Desarrollo Organizacional',
    branchId: 'branch-1',
    status: 'activo',
    hireDate: '2023-06-20',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=250&q=80',
  },
  {
    id: 'emp-5',
    employeeNumber: 'EMP-1204',
    fullName: 'Ing. Fernando Barajas',
    email: 'fbarajas@petroil.com.mx',
    phone: '+52 (664) 554-3211',
    department: 'Mantenimiento y Planta',
    position: 'Jefe de Seguridad Industrial',
    branchId: 'branch-4',
    status: 'activo',
    hireDate: '2024-02-14',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80',
  },
  {
    id: 'emp-6',
    employeeNumber: 'EMP-1230',
    fullName: 'Valeria Gómez Luna',
    email: 'vgomez@petroil.com.mx',
    phone: '+52 (55) 8811-2233',
    department: 'Ventas Corporativas',
    position: 'Ejecutiva Senior de Cuentas Clave',
    branchId: 'branch-1',
    status: 'activo',
    hireDate: '2024-09-01',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=250&q=80',
  }
];

export const INITIAL_ASSETS: HardwareAsset[] = [
  {
    id: 'asset-1',
    assetTag: 'EQ-LAP-001',
    serialNumber: 'PF39KLA901',
    name: 'ThinkPad T14 Gen 4 Core i7',
    category: 'laptop',
    brand: 'Lenovo',
    model: 'ThinkPad T14s Gen 4 Intel vPro',
    specs: {
      cpu: 'Intel Core i7-1365U (10 núcleos, hasta 5.2 GHz)',
      ram: '32 GB LPDDR5x 6400MHz',
      storage: '1 TB NVMe PCIe 4.0 SSD',
      gpu: 'Intel Iris Xe Graphics',
      os: 'Windows 11 Pro Corporativo',
      screenSize: '14.0" WUXGA (1920x1200) IPS Anti-reflejante',
      macAddress: '9C:B6:D0:41:A2:7B',
      ipAddress: '192.168.10.45',
      batteryHealth: '98% (Ciclos: 42)'
    },
    status: 'asignado',
    physicalCondition: 'excelente',
    branchId: 'branch-1',
    locationDetails: 'Piso 14 - Estación TI 03',
    assignedToEmployeeId: 'emp-1',
    assignedDate: '2026-01-15',
    purchaseDate: '2025-11-20',
    purchaseCost: 28400,
    currency: 'MXN',
    supplier: 'Compusoluciones SA de CV',
    invoiceNumber: 'FA-2025-89104',
    warrantyEndDate: '2028-11-20', // Vigente
    lastMaintenanceDate: '2026-04-10',
    nextMaintenanceDate: '2026-10-20', // Próximo pronto! (Hoy es 16 de Octubre 2026)
    maintenanceIntervalMonths: 6,
    accessoriesIncluded: ['Cargador USB-C 65W Original', 'Mochila Lenovo Pro Eco', 'Mouse inalámbrico Logitech MX Anywhere 3', 'Candado de seguridad Kensington'],
    notes: 'Equipo asignado al Líder de Arquitectura TI para labores críticas.',
    imageUrl: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'asset-2',
    assetTag: 'EQ-LAP-002',
    serialNumber: 'C02G90XXMD6M',
    name: 'MacBook Pro 16" M3 Pro',
    category: 'laptop',
    brand: 'Apple',
    model: 'MacBook Pro 16 Space Black',
    specs: {
      cpu: 'Apple M3 Pro (12 CPU cores, 18 GPU cores)',
      ram: '36 GB Memoria Unificada',
      storage: '512 GB SSD Alta Velocidad',
      gpu: 'Apple 18-Core GPU',
      os: 'macOS Sonoma 14.5 Enterprise',
      screenSize: '16.2" Liquid Retina XDR (3456x2234)',
      macAddress: 'F0:18:98:8C:11:42',
      ipAddress: '192.168.10.60',
      batteryHealth: '96% (Ciclos: 89)'
    },
    status: 'asignado',
    physicalCondition: 'excelente',
    branchId: 'branch-2',
    locationDetails: 'Oficina Contraloría MTY',
    assignedToEmployeeId: 'emp-2',
    assignedDate: '2025-12-05',
    purchaseDate: '2025-10-10',
    purchaseCost: 52999,
    currency: 'MXN',
    supplier: 'Apple Store México Corporativo',
    invoiceNumber: 'APPL-MX-77341',
    warrantyEndDate: '2026-10-25', // Alerta: Vence en 9 días! (<30 días)
    lastMaintenanceDate: '2026-04-02',
    nextMaintenanceDate: '2026-10-18', // Requiere mantenimiento en 2 días!
    maintenanceIntervalMonths: 6,
    accessoriesIncluded: ['Cargador MagSafe 3 140W', 'Cable trenzado USB-C', 'Funda de neopreno Tomtoc', 'Adaptador Multi-puerto USB-C a HDMI'],
    notes: 'Asignado a Finanzas para modelos analíticos pesados y reportes financieros.',
    imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'asset-3',
    assetTag: 'EQ-DSK-003',
    serialNumber: '7X89W1200L',
    name: 'Dell OptiPlex 7010 Micro',
    category: 'desktop',
    brand: 'Dell Technologies',
    model: 'OptiPlex 7010 Micro Form Factor',
    specs: {
      cpu: 'Intel Core i5-13500T (14 núcleos)',
      ram: '16 GB DDR4 3200MHz',
      storage: '512 GB NVMe SSD',
      gpu: 'Intel UHD Graphics 770',
      os: 'Windows 11 Pro',
      macAddress: '18:66:DA:22:90:FA',
      ipAddress: '192.168.20.15'
    },
    status: 'asignado',
    physicalCondition: 'bueno',
    branchId: 'branch-3',
    locationDetails: 'Módulo de Embarques GDL',
    assignedToEmployeeId: 'emp-3',
    assignedDate: '2025-06-12',
    purchaseDate: '2024-05-18',
    purchaseCost: 19500,
    currency: 'MXN',
    supplier: 'Dell México Directo',
    invoiceNumber: 'DELL-INV-99014',
    warrantyEndDate: '2027-05-18',
    lastMaintenanceDate: '2026-03-10',
    nextMaintenanceDate: '2026-09-15', // Vencido hace 1 mes! (Alerta mantenimiento atrasado)
    maintenanceIntervalMonths: 6,
    accessoriesIncluded: ['Adaptador de corriente Dell 90W', 'Teclado USB Dell KB216', 'Mouse óptico Dell MS116', 'Soporte VESA para monitor'],
    notes: 'Equipo de escritorio compacto para estación de control logístico.',
    imageUrl: 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'asset-4',
    assetTag: 'EQ-LAP-004',
    serialNumber: '5CG3408X2P',
    name: 'HP EliteBook 840 G10',
    category: 'laptop',
    brand: 'HP',
    model: 'EliteBook 840 14 inch G10',
    specs: {
      cpu: 'Intel Core i7-1355U',
      ram: '16 GB DDR5 5200MHz',
      storage: '512 GB PCIe Gen4 SSD',
      gpu: 'Intel Iris Xe',
      os: 'Windows 11 Pro',
      screenSize: '14" FHD IPS',
      macAddress: '74:D4:35:E1:9F:88',
      ipAddress: '192.168.10.82',
      batteryHealth: '94%'
    },
    status: 'asignado',
    physicalCondition: 'excelente',
    branchId: 'branch-1',
    locationDetails: 'Piso 12 - Sala RRHH',
    assignedToEmployeeId: 'emp-4',
    assignedDate: '2026-02-01',
    purchaseDate: '2025-08-14',
    purchaseCost: 26800,
    currency: 'MXN',
    supplier: 'Ingram Micro México',
    invoiceNumber: 'IM-MX-55219',
    warrantyEndDate: '2028-08-14',
    lastMaintenanceDate: '2026-04-15',
    nextMaintenanceDate: '2026-10-22', // En 6 días!
    maintenanceIntervalMonths: 6,
    accessoriesIncluded: ['Cargador HP 65W Smart AC USB-C', 'Maletín ejecutivo HP Prelude', 'Mouse inalámbrico HP 240'],
    notes: 'Equipo utilizado para gestión de nómina y expediente de personal.',
    imageUrl: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'asset-5',
    assetTag: 'EQ-ALM-005',
    serialNumber: 'PF4X9900L1',
    name: 'Lenovo ThinkPad L14 Gen 4',
    category: 'laptop',
    brand: 'Lenovo',
    model: 'ThinkPad L14 AMD Ryzen 7 PRO',
    specs: {
      cpu: 'AMD Ryzen 7 PRO 7730U (8 núcleos, 16 hilos)',
      ram: '16 GB DDR4 3200MHz',
      storage: '512 GB SSD NVMe M.2',
      gpu: 'AMD Radeon Graphics',
      os: 'Windows 11 Pro',
      screenSize: '14" FHD Antirreflejo',
      macAddress: '00:2B:67:8A:14:02'
    },
    status: 'disponible', // Stock en almacén listo para asignar
    physicalCondition: 'excelente',
    branchId: 'branch-1',
    locationDetails: 'Almacén Central TI - Anaquel A, Caja 12',
    purchaseDate: '2026-01-10',
    purchaseCost: 21500,
    currency: 'MXN',
    supplier: 'Compusoluciones SA de CV',
    invoiceNumber: 'FA-2026-01044',
    warrantyEndDate: '2029-01-10',
    nextMaintenanceDate: '2026-12-10',
    maintenanceIntervalMonths: 6,
    accessoriesIncluded: ['Cargador Lenovo 65W USB-C nuevo en caja', 'Mochila corporativa nueva', 'Mouse USB Lenovo'],
    notes: 'Equipo nuevo formateado con imagen corporativa oficial listo para nuevo ingreso.',
    imageUrl: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'asset-6',
    assetTag: 'EQ-ALM-006',
    serialNumber: 'PF4X9900L2',
    name: 'Lenovo ThinkPad L14 Gen 4',
    category: 'laptop',
    brand: 'Lenovo',
    model: 'ThinkPad L14 AMD Ryzen 7 PRO',
    specs: {
      cpu: 'AMD Ryzen 7 PRO 7730U',
      ram: '16 GB DDR4 3200MHz',
      storage: '512 GB SSD NVMe M.2',
      gpu: 'AMD Radeon Graphics',
      os: 'Windows 11 Pro',
      screenSize: '14" FHD Antirreflejo',
      macAddress: '00:2B:67:8A:14:03'
    },
    status: 'disponible', // Stock en almacén listo para asignar
    physicalCondition: 'excelente',
    branchId: 'branch-1',
    locationDetails: 'Almacén Central TI - Anaquel A, Caja 13',
    purchaseDate: '2026-01-10',
    purchaseCost: 21500,
    currency: 'MXN',
    supplier: 'Compusoluciones SA de CV',
    invoiceNumber: 'FA-2026-01044',
    warrantyEndDate: '2029-01-10',
    nextMaintenanceDate: '2026-12-10',
    maintenanceIntervalMonths: 6,
    accessoriesIncluded: ['Cargador Lenovo 65W USB-C', 'Mochila corporativa nueva', 'Mouse USB Lenovo'],
    notes: 'En inventario de reserva para contingencias o nuevos colaboradores.',
    imageUrl: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'asset-7',
    assetTag: 'EQ-SRV-007',
    serialNumber: '9M44JJ3091',
    name: 'Servidor Dell PowerEdge R650xs',
    category: 'servidor',
    brand: 'Dell Technologies',
    model: 'PowerEdge R650xs Rack 1U',
    specs: {
      cpu: '2x Intel Xeon Silver 4314 (32 cores total)',
      ram: '128 GB RDIMM DDR4 3200MHz ECC',
      storage: '4x 1.92TB SSD SATA Read Intensive RAID 10',
      os: 'VMware ESXi 8.0 Enterprise / Red Hat Enterprise Linux',
      macAddress: 'E4:43:4B:99:A1:00',
      ipAddress: '10.0.1.10'
    },
    status: 'asignado',
    physicalCondition: 'excelente',
    branchId: 'branch-1',
    locationDetails: 'Data Center Corporativo - Rack Principal U12-U13',
    assignedToEmployeeId: 'emp-1',
    assignedDate: '2024-03-01',
    purchaseDate: '2024-02-15',
    purchaseCost: 165000,
    currency: 'MXN',
    supplier: 'Dell Technologies Enterprise',
    invoiceNumber: 'DELL-ENT-41009',
    warrantyEndDate: '2027-02-15',
    lastMaintenanceDate: '2026-05-10',
    nextMaintenanceDate: '2026-11-10',
    maintenanceIntervalMonths: 6,
    accessoriesIncluded: ['Kit rieles ReadyRails', '2x Cables de poder C13-C14 2m', 'Bisel frontal con llave'],
    notes: 'Servidor de virtualización productivo con monitoreo iDRAC 9 Enterprise.',
    imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'asset-8',
    assetTag: 'EQ-MON-008',
    serialNumber: 'CN4450392Z',
    name: 'Monitor Dell UltraSharp 27" 4K',
    category: 'monitor',
    brand: 'Dell Technologies',
    model: 'U2723QE Hub USB-C',
    specs: {
      cpu: 'N/A',
      ram: 'N/A',
      storage: 'N/A',
      os: 'N/A',
      screenSize: '27" 4K UHD (3840 x 2160) IPS Black 98% DCI-P3'
    },
    status: 'asignado',
    physicalCondition: 'excelente',
    branchId: 'branch-1',
    locationDetails: 'Piso 14 - Escritorio TI 03',
    assignedToEmployeeId: 'emp-1',
    assignedDate: '2026-01-15',
    purchaseDate: '2025-11-20',
    purchaseCost: 12900,
    currency: 'MXN',
    supplier: 'Compusoluciones SA de CV',
    invoiceNumber: 'FA-2025-89104',
    warrantyEndDate: '2028-11-20',
    nextMaintenanceDate: '2027-01-15',
    maintenanceIntervalMonths: 12,
    accessoriesIncluded: ['Cable de poder', 'Cable USB-C a USB-C 90W', 'Cable DisplayPort 1.4'],
    notes: 'Monitor con hub integrado y carga de 90W para laptop.',
    imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'asset-9',
    assetTag: 'EQ-IMP-009',
    serialNumber: 'VNB3N14890',
    name: 'Impresora Multifuncional HP LaserJet Enterprise',
    category: 'impresora',
    brand: 'HP',
    model: 'LaserJet Enterprise Flow MFP M528z',
    specs: {
      cpu: 'ARM 1.2 GHz',
      ram: '2.5 GB',
      storage: '500 GB Secure Hard Disk',
      os: 'HP FutureSmart Firmware',
      macAddress: '00:1E:0B:44:98:C0',
      ipAddress: '192.168.10.200'
    },
    status: 'mantenimiento', // En taller
    physicalCondition: 'regular',
    branchId: 'branch-1',
    locationDetails: 'Taller de Servicio TI - Mesa 2',
    purchaseDate: '2023-04-12',
    purchaseCost: 38900,
    currency: 'MXN',
    supplier: 'HP Directo',
    invoiceNumber: 'HP-MFP-22340',
    warrantyEndDate: '2026-04-12', // Vencida!
    lastMaintenanceDate: '2026-02-18',
    nextMaintenanceDate: '2026-10-15', // Fecha vencida ayer
    maintenanceIntervalMonths: 4,
    accessoriesIncluded: ['Bandeja adicional 550 hojas', 'Cable USB', 'Cable de red Gigabit'],
    notes: 'Presenta atasco frecuente en alimentador automático (ADF). En cambio de rodillos.',
    imageUrl: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'asset-10',
    assetTag: 'EQ-NET-010',
    serialNumber: 'FOC2438V04L',
    name: 'Switch Administrable Cisco Catalyst 9200L',
    category: 'redes',
    brand: 'Cisco Systems',
    model: 'C9200L-48P-4G-E (48 puertos PoE+)',
    specs: {
      cpu: 'Cisco UADP 2.0',
      ram: '2 GB DRAM',
      storage: '4 GB Flash',
      os: 'Cisco IOS XE 17.9',
      macAddress: '2C:33:11:AB:55:00',
      ipAddress: '10.0.1.2'
    },
    status: 'asignado',
    physicalCondition: 'excelente',
    branchId: 'branch-2',
    locationDetails: 'Site de Telecomunicaciones MTY - Rack 1',
    purchaseDate: '2024-06-25',
    purchaseCost: 74200,
    currency: 'MXN',
    supplier: 'Ikusi México',
    invoiceNumber: 'IKU-2024-991',
    warrantyEndDate: '2029-06-25',
    lastMaintenanceDate: '2026-01-20',
    nextMaintenanceDate: '2026-07-20', // Mantenimiento vencido!
    maintenanceIntervalMonths: 6,
    accessoriesIncluded: ['Cable de consola RJ45-USB', 'Orejas para montaje en rack', 'Fuente redundante PWR-C5-600WAC'],
    notes: 'Switch de capa de acceso con soporte PoE para cámaras y teléfonos IP.',
    imageUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'asset-11',
    assetTag: 'EQ-LAP-011',
    serialNumber: '5CD2189K09',
    name: 'HP ProBook 450 G9',
    category: 'laptop',
    brand: 'HP',
    model: 'ProBook 450 15.6 inch G9',
    specs: {
      cpu: 'Intel Core i5-1235U',
      ram: '16 GB DDR4 3200MHz',
      storage: '256 GB NVMe SSD',
      gpu: 'Intel Iris Xe',
      os: 'Windows 11 Pro',
      screenSize: '15.6" FHD con teclado numérico',
      macAddress: '1C:69:7A:55:40:99'
    },
    status: 'traslado', // En tránsito hacia Tijuana
    physicalCondition: 'bueno',
    branchId: 'branch-4', // Destino
    locationDetails: 'En tránsito por paquetería Estafeta Express Guía #884920199',
    purchaseDate: '2023-09-10',
    purchaseCost: 18200,
    currency: 'MXN',
    supplier: 'Ingram Micro México',
    invoiceNumber: 'IM-MX-11904',
    warrantyEndDate: '2026-09-10', // Garantía recién vencida el mes pasado!
    nextMaintenanceDate: '2026-11-05',
    maintenanceIntervalMonths: 6,
    accessoriesIncluded: ['Cargador original HP 45W', 'Mouse USB'],
    notes: 'Enviada desde CDMX a Sucursal Tijuana para soporte operativo en planta.',
    imageUrl: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'asset-12',
    assetTag: 'EQ-BAJ-012',
    serialNumber: 'CND7193L90',
    name: 'HP EliteDesk 800 G3 Torre',
    category: 'desktop',
    brand: 'HP',
    model: 'EliteDesk 800 G3 TWR',
    specs: {
      cpu: 'Intel Core i5-7500 (7ma Gen)',
      ram: '8 GB DDR4',
      storage: '1 TB HDD 7200 RPM',
      os: 'Windows 10 Pro (Sin soporte)',
      macAddress: '00:08:74:9A:88:21'
    },
    status: 'baja', // Dado de baja por obsolescencia
    physicalCondition: 'regular',
    branchId: 'branch-1',
    locationDetails: 'Almacén de Bajas y Desecho Electrónico - Pasillo D',
    purchaseDate: '2017-08-10',
    purchaseCost: 16500,
    currency: 'MXN',
    supplier: 'CompuEducación SA',
    invoiceNumber: 'FA-2017-0941',
    warrantyEndDate: '2020-08-10',
    nextMaintenanceDate: '2020-08-10',
    maintenanceIntervalMonths: 12,
    accessoriesIncluded: [],
    notes: 'Dado de baja formal mediante dictamen técnico TI-DICT-2026-015 por fin de ciclo de vida.',
    imageUrl: 'https://images.unsplash.com/photo-1547082299-de196ea013d6?auto=format&fit=crop&w=600&q=80'
  }
];

export const INITIAL_ASSIGNMENTS: Assignment[] = [
  {
    id: 'asg-1',
    folioResponsiva: 'RESP-2026-0042',
    assetId: 'asset-1',
    employeeId: 'emp-1',
    assignedDate: '2026-01-15',
    status: 'activa',
    accessoriesDelivered: [
      'Cargador USB-C 65W Original Lenovo',
      'Mochila Lenovo Pro Eco impermeable',
      'Mouse inalámbrico Logitech MX Anywhere 3',
      'Candado de seguridad Kensington de combinación'
    ],
    employeeSignatureUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60"><path d="M10,40 Q40,10 70,35 T130,20 T180,45" fill="none" stroke="%231e3a8a" stroke-width="2.5"/></svg>',
    itStaffSignatureUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60"><path d="M15,35 Q60,5 90,40 T150,25 T190,30" fill="none" stroke="%23047857" stroke-width="2.5"/></svg>',
    itStaffName: 'Ing. Carlos Mendoza (Jefe de Infraestructura TI)',
    conditionNotes: 'Equipo nuevo entregado en caja sellada con sellos de garantía íntegros y configurado con suite de seguridad corporativa.',
    signedAt: '2026-01-15T10:30:00Z',
    clausesAccepted: true
  },
  {
    id: 'asg-2',
    folioResponsiva: 'RESP-2025-0189',
    assetId: 'asset-2',
    employeeId: 'emp-2',
    assignedDate: '2025-12-05',
    status: 'activa',
    accessoriesDelivered: [
      'Cargador MagSafe 3 140W',
      'Cable trenzado USB-C original',
      'Funda de neopreno Tomtoc 16 pulgadas',
      'Adaptador Multi-puerto USB-C a HDMI 4K'
    ],
    employeeSignatureUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60"><path d="M15,45 Q50,15 90,35 T140,25 T185,40" fill="none" stroke="%231e3a8a" stroke-width="2.5"/></svg>',
    itStaffSignatureUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60"><path d="M20,30 Q50,10 100,45 T160,20" fill="none" stroke="%23047857" stroke-width="2.5"/></svg>',
    itStaffName: 'Ing. Laura Elizondo (Soporte TI MTY)',
    conditionNotes: 'Excelente condición cosmética y funcional. Cifrado FileVault activado y enrolado en MDM Jamf.',
    signedAt: '2025-12-05T15:45:00Z',
    clausesAccepted: true
  },
  {
    id: 'asg-3',
    folioResponsiva: 'RESP-2025-0077',
    assetId: 'asset-3',
    employeeId: 'emp-3',
    assignedDate: '2025-06-12',
    status: 'activa',
    accessoriesDelivered: [
      'Adaptador de corriente Dell 90W',
      'Teclado USB Dell KB216 en español',
      'Mouse óptico Dell MS116',
      'Soporte VESA metálico'
    ],
    employeeSignatureUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60"><path d="M10,35 Q50,5 90,30 T160,35" fill="none" stroke="%231e3a8a" stroke-width="2.5"/></svg>',
    itStaffSignatureUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60"><path d="M15,40 Q70,10 120,35 T175,25" fill="none" stroke="%23047857" stroke-width="2.5"/></svg>',
    itStaffName: 'Ing. Rodrigo Solís (TI Guadalajara)',
    conditionNotes: 'Instalado en rack de escritorio de embarques. Cuenta con antivirus corporativo y conexión a VPN interna.',
    signedAt: '2025-06-12T11:15:00Z',
    clausesAccepted: true
  },
  {
    id: 'asg-4',
    folioResponsiva: 'RESP-2026-0055',
    assetId: 'asset-4',
    employeeId: 'emp-4',
    assignedDate: '2026-02-01',
    status: 'activa',
    accessoriesDelivered: [
      'Cargador HP 65W Smart AC USB-C',
      'Maletín ejecutivo HP Prelude',
      'Mouse inalámbrico HP 240 con batería AA'
    ],
    employeeSignatureUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60"><path d="M20,40 Q60,15 110,40 T170,30" fill="none" stroke="%231e3a8a" stroke-width="2.5"/></svg>',
    itStaffSignatureUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60"><path d="M10,45 Q50,15 100,35 T180,20" fill="none" stroke="%23047857" stroke-width="2.5"/></svg>',
    itStaffName: 'Ing. Carlos Mendoza (Jefe de Infraestructura TI)',
    conditionNotes: 'Equipo sin rayones ni golpes. Software de gestión de recursos humanos y firma electrónica instalado.',
    signedAt: '2026-02-01T09:30:00Z',
    clausesAccepted: true
  }
];

export const INITIAL_MAINTENANCE_RECORDS: MaintenanceRecord[] = [
  {
    id: 'maint-1',
    assetId: 'asset-1',
    date: '2026-04-10',
    type: 'preventivo',
    technicianName: 'Ing. Roberto Silva (Soporte Nivel 2)',
    cost: 450,
    description: 'Mantenimiento preventivo semestral: Limpieza de disipador térmico, soplado de ventiladores con aire seco comprimido, cambio de pasta térmica Arctic MX-6 y diagnóstico de hardware.',
    tasksCompleted: [
      'Limpieza física interna de disipador y ventilador',
      'Renovación de pasta térmica en CPU',
      'Limpieza de puertos USB-C, HDMI y teclado con alcohol isopropílico',
      'Actualización de BIOS/UEFI a versión 1.28',
      'Verificación de estado de batería (salud 98%)',
      'Prueba de estrés de CPU y temperatura (temperatura máxima 72°C bajo carga)'
    ],
    diagnosticScore: 99,
    nextScheduledDate: '2026-10-20',
    status: 'completado',
    emailNotified: true,
    emailNotifiedAt: '2026-04-03T09:00:00Z'
  },
  {
    id: 'maint-2',
    assetId: 'asset-2',
    date: '2026-04-02',
    type: 'preventivo',
    technicianName: 'Lic. Laura Elizondo',
    cost: 600,
    description: 'Revisión preventiva periódica MacBook Pro: Diagnóstico con Apple Diagnostics, verificación de salud de celdas de batería y depuración de espacio.',
    tasksCompleted: [
      'Ejecución de Apple Diagnostics (Código ADP000 - Sin anomalías)',
      'Limpieza ultrasónica de superficie y teclado',
      'Actualización de parches de seguridad macOS Sonoma',
      'Revisión de integridad de cargador MagSafe 3'
    ],
    diagnosticScore: 98,
    nextScheduledDate: '2026-10-18', // Requiere aviso!
    status: 'completado',
    emailNotified: false
  },
  {
    id: 'maint-3',
    assetId: 'asset-3',
    date: '2026-03-10',
    type: 'preventivo',
    technicianName: 'Ing. Rodrigo Solís',
    cost: 350,
    description: 'Limpieza interna de polvo acumulado en almacén y lubricación de ventilador de chasis Micro Form Factor.',
    tasksCompleted: [
      'Desensamble y limpieza profunda de polvo industrial',
      'Prueba de sectores SSD mediante S.M.A.R.T. (100% sano)',
      'Actualización de controladores de red Intel Gigabit'
    ],
    diagnosticScore: 94,
    nextScheduledDate: '2026-09-15', // Vencido!
    status: 'completado',
    emailNotified: true,
    emailNotifiedAt: '2026-09-08T08:30:00Z'
  },
  {
    id: 'maint-4',
    assetId: 'asset-9',
    date: '2026-10-15',
    type: 'correctivo',
    technicianName: 'Técnico Especializado HP Print',
    cost: 1850,
    description: 'Mantenimiento correctivo por atasco de hojas en bandeja superior ADF y cambio de rodillos de tracción.',
    tasksCompleted: [
      'Diagnóstico de sensores ópticos de paso de papel',
      'Desmontaje de kit de rodillos desgastados',
      'Limpieza de espejos de escáner plano'
    ],
    diagnosticScore: 80,
    nextScheduledDate: '2027-02-15',
    status: 'programado',
    emailNotified: true,
    emailNotifiedAt: '2026-10-14T11:00:00Z'
  }
];

export const INITIAL_TRANSFERS: Transfer[] = [
  {
    id: 'trf-1',
    folio: 'TRAS-2026-0018',
    assetIds: ['asset-11'],
    sourceBranchId: 'branch-1',
    targetBranchId: 'branch-4',
    shipmentDate: '2026-10-14',
    estimatedArrival: '2026-10-19',
    carrier: 'Estafeta Express Aéreo',
    trackingNumber: 'EST-884920199-MX',
    status: 'en_transito',
    requestedBy: 'Ing. Mariana Valenzuela (Tijuana)',
    notes: 'Envío de laptop para nuevo supervisor de planta en frontera.'
  },
  {
    id: 'trf-2',
    folio: 'TRAS-2026-0012',
    assetIds: ['asset-10'],
    sourceBranchId: 'branch-1',
    targetBranchId: 'branch-2',
    shipmentDate: '2026-06-20',
    estimatedArrival: '2026-06-24',
    actualArrival: '2026-06-23',
    carrier: 'DHL Express Corporate',
    trackingNumber: 'DHL-3910482991',
    status: 'recibido',
    requestedBy: 'Lic. Laura Elizondo (Monterrey)',
    receivedBy: 'Ing. Héctor Garza',
    notes: 'Switch de red para ampliación de línea 3 de producción. Recibido en perfecto estado.'
  }
];

export const INITIAL_TIMELINE: TimelineEvent[] = [
  {
    id: 'tl-1',
    assetId: 'asset-1',
    timestamp: '2025-11-20T11:00:00Z',
    type: 'alta',
    title: 'Ingreso al Almacén General TI',
    description: 'Equipo adquirido a Compusoluciones SA de CV. Factura FA-2025-89104. Se generó Asset Tag EQ-LAP-001 y se enroló en inventario.',
    author: 'Ing. Carlos Mendoza'
  },
  {
    id: 'tl-2',
    assetId: 'asset-1',
    timestamp: '2026-01-15T10:30:00Z',
    type: 'asignacion',
    title: 'Asignación a Colaborador',
    description: 'Asignado a Alejandro Juárez (Arquitecto de Soluciones TI). Carta responsiva digital RESP-2026-0042 firmada.',
    author: 'Ing. Carlos Mendoza'
  },
  {
    id: 'tl-3',
    assetId: 'asset-1',
    timestamp: '2026-04-10T14:20:00Z',
    type: 'mantenimiento',
    title: 'Mantenimiento Preventivo Semestral',
    description: 'Limpieza profunda de disipador, renovación de pasta térmica Arctic MX-6 y diagnóstico de salud de hardware al 99%.',
    author: 'Ing. Roberto Silva'
  },
  {
    id: 'tl-4',
    assetId: 'asset-2',
    timestamp: '2025-10-10T09:00:00Z',
    type: 'alta',
    title: 'Ingreso al Inventario',
    description: 'MacBook Pro 16" M3 Pro recibida de Apple Store México. Alta inicial en bodega central.',
    author: 'Ing. Carlos Mendoza'
  },
  {
    id: 'tl-5',
    assetId: 'asset-2',
    timestamp: '2025-12-05T15:45:00Z',
    type: 'asignacion',
    title: 'Entrega y Firma de Responsiva',
    description: 'Entregado a Sofía Villarreal Castillo en Planta Monterrey. Responsiva RESP-2025-0189 generada con firma de ambas partes.',
    author: 'Lic. Laura Elizondo'
  },
  {
    id: 'tl-6',
    assetId: 'asset-11',
    timestamp: '2026-10-14T16:00:00Z',
    type: 'traslado',
    title: 'Despacho de Traslado entre Sucursales',
    description: 'Equipo embalado con plástico de burbuja y despachado por Estafeta Express hacia Sucursal Frontera Tijuana con guía EST-884920199-MX.',
    author: 'Almacén Central TI'
  }
];

export const INITIAL_EMAIL_LOGS: EmailNotification[] = [
  {
    id: 'em-1',
    toEmail: 'aajuarez@petroil.com.mx',
    toName: 'Alejandro Juárez',
    assetTag: 'EQ-LAP-001',
    assetName: 'ThinkPad T14 Gen 4 Core i7',
    subject: '[Soporte TI] Aviso de Mantenimiento Preventivo Periódico - Equipo EQ-LAP-001',
    type: 'mantenimiento_preventivo',
    scheduledDate: '2026-10-20',
    sentAt: '2026-10-14T09:15:00Z',
    status: 'enviado',
    contentSnippet: 'Estimado Alejandro: Le recordamos que su equipo de cómputo ThinkPad T14 tiene programado su mantenimiento periódico semestral...'
  },
  {
    id: 'em-2',
    toEmail: 'svillarreal@petroil.com.mx',
    toName: 'Sofía Villarreal Castillo',
    assetTag: 'EQ-LAP-002',
    assetName: 'MacBook Pro 16" M3 Pro',
    subject: '[Alerta TI] Vencimiento de Garantía de Fábrica - Equipo EQ-LAP-002',
    type: 'garantia_por_vencer',
    sentAt: '2026-10-10T11:30:00Z',
    status: 'enviado',
    contentSnippet: 'Notificación de TI: La póliza de garantía del equipo MacBook Pro 16 vencerá el 25 de Octubre de 2026. Se programará revisión previa con proveedor...'
  }
];

export const SYSTEM_USERS: AppUser[] = [
  {
    id: 'user-pacomputo',
    name: 'PA Cómputo TI',
    email: 'pacomputo@petroil.com.mx',
    password: 'admin123',
    role: 'edicion_total',
    roleTitle: 'Administrador de Cómputo y TI (Edición Total)',
    branchName: 'Corporativo Torre Central (CDMX)',
    canEdit: true,
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80'
  },
  {
    id: 'user-aajuarez',
    name: 'Ing. Alejandro Juárez',
    email: 'aajuarez@petroil.com.mx',
    password: 'admin123',
    role: 'edicion_total',
    roleTitle: 'Administrador General (Edición Total)',
    branchName: 'Corporativo Torre Central (CDMX)',
    canEdit: true,
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80'
  },
  {
    id: 'user-admin-total',
    name: 'Ing. Alejandro Juárez',
    email: 'admin@petroil.com.mx',
    password: 'admin123',
    role: 'edicion_total',
    roleTitle: 'Administrador General (Edición Total)',
    branchName: 'Corporativo Torre Central (CDMX)',
    canEdit: true,
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80'
  },
  {
    id: 'user-admin-ti',
    name: 'Ing. Carlos Mendoza',
    email: 'admin.ti@petroil.com.mx',
    password: 'adminti123',
    role: 'admin_ti',
    roleTitle: 'Administrador de Infraestructura TI',
    branchName: 'Corporativo Torre Central (CDMX)',
    canEdit: true,
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=250&q=80'
  },
  {
    id: 'user-viewer',
    name: 'Lic. Mariana Morales',
    email: 'visor@petroil.com.mx',
    password: 'visor123',
    role: 'visor',
    roleTitle: 'Auditor Externo (Perfil Visor - Solo Lectura)',
    branchName: 'Corporativo Torre Central (CDMX)',
    canEdit: false,
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=250&q=80'
  },
  {
    id: 'user-tech',
    name: 'Ing. Roberto Silva',
    email: 'soporte@petroil.com.mx',
    password: 'soporte123',
    role: 'soporte_tecnico',
    roleTitle: 'Técnico de Soporte & Mantenimiento',
    branchName: 'Planta de Operaciones Monterrey',
    canEdit: true,
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80'
  },
  {
    id: 'user-warehouse',
    name: 'Mateo Cárdenas',
    email: 'almacen@petroil.com.mx',
    password: 'almacen123',
    role: 'almacenista',
    roleTitle: 'Encargado de Almacén & Traslados',
    branchName: 'Almacén Central CDMX',
    canEdit: true,
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80'
  }
];

export const INITIAL_LOANS: EquipmentLoan[] = [
  {
    id: 'loan-2026-001',
    folio: 'PREST-2026-001',
    assetId: 'asset-2', // ThinkPad T14s
    employeeId: 'emp-3', // Ing. Sofia Morales
    startDate: '2026-10-18T09:30:00Z',
    expectedReturnDate: '2026-10-25T18:00:00Z',
    purpose: 'viaje_trabajo',
    purposeDescription: 'Comisión técnica y auditoría en Planta de Almacenamiento Guaymas, Sonora.',
    accessoriesIncluded: ['Cargador 65W USB-C', 'Mochila Antirrobo', 'Adaptador HDMI a USB-C', 'Mouse inalámbrico'],
    status: 'activo',
    conditionOnCheckout: 'excelente',
    deliveryNotes: 'Equipo entregado con sistema actualizado y BitLocker activo. Batería al 100%.',
    technicianOutName: 'Ing. Carlos Mendoza',
    createdAt: '2026-10-18T09:30:00Z'
  },
  {
    id: 'loan-2026-002',
    folio: 'PREST-2026-002',
    assetId: 'asset-5', // iPad Pro M2
    employeeId: 'emp-2', // Lic. Alejandro Garza
    startDate: '2026-10-10T11:00:00Z',
    expectedReturnDate: '2026-10-16T18:00:00Z', // Overdue
    purpose: 'capacitacion',
    purposeDescription: 'Presentación ejecutiva a directivos de ventas en Sede Mazatlán.',
    accessoriesIncluded: ['Cargador 20W Apple', 'Funda Smart Folio con teclado', 'Apple Pencil 2da Gen'],
    status: 'vencido',
    conditionOnCheckout: 'excelente',
    deliveryNotes: 'Préstamo especial para congreso. Vence el 16 de Octubre.',
    technicianOutName: 'Ing. Roberto Silva',
    createdAt: '2026-10-10T11:00:00Z'
  },
  {
    id: 'loan-2026-003',
    folio: 'PREST-2026-003',
    assetId: 'asset-4', // Monitor Dell 27 4K
    employeeId: 'emp-5', // Lic. Daniel Rivas
    startDate: '2026-10-01T08:00:00Z',
    expectedReturnDate: '2026-10-08T18:00:00Z',
    actualReturnDate: '2026-10-07T16:30:00Z',
    purpose: 'evento_corporativo',
    purposeDescription: 'Stand de TI y demostración de sistemas en Expo Industrial Sinaloa.',
    accessoriesIncluded: ['Cable de poder', 'Cable DisplayPort a HDMI', 'Base ajustable'],
    status: 'devuelto',
    conditionOnCheckout: 'excelente',
    conditionOnReturn: 'excelente',
    deliveryNotes: 'Entregado en caja protectora con embalaje de hule burbuja.',
    returnNotes: 'Devuelto en perfectas condiciones estéticas y operativas.',
    technicianOutName: 'Mateo Cárdenas',
    technicianInName: 'Mateo Cárdenas',
    createdAt: '2026-10-01T08:00:00Z'
  }
];


