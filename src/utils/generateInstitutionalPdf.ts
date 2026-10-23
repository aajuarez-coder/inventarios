import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  HardwareAsset, 
  Employee, 
  Branch, 
  MaintenanceRecord 
} from '../types/inventory';
import { 
  formatCurrency, 
  formatDate, 
  getStatusBadge, 
  getWarrantyStatus 
} from './formatters';
import { executePrintDialog } from './printHelper';

export interface InstitutionalReportOptions {
  title?: string;
  generatedBy?: string;
  branchFilterName?: string;
  openPrintDialog?: boolean;
}

/**
 * Draws the official Grupo Petroil institutional vector logo badge
 */
export const drawPetroilLogo = (doc: jsPDF, x: number, y: number, isDarkHeader: boolean = true): void => {
  // Red flame / fuel droplet emblem box
  doc.setFillColor(225, 29, 72); // #e11d48 Petroil Crimson Red
  doc.roundedRect(x, y, 15, 15, 3.5, 3.5, 'F');

  // Inner stylized flame geometry
  doc.setFillColor(255, 255, 255);
  doc.triangle(x + 7.5, y + 3, x + 3.8, y + 11.5, x + 11.2, y + 11.5, 'F');
  
  // Energy core spark
  doc.setFillColor(245, 158, 11); // Amber / Gold
  doc.circle(x + 7.5, y + 8.8, 1.8, 'F');

  // Typography
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(isDarkHeader ? 255 : 15, isDarkHeader ? 255 : 23, isDarkHeader ? 255 : 42);
  doc.text('GRUPO PETROIL', x + 18, y + 5.8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(isDarkHeader ? 226 : 67, isDarkHeader ? 232 : 56, isDarkHeader ? 240 : 202); // indigo or light
  doc.text('DIRECCIÓN DE TECNOLOGÍAS DE INFORMACIÓN & INFRAESTRUCTURA', x + 18, y + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(isDarkHeader ? 148 : 100, isDarkHeader ? 163 : 116, isDarkHeader ? 184 : 139);
  doc.text('SISTEMA INTEGRAL DE CONTROL DE ACTIVOS TI • MATRIZ MAZATLÁN / NACIONAL', x + 18, y + 13.8);
};

/**
 * Generates official institutional Inventory PDF report with Petroil logo
 */
export const generateInstitutionalInventoryPdf = (
  assets: HardwareAsset[],
  employees: Employee[],
  branches: Branch[],
  options: InstitutionalReportOptions = {}
): jsPDF => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 297 mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 210 mm
  const todayStr = new Date().toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  const author = options.generatedBy || 'Administrador de Infraestructura TI';
  const branchName = options.branchFilterName || 'Consolidado Corporativo (Todas las Sedes)';
  const docHash = `PETROIL-INV-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

  // Colors
  const darkNavy = [15, 23, 42]; // #0f172a
  const grayText = [71, 85, 105]; // #475569
  const lightBg = [248, 250, 252]; // #f8fafc
  const borderColor = [226, 232, 240]; // #e2e8f0

  // Metrics
  const totalAssets = assets.length;
  const inStock = assets.filter(a => a.status === 'disponible').length;
  const assigned = assets.filter(a => a.status === 'asignado').length;
  const inMaintenance = assets.filter(a => a.status === 'mantenimiento').length;
  const inTransfer = assets.filter(a => a.status === 'traslado').length;
  const retired = assets.filter(a => a.status === 'baja').length;
  const totalValuation = assets.reduce((sum, a) => sum + (a.purchaseCost || 0), 0);
  const utilization = totalAssets > 0 ? Math.round((assigned / (totalAssets - retired || 1)) * 100) : 0;

  // 1. HEADER BANNER
  doc.setFillColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Decorative Accent bar (Petroil Red)
  doc.setFillColor(225, 29, 72);
  doc.rect(0, 27.2, pageWidth, 0.8, 'F');

  // Draw Petroil Institutional Logo
  drawPetroilLogo(doc, 14, 6, true);

  // Right Header Info Box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text('REPORTE INSTITUCIONAL DE INVENTARIO Y HARDWARE', pageWidth - 14, 11, { align: 'right' });

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(226, 232, 240);
  doc.text(`SEDE / ALCANCE: ${branchName.toUpperCase()}`, pageWidth - 14, 16.5, { align: 'right' });
  doc.text(`EMISIÓN: ${todayStr} • RESPONSABLE: ${author.toUpperCase()}`, pageWidth - 14, 21, { align: 'right' });

  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(`FOLIO DE AUDITORÍA: ${docHash}`, pageWidth - 14, 25, { align: 'right' });

  // 2. EXECUTIVE KPI SUMMARY CARDS
  const cardY = 32;
  const cardWidth = (pageWidth - 28 - 25) / 6;
  const cardHeight = 15;

  const kpis = [
    { title: 'TOTAL ACTIVOS', val: String(totalAssets), sub: 'Equipos inventariados', color: darkNavy },
    { title: 'ASIGNADOS', val: String(assigned), sub: `${utilization}% utilización activa`, color: [37, 99, 235] },
    { title: 'EN ALMACÉN', val: String(inStock), sub: 'Disponibles para entrega', color: [16, 149, 106] },
    { title: 'EN MANTENIMIENTO', val: String(inMaintenance), sub: 'En soporte / taller', color: [217, 119, 6] },
    { title: 'EN TRASLADO', val: String(inTransfer), sub: 'En ruta interestatal', color: [147, 51, 234] },
    { title: 'INVERSIÓN TOTAL', val: formatCurrency(totalValuation), sub: 'Costo histórico', color: darkNavy }
  ];

  kpis.forEach((kpi, idx) => {
    const x = 14 + idx * (cardWidth + 5);
    doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
    doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, cardY, cardWidth, cardHeight, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.2);
    doc.setTextColor(grayText[0], grayText[1], grayText[2]);
    doc.text(kpi.title, x + 3, cardY + 4);

    doc.setFontSize(9.5);
    doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.text(kpi.val, x + 3, cardY + 9.5);

    doc.setFontSize(5.8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(kpi.sub, x + 3, cardY + 13.2);
  });

  // 3. TABLE DATA PREPARATION
  const tableRows = assets.map((asset, index) => {
    const emp = employees.find(e => e.id === asset.assignedToEmployeeId);
    const br = branches.find(b => b.id === asset.branchId);
    const status = getStatusBadge(asset.status);
    const warranty = getWarrantyStatus(asset.warrantyEndDate);

    const specsText = [
      asset.specs.cpu ? `CPU: ${asset.specs.cpu}` : null,
      asset.specs.ram ? `RAM: ${asset.specs.ram}` : null,
      asset.specs.storage ? `DISCO: ${asset.specs.storage}` : null
    ].filter(Boolean).join(' | ');

    return [
      String(index + 1),
      asset.assetTag,
      asset.serialNumber,
      `${asset.brand} ${asset.model}`,
      asset.category.toUpperCase(),
      specsText || 'Especificaciones estándar',
      br?.city || br?.name || 'Sede Principal',
      status.label.toUpperCase(),
      emp ? `${emp.fullName} (${emp.department})` : 'EN ALMACÉN DE COMPUTO',
      formatCurrency(asset.purchaseCost),
      formatDate(asset.warrantyEndDate)
    ];
  });

  // 4. MULTI-PAGE AUTOTABLE
  autoTable(doc, {
    startY: 51,
    head: [[
      '#',
      'Placa / Tag',
      'Serie (S/N)',
      'Marca y Modelo',
      'Categoría',
      'Ficha Técnica (CPU, RAM, Disco)',
      'Sucursal',
      'Estado',
      'Custodia / Colaborador',
      'Valor Compra',
      'Garantía'
    ]],
    body: tableRows,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 6.8,
      cellPadding: 2,
      textColor: [15, 23, 42],
      lineColor: [226, 232, 240],
      lineWidth: 0.15,
      valign: 'middle'
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7,
      halign: 'left'
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: {
      0: { cellWidth: 7, halign: 'center' },
      1: { cellWidth: 22, fontStyle: 'bold', textColor: [67, 56, 202] },
      2: { cellWidth: 23, fontStyle: 'normal' },
      3: { cellWidth: 35, fontStyle: 'bold' },
      4: { cellWidth: 17, halign: 'center' },
      5: { cellWidth: 58 },
      6: { cellWidth: 24 },
      7: { cellWidth: 22, halign: 'center', fontStyle: 'bold' },
      8: { cellWidth: 36 },
      9: { cellWidth: 22, halign: 'right', fontStyle: 'bold' },
      10: { cellWidth: 21, halign: 'center' }
    },
    foot: [[
      '',
      '',
      '',
      `TOTAL: ${assets.length} EQUIPOS AUDITADOS`,
      '',
      '',
      '',
      '',
      'VALORACIÓN TOTAL:',
      formatCurrency(totalValuation),
      ''
    ]],
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 7.2
    },
    didDrawPage: (data) => {
      // Header for pages 2+
      if (data.pageNumber > 1) {
        doc.setFillColor(darkNavy[0], darkNavy[1], darkNavy[2]);
        doc.rect(0, 0, pageWidth, 12, 'F');
        doc.setFillColor(225, 29, 72);
        doc.rect(0, 11.4, pageWidth, 0.6, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(255, 255, 255);
        doc.text('GRUPO PETROIL • REPORTE INSTITUCIONAL DE INVENTARIO TI', 14, 8);
        doc.setFont('helvetica', 'normal');
        doc.text(`Página ${data.pageNumber}`, pageWidth - 14, 8, { align: 'right' });
      }

      // Footer
      const totalPages = (doc as any).internal.getNumberOfPages();
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.2);
      doc.setTextColor(148, 163, 184);
      doc.text('CONFIDENCIAL • DOCUMENTO OFICIAL DE CONTROL PATRIMONIAL TI • GRUPO PETROIL', 14, pageHeight - 5);
      doc.text(`Página ${data.pageNumber} de ${totalPages} • Generado el ${todayStr}`, pageWidth - 14, pageHeight - 5, { align: 'right' });
    }
  });

  // 5. SIGN-OFF BLOCK ON LAST PAGE
  const lastTableY = (doc as any).lastAutoTable.finalY || 140;
  const remainingSpace = pageHeight - lastTableY;

  if (remainingSpace < 38) {
    doc.addPage();
  }

  const sigStartY = remainingSpace < 38 ? 30 : Math.max(lastTableY + 10, pageHeight - 38);
  const sigColWidth = 75;

  const signatures = [
    { title: 'ELABORÓ / RESPONSABLE TI', role: author, note: 'Administración de Inventarios TI' },
    { title: 'REVISÓ / COORDINACIÓN TÉCNICA', role: 'Ing. Carlos Mendoza', note: 'Jefe de Infraestructura TI' },
    { title: 'AUTORIZÓ / CONTRALORÍA PETROIL', role: 'Lic. Laura Elizondo', note: 'Auditoría Interna Corporativa' }
  ];

  signatures.forEach((sig, idx) => {
    const sigX = 18 + idx * (sigColWidth + 18);
    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.3);
    doc.line(sigX, sigStartY + 14, sigX + sigColWidth, sigStartY + 14);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);
    doc.text(sig.title, sigX + sigColWidth / 2, sigStartY + 18, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.2);
    doc.setTextColor(grayText[0], grayText[1], grayText[2]);
    doc.text(sig.role, sigX + sigColWidth / 2, sigStartY + 21.5, { align: 'center' });
    doc.setFontSize(5.5);
    doc.setTextColor(148, 163, 184);
    doc.text(sig.note, sigX + sigColWidth / 2, sigStartY + 24.5, { align: 'center' });
  });

  // Save / Download
  const filename = `Reporte_Institucional_Inventario_Petroil_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);

  if (options.openPrintDialog) {
    try {
      const blobUrl = doc.output('bloburl');
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.src = blobUrl.toString();
      document.body.appendChild(iframe);
      iframe.onload = () => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          iframe.remove();
          URL.revokeObjectURL(blobUrl.toString());
        }, 60000);
      };
    } catch {
      window.print();
    }
  }

  return doc;
};

/**
 * Generates official institutional Maintenance History PDF report with Petroil logo
 */
export const generateInstitutionalMaintenancePdf = (
  records: MaintenanceRecord[],
  assets: HardwareAsset[],
  branches: Branch[],
  options: InstitutionalReportOptions = {}
): jsPDF => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const todayStr = new Date().toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  const author = options.generatedBy || 'Jefe de Mantenimiento y Soporte TI';
  const branchName = options.branchFilterName || 'Consolidado Corporativo (Todas las Sedes)';
  const docHash = `PETROIL-MNT-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

  // Colors
  const darkNavy = [15, 23, 42];
  const grayText = [71, 85, 105];
  const lightBg = [248, 250, 252];
  const borderColor = [226, 232, 240];

  // Metrics
  const totalServices = records.length;
  const preventive = records.filter(r => r.type === 'preventivo').length;
  const corrective = records.filter(r => r.type === 'correctivo').length;
  const totalCost = records.reduce((sum, r) => sum + (r.cost || 0), 0);
  const completed = records.filter(r => r.status === 'completado').length;
  const scheduled = records.filter(r => r.status === 'programado').length;
  const avgScore = totalServices > 0 
    ? Math.round(records.reduce((sum, r) => sum + (r.diagnosticScore || 85), 0) / totalServices) 
    : 100;

  // 1. HEADER BANNER
  doc.setFillColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Decorative Accent bar (Petroil Red)
  doc.setFillColor(225, 29, 72);
  doc.rect(0, 27.2, pageWidth, 0.8, 'F');

  // Draw Petroil Institutional Logo
  drawPetroilLogo(doc, 14, 6, true);

  // Right Header Info Box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text('HISTORIAL INSTITUCIONAL DE MANTENIMIENTO TÉCNICO', pageWidth - 14, 11, { align: 'right' });

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(226, 232, 240);
  doc.text(`SEDE / ALCANCE: ${branchName.toUpperCase()}`, pageWidth - 14, 16.5, { align: 'right' });
  doc.text(`EMISIÓN: ${todayStr} • RESPONSABLE: ${author.toUpperCase()}`, pageWidth - 14, 21, { align: 'right' });

  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(`FOLIO DE AUDITORÍA: ${docHash}`, pageWidth - 14, 25, { align: 'right' });

  // 2. EXECUTIVE KPI SUMMARY CARDS
  const cardY = 32;
  const cardWidth = (pageWidth - 28 - 25) / 6;
  const cardHeight = 15;

  const kpis = [
    { title: 'TOTAL SERVICIOS', val: String(totalServices), sub: `${completed} completados`, color: darkNavy },
    { title: 'PREVENTIVOS', val: String(preventive), sub: 'Limpieza y salud', color: [16, 149, 106] },
    { title: 'CORRECTIVOS', val: String(corrective), sub: 'Reparaciones mayores', color: [225, 29, 72] },
    { title: 'PROGRAMADOS', val: String(scheduled), sub: 'En agenda técnica', color: [37, 99, 235] },
    { title: 'ÍNDICE DE SALUD', val: `${avgScore}/100`, sub: 'Diagnóstico técnico', color: [16, 149, 106] },
    { title: 'INVERSIÓN TALLER', val: formatCurrency(totalCost), sub: 'Costos de servicio', color: darkNavy }
  ];

  kpis.forEach((kpi, idx) => {
    const x = 14 + idx * (cardWidth + 5);
    doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
    doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, cardY, cardWidth, cardHeight, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.2);
    doc.setTextColor(grayText[0], grayText[1], grayText[2]);
    doc.text(kpi.title, x + 3, cardY + 4);

    doc.setFontSize(9.5);
    doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.text(kpi.val, x + 3, cardY + 9.5);

    doc.setFontSize(5.8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(kpi.sub, x + 3, cardY + 13.2);
  });

  // 3. TABLE DATA PREPARATION
  const tableRows = records.map((rec, index) => {
    const asset = assets.find(a => a.id === rec.assetId);
    const branch = asset ? branches.find(b => b.id === asset.branchId) : undefined;
    const tasksFormatted = rec.tasksCompleted && rec.tasksCompleted.length > 0 
      ? rec.tasksCompleted.map(t => `• ${t}`).join('\n')
      : rec.description;

    const typeLabel = rec.type === 'preventivo' 
      ? 'PREVENTIVO' 
      : rec.type === 'correctivo' 
      ? 'CORRECTIVO' 
      : rec.type === 'limpieza_profunda'
      ? 'LIMPIEZA'
      : 'ACTUALIZACIÓN';

    return [
      String(index + 1),
      rec.id.toUpperCase(),
      asset ? `${asset.assetTag}\n(${asset.brand} ${asset.model})` : 'Equipo N/A',
      branch?.city || 'Sede Central',
      typeLabel,
      formatDate(rec.date),
      rec.technicianName,
      tasksFormatted,
      rec.diagnosticScore ? `${rec.diagnosticScore}/100` : 'N/A',
      formatCurrency(rec.cost),
      rec.status.toUpperCase(),
      formatDate(rec.nextScheduledDate)
    ];
  });

  // 4. AUTOTABLE FOR MAINTENANCE
  autoTable(doc, {
    startY: 51,
    head: [[
      '#',
      'ID Servicio',
      'Equipo / Placa Tag',
      'Sucursal',
      'Tipo Servicio',
      'Fecha',
      'Técnico Responsable',
      'Diagnóstico y Tareas Ejecutadas',
      'Salud',
      'Costo',
      'Estatus',
      'Próximo Servicio'
    ]],
    body: tableRows,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 6.8,
      cellPadding: 2,
      textColor: [15, 23, 42],
      lineColor: [226, 232, 240],
      lineWidth: 0.15,
      valign: 'middle'
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7,
      halign: 'left'
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: {
      0: { cellWidth: 7, halign: 'center' },
      1: { cellWidth: 18, fontStyle: 'bold', textColor: [67, 56, 202] },
      2: { cellWidth: 32, fontStyle: 'bold' },
      3: { cellWidth: 20 },
      4: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
      5: { cellWidth: 18, halign: 'center' },
      6: { cellWidth: 25 },
      7: { cellWidth: 65 },
      8: { cellWidth: 14, halign: 'center', fontStyle: 'bold' },
      9: { cellWidth: 18, halign: 'right', fontStyle: 'bold' },
      10: { cellWidth: 18, halign: 'center' },
      11: { cellWidth: 18, halign: 'center' }
    },
    foot: [[
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      `TOTAL: ${records.length} REGISTROS DE SERVICIO`,
      'COSTO TOTAL:',
      formatCurrency(totalCost),
      '',
      ''
    ]],
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 7.2
    },
    didDrawPage: (data) => {
      // Header for pages 2+
      if (data.pageNumber > 1) {
        doc.setFillColor(darkNavy[0], darkNavy[1], darkNavy[2]);
        doc.rect(0, 0, pageWidth, 12, 'F');
        doc.setFillColor(225, 29, 72);
        doc.rect(0, 11.4, pageWidth, 0.6, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(255, 255, 255);
        doc.text('GRUPO PETROIL • HISTORIAL INSTITUCIONAL DE MANTENIMIENTO TI', 14, 8);
        doc.setFont('helvetica', 'normal');
        doc.text(`Página ${data.pageNumber}`, pageWidth - 14, 8, { align: 'right' });
      }

      // Footer
      const totalPages = (doc as any).internal.getNumberOfPages();
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.2);
      doc.setTextColor(148, 163, 184);
      doc.text('CONFIDENCIAL • DOCUMENTO OFICIAL DE CONTROL PATRIMONIAL TI • GRUPO PETROIL', 14, pageHeight - 5);
      doc.text(`Página ${data.pageNumber} de ${totalPages} • Generado el ${todayStr}`, pageWidth - 14, pageHeight - 5, { align: 'right' });
    }
  });

  // 5. SIGN-OFF BLOCK ON LAST PAGE
  const lastTableY = (doc as any).lastAutoTable.finalY || 140;
  const remainingSpace = pageHeight - lastTableY;

  if (remainingSpace < 38) {
    doc.addPage();
  }

  const sigStartY = remainingSpace < 38 ? 30 : Math.max(lastTableY + 10, pageHeight - 38);
  const sigColWidth = 75;

  const signatures = [
    { title: 'TÉCNICO EJECUTOR', role: author, note: 'Certificación de Servicio y Diagnóstico' },
    { title: 'COORDINADOR DE SOPORTE TI', role: 'Ing. Rodrigo Solís', note: 'Revisión de Calidad Técnica' },
    { title: 'DIRECCIÓN DE OPERACIONES', role: 'Ing. Alejandro Juárez', note: 'Visto Bueno de Infraestructura' }
  ];

  signatures.forEach((sig, idx) => {
    const sigX = 18 + idx * (sigColWidth + 18);
    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.3);
    doc.line(sigX, sigStartY + 14, sigX + sigColWidth, sigStartY + 14);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);
    doc.text(sig.title, sigX + sigColWidth / 2, sigStartY + 18, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.2);
    doc.setTextColor(grayText[0], grayText[1], grayText[2]);
    doc.text(sig.role, sigX + sigColWidth / 2, sigStartY + 21.5, { align: 'center' });
    doc.setFontSize(5.5);
    doc.setTextColor(148, 163, 184);
    doc.text(sig.note, sigX + sigColWidth / 2, sigStartY + 24.5, { align: 'center' });
  });

  const filename = `Reporte_Institucional_Mantenimiento_Petroil_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);

  if (options.openPrintDialog) {
    try {
      const blobUrl = doc.output('bloburl');
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.src = blobUrl.toString();
      document.body.appendChild(iframe);
      iframe.onload = () => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          iframe.remove();
          URL.revokeObjectURL(blobUrl.toString());
        }, 60000);
      };
    } catch {
      window.print();
    }
  }

  return doc;
};
