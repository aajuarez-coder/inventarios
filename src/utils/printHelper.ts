import { jsPDF } from 'jspdf';
import { Assignment, HardwareAsset, Employee, Branch } from '../types/inventory';
import { formatDate, formatDateTime } from './formatters';

/**
 * Builds clean, standalone, high-resolution HTML for the Carta Responsiva
 */
export const buildResponsivaPrintHtml = (
  assignment: Assignment,
  asset?: HardwareAsset,
  employee?: Employee,
  branch?: Branch
): string => {
  const accessoriesHtml = assignment.accessoriesDelivered && assignment.accessoriesDelivered.length > 0
    ? assignment.accessoriesDelivered.map(acc => `<li style="margin-bottom: 4px;">✓ ${acc}</li>`).join('')
    : '<li>Sin accesorios adicionales</li>';

  const employeeSignatureImg = assignment.employeeSignatureUrl
    ? `<img src="${assignment.employeeSignatureUrl}" style="max-height: 70px; max-width: 220px; object-fit: contain; display: inline-block;" alt="Firma Colaborador" />`
    : `<div style="color: #b45309; font-size: 11px; padding-top: 25px; font-weight: bold;">[PENDIENTE DE FIRMA DIGITAL]</div>`;

  const itSignatureImg = assignment.itStaffSignatureUrl
    ? `<img src="${assignment.itStaffSignatureUrl}" style="max-height: 70px; max-width: 220px; object-fit: contain; display: inline-block;" alt="Firma TI" />`
    : `<div style="color: #047857; font-size: 11px; padding-top: 25px; font-weight: bold;">✓ AUTORIZADO DIGITALMENTE POR TI</div>`;

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Carta Responsiva - ${assignment.folioResponsiva}</title>
      <style>
        @page {
          size: letter portrait;
          margin: 15mm 15mm 15mm 15mm;
        }
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        body {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          color: #0f172a;
          background: #ffffff;
          font-size: 11px;
          line-height: 1.5;
          padding: 10px;
        }
        .header {
          border-bottom: 2px solid #0f172a;
          padding-bottom: 12px;
          margin-bottom: 16px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .logo {
          font-size: 20px;
          font-weight: 900;
          letter-spacing: -0.5px;
          font-family: monospace;
          color: #020617;
        }
        .logo-tag {
          font-size: 9px;
          background: #0f172a;
          color: #ffffff;
          padding: 2px 6px;
          border-radius: 3px;
          font-weight: bold;
          margin-left: 6px;
          vertical-align: middle;
        }
        .header-sub {
          font-size: 10px;
          color: #475569;
          margin-top: 3px;
        }
        .folio-box {
          text-align: right;
        }
        .folio-label {
          font-size: 9px;
          color: #64748b;
          text-transform: uppercase;
          font-weight: bold;
        }
        .folio-num {
          font-size: 15px;
          font-weight: 900;
          font-family: monospace;
          color: #1e1b4b;
        }
        .title {
          text-align: center;
          font-size: 13px;
          font-weight: bold;
          text-transform: uppercase;
          margin-bottom: 16px;
          letter-spacing: 0.5px;
          color: #0f172a;
          text-decoration: underline;
        }
        .section-box {
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          padding: 10px 12px;
          margin-bottom: 12px;
          background-color: #f8fafc;
        }
        .section-title {
          font-size: 10px;
          font-weight: bold;
          text-transform: uppercase;
          color: #475569;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 4px;
          margin-bottom: 8px;
          letter-spacing: 0.5px;
        }
        .grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .grid-4 {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr 1fr;
          gap: 8px;
        }
        .grid-3 {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 8px;
        }
        .field-label {
          font-size: 9px;
          color: #64748b;
          display: block;
        }
        .field-val {
          font-size: 11px;
          font-weight: bold;
          color: #0f172a;
        }
        .clauses {
          font-size: 9px;
          color: #475569;
          text-align: justify;
          margin-top: 10px;
          border-top: 1px solid #cbd5e1;
          padding-top: 8px;
        }
        .clauses p {
          margin-bottom: 4px;
        }
        .signatures {
          margin-top: 24px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          border-top: 2px solid #0f172a;
          padding-top: 12px;
          page-break-inside: avoid;
        }
        .sig-col {
          text-align: center;
        }
        .sig-box {
          height: 80px;
          border: 1px solid #cbd5e1;
          border-radius: 4px;
          background: #f8fafc;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 6px auto;
          overflow: hidden;
          width: 85%;
        }
        .sig-name {
          font-weight: bold;
          font-size: 11px;
          color: #0f172a;
        }
        .sig-role {
          font-size: 9px;
          color: #64748b;
        }
        @media print {
          body {
            padding: 0;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <span class="logo">PETROIL CORP</span>
          <span class="logo-tag">DIRECCIÓN DE TI</span>
          <div class="header-sub">SISTEMA INSTITUCIONAL DE CONTROL Y RESGUARDO DE ACTIVOS INFORMÁTICOS</div>
          <div class="header-sub">Sede: ${branch?.name || 'Corporativo Central'} • ${branch?.city || 'México'}</div>
        </div>
        <div class="folio-box">
          <div class="folio-label">FOLIO OFICIAL</div>
          <div class="folio-num">${assignment.folioResponsiva}</div>
          <div style="font-size: 10px; color: #64748b; margin-top: 2px;">
            Fecha de Entrega: <strong>${formatDate(assignment.assignedDate)}</strong>
          </div>
        </div>
      </div>

      <div class="title">
        CARTA RESPONSIVA DE ASIGNACIÓN Y RESGUARDO DE EQUIPO DE CÓMPUTO
      </div>

      <!-- 1. Colaborador -->
      <div class="section-box">
        <div class="section-title">1. Datos Generales del Colaborador Asignado</div>
        <div class="grid-4">
          <div>
            <span class="field-label">No. Empleado:</span>
            <span class="field-val" style="font-family: monospace;">${employee?.employeeNumber || 'N/A'}</span>
          </div>
          <div>
            <span class="field-label">Nombre Completo:</span>
            <span class="field-val">${employee?.fullName || 'N/A'}</span>
          </div>
          <div>
            <span class="field-label">Puesto / Cargo:</span>
            <span class="field-val">${employee?.position || 'N/A'}</span>
          </div>
          <div>
            <span class="field-label">Departamento:</span>
            <span class="field-val">${employee?.department || 'N/A'}</span>
          </div>
        </div>
      </div>

      <!-- 2. Equipo -->
      <div class="section-box">
        <div class="section-title">2. Descripción y Especificaciones Técnicas del Equipo</div>
        <div class="grid-3" style="margin-bottom: 6px;">
          <div>
            <span class="field-label">Placa de Inventario (Asset Tag):</span>
            <span class="field-val" style="font-family: monospace; color: #1e1b4b;">${asset?.assetTag || 'N/A'}</span>
          </div>
          <div>
            <span class="field-label">Número de Serie (S/N):</span>
            <span class="field-val" style="font-family: monospace;">${asset?.serialNumber || 'N/A'}</span>
          </div>
          <div>
            <span class="field-label">Marca y Modelo:</span>
            <span class="field-val">${asset?.brand} ${asset?.model}</span>
          </div>
        </div>
        <div class="grid-3">
          <div>
            <span class="field-label">Procesador (CPU):</span>
            <span class="field-val" style="font-size: 10px;">${asset?.specs.cpu || 'Estándar'}</span>
          </div>
          <div>
            <span class="field-label">Memoria RAM:</span>
            <span class="field-val">${asset?.specs.ram || 'N/A'}</span>
          </div>
          <div>
            <span class="field-label">Almacenamiento (Disco):</span>
            <span class="field-val">${asset?.specs.storage || 'N/A'}</span>
          </div>
        </div>
      </div>

      <!-- 3. Accesorios -->
      <div class="section-box">
        <div class="section-title">3. Accesorios y Periféricos Entregados</div>
        <ul style="list-style: none; padding-left: 2px;">
          ${accessoriesHtml}
        </ul>
        ${assignment.conditionNotes ? `
          <div style="margin-top: 6px; font-size: 10px; color: #475569; font-style: italic;">
            Condiciones de entrega: ${assignment.conditionNotes}
          </div>
        ` : ''}
      </div>

      <!-- 4. Cláusulas legales -->
      <div class="clauses">
        <div style="font-weight: bold; text-transform: uppercase; margin-bottom: 4px; color: #334155;">
          4. Cláusulas y Términos de Resguardo Institucional
        </div>
        <p><strong>PRIMERA (PROPIEDAD):</strong> El equipo de cómputo y accesorios descritos son propiedad exclusiva de PETROIL CORP y se entregan al colaborador en calidad de herramienta de trabajo para el desempeño de sus funciones laborales.</p>
        <p><strong>SEGUNDA (CUSTODIA Y MANTENIMIENTO):</strong> El colaborador se compromete a mantener el equipo en buen estado físico y funcional, reportar de inmediato cualquier anomalía al área de TI, y presentar el equipo obligatoriamente para sus mantenimientos preventivos periódicos.</p>
        <p><strong>TERCERA (SEGURIDAD Y SOFTWARE):</strong> Queda estrictamente prohibida la instalación de software no autorizado o la modificación de configuraciones de seguridad corporativas.</p>
        <p><strong>CUARTA (DEVOLUCIÓN):</strong> En caso de terminación laboral o reasignación, el colaborador entregará el equipo y todos sus accesorios en las mismas condiciones en que fueron recibidos, salvo el desgaste natural de uso legítimo.</p>
      </div>

      <!-- Firmas -->
      <div class="signatures">
        <div class="sig-col">
          <div style="font-size: 9px; font-weight: bold; color: #64748b; text-transform: uppercase;">RECIBÍ DE CONFORMIDAD (COLABORADOR)</div>
          <div class="sig-box">
            ${employeeSignatureImg}
          </div>
          <div class="sig-name">${employee?.fullName || 'Colaborador'}</div>
          <div class="sig-role">${employee?.position || 'Personal'}</div>
          ${assignment.signedAt ? `<div style="font-size: 8px; color: #94a3b8; font-family: monospace; margin-top: 2px;">Firmado: ${formatDateTime(assignment.signedAt)}</div>` : ''}
        </div>

        <div class="sig-col">
          <div style="font-size: 9px; font-weight: bold; color: #64748b; text-transform: uppercase;">ENTREGÓ POR TECNOLOGÍAS DE INFORMACIÓN</div>
          <div class="sig-box">
            ${itSignatureImg}
          </div>
          <div class="sig-name">${assignment.itStaffName || 'Responsable de TI'}</div>
          <div class="sig-role">Área de Soporte e Infraestructura TI</div>
          <div style="font-size: 8px; color: #94a3b8; font-family: monospace; margin-top: 2px;">PETROIL TI SECURITY SYSTEM</div>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Triggers the browser print dialog using an isolated iframe
 * This works 100% reliably inside nested iframes, avoiding sandbox restrictions.
 */
export const executePrintDialog = (htmlContent: string): boolean => {
  try {
    // Check if an existing print frame exists and remove it
    const existingFrame = document.getElementById('itasset-print-frame');
    if (existingFrame) {
      existingFrame.remove();
    }

    const iframe = document.createElement('iframe');
    iframe.id = 'itasset-print-frame';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) {
      window.print();
      return true;
    }

    doc.open();
    doc.write(htmlContent);
    doc.close();

    // Give iframe time to parse and render fonts/images, then print
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (err) {
        console.warn('Iframe print failed, falling back to window.print():', err);
        window.print();
      }

      // Cleanup iframe after printing
      setTimeout(() => {
        iframe.remove();
      }, 3000);
    }, 400);

    return true;
  } catch (e) {
    console.error('Error executing print dialog:', e);
    window.print();
    return false;
  }
};

/**
 * Generates and downloads pure Vector PDF using jsPDF
 */
export const generateAndDownloadPdf = (
  assignment: Assignment,
  asset?: HardwareAsset,
  employee?: Employee,
  branch?: Branch
): jsPDF => {
  const doc = new jsPDF('p', 'mm', 'letter');
  const filename = `carta_responsiva_${assignment.folioResponsiva.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;

  // Colors
  const darkSlate = [15, 23, 42]; // #0f172a
  const indigo = [30, 27, 75]; // #1e1b4b
  const grayText = [71, 85, 105]; // #475569
  const lightBg = [248, 250, 252]; // #f8fafc
  const borderColor = [203, 213, 225]; // #cbd5e1

  // Header Bar
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.text('PETROIL CORP', 14, 18);

  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.setFillColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.roundedRect(62, 12, 28, 6, 1, 1, 'F');
  doc.text('DIRECCIÓN DE TI', 64, 16.5);

  doc.setFontSize(8);
  doc.setTextColor(grayText[0], grayText[1], grayText[2]);
  doc.setFont('helvetica', 'normal');
  doc.text('SISTEMA INSTITUCIONAL DE CONTROL Y RESGUARDO DE ACTIVOS INFORMÁTICOS', 14, 24);
  doc.text(`Sede: ${branch?.name || 'Corporativo Central'} • ${branch?.city || 'México'}`, 14, 28);

  // Folio Header Box (Right)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('FOLIO OFICIAL', 198, 14, { align: 'right' });
  doc.setFontSize(14);
  doc.setTextColor(indigo[0], indigo[1], indigo[2]);
  doc.text(assignment.folioResponsiva, 198, 20, { align: 'right' });
  doc.setFontSize(8);
  doc.setTextColor(grayText[0], grayText[1], grayText[2]);
  doc.setFont('helvetica', 'normal');
  doc.text(`Fecha: ${formatDate(assignment.assignedDate)}`, 198, 26, { align: 'right' });

  // Divider Line
  doc.setDrawColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.setLineWidth(0.8);
  doc.line(14, 32, 198, 32);

  // Document Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.text('CARTA RESPONSIVA DE ASIGNACIÓN Y RESGUARDO DE EQUIPO DE CÓMPUTO', 106, 39, { align: 'center' });

  // Section 1: Colaborador Box
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.setLineWidth(0.3);
  doc.roundedRect(14, 43, 184, 22, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(grayText[0], grayText[1], grayText[2]);
  doc.text('1. DATOS DEL COLABORADOR ASIGNADO', 18, 48);

  doc.setFontSize(8);
  doc.text('No. Empleado:', 18, 54);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.text(employee?.employeeNumber || 'N/A', 18, 59);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(grayText[0], grayText[1], grayText[2]);
  doc.text('Nombre Completo:', 60, 54);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.text(employee?.fullName || 'N/A', 60, 59);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(grayText[0], grayText[1], grayText[2]);
  doc.text('Puesto / Cargo:', 115, 54);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.text(employee?.position || 'N/A', 115, 59);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(grayText[0], grayText[1], grayText[2]);
  doc.text('Departamento:', 155, 54);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.text(employee?.department || 'N/A', 155, 59);

  // Section 2: Hardware Box
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.roundedRect(14, 68, 184, 30, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(grayText[0], grayText[1], grayText[2]);
  doc.text('2. DESCRIPCIÓN Y ESPECIFICACIONES TÉCNICAS DEL EQUIPO', 18, 73);

  doc.text('Placa de Inventario:', 18, 79);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(indigo[0], indigo[1], indigo[2]);
  doc.text(asset?.assetTag || 'N/A', 18, 84);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(grayText[0], grayText[1], grayText[2]);
  doc.text('Número de Serie (S/N):', 65, 79);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.text(asset?.serialNumber || 'N/A', 65, 84);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(grayText[0], grayText[1], grayText[2]);
  doc.text('Marca y Modelo:', 125, 79);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.text(`${asset?.brand || ''} ${asset?.model || ''}`, 125, 84);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(grayText[0], grayText[1], grayText[2]);
  doc.text('Procesador (CPU):', 18, 89);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.text(asset?.specs.cpu || 'Estándar', 18, 94);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(grayText[0], grayText[1], grayText[2]);
  doc.text('Memoria RAM:', 80, 89);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.text(asset?.specs.ram || 'N/A', 80, 94);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(grayText[0], grayText[1], grayText[2]);
  doc.text('Almacenamiento (Disco):', 135, 89);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.text(asset?.specs.storage || 'N/A', 135, 94);

  // Section 3: Accessories Box
  const accHeight = Math.max(22, 14 + (assignment.accessoriesDelivered?.length || 1) * 4.5);
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.roundedRect(14, 101, 184, accHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(grayText[0], grayText[1], grayText[2]);
  doc.text('3. ACCESORIOS Y PERIFÉRICOS ENTREGADOS', 18, 106);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  let currentY = 111;
  if (assignment.accessoriesDelivered && assignment.accessoriesDelivered.length > 0) {
    assignment.accessoriesDelivered.forEach(acc => {
      doc.text(`• ${acc}`, 22, currentY);
      currentY += 4.5;
    });
  } else {
    doc.text('• Sin accesorios adicionales', 22, currentY);
    currentY += 4.5;
  }

  if (assignment.conditionNotes) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(grayText[0], grayText[1], grayText[2]);
    doc.text(`Condiciones de entrega: ${assignment.conditionNotes}`, 18, currentY + 1);
    currentY += 5;
  }

  // Section 4: Legal Clauses
  const clauseY = 101 + accHeight + 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(grayText[0], grayText[1], grayText[2]);
  doc.text('4. CLÁUSULAS Y TÉRMINOS DE RESGUARDO INSTITUCIONAL', 14, clauseY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(grayText[0], grayText[1], grayText[2]);

  const p1 = 'PRIMERA (PROPIEDAD): El equipo y accesorios son propiedad exclusiva de PETROIL CORP, asignados como herramienta de trabajo laboral.';
  const p2 = 'SEGUNDA (CUSTODIA Y MANTENIMIENTO): El colaborador se compromete a mantener el equipo en buen estado y presentarlo a los mantenimientos preventivos periódicos programados por TI.';
  const p3 = 'TERCERA (SEGURIDAD): Queda prohibida la instalación de software no autorizado o modificaciones a las políticas de seguridad.';
  const p4 = 'CUARTA (DEVOLUCIÓN): En caso de terminación laboral o reasignación, el equipo se entregará en las condiciones recibidas.';

  let cy = clauseY + 4;
  [p1, p2, p3, p4].forEach(p => {
    const lines = doc.splitTextToSize(p, 184);
    doc.text(lines, 14, cy);
    cy += lines.length * 3.2;
  });

  // Section 5: Signatures
  const sigY = 210;
  doc.setDrawColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.setLineWidth(0.6);
  doc.line(14, sigY - 2, 198, sigY - 2);

  // Employee Column
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(grayText[0], grayText[1], grayText[2]);
  doc.text('RECIBÍ DE CONFORMIDAD (COLABORADOR)', 55, sigY + 3, { align: 'center' });

  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.roundedRect(22, sigY + 6, 66, 24, 1.5, 1.5, 'FD');

  if (assignment.employeeSignatureUrl && assignment.employeeSignatureUrl.startsWith('data:image/png')) {
    try {
      doc.addImage(assignment.employeeSignatureUrl, 'PNG', 26, sigY + 8, 58, 20);
    } catch {
      doc.setFontSize(7.5);
      doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
      doc.text('[Firma Electrónica Registrada]', 55, sigY + 18, { align: 'center' });
    }
  } else {
    doc.setFontSize(7.5);
    doc.setTextColor(180, 83, 9);
    doc.text(assignment.employeeSignatureUrl ? '[Firma Registrada]' : '[Pendiente de Firma]', 55, sigY + 18, { align: 'center' });
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.text(employee?.fullName || 'Colaborador', 55, sigY + 34, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(grayText[0], grayText[1], grayText[2]);
  doc.text(employee?.position || 'Personal', 55, sigY + 38, { align: 'center' });

  // IT Staff Column
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(grayText[0], grayText[1], grayText[2]);
  doc.text('ENTREGÓ POR TECNOLOGÍAS DE INFORMACIÓN', 155, sigY + 3, { align: 'center' });

  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.roundedRect(122, sigY + 6, 66, 24, 1.5, 1.5, 'FD');

  doc.setFontSize(7.5);
  doc.setTextColor(4, 120, 87); // emerald
  doc.text('✓ AUTORIZADO DIGITALMENTE', 155, sigY + 18, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.text(assignment.itStaffName || 'Responsable de TI', 155, sigY + 34, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(grayText[0], grayText[1], grayText[2]);
  doc.text('Área de Soporte e Infraestructura TI', 155, sigY + 38, { align: 'center' });

  // Footer Hash
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(`PETROIL ITAM SECURITY HASH: RESP-${assignment.folioResponsiva}-${Date.now().toString(36).toUpperCase()}`, 106, 265, { align: 'center' });

  // Save the document to user computer
  doc.save(filename);
  return doc;
};
