import React, { useState, useMemo } from 'react';
import { useInventory } from '../context/InventoryContext';
import { Employee, HardwareAsset, PhysicalCondition } from '../types/inventory';
import { 
  Users, 
  UserPlus, 
  Mail, 
  Phone, 
  Building2, 
  Briefcase, 
  Laptop, 
  Search, 
  FileText, 
  CheckCircle2, 
  X,
  ExternalLink,
  Edit3,
  Trash2,
  AlertTriangle,
  Check,
  RotateCcw,
  FileSpreadsheet,
  Upload,
  Layers,
  Download,
  AlertCircle,
  Tag,
  Calendar,
  Zap,
  Eye
} from 'lucide-react';
import { formatDate } from '../utils/formatters';
import { exportEmployeesCsv } from '../utils/exportCsv';
import { ImportEmployeesModal } from './ImportEmployeesModal';
import { CustomGmailComposeModal } from './CustomGmailComposeModal';

interface EmployeesDirectoryProps {
  onAssignToEmployee: (employee: Employee) => void;
  onViewAssetDetail: (asset: HardwareAsset) => void;
}

export const EmployeesDirectory: React.FC<EmployeesDirectoryProps> = ({
  onAssignToEmployee,
  onViewAssetDetail
}) => {
  const { 
    employees, 
    assets, 
    branches, 
    companies,
    loans, 
    addEmployee, 
    updateEmployee, 
    deleteEmployee, 
    bulkUpdateEmployees, 
    bulkDeleteEmployees, 
    canEdit, 
    returnAsset 
  } = useInventory();
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedCompany, setSelectedCompany] = useState('all');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [selectedEmployeeForCustody, setSelectedEmployeeForCustody] = useState<Employee | null>(null);
  const [showNewEmployeeModal, setShowNewEmployeeModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedEmployeeForEmail, setSelectedEmployeeForEmail] = useState<Employee | null>(null);

  // Return to Warehouse state
  const [assetToReturn, setAssetToReturn] = useState<HardwareAsset | null>(null);
  const [returnBranchId, setReturnBranchId] = useState<string>('');
  const [returnCondition, setReturnCondition] = useState<PhysicalCondition>('bueno');
  const [returnNotes, setReturnNotes] = useState<string>('');

  // Edit & Delete Employee states
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const [employeeActionFeedback, setEmployeeActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Bulk actions state
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<Set<string>>(new Set());
  const [showBulkStatusModal, setShowBulkStatusModal] = useState(false);
  const [bulkStatusValue, setBulkStatusValue] = useState<'activo' | 'licencia' | 'baja'>('activo');
  const [showBulkCompanyModal, setShowBulkCompanyModal] = useState(false);
  const [bulkCompanyValue, setBulkCompanyValue] = useState<string>(companies[0]?.id || '');
  const [showBulkBranchModal, setShowBulkBranchModal] = useState(false);
  const [bulkBranchValue, setBulkBranchValue] = useState<string>(branches[0]?.id || '');
  const [showBulkDeptModal, setShowBulkDeptModal] = useState(false);
  const [bulkDeptValue, setBulkDeptValue] = useState<string>('Tecnologías de Información');
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [isBulkExecuting, setIsBulkExecuting] = useState(false);
  const [bulkBlockedList, setBulkBlockedList] = useState<string[]>([]);

  const [editEmployeeForm, setEditEmployeeForm] = useState<Employee>({
    id: '',
    employeeNumber: '',
    fullName: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    companyId: companies[0]?.id || '',
    branchId: '',
    status: 'activo',
    hireDate: '2026-01-15',
    avatarUrl: ''
  });

  // New employee form
  const [form, setForm] = useState({
    employeeNumber: `EMP-${1240 + employees.length}`,
    fullName: '',
    email: '',
    phone: '',
    companyId: companies[0]?.id || 'COMP-PETROIL-CORP',
    department: 'Tecnologías de Información',
    position: '',
    branchId: branches[0]?.id || 'branch-1',
    status: 'activo' as const,
    hireDate: '2026-01-15'
  });

  const departments = Array.from(new Set(employees.map(e => e.department)));

  const [limitToTen, setLimitToTen] = useState<boolean>(true);

  // Filter and sort employees by fecha de entrada (hireDate) descending (más reciente primero)
  const sortedAndFilteredEmployees = useMemo(() => {
    return employees
      .filter(emp => {
        const matchesSearch = 
          emp.fullName.toLowerCase().includes(search.toLowerCase()) ||
          emp.employeeNumber.toLowerCase().includes(search.toLowerCase()) ||
          emp.email.toLowerCase().includes(search.toLowerCase()) ||
          emp.position.toLowerCase().includes(search.toLowerCase());

        const matchesDept = selectedDept === 'all' || emp.department === selectedDept;
        const matchesCompany = selectedCompany === 'all' || emp.companyId === selectedCompany;
        const matchesBranch = selectedBranch === 'all' || emp.branchId === selectedBranch;
        return matchesSearch && matchesDept && matchesCompany && matchesBranch;
      })
      .sort((a, b) => {
        const timeA = a.hireDate ? new Date(a.hireDate).getTime() : 0;
        const timeB = b.hireDate ? new Date(b.hireDate).getTime() : 0;
        return timeB - timeA;
      });
  }, [employees, search, selectedDept, selectedCompany, selectedBranch]);

  // Display only the last 10 by default to optimize rendering and fluidity
  const displayedEmployees = useMemo(() => {
    if (limitToTen) {
      return sortedAndFilteredEmployees.slice(0, 10);
    }
    return sortedAndFilteredEmployees;
  }, [sortedAndFilteredEmployees, limitToTen]);

  // Alias for backward compatibility in components
  const filteredEmployees = displayedEmployees;

  const handleToggleSelectEmployee = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedEmployeeIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allFilteredSelected = displayedEmployees.length > 0 && displayedEmployees.every(e => selectedEmployeeIds.has(e.id));
  const someFilteredSelected = displayedEmployees.some(e => selectedEmployeeIds.has(e.id)) && !allFilteredSelected;

  const handleToggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedEmployeeIds(prev => {
        const next = new Set(prev);
        displayedEmployees.forEach(e => next.delete(e.id));
        return next;
      });
    } else {
      setSelectedEmployeeIds(prev => {
        const next = new Set(prev);
        displayedEmployees.forEach(e => next.add(e.id));
        return next;
      });
    }
  };

  const handleDeselectAll = () => {
    setSelectedEmployeeIds(new Set());
    setBulkBlockedList([]);
  };

  const handleExportSelectedCsv = () => {
    const selectedList = employees.filter(e => selectedEmployeeIds.has(e.id));
    if (selectedList.length === 0) return;
    const result = exportEmployeesCsv(selectedList, assets, branches, companies);
    setEmployeeActionFeedback({
      type: 'success',
      message: `Se exportaron ${result.count} colaboradores seleccionados a CSV exitosamente.`
    });
    setTimeout(() => setEmployeeActionFeedback(null), 4500);
  };

  const handleExecuteBulkCompany = async () => {
    const ids = Array.from(selectedEmployeeIds);
    if (ids.length === 0) return;
    setIsBulkExecuting(true);
    try {
      const targetCompany = companies.find(c => c.id === bulkCompanyValue);
      const count = await bulkUpdateEmployees(ids, { companyId: bulkCompanyValue });
      setEmployeeActionFeedback({
        type: 'success',
        message: `Se reasignaron ${count} colaboradores a la empresa "${targetCompany?.name || bulkCompanyValue}".`
      });
      setShowBulkCompanyModal(false);
      handleDeselectAll();
    } catch (err: any) {
      setEmployeeActionFeedback({
        type: 'error',
        message: `Error al reasignar empresa masivamente: ${err.message || 'Error desconocido'}`
      });
    } finally {
      setIsBulkExecuting(false);
      setTimeout(() => setEmployeeActionFeedback(null), 5000);
    }
  };

  const handleExecuteBulkStatus = async () => {
    const ids = Array.from(selectedEmployeeIds);
    if (ids.length === 0) return;
    setIsBulkExecuting(true);
    try {
      const count = await bulkUpdateEmployees(ids, { status: bulkStatusValue });
      setEmployeeActionFeedback({
        type: 'success',
        message: `Se actualizó el estatus a "${bulkStatusValue}" en ${count} colaboradores exitosamente.`
      });
      setShowBulkStatusModal(false);
      handleDeselectAll();
    } catch (err: any) {
      setEmployeeActionFeedback({
        type: 'error',
        message: `Error al actualizar estatus masivamente: ${err.message || 'Error desconocido'}`
      });
    } finally {
      setIsBulkExecuting(false);
      setTimeout(() => setEmployeeActionFeedback(null), 5000);
    }
  };

  const handleExecuteBulkBranch = async () => {
    const ids = Array.from(selectedEmployeeIds);
    if (ids.length === 0) return;
    setIsBulkExecuting(true);
    try {
      const targetBranch = branches.find(b => b.id === bulkBranchValue);
      const count = await bulkUpdateEmployees(ids, { branchId: bulkBranchValue });
      setEmployeeActionFeedback({
        type: 'success',
        message: `Se reasignaron ${count} colaboradores a la sucursal "${targetBranch?.name || bulkBranchValue}".`
      });
      setShowBulkBranchModal(false);
      handleDeselectAll();
    } catch (err: any) {
      setEmployeeActionFeedback({
        type: 'error',
        message: `Error al reasignar sucursal masivamente: ${err.message || 'Error desconocido'}`
      });
    } finally {
      setIsBulkExecuting(false);
      setTimeout(() => setEmployeeActionFeedback(null), 5000);
    }
  };

  const handleExecuteBulkDept = async () => {
    const ids = Array.from(selectedEmployeeIds);
    if (ids.length === 0) return;
    if (!bulkDeptValue.trim()) {
      alert('Por favor especifica el nombre del departamento.');
      return;
    }
    setIsBulkExecuting(true);
    try {
      const count = await bulkUpdateEmployees(ids, { department: bulkDeptValue.trim() });
      setEmployeeActionFeedback({
        type: 'success',
        message: `Se cambió el departamento a "${bulkDeptValue.trim()}" en ${count} colaboradores.`
      });
      setShowBulkDeptModal(false);
      handleDeselectAll();
    } catch (err: any) {
      setEmployeeActionFeedback({
        type: 'error',
        message: `Error al cambiar departamento: ${err.message || 'Error desconocido'}`
      });
    } finally {
      setIsBulkExecuting(false);
      setTimeout(() => setEmployeeActionFeedback(null), 5000);
    }
  };

  const handleExecuteBulkDelete = async () => {
    const ids = Array.from(selectedEmployeeIds);
    if (ids.length === 0) return;
    setIsBulkExecuting(true);
    try {
      const result = await bulkDeleteEmployees(ids);
      if (result.blockedEmployees.length > 0) {
        setBulkBlockedList(result.blockedEmployees);
      }
      if (result.successCount > 0) {
        setEmployeeActionFeedback({
          type: 'success',
          message: `Se eliminaron ${result.successCount} colaboradores exitosamente.` + (result.blockedEmployees.length > 0 ? ` (${result.blockedEmployees.length} colaboradores protegidos por tener equipos asignados o préstamos activos).` : '')
        });
      } else if (result.blockedEmployees.length > 0) {
        setEmployeeActionFeedback({
          type: 'error',
          message: `No fue posible eliminar los colaboradores seleccionados porque todos tienen equipos en resguardo o préstamos activos.`
        });
      }
      setShowBulkDeleteModal(false);
      handleDeselectAll();
    } catch (err: any) {
      setEmployeeActionFeedback({
        type: 'error',
        message: `Error en baja masiva: ${err.message || 'Error desconocido'}`
      });
    } finally {
      setIsBulkExecuting(false);
      setTimeout(() => setEmployeeActionFeedback(null), 7000);
    }
  };

  const handleOpenReturnModal = (asset: HardwareAsset) => {
    setAssetToReturn(asset);
    setReturnBranchId(asset.branchId || branches[0]?.id || '');
    setReturnCondition(asset.physicalCondition || 'bueno');
    setReturnNotes('');
  };

  const handleConfirmReturnAsset = () => {
    if (!assetToReturn) return;
    const targetBranch = branches.find(b => b.id === returnBranchId);
    const branchName = targetBranch ? targetBranch.name : 'Almacén';
    returnAsset(assetToReturn.id, returnCondition, returnNotes, returnBranchId);
    setEmployeeActionFeedback({
      type: 'success',
      message: `Equipo ${assetToReturn.assetTag} (${assetToReturn.brand} ${assetToReturn.model}) devuelto exitosamente a ${branchName}.`
    });
    setTimeout(() => setEmployeeActionFeedback(null), 4500);
    setAssetToReturn(null);
  };

  const handleExportCsv = () => {
    const result = exportEmployeesCsv(sortedAndFilteredEmployees, assets, branches, companies);
    setEmployeeActionFeedback({
      type: 'success',
      message: `Directorio de colaboradores exportado exitosamente en formato CSV (${result.count} registros).`
    });
    setTimeout(() => setEmployeeActionFeedback(null), 4500);
  };

  const handleCreateEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.email) {
      alert('Por favor complete el nombre y correo del colaborador.');
      return;
    }

    addEmployee({
      employeeNumber: form.employeeNumber,
      fullName: form.fullName,
      email: form.email,
      phone: form.phone || '+52 (55) 0000-0000',
      companyId: form.companyId || companies[0]?.id || 'COMP-PETROIL-CORP',
      department: form.department,
      position: form.position || 'Especialista',
      branchId: form.branchId,
      status: form.status,
      hireDate: form.hireDate,
      avatarUrl: `https://images.unsplash.com/photo-${1534528741775 + employees.length * 100}?auto=format&fit=crop&w=250&q=80`
    });

    setShowNewEmployeeModal(false);
    setEmployeeActionFeedback({ type: 'success', message: `Colaborador "${form.fullName}" registrado exitosamente.` });
    setTimeout(() => setEmployeeActionFeedback(null), 3500);
  };

  const handleOpenEditEmployee = (emp: Employee) => {
    setEditingEmployee(emp);
    setEditEmployeeForm({
      id: emp.id,
      employeeNumber: emp.employeeNumber,
      fullName: emp.fullName,
      email: emp.email,
      phone: emp.phone,
      department: emp.department,
      position: emp.position,
      companyId: emp.companyId || companies[0]?.id || '',
      branchId: emp.branchId,
      status: emp.status,
      hireDate: emp.hireDate,
      avatarUrl: emp.avatarUrl || ''
    });
  };

  const handleUpdateEmployeeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editEmployeeForm.fullName.trim() || !editEmployeeForm.email.trim()) {
      setEmployeeActionFeedback({ type: 'error', message: 'Complete los campos requeridos: Nombre Completo y Correo Institucional.' });
      setTimeout(() => setEmployeeActionFeedback(null), 4000);
      return;
    }

    const cleanAvatar = editEmployeeForm.avatarUrl?.trim() || undefined;

    updateEmployee(editEmployeeForm.id, {
      employeeNumber: editEmployeeForm.employeeNumber.trim(),
      fullName: editEmployeeForm.fullName.trim(),
      email: editEmployeeForm.email.trim().toLowerCase(),
      phone: editEmployeeForm.phone.trim(),
      companyId: editEmployeeForm.companyId || undefined,
      department: editEmployeeForm.department.trim(),
      position: editEmployeeForm.position.trim(),
      branchId: editEmployeeForm.branchId,
      status: editEmployeeForm.status,
      hireDate: editEmployeeForm.hireDate,
      ...(cleanAvatar ? { avatarUrl: cleanAvatar } : {})
    });

    setEditingEmployee(null);
    setEmployeeActionFeedback({ type: 'success', message: `Colaborador "${editEmployeeForm.fullName}" actualizado y sincronizado en Firestore.` });
    setTimeout(() => setEmployeeActionFeedback(null), 3500);
  };

  const handleConfirmDeleteEmployee = () => {
    if (!employeeToDelete) return;
    const result = deleteEmployee(employeeToDelete.id);
    if (result.success) {
      setEmployeeActionFeedback({ type: 'success', message: `Colaborador "${employeeToDelete.fullName}" eliminado del directorio.` });
      setEmployeeToDelete(null);
      setTimeout(() => setEmployeeActionFeedback(null), 3500);
    } else {
      setEmployeeActionFeedback({ type: 'error', message: result.error || 'No fue posible eliminar al colaborador.' });
      setEmployeeToDelete(null);
      setTimeout(() => setEmployeeActionFeedback(null), 5500);
    }
  };

  return (
    <div className="space-y-5">

      {/* Action Feedback Banner */}
      {employeeActionFeedback && (
        <div className={`p-4 rounded-xl flex items-center justify-between text-xs font-semibold animate-in fade-in ${
          employeeActionFeedback.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
            : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            {employeeActionFeedback.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{employeeActionFeedback.message}</span>
          </div>
          <button 
            onClick={() => setEmployeeActionFeedback(null)}
            className="text-slate-400 hover:text-slate-700 ml-3"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Directorio de Colaboradores y Custodia
          </h2>
          <p className="text-xs text-slate-700 font-medium mt-0.5">
            Personal autorizado para resguardo de equipo de cómputo, teléfonos, laptops corporativas y cartas responsivas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
            title="Exportar directorio de colaboradores y equipos en resguardo a formato CSV compatible con Microsoft Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={() => setShowImportModal(true)}
            className="px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
            title="Cargar colaboradores masivamente desde un archivo CSV"
          >
            <Upload className="w-4 h-4 text-indigo-600" />
            <span>Importar CSV</span>
          </button>

          <button
            onClick={() => setShowNewEmployeeModal(true)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shadow-sm shadow-indigo-200 flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>Nuevo Colaborador</span>
          </button>
        </div>
      </div>

      {/* Search & Empresa / Sucursal / Dept filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-300 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 text-xs">
        <div className="relative w-full lg:max-w-xs">
          <Search className="w-4 h-4 text-slate-600 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre, correo, número..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-900 bg-white placeholder:text-slate-500 focus:border-[#ff8200] focus:ring-2 focus:ring-[#ff8200]/20 outline-hidden caret-[#ff8200]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full lg:w-auto">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-700 font-bold text-xs shrink-0 hidden sm:inline">Empresa:</span>
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs sm:text-sm font-bold focus:ring-2 focus:ring-[#ff8200]/20 focus:border-[#ff8200] outline-hidden cursor-pointer w-full"
              title="Filtrar colaboradores por empresa del grupo"
            >
              <option value="all">Todas las Empresas ({companies.length})</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-700 font-bold text-xs shrink-0 hidden sm:inline">Sucursal:</span>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs sm:text-sm font-bold focus:ring-2 focus:ring-[#ff8200]/20 focus:border-[#ff8200] outline-hidden cursor-pointer w-full"
              title="Filtrar colaboradores por sucursal sede"
            >
              <option value="all">Todas las Sucursales ({branches.length})</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name} ({b.city})</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-700 font-bold text-xs shrink-0 hidden sm:inline">Depto:</span>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs sm:text-sm font-bold focus:ring-2 focus:ring-[#ff8200]/20 focus:border-[#ff8200] outline-hidden cursor-pointer w-full"
              title="Filtrar colaboradores por departamento"
            >
              <option value="all">Todos los Deptos</option>
              {departments.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Blocked employees feedback alert */}
      {bulkBlockedList.length > 0 && (
        <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl text-xs space-y-1.5 animate-in fade-in">
          <div className="flex items-center justify-between">
            <span className="font-bold text-amber-900 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-700" />
              <span>Colaboradores protegidos contra eliminación ({bulkBlockedList.length}):</span>
            </span>
            <button onClick={() => setBulkBlockedList([])} className="text-amber-700 hover:text-amber-900 font-bold cursor-pointer">✕</button>
          </div>
          <ul className="list-disc pl-5 text-amber-800 space-y-0.5">
            {bulkBlockedList.map((blockedItem, idx) => (
              <li key={idx}>
                {blockedItem}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Floating / Sticky Bulk Actions Toolbar */}
      {selectedEmployeeIds.size > 0 && (
        <div className="bg-[#1e293b] text-white p-3 sm:p-4 rounded-xl shadow-lg border border-slate-700 flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#ff8200] text-slate-900 font-black text-xs">
              {selectedEmployeeIds.size}
            </span>
            <div>
              <p className="text-sm font-bold text-white flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#ff8200]" />
                <span>{selectedEmployeeIds.size} {selectedEmployeeIds.size === 1 ? 'colaborador seleccionado' : 'colaboradores seleccionados'}</span>
              </p>
              <p className="text-[11px] text-slate-300 font-medium">
                Acciones por lote sobre el personal marcado
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowBulkCompanyModal(true)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-600 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Reasignar empresa del grupo"
            >
              <Briefcase className="w-3.5 h-3.5 text-blue-400" />
              <span>Asignar Empresa</span>
            </button>

            <button
              type="button"
              onClick={() => setShowBulkBranchModal(true)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-600 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Reasignar sucursal sede"
            >
              <Building2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Reasignar Sucursal</span>
            </button>

            <button
              type="button"
              onClick={() => setShowBulkStatusModal(true)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-600 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Modificar estatus de los colaboradores seleccionados"
            >
              <Tag className="w-3.5 h-3.5 text-amber-400" />
              <span>Cambiar Estatus</span>
            </button>

            <button
              type="button"
              onClick={() => setShowBulkDeptModal(true)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-600 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Cambiar departamento asignado"
            >
              <Briefcase className="w-3.5 h-3.5 text-cyan-400" />
              <span>Cambiar Depto.</span>
            </button>

            <button
              type="button"
              onClick={handleExportSelectedCsv}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 border border-emerald-600/50 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Exportar únicamente los seleccionados a CSV"
            >
              <Download className="w-3.5 h-3.5 text-emerald-300" />
              <span>Exportar CSV ({selectedEmployeeIds.size})</span>
            </button>

            {canEdit && (
              <button
                type="button"
                onClick={() => setShowBulkDeleteModal(true)}
                className="px-2.5 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-700 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Baja y eliminación de colaboradores"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Baja / Eliminar ({selectedEmployeeIds.size})</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleDeselectAll}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-600 transition-colors cursor-pointer"
              title="Deseleccionar todos"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Select All / Count & Fluidity Optimization indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-700 font-medium px-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
        <div className="flex items-center gap-3 flex-wrap">
          <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 hover:text-[#004a99]">
            <input
              type="checkbox"
              checked={allFilteredSelected}
              ref={el => {
                if (el) el.indeterminate = someFilteredSelected;
              }}
              onChange={handleToggleSelectAll}
              className="w-4 h-4 rounded border-slate-300 text-[#ff8200] focus:ring-[#ff8200] cursor-pointer"
            />
            <span>Seleccionar ({displayedEmployees.length})</span>
          </label>

          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-sky-100/70 text-sky-900 border border-sky-200 font-semibold text-[11px]">
            <Calendar className="w-3.5 h-3.5 text-sky-700 shrink-0" />
            <span>Ordenados por Fecha de Entrada (Más reciente primero)</span>
          </span>

          {limitToTen && sortedAndFilteredEmployees.length > 10 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-100/70 text-amber-900 border border-amber-300 font-bold text-[11px]">
              <Zap className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span>Vista de Fluidez: Últimos 10 colaboradores</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          <span className="text-[11.5px] text-slate-600 font-medium">
            Mostrando <strong className="text-slate-900 font-bold">{displayedEmployees.length}</strong> de <strong className="text-slate-900 font-bold">{sortedAndFilteredEmployees.length}</strong> {employees.length !== sortedAndFilteredEmployees.length ? `(filtrados de ${employees.length})` : 'colaboradores'}
          </span>

          {sortedAndFilteredEmployees.length > 10 && (
            <button
              type="button"
              onClick={() => setLimitToTen(!limitToTen)}
              className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
              title={limitToTen ? 'Ver listado completo sin limitar a 10' : 'Volver a limitar a los 10 más recientes'}
            >
              {limitToTen ? (
                <>
                  <Eye className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Ver todos ({sortedAndFilteredEmployees.length})</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 text-amber-600" />
                  <span>Mostrar solo 10 últimos</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Employees Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEmployees.map(emp => {
          const branch = branches.find(b => b.id === emp.branchId);
          const company = companies.find(c => c.id === emp.companyId);
          const assignedAssets = assets.filter(a => a.assignedToEmployeeId === emp.id && a.status === 'asignado');
          const isSelected = selectedEmployeeIds.has(emp.id);

          return (
            <div 
              key={emp.id}
              className={`rounded-xl border p-4 shadow-xs hover:border-indigo-300 transition-all flex flex-col justify-between ${
                isSelected ? 'bg-amber-50/70 border-amber-300' : 'bg-white border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center gap-2 shrink-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleSelectEmployee(emp.id)}
                      className="w-4 h-4 rounded border-slate-300 text-[#ff8200] focus:ring-[#ff8200] cursor-pointer"
                      title="Seleccionar colaborador para acciones masivas"
                    />
                    <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden">
                      {emp.avatarUrl ? (
                        <img src={emp.avatarUrl} alt={emp.fullName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-slate-500 text-sm">
                          {emp.fullName.charAt(0)}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10.5px] text-slate-700 font-bold uppercase">{emp.employeeNumber}</span>
                      <span className="text-[10.5px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-bold border border-emerald-300">
                        {emp.status}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-slate-900 truncate mt-0.5">{emp.fullName}</h3>
                    <p className="text-xs text-[#004a99] font-bold truncate">{emp.position}</p>
                    <p className="text-[11.5px] text-slate-700 font-medium truncate">{emp.department}</p>
                  </div>
                </div>

                <div className="mt-3.5 space-y-1.5 pt-3 border-t border-slate-200 text-xs text-slate-800 font-medium">
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                      <span className="font-mono text-[11px] truncate text-slate-800 font-semibold">{emp.email}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedEmployeeForEmail(emp)}
                      className="text-[11px] text-red-700 hover:text-red-900 font-bold hover:underline shrink-0 cursor-pointer"
                      title="Redactar correo Gmail para este colaborador"
                    >
                      Redactar
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span className="truncate font-semibold text-slate-800" title={company?.name}>
                      {company?.name || 'Empresa no asignada'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span className="truncate font-semibold text-slate-800" title={branch?.name}>
                      {branch?.name || 'Sucursal no asignada'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="text-[11.5px] text-slate-700 font-medium">
                      Fecha de Entrada: <strong className="text-slate-900 font-bold">{formatDate(emp.hireDate)}</strong>
                    </span>
                  </div>
                </div>

                {/* Assigned devices badge */}
                <div className="mt-3 p-2.5 rounded-lg bg-slate-50 border border-slate-300 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-800 font-bold">
                    <Laptop className="w-4 h-4 text-[#004a99]" />
                    <span>Equipos en Resguardo:</span>
                  </div>
                  <span className={`font-mono font-bold px-2 py-0.5 rounded-full ${
                    assignedAssets.length > 0 ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-200 text-slate-500'
                  }`}>
                    {assignedAssets.length}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedEmployeeForCustody(emp)}
                    className="text-slate-600 hover:text-indigo-600 font-medium py-1 px-2 rounded hover:bg-slate-50 transition-colors"
                  >
                    Ver Equipos ({assignedAssets.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => onAssignToEmployee(emp)}
                    className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold transition-colors"
                  >
                    + Asignar Equipo
                  </button>
                </div>

                {assignedAssets.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (assignedAssets.length === 1) {
                        handleOpenReturnModal(assignedAssets[0]);
                      } else {
                        setSelectedEmployeeForCustody(emp);
                      }
                    }}
                    className="w-full py-1.5 px-2.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    title={assignedAssets.length === 1 ? "Devolver equipo asignado al almacén" : "Ver equipos para seleccionar cuál devolver al almacén"}
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                    <span>Devolver a Almacén {assignedAssets.length > 1 ? `(${assignedAssets.length})` : ''}</span>
                  </button>
                )}

                <div className="grid grid-cols-2 gap-1.5 pt-1.5 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleOpenEditEmployee(emp)}
                    className="py-1.5 px-2 rounded-lg border border-slate-200 bg-white hover:bg-indigo-50 hover:border-indigo-300 text-slate-700 hover:text-indigo-700 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    title="Editar todos los datos del colaborador"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Editar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEmployeeToDelete(emp)}
                    className="py-1.5 px-2 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-300 text-slate-700 hover:text-rose-600 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    title="Dar de baja y eliminar colaborador"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                    <span>Eliminar</span>
                  </button>
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* Custody Drawer / Modal */}
      {selectedEmployeeForCustody && (() => {
        const custodyCompany = companies.find(c => c.id === selectedEmployeeForCustody.companyId);
        const custodyBranch = branches.find(b => b.id === selectedEmployeeForCustody.branchId);

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                <div>
                  <p className="text-xs text-indigo-300 font-mono">Custodia de Activos Fijos</p>
                  <h3 className="font-bold text-base text-white">{selectedEmployeeForCustody.fullName}</h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 mt-1">
                    <span className="flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5 text-blue-400" />
                      <span>{custodyCompany?.name || 'Empresa no asignada'}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{custodyBranch?.name || 'Sucursal no asignada'}</span>
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedEmployeeForCustody(null)}
                  className="p-1 rounded text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

            <div className="p-5 max-h-[60vh] overflow-y-auto space-y-3">
              {assets.filter(a => a.assignedToEmployeeId === selectedEmployeeForCustody.id && a.status === 'asignado').length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  Este colaborador no tiene equipos de cómputo en resguardo actualmente.
                </div>
              ) : (
                assets
                  .filter(a => a.assignedToEmployeeId === selectedEmployeeForCustody.id && a.status === 'asignado')
                  .map(asset => (
                    <div 
                      key={asset.id} 
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-indigo-50/40 transition-colors flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-indigo-700">{asset.assetTag}</span>
                          <span className="font-semibold text-slate-800">{asset.brand} {asset.model}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">S/N: {asset.serialNumber}</p>
                        <p className="text-[11px] text-slate-600 mt-1">
                          Entregado: {formatDate(asset.assignedDate)} • {asset.specs.cpu || asset.specs.storage}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 ml-3">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedEmployeeForCustody(null);
                            handleOpenReturnModal(asset);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-800 text-xs font-semibold shadow-xs flex items-center gap-1 cursor-pointer transition-colors"
                          title="Devolver este equipo al almacén"
                        >
                          <RotateCcw className="w-3 h-3 text-amber-600" />
                          <span>Devolver</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedEmployeeForCustody(null);
                            onViewAssetDetail(asset);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-slate-700 hover:text-indigo-600 text-xs font-medium shadow-xs"
                        >
                          Ver Detalle
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setSelectedEmployeeForCustody(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      );
    })()}

      {/* New Employee Modal */}
      {showNewEmployeeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-sm">Registrar Nuevo Colaborador</h3>
              </div>
              <button onClick={() => setShowNewEmployeeModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEmployee} className="p-6 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="font-semibold text-slate-700 text-xs sm:text-[13px] block mb-1">No. de Empleado *</label>
                  <input
                    type="text"
                    required
                    value={form.employeeNumber}
                    onChange={(e) => setForm({ ...form, employeeNumber: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl font-mono text-[13px] text-slate-900 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-[#ff8200]/20 focus:border-[#ff8200] outline-hidden uppercase caret-[#ff8200]"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 text-xs sm:text-[13px] block mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Juan Pérez Garza"
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 bg-white focus:ring-2 focus:ring-[#ff8200]/20 focus:border-[#ff8200] outline-hidden caret-[#ff8200]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="font-semibold text-slate-700 text-xs sm:text-[13px] block mb-1">Correo Electrónico *</label>
                  <input
                    type="email"
                    required
                    placeholder="usuario@petroil.com.mx"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 bg-white focus:ring-2 focus:ring-[#ff8200]/20 focus:border-[#ff8200] outline-hidden caret-[#ff8200]"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 text-xs sm:text-[13px] block mb-1">Teléfono Móvil</label>
                  <input
                    type="text"
                    placeholder="+52 (55) 1234-5678"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 bg-white focus:ring-2 focus:ring-[#ff8200]/20 focus:border-[#ff8200] outline-hidden caret-[#ff8200]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="font-semibold text-slate-700 text-xs sm:text-[13px] block mb-1">Departamento *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Finanzas, Operaciones, TI"
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 bg-white focus:ring-2 focus:ring-[#ff8200]/20 focus:border-[#ff8200] outline-hidden caret-[#ff8200]"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 text-xs sm:text-[13px] block mb-1">Puesto / Cargo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Analista Contable Senior"
                    value={form.position}
                    onChange={(e) => setForm({ ...form, position: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 bg-white focus:ring-2 focus:ring-[#ff8200]/20 focus:border-[#ff8200] outline-hidden caret-[#ff8200]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="font-semibold text-slate-700 text-xs sm:text-[13px] block mb-1">Empresa del Grupo *</label>
                  <select
                    value={form.companyId}
                    onChange={(e) => setForm({ ...form, companyId: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl bg-white text-sm font-medium text-slate-900 focus:ring-2 focus:ring-[#ff8200]/20 focus:border-[#ff8200] outline-hidden cursor-pointer"
                  >
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 text-xs sm:text-[13px] block mb-1">Sucursal de Adscripción *</label>
                  <select
                    value={form.branchId}
                    onChange={(e) => setForm({ ...form, branchId: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl bg-white text-sm font-medium text-slate-900 focus:ring-2 focus:ring-[#ff8200]/20 focus:border-[#ff8200] outline-hidden cursor-pointer"
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name} ({b.city})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowNewEmployeeModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                >
                  Guardar Colaborador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {editingEmployee && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-sm">Editar Datos del Colaborador ({editingEmployee.employeeNumber})</h3>
              </div>
              <button onClick={() => setEditingEmployee(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateEmployeeSubmit} className="p-6 space-y-4 text-sm overflow-y-auto">
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="font-semibold text-slate-700 text-xs sm:text-[13px] block mb-1">Número de Empleado *</label>
                  <input
                    type="text"
                    required
                    value={editEmployeeForm.employeeNumber}
                    onChange={(e) => setEditEmployeeForm({ ...editEmployeeForm, employeeNumber: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl outline-hidden font-mono text-[13px] uppercase text-slate-900 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-[#ff8200]/20 focus:border-[#ff8200] caret-[#ff8200]"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 text-xs sm:text-[13px] block mb-1">Estatus Laboral *</label>
                  <select
                    value={editEmployeeForm.status}
                    onChange={(e) => setEditEmployeeForm({ ...editEmployeeForm, status: e.target.value as any })}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl bg-white text-sm font-medium text-slate-900 focus:ring-2 focus:ring-[#ff8200]/20 focus:border-[#ff8200] outline-hidden cursor-pointer"
                  >
                    <option value="activo">Activo (En funciones)</option>
                    <option value="licencia">En Licencia / Incapacidad</option>
                    <option value="baja">Baja Administrativa</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 text-xs sm:text-[13px] block mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={editEmployeeForm.fullName}
                  onChange={(e) => setEditEmployeeForm({ ...editEmployeeForm, fullName: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 bg-white focus:ring-2 focus:ring-[#ff8200]/20 focus:border-[#ff8200] outline-hidden caret-[#ff8200]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="font-semibold text-slate-700 text-xs sm:text-[13px] block mb-1">Correo Institucional *</label>
                  <input
                    type="email"
                    required
                    value={editEmployeeForm.email}
                    onChange={(e) => setEditEmployeeForm({ ...editEmployeeForm, email: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 bg-white focus:ring-2 focus:ring-[#ff8200]/20 focus:border-[#ff8200] outline-hidden caret-[#ff8200]"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 text-xs sm:text-[13px] block mb-1">Teléfono Móvil / Extensión</label>
                  <input
                    type="text"
                    value={editEmployeeForm.phone}
                    onChange={(e) => setEditEmployeeForm({ ...editEmployeeForm, phone: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 bg-white focus:ring-2 focus:ring-[#ff8200]/20 focus:border-[#ff8200] outline-hidden caret-[#ff8200]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="font-semibold text-slate-700 text-xs sm:text-[13px] block mb-1">Departamento *</label>
                  <input
                    type="text"
                    required
                    value={editEmployeeForm.department}
                    onChange={(e) => setEditEmployeeForm({ ...editEmployeeForm, department: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 bg-white focus:ring-2 focus:ring-[#ff8200]/20 focus:border-[#ff8200] outline-hidden caret-[#ff8200]"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 text-xs sm:text-[13px] block mb-1">Puesto / Cargo *</label>
                  <input
                    type="text"
                    required
                    value={editEmployeeForm.position}
                    onChange={(e) => setEditEmployeeForm({ ...editEmployeeForm, position: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 bg-white focus:ring-2 focus:ring-[#ff8200]/20 focus:border-[#ff8200] outline-hidden caret-[#ff8200]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="font-semibold text-slate-700 text-xs sm:text-[13px] block mb-1">Empresa del Grupo *</label>
                  <select
                    value={editEmployeeForm.companyId || ''}
                    onChange={(e) => setEditEmployeeForm({ ...editEmployeeForm, companyId: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl bg-white text-sm font-medium text-slate-900 focus:ring-2 focus:ring-[#ff8200]/20 focus:border-[#ff8200] outline-hidden cursor-pointer"
                  >
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 text-xs sm:text-[13px] block mb-1">Sucursal de Adscripción *</label>
                  <select
                    value={editEmployeeForm.branchId}
                    onChange={(e) => setEditEmployeeForm({ ...editEmployeeForm, branchId: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl bg-white text-sm font-medium text-slate-900 focus:ring-2 focus:ring-[#ff8200]/20 focus:border-[#ff8200] outline-hidden cursor-pointer"
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name} ({b.city})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="font-semibold text-slate-700 text-xs sm:text-[13px] block mb-1">Fecha de Ingreso *</label>
                  <input
                    type="date"
                    required
                    value={editEmployeeForm.hireDate}
                    onChange={(e) => setEditEmployeeForm({ ...editEmployeeForm, hireDate: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 bg-white focus:ring-2 focus:ring-[#ff8200]/20 focus:border-[#ff8200] outline-hidden caret-[#ff8200]"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 text-xs sm:text-[13px] block mb-1">URL de Fotografía de Perfil (Opcional)</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={editEmployeeForm.avatarUrl || ''}
                    onChange={(e) => setEditEmployeeForm({ ...editEmployeeForm, avatarUrl: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl outline-hidden text-sm font-mono text-slate-900 bg-white focus:ring-2 focus:ring-[#ff8200]/20 focus:border-[#ff8200] caret-[#ff8200]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingEmployee(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer shadow-sm shadow-indigo-200"
                >
                  Actualizar Colaborador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Employee Confirmation Dialog */}
      {employeeToDelete && (() => {
        const assignedAssets = assets.filter(a => a.assignedToEmployeeId === employeeToDelete.id && a.status === 'asignado');
        const activeLoans = loans ? loans.filter(l => l.employeeId === employeeToDelete.id && l.status === 'activo') : [];
        const hasDependencies = assignedAssets.length > 0 || activeLoans.length > 0;

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
              <div className="p-4 bg-rose-600 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trash2 className="w-5 h-5 text-white" />
                  <h3 className="font-bold text-sm">Eliminar Colaborador del Directorio</h3>
                </div>
                <button onClick={() => setEmployeeToDelete(null)} className="text-white/80 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs">
                <p className="text-slate-700 text-sm">
                  ¿Está seguro de eliminar permanentemente a <strong className="text-slate-900">{employeeToDelete.fullName}</strong> ({employeeToDelete.employeeNumber})?
                </p>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5">
                  <div className="flex justify-between text-slate-600">
                    <span>Puesto:</span>
                    <strong className="text-slate-900">{employeeToDelete.position}</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Departamento:</span>
                    <strong className="text-slate-900">{employeeToDelete.department}</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Equipos actualmente en resguardo:</span>
                    <strong className={assignedAssets.length > 0 ? 'text-rose-600' : 'text-slate-700'}>{assignedAssets.length}</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Préstamos temporales activos:</span>
                    <strong className={activeLoans.length > 0 ? 'text-rose-600' : 'text-slate-700'}>{activeLoans.length}</strong>
                  </div>
                </div>

                {hasDependencies && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>No se puede eliminar en este momento</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      El colaborador tiene activos o préstamos bajo su resguardo. Debe generar la devolución del equipo al almacén o reasignarlo antes de eliminar el registro.
                    </p>
                    {assignedAssets.length > 0 && (
                      <p className="text-[10px] font-mono text-slate-600 mt-1">
                        Placas: {assignedAssets.map(a => a.assetTag).join(', ')}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setEmployeeToDelete(null)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDeleteEmployee}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold cursor-pointer shadow-sm shadow-rose-200"
                  >
                    Confirmar Eliminación
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Return Asset to Warehouse Modal */}
      {assetToReturn && (() => {
        const currentCustodyEmployee = employees.find(e => e.id === assetToReturn.assignedToEmployeeId);

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-amber-400" />
                  <h3 className="font-bold text-sm">Devolver Equipo a Almacén</h3>
                </div>
                <button 
                  onClick={() => setAssetToReturn(null)} 
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs">
                {/* Equipment summary banner */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Activo / Equipo:</span>
                    <span className="font-mono font-bold text-indigo-700">
                      {assetToReturn.assetTag} ({assetToReturn.brand} {assetToReturn.model})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Número de Serie:</span>
                    <span className="font-mono text-slate-700">{assetToReturn.serialNumber}</span>
                  </div>
                  {currentCustodyEmployee && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Colaborador en custodia:</span>
                      <strong className="text-slate-900">{currentCustodyEmployee.fullName}</strong>
                    </div>
                  )}
                </div>

                <div className="space-y-3.5">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Almacén o Sede de Destino *
                    </label>
                    <select
                      value={returnBranchId}
                      onChange={(e) => setReturnBranchId(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-amber-200 outline-hidden font-medium text-xs text-slate-800"
                    >
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} — {b.city} ({b.state})
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Seleccione el almacén físico donde se recibirá y quedará inventariado el equipo.
                    </p>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Condición Física de Recepción *
                    </label>
                    <select
                      value={returnCondition}
                      onChange={(e) => setReturnCondition(e.target.value as PhysicalCondition)}
                      className="w-full p-2.5 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-amber-200 outline-hidden font-medium text-xs text-slate-800"
                    >
                      <option value="excelente">Excelente - Sin detalles estéticos ni funcionales</option>
                      <option value="bueno">Bueno - Desgaste regular por uso</option>
                      <option value="regular">Regular - Marcas, rayones o golpes leves</option>
                      <option value="dañado">Dañado - Requiere revisión o mantenimiento técnico</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1 text-xs sm:text-[13px]">
                      Observaciones y Dictamen de Recepción
                    </label>
                    <textarea
                      value={returnNotes}
                      onChange={(e) => setReturnNotes(e.target.value)}
                      placeholder="Observaciones de entrega: cargador entregado, accesorios completos, estado de batería, formato de disco..."
                      rows={3}
                      className="w-full p-3.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#ff8200]/20 focus:border-[#ff8200] outline-hidden text-sm leading-relaxed text-slate-900 bg-white caret-[#ff8200]"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setAssetToReturn(null)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmReturnAsset}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold cursor-pointer shadow-sm shadow-amber-200 flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Confirmar Devolución</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Bulk Status Change Modal */}
      {showBulkStatusModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <p className="text-xs text-[#ff8200] font-mono font-bold uppercase">Acción Masiva de Personal</p>
                <h3 className="font-bold text-base text-white">Cambiar Estatus ({selectedEmployeeIds.size} colaboradores)</h3>
              </div>
              <button onClick={() => setShowBulkStatusModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs sm:text-sm">
              <p className="text-slate-600">
                Selecciona el nuevo estatus laboral que se aplicará en lote a los <strong>{selectedEmployeeIds.size}</strong> colaboradores:
              </p>

              <div>
                <label className="font-bold text-slate-800 block mb-1.5">Nuevo Estatus *</label>
                <select
                  value={bulkStatusValue}
                  onChange={(e) => setBulkStatusValue(e.target.value as any)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white font-medium text-slate-900 focus:ring-2 focus:ring-[#ff8200]/20 focus:border-[#ff8200] outline-hidden cursor-pointer"
                >
                  <option value="activo">Activo (Personal en operaciones)</option>
                  <option value="licencia">Licencia / Permiso temporal</option>
                  <option value="baja">Baja laboral (Inactivo)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowBulkStatusModal(false)}
                  disabled={isBulkExecuting}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleExecuteBulkStatus}
                  disabled={isBulkExecuting}
                  className="px-4 py-2 rounded-xl bg-[#004a99] hover:bg-[#003875] text-white font-bold cursor-pointer shadow-md flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Tag className="w-4 h-4" />
                  <span>{isBulkExecuting ? 'Actualizando...' : `Aplicar a ${selectedEmployeeIds.size} Colaboradores`}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Company Reassignment Modal */}
      {showBulkCompanyModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-400 font-mono font-bold uppercase">Acción Masiva de Empresa</p>
                <h3 className="font-bold text-base text-white">Reasignar Empresa ({selectedEmployeeIds.size} colaboradores)</h3>
              </div>
              <button onClick={() => setShowBulkCompanyModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs sm:text-sm">
              <p className="text-slate-600">
                Selecciona la empresa del grupo a la que pertenecerán los <strong>{selectedEmployeeIds.size}</strong> colaboradores seleccionados:
              </p>

              <div>
                <label className="font-bold text-slate-800 block mb-1.5">Empresa Registrada *</label>
                <select
                  value={bulkCompanyValue}
                  onChange={(e) => setBulkCompanyValue(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white font-medium text-slate-900 focus:ring-2 focus:ring-[#ff8200]/20 focus:border-[#ff8200] outline-hidden cursor-pointer"
                >
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.businessName ? `— ${c.businessName}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowBulkCompanyModal(false)}
                  disabled={isBulkExecuting}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleExecuteBulkCompany}
                  disabled={isBulkExecuting}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer shadow-md flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Briefcase className="w-4 h-4" />
                  <span>{isBulkExecuting ? 'Reasignando...' : `Asignar a ${selectedEmployeeIds.size} Colaboradores`}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Branch Reassignment Modal */}
      {showBulkBranchModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <p className="text-xs text-indigo-400 font-mono font-bold uppercase">Acción Masiva de Sucursal</p>
                <h3 className="font-bold text-base text-white">Reasignar Sucursal Sede ({selectedEmployeeIds.size} colaboradores)</h3>
              </div>
              <button onClick={() => setShowBulkBranchModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs sm:text-sm">
              <p className="text-slate-600">
                Asigna una nueva sucursal o sede física a los <strong>{selectedEmployeeIds.size}</strong> colaboradores:
              </p>

              <div>
                <label className="font-bold text-slate-800 block mb-1.5">Sucursal / Sede *</label>
                <select
                  value={bulkBranchValue}
                  onChange={(e) => setBulkBranchValue(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white font-medium text-slate-900 focus:ring-2 focus:ring-[#ff8200]/20 focus:border-[#ff8200] outline-hidden cursor-pointer"
                >
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name} ({b.city}, {b.state})</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowBulkBranchModal(false)}
                  disabled={isBulkExecuting}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleExecuteBulkBranch}
                  disabled={isBulkExecuting}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer shadow-md flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Building2 className="w-4 h-4" />
                  <span>{isBulkExecuting ? 'Reasignando...' : `Reasignar ${selectedEmployeeIds.size} Colaboradores`}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Department Modal */}
      {showBulkDeptModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <p className="text-xs text-cyan-400 font-mono font-bold uppercase">Acción Masiva de Organización</p>
                <h3 className="font-bold text-base text-white">Cambiar Departamento ({selectedEmployeeIds.size} colaboradores)</h3>
              </div>
              <button onClick={() => setShowBulkDeptModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs sm:text-sm">
              <p className="text-slate-600">
                Actualiza el departamento asignado para los <strong>{selectedEmployeeIds.size}</strong> colaboradores:
              </p>

              <div>
                <label className="font-bold text-slate-800 block mb-1.5">Elegir de Departamentos Existentes</label>
                <select
                  value={departments.includes(bulkDeptValue) ? bulkDeptValue : ''}
                  onChange={(e) => {
                    if (e.target.value) setBulkDeptValue(e.target.value);
                  }}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white font-medium text-slate-900 focus:ring-2 focus:ring-[#ff8200]/20 focus:border-[#ff8200] outline-hidden cursor-pointer mb-2"
                >
                  <option value="">-- Seleccionar departamento existente o escribir abajo --</option>
                  {departments.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>

                <label className="font-bold text-slate-800 block mb-1.5">Nombre del Departamento *</label>
                <input
                  type="text"
                  value={bulkDeptValue}
                  onChange={(e) => setBulkDeptValue(e.target.value)}
                  placeholder="Ej. Tecnologías de Información o Operaciones Marítimas"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-medium text-slate-900 focus:ring-2 focus:ring-[#ff8200]/20 focus:border-[#ff8200] outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowBulkDeptModal(false)}
                  disabled={isBulkExecuting}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleExecuteBulkDept}
                  disabled={isBulkExecuting}
                  className="px-4 py-2 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white font-bold cursor-pointer shadow-md flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Briefcase className="w-4 h-4" />
                  <span>{isBulkExecuting ? 'Guardando...' : `Actualizar ${selectedEmployeeIds.size} Colaboradores`}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-rose-900 text-white flex items-center justify-between">
              <div>
                <p className="text-xs text-rose-200 font-mono font-bold uppercase">Baja y Eliminación Masiva</p>
                <h3 className="font-bold text-base text-white">Eliminar {selectedEmployeeIds.size} Colaboradores</h3>
              </div>
              <button onClick={() => setShowBulkDeleteModal(false)} className="text-rose-200 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs sm:text-sm">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Validación de Integridad y Custodia TI</span>
                </p>
                <p>
                  Estás a punto de eliminar a <strong>{selectedEmployeeIds.size}</strong> colaboradores del directorio institucional.
                </p>
                <p className="text-slate-700 font-medium pt-1">
                  El sistema validará automáticamente que los colaboradores no tengan <strong>activos de hardware en resguardo</strong> ni <strong>préstamos temporales activos</strong>. Aquellos con custodias pendientes serán bloqueados para proteger el registro institucional.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowBulkDeleteModal(false)}
                  disabled={isBulkExecuting}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleExecuteBulkDelete}
                  disabled={isBulkExecuting}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer shadow-md flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{isBulkExecuting ? 'Validando y Eliminando...' : `Confirmar Baja de ${selectedEmployeeIds.size}`}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {showImportModal && (
        <ImportEmployeesModal
          onClose={() => setShowImportModal(false)}
          onSuccess={(count) => {
            setEmployeeActionFeedback({
              type: 'success',
              message: `¡Éxito! Se importaron ${count} colaboradores exitosamente al directorio.`
            });
            setTimeout(() => setEmployeeActionFeedback(null), 5000);
          }}
        />
      )}

      {/* Gmail Compose Modal for Employee */}
      {selectedEmployeeForEmail && (
        <CustomGmailComposeModal
          isOpen={true}
          defaultTo={selectedEmployeeForEmail.email}
          defaultSubject={`[Soporte TI Petroil] Comunicación para ${selectedEmployeeForEmail.fullName}`}
          onClose={() => setSelectedEmployeeForEmail(null)}
        />
      )}

    </div>
  );
};
