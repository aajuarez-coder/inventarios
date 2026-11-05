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
  Briefcase,
  ExternalLink,
  AlertCircle,
  Send,
  Zap
} from 'lucide-react';
import { formatDate, formatDateTime } from '../utils/formatters';
import { DigitalSignaturePad } from './DigitalSignaturePad';
import { exportResponsivaToPDF, buildResponsivaPrintHtml, executePrintDialog } from '../utils/generatePdf';
import { useGmail } from '../context/GmailContext';
import { EmailTemplates } from '../services/gmailService';
import { EmployeeSearchSelect } from './common/EmployeeSearchSelect';
import { AssetSearchSelect } from './common/AssetSearchSelect';
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
    companies,
    createAssignment, 
    signResponsiva, 
    returnAsset, 
    sendResponsivaEmailAlert,
    currentUser,
    canEdit,
    isViewer
  } = useInventory();

  const {
    isConnected: isGmailConnected,
    connectGoogle,
    sendEmailWithConfirmation,
    sendDirectEmail,
    gmailProfile,
    isConnecting: isConnectingGmail
  } = useGmail();

  const [search, setSearch] = useState('');
  const [isSendingGmail, setIsSendingGmail] = useState(false);
  const [selectedAssignmentForView, setSelectedAssignmentForView] = useState<Assignment | null>(null);
  const [showNewAssignmentModal, setShowNewAssignmentModal] = useState(Boolean(preselectedAsset || preselectedEmployee));
  const [signingAssignment, setSigningAssignment] = useState<Assignment | null>(null);
  const [returnAssignmentModal, setReturnAssignmentModal] = useState<Assignment | null>(null);

  // Responsiva Email Modal state
  const [emailModalAssignment, setEmailModalAssignment] = useState<Assignment | null>(null);
  const [emailRecipient, setEmailRecipient] = useState('');
  const [emailCc, setEmailCc] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailCustomNotes, setEmailCustomNotes] = useState('');
  const [emailDispatchStatus, setEmailDispatchStatus] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

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

  const handleOpenResponsivaEmailModal = (asg: Assignment) => {
    const asset = assets.find(a => a.id === asg.assetId);
    const emp = employees.find(e => e.id === asg.employeeId);
    setEmailModalAssignment(asg);
    setEmailRecipient(emp?.email || '');
    setEmailCc('soporte-ti@petroil.com.mx');
    setEmailSubject(`[Petroil TI] Carta Responsiva Oficial de Entrega de Equipo - Folio ${asg.folioResponsiva} (${asset?.assetTag || 'TI'})`);
    setEmailCustomNotes(asg.conditionNotes || '');
    setEmailDispatchStatus(null);
  };

  const handleSendResponsivaByGmail = (asg: Assignment) => {
    handleOpenResponsivaEmailModal(asg);
  };

  const webGmailResponsivaUrl = useMemo(() => {
    if (!emailModalAssignment) return '';
    const asg = emailModalAssignment;
    const asset = assets.find(a => a.id === asg.assetId);
    const emp = employees.find(e => e.id === asg.employeeId);
    const chargerText = (asset?.chargerSerial || asset?.chargerInfo?.serialNumber)
      ? `\n• Cargador Original Serie: ${asset?.chargerSerial || asset?.chargerInfo?.serialNumber} (${asset?.chargerBrand || asset?.chargerInfo?.brand || ''} ${asset?.chargerModel || asset?.chargerInfo?.model || ''})`
      : '';
    const specsText = (asset?.specs?.cpu || asset?.specs?.ram || asset?.specs?.storage)
      ? `\n• Especificaciones: ${asset?.specs?.cpu || ''} / ${asset?.specs?.ram || ''} RAM / ${asset?.specs?.storage || ''}`
      : '';

    const bodyText = `Estimado(a) ${emp?.fullName || 'Colaborador(a)'},\n\nPor medio del presente correo institucional, el Departamento de Tecnologías de la Información le hace entrega formal del siguiente activo informático bajo su resguardo:\n\n• Folio Oficial: ${asg.folioResponsiva}\n• Placa / Asset Tag: ${asset?.assetTag || 'N/A'}\n• Equipo y Modelo: ${asset?.brand || ''} ${asset?.model || ''}\n• Número de Serie (S/N): ${asset?.serialNumber || 'N/A'}\n• Categoría: ${asset?.category || 'Cómputo'}${specsText}${chargerText}\n• Accesorios Entregados: ${asg.accessoriesDelivered.join(', ')}\n${emailCustomNotes ? `• Observaciones: ${emailCustomNotes}\n` : ''}\nFavor de verificar las condiciones físicas y operativas del equipo y validar la firma de su Carta Responsiva.\n\nAtentamente,\n${currentUser.name}\nTecnologías de la Información • Grupo Petroil`;

    const params = new URLSearchParams();
    params.set('view', 'cm');
    params.set('fs', '1');
    if (emailRecipient) params.set('to', emailRecipient);
    if (emailCc) params.set('cc', emailCc);
    if (emailSubject) params.set('su', emailSubject);
    params.set('body', bodyText);
    return `https://mail.google.com/mail/?${params.toString()}`;
  }, [emailModalAssignment, assets, employees, emailRecipient, emailCc, emailSubject, emailCustomNotes, currentUser.name]);

  const handleSendResponsivaViaGmailApi = async () => {
    if (!emailModalAssignment) return;
    const asg = emailModalAssignment;
    const asset = assets.find(a => a.id === asg.assetId);
    const emp = employees.find(e => e.id === asg.employeeId);
    const company = companies.find(c => c.id === emp?.companyId);
    const branch = branches.find(b => b.id === emp?.branchId);
    if (!asset) return;

    if (!emailRecipient.trim()) {
      setEmailDispatchStatus({ type: 'error', text: 'Por favor especifique el correo del destinatario.' });
      return;
    }

    setIsSendingGmail(true);
    setEmailDispatchStatus(null);

    // If not connected, connect Google
    if (!isGmailConnected) {
      const success = await connectGoogle();
      if (!success) {
        setIsSendingGmail(false);
        setEmailDispatchStatus({
          type: 'error',
          text: 'No se pudo conectar con Google. Puede usar el botón "Abrir en Gmail Web" para redactar en su navegador o "Registrar Envío Institucional".'
        });
        return;
      }
    }

    try {
      const htmlBody = EmailTemplates.responsivaDelivery({
        employeeName: emp?.fullName || 'Colaborador(a)',
        employeeEmail: emailRecipient.trim(),
        folio: asg.folioResponsiva,
        assignedDate: formatDate(asg.assignedDate),
        assetTag: asset.assetTag,
        assetBrandModel: `${asset.brand} ${asset.model}`,
        serialNumber: asset.serialNumber,
        category: asset.category,
        condition: asset.physicalCondition,
        accessories: asg.accessoriesDelivered,
        itStaffName: asg.itStaffName || currentUser.name,
        companyName: company?.name,
        branchName: branch?.name,
        specs: {
          cpu: asset.specs?.cpu,
          ram: asset.specs?.ram,
          storage: asset.specs?.storage,
          os: asset.specs?.os,
          screenSize: asset.specs?.screenSize
        },
        charger: {
          serial: asset.chargerSerial || asset.chargerInfo?.serialNumber,
          brand: asset.chargerBrand || asset.chargerInfo?.brand,
          model: asset.chargerModel || asset.chargerInfo?.model
        },
        notes: emailCustomNotes.trim() || undefined,
        isSigned: Boolean(asg.employeeSignatureUrl)
      });

      const summary = `Destinatario: ${emp?.fullName || ''} <${emailRecipient}>\nAsunto: ${emailSubject}\nEquipo: [${asset.assetTag}] ${asset.brand} ${asset.model}\nSerie: ${asset.serialNumber}`;

      const res = await sendEmailWithConfirmation(
        {
          to: emailRecipient.trim(),
          cc: emailCc.trim() || undefined,
          subject: emailSubject,
          htmlBody
        },
        summary
      );

      if (res.success) {
        confetti({ particleCount: 75, spread: 65, origin: { y: 0.6 } });
        sendResponsivaEmailAlert(asg.id, emailCustomNotes, 'gmail_api');
        setEmailDispatchStatus({
          type: 'success',
          text: `¡Carta Responsiva oficial ${asg.folioResponsiva} enviada exitosamente a ${emailRecipient} vía Gmail API!`
        });
        showPrintNotification(`Carta Responsiva ${asg.folioResponsiva} enviada a ${emailRecipient} vía Gmail.`);
        setTimeout(() => {
          setEmailModalAssignment(null);
        }, 2200);
      } else if (res.error && !res.error.includes('cancelada')) {
        setEmailDispatchStatus({ type: 'error', text: `Error al enviar por Gmail API: ${res.error}` });
      }
    } catch (err: any) {
      setEmailDispatchStatus({ type: 'error', text: err?.message || 'Error al procesar el envío de responsiva.' });
    } finally {
      setIsSendingGmail(false);
    }
  };

  const handleInstitutionalDispatchOnly = () => {
    if (!emailModalAssignment) return;
    const asg = emailModalAssignment;
    sendResponsivaEmailAlert(asg.id, emailCustomNotes, 'institucional');
    confetti({ particleCount: 50, spread: 50 });
    setEmailDispatchStatus({
      type: 'success',
      text: `Se registró formalmente el envío de la responsiva ${asg.folioResponsiva} en la bitácora institucional y auditoría TI.`
    });
    showPrintNotification(`Notificación de responsiva ${asg.folioResponsiva} registrada en bitácora.`);
    setTimeout(() => {
      setEmailModalAssignment(null);
    }, 1800);
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

                    {(asset?.chargerSerial || asset?.chargerBrand || asset?.chargerModel || asset?.chargerInfo) && (
                      <div className="col-span-2 sm:col-span-3 pt-2 mt-1 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-2 bg-amber-50/60 p-2 rounded-md">
                        <div>
                          <span className="text-amber-800 font-semibold block text-[10px]">Cargador Serie (S/N):</span>
                          <strong className="font-mono text-slate-900 text-xs">{asset.chargerSerial || asset.chargerInfo?.serialNumber || 'N/A'}</strong>
                        </div>
                        <div>
                          <span className="text-amber-800 font-semibold block text-[10px]">Marca del Cargador:</span>
                          <span className="text-slate-900 text-xs">{asset.chargerBrand || asset.chargerInfo?.brand || asset.brand}</span>
                        </div>
                        <div>
                          <span className="text-amber-800 font-semibold block text-[10px]">Modelo / Potencia:</span>
                          <span className="text-slate-900 text-xs">{asset.chargerModel || asset.chargerInfo?.model || 'Estándar'}</span>
                        </div>
                      </div>
                    )}
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
              
              {/* Asset selection with real-time auto-search typing */}
              <div>
                <AssetSearchSelect
                  label="1. Seleccione Equipo Disponible del Almacén"
                  sublabel={`${availableAssets.length} disponibles`}
                  assets={assets}
                  filterStatus={['disponible']}
                  selectedAssetId={selectedAssetId}
                  onSelectAsset={(id) => setSelectedAssetId(id)}
                  placeholder="Teclee placa, marca, modelo, serie o procesador para buscar..."
                  required
                  emptyNotice="No hay equipos con estado 'Disponible' en el inventario. Registre uno nuevo o devuelva un equipo al almacén."
                />
              </div>

              {/* Employee selection with real-time auto-search typing */}
              <div>
                <EmployeeSearchSelect
                  label="2. Seleccione Colaborador Destinatario"
                  sublabel={`${employees.length} colaboradores registrados`}
                  employees={employees}
                  selectedEmployeeId={selectedEmployeeId}
                  onSelectEmployee={(id) => setSelectedEmployeeId(id)}
                  placeholder="Teclee nombre, # nómina, puesto, departamento o correo..."
                  required
                  helperText={!selectedEmployeeId ? "* Teclee en el recuadro para filtrar y seleccionar automáticamente al colaborador" : undefined}
                />
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

      {/* Responsiva Email Modal */}
      {emailModalAssignment && (() => {
        const asg = emailModalAssignment;
        const asset = assets.find(a => a.id === asg.assetId);
        const emp = employees.find(e => e.id === asg.employeeId);
        const company = companies.find(c => c.id === emp?.companyId);
        const branch = branches.find(b => b.id === emp?.branchId);
        const isSigned = Boolean(asg.employeeSignatureUrl);
        const hasCharger = Boolean(asset?.chargerSerial || asset?.chargerInfo?.serialNumber || asset?.chargerBrand);

        return (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 no-print">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-300 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 max-h-[92vh]">
              
              {/* Header */}
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-red-600/30 text-red-400 border border-red-500/30">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-sky-400 font-bold">{asg.folioResponsiva}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isSigned ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}`}>
                        {isSigned ? 'Firmada' : 'Pendiente de Firma'}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-white">Notificar Carta Responsiva por Gmail</h3>
                  </div>
                </div>
                <button
                  onClick={() => setEmailModalAssignment(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body Form */}
              <div className="p-5 overflow-y-auto space-y-4 text-xs">
                
                {/* Feedback Status */}
                {emailDispatchStatus && (
                  <div className={`p-3 rounded-xl flex items-center gap-2 ${
                    emailDispatchStatus.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : emailDispatchStatus.type === 'error'
                      ? 'bg-rose-50 text-rose-800 border border-rose-200'
                      : 'bg-sky-50 text-sky-800 border border-sky-200'
                  }`}>
                    {emailDispatchStatus.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    )}
                    <span className="font-medium text-xs">{emailDispatchStatus.text}</span>
                  </div>
                )}

                {/* Google Connection Pill */}
                <div className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                  isGmailConnected ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' : 'bg-amber-50/70 border-amber-200 text-amber-900'
                }`}>
                  <div className="flex items-center gap-2">
                    {isGmailConnected ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    )}
                    <div>
                      <p className="font-semibold text-xs">
                        {isGmailConnected ? 'Google Workspace Conectado' : 'Cuenta de Google no conectada'}
                      </p>
                      <p className="text-[11px] opacity-80">
                        {isGmailConnected 
                          ? `Enviando desde: ${gmailProfile?.emailAddress || 'Cuenta corporativa'}`
                          : 'Puede conectar su cuenta para enviar con un clic o abrir el borrador en Gmail Web.'}
                      </p>
                    </div>
                  </div>

                  {!isGmailConnected && (
                    <button
                      type="button"
                      onClick={() => connectGoogle()}
                      disabled={isConnectingGmail}
                      className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 transition-colors shadow-xs cursor-pointer"
                    >
                      {isConnectingGmail ? 'Conectando...' : 'Conectar con Google'}
                    </button>
                  )}
                </div>

                {/* Recipient Email */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800">Para (Correo del Colaborador): *</label>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {emp ? `${emp.fullName} (${emp.position})` : ''}
                    </span>
                  </div>
                  <input
                    type="email"
                    value={emailRecipient}
                    onChange={(e) => setEmailRecipient(e.target.value)}
                    placeholder="colaborador@petroil.com.mx"
                    required
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl bg-white font-mono text-sm text-slate-900 focus:ring-2 focus:ring-[#ff8200]/25 focus:border-[#ff8200] outline-none caret-[#ff8200]"
                  />
                </div>

                {/* Cc Email */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Con Copia (Cc - Mesa de Ayuda TI):</label>
                  <input
                    type="text"
                    value={emailCc}
                    onChange={(e) => setEmailCc(e.target.value)}
                    placeholder="soporte-ti@petroil.com.mx"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl bg-white font-mono text-sm text-slate-900 focus:ring-2 focus:ring-[#ff8200]/25 focus:border-[#ff8200] outline-none caret-[#ff8200]"
                  />
                </div>

                {/* Subject */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Asunto Oficial:</label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl bg-white font-semibold text-sm text-slate-900 focus:ring-2 focus:ring-[#ff8200]/25 focus:border-[#ff8200] outline-none caret-[#ff8200]"
                  />
                </div>

                {/* Asset & Charger Preview Card */}
                {asset && (
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                        📦 Resumen del Equipo a Notificar
                      </span>
                      <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                        TAG: {asset.assetTag}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11.5px] text-slate-700">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Equipo:</span>
                        <strong className="text-slate-900">{asset.brand} {asset.model}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Número de Serie (S/N):</span>
                        <span className="font-mono text-slate-800">{asset.serialNumber}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Categoría:</span>
                        <span className="capitalize">{asset.category}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Sede / Filial:</span>
                        <span>{company?.name || 'Petroil'} • {branch?.name || 'Corporativo'}</span>
                      </div>

                      {/* Specs */}
                      {(asset.specs.cpu || asset.specs.ram || asset.specs.storage) && (
                        <div className="col-span-2 pt-1 border-t border-slate-100 flex items-center gap-2 flex-wrap text-[11px] text-slate-600">
                          {asset.specs.cpu && <span><strong>CPU:</strong> {asset.specs.cpu}</span>}
                          {asset.specs.ram && <span>• <strong>RAM:</strong> {asset.specs.ram}</span>}
                          {asset.specs.storage && <span>• <strong>Disco:</strong> {asset.specs.storage}</span>}
                          {asset.specs?.screenSize && (
                            <span>• <strong>Pantalla:</strong> {asset.specs.screenSize}</span>
                          )}
                        </div>
                      )}

                      {/* Charger info */}
                      {hasCharger && (
                        <div className="col-span-2 pt-1.5 mt-1 border-t border-amber-200/60 bg-amber-50/80 p-2 rounded-lg text-amber-900 text-[11px] flex items-center justify-between">
                          <div>
                            <span className="font-bold flex items-center gap-1 text-[10.5px]">
                              ⚡ Cargador de Corriente Oficial:
                            </span>
                            <span className="font-mono text-slate-900">
                              S/N: {asset.chargerSerial || asset.chargerInfo?.serialNumber || 'Original'}
                            </span>
                            <span className="text-slate-600 ml-1">
                              ({asset.chargerBrand || asset.chargerInfo?.brand || asset.brand} {asset.chargerModel || asset.chargerInfo?.model || ''})
                            </span>
                          </div>
                          <span className="text-[10px] bg-amber-200/60 font-semibold px-2 py-0.5 rounded text-amber-900">
                            Incluido
                          </span>
                        </div>
                      )}

                      {/* Accessories */}
                      <div className="col-span-2 pt-1 text-[11px] text-slate-600">
                        <span className="text-slate-400 block text-[10px]">Accesorios Entregados:</span>
                        <span>{asg.accessoriesDelivered.join(', ') || 'Sin accesorios adicionales'}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Additional Notes */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Instrucciones u Observaciones Adicionales (Opcional):</label>
                  <textarea
                    rows={2}
                    value={emailCustomNotes}
                    onChange={(e) => setEmailCustomNotes(e.target.value)}
                    placeholder="Ej. Favor de acudir a firmar físicamente o ingresar al portal para completar la firma digital..."
                    className="w-full p-3 border border-slate-300 rounded-xl bg-white text-slate-900 text-xs focus:ring-2 focus:ring-[#ff8200]/25 focus:border-[#ff8200] outline-none caret-[#ff8200]"
                  />
                </div>

              </div>

              {/* Footer Actions */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-[11px] text-slate-500">
                  <span>Todas las acciones registran automáticamente el acuse en la bitácora y auditoría TI.</span>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
                  
                  {/* Web Gmail Fallback */}
                  <a
                    href={webGmailResponsivaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      sendResponsivaEmailAlert(asg.id, emailCustomNotes, 'gmail_web');
                      showPrintNotification(`Borrador de responsiva ${asg.folioResponsiva} abierto en Gmail Web y registrado en auditoría.`);
                    }}
                    className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Abre la ventana oficial de redactar en mail.google.com con todos los datos y cargador precargados"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                    <span>Abrir en Gmail Web</span>
                  </a>

                  {/* Institutional Logger Fallback */}
                  <button
                    type="button"
                    onClick={handleInstitutionalDispatchOnly}
                    className="px-3 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-xs transition-colors cursor-pointer"
                    title="Registra el acuse de entrega en la bitácora de TI sin enviar por API"
                  >
                    Registrar en Bitácora TI
                  </button>

                  {/* Primary Gmail API Send */}
                  <button
                    type="button"
                    onClick={handleSendResponsivaViaGmailApi}
                    disabled={isSendingGmail || isConnectingGmail}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-xs shadow-xs cursor-pointer transition-all"
                    title="Envía el correo directamente utilizando la API oficial de Gmail"
                  >
                    {isSendingGmail ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Enviando por Gmail...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>{isGmailConnected ? 'Enviar vía Gmail API' : 'Conectar y Enviar'}</span>
                      </>
                    )}
                  </button>

                </div>
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
};
