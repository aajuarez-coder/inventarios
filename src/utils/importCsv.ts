import { HardwareAsset, Employee, Branch, AssetCategory, AssetStatus, PhysicalCondition } from '../types/inventory';
import { downloadCsv } from './exportCsv';

/**
 * RFC 4180 compliant CSV parser.
 * Supports quotes, commas inside quotes, escaped quotes (""), and multiline values.
 */
export function parseCsv(csvText: string): string[][] {
  // Strip UTF-8 BOM if present
  let cleanText = csvText;
  if (cleanText.charCodeAt(0) === 0xFEFF) {
    cleanText = cleanText.slice(1);
  }

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let insideQuotes = false;

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (insideQuotes) {
      if (char === '"' && nextChar === '"') {
        currentField += '"';
        i++; // skip escaped quote
      } else if (char === '"') {
        insideQuotes = false;
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        insideQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if (char === '\r') {
        if (nextChar === '\n') i++; // Handle CRLF
        currentRow.push(currentField.trim());
        currentField = '';
        if (currentRow.some((c) => c.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
      } else if (char === '\n') {
        currentRow.push(currentField.trim());
        currentField = '';
        if (currentRow.some((c) => c.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
      } else {
        currentField += char;
      }
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((c) => c.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Normalizes string keys by stripping accents, symbols, and lowercase.
 */
function normalizeHeader(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Parses Hardware Assets from CSV text.
 */
export function parseHardwareAssetsFromCsv(
  csvText: string,
  branches: Branch[],
  existingAssets: HardwareAsset[]
): {
  valid: Omit<HardwareAsset, 'id'>[];
  errors: { row: number; error: string; raw: Record<string, string> }[];
  duplicates: string[];
} {
  const rows = parseCsv(csvText);
  if (rows.length < 2) {
    return {
      valid: [],
      errors: [{ row: 1, error: 'El archivo CSV está vacío o solo contiene la cabecera.', raw: {} }],
      duplicates: []
    };
  }

  const rawHeaders = rows[0];
  const normalizedHeaders = rawHeaders.map(normalizeHeader);

  // Map header indices
  const getIndex = (...aliases: string[]): number => {
    for (const alias of aliases) {
      const cleanAlias = normalizeHeader(alias);
      const idx = normalizedHeaders.findIndex((h) => h === cleanAlias || h.includes(cleanAlias));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const tagIdx = getIndex('placa', 'tag', 'assettag', 'etiqueta', 'codigo');
  const serialIdx = getIndex('serie', 'serial', 'serialnumber', 'sn', 'numerodeserie');
  const nameIdx = getIndex('nombre', 'nombredelequipo', 'name', 'equipo');
  const catIdx = getIndex('categoria', 'category', 'tipo');
  const brandIdx = getIndex('marca', 'brand', 'fabricante');
  const modelIdx = getIndex('modelo', 'model');
  const cpuIdx = getIndex('cpu', 'procesador');
  const ramIdx = getIndex('ram', 'memoria');
  const storageIdx = getIndex('disco', 'almacenamiento', 'storage', 'ssd', 'hdd');
  const osIdx = getIndex('sistemaoperativo', 'os', 'sistema');
  const macIdx = getIndex('mac', 'macaddress', 'direccionmac');
  const statusIdx = getIndex('estatus', 'status', 'estado');
  const condIdx = getIndex('condicion', 'condicionfisica', 'estadofisico');
  const branchIdx = getIndex('almacen', 'sucursal', 'sede', 'branch');
  const locationIdx = getIndex('ubicacion', 'ubicaciondetallada', 'ubicacionfisica');
  const purchaseDateIdx = getIndex('fechadecompra', 'fechacompra', 'compra');
  const costIdx = getIndex('costo', 'costodecompra', 'precio', 'valormxn');
  const supplierIdx = getIndex('proveedor', 'supplier');
  const invoiceIdx = getIndex('factura', 'numerodefactura', 'numfactura', 'invoice');
  const warrantyIdx = getIndex('garantia', 'findegarantia', 'fechagarantia');
  const maintenanceIdx = getIndex('mantenimiento', 'proximomantenimiento');
  const accessoriesIdx = getIndex('accesorios', 'accesoriosincluidos');
  const notesIdx = getIndex('observaciones', 'notas', 'comentarios');

  const valid: Omit<HardwareAsset, 'id'>[] = [];
  const errors: { row: number; error: string; raw: Record<string, string> }[] = [];
  const duplicates: string[] = [];

  const existingTags = new Set(existingAssets.map((a) => a.assetTag.toUpperCase().trim()));
  const existingSerials = new Set(existingAssets.map((a) => a.serialNumber.toUpperCase().trim()));
  const batchTags = new Set<string>();
  const batchSerials = new Set<string>();

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length === 0 || row.every((c) => !c)) continue; // skip blank rows

    const getVal = (idx: number, fallback = ''): string => (idx !== -1 && row[idx] ? row[idx].trim() : fallback);

    const rawTag = getVal(tagIdx);
    const rawSerial = getVal(serialIdx);
    const rawBrand = getVal(brandIdx);
    const rawModel = getVal(modelIdx);
    const rawName = getVal(nameIdx);

    const rowObj: Record<string, string> = {
      tag: rawTag,
      serial: rawSerial,
      brand: rawBrand,
      model: rawModel,
      name: rawName
    };

    if (!rawBrand && !rawModel && !rawTag && !rawSerial) {
      continue; // completely empty line
    }

    const brand = rawBrand || 'Generico';
    const model = rawModel || 'Estándar';
    const name = rawName || `${brand} ${model}`;

    // Auto-generate tag if missing
    let assetTag = rawTag;
    if (!assetTag) {
      const year = new Date().getFullYear();
      const num = existingAssets.length + valid.length + 1;
      assetTag = `EQ-${year}-${num.toString().padStart(3, '0')}`;
    }

    // Auto-generate serial if missing
    let serialNumber = rawSerial;
    if (!serialNumber) {
      serialNumber = `SN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    }

    // Check duplicate
    const tagUpper = assetTag.toUpperCase().trim();
    const serialUpper = serialNumber.toUpperCase().trim();

    if (existingTags.has(tagUpper) || batchTags.has(tagUpper)) {
      duplicates.push(assetTag);
      errors.push({
        row: i + 1,
        error: `La placa o etiqueta "${assetTag}" ya existe en el sistema o está duplicada en el archivo.`,
        raw: rowObj
      });
      continue;
    }

    if (existingSerials.has(serialUpper) || batchSerials.has(serialUpper)) {
      duplicates.push(serialNumber);
      errors.push({
        row: i + 1,
        error: `El número de serie "${serialNumber}" ya existe en el sistema o está duplicado en el archivo.`,
        raw: rowObj
      });
      continue;
    }

    batchTags.add(tagUpper);
    batchSerials.add(serialUpper);

    // Map Category
    const rawCat = getVal(catIdx).toLowerCase();
    let category: AssetCategory = 'laptop';
    if (rawCat.includes('desk') || rawCat.includes('escritorio') || rawCat.includes('pc')) category = 'desktop';
    else if (rawCat.includes('servidor') || rawCat.includes('server')) category = 'servidor';
    else if (rawCat.includes('monitor') || rawCat.includes('pantalla')) category = 'monitor';
    else if (rawCat.includes('impresora') || rawCat.includes('print')) category = 'impresora';
    else if (rawCat.includes('red') || rawCat.includes('switch') || rawCat.includes('router')) category = 'redes';
    else if (rawCat.includes('tablet') || rawCat.includes('ipad')) category = 'tablet';
    else if (rawCat.includes('periferico') || rawCat.includes('accesorio') || rawCat.includes('mouse') || rawCat.includes('teclado')) category = 'periferico';

    // Map Status
    const rawStatus = getVal(statusIdx).toLowerCase();
    let status: AssetStatus = 'disponible';
    if (rawStatus.includes('asig') || rawStatus.includes('custodia')) status = 'asignado';
    else if (rawStatus.includes('mant') || rawStatus.includes('taller')) status = 'mantenimiento';
    else if (rawStatus.includes('baja') || rawStatus.includes('obsoleto')) status = 'baja';
    else if (rawStatus.includes('tras') || rawStatus.includes('trans')) status = 'traslado';

    // Map Condition
    const rawCond = getVal(condIdx).toLowerCase();
    let physicalCondition: PhysicalCondition = 'bueno';
    if (rawCond.includes('excel')) physicalCondition = 'excelente';
    else if (rawCond.includes('reg')) physicalCondition = 'regular';
    else if (rawCond.includes('dañ') || rawCond.includes('dan') || rawCond.includes('mal')) physicalCondition = 'dañado';

    // Map Branch
    const rawBranch = getVal(branchIdx).toLowerCase();
    let targetBranch = branches[0];
    if (rawBranch) {
      const found = branches.find(
        (b) =>
          b.name.toLowerCase().includes(rawBranch) ||
          b.city.toLowerCase().includes(rawBranch) ||
          b.code.toLowerCase().includes(rawBranch)
      );
      if (found) targetBranch = found;
    }

    // Cost
    const rawCost = getVal(costIdx).replace(/[^0-9.]/g, '');
    const purchaseCost = rawCost ? parseFloat(rawCost) : 18500;

    // Accessories
    const rawAcc = getVal(accessoriesIdx);
    const accessoriesIncluded = rawAcc
      ? rawAcc.split(/[;,]/).map((a) => a.trim()).filter(Boolean)
      : ['Cargador original'];

    valid.push({
      assetTag,
      serialNumber,
      name,
      category,
      brand,
      model,
      specs: {
        cpu: getVal(cpuIdx, 'Intel Core i5 / Ryzen 5'),
        ram: getVal(ramIdx, '16 GB DDR4/DDR5'),
        storage: getVal(storageIdx, '512 GB SSD NVMe'),
        os: getVal(osIdx, 'Windows 11 Pro'),
        macAddress: getVal(macIdx, '')
      },
      status,
      physicalCondition,
      branchId: targetBranch?.id || 'branch-1',
      locationDetails: getVal(locationIdx, 'Almacén Central TI'),
      purchaseDate: getVal(purchaseDateIdx, new Date().toISOString().split('T')[0]),
      purchaseCost,
      currency: 'MXN',
      supplier: getVal(supplierIdx, 'Compusoluciones S.A. de C.V.'),
      invoiceNumber: getVal(invoiceIdx, `FA-IMP-${Math.floor(10000 + Math.random() * 90000)}`),
      warrantyEndDate: getVal(warrantyIdx, '2028-12-31'),
      nextMaintenanceDate: getVal(maintenanceIdx, '2026-12-31'),
      maintenanceIntervalMonths: 6,
      accessoriesIncluded,
      notes: getVal(notesIdx, 'Activo ingresado mediante importación masiva CSV.')
    });
  }

  return { valid, errors, duplicates };
}

/**
 * Parses Employee Directory from CSV text.
 */
export function parseEmployeesFromCsv(
  csvText: string,
  branches: Branch[],
  existingEmployees: Employee[]
): {
  valid: Omit<Employee, 'id'>[];
  errors: { row: number; error: string; raw: Record<string, string> }[];
  duplicates: string[];
} {
  const rows = parseCsv(csvText);
  if (rows.length < 2) {
    return {
      valid: [],
      errors: [{ row: 1, error: 'El archivo CSV está vacío o solo contiene la cabecera.', raw: {} }],
      duplicates: []
    };
  }

  const rawHeaders = rows[0];
  const normalizedHeaders = rawHeaders.map(normalizeHeader);

  const getIndex = (...aliases: string[]): number => {
    for (const alias of aliases) {
      const cleanAlias = normalizeHeader(alias);
      const idx = normalizedHeaders.findIndex((h) => h === cleanAlias || h.includes(cleanAlias));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const numIdx = getIndex('noempleado', 'numeroempleado', 'numempleado', 'employeenumber', 'clave', 'idempleado');
  const nameIdx = getIndex('nombre', 'nombrecompleto', 'colaborador', 'fullname');
  const emailIdx = getIndex('correo', 'email', 'correoinstitucional', 'correoelectronico');
  const phoneIdx = getIndex('telefono', 'phone', 'celular', 'movil', 'extension');
  const deptIdx = getIndex('departamento', 'department', 'area', 'depto');
  const posIdx = getIndex('puesto', 'position', 'cargo', 'posicion');
  const branchIdx = getIndex('sucursal', 'sede', 'branch', 'almacen');
  const statusIdx = getIndex('estatus', 'status', 'estado', 'estatuslaboral');
  const hireDateIdx = getIndex('fechadeingreso', 'fechaingreso', 'hiredate', 'ingreso');

  const valid: Omit<Employee, 'id'>[] = [];
  const errors: { row: number; error: string; raw: Record<string, string> }[] = [];
  const duplicates: string[] = [];

  const existingNumbers = new Set(existingEmployees.map((e) => e.employeeNumber.toUpperCase().trim()));
  const existingEmails = new Set(existingEmployees.map((e) => e.email.toLowerCase().trim()));
  const batchNumbers = new Set<string>();
  const batchEmails = new Set<string>();

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length === 0 || row.every((c) => !c)) continue;

    const getVal = (idx: number, fallback = ''): string => (idx !== -1 && row[idx] ? row[idx].trim() : fallback);

    const rawNum = getVal(numIdx);
    const rawName = getVal(nameIdx);
    const rawEmail = getVal(emailIdx);

    const rowObj: Record<string, string> = {
      employeeNumber: rawNum,
      fullName: rawName,
      email: rawEmail
    };

    if (!rawName && !rawEmail && !rawNum) continue;

    if (!rawName) {
      errors.push({
        row: i + 1,
        error: 'El campo "Nombre Completo" es obligatorio.',
        raw: rowObj
      });
      continue;
    }

    // Auto-generate employee number if missing
    let employeeNumber = rawNum;
    if (!employeeNumber) {
      employeeNumber = `EMP-${1300 + existingEmployees.length + valid.length}`;
    }

    // Auto-generate email if missing
    let email = rawEmail;
    if (!email) {
      const cleanName = rawName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z]/g, '.');
      email = `${cleanName}@petroil.com.mx`;
    }

    const numUpper = employeeNumber.toUpperCase().trim();
    const emailLower = email.toLowerCase().trim();

    if (existingNumbers.has(numUpper) || batchNumbers.has(numUpper)) {
      duplicates.push(employeeNumber);
      errors.push({
        row: i + 1,
        error: `El número de empleado "${employeeNumber}" ya existe en el sistema o está repetido en el archivo.`,
        raw: rowObj
      });
      continue;
    }

    if (existingEmails.has(emailLower) || batchEmails.has(emailLower)) {
      duplicates.push(email);
      errors.push({
        row: i + 1,
        error: `El correo "${email}" ya está registrado en el directorio o repetido en el archivo.`,
        raw: rowObj
      });
      continue;
    }

    batchNumbers.add(numUpper);
    batchEmails.add(emailLower);

    // Branch matching
    const rawBranch = getVal(branchIdx).toLowerCase();
    let targetBranch = branches[0];
    if (rawBranch) {
      const found = branches.find(
        (b) =>
          b.name.toLowerCase().includes(rawBranch) ||
          b.city.toLowerCase().includes(rawBranch) ||
          b.code.toLowerCase().includes(rawBranch)
      );
      if (found) targetBranch = found;
    }

    // Status
    const rawStatus = getVal(statusIdx).toLowerCase();
    let status: 'activo' | 'licencia' | 'baja' = 'activo';
    if (rawStatus.includes('lic')) status = 'licencia';
    else if (rawStatus.includes('baja')) status = 'baja';

    valid.push({
      employeeNumber,
      fullName: rawName,
      email: emailLower,
      phone: getVal(phoneIdx, '+52 (669) 989-0000'),
      department: getVal(deptIdx, 'Operaciones'),
      position: getVal(posIdx, 'Especialista'),
      branchId: targetBranch?.id || 'branch-1',
      status,
      hireDate: getVal(hireDateIdx, '2026-01-15'),
      avatarUrl: `https://images.unsplash.com/photo-${1534528741775 + (existingEmployees.length + valid.length) * 50}?auto=format&fit=crop&w=250&q=80`
    });
  }

  return { valid, errors, duplicates };
}

/**
 * Downloads a sample template CSV for Hardware Assets.
 */
export function downloadHardwareCsvTemplate(): void {
  const headers = [
    'Placa',
    'Numero de Serie',
    'Marca',
    'Modelo',
    'Categoria',
    'Procesador',
    'Memoria RAM',
    'Almacenamiento',
    'Sistema Operativo',
    'Condicion Fisica',
    'Almacen / Sede',
    'Costo Compra',
    'Proveedor',
    'Factura',
    'Observaciones'
  ];

  const sampleRows = [
    [
      'EQ-2026-901',
      '5CD84210XP',
      'Dell',
      'Latitude 5440',
      'laptop',
      'Intel Core i7-1365U',
      '32 GB DDR5',
      '1 TB NVMe SSD',
      'Windows 11 Pro',
      'excelente',
      'Almacén Central Mazatlán',
      '26500',
      'Dell México S.A.',
      'FA-2026-9901',
      'Equipo nuevo para gerencia'
    ],
    [
      'EQ-2026-902',
      'PF399A11',
      'Lenovo',
      'ThinkPad T14 Gen 4',
      'laptop',
      'AMD Ryzen 7 Pro',
      '16 GB DDR5',
      '512 GB SSD',
      'Windows 11 Pro',
      'bueno',
      'Sucursal Culiacán',
      '23800',
      'Compusoluciones',
      'FA-2026-9902',
      'Entrega estándar con cargador'
    ],
    [
      'EQ-2026-903',
      'MXL94321A',
      'HP',
      'ProDesk 400 G9',
      'desktop',
      'Intel Core i5-13500',
      '16 GB DDR4',
      '512 GB SSD',
      'Windows 11 Pro',
      'excelente',
      'Terminal Marítima',
      '17900',
      'HP Comercial',
      'FA-2026-9903',
      'Gabinete para caseta operativa'
    ]
  ];

  downloadCsv('plantilla_ejemplo_inventario_hardware.csv', headers, sampleRows);
}

/**
 * Downloads a sample template CSV for Employees Directory.
 */
export function downloadEmployeesCsvTemplate(): void {
  const headers = [
    'No. de Empleado',
    'Nombre Completo',
    'Correo Institucional',
    'Telefono',
    'Departamento',
    'Puesto',
    'Sucursal / Sede',
    'Estatus',
    'Fecha de Ingreso'
  ];

  const sampleRows = [
    [
      'EMP-1290',
      'Carlos Eduardo Morales Ríos',
      'cmorales@petroil.com.mx',
      '+52 (669) 912-3456',
      'Tecnologías de Información',
      'Ingeniero de Soporte TI',
      'Almacén Central Mazatlán',
      'activo',
      '2026-02-01'
    ],
    [
      'EMP-1291',
      'Mariana Lizárraga Osuna',
      'mlizarraga@petroil.com.mx',
      '+52 (667) 745-8901',
      'Finanzas y Tesorería',
      'Analista Contable Senior',
      'Sucursal Culiacán',
      'activo',
      '2025-11-15'
    ],
    [
      'EMP-1292',
      'Roberto Valdez Sánchez',
      'rvaldez@petroil.com.mx',
      '+52 (662) 234-5678',
      'Operaciones y Logística',
      'Supervisor de Planta',
      'Terminal Marítima',
      'activo',
      '2024-06-10'
    ]
  ];

  downloadCsv('plantilla_ejemplo_colaboradores.csv', headers, sampleRows);
}
