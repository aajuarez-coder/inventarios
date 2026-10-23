import React, { useState, useRef } from 'react';
import { useInventory } from '../context/InventoryContext';
import { HardwareAsset } from '../types/inventory';
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  FileText, 
  Cpu, 
  HelpCircle,
  ArrowRight
} from 'lucide-react';
import { parseHardwareAssetsFromCsv, downloadHardwareCsvTemplate } from '../utils/importCsv';

interface ImportHardwareModalProps {
  onClose: () => void;
  onSuccess: (count: number) => void;
}

export const ImportHardwareModal: React.FC<ImportHardwareModalProps> = ({
  onClose,
  onSuccess
}) => {
  const { assets, branches, addMultipleAssets } = useInventory();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<{
    valid: Omit<HardwareAsset, 'id'>[];
    errors: { row: number; error: string; raw: Record<string, string> }[];
    duplicates: string[];
  } | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [ignoreErrors, setIgnoreErrors] = useState(true);

  const handleFileProcess = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv') {
      alert('Por favor seleccione un archivo en formato .csv válido.');
      return;
    }

    setFileName(file.name);
    setFileSize((file.size / 1024).toFixed(1) + ' KB');

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        const result = parseHardwareAssetsFromCsv(text, branches, assets);
        setParsedData(result);
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileProcess(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileProcess(file);
  };

  const handleConfirmImport = () => {
    if (!parsedData || parsedData.valid.length === 0) return;
    const count = addMultipleAssets(parsedData.valid);
    onSuccess(count);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Importar Equipos de Hardware desde CSV</h3>
              <p className="text-[11px] text-slate-400">Carga masiva de laptops, computadoras de escritorio, servidores y periféricos</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 rounded text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
          
          {/* Instructions and Download Template Bar */}
          <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-indigo-950">
            <div className="space-y-0.5">
              <span className="font-bold flex items-center gap-1.5 text-indigo-900">
                <HelpCircle className="w-4 h-4 text-indigo-600 shrink-0" />
                ¿No tienes el archivo con el formato requerido?
              </span>
              <p className="text-[11px] text-indigo-700">
                Descarga la plantilla oficial con encabezados compatibles y filas de ejemplo listas para rellenar.
              </p>
            </div>

            <button
              type="button"
              onClick={downloadHardwareCsvTemplate}
              className="px-3.5 py-2 rounded-lg bg-white border border-indigo-300 hover:bg-indigo-100/70 text-indigo-700 font-bold transition-colors flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4 text-indigo-600" />
              <span>Descargar Plantilla CSV</span>
            </button>
          </div>

          {/* Upload Area */}
          {!parsedData ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                isDragging 
                  ? 'border-emerald-500 bg-emerald-50/50 scale-[1.01]' 
                  : 'border-slate-300 hover:border-emerald-500 hover:bg-slate-50/60 bg-white'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleInputChange}
                className="hidden"
              />

              <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center mb-3 shadow-xs">
                <FileSpreadsheet className="w-6 h-6" />
              </div>

              <h4 className="font-bold text-slate-800 text-sm mb-1">
                Haz clic para seleccionar o arrastra tu archivo CSV aquí
              </h4>
              <p className="text-slate-500 text-[11px] max-w-sm mx-auto">
                Admite archivos con columnas de Placa, Serie, Marca, Modelo, Procesador, Memoria RAM, Almacenamiento y Almacén.
              </p>

              <div className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                <Upload className="w-3.5 h-3.5" />
                Examinar Archivo (.csv)
              </div>
            </div>
          ) : (
            /* Analysis & Preview */
            <div className="space-y-4">
              
              {/* File Info Banner */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                  <div>
                    <span className="font-bold text-slate-900">{fileName}</span>
                    <span className="text-[11px] text-slate-400 ml-2 font-mono">{fileSize}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setParsedData(null);
                    setFileName(null);
                    setFileSize(null);
                  }}
                  className="text-xs text-indigo-600 hover:underline font-semibold cursor-pointer"
                >
                  Cambiar archivo
                </button>
              </div>

              {/* Summary Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Filas detectadas</span>
                  <span className="text-base font-extrabold text-slate-800">
                    {parsedData.valid.length + parsedData.errors.length}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                  <span className="text-[10px] text-emerald-600 uppercase font-bold block flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Listos para Importar
                  </span>
                  <span className="text-base font-extrabold text-emerald-700">
                    {parsedData.valid.length}
                  </span>
                </div>

                <div className={`p-3 rounded-xl border ${
                  parsedData.errors.length > 0 
                    ? 'bg-amber-50 border-amber-200 text-amber-900' 
                    : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}>
                  <span className="text-[10px] uppercase font-bold block flex items-center justify-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Filas con Advertencias
                  </span>
                  <span className="text-base font-extrabold">
                    {parsedData.errors.length}
                  </span>
                </div>
              </div>

              {/* Errors / Warnings List if any */}
              {parsedData.errors.length > 0 && (
                <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between font-bold text-amber-900">
                    <span className="flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      Advertencias o registros omitidos ({parsedData.errors.length}):
                    </span>
                    <label className="flex items-center gap-1.5 text-[11px] font-normal cursor-pointer text-amber-950">
                      <input
                        type="checkbox"
                        checked={ignoreErrors}
                        onChange={(e) => setIgnoreErrors(e.target.checked)}
                        className="rounded text-amber-600 focus:ring-amber-400"
                      />
                      <span>Ignorar errores e importar válidos</span>
                    </label>
                  </div>

                  <div className="max-h-28 overflow-y-auto space-y-1 text-[11px] text-amber-800">
                    {parsedData.errors.map((err, idx) => (
                      <div key={idx} className="flex items-start gap-1.5">
                        <span className="font-mono font-bold bg-amber-100 text-amber-900 px-1 rounded shrink-0">
                          Fila {err.row}:
                        </span>
                        <span>{err.error}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Data Preview Table */}
              <div>
                <h5 className="font-bold text-slate-700 text-xs mb-2 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-600" />
                  Vista previa de activos a incorporar (Primeros {Math.min(parsedData.valid.length, 5)} de {parsedData.valid.length}):
                </h5>

                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                  <div className="overflow-x-auto max-h-56">
                    <table className="w-full text-left text-[11px] border-collapse">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] sticky top-0">
                        <tr>
                          <th className="py-2 px-3">Placa / Tag</th>
                          <th className="py-2 px-3">Número de Serie</th>
                          <th className="py-2 px-3">Equipo (Marca & Modelo)</th>
                          <th className="py-2 px-3">Categoría</th>
                          <th className="py-2 px-3">CPU / RAM / Disco</th>
                          <th className="py-2 px-3">Condición</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {parsedData.valid.slice(0, 5).map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="py-2 px-3 font-mono font-bold text-indigo-700">{item.assetTag}</td>
                            <td className="py-2 px-3 font-mono text-slate-600">{item.serialNumber}</td>
                            <td className="py-2 px-3 font-medium text-slate-900">{item.brand} {item.model}</td>
                            <td className="py-2 px-3 uppercase text-[10px] font-semibold text-slate-500">{item.category}</td>
                            <td className="py-2 px-3 text-slate-600 truncate max-w-[180px]">
                              {item.specs.cpu} • {item.specs.ram} • {item.specs.storage}
                            </td>
                            <td className="py-2 px-3 capitalize font-semibold text-emerald-700">{item.physicalCondition}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium text-xs cursor-pointer"
          >
            Cancelar
          </button>

          {parsedData && (
            <button
              type="button"
              disabled={parsedData.valid.length === 0}
              onClick={handleConfirmImport}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-sm shadow-emerald-200"
            >
              <span>Confirmar e Importar {parsedData.valid.length} Equipos</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
