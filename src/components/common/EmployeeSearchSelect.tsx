import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Employee } from '../../types/inventory';
import { Search, User, X, Check, ChevronDown, UserCheck, Briefcase, Building2, Hash } from 'lucide-react';

export interface EmployeeSearchSelectProps {
  employees: Employee[];
  selectedEmployeeId: string;
  onSelectEmployee: (employeeId: string, employee?: Employee) => void;
  label?: string;
  sublabel?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  darkTheme?: boolean;
  allowClear?: boolean;
  filterStatus?: ('activo' | 'licencia' | 'baja')[];
  filterBranchId?: string;
  helperText?: string;
  autoFocus?: boolean;
  id?: string;
}

export const EmployeeSearchSelect: React.FC<EmployeeSearchSelectProps> = ({
  employees,
  selectedEmployeeId,
  onSelectEmployee,
  label,
  sublabel,
  placeholder = 'Teclee nombre, # nómina, puesto, departamento o correo...',
  required = false,
  disabled = false,
  darkTheme = false,
  allowClear = true,
  filterStatus,
  filterBranchId,
  helperText,
  autoFocus = false,
  id
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  // Filter pool of employees
  const availableEmployees = useMemo(() => {
    return employees.filter(emp => {
      if (filterStatus && filterStatus.length > 0 && !filterStatus.includes(emp.status)) {
        return false;
      }
      if (filterBranchId && emp.branchId !== filterBranchId) {
        return false;
      }
      return true;
    });
  }, [employees, filterStatus, filterBranchId]);

  // Current selected employee
  const selectedEmployee = useMemo(() => {
    return employees.find(e => e.id === selectedEmployeeId);
  }, [employees, selectedEmployeeId]);

  // Search filter query
  const filteredEmployees = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return availableEmployees;
    return availableEmployees.filter(emp => {
      const matchName = emp.fullName.toLowerCase().includes(q);
      const matchNumber = emp.employeeNumber ? emp.employeeNumber.toLowerCase().includes(q) : false;
      const matchDept = emp.department ? emp.department.toLowerCase().includes(q) : false;
      const matchPosition = emp.position ? emp.position.toLowerCase().includes(q) : false;
      const matchEmail = emp.email ? emp.email.toLowerCase().includes(q) : false;
      return matchName || matchNumber || matchDept || matchPosition || matchEmail;
    });
  }, [availableEmployees, searchQuery]);

  // Reset highlight index when filtered list changes
  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredEmployees.length, searchQuery]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  const handleSelect = (emp: Employee) => {
    onSelectEmployee(emp.id, emp);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectEmployee('', undefined);
    setSearchQuery('');
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev + 1 < filteredEmployees.length ? prev + 1 : prev));
      scrollToHighlighted(highlightedIndex + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev - 1 >= 0 ? prev - 1 : 0));
      scrollToHighlighted(highlightedIndex - 1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredEmployees.length > 0 && highlightedIndex >= 0 && highlightedIndex < filteredEmployees.length) {
        handleSelect(filteredEmployees[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setSearchQuery('');
    }
  };

  const scrollToHighlighted = (index: number) => {
    if (listRef.current) {
      const items = listRef.current.querySelectorAll('li');
      if (items[index]) {
        items[index].scrollIntoView({ block: 'nearest' });
      }
    }
  };

  return (
    <div className="w-full relative" ref={containerRef}>
      {/* Label and Sublabel Header */}
      {(label || sublabel) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && (
            <label
              htmlFor={id}
              className={`text-xs sm:text-[13px] font-bold flex items-center gap-1.5 ${
                darkTheme ? 'text-[rgba(248,250,252,0.9)]' : 'text-slate-800'
              }`}
            >
              <User className={`w-3.5 h-3.5 ${darkTheme ? 'text-[#ff8200]' : 'text-indigo-600'}`} />
              <span>{label}</span>
              {required && <span className="text-rose-500 font-bold">*</span>}
            </label>
          )}
          {sublabel && (
            <span
              className={`text-[11px] font-medium ${
                darkTheme ? 'text-[rgba(248,250,252,0.5)]' : 'text-slate-500'
              }`}
            >
              {sublabel}
            </span>
          )}
        </div>
      )}

      {/* Main Trigger / Search Container */}
      {!selectedEmployee ? (
        // Unselected State: Search input directly or click to type
        <div className="relative">
          <div
            onClick={() => !disabled && setIsOpen(true)}
            className={`flex items-center w-full px-3.5 py-2.5 rounded-xl border transition-all cursor-text ${
              disabled
                ? darkTheme
                  ? 'bg-slate-800/40 border-slate-700 opacity-60 cursor-not-allowed'
                  : 'bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed'
                : isOpen
                ? darkTheme
                  ? 'bg-[#0a0e14] border-[#ff8200] ring-2 ring-[#ff8200]/25'
                  : 'bg-white border-[#ff8200] ring-2 ring-[#ff8200]/20 shadow-xs'
                : darkTheme
                ? 'bg-[#0a0e14] border-[rgba(248,250,252,0.15)] hover:border-[rgba(248,250,252,0.3)]'
                : 'bg-white border-slate-300 hover:border-slate-400 shadow-2xs'
            }`}
          >
            <Search
              className={`w-4 h-4 shrink-0 mr-2.5 ${
                isOpen
                  ? darkTheme
                    ? 'text-[#ff8200]'
                    : 'text-[#ff8200]'
                  : darkTheme
                  ? 'text-[rgba(248,250,252,0.4)]'
                  : 'text-slate-400'
              }`}
            />

            <input
              ref={searchInputRef}
              type="text"
              id={id}
              disabled={disabled}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (!isOpen) setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className={`w-full bg-transparent text-xs sm:text-sm font-medium outline-hidden ${
                darkTheme
                  ? 'text-[#f8fafc] placeholder:text-[rgba(248,250,252,0.35)]'
                  : 'text-slate-900 placeholder:text-slate-400'
              }`}
            />

            {searchQuery ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSearchQuery('');
                  searchInputRef.current?.focus();
                }}
                className={`p-1 rounded-md transition-colors cursor-pointer ${
                  darkTheme ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-600'
                }`}
                title="Limpiar búsqueda"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <ChevronDown
                className={`w-4 h-4 shrink-0 transition-transform ${
                  isOpen ? 'rotate-180' : ''
                } ${darkTheme ? 'text-[rgba(248,250,252,0.4)]' : 'text-slate-400'}`}
              />
            )}
          </div>
        </div>
      ) : (
        // Selected State: High-clarity badge card with Change / Clear actions
        <div
          className={`flex items-center justify-between p-2.5 sm:p-3 rounded-xl border transition-all ${
            darkTheme
              ? 'bg-[#0a0e14] border-[#004a99]/40 hover:border-[#ff8200]/50 text-[#f8fafc]'
              : 'bg-indigo-50/70 border-indigo-200 hover:border-indigo-300 text-slate-900 shadow-2xs'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs uppercase shrink-0 ${
                darkTheme
                  ? 'bg-[#004a99]/30 text-cyan-300 border border-[#004a99]/50'
                  : 'bg-indigo-600 text-white shadow-xs'
              }`}
            >
              {selectedEmployee.fullName.charAt(0)}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-xs sm:text-sm truncate">
                  {selectedEmployee.fullName}
                </span>
                {selectedEmployee.employeeNumber && (
                  <span
                    className={`font-mono text-[10px] px-1.5 py-0.5 rounded font-bold ${
                      darkTheme
                        ? 'bg-[#131a26] text-[#ff8200] border border-[#ff8200]/30'
                        : 'bg-white text-indigo-700 border border-indigo-200 shadow-2xs'
                    }`}
                  >
                    Nómina: {selectedEmployee.employeeNumber}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-[11px] truncate mt-0.5">
                <span className={darkTheme ? 'text-[rgba(248,250,252,0.6)]' : 'text-slate-600'}>
                  {selectedEmployee.position || 'Puesto no especificado'}
                </span>
                <span className={darkTheme ? 'text-[rgba(248,250,252,0.3)]' : 'text-slate-300'}>•</span>
                <span className={darkTheme ? 'text-[rgba(248,250,252,0.5)]' : 'text-slate-500 font-medium'}>
                  {selectedEmployee.department || 'Área'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            {!disabled && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(true);
                  setSearchQuery('');
                }}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                  darkTheme
                    ? 'bg-[#131a26] hover:bg-[#1c2638] text-[rgba(248,250,252,0.85)] border border-[rgba(248,250,252,0.15)]'
                    : 'bg-white hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                }`}
                title="Cambiar colaborador seleccionado"
              >
                <Search className="w-3 h-3" />
                <span>Cambiar</span>
              </button>
            )}

            {!disabled && allowClear && (
              <button
                type="button"
                onClick={handleClear}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  darkTheme
                    ? 'hover:bg-rose-950/40 text-slate-400 hover:text-rose-400'
                    : 'hover:bg-rose-50 text-slate-400 hover:text-rose-600'
                }`}
                title="Quitar selección"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Dropdown Menu Modal / List */}
      {isOpen && (
        <div
          className={`absolute z-50 left-0 right-0 mt-1.5 rounded-xl border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 ${
            darkTheme
              ? 'bg-[#131a26] border-[rgba(248,250,252,0.2)] text-[#f8fafc]'
              : 'bg-white border-slate-300 text-slate-900 ring-1 ring-black/5'
          }`}
          style={{ maxHeight: '340px' }}
        >
          {/* Header filter bar inside dropdown */}
          <div
            className={`p-2.5 border-b flex items-center justify-between text-[11px] font-mono ${
              darkTheme
                ? 'bg-[#0a0e14] border-[rgba(248,250,252,0.1)] text-[rgba(248,250,252,0.6)]'
                : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-[#ff8200]" />
              <span>
                {filteredEmployees.length} de {availableEmployees.length} colaboradores
              </span>
            </div>
            <span className="text-[10px] hidden sm:inline">
              Use ↑ ↓ y Enter para seleccionar
            </span>
          </div>

          {/* List of employees */}
          <ul
            ref={listRef}
            className={`overflow-y-auto divide-y max-h-60 ${
              darkTheme ? 'divide-slate-800' : 'divide-slate-100'
            }`}
          >
            {filteredEmployees.length === 0 ? (
              <li className="p-6 text-center">
                <p className={`text-xs font-medium ${darkTheme ? 'text-[rgba(248,250,252,0.5)]' : 'text-slate-500'}`}>
                  No se encontró ningún colaborador con "{searchQuery}".
                </p>
                <p className={`text-[11px] mt-1 ${darkTheme ? 'text-[rgba(248,250,252,0.3)]' : 'text-slate-400'}`}>
                  Intente teclear otro nombre, número de nómina, puesto o departamento.
                </p>
              </li>
            ) : (
              filteredEmployees.map((emp, index) => {
                const isSelected = emp.id === selectedEmployeeId;
                const isHighlighted = index === highlightedIndex;

                return (
                  <li
                    key={emp.id}
                    onClick={() => handleSelect(emp)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`px-3.5 py-2.5 cursor-pointer transition-colors flex items-center justify-between gap-3 ${
                      isSelected
                        ? darkTheme
                          ? 'bg-[#004a99]/25 text-white font-semibold'
                          : 'bg-indigo-50/90 text-indigo-950 font-semibold'
                        : isHighlighted
                        ? darkTheme
                          ? 'bg-white/[0.08] text-white'
                          : 'bg-slate-50 text-slate-900'
                        : darkTheme
                        ? 'hover:bg-white/[0.04]'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs uppercase shrink-0 ${
                          isSelected
                            ? darkTheme
                              ? 'bg-[#ff8200] text-slate-950'
                              : 'bg-indigo-600 text-white'
                            : darkTheme
                            ? 'bg-[#1c2638] text-slate-300'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {emp.fullName.charAt(0)}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-sm font-bold truncate">
                            {emp.fullName}
                          </span>
                          {emp.employeeNumber && (
                            <span
                              className={`font-mono text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0 ${
                                darkTheme
                                  ? 'bg-[#0a0e14] text-[#ff8200] border border-[#ff8200]/30'
                                  : 'bg-white text-indigo-700 border border-slate-200 shadow-2xs'
                              }`}
                            >
                              #{emp.employeeNumber}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-[11px] truncate mt-0.5">
                          <span className={darkTheme ? 'text-[rgba(248,250,252,0.6)]' : 'text-slate-600'}>
                            {emp.position || 'Puesto no asignado'}
                          </span>
                          <span className={darkTheme ? 'text-[rgba(248,250,252,0.3)]' : 'text-slate-300'}>•</span>
                          <span className={darkTheme ? 'text-[rgba(248,250,252,0.4)]' : 'text-slate-500'}>
                            {emp.department || 'Área'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {emp.email && (
                        <span
                          className={`text-[10px] font-mono hidden md:inline truncate max-w-[140px] ${
                            darkTheme ? 'text-[rgba(248,250,252,0.35)]' : 'text-slate-400'
                          }`}
                        >
                          {emp.email}
                        </span>
                      )}
                      {isSelected && (
                        <Check className={`w-4 h-4 ${darkTheme ? 'text-[#ff8200]' : 'text-indigo-600'}`} />
                      )}
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}

      {/* Hidden native input for form validation */}
      {required && (
        <input
          type="text"
          required={required}
          value={selectedEmployeeId}
          onChange={() => {}}
          className="opacity-0 absolute pointer-events-none h-0 w-0 bottom-0"
          tabIndex={-1}
        />
      )}

      {/* Optional helper text */}
      {helperText && (
        <p className={`text-[11px] mt-1 ${darkTheme ? 'text-[rgba(248,250,252,0.4)]' : 'text-slate-500'}`}>
          {helperText}
        </p>
      )}
    </div>
  );
};
