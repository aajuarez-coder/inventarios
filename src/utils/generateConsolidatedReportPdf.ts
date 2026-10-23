import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { HardwareAsset, Employee, Branch, MaintenanceRecord, Assignment } from '../types/inventory';
import { formatCurrency, formatDate, getStatusBadge, getWarrantyStatus } from './formatters';

export interface ConsolidatedReportOptions {
  title?: string;
  generatedBy?: string;
  branchFilterName?: string;
  openPrintDialog?: boolean;
}

export const generateConsolidatedInventoryPDF = (
  assets: HardwareAsset[],
  employees: Employee[],
  branches: Branch[],
  options: ConsolidatedReportOptions = {}
): jsPDF => {
  // Create landscape A4 document
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 297 mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 210 mm
  const todayStr = '16 de Octubre, 2026';
  const author = options.generatedBy || 'Administrador de Activos TI';
  const branchName = options.branchFilterName || 'Consolidado Corporativo (Todas las Sedes)';
  const docHash = `ITAM-CONSOL-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

  // Colors
  const darkNavy = [15, 23, 42]; // #0f172a
  const indigo = [67, 56, 202]; // #4338ca
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

  // 1. PAGE 1 - HEADER BANNER
  doc.setFillColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Logo & Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('PETROIL CORP', 14, 13);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(199, 210, 254);
  doc.text('DIRECCIÓN DE TECNOLOGÍAS DE INFORMACIÓN • SISTEMA DE INVENTARIOS', 14, 19);
  doc.text(`ALCANCE: ${branchName.toUpperCase()} • FECHA: ${todayStr}`, 14, 24);

  // Right Header Box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text('REPORTE CONSOLIDADO DE INVENTARIO Y HARDWARE', pageWidth - 14, 13, { align: 'right' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(226, 232, 240);
  doc.text(`GENERADO POR: ${author.toUpperCase()}`, pageWidth - 14, 19, { align: 'right' });
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(`HASH DE AUDITORÍA: ${docHash}`, pageWidth - 14, 24, { align: 'right' });

  // 2. EXECUTIVE KPI CARDS RIBBON (Below Header)
  const cardY = 32;
  const cardWidth = (pageWidth - 28 - 25) / 6; // 6 cards with gaps
  const cardHeight = 16;

  const kpis = [
    { title: 'TOTAL EQUIPOS', val: String(totalAssets), sub: 'Activos registrados', color: darkNavy },
    { title: 'STOCK ALMACÉN', val: String(inStock), sub: 'Listos para entrega', color: [16, 149, 106] },
    { title: 'ASIGNADOS', val: String(assigned), sub: `${utilization}% utilización`, color: [37, 99, 235] },
    { title: 'EN MANTENIMIENTO', val: String(inMaintenance), sub: 'En taller técnico', color: [217, 119, 6] },
    { title: 'EN TRASLADO', val: String(inTransfer), sub: 'En ruta entre sedes', color: [147, 51, 234] },
    { title: 'VALORACIÓN TOTAL', val: formatCurrency(totalValuation), sub: 'Costo de adquisición', color: darkNavy }
  ];

  kpis.forEach((kpi, idx) => {
    const x = 14 + idx * (cardWidth + 5);
    doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
    doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, cardY, cardWidth, cardHeight, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(grayText[0], grayText[1], grayText[2]);
    doc.text(kpi.title, x + 3, cardY + 4.5);

    doc.setFontSize(10);
    doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.text(kpi.val, x + 3, cardY + 10);

    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(kpi.sub, x + 3, cardY + 14);
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
      emp ? `${emp.fullName} (${emp.department})` : 'EN ALMACÉN DE COMPUTO COSPORATIVO',
      formatCurrency(asset.purchaseCost),
      formatDate(asset.warrantyEndDate)
    ];
  });

  // 4. GENERATE MULTI-PAGE AUTOTABLE
  autoTable(doc, {
    startY: 52,
    head: [[
      '#',
      'Placa / Tag',
      'Serie (S/N)',
      'Marca y Modelo',
      'Categoría',
      'Ficha Técnica (CPU, RAM, Almacenamiento)',
      'Sucursal',
      'Estado',
      'Custodia Actual',
      'Valor Compra',
      'Garantía'
    ]],
    body: tableRows,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 7,
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
      fontSize: 7.2,
      halign: 'left'
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 22, fontStyle: 'bold', textColor: [67, 56, 202] }, // AssetTag
      2: { cellWidth: 24, fontStyle: 'normal' }, // Serial
      3: { cellWidth: 34, fontStyle: 'bold' }, // Model
      4: { cellWidth: 18, halign: 'center' }, // Category
      5: { cellWidth: 58 }, // Specs
      6: { cellWidth: 24 }, // Branch
      7: { cellWidth: 22, halign: 'center', fontStyle: 'bold' }, // Status
      8: { cellWidth: 35 }, // Colaborador
      9: { cellWidth: 22, halign: 'right', fontStyle: 'bold' }, // Cost
      10: { cellWidth: 20, halign: 'center' } // Warranty
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
      fontSize: 7.5
    },
    didDrawPage: (data) => {
      // Header for pages 2+
      if (data.pageNumber > 1) {
        doc.setFillColor(darkNavy[0], darkNavy[1], darkNavy[2]);
        doc.rect(0, 0, pageWidth, 12, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(255, 255, 255);
        doc.text('PETROIL CORP • REPORTE CONSOLIDADO DE INVENTARIO TI', 14, 8);
        doc.setFont('helvetica', 'normal');
        doc.text(`Página ${data.pageNumber}`, pageWidth - 14, 8, { align: 'right' });
      }

      // Page Footer
      const totalPages = (doc as any).internal.getNumberOfPages();
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);

      // Left Footer
      doc.text('CONFIDENCIAL • DOCUMENTO OFICIAL DE CONTROL PATRIMONIAL TI • PETROIL CORP', 14, pageHeight - 6);

      // Right Footer (Page numbering)
      doc.text(`Página ${data.pageNumber} de ${totalPages} • Generado el ${todayStr}`, pageWidth - 14, pageHeight - 6, { align: 'right' });
    }
  });

  // 5. SIGN-OFF BLOCK ON LAST PAGE
  const lastTableY = (doc as any).lastAutoTable.finalY || 140;
  const remainingSpace = pageHeight - lastTableY;

  // Add new page for signatures if not enough vertical space
  if (remainingSpace < 40) {
    doc.addPage();
  }

  const sigStartY = remainingSpace < 40 ? 30 : Math.max(lastTableY + 12, pageHeight - 42);

  doc.setDrawColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.setLineWidth(0.5);

  const sigColWidth = (pageWidth - 28 - 40) / 3;

  // Signature 1: TI Infrastructure
  const sig1X = 14;
  doc.line(sig1X, sigStartY + 15, sig1X + sigColWidth, sigStartY + 15);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.text('Ing. Carlos Mendoza', sig1X + sigColWidth / 2, sigStartY + 19, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(grayText[0], grayText[1], grayText[2]);
  doc.text('Jefe de Infraestructura & Activos TI', sig1X + sigColWidth / 2, sigStartY + 23, { align: 'center' });

  // Signature 2: Internal Audit
  const sig2X = sig1X + sigColWidth + 20;
  doc.line(sig2X, sigStartY + 15, sig2X + sigColWidth, sigStartY + 15);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.text('Lic. Laura Elizondo', sig2X + sigColWidth / 2, sigStartY + 19, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(grayText[0], grayText[1], grayText[2]);
  doc.text('Auditoría Interna & Control Patrimonial', sig2X + sigColWidth / 2, sigStartY + 23, { align: 'center' });

  // Signature 3: IT Security Validation
  const sig3X = sig2X + sigColWidth + 20;
  doc.line(sig3X, sigStartY + 15, sig3X + sigColWidth, sigStartY + 15);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.text('Sello de Validación Digital', sig3X + sigColWidth / 2, sigStartY + 19, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(grayText[0], grayText[1], grayText[2]);
  doc.text(docHash, sig3X + sigColWidth / 2, sigStartY + 23, { align: 'center' });

  // Trigger Save / Download
  const filename = `reporte_consolidado_inventario_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);

  return doc;
};
