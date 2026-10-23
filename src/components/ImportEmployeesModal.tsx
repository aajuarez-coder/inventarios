import React, { useState, useRef } from 'react';
import { useInventory } from '../context/InventoryContext';
import { Employee } from '../types/inventory';
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  FileText, 
  Users, 
  HelpCircle,
  ArrowRight
} from 'lucide-react';
import { parseEmployeesFromCsv, downloadEmployeesCsvTemplate } from '../utils/importCsv';

interface ImportEmployeesModalProps {
  onClose: () => void;
  onSuccess: (count: number) => void;
}

export const ImportEmployeesModal: React.FC<ImportEmployeesModalProps> = ({
  onClose,
  onSuccess
}) => {
  const { employees, branches, addMultipleEmployees } = useInventory();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<{
    valid: Omit<Employee, 'id'>[];
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
        const result = parseEmployeesFromCsv(text, branches, employees);
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
    const count = addMultipleEmployees(parsedData.valid);
    onSuccess(count);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Importar Colaboradores desde CSV</h3>
              <p className="text-[11px] text-slate-400">Carga masiva al directorio de personal para asignación de equipos y responsivas</p>
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
                Descargar formato modelo de colaboradores
              </span>
              <p className="text-[11px] text-indigo-700">
                Obtén la plantilla oficial con encabezados requeridos (No. Empleado, Nombre, Correo, Departamento, Puesto, Sucursal).
              </p>
            </div>

            <button
              type="button"
              onClick={downloadEmployeesCsvTemplate}
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
                  ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01]' 
                  : 'border-slate-300 hover:border-indigo-500 hover:bg-slate-50/60 bg-white'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleInputChange}
                className="hidden"
              />

              <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-100/80 text-indigo-700 flex items-center justify-center mb-3 shadow-xs">
                <Users className="w-6 h-6" />
              </div>

              <h4 className="font-bold text-slate-800 text-sm mb-1">
                Haz clic para seleccionar o arrastra tu archivo CSV de colaboradores
              </h4>
              <p className="text-slate-500 text-[11px] max-w-sm mx-auto">
                Compatible con exportaciones de sistemas de nómina, ERP o archivos Excel guardados como delimitados por comas (.csv).
              </p>

              <div className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
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
                  <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
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
                    Colaboradores Válidos
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
                    Advertencias / Errores
                  </span>
                  <span className="text-base font-extrabold">
                    {parsedData.errors.length}
                  </span>
                </div>
              </div>

              {/* Warnings List */}
              {parsedData.errors.length > 0 && (
                <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between font-bold text-amber-900">
                    <span className="flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      Advertencias o colaboradores omitidos ({parsedData.errors.length}):
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
                  Vista previa de colaboradores a incorporar (Primeros {Math.min(parsedData.valid.length, 5)} de {parsedData.valid.length}):
                </h5>

                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                  <div className="overflow-x-auto max-h-56">
                    <table className="w-full text-left text-[11px] border-collapse">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] sticky top-0">
                        <tr>
                          <th className="py-2 px-3">No. Empleado</th>
                          <th className="py-2 px-3">Nombre Completo</th>
                          <th className="py-2 px-3">Correo Institucional</th>
                          <th className="py-2 px-3">Departamento</th>
                          <th className="py-2 px-3">Puesto</th>
                          <th className="py-2 px-3">Estatus</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {parsedData.valid.slice(0, 5).map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="py-2 px-3 font-mono font-bold text-indigo-700">{item.employeeNumber}</td>
                            <td className="py-2 px-3 font-medium text-slate-900">{item.fullName}</td>
                            <td className="py-2 px-3 font-mono text-slate-600">{item.email}</td>
                            <td className="py-2 px-3 text-slate-700">{item.department}</td>
                            <td className="py-2 px-3 text-slate-600">{item.position}</td>
                            <td className="py-2 px-3 capitalize font-semibold text-emerald-700">{item.status}</td>
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
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-sm shadow-indigo-200"
            >
              <span>Confirmar e Importar {parsedData.valid.length} Colaboradores</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
