import { HardwareAsset, Employee, Branch } from '../types/inventory';

/**
 * Encapsulates RFC 4180 CSV generation with UTF-8 BOM (\uFEFF)
 * so that software like Microsoft Excel opens accented Spanish letters properly.
 */
export function downloadCsv(
  filename: string,
  headers: string[],
  rows: (string | number | undefined | null)[][]
): void {
  const escapeCell = (val: string | number | undefined | null): string => {
    if (val === undefined || val === null) return '""';
    const str = String(val);
    const escaped = str.replace(/"/g, '""');
    return `"${escaped}"`;
  };

  const headerRow = headers.map(escapeCell).join(',');
  const dataRows = rows.map((row) => row.map(escapeCell).join(',')).join('\r\n');
  const csvContent = '\uFEFF' + headerRow + '\r\n' + dataRows;

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports hardware inventory data with full technical specifications,
 * custody status, warehouse locations, and financial data.
 */
export function exportHardwareInventoryCsv(
  assets: HardwareAsset[],
  branches: Branch[],
  employees: Employee[],
  customFilename?: string
): { success: boolean; count: number } {
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = customFilename || `inventario_hardware_petroil_${dateStr}.csv`;

  const headers = [
    'Placa / Tag',
    'Número de Serie (S/N)',
    'Nombre del Equipo',
    'Categoría',
    'Marca',
    'Modelo',
    'Estatus del Activo',
    'Condición Física',
    'Procesador (CPU)',
    'Memoria RAM',
    'Almacenamiento (Disco)',
    'Sistema Operativo (OS)',
    'Dirección MAC',
    'Almacén / Sucursal',
    'Ciudad Sucursal',
    'Ubicación Detallada',
    'Colaborador Asignado',
    'No. Empleado Asignado',
    'Correo Colaborador',
    'Departamento Colaborador',
    'Puesto Colaborador',
    'Fecha de Asignación',
    'Fecha de Compra',
    'Costo de Compra (MXN)',
    'Proveedor',
    'Número de Factura',
    'Fin de Garantía',
    'Último Mantenimiento',
    'Próximo Mantenimiento',
    'Intervalo Mantenimiento (Meses)',
    'Accesorios Incluidos',
    'Observaciones Técnicas'
  ];

  const rows = assets.map((asset) => {
    const branch = branches.find((b) => b.id === asset.branchId);
    const employee = employees.find((e) => e.id === asset.assignedToEmployeeId);

    const statusMap: Record<string, string> = {
      disponible: 'Disponible en Almacén',
      asignado: 'Asignado (En Custodia)',
      mantenimiento: 'En Mantenimiento',
      baja: 'Baja Definitiva',
      traslado: 'En Traslado'
    };

    const conditionMap: Record<string, string> = {
      excelente: 'Excelente',
      bueno: 'Bueno',
      regular: 'Regular',
      dañado: 'Dañado / En Revisión'
    };

    return [
      asset.assetTag,
      asset.serialNumber,
      asset.name,
      asset.category.toUpperCase(),
      asset.brand,
      asset.model,
      statusMap[asset.status] || asset.status,
      conditionMap[asset.physicalCondition] || asset.physicalCondition,
      asset.specs.cpu || '',
      asset.specs.ram || '',
      asset.specs.storage || '',
      asset.specs.os || '',
      asset.specs.macAddress || '',
      branch?.name || 'Sede General',
      branch?.city || '',
      asset.locationDetails || '',
      employee ? employee.fullName : 'Sin Asignar (Stock Almacén)',
      employee ? employee.employeeNumber : '',
      employee ? employee.email : '',
      employee ? employee.department : '',
      employee ? employee.position : '',
      asset.assignedDate || '',
      asset.purchaseDate || '',
      asset.purchaseCost !== undefined ? Number(asset.purchaseCost).toFixed(2) : '',
      asset.supplier || '',
      asset.invoiceNumber || '',
      asset.warrantyEndDate || '',
      asset.lastMaintenanceDate || '',
      asset.nextMaintenanceDate || '',
      asset.maintenanceIntervalMonths || '',
      (asset.accessoriesIncluded || []).join('; '),
      asset.notes || ''
    ];
  });

  downloadCsv(filename, headers, rows);
  return { success: true, count: rows.length };
}

/**
 * Exports employee directory data including employment status, contact info,
 * and list of currently assigned hardware assets in custody.
 */
export function exportEmployeesCsv(
  employees: Employee[],
  assets: HardwareAsset[],
  branches: Branch[],
  customFilename?: string
): { success: boolean; count: number } {
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = customFilename || `directorio_colaboradores_petroil_${dateStr}.csv`;

  const headers = [
    'No. de Empleado',
    'Nombre Completo',
    'Correo Institucional',
    'Teléfono / Celular',
    'Departamento',
    'Puesto / Cargo',
    'Sucursal / Sede',
    'Ciudad',
    'Estado',
    'Estatus Laboral',
    'Fecha de Ingreso',
    'Total Equipos en Custodia',
    'Placas de Equipos Asignados',
    'Modelos de Equipos Asignados',
    'Series de Equipos Asignados'
  ];

  const rows = employees.map((emp) => {
    const branch = branches.find((b) => b.id === emp.branchId);
    const assigned = assets.filter((a) => a.assignedToEmployeeId === emp.id && a.status === 'asignado');

    const statusMap: Record<string, string> = {
      activo: 'Activo',
      licencia: 'En Licencia',
      baja: 'Baja Administrativa'
    };

    const tags = assigned.map((a) => a.assetTag).join(', ');
    const models = assigned.map((a) => `${a.brand} ${a.model}`).join('; ');
    const serials = assigned.map((a) => a.serialNumber).join(', ');

    return [
      emp.employeeNumber,
      emp.fullName,
      emp.email,
      emp.phone || '',
      emp.department,
      emp.position,
      branch?.name || '',
      branch?.city || '',
      branch?.state || '',
      statusMap[emp.status] || emp.status,
      emp.hireDate || '',
      assigned.length,
      tags || 'Ninguno',
      models || 'Ninguno',
      serials || 'Ninguno'
    ];
  });

  downloadCsv(filename, headers, rows);
  return { success: true, count: rows.length };
}
