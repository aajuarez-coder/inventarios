import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { 
  Terminal, 
  Download, 
  Copy, 
  Check, 
  FileCode, 
  Upload, 
  Cpu, 
  Laptop, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Sparkles,
  Apple,
  Layers,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface HardwareExtractionModalProps {
  onClose: () => void;
  onImportComplete?: () => void;
}

export const HardwareExtractionModal: React.FC<HardwareExtractionModalProps> = ({
  onClose,
  onImportComplete
}) => {
  const { addAsset, branches, assets, currentUser, canEdit, isViewer } = useInventory();
  const [activeTab, setActiveTab] = useState<'windows' | 'mac' | 'import'>('windows');
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedOneLiner, setCopiedOneLiner] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [parsedData, setParsedData] = useState<any>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [assignedBranchId, setAssignedBranchId] = useState(branches[0]?.id || 'branch-1');
  const [assetTag, setAssetTag] = useState(`EQ-${new Date().getFullYear()}-${(assets.length + 1).toString().padStart(3, '0')}`);

  // Windows PowerShell script
  const windowsScript = `# ==============================================================================
# Sistema de Inventarios Grupo Petroil - Script de Auditoria y Extraccion de Hardware
# Compatible con Windows 10, Windows 11 y Windows Server
# ==============================================================================

Write-Host "Iniciando extraccion de especificaciones de hardware..." -ForegroundColor Cyan

$cs = Get-CimInstance Win32_ComputerSystem
$bios = Get-CimInstance Win32_BIOS
$cpu = Get-CimInstance Win32_Processor | Select-Object -First 1
$os = Get-CimInstance Win32_OperatingSystem
$disks = Get-CimInstance Win32_DiskDrive
$net = Get-CimInstance Win32_NetworkAdapterConfiguration | Where-Object { $_.IPEnabled -eq $true } | Select-Object -First 1

$ramGB = [Math]::Round($cs.TotalPhysicalMemory / 1GB)
$totalDiskGB = 0
foreach ($d in $disks) {
    $totalDiskGB += [Math]::Round($d.Size / 1GB)
}
$diskType = if ($disks[0].MediaType) { $disks[0].MediaType } else { "SSD / NVMe" }

$category = if ($cs.PCSystemType -eq 2) { "laptop" } else { "desktop" }

$hardwareData = [ordered]@{
    serialNumber = $bios.SerialNumber.Trim()
    brand        = $cs.Manufacturer.Trim()
    model        = $cs.Model.Trim()
    category     = $category
    cpu          = $cpu.Name.Trim()
    ram          = "$($ramGB) GB RAM"
    storage      = "$($totalDiskGB) GB $diskType"
    os           = "$($os.Caption) ($($os.OSArchitecture))".Trim()
    macAddress   = if ($net) { $net.MACAddress } else { "N/A" }
    ipAddress    = if ($net -and $net.IPAddress) { $net.IPAddress[0] } else { "N/A" }
    extractedDate= (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
}

$jsonOutput = $hardwareData | ConvertTo-Json -Depth 3
$desktopPath = [Environment]::GetFolderPath("Desktop")
$outputPath = Join-Path $desktopPath "datos_equipo_itasset.json"

$jsonOutput | Out-File -FilePath $outputPath -Encoding utf8

try {
    $jsonOutput | Set-Clipboard
    Write-Host "[OK] Especificaciones copiadas al portapapeles!" -ForegroundColor Green
} catch {
    Write-Host "[INFO] Copia el contenido del archivo JSON generado." -ForegroundColor Yellow
}

Write-Host "Archivo generado en: $outputPath" -ForegroundColor Cyan
Write-Host "Pega el contenido en ITAsset Pro para registrar el equipo en 1 segundo." -ForegroundColor White
`;

  // macOS Shell script
  const macScript = `#!/bin/bash
# ==============================================================================
# ITAsset Pro - Script de Auditoria y Extraccion de Hardware para macOS
# Compatible con Apple Silicon (M1/M2/M3/M4) e Intel Core
# ==============================================================================

echo "Recolectando especificaciones de hardware de macOS..."

SERIAL=$(system_profiler SPHardwareDataType | awk -F': ' '/Serial Number/ {print $2}' | xargs)
MODEL_NAME=$(system_profiler SPHardwareDataType | awk -F': ' '/Model Name/ {print $2}' | xargs)
CHIP_NAME=$(system_profiler SPHardwareDataType | awk -F': ' '/Chip|Processor Name/ {print $2}' | xargs)
MEMORY=$(system_profiler SPHardwareDataType | awk -F': ' '/Memory/ {print $2}' | xargs)
OS_VER=$(sw_vers -productName)
OS_NUM=$(sw_vers -productVersion)
STORAGE=$(system_profiler SPStorageDataType | awk -F': ' '/Capacity/ {print $2}' | head -n 1 | xargs)
MAC_ADDR=$(ifconfig en0 2>/dev/null | awk '/ether/{print $2}' | xargs)
IP_ADDR=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null)

CATEGORY="laptop"
if [[ "$MODEL_NAME" == *"Mac mini"* ]] || [[ "$MODEL_NAME" == *"Mac Studio"* ]] || [[ "$MODEL_NAME" == *"Mac Pro"* ]] || [[ "$MODEL_NAME" == *"iMac"* ]]; then
  CATEGORY="desktop"
fi

OUTPUT_FILE="$HOME/Desktop/datos_equipo_itasset.json"

cat <<EOF > "$OUTPUT_FILE"
{
  "serialNumber": "\${SERIAL}",
  "brand": "Apple",
  "model": "\${MODEL_NAME}",
  "category": "\${CATEGORY}",
  "cpu": "\${CHIP_NAME}",
  "ram": "\${MEMORY}",
  "storage": "\${STORAGE}",
  "os": "\${OS_VER} \${OS_NUM}",
  "macAddress": "\${MAC_ADDR}",
  "ipAddress": "\${IP_ADDR}",
  "extractedDate": "$(date '+%Y-%m-%d %H:%M:%S')"
}
EOF

echo "Archivo generado en: $OUTPUT_FILE"
if command -v pbcopy >/dev/null 2>&1; then
  cat "$OUTPUT_FILE" | pbcopy
  echo "[OK] Datos copiados al portapapeles. Ya puedes pegarlos en ITAsset Pro!"
fi
`;

  const windowsOneLiner = `powershell -ExecutionPolicy Bypass -Command "& {[scriptblock]::Create((Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/petroil/itasset/main/scripts/extract_windows.ps1' -UseBasicParsing).Content).Invoke()}"`;
  const macOneLiner = `bash -c "$(curl -fsSL https://raw.githubusercontent.com/petroil/itasset/main/scripts/extract_mac.sh)"`;

  const handleDownloadWindows = () => {
    const blob = new Blob([windowsScript], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'extraer_hardware_windows.ps1';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadMac = () => {
    const blob = new Blob([macScript], { type: 'text/x-sh;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'extraer_hardware_mac.sh';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyCode = (text: string, isOneLiner = false) => {
    navigator.clipboard.writeText(text);
    if (isOneLiner) {
      setCopiedOneLiner(true);
      setTimeout(() => setCopiedOneLiner(false), 2000);
    } else {
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2000);
    }
  };

  const handleParseJson = (content: string) => {
    try {
      setParseError(null);
      const parsed = JSON.parse(content.trim());
      if (!parsed.serialNumber && !parsed.model && !parsed.brand) {
        throw new Error('El JSON no contiene campos válidos de hardware.');
      }
      setParsedData(parsed);
    } catch (e: any) {
      setParseError('Error de formato JSON: Asegúrese de copiar el texto completo generado por el script.');
      setParsedData(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setJsonInput(text);
        handleParseJson(text);
      }
    };
    reader.readAsText(file);
  };

  const handleSaveImportedAsset = () => {
    if (!canEdit) {
      alert('Acceso restringido: El perfil Visor (Solo Lectura) no tiene permisos para dar de alta activos en el inventario. Por favor seleccione un perfil con permisos de edición (Edición Total o Administrador TI).');
      return;
    }

    if (!parsedData) return;

    const brand = parsedData.brand || 'Genérico';
    const model = parsedData.model || 'Equipo de Cómputo';

    addAsset({
      assetTag: assetTag.trim(),
      serialNumber: parsedData.serialNumber || `SN-${Date.now()}`,
      name: `${brand} ${model}`,
      category: (parsedData.category as any) || 'laptop',
      brand,
      model,
      specs: {
        cpu: parsedData.cpu || 'Procesador Estándar',
        ram: parsedData.ram || '16 GB',
        storage: parsedData.storage || '512 GB SSD',
        os: parsedData.os || 'Windows 11 / macOS',
        macAddress: parsedData.macAddress || 'N/A',
        ipAddress: parsedData.ipAddress || '192.168.1.100'
      },
      status: 'disponible',
      physicalCondition: 'excelente',
      branchId: assignedBranchId,
      locationDetails: 'Almacén Central TI (Alta Automática por Script)',
      purchaseDate: new Date().toISOString().split('T')[0],
      purchaseCost: 22000,
      currency: 'MXN',
      supplier: brand === 'Apple' ? 'Apple Store Corporativo' : 'Proveedor de TI',
      invoiceNumber: `AUTOSCRIPT-${Math.floor(10000 + Math.random() * 90000)}`,
      warrantyEndDate: new Date(Date.now() + 365 * 24 * 3600 * 1000 * 3).toISOString().split('T')[0], // 3 years warranty
      nextMaintenanceDate: new Date(Date.now() + 180 * 24 * 3600 * 1000).toISOString().split('T')[0], // 6 months next maint
      maintenanceIntervalMonths: 6,
      accessoriesIncluded: ['Cargador original', 'Cable de alimentación'],
      notes: `Equipo auditado y extraído automáticamente mediante script el ${parsedData.extractedDate || new Date().toLocaleString()}.`
    });

    confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
    if (onImportComplete) onImportComplete();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95">
        
        {/* Top Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white shadow-md shadow-indigo-500/20">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white tracking-tight">
                  Extracción Automática de Hardware (Scripts Windows & macOS)
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 hidden sm:inline-block">
                  Auditoría Rápida
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Ejecuta el script en el equipo objetivo para extraer CPU, RAM, disco, serial y registrarlo al instante.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 gap-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('windows')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'windows' 
                ? 'border-indigo-600 text-indigo-600' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            Windows PowerShell (.ps1)
          </button>

          <button
            onClick={() => setActiveTab('mac')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'mac' 
                ? 'border-indigo-600 text-indigo-600' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Apple className="w-3.5 h-3.5 text-slate-800" />
            macOS Bash / Terminal (.sh)
          </button>

          <button
            onClick={() => setActiveTab('import')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-2 ml-auto ${
              activeTab === 'import' 
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 px-3 rounded-t-lg' 
                : 'border-transparent text-emerald-600 hover:text-emerald-700 font-bold'
            }`}
          >
            <Upload className="w-4 h-4" />
            Pegar / Importar JSON Extraído {parsedData && '✓'}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 text-xs space-y-5">
          
          {/* WINDOWS TAB */}
          {activeTab === 'windows' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-blue-50 border border-blue-200 p-3.5 rounded-xl text-blue-900">
                <div className="space-y-0.5">
                  <p className="font-bold flex items-center gap-1.5">
                    <FileCode className="w-4 h-4 text-blue-600" />
                    Script PowerShell para Windows 10, 11 y Windows Server
                  </p>
                  <p className="text-[11px] text-blue-700">
                    Extrae fabricante, modelo, número de serie del BIOS, núcleos del procesador, capacidad de RAM, discos y MAC address.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleDownloadWindows}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Descargar .ps1
                  </button>
                  <button
                    onClick={() => handleCopyCode(windowsScript)}
                    className="px-3 py-1.5 rounded-lg bg-white border border-blue-300 hover:bg-blue-100 text-blue-800 font-medium flex items-center gap-1.5 transition-colors"
                  >
                    {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedScript ? 'Copiado' : 'Copiar Código'}
                  </button>
                </div>
              </div>

              {/* Instructions steps */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-slate-700 text-[11px]">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="font-bold text-indigo-700 block mb-1">Paso 1: Descargar o Copiar</span>
                  Descarga el archivo <code>extraer_hardware_windows.ps1</code> o copia el script al portapapeles.
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="font-bold text-indigo-700 block mb-1">Paso 2: Ejecutar en el Equipo</span>
                  Abre PowerShell en la PC cliente y ejecuta:
                  <div className="mt-1 bg-slate-900 text-emerald-400 p-1 rounded font-mono text-[10px]">
                    .\extraer_hardware_windows.ps1
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="font-bold text-indigo-700 block mb-1">Paso 3: Pegar en ITAsset Pro</span>
                  El script guardará <code>datos_equipo_itasset.json</code> en el Escritorio y lo copiará al portapapeles listo para importar.
                </div>
              </div>

              {/* Code viewer */}
              <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 text-slate-200 font-mono text-[11px] max-h-64 overflow-y-auto p-4">
                <button
                  onClick={() => handleCopyCode(windowsScript)}
                  className="absolute right-3 top-3 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] flex items-center gap-1"
                >
                  {copiedScript ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copiedScript ? 'Copiado' : 'Copiar'}
                </button>
                <pre>{windowsScript}</pre>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setActiveTab('import')}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-2"
                >
                  Ya ejecuté el script, importar datos JSON <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* MAC TAB */}
          {activeTab === 'mac' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-100 border border-slate-300 p-3.5 rounded-xl text-slate-900">
                <div className="space-y-0.5">
                  <p className="font-bold flex items-center gap-1.5">
                    <Apple className="w-4 h-4 text-slate-800" />
                    Script Bash / Terminal para macOS (Apple Silicon M1/M2/M3/M4 & Intel)
                  </p>
                  <p className="text-[11px] text-slate-600">
                    Utiliza <code>system_profiler</code> nativo para consultar chip Apple Silicon, memoria unificada, número de serie y almacenamiento.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleDownloadMac}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Descargar .sh
                  </button>
                  <button
                    onClick={() => handleCopyCode(macScript)}
                    className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-medium flex items-center gap-1.5 transition-colors"
                  >
                    {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedScript ? 'Copiado' : 'Copiar Código'}
                  </button>
                </div>
              </div>

              {/* Instructions steps */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-slate-700 text-[11px]">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="font-bold text-slate-900 block mb-1">Paso 1: Abrir Terminal</span>
                  Abre la aplicación <strong>Terminal</strong> en tu Mac (Command + Espacio, escribe Terminal).
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="font-bold text-slate-900 block mb-1">Paso 2: Ejecutar Script</span>
                  Arrastra el archivo <code>extraer_hardware_mac.sh</code> a la terminal o ejecuta:
                  <div className="mt-1 bg-slate-900 text-emerald-400 p-1 rounded font-mono text-[10px]">
                    bash extraer_hardware_mac.sh
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="font-bold text-slate-900 block mb-1">Paso 3: Pegar en el Sistema</span>
                  El script genera <code>datos_equipo_itasset.json</code> en el Escritorio y lo envía a tu portapapeles (pbcopy).
                </div>
              </div>

              {/* Code viewer */}
              <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 text-slate-200 font-mono text-[11px] max-h-64 overflow-y-auto p-4">
                <button
                  onClick={() => handleCopyCode(macScript)}
                  className="absolute right-3 top-3 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] flex items-center gap-1"
                >
                  {copiedScript ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copiedScript ? 'Copiado' : 'Copiar'}
                </button>
                <pre>{macScript}</pre>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setActiveTab('import')}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-2"
                >
                  Ya ejecuté el script, importar datos JSON <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* IMPORT TAB */}
          {activeTab === 'import' && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl text-emerald-950 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5 text-xs">
                  <p className="font-bold">Importación Directa de Especificaciones</p>
                  <p className="text-[11px] text-emerald-800">
                    Pega el contenido JSON copiado por el script o sube el archivo <code>datos_equipo_itasset.json</code> generado en el Escritorio.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Left: Input box & file upload */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-700 text-xs">Pega el JSON aquí:</label>
                    <label className="text-indigo-600 hover:text-indigo-800 cursor-pointer font-medium text-xs flex items-center gap-1">
                      <Upload className="w-3.5 h-3.5" />
                      Cargar archivo .json
                      <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
                    </label>
                  </div>

                  <textarea
                    rows={8}
                    value={jsonInput}
                    onChange={(e) => {
                      setJsonInput(e.target.value);
                      handleParseJson(e.target.value);
                    }}
                    placeholder={`{\n  "serialNumber": "PF39KLA901",\n  "brand": "Lenovo",\n  "model": "ThinkPad T14",\n  "cpu": "Intel Core i7-1365U",\n  "ram": "32 GB RAM",\n  "storage": "1000 GB NVMe SSD",\n  "os": "Windows 11 Pro",\n  "macAddress": "9C:B6:D0:41:A2:7B"\n}`}
                    className="w-full font-mono text-[13px] leading-relaxed p-3.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#ff8200]/25 focus:border-[#ff8200] outline-hidden bg-slate-50 focus:bg-white transition-colors text-slate-900 caret-[#ff8200]"
                  />

                  {parseError && (
                    <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{parseError}</span>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const example = JSON.stringify({
                          serialNumber: "C02G" + Math.floor(100000 + Math.random() * 900000),
                          brand: "Apple",
                          model: "MacBook Pro 16",
                          category: "laptop",
                          cpu: "Apple M3 Pro (12 CPU cores)",
                          ram: "36 GB Memoria Unificada",
                          storage: "512 GB SSD NVMe",
                          os: "macOS Sonoma 14.5",
                          macAddress: "F0:18:98:8C:11:42",
                          ipAddress: "192.168.1.150",
                          extractedDate: new Date().toLocaleString()
                        }, null, 2);
                        setJsonInput(example);
                        handleParseJson(example);
                      }}
                      className="text-xs text-slate-500 hover:text-indigo-600 underline"
                    >
                      Cargar datos de prueba (Simular MacBook Pro)
                    </button>
                  </div>
                </div>

                {/* Right: Parsed Preview & Final Details */}
                <div className="space-y-3">
                  <span className="font-bold text-slate-700 text-xs block">Vista Previa de Datos Auditados:</span>

                  {parsedData ? (
                    <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/40 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-indigo-100">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-indigo-700 block">Equipo Detectado</span>
                          <strong className="text-slate-900 text-sm">{parsedData.brand} {parsedData.model}</strong>
                        </div>
                        <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                          {parsedData.category || 'laptop'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-700">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Número de Serie (S/N):</span>
                          <strong className="font-mono text-slate-900">{parsedData.serialNumber || 'N/A'}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Procesador / Chip:</span>
                          <span className="text-slate-800">{parsedData.cpu || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Memoria RAM:</span>
                          <span className="text-slate-800">{parsedData.ram || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Almacenamiento:</span>
                          <span className="text-slate-800">{parsedData.storage || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Sistema Operativo:</span>
                          <span className="text-slate-800 truncate block">{parsedData.os || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Dirección MAC:</span>
                          <span className="font-mono text-slate-800">{parsedData.macAddress || 'N/A'}</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-indigo-100 space-y-2">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-semibold text-slate-700 block mb-1">Asignar Placa (Asset Tag):</label>
                            <input
                              type="text"
                              value={assetTag}
                              onChange={(e) => setAssetTag(e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-sm tracking-tight bg-white text-slate-900 focus:ring-2 focus:ring-[#ff8200]/25 focus:border-[#ff8200] outline-hidden uppercase caret-[#ff8200]"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-semibold text-slate-700 block mb-1">Sucursal / Almacén:</label>
                            <select
                              value={assignedBranchId}
                              onChange={(e) => setAssignedBranchId(e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-medium bg-white text-slate-900 focus:ring-2 focus:ring-[#ff8200]/25 focus:border-[#ff8200] outline-hidden cursor-pointer"
                            >
                              {branches.map(b => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleSaveImportedAsset}
                          className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors mt-2"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Registrar e Ingresar al Inventario
                        </button>
                      </div>

                    </div>
                  ) : (
                    <div className="p-8 rounded-xl border-2 border-dashed border-slate-200 text-center text-slate-400 flex flex-col items-center justify-center">
                      <Cpu className="w-8 h-8 text-slate-300 mb-2" />
                      <p>Pega el JSON o carga un archivo para previsualizar las especificaciones del equipo.</p>
                    </div>
                  )}

                </div>

              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>Permite registrar equipos corporativos en menos de 10 segundos sin errores manuales.</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
