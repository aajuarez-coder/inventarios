import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useInventory } from '../context/InventoryContext';
import { Assignment, HardwareAsset, Employee } from '../types/inventory';
import { 
  FileText, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Printer, 
  PenTool, 
  RotateCcw, 
  Search, 
  Building2, 
  User, 
  Laptop, 
  ShieldCheck, 
  Download,
  X,
  Sparkles,
  QrCode,
  Lock,
  Mail,
  Check,
  ChevronDown,
  UserCheck,
  Briefcase
} from 'lucide-react';
import { formatDate, formatDateTime } from '../utils/formatters';
import { DigitalSignaturePad } from './DigitalSignaturePad';
import { exportResponsivaToPDF, buildResponsivaPrintHtml, executePrintDialog } from '../utils/generatePdf';
import { useGmail } from '../context/GmailContext';
import { EmailTemplates } from '../services/gmailService';
import confetti from 'canvas-confetti';

interface AssignmentsManagerProps {
  preselectedAsset?: HardwareAsset | null;
  preselectedEmployee?: Employee | null;
  onClearPreselections?: () => void;
}

export const AssignmentsManager: React.FC<AssignmentsManagerProps> = ({
  preselectedAsset,
  preselectedEmployee,
  onClearPreselections
}) => {
  const { 
    assignments, 
    assets, 
    employees, 
    branches, 
    createAssignment, 
    signResponsiva, 
    returnAsset, 
    currentUser,
    canEdit,
    isViewer
  } = useInventory();

  const {
    isConnected: isGmailConnected,
    connectGoogle,
    sendEmailWithConfirmation
  } = useGmail();

  const [search, setSearch] = useState('');
  const [isSendingGmail, setIsSendingGmail] = useState(false);
  const [selectedAssignmentForView, setSelectedAssignmentForView] = useState<Assignment | null>(null);
  const [showNewAssignmentModal, setShowNewAssignmentModal] = useState(Boolean(preselectedAsset || preselectedEmployee));
  const [signingAssignment, setSigningAssignment] = useState<Assignment | null>(null);
  const [returnAssignmentModal, setReturnAssignmentModal] = useState<Assignment | null>(null);

  // New assignment form state
  const [selectedAssetId, setSelectedAssetId] = useState<string>(preselectedAsset?.id || '');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(preselectedEmployee?.id || '');
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState('');
  const [isEmployeeDropdownOpen, setIsEmployeeDropdownOpen] = useState(false);
  const employeeDropdownRef = useRef<HTMLDivElement>(null);
  const employeeInputRef = useRef<HTMLInputElement>(null);
  const [assetSearchQuery, setAssetSearchQuery] = useState('');

  // Sync when preselectedEmployee or preselectedAsset change
  useEffect(() => {
    if (preselectedEmployee) {
      setSelectedEmployeeId(preselectedEmployee.id);
      setEmployeeSearchQuery('');
    }
  }, [preselectedEmployee]);

  useEffect(() => {
    if (preselectedAsset) {
      setSelectedAssetId(preselectedAsset.id);
    }
  }, [preselectedAsset]);

  // Click outside to close employee dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (employeeDropdownRef.current && !employeeDropdownRef.current.contains(event.target as Node)) {
        setIsEmployeeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filtered employees for assignment combobox
  const filteredEmployeesForAssignment = useMemo(() => {
    const q = employeeSearchQuery.toLowerCase().trim();
    if (!q) return employees;
    return employees.filter(e => 
      e.fullName.toLowerCase().includes(q) ||
      e.employeeNumber.toLowerCase().includes(q) ||
      (e.position && e.position.toLowerCase().includes(q)) ||
      (e.department && e.department.toLowerCase().includes(q)) ||
      (e.email && e.email.toLowerCase().includes(q))
    );
  }, [employees, employeeSearchQuery]);

  const selectedEmployee = useMemo(() => {
    return employees.find(e => e.id === selectedEmployeeId);
  }, [employees, selectedEmployeeId]);

  const [selectedAccessories, setSelectedAccessories] = useState<string[]>([
    'Cargador original con cable de alimentación',
    'Mochila / Portafolio corporativo',
    'Mouse óptico / inalámbrico'
  ]);
  const [customAccessory, setCustomAccessory] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('Equipo entregado en óptimas condiciones físicas y operativas.');
  const [itStaffName, setItStaffName] = useState(currentUser.name);

  // Signature state
  const [capturedEmployeeSignature, setCapturedEmployeeSignature] = useState('');
  const [capturedItSignature, setCapturedItSignature] = useState('');

  // Return state
  const [returnCondition, setReturnCondition] = useState('excelente');
  const [returnNotes, setReturnNotes] = useState('Devuelto completo con accesorios correspondientes.');
  const [returnBranchId, setReturnBranchId] = useState(branches[0]?.id || '');

  // Available stock in warehouse
  const availableAssets = assets.filter(a => a.status === 'disponible');

  const filteredAvailableAssets = useMemo(() => {
    if (!assetSearchQuery.trim()) return availableAssets;
    const q = assetSearchQuery.toLowerCase().trim();
    return availableAssets.filter(a =>
      a.assetTag.toLowerCase().includes(q) ||
      a.brand.toLowerCase().includes(q) ||
      a.model.toLowerCase().includes(q) ||
      a.serialNumber.toLowerCase().includes(q) ||
      (a.specs?.cpu && a.specs.cpu.toLowerCase().includes(q))
    );
  }, [availableAssets, assetSearchQuery]);

  const filteredAssignments = assignments.filter(asg => {
    const asset = assets.find(a => a.id === asg.assetId);
    const emp = employees.find(e => e.id === asg.employeeId);
    const q = search.toLowerCase();

    return (
      asg.folioResponsiva.toLowerCase().includes(q) ||
      (asset && (asset.assetTag.toLowerCase().includes(q) || asset.serialNumber.toLowerCase().includes(q) || asset.name.toLowerCase().includes(q))) ||
      (emp && (emp.fullName.toLowerCase().includes(q) || emp.employeeNumber.toLowerCase().includes(q)))
    );
  });

  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetId || !selectedEmployeeId) {
      alert('Por favor seleccione el equipo disponible y el colaborador destinatario.');
      return;
    }

    const newAsg = createAssignment(
      selectedAssetId,
      selectedEmployeeId,
      selectedAccessories,
      deliveryNotes,
      itStaffName
    );

    // Open view or sign right away
    setShowNewAssignmentModal(false);
    setSelectedAssignmentForView(newAsg);
    setEmployeeSearchQuery('');
    setIsEmployeeDropdownOpen(false);
    setAssetSearchQuery('');
    if (onClearPreselections) onClearPreselections();
  };

  const handleSaveSignature = () => {
    if (!signingAssignment) return;
    if (!capturedEmployeeSignature) {
      alert('Por favor trace la firma del colaborador en el recuadro antes de guardar.');
      return;
    }

    signResponsiva(signingAssignment.id, capturedEmployeeSignature, capturedItSignature);
    confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
    setSigningAssignment(null);
    setSelectedAssignmentForView(assignments.find(a => a.id === signingAssignment.id) || null);
  };

  const handleConfirmReturn = () => {
    if (!returnAssignmentModal) return;
    returnAsset(returnAssignmentModal.id, returnCondition, returnNotes, returnBranchId);
    setReturnAssignmentModal(null);
  };

  const handleAddAccessory = () => {
    if (customAccessory.trim() && !selectedAccessories.includes(customAccessory.trim())) {
      setSelectedAccessories([...selectedAccessories, customAccessory.trim()]);
      setCustomAccessory('');
    }
  };

  const handleRemoveAccessory = (acc: string) => {
    setSelectedAccessories(selectedAccessories.filter(a => a !== acc));
  };

  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [printFeedbackMsg, setPrintFeedbackMsg] = useState<string | null>(null);

  const showPrintNotification = (msg: string) => {
    setPrintFeedbackMsg(msg);
    setTimeout(() => setPrintFeedbackMsg(null), 4000);
  };

  const handlePrintDocument = () => {
    if (selectedAssignmentForView) {
      const asg = selectedAssignmentForView;
      const asset = assets.find(a => a.id === asg.assetId);
      const emp = employees.find(e => e.id === asg.employeeId);
      const branch = branches.find(b => b.id === emp?.branchId);
      const html = buildResponsivaPrintHtml(asg, asset, emp, branch);
      showPrintNotification('Abriendo cuadro de diálogo de impresión...');
      executePrintDialog(html);
    } else {
      window.print();
    }
  };

  const handleDownloadPdfAndPrint = async () => {
    if (!selectedAssignmentForView) return;
    setIsExportingPdf(true);
    showPrintNotification('Generando archivo PDF y abriendo diálogo de impresión...');
    const asg = selectedAssignmentForView;
    const asset = assets.find(a => a.id === asg.assetId);
    const emp = employees.find(e => e.id === asg.employeeId);
    const branch = branches.find(b => b.id === emp?.branchId);
    await exportResponsivaToPDF('printable-responsiva-sheet', asg, asset, emp, branch, true);
    setIsExportingPdf(false);
  };

  const handleDownloadPdfOnly = async () => {
    if (!selectedAssignmentForView) return;
    setIsExportingPdf(true);
    showPrintNotification('Descargando archivo PDF en su equipo...');
    const asg = selectedAssignmentForView;
    const asset = assets.find(a => a.id === asg.assetId);
    const emp = employees.find(e => e.id === asg.employeeId);
    const branch = branches.find(b => b.id === emp?.branchId);
    await exportResponsivaToPDF('printable-responsiva-sheet', asg, asset, emp, branch, false);
    setIsExportingPdf(false);
  };

  const handleQuickExportRow = async (asg: Assignment) => {
    const asset = assets.find(a => a.id === asg.assetId);
    const emp = employees.find(e => e.id === asg.employeeId);
    const branch = branches.find(b => b.id === emp?.branchId);
    showPrintNotification(`Descargando PDF y abriendo impresión de ${asg.folioResponsiva}...`);
    await exportResponsivaToPDF('printable-responsiva-sheet', asg, asset, emp, branch, true);
  };

  const handleSendResponsivaByGmail = async (asg: Assignment) => {
    const asset = assets.find(a => a.id === asg.assetId);
    const emp = employees.find(e => e.id === asg.employeeId);
    if (!emp || !asset) return;

    if (!isGmailConnected) {
      const success = await connectGoogle();
      if (!success) {
        showPrintNotification('Inicie sesión con su cuenta Google para enviar la carta responsiva vía Gmail.');
        return;
      }
    }

    const htmlBody = EmailTemplates.responsivaDelivery({
      employeeName: emp.fullName,
      employeeEmail: emp.email,
      folio: asg.folioResponsiva,
      assignedDate: formatDate(asg.assignedDate),
      assetTag: asset.assetTag,
      assetBrandModel: `${asset.brand} ${asset.model}`,
      serialNumber: asset.serialNumber,
      category: asset.category,
      condition: asset.physicalCondition,
      accessories: asg.accessoriesDelivered,
      itStaffName: asg.itStaffName || currentUser.name
    });

    const summary = `Destinatario: ${emp.fullName} <${emp.email}>\nAsunto: [Petroil TI] Asignación de Equipo y Carta Responsiva - Folio ${asg.folioResponsiva}\nEquipo: [${asset.assetTag}] ${asset.brand} ${asset.model}\nSerie: ${asset.serialNumber}`;

    setIsSendingGmail(true);
    const res = await sendEmailWithConfirmation(
      {
        to: emp.email,
        subject: `[Petroil TI] Asignación de Equipo y Carta Responsiva - Folio ${asg.folioResponsiva}`,
        htmlBody
      },
      summary
    );
    setIsSendingGmail(false);

    if (res.success) {
      confetti({ particleCount: 70, spread: 60 });
      showPrintNotification(`¡Carta Responsiva ${asg.folioResponsiva} enviada a ${emp.email} vía Gmail!`);
    } else if (res.error && !res.error.includes('cancelada')) {
      showPrintNotification(`Error al enviar por Gmail: ${res.error}`);
    }
  };


  return (
    <div className="space-y-5">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs no-print">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Asignaciones & Cartas Responsivas de Equipo
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Generación y control de responsivas con firma electrónica digital, inventario de accesorios y validez legal.
          </p>
        </div>

        <button
          onClick={() => {
            if (!canEdit) {
              showPrintNotification('Acceso Denegado (Perfil Visor): Su usuario tiene permisos de solo lectura. Para generar nuevas asignaciones o firmar responsivas se requiere perfil Edición Total o Administrador TI.');
              return;
            }
            setSelectedAssetId(preselectedAsset?.id || '');
            setSelectedEmployeeId(preselectedEmployee?.id || '');
            setShowNewAssignmentModal(true);
          }}
          className={`px-4 py-2.5 rounded-xl font-semibold text-xs transition-colors shadow-sm flex items-center gap-2 self-start sm:self-auto ${
            canEdit 
              ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 cursor-pointer' 
              : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-300'
          }`}
          title={canEdit ? 'Generar nueva asignación' : 'Bloqueado en modo Visor (Solo lectura)'}
        >
          {canEdit ? <Plus className="w-4 h-4" /> : <Lock className="w-4 h-4 text-amber-600" />}
          <span>Nueva Asignación / Carta Responsiva</span>
          {!canEdit && (
            <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-medium">
              Solo Lectura
            </span>
          )}
        </button>
      </div>

      {printFeedbackMsg && (
        <div className="p-3 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-xl text-xs flex items-center justify-between no-print animate-in fade-in shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="font-semibold">{printFeedbackMsg}</span>
          </div>
          <span className="text-[11px] text-indigo-700">Listo</span>
        </div>
      )}

      {/* Search & Filter */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-3 text-xs no-print">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por folio responsiva (RESP-2026-...), serie, activo, o colaborador..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-900 bg-white placeholder:text-slate-400 focus:border-[#ff8200] focus:ring-2 focus:ring-[#ff8200]/20 outline-hidden caret-[#ff8200]"
          />
        </div>

        <div className="flex items-center gap-3 text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            {assignments.filter(a => a.employeeSignatureUrl).length} Firmadas
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            {assignments.filter(a => !a.employeeSignatureUrl).length} Pendientes
          </span>
        </div>
      </div>

      {/* Assignments Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden no-print">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Folio Responsiva</th>
                <th className="py-3 px-4">Equipo Asignado</th>
                <th className="py-3 px-4">Colaborador en Resguardo</th>
                <th className="py-3 px-4">Fecha Asignación</th>
                <th className="py-3 px-4">Firma Digital</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAssignments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No se encontraron cartas responsivas con el criterio de búsqueda.
                  </td>
                </tr>
              ) : (
                filteredAssignments.map(asg => {
                  const asset = assets.find(a => a.id === asg.assetId);
                  const emp = employees.find(e => e.id === asg.employeeId);
                  const isSigned = Boolean(asg.employeeSignatureUrl);

                  return (
                    <tr key={asg.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-700 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-indigo-600" />
                          <span>{asg.folioResponsiva}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {asset ? (
                          <div>
                            <p className="font-semibold text-slate-900">{asset.brand} {asset.model}</p>
                            <p className="text-[11.5px] font-mono text-slate-700 font-medium">
                              TAG: <strong className="text-[#004a99]">{asset.assetTag}</strong> • S/N: <strong className="text-slate-800">{asset.serialNumber}</strong>
                            </p>
                          </div>
                        ) : (
                          <span className="text-slate-600 font-semibold">Activo retirado</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {emp ? (
                          <div>
                            <p className="font-bold text-slate-900">{emp.fullName}</p>
                            <p className="text-[11.5px] text-slate-700 font-medium">{emp.position} ({emp.department})</p>
                          </div>
                        ) : (
                          <span className="text-slate-600 font-semibold">Colaborador no encontrado</span>
                        )}
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-800 font-semibold whitespace-nowrap">
                        {formatDate(asg.assignedDate)}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        {isSigned ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> Firmada
                          </span>
                        ) : (
                          <button
                            onClick={() => setSigningAssignment(asg)}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-400 px-2.5 py-0.5 rounded-full transition-colors cursor-pointer"
                          >
                            <PenTool className="w-3.5 h-3.5 text-amber-700" /> Firmar Ahora
                          </button>
                        )}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          asg.status === 'activa' ? 'bg-blue-100 text-blue-900 border border-blue-300' : 'bg-slate-200 text-slate-800'
                        }`}>
                          {asg.status === 'activa' ? 'Vigente' : 'Devuelta'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleSendResponsivaByGmail(asg)}
                            className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-xs transition-colors flex items-center gap-1"
                            title="Enviar carta responsiva a la cuenta Gmail del colaborador"
                          >
                            <Mail className="w-3.5 h-3.5" /> Gmail
                          </button>

                          <button
                            onClick={() => handleQuickExportRow(asg)}
                            className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors flex items-center gap-1 shadow-xs"
                            title="Descargar archivo PDF y abrir cuadro de impresión"
                          >
                            <Download className="w-3.5 h-3.5" /> PDF & Imprimir
                          </button>

                          <button
                            onClick={() => setSelectedAssignmentForView(asg)}
                            className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs transition-colors flex items-center gap-1"
                            title="Ver formato oficial completo"
                          >
                            <FileText className="w-3.5 h-3.5" /> Ver Formato
                          </button>

                          {asg.status === 'activa' && (
                            <button
                              onClick={() => setReturnAssignmentModal(asg)}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition-colors flex items-center gap-1"
                              title="Registrar devolución de equipo al almacén"
                            >
                              <RotateCcw className="w-3 h-3" /> Devolución
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable Official Carta Responsiva Modal */}
      {selectedAssignmentForView && (() => {
        const asg = selectedAssignmentForView;
        const asset = assets.find(a => a.id === asg.assetId);
        const emp = employees.find(e => e.id === asg.employeeId);
        const branch = branches.find(b => b.id === emp?.branchId);

        return (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-300 overflow-hidden max-h-[95vh] flex flex-col animate-in fade-in zoom-in-95 printable-document">
              
              {/* Modal Toolbar (hidden when printing) */}
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between no-print">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-400" />
                  <div>
                    <span className="font-mono text-xs text-indigo-300 font-bold">{asg.folioResponsiva}</span>
                    <h3 className="font-bold text-sm">Carta Responsiva de Asignación de Equipo</h3>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!asg.employeeSignatureUrl && (
                    <button
                      onClick={() => {
                        setSelectedAssignmentForView(null);
                        setSigningAssignment(asg);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <PenTool className="w-3.5 h-3.5" />
                      Capturar Firma
                    </button>
                  )}

                  <button
                    onClick={handleDownloadPdfAndPrint}
                    disabled={isExportingPdf}
                    className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-400 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                    title="Descarga el archivo PDF y abre automáticamente el cuadro de impresión"
                  >
                    {isExportingPdf ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Generando PDF...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        <span>Descargar PDF & Imprimir</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleSendResponsivaByGmail(asg)}
                    disabled={isSendingGmail}
                    className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                    title="Enviar acuse oficial y carta responsiva al correo Gmail del colaborador"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>{isSendingGmail ? 'Enviando...' : 'Enviar por Gmail'}</span>
                  </button>

                  <button
                    onClick={handleDownloadPdfOnly}
                    disabled={isExportingPdf}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs flex items-center gap-1.5 transition-colors hidden sm:flex"
                    title="Solo descargar el archivo PDF a su computadora"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-400" />
                    <span>Solo PDF</span>
                  </button>

                  <button
                    onClick={handlePrintDocument}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs flex items-center gap-1.5 transition-colors"
                    title="Abrir cuadro de impresión del navegador"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-400" />
                    <span>Imprimir</span>
                  </button>

                  <button
                    onClick={() => setSelectedAssignmentForView(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Official Printable Sheet Layout */}
              <div id="printable-responsiva-sheet" className="p-8 sm:p-12 overflow-y-auto flex-1 text-slate-900 bg-white font-sans text-xs leading-relaxed space-y-6">
                
                {/* Header */}
                <div className="border-b-2 border-slate-900 pb-5 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-black tracking-tight text-slate-950 font-mono">PETROIL CORP</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-slate-900 text-white">
                        DIRECCIÓN DE TI
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      SISTEMA INSTITUCIONAL DE CONTROL Y RESGUARDO DE ACTIVOS INFORMÁTICOS
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Sede: {branch?.name || 'Corporativo Central'} • {branch?.city || 'México'}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">FOLIO OFICIAL</span>
                    <span className="text-base font-mono font-black text-indigo-900 tracking-wider">
                      {asg.folioResponsiva}
                    </span>
                    <span className="text-[11px] text-slate-500 block mt-1">
                      Fecha de Entrega: <strong>{formatDate(asg.assignedDate)}</strong>
                    </span>
                  </div>
                </div>

                {/* Title */}
                <div className="text-center py-2">
                  <h1 className="text-base font-bold uppercase tracking-wide text-slate-900 underline decoration-indigo-600 decoration-2 underline-offset-4">
                    Carta Responsiva de Asignación y Uso de Equipo de Cómputo
                  </h1>
                </div>

                {/* Employee Info Block */}
                <div className="border border-slate-300 rounded-lg p-4 bg-slate-50/50 space-y-2">
                  <h4 className="font-bold uppercase tracking-wider text-[10px] text-slate-500 border-b border-slate-200 pb-1">
                    1. Datos Generales del Colaborador Asignado
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px]">No. Empleado:</span>
                      <strong className="font-mono text-slate-900">{emp?.employeeNumber}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Nombre Completo:</span>
                      <strong className="text-slate-900">{emp?.fullName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Puesto / Cargo:</span>
                      <span className="text-slate-800">{emp?.position}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Departamento:</span>
                      <span className="text-slate-800">{emp?.department}</span>
                    </div>
                  </div>
                </div>

                {/* Hardware Asset Specs Block */}
                <div className="border border-slate-300 rounded-lg p-4 bg-slate-50/50 space-y-2">
                  <h4 className="font-bold uppercase tracking-wider text-[10px] text-slate-500 border-b border-slate-200 pb-1">
                    2. Descripción del Equipo Asignado
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Placa de Inventario (Asset Tag):</span>
                      <strong className="font-mono text-indigo-900 text-sm">{asset?.assetTag}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Número de Serie (S/N):</span>
                      <strong className="font-mono text-slate-900">{asset?.serialNumber}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Equipo:</span>
                      <strong className="text-slate-900">{asset?.brand} {asset?.model}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Procesador:</span>
                      <span className="text-slate-800">{asset?.specs.cpu || 'Estándar'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Memoria RAM:</span>
                      <span className="text-slate-800">{asset?.specs.ram}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Almacenamiento:</span>
                      <span className="text-slate-800">{asset?.specs.storage}</span>
                    </div>
                  </div>
                </div>

                {/* Peripherals & Accessories Delivered */}
                <div className="border border-slate-300 rounded-lg p-4 space-y-2">
                  <h4 className="font-bold uppercase tracking-wider text-[10px] text-slate-500 border-b border-slate-200 pb-1">
                    3. Accesorios y Periféricos Entregados
                  </h4>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {asg.accessoriesDelivered.map((item, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-slate-800">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  {asg.conditionNotes && (
                    <p className="text-[11px] text-slate-600 pt-2 border-t border-slate-100 italic">
                      Condiciones de entrega: {asg.conditionNotes}
                    </p>
                  )}
                </div>

                {/* Legal & Policy Clauses */}
                <div className="space-y-2 text-[10px] text-slate-600 text-justify leading-relaxed border-t border-slate-200 pt-3">
                  <h4 className="font-bold uppercase tracking-wider text-[10px] text-slate-700">
                    4. Cláusulas y Términos de Resguardo
                  </h4>
                  <p>
                    <strong>PRIMERA (PROPIEDAD):</strong> El equipo de cómputo y accesorios descritos son propiedad exclusiva de la empresa y se entregan al colaborador en calidad de herramienta de trabajo para el desempeño de sus funciones laborales.
                  </p>
                  <p>
                    <strong>SEGUNDA (CUSTODIA Y MANTENIMIENTO):</strong> El colaborador se compromete a mantener el equipo en buen estado físico y funcional, reportar de inmediato cualquier anomalía o daño al área de Tecnologías de Información, y presentar el equipo obligatoriamente para sus mantenimientos preventivos periódicos programados.
                  </p>
                  <p>
                    <strong>TERCERA (SEGURIDAD Y SOFTWARE):</strong> Queda estrictamente prohibida la instalación de software no autorizado, modificación de parámetros de seguridad, o transferencia del equipo a terceras personas sin autorización por escrito del departamento de TI.
                  </p>
                  <p>
                    <strong>CUARTA (DEVOLUCIÓN):</strong> En caso de terminación de la relación laboral, cambio de puesto o cuando la empresa lo requiera, el colaborador entregará el equipo y todos sus accesorios en las mismas condiciones en que fueron recibidos, salvo el desgaste natural por su uso legítimo.
                  </p>
                </div>

                {/* Signatures Section */}
                <div className="pt-6 border-t-2 border-slate-900 grid grid-cols-2 gap-8 text-center">
                  
                  {/* Employee Signature */}
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] uppercase font-bold text-slate-500 mb-2">
                      RECIBÍ DE CONFORMIDAD (COLABORADOR)
                    </span>
                    <div className="w-64 h-24 border border-slate-300 rounded bg-slate-50 flex items-center justify-center overflow-hidden">
                      {asg.employeeSignatureUrl ? (
                        <img src={asg.employeeSignatureUrl} alt="Firma del colaborador" className="max-h-full max-w-full object-contain" />
                      ) : (
                        <span className="text-[11px] text-amber-600 font-medium">Pendiente de firma digital</span>
                      )}
                    </div>
                    <p className="font-bold text-slate-900 mt-2 text-xs">{emp?.fullName}</p>
                    <p className="text-[10px] text-slate-500">{emp?.position}</p>
                    {asg.signedAt && (
                      <span className="text-[9px] text-slate-400 font-mono mt-0.5">
                        Firmado digitalmente: {formatDateTime(asg.signedAt)}
                      </span>
                    )}
                  </div>

                  {/* IT Staff Signature */}
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] uppercase font-bold text-slate-500 mb-2">
                      ENTREGÓ POR TECNOLOGÍAS DE INFORMACIÓN
                    </span>
                    <div className="w-64 h-24 border border-slate-300 rounded bg-slate-50 flex items-center justify-center overflow-hidden">
                      {asg.itStaffSignatureUrl ? (
                        <img src={asg.itStaffSignatureUrl} alt="Firma de TI" className="max-h-full max-w-full object-contain" />
                      ) : (
                        <div className="text-center">
                          <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
                          <span className="text-[10px] text-slate-500 block">Autorizado Digitalmente</span>
                        </div>
                      )}
                    </div>
                    <p className="font-bold text-slate-900 mt-2 text-xs">{asg.itStaffName}</p>
                    <p className="text-[10px] text-slate-500">Responsable de Inventario y Soporte TI</p>
                  </div>

                </div>

              </div>
            </div>
          </div>
        );
      })()}

      {/* Signature Capture Modal */}
      {signingAssignment && (() => {
        const asg = signingAssignment;
        const emp = employees.find(e => e.id === asg.employeeId);
        const asset = assets.find(a => a.id === asg.assetId);

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                <div>
                  <p className="text-xs text-indigo-300 font-mono">Firma Electrónica de Carta Responsiva</p>
                  <h3 className="font-bold text-sm text-white">Folio: {asg.folioResponsiva}</h3>
                </div>
                <button onClick={() => setSigningAssignment(null)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <p><strong>Colaborador:</strong> {emp?.fullName} ({emp?.department})</p>
                  <p><strong>Equipo:</strong> {asset?.brand} {asset?.model} (Placa: {asset?.assetTag})</p>
                </div>

                <DigitalSignaturePad
                  label="Firma de Conformidad del Colaborador"
                  signerName={emp?.fullName}
                  onSave={(dataUrl) => setCapturedEmployeeSignature(dataUrl)}
                />

                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <input type="checkbox" id="accept-terms" defaultChecked className="rounded text-indigo-600" />
                  <label htmlFor="accept-terms">
                    Declaro haber recibido el equipo en óptimas condiciones y acepto las cláusulas de custodia.
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                  <button
                    onClick={() => setSigningAssignment(null)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveSignature}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs"
                  >
                    Guardar Firma y Validar Responsiva
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* New Assignment Modal */}
      {showNewAssignmentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-sm">Crear Asignación & Generar Carta Responsiva</h3>
              </div>
              <button 
                onClick={() => {
                  setShowNewAssignmentModal(false);
                  setEmployeeSearchQuery('');
                  setIsEmployeeDropdownOpen(false);
                  setAssetSearchQuery('');
                  if (onClearPreselections) onClearPreselections();
                }}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="p-6 overflow-y-auto space-y-4 text-sm">
              
              {/* Asset selection */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700 text-xs sm:text-[13px]">
                    1. Seleccione Equipo Disponible del Almacén *
                  </label>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {availableAssets.length} disponibles
                  </span>
                </div>

                {availableAssets.length > 5 && (
                  <div className="relative mb-2">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Filtrar equipos por etiqueta, marca, modelo, serie o procesador..."
                      value={assetSearchQuery}
                      onChange={(e) => setAssetSearchQuery(e.target.value)}
                      className="w-full pl-8.5 pr-7 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white text-slate-800 focus:ring-2 focus:ring-[#ff8200]/20 focus:border-[#ff8200] outline-hidden placeholder:text-slate-400"
                    />
                    {assetSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setAssetSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}

                <select
                  required
                  value={selectedAssetId}
                  onChange={(e) => setSelectedAssetId(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl bg-white text-slate-900 text-sm font-medium focus:ring-2 focus:ring-[#ff8200]/20 focus:border-[#ff8200] outline-hidden cursor-pointer"
                >
                  <option value="">-- Seleccionar Equipo Disponible --</option>
                  {filteredAvailableAssets.map(a => (
                    <option key={a.id} value={a.id}>
                      [{a.assetTag}] {a.brand} {a.model} - S/N: {a.serialNumber} ({a.specs.ram}, {a.specs.storage})
                    </option>
                  ))}
                </select>
                {availableAssets.length === 0 && (
                  <p className="text-[11px] text-amber-600 mt-1">
                    No hay equipos con estado "En Almacén / Disponible". Registre uno nuevo o retorne un equipo.
                  </p>
                )}
              </div>

              {/* Employee selection with live auto-search */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700 text-xs sm:text-[13px]">
                    2. Seleccione Colaborador Destinatario *
                  </label>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {employees.length} colaboradores registrados
                  </span>
                </div>

                <div className="relative" ref={employeeDropdownRef}>
                  <div className="relative flex items-center">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                    <input
                      ref={employeeInputRef}
                      type="text"
                      value={employeeSearchQuery}
                      onChange={(e) => {
                        setEmployeeSearchQuery(e.target.value);
                        setIsEmployeeDropdownOpen(true);
                      }}
                      onFocus={() => setIsEmployeeDropdownOpen(true)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (filteredEmployeesForAssignment.length > 0) {
                            setSelectedEmployeeId(filteredEmployeesForAssignment[0].id);
                            setIsEmployeeDropdownOpen(false);
                            setEmployeeSearchQuery('');
                          }
                        } else if (e.key === 'Escape') {
                          setIsEmployeeDropdownOpen(false);
                        }
                      }}
                      placeholder="Teclee nombre, # nómina, puesto, departamento o correo..."
                      className="w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-xl bg-white text-slate-900 text-sm font-medium focus:ring-2 focus:ring-[#ff8200]/20 focus:border-[#ff8200] outline-hidden placeholder:text-slate-400 shadow-2xs"
                    />
                    {employeeSearchQuery ? (
                      <button
                        type="button"
                        onClick={() => {
                          setEmployeeSearchQuery('');
                          setIsEmployeeDropdownOpen(true);
                          employeeInputRef.current?.focus();
                        }}
                        className="absolute right-3 p-1 text-slate-400 hover:text-slate-600 rounded-md cursor-pointer"
                        title="Borrar búsqueda"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsEmployeeDropdownOpen(prev => !prev)}
                        className="absolute right-3 p-1 text-slate-400 hover:text-slate-600 rounded-md cursor-pointer"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Dropdown list */}
                  {isEmployeeDropdownOpen && (
                    <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-slate-300 rounded-xl shadow-2xl max-h-64 overflow-y-auto divide-y divide-slate-100 animate-in fade-in zoom-in-95">
                      <div className="p-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium sticky top-0 z-10">
                        <span>
                          {filteredEmployeesForAssignment.length} {filteredEmployeesForAssignment.length === 1 ? 'resultado encontrado' : 'resultados encontrados'}
                        </span>
                        {employeeSearchQuery ? (
                          <span className="text-[#004a99] font-bold">
                            Filtro: "{employeeSearchQuery}"
                          </span>
                        ) : (
                          <span className="text-slate-400">
                            Mostrando todos (teclee para filtrar)
                          </span>
                        )}
                      </div>

                      {filteredEmployeesForAssignment.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-500 space-y-1">
                          <p className="font-semibold text-slate-700">No se encontraron colaboradores</p>
                          <p className="text-[11px] text-slate-400">
                            No hay coincidencias con "{employeeSearchQuery}". Intente con otro término o número de nómina.
                          </p>
                        </div>
                      ) : (
                        filteredEmployeesForAssignment.map(emp => {
                          const isSelected = emp.id === selectedEmployeeId;
                          return (
                            <button
                              key={emp.id}
                              type="button"
                              onClick={() => {
                                setSelectedEmployeeId(emp.id);
                                setEmployeeSearchQuery('');
                                setIsEmployeeDropdownOpen(false);
                              }}
                              className={`w-full p-2.5 text-left flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                                isSelected ? 'bg-blue-50/90 text-blue-900' : 'hover:bg-slate-50 text-slate-800'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                  isSelected ? 'bg-[#004a99] text-white' : 'bg-slate-200 text-slate-700'
                                }`}>
                                  {emp.fullName.split(' ').map(n => n[0]).slice(0, 2).join('')}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-bold text-xs text-slate-900">{emp.fullName}</span>
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                      Nómina #{emp.employeeNumber}
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-slate-500 truncate">
                                    <span className="text-slate-700 font-medium">{emp.position}</span> • {emp.department}
                                    {emp.email && <span className="ml-1 text-slate-400">• {emp.email}</span>}
                                  </div>
                                </div>
                              </div>
                              {isSelected ? (
                                <Check className="w-4 h-4 text-[#004a99] shrink-0" />
                              ) : (
                                <span className="text-[10px] text-slate-400 hover:text-slate-600 font-medium shrink-0">
                                  Seleccionar
                                </span>
                              )}
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}

                  {/* Selected Collaborator Confirmation Card */}
                  {selectedEmployee && (
                    <div className="mt-2.5 p-3 bg-blue-50/80 border border-blue-200 rounded-xl flex items-center justify-between gap-3 animate-in fade-in">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-[#004a99] text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                          {selectedEmployee.fullName.split(' ').map(n => n[0]).slice(0, 2).join('')}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-xs text-slate-900">{selectedEmployee.fullName}</span>
                            <span className="px-2 py-0.5 rounded-md bg-blue-100 text-[#004a99] font-mono text-[11px] font-bold">
                              Nómina #{selectedEmployee.employeeNumber}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-800 bg-emerald-100/80 border border-emerald-300 px-1.5 py-0.5 rounded font-bold">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Colaborador Seleccionado
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-600 truncate mt-0.5">
                            <span className="font-semibold text-slate-800">{selectedEmployee.position}</span> • {selectedEmployee.department}
                            {selectedEmployee.email && <span className="text-slate-500"> ({selectedEmployee.email})</span>}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedEmployeeId('');
                          setEmployeeSearchQuery('');
                          setIsEmployeeDropdownOpen(true);
                          setTimeout(() => employeeInputRef.current?.focus(), 50);
                        }}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-xs font-semibold shrink-0 transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                        title="Quitar selección y buscar otro colaborador"
                      >
                        <RotateCcw className="w-3 h-3 text-slate-500" />
                        Cambiar
                      </button>
                    </div>
                  )}

                  {!selectedEmployee && (
                    <p className="text-[11px] text-amber-700 mt-1.5 flex items-center gap-1 font-medium">
                      <span>* Teclee en el recuadro superior para buscar y seleccionar al colaborador</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Accessories delivered */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1 text-xs sm:text-[13px]">
                  3. Accesorios y Periféricos Incluidos en la Entrega:
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {selectedAccessories.map((acc, idx) => (
                    <span 
                      key={idx} 
                      className="px-3 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200 text-xs font-medium flex items-center gap-1.5"
                    >
                      {acc}
                      <button 
                        type="button" 
                        onClick={() => handleRemoveAccessory(acc)}
                        className="text-slate-400 hover:text-rose-600 font-bold cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Agregar otro accesorio (ej: Candado Kensington, Adaptador HDMI)..."
                    value={customAccessory}
                    onChange={(e) => setCustomAccessory(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 text-sm font-medium border border-slate-300 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-[#ff8200]/20 focus:border-[#ff8200] outline-hidden caret-[#ff8200]"
                  />
                  <button
                    type="button"
                    onClick={handleAddAccessory}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm rounded-xl font-semibold cursor-pointer transition-colors"
                  >
                    Agregar
                  </button>
                </div>
              </div>

              {/* Delivery notes */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1 text-xs sm:text-[13px]">Observaciones / Condiciones Físicas:</label>
                <textarea
                  rows={2}
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  className="w-full p-3.5 border border-slate-300 rounded-xl text-sm leading-relaxed text-slate-900 bg-white focus:ring-2 focus:ring-[#ff8200]/20 focus:border-[#ff8200] outline-hidden caret-[#ff8200]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewAssignmentModal(false);
                    setEmployeeSearchQuery('');
                    setIsEmployeeDropdownOpen(false);
                    setAssetSearchQuery('');
                    if (onClearPreselections) onClearPreselections();
                  }}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                >
                  Generar Folio y Responsiva
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Return Asset Modal */}
      {returnAssignmentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-sm">Registrar Devolución de Equipo</h3>
              </div>
              <button onClick={() => setReturnAssignmentModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-600">
                Al confirmar la devolución, el equipo reingresará al stock disponible de almacén y se registrará en la trazabilidad.
              </p>

              <div>
                <label className="font-semibold text-slate-700 block mb-1 text-xs sm:text-[13px]">Almacén / Sede de Devolución: *</label>
                <select
                  value={returnBranchId}
                  onChange={(e) => setReturnBranchId(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl bg-white text-slate-900 text-sm font-medium focus:ring-2 focus:ring-[#ff8200]/20 focus:border-[#ff8200] outline-hidden cursor-pointer"
                >
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.city}) {b.isMainWarehouse ? '★ Hub Central' : ''}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  El equipo quedará registrado como disponible en esta ubicación.
                </p>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1 text-xs sm:text-[13px]">Estado Físico al Devolver:</label>
                <select
                  value={returnCondition}
                  onChange={(e) => setReturnCondition(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl bg-white text-slate-900 text-sm font-medium focus:ring-2 focus:ring-[#ff8200]/20 focus:border-[#ff8200] outline-hidden cursor-pointer"
                >
                  <option value="excelente">Excelente (Sin detalles cosméticos)</option>
                  <option value="bueno">Bueno (Desgaste natural de uso)</option>
                  <option value="regular">Regular (Rayones o golpes leves)</option>
                  <option value="dañado">Dañado (Requiere reparación en taller)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1 text-xs sm:text-[13px]">Notas de Recepción:</label>
                <textarea
                  rows={3}
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  className="w-full p-3.5 border border-slate-300 rounded-xl text-sm leading-relaxed text-slate-900 bg-white focus:ring-2 focus:ring-[#ff8200]/20 focus:border-[#ff8200] outline-hidden caret-[#ff8200]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  onClick={() => setReturnAssignmentModal(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmReturn}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                >
                  Confirmar Retorno al Almacén
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
