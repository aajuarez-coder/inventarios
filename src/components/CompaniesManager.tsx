import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { Company } from '../types/inventory';
import { 
  Building2, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  Building, 
  Mail, 
  Phone, 
  MapPin, 
  FileText, 
  Hash, 
  X, 
  Check, 
  ShieldCheck, 
  Filter, 
  Layers, 
  Globe2, 
  Sparkles,
  ExternalLink,
  Laptop
} from 'lucide-react';

export const CompaniesManager: React.FC = () => {
  const { 
    companies, 
    branches, 
    assets, 
    addCompany, 
    updateCompany, 
    deleteCompany, 
    canEdit, 
    isViewer 
  } = useInventory();

  const [search, setSearch] = useState('');
  const [sectorFilter, setSectorFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);

  // Form Fields (ID and Name are strictly MANDATORY)
  const [formId, setFormId] = useState('');
  const [formName, setFormName] = useState('');
  const [formBusinessName, setFormBusinessName] = useState('');
  const [formRfc, setFormRfc] = useState('');
  const [formSector, setFormSector] = useState('Energía & Combustibles');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formState, setFormState] = useState('');
  const [formStatus, setFormStatus] = useState<'activa' | 'inactiva'>('activa');
  const [formNotes, setFormNotes] = useState('');

  // Form Validation & Error state
  const [formErrors, setFormErrors] = useState<{ id?: string; name?: string }>({});
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (message: string, isError = false) => {
    setActionFeedback({ type: isError ? 'error' : 'success', message });
    setTimeout(() => setActionFeedback(null), 4000);
  };

  const handleOpenAddModal = () => {
    setEditingCompany(null);
    setFormId(`COMP-PETROIL-${(companies.length + 1).toString().padStart(2, '0')}`);
    setFormName('');
    setFormBusinessName('');
    setFormRfc('');
    setFormSector('Energía & Combustibles');
    setFormPhone('+52 (55) 5123-4567');
    setFormEmail('');
    setFormAddress('');
    setFormCity('Ciudad de México');
    setFormState('CDMX');
    setFormStatus('activa');
    setFormNotes('');
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (comp: Company) => {
    setEditingCompany(comp);
    setFormId(comp.id);
    setFormName(comp.name);
    setFormBusinessName(comp.businessName || '');
    setFormRfc(comp.rfc || '');
    setFormSector(comp.sector || 'Corporativo');
    setFormPhone(comp.phone || '');
    setFormEmail(comp.email || '');
    setFormAddress(comp.address || '');
    setFormCity(comp.city || '');
    setFormState(comp.state || '');
    setFormStatus(comp.status || 'activa');
    setFormNotes(comp.notes || '');
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { id?: string; name?: string } = {};

    const cleanId = formId.trim().toUpperCase();
    const cleanName = formName.trim();

    // STRICT VALIDATION: id and name are MANDATORY
    if (!cleanId) {
      errors.id = 'El ID de la empresa es obligatorio (ej. COMP-PETROIL-01).';
    } else if (!/^[A-Z0-9\-_]+$/.test(cleanId)) {
      errors.id = 'El ID debe contener solo letras mayúsculas, números o guiones.';
    }

    if (!cleanName) {
      errors.name = 'El Nombre de la empresa es obligatorio.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      showNotification('Complete los campos obligatorios requeridos (ID y Nombre).', true);
      return;
    }

    if (editingCompany) {
      // Update
      const result = updateCompany(editingCompany.id, {
        name: cleanName,
        businessName: formBusinessName.trim() || undefined,
        rfc: formRfc.trim().toUpperCase() || undefined,
        sector: formSector.trim() || undefined,
        phone: formPhone.trim() || undefined,
        email: formEmail.trim().toLowerCase() || undefined,
        address: formAddress.trim() || undefined,
        city: formCity.trim() || undefined,
        state: formState.trim() || undefined,
        status: formStatus,
        notes: formNotes.trim() || undefined
      });

      if (result.success) {
        showNotification(`Empresa "${cleanName}" actualizada y sincronizada en Firestore.`);
        setIsModalOpen(false);
      } else {
        showNotification(result.error || 'Error al actualizar empresa.', true);
      }
    } else {
      // Create new
      const result = addCompany({
        id: cleanId,
        name: cleanName,
        businessName: formBusinessName.trim() || undefined,
        rfc: formRfc.trim().toUpperCase() || undefined,
        sector: formSector.trim() || undefined,
        phone: formPhone.trim() || undefined,
        email: formEmail.trim().toLowerCase() || undefined,
        address: formAddress.trim() || undefined,
        city: formCity.trim() || undefined,
        state: formState.trim() || undefined,
        status: formStatus,
        createdAt: new Date().toISOString().split('T')[0],
        notes: formNotes.trim() || undefined
      });

      if (result.success) {
        showNotification(`Empresa "${cleanName}" (${cleanId}) creada exitosamente en Google Cloud Firestore.`);
        setIsModalOpen(false);
      } else {
        showNotification(result.error || 'Error al registrar empresa.', true);
        if (result.error?.includes('identificador')) {
          setFormErrors({ id: result.error });
        }
      }
    }
  };

  const handleConfirmDelete = () => {
    if (!companyToDelete) return;
    const result = deleteCompany(companyToDelete.id);
    if (result.success) {
      showNotification(`Empresa "${companyToDelete.name}" eliminada de la base de datos.`);
      setCompanyToDelete(null);
    } else {
      showNotification(result.error || 'Error al eliminar empresa.', true);
    }
  };

  // Sectors list
  const sectors = Array.from(new Set(companies.map(c => c.sector).filter(Boolean))) as string[];

  // Filtered list
  const filteredCompanies = companies.filter(c => {
    const q = search.toLowerCase();
    const matchesSearch = 
      c.name.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q) ||
      (c.businessName && c.businessName.toLowerCase().includes(q)) ||
      (c.rfc && c.rfc.toLowerCase().includes(q)) ||
      (c.city && c.city.toLowerCase().includes(q));

    const matchesSector = sectorFilter === 'all' || c.sector === sectorFilter;
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;

    return matchesSearch && matchesSector && matchesStatus;
  });

  const activeCompaniesCount = companies.filter(c => c.status === 'activa').length;

  return (
    <div className="space-y-6">
      {/* Toast Feedback Notification */}
      {actionFeedback && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-2xl flex items-center gap-3 border transition-all animate-in fade-in slide-in-from-top-3 ${
          actionFeedback.type === 'success' 
            ? 'bg-emerald-950/95 border-emerald-500/40 text-emerald-200' 
            : 'bg-rose-950/95 border-rose-500/40 text-rose-200'
        }`}>
          {actionFeedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span className="text-sm font-semibold">{actionFeedback.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-indigo-900/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold">
              <Building2 className="w-4 h-4 text-indigo-400" />
              <span>Directorio Corporativo • Grupo Petroil</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Catálogo de Empresas y Filiales
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Administración de razones sociales, divisiones comerciales y entidades operativas. Cada empresa cuenta con un identificador fiscal único y nombre formal obligatorio vinculado a la infraestructura y colaboradores de TI.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleOpenAddModal}
              disabled={!canEdit || isViewer}
              className={`px-5 py-3 rounded-xl font-bold text-sm shadow-lg flex items-center gap-2.5 transition-all ${
                canEdit && !isViewer
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500 hover:shadow-emerald-500/25 active:scale-95'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Empresa</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-800/50 rounded-xl p-3.5 border border-slate-700/50">
            <p className="text-xs text-slate-400 font-medium">Total Empresas</p>
            <p className="text-2xl font-bold text-white mt-1">{companies.length}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Filiales registradas</p>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-3.5 border border-slate-700/50">
            <p className="text-xs text-emerald-400 font-medium">Empresas Activas</p>
            <p className="text-2xl font-bold text-emerald-300 mt-1">{activeCompaniesCount}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Operación vigente</p>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-3.5 border border-slate-700/50">
            <p className="text-xs text-indigo-400 font-medium">Sedes / Sucursales</p>
            <p className="text-2xl font-bold text-indigo-300 mt-1">{branches.length}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Almacenes y plantas</p>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-3.5 border border-slate-700/50">
            <p className="text-xs text-cyan-400 font-medium">Activos en Base</p>
            <p className="text-2xl font-bold text-cyan-300 mt-1">{assets.length}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Equipos en Cloud Firestore</p>
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por ID, nombre, razón social o RFC..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800 placeholder:text-slate-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-semibold text-slate-600">Sector:</span>
            <select
              value={sectorFilter}
              onChange={(e) => setSectorFilter(e.target.value)}
              className="text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Todos los sectores</option>
              {sectors.map(sec => (
                <option key={sec} value={sec}>{sec}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">Estatus:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Todos</option>
              <option value="activa">Activa</option>
              <option value="inactiva">Inactiva</option>
            </select>
          </div>
        </div>
      </div>

      {/* Companies List Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 px-4">ID de Empresa</th>
                <th className="py-3.5 px-4">Nombre Comercial</th>
                <th className="py-3.5 px-4">Razón Social & RFC</th>
                <th className="py-3.5 px-4">Sector / División</th>
                <th className="py-3.5 px-4">Ubicación / Contacto</th>
                <th className="py-3.5 px-4 text-center">Estatus</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredCompanies.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="font-semibold text-slate-700">No se encontraron empresas registradas</p>
                    <p className="text-xs text-slate-400 mt-1">Modifique los filtros o añada una nueva empresa con ID y Nombre obligatorios.</p>
                  </td>
                </tr>
              ) : (
                filteredCompanies.map((comp) => {
                  const linkedCount = branches.filter(b => b.companyId === comp.id).length;
                  return (
                    <tr key={comp.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-4 font-mono font-bold text-xs text-indigo-700">
                        <span className="inline-block px-2.5 py-1 bg-indigo-50 border border-indigo-200/60 rounded-md">
                          {comp.id}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                            {comp.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{comp.name}</p>
                            <p className="text-xs text-slate-400 font-mono">Alta: {comp.createdAt}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <p className="font-medium text-slate-800 text-xs">{comp.businessName || '—'}</p>
                        {comp.rfc && (
                          <span className="inline-block text-[11px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded mt-0.5">
                            RFC: {comp.rfc}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          <Layers className="w-3 h-3 text-slate-500" />
                          {comp.sector || 'Corporativo'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-xs text-slate-600">
                        {comp.city ? (
                          <p className="flex items-center gap-1 text-slate-700 font-medium">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            {comp.city}, {comp.state}
                          </p>
                        ) : (
                          <span className="text-slate-400">Sin dirección</span>
                        )}
                        {comp.phone && (
                          <p className="flex items-center gap-1 text-slate-500 text-[11px] mt-0.5">
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            {comp.phone}
                          </p>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          comp.status === 'activa'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${comp.status === 'activa' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          {comp.status === 'activa' ? 'Activa' : 'Inactiva'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(comp)}
                            disabled={!canEdit || isViewer}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-40"
                            title="Editar empresa"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setCompanyToDelete(comp)}
                            disabled={!canEdit || isViewer}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-40"
                            title="Eliminar empresa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {/* Modal: Add / Edit Company */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-indigo-900/40">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">
                    {editingCompany ? 'Editar Empresa / Filial' : 'Nueva Empresa Corporativa'}
                  </h3>
                  <p className="text-xs text-indigo-300">
                    {editingCompany ? 'Actualización de datos institucionales' : 'Alta en catálogo general (ID y Nombre obligatorios)'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 text-slate-800">
              {/* Obligatory Fields Alert */}
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2 font-medium">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Los campos marcados con <strong className="text-rose-600 font-bold">(*)</strong> (Identificador ID y Nombre) son obligatorios para el registro en Firestore.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* ID de la Empresa (OBLIGATORIO) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <span>ID de la Empresa</span>
                    <span className="text-rose-600 font-extrabold">* (Obligatorio)</span>
                  </label>
                  <input
                    type="text"
                    value={formId}
                    onChange={(e) => {
                      setFormId(e.target.value.toUpperCase());
                      if (formErrors.id) setFormErrors({ ...formErrors, id: undefined });
                    }}
                    disabled={!!editingCompany}
                    placeholder="ej. COMP-PETROIL-01"
                    className={`w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 uppercase ${
                      formErrors.id 
                        ? 'border-rose-400 ring-rose-200' 
                        : 'border-slate-300 focus:ring-indigo-500'
                    } ${editingCompany ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'text-slate-800'}`}
                  />
                  {formErrors.id ? (
                    <p className="text-[11px] text-rose-600 mt-1 font-semibold">{formErrors.id}</p>
                  ) : (
                    <p className="text-[10px] text-slate-400 mt-1">Clave alfanumérica única e inmutable</p>
                  )}
                </div>

                {/* Nombre de la Empresa (OBLIGATORIO) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <span>Nombre de la Empresa</span>
                    <span className="text-rose-600 font-extrabold">* (Obligatorio)</span>
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => {
                      setFormName(e.target.value);
                      if (formErrors.name) setFormErrors({ ...formErrors, name: undefined });
                    }}
                    placeholder="ej. Redpetroil Estaciones"
                    className={`w-full px-3 py-2 text-xs font-semibold rounded-xl border bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 ${
                      formErrors.name 
                        ? 'border-rose-400 ring-rose-200' 
                        : 'border-slate-300 focus:ring-indigo-500'
                    } text-slate-800`}
                  />
                  {formErrors.name && (
                    <p className="text-[11px] text-rose-600 mt-1 font-semibold">{formErrors.name}</p>
                  )}
                </div>
              </div>

              {/* Razón Social y RFC */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Razón Social (Fiscal)
                  </label>
                  <input
                    type="text"
                    value={formBusinessName}
                    onChange={(e) => setFormBusinessName(e.target.value)}
                    placeholder="ej. Redpetroil S.A. de C.V."
                    className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    RFC Fiscal
                  </label>
                  <input
                    type="text"
                    value={formRfc}
                    onChange={(e) => setFormRfc(e.target.value.toUpperCase())}
                    placeholder="ej. RED120415XYZ"
                    maxLength={13}
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 uppercase"
                  />
                </div>
              </div>

              {/* Sector y Estatus */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    División / Sector
                  </label>
                  <select
                    value={formSector}
                    onChange={(e) => setFormSector(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                  >
                    <option value="Corporativo & Dirección General">Corporativo & Dirección General</option>
                    <option value="Combustibles & Retail Gasolinero">Combustibles & Retail Gasolinero</option>
                    <option value="Distribución Mayorista de Hidrocarburos">Distribución Mayorista de Hidrocarburos</option>
                    <option value="Lubricantes & Fluidos Industriales">Lubricantes & Fluidos Industriales</option>
                    <option value="Transporte & Logística de Carga Peligrosa">Transporte & Logística de Carga Peligrosa</option>
                    <option value="Gas LP Residencial & Comercial">Gas LP Residencial & Comercial</option>
                    <option value="Tecnologías de Información y Sistemas">Tecnologías de Información y Sistemas</option>
                    <option value="Servicios Auxiliares & Mantenimiento">Servicios Auxiliares & Mantenimiento</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Estatus Operativo
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as 'activa' | 'inactiva')}
                    className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                  >
                    <option value="activa">Activa (En operación)</option>
                    <option value="inactiva">Inactiva (Suspendida)</option>
                  </select>
                </div>
              </div>

              {/* Teléfono y Correo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Teléfono Institucional
                  </label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+52 (55) 0000-0000"
                    className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="contacto@petroil.com.mx"
                    className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                  />
                </div>
              </div>

              {/* Domicilio, Ciudad y Estado */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ciudad
                  </label>
                  <input
                    type="text"
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    placeholder="ej. Mazatlán"
                    className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Estado
                  </label>
                  <input
                    type="text"
                    value={formState}
                    onChange={(e) => setFormState(e.target.value)}
                    placeholder="ej. Sinaloa"
                    className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Dirección
                  </label>
                  <input
                    type="text"
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    placeholder="Calle, Número, Colonia"
                    className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                  />
                </div>
              </div>

              {/* Notas */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Notas u Observaciones
                </label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  rows={2}
                  placeholder="Detalles sobre operaciones de la filial, centros de distribución..."
                  className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 resize-none"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingCompany ? 'Guardar Cambios' : 'Registrar Empresa'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {companyToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 p-6 animate-in fade-in zoom-in-95 text-slate-800">
            <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              ¿Eliminar la empresa "{companyToDelete.name}"?
            </h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Esta acción eliminará permanentemente la empresa con identificador <strong className="text-slate-800 font-mono">{companyToDelete.id}</strong> de la base de datos de Google Cloud Firestore.
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setCompanyToDelete(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md transition-all active:scale-95"
              >
                Confirmar Eliminación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
