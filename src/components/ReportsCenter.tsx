import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { 
  Printer, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Filter, 
  Building2, 
  Laptop, 
  ShieldCheck, 
  CheckCircle2, 
  Wrench, 
  Layers,
  History,
  Sparkles,
  Award,
  Calendar
} from 'lucide-react';
import { formatCurrency, formatDate, getWarrantyStatus, getMaintenanceStatus, getStatusBadge } from '../utils/formatters';
import { executePrintDialog } from '../utils/printHelper';
import { generateInstitutionalInventoryPdf, generateInstitutionalMaintenancePdf } from '../utils/generateInstitutionalPdf';
import confetti from 'canvas-confetti';

export const ReportsCenter: React.FC = () => {
  const { assets, employees, branches, assignments, maintenanceRecords, timeline, currentUser } = useInventory();
  
  const [reportType, setReportType] = useState<
    'general' | 'warehouse_stock' | 'assignments' | 'maintenance' | 'warranties' | 'audit_trail'
  >('general');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [isGeneratingInventoryPdf, setIsGeneratingInventoryPdf] = useState(false);
  const [isGeneratingMaintenancePdf, setIsGeneratingMaintenancePdf] = useState(false);
  const [pdfSuccessMessage, setPdfSuccessMessage] = useState<string | null>(null);

  const filteredAssets = assets.filter(a => {
    if (selectedBranch !== 'all' && a.branchId !== selectedBranch) return false;
    if (reportType === 'warehouse_stock') return a.status === 'disponible';
    if (reportType === 'assignments') return a.status === 'asignado';
    return true;
  });

  const filteredMaintenance = maintenanceRecords.filter(rec => {
    if (selectedBranch === 'all') return true;
    const ast = assets.find(a => a.id === rec.assetId);
    return ast?.branchId === selectedBranch;
  });

  const totalValuation = filteredAssets.reduce((sum, a) => sum + (a.purchaseCost || 0), 0);
  const totalMaintenanceCost = filteredMaintenance.reduce((sum, r) => sum + (r.cost || 0), 0);

  const handlePrint = () => {
    const el = document.getElementById('printable-report-sheet');
    if (el) {
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>Reporte Oficial Institucional - Grupo Petroil</title>
            <style>
              @page { size: letter landscape; margin: 8mm; }
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; padding: 10px; font-size: 11px; }
              table { width: 100%; border-collapse: collapse; margin-top: 10px; }
              th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
              th { background-color: #0f172a; color: #ffffff; font-weight: bold; font-size: 10px; text-transform: uppercase; }
              .logo-box { background-color: #e11d48; color: white; padding: 4px 8px; border-radius: 4px; font-weight: 900; }
            </style>
          </head>
          <body>${el.innerHTML}</body>
        </html>
      `;
      executePrintDialog(html);
    } else {
      window.print();
    }
  };

  const handleDownloadInstitutionalInventoryPdf = (withPrint: boolean = false) => {
    setIsGeneratingInventoryPdf(true);
    setPdfSuccessMessage('Generando reporte institucional de inventario con logo Petroil en PDF...');

    setTimeout(() => {
      try {
        const branchObj = selectedBranch !== 'all' ? branches.find(b => b.id === selectedBranch) : undefined;
        generateInstitutionalInventoryPdf(filteredAssets, employees, branches, {
          generatedBy: currentUser.name,
          branchFilterName: branchObj ? `${branchObj.name} (${branchObj.city})` : 'Consolidado Corporativo (Todas las Sedes)',
          openPrintDialog: withPrint
        });
        confetti({ particleCount: 75, spread: 65, origin: { y: 0.7 } });
        setPdfSuccessMessage(
          withPrint
            ? '✓ Reporte institucional de inventario generado e inicializado cuadro de impresión con logo Petroil.'
            : '✓ Reporte institucional de inventario exportado exitosamente en PDF con logo oficial Petroil.'
        );
        setTimeout(() => setPdfSuccessMessage(null), 5000);
      } catch (err) {
        console.error('Error generating institutional inventory PDF:', err);
        alert('Ocurrió un error al generar el PDF del inventario.');
      } finally {
        setIsGeneratingInventoryPdf(false);
      }
    }, 120);
  };

  const handleDownloadInstitutionalMaintenancePdf = (withPrint: boolean = false) => {
    setIsGeneratingMaintenancePdf(true);
    setPdfSuccessMessage('Generando historial institucional de mantenimiento con logo Petroil en PDF...');

    setTimeout(() => {
      try {
        const branchObj = selectedBranch !== 'all' ? branches.find(b => b.id === selectedBranch) : undefined;
        generateInstitutionalMaintenancePdf(filteredMaintenance, assets, branches, {
          generatedBy: currentUser.name,
          branchFilterName: branchObj ? `${branchObj.name} (${branchObj.city})` : 'Consolidado Corporativo (Todas las Sedes)',
          openPrintDialog: withPrint
        });
        confetti({ particleCount: 75, spread: 65, origin: { y: 0.7 } });
        setPdfSuccessMessage(
          withPrint
            ? '✓ Historial institucional de mantenimiento generado e inicializado cuadro de impresión con logo Petroil.'
            : '✓ Historial institucional de mantenimiento exportado exitosamente en PDF con logo oficial Petroil.'
        );
        setTimeout(() => setPdfSuccessMessage(null), 5000);
      } catch (err) {
        console.error('Error generating institutional maintenance PDF:', err);
        alert('Ocurrió un error al generar el PDF de mantenimiento.');
      } finally {
        setIsGeneratingMaintenancePdf(false);
      }
    }, 120);
  };

  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: string[][] = [];
    let filename = `reporte_it_${reportType}_${new Date().toISOString().split('T')[0]}.csv`;

    if (reportType === 'audit_trail') {
      headers = ['ID', 'Fecha y Hora', 'Activo / Placa', 'Tipo Evento', 'Título', 'Descripción', 'Usuario Responsable'];
      rows = timeline.map(t => {
        const ast = assets.find(a => a.id === t.assetId);
        return [
          t.id,
          t.timestamp,
          ast ? `[${ast.assetTag}] ${ast.name}` : t.assetId,
          t.type,
          `"${t.title.replace(/"/g, '""')}"`,
          `"${t.description.replace(/"/g, '""')}"`,
          `"${t.author.replace(/"/g, '""')}"`
        ];
      });
    } else if (reportType === 'maintenance') {
      headers = [
        'ID Servicio',
        'ID Activo',
        'Placa Tag',
        'Equipo / Modelo',
        'Sucursal',
        'Tipo Servicio',
        'Fecha',
        'Tecnico Responsable',
        'Indice de Salud',
        'Costo (MXN)',
        'Estatus',
        'Proximo Servicio',
        'Tareas y Diagnostico'
      ];
      rows = filteredMaintenance.map(rec => {
        const ast = assets.find(a => a.id === rec.assetId);
        const br = ast ? branches.find(b => b.id === ast.branchId) : undefined;
        return [
          rec.id,
          rec.assetId,
          ast?.assetTag || '',
          `"${(ast ? `${ast.brand} ${ast.model}` : '').replace(/"/g, '""')}"`,
          `"${br?.name || 'Sede Central'}"`,
          rec.type,
          rec.date,
          `"${rec.technicianName.replace(/"/g, '""')}"`,
          rec.diagnosticScore ? `${rec.diagnosticScore}/100` : 'N/A',
          String(rec.cost || 0),
          rec.status,
          rec.nextScheduledDate || '',
          `"${(rec.tasksCompleted ? rec.tasksCompleted.join('; ') : rec.description).replace(/"/g, '""')}"`
        ];
      });
    } else {
      headers = [
        'Placa Inventario',
        'Numero Serie',
        'Marca',
        'Modelo',
        'Categoria',
        'Estado',
        'Sucursal',
        'Colaborador Asignado',
        'Procesador',
        'RAM',
        'Almacenamiento',
        'Costo Compra (MXN)',
        'Proveedor',
        'Factura',
        'Vencimiento Garantia',
        'Proximo Mantenimiento'
      ];

      rows = filteredAssets.map(a => {
        const emp = employees.find(e => e.id === a.assignedToEmployeeId);
        const br = branches.find(b => b.id === a.branchId);
        return [
          a.assetTag,
          a.serialNumber,
          a.brand,
          `"${a.model.replace(/"/g, '""')}"`,
          a.category,
          a.status,
          `"${br?.name || ''}"`,
          `"${emp?.fullName || 'En Almacén'}"`,
          `"${(a.specs.cpu || '').replace(/"/g, '""')}"`,
          `"${a.specs.ram || ''}"`,
          `"${a.specs.storage || ''}"`,
          String(a.purchaseCost || 0),
          `"${a.supplier.replace(/"/g, '""')}"`,
          a.invoiceNumber,
          a.warrantyEndDate,
          a.nextMaintenanceDate
        ];
      });
    }

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      
      {/* Top Banner (Hidden in print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs no-print">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse" />
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Printer className="w-5 h-5 text-rose-600" />
              Centro de Reportes Oficiales & Auditoría TI
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Emisión y exportación de reportes ejecutivos en PDF con membrete y logotipo de Grupo Petroil, inventarios y mantenimiento técnico.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-2 transition-colors cursor-pointer"
            title="Exportar listado actual a formato CSV / Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Excel (CSV)</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-2 transition-colors shadow-xs cursor-pointer"
            title="Abrir cuadro de diálogo de impresión institucional"
          >
            <Printer className="w-4 h-4 text-cyan-400" />
            <span>Imprimir Vista</span>
          </button>
        </div>
      </div>

      {/* Success / Feedback Banner */}
      {pdfSuccessMessage && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-950 rounded-xl text-xs flex items-center justify-between no-print animate-in fade-in shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-semibold">{pdfSuccessMessage}</span>
          </div>
          <button
            onClick={() => setPdfSuccessMessage(null)}
            className="text-rose-700 hover:text-rose-950 font-bold ml-2 text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2 Primary Institutional Export Cards (PDF with Petroil Logo) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 no-print">
        
        {/* Card 1: Institutional Inventory PDF */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 text-white border border-slate-700 shadow-md relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center font-black text-white text-xs shadow-xs">
                  GP
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    Reporte Institucional de Inventario
                  </h3>
                  <span className="text-[10px] text-rose-400 font-semibold uppercase tracking-wider">
                    Formato Oficial Petroil • jsPDF
                  </span>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                {filteredAssets.length} Equipos
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Genera el documento oficial en formato PDF horizontal con logotipo vectorial de Petroil, resumen de KPIs ejecutivos, desglose técnico de CPU/RAM/Disco, estatus, colaborador en custodia y firmas de autorización.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
            <button
              onClick={() => handleDownloadInstitutionalInventoryPdf(false)}
              disabled={isGeneratingInventoryPdf}
              className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer"
            >
              {isGeneratingInventoryPdf ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Generando PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Descargar PDF (Logo Petroil)</span>
                </>
              )}
            </button>
            <button
              onClick={() => handleDownloadInstitutionalInventoryPdf(true)}
              disabled={isGeneratingInventoryPdf}
              className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:bg-slate-800 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
              title="Abrir cuadro de impresión directa del PDF institucional"
            >
              <Printer className="w-4 h-4 text-cyan-400" />
              <span>Imprimir</span>
            </button>
          </div>
        </div>

        {/* Card 2: Institutional Maintenance History PDF */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 text-white border border-slate-700 shadow-md relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center text-white shadow-xs">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    Historial de Mantenimiento Técnico
                  </h3>
                  <span className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider">
                    Certificación de Servicios • jsPDF
                  </span>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                {filteredMaintenance.length} Servicios
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Genera la bitácora técnica de servicios preventivos y correctivos con membrete Petroil, diagnóstico de salud por equipo (0-100), tareas de taller, costos acumulados y firmas de certificación de infraestructura.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
            <button
              onClick={() => handleDownloadInstitutionalMaintenancePdf(false)}
              disabled={isGeneratingMaintenancePdf}
              className="flex-1 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer"
            >
              {isGeneratingMaintenancePdf ? (
                <>
                  <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Generando PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Descargar Historial PDF</span>
                </>
              )}
            </button>
            <button
              onClick={() => handleDownloadInstitutionalMaintenancePdf(true)}
              disabled={isGeneratingMaintenancePdf}
              className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:bg-slate-800 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
              title="Abrir cuadro de impresión directa del historial de mantenimiento"
            >
              <Printer className="w-4 h-4 text-cyan-400" />
              <span>Imprimir</span>
            </button>
          </div>
        </div>

      </div>

      {/* Report Controls (Hidden in print) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs no-print">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">Tipo de Reporte en Pantalla:</span>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
              className="p-2 border border-slate-300 rounded-lg bg-white font-medium text-slate-800 outline-hidden"
            >
              <option value="general">Reporte General de Inventario de Hardware</option>
              <option value="warehouse_stock">Reporte de Stock Disponible en Almacén</option>
              <option value="assignments">Reporte de Equipos Asignados a Colaboradores</option>
              <option value="maintenance">Historial y Cronograma de Mantenimiento</option>
              <option value="warranties">Reporte de Vigencia de Garantías</option>
              <option value="audit_trail">Bitácora de Trazabilidad Histórica</option>
            </select>
          </div>

          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">Filtrar por Sucursal:</span>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="p-2 border border-slate-300 rounded-lg bg-white text-slate-800 outline-hidden"
            >
              <option value="all">Todas las Sedes</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name} ({b.city})</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="text-right">
            <span className="text-slate-400 text-[10px] block">
              {reportType === 'maintenance' ? 'Servicios Registrados:' : 'Equipos en Reporte:'}
            </span>
            <strong className="text-slate-900 text-sm">
              {reportType === 'maintenance' ? filteredMaintenance.length : filteredAssets.length}
            </strong>
          </div>
          <div className="text-right">
            <span className="text-slate-400 text-[10px] block">
              {reportType === 'maintenance' ? 'Costo Servicios:' : 'Valoración Total:'}
            </span>
            <strong className="text-rose-900 text-sm">
              {formatCurrency(reportType === 'maintenance' ? totalMaintenanceCost : totalValuation)}
            </strong>
          </div>
        </div>
      </div>

      {/* Printable Document Container */}
      <div id="printable-report-sheet" className="bg-white rounded-2xl border border-slate-300 shadow-md p-6 sm:p-10 printable-document">
        
        {/* Printable Official Header with Petroil Branding */}
        <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between">
          <div className="flex items-start gap-4">
            
            {/* Petroil Logo Badge */}
            <div className="w-12 h-12 rounded-xl bg-rose-600 flex flex-col items-center justify-center text-white shrink-0 shadow-xs relative">
              <span className="text-xs font-black tracking-tighter">PETROIL</span>
              <div className="w-2 h-2 rounded-full bg-amber-400 mt-0.5" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight text-slate-950">GRUPO PETROIL</span>
                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-slate-900 text-white">
                  DIRECCIÓN DE TI & INFRAESTRUCTURA
                </span>
              </div>
              <h1 className="text-sm font-bold text-slate-900 mt-1 uppercase tracking-wide">
                {reportType === 'general' && 'INFORME OFICIAL DE INVENTARIO GENERAL DE HARDWARE Y EQUIPOS'}
                {reportType === 'warehouse_stock' && 'INFORME DE EXISTENCIAS Y STOCK DISPONIBLE EN ALMACÉN TI'}
                {reportType === 'assignments' && 'INFORME DE RESGUARDO Y EQUIPOS ASIGNADOS A COLABORADORES'}
                {reportType === 'maintenance' && 'HISTORIAL INSTITUCIONAL DE MANTENIMIENTO TÉCNICO Y DIAGNÓSTICO'}
                {reportType === 'warranties' && 'INFORME DE CONTROL Y VENCIMIENTO DE GARANTÍAS COMERCIALES'}
                {reportType === 'audit_trail' && 'INFORME DE AUDITORÍA Y TRAZABILIDAD DE MOVIMIENTOS DE ACTIVOS'}
              </h1>
              <p className="text-[10px] text-slate-500">
                Sistema Integral de Control de Activos TI • Matriz Mazatlán / Nacional • Emisión: {new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>

          <div className="text-right text-xs">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">SUCURSAL / ALCANCE</span>
            <strong className="text-slate-900">
              {selectedBranch === 'all' ? 'Consolidado Corporativo' : branches.find(b => b.id === selectedBranch)?.name}
            </strong>
            <p className="text-[10px] text-slate-400 font-mono mt-1">CONFIDENCIAL • DOCUMENTO OFICIAL</p>
          </div>
        </div>

        {/* Summary Metric Ribbon in Report */}
        <div className="my-5 grid grid-cols-4 gap-3 text-center border border-slate-200 rounded-lg p-3 bg-slate-50/70 text-xs">
          {reportType === 'maintenance' ? (
            <>
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Total Servicios</span>
                <strong className="text-base font-mono text-slate-900 font-bold">{filteredMaintenance.length}</strong>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Preventivos</span>
                <strong className="text-base font-mono text-emerald-700 font-bold">
                  {filteredMaintenance.filter(r => r.type === 'preventivo').length}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Correctivos</span>
                <strong className="text-base font-mono text-rose-700 font-bold">
                  {filteredMaintenance.filter(r => r.type === 'correctivo').length}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Costo Acumulado</span>
                <strong className="text-base font-mono text-slate-900 font-bold">{formatCurrency(totalMaintenanceCost)}</strong>
              </div>
            </>
          ) : (
            <>
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Total Registros</span>
                <strong className="text-base font-mono text-slate-900 font-bold">{filteredAssets.length}</strong>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold block">En Almacén</span>
                <strong className="text-base font-mono text-emerald-700 font-bold">
                  {filteredAssets.filter(a => a.status === 'disponible').length}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Asignados</span>
                <strong className="text-base font-mono text-blue-700 font-bold">
                  {filteredAssets.filter(a => a.status === 'asignado').length}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Costo Acumulado</span>
                <strong className="text-base font-mono text-slate-900 font-bold">{formatCurrency(totalValuation)}</strong>
              </div>
            </>
          )}
        </div>

        {/* Report Content Table */}
        {reportType === 'audit_trail' ? (
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="border-b-2 border-slate-800 text-slate-800 font-bold uppercase text-[10px]">
                  <th className="py-2 px-2">Fecha</th>
                  <th className="py-2 px-2">Activo</th>
                  <th className="py-2 px-2">Evento</th>
                  <th className="py-2 px-2">Detalles</th>
                  <th className="py-2 px-2">Usuario</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {timeline.map(t => {
                  const ast = assets.find(a => a.id === t.assetId);
                  return (
                    <tr key={t.id}>
                      <td className="py-2 px-2 font-mono whitespace-nowrap text-slate-600">
                        {formatDate(t.timestamp)}
                      </td>
                      <td className="py-2 px-2 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {ast?.assetTag || t.assetId}
                      </td>
                      <td className="py-2 px-2 uppercase font-semibold text-rose-800 whitespace-nowrap">
                        {t.title}
                      </td>
                      <td className="py-2 px-2 text-slate-700 leading-snug">
                        {t.description}
                      </td>
                      <td className="py-2 px-2 text-slate-600 whitespace-nowrap">
                        {t.author}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : reportType === 'maintenance' ? (
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="border-b-2 border-slate-800 text-slate-800 font-bold uppercase text-[10px]">
                  <th className="py-2 px-2">ID Servicio</th>
                  <th className="py-2 px-2">Equipo / Placa</th>
                  <th className="py-2 px-2">Sucursal</th>
                  <th className="py-2 px-2">Tipo</th>
                  <th className="py-2 px-2">Fecha</th>
                  <th className="py-2 px-2">Técnico</th>
                  <th className="py-2 px-2">Diagnóstico y Tareas</th>
                  <th className="py-2 px-2 text-center">Salud</th>
                  <th className="py-2 px-2 text-right">Costo</th>
                  <th className="py-2 px-2 text-center">Próximo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredMaintenance.map(rec => {
                  const ast = assets.find(a => a.id === rec.assetId);
                  const br = ast ? branches.find(b => b.id === ast.branchId) : undefined;
                  return (
                    <tr key={rec.id} className="hover:bg-slate-50">
                      <td className="py-2 px-2 font-mono font-bold text-rose-700 whitespace-nowrap">
                        {rec.id.toUpperCase()}
                      </td>
                      <td className="py-2 px-2 font-medium text-slate-900 whitespace-nowrap">
                        {ast ? `${ast.assetTag} (${ast.brand} ${ast.model})` : rec.assetId}
                      </td>
                      <td className="py-2 px-2 text-slate-600 whitespace-nowrap">
                        {br?.city || br?.name || 'Sede Central'}
                      </td>
                      <td className="py-2 px-2 whitespace-nowrap">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                          rec.type === 'preventivo' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {rec.type}
                        </span>
                      </td>
                      <td className="py-2 px-2 font-mono text-slate-600 whitespace-nowrap">
                        {formatDate(rec.date)}
                      </td>
                      <td className="py-2 px-2 text-slate-700 whitespace-nowrap">
                        {rec.technicianName}
                      </td>
                      <td className="py-2 px-2 text-slate-600 text-[10px] max-w-xs">
                        {rec.tasksCompleted && rec.tasksCompleted.length > 0 
                          ? rec.tasksCompleted.slice(0, 3).join(', ') + (rec.tasksCompleted.length > 3 ? '...' : '')
                          : rec.description}
                      </td>
                      <td className="py-2 px-2 text-center font-bold text-emerald-700">
                        {rec.diagnosticScore ? `${rec.diagnosticScore}/100` : 'N/A'}
                      </td>
                      <td className="py-2 px-2 text-right font-mono font-medium text-slate-900 whitespace-nowrap">
                        {formatCurrency(rec.cost)}
                      </td>
                      <td className="py-2 px-2 text-center font-mono text-slate-500 whitespace-nowrap text-[10px]">
                        {formatDate(rec.nextScheduledDate)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="border-b-2 border-slate-800 text-slate-800 font-bold uppercase text-[10px]">
                  <th className="py-2 px-2">Placa / Tag</th>
                  <th className="py-2 px-2">Serie (S/N)</th>
                  <th className="py-2 px-2">Equipo / Modelo</th>
                  <th className="py-2 px-2">Especificaciones</th>
                  <th className="py-2 px-2">Estado</th>
                  <th className="py-2 px-2">Custodia Actual</th>
                  <th className="py-2 px-2">Garantía</th>
                  <th className="py-2 px-2 text-right">Valor Adq.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredAssets.map(asset => {
                  const emp = employees.find(e => e.id === asset.assignedToEmployeeId);
                  const statusBadge = getStatusBadge(asset.status);

                  return (
                    <tr key={asset.id} className="hover:bg-slate-50">
                      <td className="py-2 px-2 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {asset.assetTag}
                      </td>
                      <td className="py-2 px-2 font-mono text-slate-600 whitespace-nowrap">
                        {asset.serialNumber}
                      </td>
                      <td className="py-2 px-2 font-medium text-slate-900 whitespace-nowrap">
                        {asset.brand} {asset.model}
                      </td>
                      <td className="py-2 px-2 text-slate-600 text-[10px]">
                        {asset.specs.cpu || 'Estándar'} • {asset.specs.ram} • {asset.specs.storage}
                      </td>
                      <td className="py-2 px-2 whitespace-nowrap">
                        <span className="font-semibold text-slate-800 uppercase text-[10px]">
                          {statusBadge.label}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-slate-700 whitespace-nowrap">
                        {emp ? emp.fullName : 'Almacén TI'}
                      </td>
                      <td className="py-2 px-2 whitespace-nowrap text-[10px]">
                        {formatDate(asset.warrantyEndDate)}
                      </td>
                      <td className="py-2 px-2 text-right font-mono font-medium text-slate-900 whitespace-nowrap">
                        {formatCurrency(asset.purchaseCost)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Official Report Sign-off Footer */}
        <div className="mt-12 pt-8 border-t-2 border-slate-900 grid grid-cols-3 gap-6 text-center text-xs">
          <div>
            <div className="w-48 border-b border-slate-400 mx-auto mb-2"></div>
            <p className="font-bold text-slate-900">{currentUser.name}</p>
            <p className="text-[10px] text-slate-500">Elaboró / Responsable Inventarios TI</p>
          </div>

          <div>
            <div className="w-48 border-b border-slate-400 mx-auto mb-2"></div>
            <p className="font-bold text-slate-900">Ing. Carlos Mendoza</p>
            <p className="text-[10px] text-slate-500">Revisó / Coordinación Técnica TI</p>
          </div>

          <div>
            <div className="w-48 border-b border-slate-400 mx-auto mb-2"></div>
            <p className="font-bold text-slate-900">Lic. Laura Elizondo</p>
            <p className="text-[10px] text-slate-500">Autorizó / Contraloría Grupo Petroil</p>
          </div>
        </div>

      </div>

    </div>
  );
};
