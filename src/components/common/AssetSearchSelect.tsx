import React, { useState, useEffect, useMemo, useRef } from 'react';
import { HardwareAsset, AssetCategory, AssetStatus } from '../../types/inventory';
import { 
  Search, 
  Laptop, 
  Monitor, 
  Server, 
  Printer, 
  Network, 
  Cpu, 
  X, 
  Check, 
  ChevronDown, 
  HardDrive, 
  Tag, 
  ShieldCheck, 
  Layers,
  Tablet
} from 'lucide-react';

export interface AssetSearchSelectProps {
  assets: HardwareAsset[];
  selectedAssetId: string;
  onSelectAsset: (assetId: string, asset?: HardwareAsset) => void;
  label?: string;
  sublabel?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  darkTheme?: boolean;
  allowClear?: boolean;
  filterStatus?: AssetStatus[];
  filterBranchId?: string;
  helperText?: string;
  autoFocus?: boolean;
  id?: string;
  emptyNotice?: string;
}

const getCategoryIcon = (category: AssetCategory, className = 'w-4 h-4') => {
  switch (category) {
    case 'laptop':
      return <Laptop className={className} />;
    case 'desktop':
      return <Cpu className={className} />;
    case 'monitor':
      return <Monitor className={className} />;
    case 'tablet':
      return <Tablet className={className} />;
    case 'servidor':
      return <Server className={className} />;
    case 'impresora':
      return <Printer className={className} />;
    case 'redes':
      return <Network className={className} />;
    default:
      return <HardDrive className={className} />;
  }
};

const getStatusBadgeStyle = (status: AssetStatus, darkTheme: boolean) => {
  if (darkTheme) {
    switch (status) {
      case 'disponible':
        return 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60';
      case 'asignado':
        return 'bg-indigo-950/60 text-indigo-400 border-indigo-800/60';
      case 'mantenimiento':
        return 'bg-amber-950/60 text-amber-400 border-amber-800/60';
      case 'traslado':
        return 'bg-cyan-950/60 text-cyan-400 border-cyan-800/60';
      case 'baja':
        return 'bg-rose-950/60 text-rose-400 border-rose-800/60';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  }

  switch (status) {
    case 'disponible':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'asignado':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'mantenimiento':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'traslado':
      return 'bg-cyan-50 text-cyan-700 border-cyan-200';
    case 'baja':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

export const AssetSearchSelect: React.FC<AssetSearchSelectProps> = ({
  assets,
  selectedAssetId,
  onSelectAsset,
  label,
  sublabel,
  placeholder = 'Teclee etiqueta, marca, modelo, serie o procesador...',
  required = false,
  disabled = false,
  darkTheme = false,
  allowClear = true,
  filterStatus,
  filterBranchId,
  helperText,
  autoFocus = false,
  id,
  emptyNotice
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

  // Filter pool of assets
  const availableAssets = useMemo(() => {
    return assets.filter(asset => {
      if (filterStatus && filterStatus.length > 0 && !filterStatus.includes(asset.status)) {
        return false;
      }
      if (filterBranchId && asset.branchId !== filterBranchId) {
        return false;
      }
      return true;
    });
  }, [assets, filterStatus, filterBranchId]);

  // Current selected asset
  const selectedAsset = useMemo(() => {
    return assets.find(a => a.id === selectedAssetId);
  }, [assets, selectedAssetId]);

  // Search filter query
  const filteredAssets = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return availableAssets;
    return availableAssets.filter(asset => {
      const matchTag = asset.assetTag.toLowerCase().includes(q);
      const matchBrand = asset.brand.toLowerCase().includes(q);
      const matchModel = asset.model.toLowerCase().includes(q);
      const matchSerial = asset.serialNumber.toLowerCase().includes(q);
      const matchCategory = asset.category.toLowerCase().includes(q);
      const matchCpu = asset.specs?.cpu ? asset.specs.cpu.toLowerCase().includes(q) : false;
      const matchRam = asset.specs?.ram ? asset.specs.ram.toLowerCase().includes(q) : false;
      const matchStorage = asset.specs?.storage ? asset.specs.storage.toLowerCase().includes(q) : false;
      return matchTag || matchBrand || matchModel || matchSerial || matchCategory || matchCpu || matchRam || matchStorage;
    });
  }, [availableAssets, searchQuery]);

  // Reset highlight index when filtered list changes
  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredAssets.length, searchQuery]);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  const handleSelect = (asset: HardwareAsset) => {
    onSelectAsset(asset.id, asset);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectAsset('', undefined);
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
      setHighlightedIndex(prev => (prev + 1 < filteredAssets.length ? prev + 1 : prev));
      scrollToHighlighted(highlightedIndex + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev - 1 >= 0 ? prev - 1 : 0));
      scrollToHighlighted(highlightedIndex - 1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredAssets.length > 0 && highlightedIndex >= 0 && highlightedIndex < filteredAssets.length) {
        handleSelect(filteredAssets[highlightedIndex]);
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
              <Laptop className={`w-3.5 h-3.5 ${darkTheme ? 'text-[#ff8200]' : 'text-indigo-600'}`} />
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
      {!selectedAsset ? (
        // Unselected State
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
                  ? 'text-[#ff8200]'
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
        // Selected Asset Card
        <div
          className={`flex items-center justify-between p-2.5 sm:p-3 rounded-xl border transition-all ${
            darkTheme
              ? 'bg-[#0a0e14] border-[#004a99]/40 hover:border-[#ff8200]/50 text-[#f8fafc]'
              : 'bg-indigo-50/70 border-indigo-200 hover:border-indigo-300 text-slate-900 shadow-2xs'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`p-2 rounded-xl shrink-0 ${
                darkTheme
                  ? 'bg-[#004a99]/30 text-cyan-300 border border-[#004a99]/50'
                  : 'bg-indigo-600 text-white shadow-xs'
              }`}
            >
              {getCategoryIcon(selectedAsset.category, 'w-5 h-5')}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`font-mono text-xs px-2 py-0.5 rounded font-bold ${
                    darkTheme
                      ? 'bg-[#131a26] text-[#ff8200] border border-[#ff8200]/30'
                      : 'bg-white text-indigo-700 border border-indigo-200 shadow-2xs'
                  }`}
                >
                  {selectedAsset.assetTag}
                </span>

                <span className="font-bold text-xs sm:text-sm truncate">
                  {selectedAsset.brand} {selectedAsset.model}
                </span>

                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded border capitalize ${getStatusBadgeStyle(
                    selectedAsset.status,
                    darkTheme
                  )}`}
                >
                  {selectedAsset.status.replace('_', ' ')}
                </span>
              </div>

              <div className="flex items-center gap-2 text-[11px] truncate mt-1">
                <span className={`font-mono ${darkTheme ? 'text-[rgba(248,250,252,0.6)]' : 'text-slate-600'}`}>
                  S/N: {selectedAsset.serialNumber}
                </span>
                {selectedAsset.specs && (selectedAsset.specs.ram || selectedAsset.specs.storage) && (
                  <>
                    <span className={darkTheme ? 'text-[rgba(248,250,252,0.3)]' : 'text-slate-300'}>•</span>
                    <span className={darkTheme ? 'text-[rgba(248,250,252,0.5)]' : 'text-slate-500'}>
                      {[selectedAsset.specs.ram, selectedAsset.specs.storage].filter(Boolean).join(' | ')}
                    </span>
                  </>
                )}
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
                title="Cambiar equipo seleccionado"
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
              <Layers className="w-3.5 h-3.5 text-[#ff8200]" />
              <span>
                {filteredAssets.length} de {availableAssets.length} equipos disponibles
              </span>
            </div>
            <span className="text-[10px] hidden sm:inline">
              Use ↑ ↓ y Enter para seleccionar
            </span>
          </div>

          {/* List of assets */}
          <ul
            ref={listRef}
            className={`overflow-y-auto divide-y max-h-60 ${
              darkTheme ? 'divide-slate-800' : 'divide-slate-100'
            }`}
          >
            {filteredAssets.length === 0 ? (
              <li className="p-6 text-center">
                <p className={`text-xs font-medium ${darkTheme ? 'text-[rgba(248,250,252,0.5)]' : 'text-slate-500'}`}>
                  No se encontró ningún equipo con "{searchQuery}".
                </p>
                <p className={`text-[11px] mt-1 ${darkTheme ? 'text-[rgba(248,250,252,0.3)]' : 'text-slate-400'}`}>
                  {emptyNotice || 'Intente teclear placa de inventario, marca, modelo o serie.'}
                </p>
              </li>
            ) : (
              filteredAssets.map((asset, index) => {
                const isSelected = asset.id === selectedAssetId;
                const isHighlighted = index === highlightedIndex;

                return (
                  <li
                    key={asset.id}
                    onClick={() => handleSelect(asset)}
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
                        className={`p-2 rounded-lg shrink-0 ${
                          isSelected
                            ? darkTheme
                              ? 'bg-[#ff8200] text-slate-950'
                              : 'bg-indigo-600 text-white'
                            : darkTheme
                            ? 'bg-[#1c2638] text-slate-300'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {getCategoryIcon(asset.category, 'w-4 h-4')}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`font-mono text-xs px-2 py-0.5 rounded font-bold ${
                              darkTheme
                                ? 'bg-[#0a0e14] text-[#ff8200] border border-[#ff8200]/30'
                                : 'bg-slate-100 text-slate-800 border border-slate-200'
                            }`}
                          >
                            {asset.assetTag}
                          </span>

                          <span className="text-xs sm:text-sm font-bold truncate">
                            {asset.brand} {asset.model}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] truncate mt-0.5">
                          <span className={`font-mono ${darkTheme ? 'text-[rgba(248,250,252,0.6)]' : 'text-slate-600'}`}>
                            S/N: {asset.serialNumber}
                          </span>
                          {asset.specs && (asset.specs.ram || asset.specs.storage) && (
                            <>
                              <span className={darkTheme ? 'text-[rgba(248,250,252,0.3)]' : 'text-slate-300'}>•</span>
                              <span className={darkTheme ? 'text-[rgba(248,250,252,0.4)]' : 'text-slate-500'}>
                                {[asset.specs.ram, asset.specs.storage].filter(Boolean).join(' | ')}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border capitalize ${getStatusBadgeStyle(
                          asset.status,
                          darkTheme
                        )}`}
                      >
                        {asset.status.replace('_', ' ')}
                      </span>
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
          value={selectedAssetId}
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
