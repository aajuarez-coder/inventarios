import React, { useState } from 'react';
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
  Upload
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
  const { employees, assets, branches, loans, addEmployee, updateEmployee, deleteEmployee, canEdit, returnAsset } = useInventory();
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
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

  const [editEmployeeForm, setEditEmployeeForm] = useState<Employee>({
    id: '',
    employeeNumber: '',
    fullName: '',
    email: '',
    phone: '',
    department: '',
    position: '',
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
    department: 'Tecnologías de Información',
    position: '',
    branchId: branches[0]?.id || 'branch-1',
    status: 'activo' as const,
    hireDate: '2026-01-15'
  });

  const departments = Array.from(new Set(employees.map(e => e.department)));

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = 
      emp.fullName.toLowerCase().includes(search.toLowerCase()) ||
      emp.employeeNumber.toLowerCase().includes(search.toLowerCase()) ||
      emp.email.toLowerCase().includes(search.toLowerCase()) ||
      emp.position.toLowerCase().includes(search.toLowerCase());

    const matchesDept = selectedDept === 'all' || emp.department === selectedDept;
    return matchesSearch && matchesDept;
  });

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
    const result = exportEmployeesCsv(filteredEmployees, assets, branches);
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

    updateEmployee(editEmployeeForm.id, {
      employeeNumber: editEmployeeForm.employeeNumber.trim(),
      fullName: editEmployeeForm.fullName.trim(),
      email: editEmployeeForm.email.trim().toLowerCase(),
      phone: editEmployeeForm.phone.trim(),
      department: editEmployeeForm.department.trim(),
      position: editEmployeeForm.position.trim(),
      branchId: editEmployeeForm.branchId,
      status: editEmployeeForm.status,
      hireDate: editEmployeeForm.hireDate,
      avatarUrl: editEmployeeForm.avatarUrl?.trim() || undefined
    });

    setEditingEmployee(null);
    setEmployeeActionFeedback({ type: 'success', message: `Colaborador "${editEmployeeForm.fullName}" actualizado correctamente en el directorio.` });
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

      {/* Search & Dept filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-300 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-600 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre, correo, número de empleado, puesto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-900 bg-white placeholder:text-slate-500 focus:border-[#ff8200] focus:ring-2 focus:ring-[#ff8200]/20 outline-hidden caret-[#ff8200]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-slate-800 font-bold text-xs sm:text-sm shrink-0">Departamento:</span>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-bold focus:ring-2 focus:ring-[#ff8200]/20 focus:border-[#ff8200] outline-hidden cursor-pointer w-full sm:w-auto"
          >
            <option value="all">Todos los Departamentos</option>
            {departments.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Employees Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEmployees.map(emp => {
          const branch = branches.find(b => b.id === emp.branchId);
          const assignedAssets = assets.filter(a => a.assignedToEmployeeId === emp.id && a.status === 'asignado');

          return (
            <div 
              key={emp.id}
              className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-indigo-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                    {emp.avatarUrl ? (
                      <img src={emp.avatarUrl} alt={emp.fullName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-slate-500">
                        {emp.fullName.charAt(0)}
                      </div>
                    )}
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
                    <Building2 className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                    <span className="truncate font-semibold text-slate-800">{branch?.name || 'Oficina'}</span>
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
      {selectedEmployeeForCustody && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <p className="text-xs text-indigo-300 font-mono">Custodia de Activos Fijos</p>
                <h3 className="font-bold text-base text-white">{selectedEmployeeForCustody.fullName}</h3>
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
      )}

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

              <div className="grid grid-cols-2 gap-3.5">
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
