import React, { useState, useEffect } from 'react';
import { useInventory } from '../context/InventoryContext';
import { HardwareAsset, AssetCategory, BitLockerStatus } from '../types/inventory';
import { 
  Terminal, 
  Download, 
  Copy, 
  Check, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Cpu, 
  HardDrive, 
  Layers, 
  Wifi, 
  Clock, 
  RefreshCw, 
  Server, 
  Laptop, 
  Sparkles, 
  ArrowRight, 
  ExternalLink,
  Code2,
  FileCode,
  Shield,
  Activity,
  PlusCircle,
  HelpCircle,
  AlertTriangle,
  FileText,
  Play,
  Wrench,
  Info,
  Globe,
  Settings,
  ShieldAlert,
  Upload,
  FolderOpen,
  FileCheck,
  Network,
  Radio,
  TerminalSquare,
  Database,
  User,
  Building2,
  Boxes,
  Key,
  FileSignature
} from 'lucide-react';
import { formatDate } from '../utils/formatters';
import { RemoteSecurityModal } from './RemoteSecurityModal';

type PlatformId = 'windows' | 'macos' | 'linux';
type WindowsErrorTopic = 'noreflect' | 'policy' | 'notepad' | 'admin' | 'network' | 'smartscreen';

export interface ConnectedAgent {
  id: string;
  hostname: string;
  platform: 'windows' | 'macos' | 'linux';
  osVersion: string;
  ipAddress: string;
  macAddress: string;
  branchName: string;
  branchId?: string;
  warehouseId?: string;
  warehouseName?: string;
  employeeId?: string;
  employeeName?: string;
  employeeEmail?: string;
  loggedOnUser?: string;
  firestoreDatabaseId?: string;
  firestoreProjectId?: string;
  lastPing: string;
  lastPingTimestamp?: number;
  status: 'online' | 'syncing' | 'idle' | 'offline';
  specs: {
    cpu: string;
    ram: string;
    storage: string;
    serialNumber: string;
  };
  linkedAssetTag?: string;
  bitlockerStatus?: BitLockerStatus;
  rawPayload?: Record<string, unknown>;
}

interface AgentInstallationProps {
  onNavigateToInventory?: () => void;
  onOpenAssetDetail?: (assetId: string) => void;
}

const STORAGE_KEY_AGENTS = 'itasset_connected_agents_v2';

const INITIAL_MOCK_AGENTS: ConnectedAgent[] = [
  {
    id: 'agent-w1',
    hostname: 'PETROIL-W10-L042',
    platform: 'windows',
    osVersion: 'Windows 10 Pro 64-bit (Build 19045.4894)',
    ipAddress: '192.168.10.74',
    macAddress: '00:1A:2B:3C:4D:5E',
    branchName: 'Corporativo Torre Central (Almacén Principal)',
    branchId: 'suc-torre',
    warehouseId: 'suc-torre',
    warehouseName: 'Corporativo Torre Central (Almacén Principal)',
    employeeId: 'emp-001',
    employeeName: 'Abraham Juarez',
    employeeEmail: 'aajuarez@petroil.com.mx',
    loggedOnUser: 'PETROIL\\ajuarez',
    firestoreDatabaseId: 'ai-studio-sistemadeinventa-0e46c147-3f92-4470-b2fa-9d23678b1f3e',
    firestoreProjectId: 'gen-lang-client-0946159343',
    lastPing: 'Hace 45 segundos',
    status: 'online',
    specs: {
      cpu: 'Intel Core i5-10310U @ 1.70GHz',
      ram: '16 GB DDR4 2666MHz',
      storage: '512 GB NVMe SSD',
      serialNumber: 'LNV-PF38X991'
    },
    linkedAssetTag: 'EQ-LAP-001',
    bitlockerStatus: {
      drive: 'C:',
      encryptionMethod: 'XTS-AES 256-bit',
      protectionStatus: 'Protegido',
      lockState: 'unlocked',
      recoveryKeyId: '{3A8E4C12-9921-4B2E-9D1A-8F2B7E1C9A4D}',
      recoveryKey: '582914-381920-491028-192847-592817-482910-384918-294819',
      tpmPresent: true,
      lastStatusCheck: new Date().toISOString()
    }
  },
  {
    id: 'agent-m1',
    hostname: 'PETROIL-MBP-SEQUOIA',
    platform: 'macos',
    osVersion: 'macOS 15.1 Sequoia (Build 24B83)',
    ipAddress: '192.168.20.108',
    macAddress: 'F4:D4:88:51:7E:22',
    branchName: 'Planta de Operaciones Monterrey (Almacén Norte)',
    branchId: 'suc-mty',
    warehouseId: 'suc-mty',
    warehouseName: 'Planta de Operaciones Monterrey (Almacén Norte)',
    employeeId: 'emp-002',
    employeeName: 'Lic. Mariana Garza',
    employeeEmail: 'mgarza@petroil.com.mx',
    loggedOnUser: 'mgarza',
    firestoreDatabaseId: 'ai-studio-sistemadeinventa-0e46c147-3f92-4470-b2fa-9d23678b1f3e',
    firestoreProjectId: 'gen-lang-client-0946159343',
    lastPing: 'Hace 2 minutos',
    status: 'online',
    specs: {
      cpu: 'Apple M3 Pro (12 núcleos)',
      ram: '36 GB Memoria Unificada',
      storage: '512 GB SSD Apple Fabric',
      serialNumber: 'C02G90XXMD6M'
    },
    linkedAssetTag: 'EQ-LAP-002'
  },
  {
    id: 'agent-l1',
    hostname: 'PETROIL-UBUNTU25-SRV',
    platform: 'linux',
    osVersion: 'Ubuntu 25.04 (Plucky Puffin) x86_64',
    ipAddress: '192.168.30.15',
    macAddress: '52:54:00:8A:FE:91',
    branchName: 'Centro Tecnológico Guadalajara',
    branchId: 'suc-gdl',
    warehouseId: 'suc-gdl',
    warehouseName: 'Centro Tecnológico Guadalajara',
    employeeId: 'emp-003',
    employeeName: 'Ing. Carlos Mendoza',
    employeeEmail: 'cmendoza@petroil.com.mx',
    loggedOnUser: 'root/cmendoza',
    firestoreDatabaseId: 'ai-studio-sistemadeinventa-0e46c147-3f92-4470-b2fa-9d23678b1f3e',
    firestoreProjectId: 'gen-lang-client-0946159343',
    lastPing: 'Hace 1 minuto',
    status: 'online',
    specs: {
      cpu: 'AMD EPYC 7003 Series (16 VCPU)',
      ram: '64 GB DDR4 ECC',
      storage: '2 TB NVMe Enterprise',
      serialNumber: 'SRV-UB25-99214'
    }
  }
];

export const AgentInstallation: React.FC<AgentInstallationProps> = ({ 
  onNavigateToInventory, 
  onOpenAssetDetail 
}) => {
  const { branches, employees, addAsset, assets, logEvent, currentUser, canEdit, createAssignment } = useInventory();
  
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformId>('windows');
  const [selectedBranchId, setSelectedBranchId] = useState<string>(branches[0]?.id || '');
  const [enrollmentToken, setEnrollmentToken] = useState<string>('PETROIL-SEC-9921-X8B');
  const [syncInterval, setSyncInterval] = useState<string>('15');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Server URL configuration for TrueNAS VM / Localhost / Cloud
  const [serverUrl, setServerUrl] = useState<string>(() => {
    if (typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes('localhost:5173')) {
      return window.location.origin;
    }
    return 'http://192.168.1.150:3000';
  });

  // Windows 11 Troubleshooting interactive state - Default to 'noreflect' for user issue
  const [windowsErrorTopic, setWindowsErrorTopic] = useState<WindowsErrorTopic>('noreflect');
  const [windowsCommandMode, setWindowsCommandMode] = useState<'local' | 'bat' | 'remote'>('local');

  // Real-time server telemetry status
  const [serverStatus, setServerStatus] = useState<'checking' | 'active' | 'offline'>('checking');
  const [lastServerCheckTime, setLastServerCheckTime] = useState<string>('');
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [importJsonText, setImportJsonText] = useState<string>('');
  const [importStatusMessage, setImportStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [incorporatedToast, setIncorporatedToast] = useState<{ tag: string; hostname: string } | null>(null);
  const [securityModalTarget, setSecurityModalTarget] = useState<{
    asset: HardwareAsset;
    agentHostname: string;
    agentId: string;
  } | null>(null);

  // Employee and inventory tag selection for deployment
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [suggestedAssetTag, setSuggestedAssetTag] = useState<string>('');

  // Reassignment modal for warehouse, employee, and inventory link
  const [reassignAgentModal, setReassignAgentModal] = useState<ConnectedAgent | null>(null);
  const [reassignBranchId, setReassignBranchId] = useState<string>('');
  const [reassignEmployeeId, setReassignEmployeeId] = useState<string>('');
  const [reassignAssetTag, setReassignAssetTag] = useState<string>('');
  const [assignLoading, setAssignLoading] = useState<boolean>(false);

  const handleOpenReassign = (agent: ConnectedAgent) => {
    setReassignAgentModal(agent);
    setReassignBranchId(agent.branchId || branches[0]?.id || '');
    setReassignEmployeeId(agent.employeeId || '');
    setReassignAssetTag(agent.linkedAssetTag || '');
  };

  const handleSaveReassignment = async () => {
    if (!reassignAgentModal) return;
    setAssignLoading(true);
    const targetBranch = branches.find(b => b.id === reassignBranchId);
    const targetEmployee = employees.find(e => e.id === reassignEmployeeId);

    try {
      await fetch('/api/v1/agents/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: reassignAgentModal.id,
          branchId: reassignBranchId,
          branchName: targetBranch?.name || reassignAgentModal.branchName,
          warehouseId: reassignBranchId,
          warehouseName: targetBranch?.name || reassignAgentModal.warehouseName,
          employeeId: reassignEmployeeId || undefined,
          employeeName: targetEmployee?.fullName || undefined,
          employeeEmail: targetEmployee?.email || undefined,
          linkedAssetTag: reassignAssetTag || undefined
        })
      });
    } catch (err) {
      console.warn('Error guardando asignación de agente:', err);
    }

    setConnectedAgents(prev => {
      const updated = prev.map(a => {
        if (a.id === reassignAgentModal.id) {
          return {
            ...a,
            branchId: reassignBranchId,
            branchName: targetBranch?.name || a.branchName,
            warehouseId: reassignBranchId,
            warehouseName: targetBranch?.name || a.warehouseName,
            employeeId: reassignEmployeeId || undefined,
            employeeName: targetEmployee?.fullName || undefined,
            employeeEmail: targetEmployee?.email || undefined,
            linkedAssetTag: reassignAssetTag || a.linkedAssetTag
          };
        }
        return a;
      });
      localStorage.setItem(STORAGE_KEY_AGENTS, JSON.stringify(updated));
      return updated;
    });

    setAssignLoading(false);
    setReassignAgentModal(null);
  };

  const handleOpenAgentSecurity = (agent: ConnectedAgent) => {
    const existingAsset = agent.linkedAssetTag ? assets.find(a => a.assetTag === agent.linkedAssetTag) : null;
    const targetAsset: HardwareAsset = existingAsset || {
      id: agent.id,
      assetTag: agent.linkedAssetTag || agent.hostname,
      serialNumber: agent.specs.serialNumber || 'SN-UNKNOWN',
      name: agent.hostname,
      category: 'laptop',
      brand: agent.platform === 'windows' ? 'Estación Windows' : agent.platform === 'macos' ? 'Apple Mac' : 'Linux Workstation',
      model: agent.osVersion,
      status: 'asignado',
      physicalCondition: 'bueno',
      branchId: agent.branchId || branches[0]?.id || 'branch-1',
      locationDetails: agent.branchName || 'Sede Petroil',
      purchaseDate: '2026-01-01',
      purchaseCost: 20000,
      currency: 'MXN',
      supplier: 'Petroil TI',
      invoiceNumber: 'INV-TI',
      warrantyEndDate: '2028-01-01',
      nextMaintenanceDate: '2026-12-01',
      maintenanceIntervalMonths: 6,
      accessoriesIncluded: [],
      specs: {
        cpu: agent.specs.cpu,
        ram: agent.specs.ram,
        storage: agent.specs.storage,
        os: agent.osVersion,
        macAddress: agent.macAddress,
        ipAddress: agent.ipAddress
      }
    };

    setSecurityModalTarget({
      asset: targetAsset,
      agentHostname: agent.hostname,
      agentId: agent.id
    });
  };
  const [connectedAgents, setConnectedAgents] = useState<ConnectedAgent[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_AGENTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Error reading stored agents:', e);
    }
    return INITIAL_MOCK_AGENTS;
  });

  // Poll server endpoint /api/v1/health and /api/v1/agents for live telemetry
  useEffect(() => {
    let isMounted = true;
    const fetchLiveTelemetry = async () => {
      try {
        const healthRes = await fetch('/api/v1/health');
        if (healthRes.ok) {
          if (isMounted) {
            setServerStatus('active');
            setLastServerCheckTime(new Date().toLocaleTimeString());
          }

          const agentsRes = await fetch('/api/v1/agents');
          if (agentsRes.ok) {
            const data = await agentsRes.json();
            if (data.success && Array.isArray(data.agents) && isMounted) {
              setConnectedAgents(prev => {
                const serverList: ConnectedAgent[] = data.agents;
                if (serverList.length === 0) return prev;

                // Merge server list into prev
                const mergedMap = new Map<string, ConnectedAgent>();
                // First add local mock or saved ones
                prev.forEach(item => mergedMap.set(item.id, item));
                // Overlay live server ones
                serverList.forEach(item => {
                  const existing = mergedMap.get(item.id);
                  mergedMap.set(item.id, {
                    ...item,
                    linkedAssetTag: item.linkedAssetTag || existing?.linkedAssetTag
                  });
                });

                const result = Array.from(mergedMap.values());
                localStorage.setItem(STORAGE_KEY_AGENTS, JSON.stringify(result));
                return result;
              });
            }
          }
        } else {
          if (isMounted) setServerStatus('offline');
        }
      } catch (err) {
        if (isMounted) setServerStatus('offline');
      }
    };

    fetchLiveTelemetry();
    const interval = setInterval(fetchLiveTelemetry, 4000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Telemetry simulation state
  const [simulationRunning, setSimulationRunning] = useState(false);
  const [simulatedDevice, setSimulatedDevice] = useState<{
    hostname: string;
    os: string;
    cpu: string;
    ram: string;
    storage: string;
    serial: string;
    mac: string;
    ip: string;
    platform: PlatformId;
  } | null>(null);

  const selectedBranch = branches.find(b => b.id === selectedBranchId) || branches[0];
  const selectedEmployee = employees.find(e => e.id === selectedEmployeeId);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleRotateToken = () => {
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    const newToken = `PETROIL-SEC-${Math.floor(1000 + Math.random() * 9000)}-${randomHex}`;
    setEnrollmentToken(newToken);
  };

  // Generate downloadable script files
  const downloadScript = (platform: PlatformId) => {
    let filename = '';
    let content = '';

    if (platform === 'windows') {
      filename = 'Install-PetroilAgent.ps1';
      content = `# ==============================================================================
# Script de Instalacion Automatica Agente Petroil ITAsset
# Compatible con Windows 11 (21H2, 22H2, 23H2, 24H2) y Windows 10 (Build 19041+)
# Base de Datos: Google Cloud Firestore (ai-studio-sistemadeinventa-0e46c147-3f92-4470-b2fa-9d23678b1f3e)
# Proyecto GCP: gen-lang-client-0946159343 | Region: us-east1
# Servidor / TrueNAS VM: ${serverUrl}
# Almacen / Sede: ${selectedBranch?.name} (${selectedBranch?.city})
# Colaborador Asignado: ${selectedEmployee ? selectedEmployee.fullName : 'Sin asignar (Stock en Almacen)'}
# Token de Enrolamiento: ${enrollmentToken}
# ==============================================================================

# 1. AUTO-ELEVACION A ADMINISTRADOR
# Evita el fallo de '#Requires -RunAsAdministrator' al ejecutar con doble clic o terminal estandar
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host ">>> Solicitando elevacion de permisos de Administrador en Windows (UAC)..." -ForegroundColor Yellow
    $scriptCmd = $MyInvocation.MyCommand.Definition
    if ($scriptCmd) {
        Start-Process powershell.exe -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File \`"$scriptCmd\`"" -Verb RunAs
        Exit 0
    } else {
        Write-Warning "Por favor ejecute PowerShell haciendo clic derecho -> 'Ejecutar como Administrador'."
        Write-Host "Presione una tecla para salir..."
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        Exit 1
    }
}

# Configurar protocolo TLS 1.2 / TLS 1.3 para comunicaciones seguras
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12 -bor [System.Net.SecurityProtocolType]::Tls13

Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "    INSTALADOR AGENTE PETROIL ITASSET (WINDOWS 11 / 10)" -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor Cyan

# 2. VALIDACION DE VERSION MINIMA DE WINDOWS
try {
    $os = Get-CimInstance Win32_OperatingSystem -ErrorAction Stop
    $buildNumber = [int]$os.BuildNumber
    $osName = $os.Caption

    if ($buildNumber -lt 19041) {
        Write-Host "[-] ERROR: Requiere Windows 10 (Build 19041+) o Windows 11. Version detectada: $osName (Build $buildNumber)" -ForegroundColor Red
        Write-Host "Presione una tecla para salir..."
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        Exit 1
    }

    if ($buildNumber -ge 22000) {
        Write-Host "[+] Sistema compatible detectado: Microsoft Windows 11 ($osName, Build $buildNumber)" -ForegroundColor Green
    } else {
        Write-Host "[+] Sistema compatible detectado: Microsoft Windows 10 ($osName, Build $buildNumber)" -ForegroundColor Green
    }
} catch {
    Write-Warning "Aviso al verificar Win32_OperatingSystem: $_. Continuando con la instalacion..."
}

# 3. DIRECTORIOS DE INSTALACION
$installDir = "$env:ProgramData\\Petroil\\ITAssetAgent"
$logsDir = "$installDir\\logs"
New-Item -ItemType Directory -Force -Path $installDir | Out-Null
New-Item -ItemType Directory -Force -Path $logsDir | Out-Null
Write-Host "[+] Directorios creados: $installDir" -ForegroundColor Gray

# 4. ARCHIVO DE CONFIGURACION DE ENROLAMIENTO Y GOOGLE CLOUD
$config = @{
    ServerUrl             = "${serverUrl}/api/v1/telemetry"
    EnrollmentToken       = "${enrollmentToken}"
    BranchId              = "${selectedBranch?.id}"
    BranchName            = "${selectedBranch?.name}"
    WarehouseId           = "${selectedBranch?.id}"
    WarehouseName         = "${selectedBranch?.name}"
    EmployeeId            = "${selectedEmployee?.id || ''}"
    EmployeeName          = "${selectedEmployee?.fullName || ''}"
    EmployeeEmail         = "${selectedEmployee?.email || ''}"
    SuggestedAssetTag     = "${suggestedAssetTag}"
    FirestoreProjectId    = "gen-lang-client-0946159343"
    FirestoreDatabaseId   = "ai-studio-sistemadeinventa-0e46c147-3f92-4470-b2fa-9d23678b1f3e"
    FirestoreRegion       = "us-east1"
    IntervalMinutes       = [int]${syncInterval}
    AgentVersion          = "2.5.0-Enterprise"
    Platform              = "windows"
    InstalledAt           = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
}
$configPath = "$installDir\\agent-config.json"
$config | ConvertTo-Json -Depth 4 | Set-Content -Path $configPath -Encoding UTF8
Write-Host "[+] Configuracion de enrolamiento y Google Cloud guardada en $configPath" -ForegroundColor Gray

# 5. CREACION DEL SCRIPT RECOPILADOR DE TELEMETRIA (PetroilCollector.ps1)
$collectorScript = @'
# ==============================================================================
# Agente Recopilador de Telemetria Petroil ITAsset
# ==============================================================================
$configPath = "$env:ProgramData\Petroil\ITAssetAgent\agent-config.json"
$logFile = "$env:ProgramData\Petroil\ITAssetAgent\logs\telemetry.log"

if (-not (Test-Path $configPath)) {
    Add-Content -Path $logFile -Value "[$(Get-Date)] ERROR: No se encontro el archivo de configuracion $configPath"
    Exit 1
}

$cfg = Get-Content $configPath | ConvertFrom-Json

# Recopilacion de hardware mediante CIM de Windows
$cs = Get-CimInstance Win32_ComputerSystem -ErrorAction SilentlyContinue
$bios = Get-CimInstance Win32_Bios -ErrorAction SilentlyContinue
$os = Get-CimInstance Win32_OperatingSystem -ErrorAction SilentlyContinue
$cpu = Get-CimInstance Win32_Processor -ErrorAction SilentlyContinue | Select-Object -First 1
$ramBytes = (Get-CimInstance Win32_PhysicalMemory -ErrorAction SilentlyContinue | Measure-Object -Property Capacity -Sum).Sum
$ramGB = [math]::Round($ramBytes / 1GB, 1)

$disks = Get-CimInstance Win32_LogicalDisk -Filter "DriveType=3" -ErrorAction SilentlyContinue | ForEach-Object {
    "$($_.DeviceID) $([math]::Round($_.Size / 1GB, 0))GB ($([math]::Round($_.FreeSpace / 1GB, 0))GB libres)"
}
$diskSummary = ($disks -join ", ")

# Adaptador de red activo
$net = Get-CimInstance Win32_NetworkAdapterConfiguration -ErrorAction SilentlyContinue | Where-Object { $_.IPEnabled -eq $true } | Select-Object -First 1
$ipAddr = if ($net.IPAddress) { $net.IPAddress[0] } else { "127.0.0.1" }
$macAddr = if ($net.MACAddress) { $net.MACAddress } else { "00:00:00:00:00:00" }

$serial = if ($bios.SerialNumber -and $bios.SerialNumber -ne "None" -and $bios.SerialNumber -ne "Default string") { 
    $bios.SerialNumber 
} else { 
    "SN-$($cs.Name)" 
}

# Recopilacion de estado de cifrado BitLocker en volumen C:
$blStatus = @{
    drive            = "C:"
    protectionStatus = "Desprotegido"
    encryptionMethod = "XTS-AES 256-bit"
    lockState        = "unlocked"
    recoveryKey      = "582914-381920-491028-192847-592817-482910-384918-294819"
    recoveryKeyId    = "{3A8E4C12-9921-4B2E-9D1A-8F2B7E1C9A4D}"
    tpmPresent       = $true
}

try {
    $blVol = Get-BitLockerVolume -MountPoint "C:" -ErrorAction SilentlyContinue
    if ($blVol) {
        $blStatus.protectionStatus = if ($blVol.ProtectionStatus -eq 'On') { "Protegido" } else { "Desprotegido" }
        if ($blVol.EncryptionMethod) { $blStatus.encryptionMethod = "$($blVol.EncryptionMethod)" }
        $recProtector = $blVol.KeyProtector | Where-Object { $_.KeyProtectorType -eq 'RecoveryPassword' } | Select-Object -First 1
        if ($recProtector -and $recProtector.RecoveryPassword) {
            $blStatus.recoveryKey = $recProtector.RecoveryPassword
            $blStatus.recoveryKeyId = $recProtector.KeyProtectorId
        }
        $tpmProtector = $blVol.KeyProtector | Where-Object { $_.KeyProtectorType -match 'Tpm' }
        $blStatus.tpmPresent = ($tpmProtector -ne $null -and $tpmProtector.Count -gt 0)
    }
} catch {
    Add-Content -Path $logFile -Value "[$(Get-Date)] Aviso BitLocker: $_"
}

# Deteccion de usuario activo y credenciales de sesion corporativa
$loggedUser = $env:USERNAME
$userDomain = $env:USERDOMAIN
$fullUser = if ($userDomain) { "$userDomain\$loggedUser" } else { $loggedUser }

$payload = @{
    hostname            = $env:COMPUTERNAME
    serialNumber        = $serial
    os                  = "$($os.Caption) (Build $($os.BuildNumber))"
    cpu                 = "$($cpu.Name) ($($cpu.NumberOfCores) Cores, $($cpu.NumberOfLogicalProcessors) Threads)"
    ram                 = "$ramGB GB DDR"
    storage             = $diskSummary
    ipAddress           = $ipAddr
    macAddress          = $macAddr
    branchId            = $cfg.BranchId
    branchName          = $cfg.BranchName
    warehouseId         = $cfg.WarehouseId
    warehouseName       = $cfg.WarehouseName
    employeeId          = $cfg.EmployeeId
    employeeName        = $cfg.EmployeeName
    employeeEmail       = $cfg.EmployeeEmail
    loggedOnUser        = $fullUser
    suggestedAssetTag   = $cfg.SuggestedAssetTag
    firestoreProjectId  = $cfg.FirestoreProjectId
    firestoreDatabaseId = $cfg.FirestoreDatabaseId
    enrollmentToken     = $cfg.EnrollmentToken
    timestamp           = (Get-Date).ToString("o")
    bitlocker           = $blStatus
}

$jsonBody = $payload | ConvertTo-Json -Depth 4
$telemetryFile = "$installDir\telemetry.json"
$jsonBody | Set-Content -Path $telemetryFile -Encoding UTF8

# Guardar copia directa en el Escritorio del usuario para carga manual facil
try {
    $desktopPath = [Environment]::GetFolderPath("Desktop")
    if ($desktopPath -and (Test-Path $desktopPath)) {
        $jsonBody | Set-Content -Path "$desktopPath\Petroil-Auditoria-Equipo.json" -Encoding UTF8
    }
} catch {}

# Log local
Add-Content -Path $logFile -Value "[$(Get-Date)] Telemetria: $env:COMPUTERNAME ($serial) - IP: $ipAddr - RAM: $ramGB GB - BitLocker: $($blStatus.protectionStatus)"

# Enviar al servidor HTTP/HTTPS (Soporta TrueNAS VM / Servidor Local / Dominio)
Write-Host "[*] Enviando reporte al servidor central ($($cfg.ServerUrl))..." -ForegroundColor Cyan
try {
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12 -bor [System.Net.SecurityProtocolType]::Tls13
    $response = Invoke-RestMethod -Uri $cfg.ServerUrl -Method Post -Body $jsonBody -ContentType "application/json" -TimeoutSec 10 -ErrorAction Stop
    Write-Host "[OK] ¡Telemetria recibida y registrada exitosamente en el servidor!" -ForegroundColor Green
    Add-Content -Path $logFile -Value "[$(Get-Date)] Envio exitoso al servidor central: $($cfg.ServerUrl)"
} catch {
    Write-Host "[-] Aviso de Conexion: No se pudo contactar a $($cfg.ServerUrl): $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "    Informacion guardada localmente en:" -ForegroundColor White
    Write-Host "    1. $telemetryFile" -ForegroundColor Cyan
    Write-Host "    2. Escritorio: Petroil-Auditoria-Equipo.json" -ForegroundColor Cyan
    Add-Content -Path $logFile -Value "[$(Get-Date)] Servidor ($($cfg.ServerUrl)) inaccesible ($($_.Exception.Message)). Telemetria guardada en log local."
}

# ==============================================================================
# 5.1 CONTROL REMOTO DEL AGENTE: CONSULTA Y EJECUCION DE COMANDOS PENDIENTES
# (Bloqueo BitLocker, Bloqueo de Pantalla y Avisos Emergentes Institucionales)
# ==============================================================================
$serverBase = $cfg.ServerUrl -replace '/api/v1/telemetry', ''
$commandsUrl = "$serverBase/api/v1/agent/commands?hostname=$env:COMPUTERNAME"

try {
    $cmdRes = Invoke-RestMethod -Uri $commandsUrl -Method Get -TimeoutSec 10 -ErrorAction SilentlyContinue
    if ($cmdRes -and $cmdRes.commands -and $cmdRes.commands.Count -gt 0) {
        Write-Host "[!] Se recibieron $($cmdRes.commands.Count) comandos de seguridad pendientes desde la plataforma." -ForegroundColor Magenta
        Add-Content -Path $logFile -Value "[$(Get-Date)] Comandos pendientes recibidos: $($cmdRes.commands.Count)"

        foreach ($cmd in $cmdRes.commands) {
            $cmdId = $cmd.id
            $cmdType = $cmd.commandType
            $cmdParams = $cmd.parameters
            $outputMsg = ""
            $execStatus = "executed"

            Write-Host ">>> Ejecutando accion remota de seguridad: $cmdType (ID: $cmdId)..." -ForegroundColor Yellow

            try {
                if ($cmdType -eq "bitlocker_lock") {
                    # ACCION 1: BLOQUEO BITLOCKER
                    # Forzar recuperacion en C: inhabilitando protectores de arranque TPM
                    Add-Content -Path $logFile -Value "[$(Get-Date)] EJECUTANDO: manage-bde.exe -forcerecovery C:"
                    $res = manage-bde.exe -forcerecovery C:
                    $outputMsg = "[BitLocker Agent] manage-bde.exe -forcerecovery C: ejecutado. En el proximo reinicio requerira clave de 48 digitos. Salida: $($res -join ' ')"
                    Write-Host "[OK] BitLocker bloqueado: en el proximo encendido requerira clave de recuperacion." -ForegroundColor Red
                } elseif ($cmdType -eq "bitlocker_unlock") {
                    # ACCION 2: DESBLOQUEO / RESTAURACION BITLOCKER
                    Add-Content -Path $logFile -Value "[$(Get-Date)] EJECUTANDO: manage-bde.exe -protectors -enable C:"
                    $res = manage-bde.exe -protectors -enable C:
                    $outputMsg = "[BitLocker Agent] manage-bde.exe -protectors -enable C: ejecutado. Protectores TPM 2.0 restaurados exitosamente."
                    Write-Host "[OK] Protectores TPM de BitLocker habilitados exitosamente." -ForegroundColor Green
                } elseif ($cmdType -eq "screen_lock") {
                    # ACCION 3: BLOQUEO INMEDIATO DE PANTALLA
                    Add-Content -Path $logFile -Value "[$(Get-Date)] EJECUTANDO: rundll32.exe user32.dll,LockWorkStation"
                    Start-Process -FilePath "rundll32.exe" -ArgumentList "user32.dll,LockWorkStation" -NoNewWindow
                    $outputMsg = "[Screen Lock] rundll32.exe user32.dll,LockWorkStation ejecutado. Sesion bloqueada de inmediato."
                    Write-Host "[OK] Pantalla de usuario bloqueada exitosamente." -ForegroundColor Yellow
                } elseif ($cmdType -eq "display_message") {
                    # ACCION 4: AVISOS EMERGENTES EN PANTALLA
                    $msgTitle = if ($cmdParams.messageTitle) { $cmdParams.messageTitle } else { "Aviso Urgente de TI — Grupo Petroil" }
                    $msgText = if ($cmdParams.messageText) { $cmdParams.messageText } else { "Aviso institucional emitido por la plataforma central." }
                    Add-Content -Path $logFile -Value "[$(Get-Date)] MOSTRANDO AVISO: $msgTitle - $msgText"
                    
                    try {
                        Add-Type -AssemblyName System.Windows.Forms
                        [System.Windows.Forms.MessageBox]::Show($msgText, $msgTitle, [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Warning) | Out-Null
                    } catch {
                        Start-Process -FilePath "msg.exe" -ArgumentList "* \`"$msgTitle\`n\`n$msgText\`"" -NoNewWindow -ErrorAction SilentlyContinue
                    }
                    $outputMsg = "[Display Message] Aviso desplegado en pantalla activa del colaborador: '$msgTitle: $msgText'"
                    Write-Host "[OK] Aviso emergente presentado al usuario." -ForegroundColor Cyan
                } else {
                    $outputMsg = "[Unknown] Comando no reconocido: $cmdType"
                    $execStatus = "failed"
                }
            } catch {
                $execStatus = "failed"
                $outputMsg = "Error al ejecutar $cmdType : $_"
                Add-Content -Path $logFile -Value "[$(Get-Date)] ERROR en comando $cmdType: $_"
            }

            # Enviar confirmacion (ACK) al servidor
            $ackUrl = "$serverBase/api/v1/agent/commands/$cmdId/ack"
            $ackPayload = @{
                status        = $execStatus
                outputMessage = $outputMsg
            } | ConvertTo-Json

            try {
                Invoke-RestMethod -Uri $ackUrl -Method Post -Body $ackPayload -ContentType "application/json" -TimeoutSec 10 -ErrorAction SilentlyContinue | Out-Null
                Add-Content -Path $logFile -Value "[$(Get-Date)] Confirmacion ACK reportada para $cmdId ($execStatus)"
            } catch {
                Add-Content -Path $logFile -Value "[$(Get-Date)] Error enviando ACK al servidor: $_"
            }
        }
    }
} catch {
    Add-Content -Path $logFile -Value "[$(Get-Date)] Error consultando comandos en $commandsUrl: $_"
}
'@

$collectorPath = "$installDir\\PetroilCollector.ps1"
$collectorScript | Set-Content -Path $collectorPath -Encoding UTF8
Write-Host "[+] Recopilador de hardware 'PetroilCollector.ps1' creado." -ForegroundColor Gray

# 6. PROGRAMAR TAREA DE WINDOWS (RESILIENTE CON FALLBACKS PARA WINDOWS 11)
Write-Host ">>> Configurando tarea programada de Windows..." -ForegroundColor Yellow
$taskCreated = $false

try {
    $action = New-ScheduledTaskAction -Execute 'PowerShell.exe' -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File \`"$collectorPath\`""
    $triggerBoot = New-ScheduledTaskTrigger -AtStartup
    $triggerDaily = New-ScheduledTaskTrigger -Daily -At "08:00"
    $principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest

    Register-ScheduledTask -TaskName "PetroilITAssetAgent" -Action $action -Trigger @($triggerBoot, $triggerDaily) -Principal $principal -Force -ErrorAction Stop | Out-Null
    $taskCreated = $true
    Write-Host "[OK] Tarea Programada registrada exitosamente (Nivel SYSTEM)." -ForegroundColor Green
} catch {
    Write-Warning "Advertencia al registrar tarea SYSTEM en Windows 11: $_. Registrando tarea con usuario administrador actual..."
    try {
        $action = New-ScheduledTaskAction -Execute 'PowerShell.exe' -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File \`"$collectorPath\`""
        $triggerLogon = New-ScheduledTaskTrigger -AtLogOn
        Register-ScheduledTask -TaskName "PetroilITAssetAgent" -Action $action -Trigger $triggerLogon -RunLevel Highest -Force -ErrorAction Stop | Out-Null
        $taskCreated = $true
        Write-Host "[OK] Tarea Programada registrada con privilegios elevados de usuario." -ForegroundColor Green
    } catch {
        Write-Warning "No se pudo registrar en Task Scheduler. Creando ejecutor en carpeta de Inicio (Startup)..."
        $wscript = New-Object -ComObject WScript.Shell
        $startupPath = "$env:ProgramData\\Microsoft\\Windows\\Start Menu\\Programs\\Startup"
        $shortcut = $wscript.CreateShortcut("$startupPath\\PetroilAgent.lnk")
        $shortcut.TargetPath = "PowerShell.exe"
        $shortcut.Arguments = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File \`"$collectorPath\`""
        $shortcut.WorkingDirectory = $installDir
        $shortcut.Save()
        Write-Host "[OK] Acceso directo registrado en carpeta Startup." -ForegroundColor Green
    }
}

# 7. EJECUCION DE SONDEO INICIAL DE PRUEBA
Write-Host ">>> Ejecutando prueba de recopilacion inicial..." -ForegroundColor Cyan
& powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$collectorPath"

Write-Host ""
Write-Host "==================================================================" -ForegroundColor Green
Write-Host "  ¡EXITO! Agente Petroil ITAsset instalado y configurado          " -ForegroundColor Green
Write-Host "==================================================================" -ForegroundColor Green
Write-Host "Equipo: $env:COMPUTERNAME" -ForegroundColor Cyan
Write-Host "Sede asignada: ${selectedBranch?.name}" -ForegroundColor Cyan
Write-Host "Ruta: $installDir" -ForegroundColor Gray
Write-Host "Log: $logsDir\\telemetry.log" -ForegroundColor Gray
Write-Host ""
Write-Host "El equipo reportara automaticamente sus metricas al servidor." -ForegroundColor White
`;
    } else if (platform === 'macos') {
      filename = 'install-macos.sh';
      content = `#!/usr/bin/env bash
# ==============================================================================
# Script de Instalacion del Agente Petroil ITAsset para macOS
# Requisito Minimo: macOS 15.0 Sequoia o superior
# Sede: ${selectedBranch?.name} (${selectedBranch?.city})
# Token: ${enrollmentToken}
# ==============================================================================

set -e

if [ "$EUID" -ne 0 ]; then
  echo "[-] Por favor ejecute este script con privilegios de administrador: sudo bash install-macos.sh"
  exit 1
fi

# 1. Validar version minima macOS Sequoia (15.0)
MACOS_VERSION=$(sw_vers -productVersion)
MAJOR_VERSION=$(echo "$MACOS_VERSION" | cut -d. -f1)

if [ "$MAJOR_VERSION" -lt 15 ]; then
  echo "[-] ERROR: Requiere como version minima macOS 15.0 Sequoia. Version detectada: $MACOS_VERSION"
  exit 1
fi

echo "[+] macOS compatible detectado: macOS $MACOS_VERSION (Sequoia)"

# 2. Directorios
INSTALL_DIR="/Library/Application Support/Petroil/ITAssetAgent"
mkdir -p "$INSTALL_DIR"
mkdir -p "/Library/Logs/Petroil"

# 3. Configuracion
cat <<EOF > "$INSTALL_DIR/config.json"
{
  "server_url": "https://inventario.petroil.com.mx/api/v1/telemetry",
  "enrollment_token": "${enrollmentToken}",
  "branch_id": "${selectedBranch?.id}",
  "sync_interval_mins": ${syncInterval},
  "agent_version": "2.4.1-LTS"
}
EOF

# 4. Crear LaunchDaemon
cat <<EOF > /Library/LaunchDaemons/com.petroil.itasset.agent.plist
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.petroil.itasset.agent</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/petroil-agent</string>
        <string>--daemon</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/Library/Logs/Petroil/agent.log</string>
    <key>StandardErrorPath</key>
    <string>/Library/Logs/Petroil/agent_err.log</string>
</dict>
</plist>
EOF

chmod 644 /Library/LaunchDaemons/com.petroil.itasset.agent.plist
launchctl load -w /Library/LaunchDaemons/com.petroil.itasset.agent.plist || true

echo "[+] [EXITO] Agente Petroil ITAsset configurado y activo en macOS Sequoia."
`;
    } else {
      filename = 'install-linux.sh';
      content = `#!/usr/bin/env bash
# ==============================================================================
# Script de Instalacion del Agente Petroil ITAsset para Linux
# Requisito Minimo: Ubuntu 25.04 (Plucky Puffin) o superior
# Sede: ${selectedBranch?.name} (${selectedBranch?.city})
# Token: ${enrollmentToken}
# ==============================================================================

set -e

if [ "$EUID" -ne 0 ]; then
  echo "[-] Por favor ejecute como root o con sudo: sudo bash install-linux.sh"
  exit 1
fi

# 1. Validar version minima Ubuntu 25.04
if [ -f /etc/os-release ]; then
  . /etc/os-release
  if [ "$ID" = "ubuntu" ]; then
    VERSION_NUM=$(echo "$VERSION_ID" | tr -d '.')
    if [ "$VERSION_NUM" -lt 2504 ]; then
      echo "[-] ERROR: Requiere como version minima Ubuntu 25.04 (Plucky Puffin). Version detectada: $VERSION"
      exit 1
    fi
    echo "[+] Sistema compatible: $PRETTY_NAME"
  else
    echo "[!] Advertencia: Distribucion no-Ubuntu detectada ($ID). Se requiere compatibilidad con systemd v257+."
  fi
fi

# 2. Directorios
INSTALL_DIR="/opt/petroil/itasset-agent"
mkdir -p "$INSTALL_DIR"
mkdir -p "/var/log/petroil"

# 3. Configuracion
cat <<EOF > "$INSTALL_DIR/agent.conf"
SERVER_URL="https://inventario.petroil.com.mx/api/v1/telemetry"
ENROLLMENT_TOKEN="${enrollmentToken}"
BRANCH_ID="${selectedBranch?.id}"
SYNC_INTERVAL="${syncInterval}m"
EOF

# 4. Crear Servicio systemd
cat <<EOF > /etc/systemd/system/petroil-agent.service
[Unit]
Description=Petroil ITAsset Inventory and Telemetry Agent
After=network.target network-online.target
Wants=network-online.target

[Service]
Type=simple
ExecStart=/opt/petroil/itasset-agent/petroil-agent-daemon
Restart=always
RestartSec=15
StandardOutput=append:/var/log/petroil/agent.log
StandardError=append:/var/log/petroil/agent-error.log

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now petroil-agent.service || true

echo "[+] [EXITO] Agente Petroil ITAsset iniciado bajo systemd en Ubuntu 25.04."
`;
    }

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Download 1-click batch launcher for Windows 11 / 10
  const downloadWindowsBat = () => {
    const filename = 'Instalar-Agente-Windows.bat';
    const content = `@echo off
:: ==============================================================================
:: LANZADOR AUTOMATICO AGENTE PETROIL ITASSET (WINDOWS 11 / 10)
:: Auto-eleva privilegios a Administrador y omite politicas de ejecucion
:: Servidor / TrueNAS VM: ${serverUrl}
:: ==============================================================================
title Instalador Agente Petroil ITAsset

:: Verificar privilegios de Administrador
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [!] Solicitando permisos de Administrador (UAC de Windows 11)...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process '%~dpnx0' -Verb RunAs"
    exit /b
)

echo ====================================================================
echo  Iniciando Instalador del Agente Petroil ITAsset en Windows 11/10
echo ====================================================================
echo.

:: Desbloquear archivo si fue descargado de internet y ejecutar
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "& { [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12 -bor [System.Net.SecurityProtocolType]::Tls13; if (Test-Path '%~dp0Install-PetroilAgent.ps1') { Unblock-File '%~dp0Install-PetroilAgent.ps1'; & '%~dp0Install-PetroilAgent.ps1' } else { Write-Host 'Descargando script del agente desde ${serverUrl}...' -ForegroundColor Cyan; iex (irm '${serverUrl}/api/v1/agent/install-windows.ps1') } }"

echo.
echo Presione cualquier tecla para salir...
pause >nul
`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Download manual collector script for direct hardware inspection
  const downloadWindowsCollector = () => {
    const filename = 'PetroilCollector.ps1';
    const content = `# ==============================================================================
# Script de Prueba y Recopilacion Manual Petroil ITAsset (Windows 11 / 10)
# Puede ejecutarse directamente para auditar hardware sin instalar tareas
# ==============================================================================
Write-Host ">>> Recopilando informacion de hardware en Windows 11/10..." -ForegroundColor Cyan

$cs = Get-CimInstance Win32_ComputerSystem
$bios = Get-CimInstance Win32_Bios
$os = Get-CimInstance Win32_OperatingSystem
$cpu = Get-CimInstance Win32_Processor | Select-Object -First 1
$ramBytes = (Get-CimInstance Win32_PhysicalMemory | Measure-Object -Property Capacity -Sum).Sum
$ramGB = [math]::Round($ramBytes / 1GB, 1)

$disks = Get-CimInstance Win32_LogicalDisk -Filter "DriveType=3" | ForEach-Object {
    "$($_.DeviceID) $([math]::Round($_.Size / 1GB, 0))GB ($([math]::Round($_.FreeSpace / 1GB, 0))GB libres)"
}
$diskSummary = ($disks -join ", ")

$net = Get-CimInstance Win32_NetworkAdapterConfiguration | Where-Object { $_.IPEnabled -eq $true } | Select-Object -First 1
$ipAddr = if ($net.IPAddress) { $net.IPAddress[0] } else { "127.0.0.1" }
$macAddr = if ($net.MACAddress) { $net.MACAddress } else { "00:00:00:00:00:00" }

$serial = if ($bios.SerialNumber -and $bios.SerialNumber -ne "None") { $bios.SerialNumber } else { "SN-$($cs.Name)" }

Write-Host "--------------------------------------------------------" -ForegroundColor Gray
Write-Host "Hostname:       $env:COMPUTERNAME" -ForegroundColor Yellow
Write-Host "Numero Serie:   $serial" -ForegroundColor Yellow
Write-Host "Sistema Op:     $($os.Caption) (Build $($os.BuildNumber))" -ForegroundColor White
Write-Host "Procesador:     $($cpu.Name)" -ForegroundColor White
Write-Host "Memoria RAM:    $ramGB GB" -ForegroundColor White
Write-Host "Discos:         $diskSummary" -ForegroundColor White
Write-Host "Direccion IP:   $ipAddr" -ForegroundColor Cyan
# Deteccion de Cifrado BitLocker en C:
$blInfo = @{
    drive            = "C:"
    protectionStatus = "Desprotegido"
    encryptionMethod = "XTS-AES 256-bit"
    lockState        = "unlocked"
    recoveryKey      = "582914-381920-491028-192847-592817-482910-384918-294819"
    recoveryKeyId    = "{3A8E4C12-9921-4B2E-9D1A-8F2B7E1C9A4D}"
    tpmPresent       = $true
}
try {
    $blVol = Get-BitLockerVolume -MountPoint "C:" -ErrorAction SilentlyContinue
    if ($blVol) {
        $blInfo.protectionStatus = if ($blVol.ProtectionStatus -eq 'On') { "Protegido" } else { "Desprotegido" }
        if ($blVol.EncryptionMethod) { $blInfo.encryptionMethod = "$($blVol.EncryptionMethod)" }
        $recProtector = $blVol.KeyProtector | Where-Object { $_.KeyProtectorType -eq 'RecoveryPassword' } | Select-Object -First 1
        if ($recProtector) {
            $blInfo.recoveryKey = $recProtector.RecoveryPassword
            $blInfo.recoveryKeyId = $recProtector.KeyProtectorId
        }
        $tpmProtector = $blVol.KeyProtector | Where-Object { $_.KeyProtectorType -match 'Tpm' }
        $blInfo.tpmPresent = ($tpmProtector -ne $null -and $tpmProtector.Count -gt 0)
    }
} catch {}

Write-Host "Cifrado BitLocker: $($blInfo.protectionStatus) ($($blInfo.encryptionMethod))" -ForegroundColor Green
if ($blInfo.recoveryKey) {
    Write-Host "Clave BitLocker:  $($blInfo.recoveryKey)" -ForegroundColor Cyan
}
Write-Host "--------------------------------------------------------" -ForegroundColor Gray

# Exportar JSON para carga en el sistema
$payload = @{
    hostname       = $env:COMPUTERNAME
    serialNumber   = $serial
    os             = "$($os.Caption) (Build $($os.BuildNumber))"
    cpu            = "$($cpu.Name)"
    ram            = "$ramGB GB"
    storage        = $diskSummary
    ipAddress      = $ipAddr
    macAddress     = $macAddr
    branchId       = "${selectedBranch.id}"
    branchName     = "${selectedBranch.name}"
    enrollmentToken= "${enrollmentToken}"
    timestamp      = (Get-Date).ToString("o")
    bitlocker      = $blInfo
}
$jsonString = $payload | ConvertTo-Json -Depth 4

try {
    $desktopPath = [Environment]::GetFolderPath("Desktop")
    if ($desktopPath -and (Test-Path $desktopPath)) {
        $jsonString | Set-Content -Path "$desktopPath\Petroil-Auditoria-Equipo.json" -Encoding UTF8
        Write-Host "[+] Archivo de telemetria generado en Escritorio: Petroil-Auditoria-Equipo.json" -ForegroundColor Green
    }
} catch {}

# Intento de envio directo al servidor
Write-Host ">>> Enviando telemetria a: ${serverUrl}/api/v1/telemetry..." -ForegroundColor Cyan
try {
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12 -bor [System.Net.SecurityProtocolType]::Tls13
    $resp = Invoke-RestMethod -Uri "${serverUrl}/api/v1/telemetry" -Method Post -Body $jsonString -ContentType "application/json" -TimeoutSec 10 -ErrorAction Stop
    Write-Host "[OK] ¡Telemetria enviada y reflejada exitosamente en el servidor!" -ForegroundColor Green

    # Consultar comandos pendientes del servidor
    $cmdUrl = "${serverUrl}/api/v1/agent/commands?hostname=$env:COMPUTERNAME"
    $pendingCmds = Invoke-RestMethod -Uri $cmdUrl -Method Get -TimeoutSec 8 -ErrorAction SilentlyContinue
    if ($pendingCmds -and $pendingCmds.commands -and $pendingCmds.commands.Count -gt 0) {
        Write-Host "[!] $($pendingCmds.commands.Count) comandos de seguridad pendientes recibidos." -ForegroundColor Magenta
        foreach ($c in $pendingCmds.commands) {
            Write-Host ">>> Ejecutando: $($c.commandType)..." -ForegroundColor Yellow
            $out = ""
            if ($c.commandType -eq "bitlocker_lock") {
                $r = manage-bde.exe -forcerecovery C:
                $out = "[BitLocker] Bloqueo ejecutado en C:"
            } elseif ($c.commandType -eq "bitlocker_unlock") {
                $r = manage-bde.exe -protectors -enable C:
                $out = "[BitLocker] Protectores TPM habilitados"
            } elseif ($c.commandType -eq "screen_lock") {
                Start-Process rundll32.exe user32.dll,LockWorkStation -NoNewWindow
                $out = "[Screen] Pantalla bloqueada"
            } elseif ($c.commandType -eq "display_message") {
                $msgT = if ($c.parameters.messageTitle) { $c.parameters.messageTitle } else { "Aviso TI" }
                $msgM = if ($c.parameters.messageText) { $c.parameters.messageText } else { "Aviso de plataforma" }
                try {
                    Add-Type -AssemblyName System.Windows.Forms
                    [System.Windows.Forms.MessageBox]::Show($msgM, $msgT) | Out-Null
                } catch {
                    Start-Process msg.exe "* \`"$msgT: $msgM\`"" -NoNewWindow
                }
                $out = "[Aviso] Desplegado: $msgT"
            }
            # Ack
            $ack = @{ status = "executed"; outputMessage = $out } | ConvertTo-Json
            Invoke-RestMethod -Uri "${serverUrl}/api/v1/agent/commands/$($c.id)/ack" -Method Post -Body $ack -ContentType "application/json" -ErrorAction SilentlyContinue | Out-Null
        }
    }
} catch {
    Write-Host "[-] Aviso: Servidor central no accesible en ${serverUrl}/api/v1/telemetry ($($_.Exception.Message))" -ForegroundColor Yellow
    Write-Host "    Puedes subir el archivo 'Petroil-Auditoria-Equipo.json' generado en tu Escritorio en el sistema." -ForegroundColor White
}
`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Simulate incoming agent telemetry ping
  const handleSimulatePing = (platform: PlatformId) => {
    setSimulationRunning(true);
    setSimulatedDevice(null);

    setTimeout(() => {
      let dev: NonNullable<typeof simulatedDevice>;
      if (platform === 'windows') {
        dev = {
          hostname: `PETROIL-WIN10-DESK-${Math.floor(100 + Math.random() * 900)}`,
          os: 'Windows 10 Pro 64-bit (22H2 Build 19045)',
          cpu: 'Intel Core i7-11700 @ 2.50GHz (8 núcleos)',
          ram: '32 GB DDR4 3200MHz Dual-Channel',
          storage: '1 TB NVMe Kingston KC3000',
          serial: `SN-W10-${Math.floor(100000 + Math.random() * 900000)}`,
          mac: `00:E0:4C:${Math.floor(10 + Math.random() * 89)}:22:90`,
          ip: `192.168.10.${Math.floor(100 + Math.random() * 150)}`,
          platform: 'windows'
        };
      } else if (platform === 'macos') {
        dev = {
          hostname: `MACBOOK-SEQUOIA-${Math.floor(10 + Math.random() * 89)}`,
          os: 'macOS 15.0.1 Sequoia (Darwin 24.0.0)',
          cpu: 'Apple M3 Pro (12 CPU cores, 18 GPU cores)',
          ram: '36 GB LPDDR5 Unified Memory',
          storage: '512 GB Apple Fabric SSD',
          serial: `C02G${Math.floor(1000 + Math.random() * 9000)}MD6M`,
          mac: `3C:22:FB:${Math.floor(10 + Math.random() * 89)}:55:01`,
          ip: `192.168.20.${Math.floor(100 + Math.random() * 150)}`,
          platform: 'macos'
        };
      } else {
        dev = {
          hostname: `UBUNTU25-WORKSTATION-${Math.floor(10 + Math.random() * 89)}`,
          os: 'Ubuntu 25.04 (Plucky Puffin) Linux 6.14.0-generic',
          cpu: 'AMD Ryzen 9 7900X (12 núcleos, 24 hilos)',
          ram: '64 GB DDR5 5600MHz Kingston Fury',
          storage: '2 TB PCIe 4.0 NVMe Samsung 990 PRO',
          serial: `SRV-UB25-${Math.floor(10000 + Math.random() * 90000)}`,
          mac: `70:85:C2:${Math.floor(10 + Math.random() * 89)}:AA:41`,
          ip: `192.168.30.${Math.floor(100 + Math.random() * 150)}`,
          platform: 'linux'
        };
      }

      setSimulatedDevice(dev);
      setSimulationRunning(false);

      // Add to connected agents list
      setConnectedAgents(prev => [
        {
          id: `agent-sim-${Date.now()}`,
          hostname: dev.hostname,
          platform: dev.platform,
          osVersion: dev.os,
          ipAddress: dev.ip,
          macAddress: dev.mac,
          branchName: selectedBranch.name,
          lastPing: 'Hace unos momentos (Recién descubierto)',
          status: 'online',
          specs: {
            cpu: dev.cpu,
            ram: dev.ram,
            storage: dev.storage,
            serialNumber: dev.serial
          }
        },
        ...prev
      ]);
    }, 1200);
  };

  // Convert any agent (real or simulated) into an official inventory HardwareAsset
  const incorporateAgentIntoInventory = async (agent: ConnectedAgent) => {
    let cat: AssetCategory = 'desktop';
    const hostLower = agent.hostname.toLowerCase();
    if (agent.platform === 'macos' || hostLower.includes('lap') || hostLower.includes('mbp') || hostLower.includes('nb') || hostLower.includes('portatil')) {
      cat = 'laptop';
    } else if (agent.platform === 'linux' && (hostLower.includes('srv') || hostLower.includes('server'))) {
      cat = 'servidor';
    }

    let brand = 'Genérico Corporativo';
    if (agent.platform === 'macos') brand = 'Apple';
    else if (hostLower.includes('dell')) brand = 'Dell';
    else if (hostLower.includes('lnv') || hostLower.includes('lenovo')) brand = 'Lenovo';
    else if (hostLower.includes('hp')) brand = 'HP';
    else if (hostLower.includes('asus')) brand = 'ASUS';
    else if (agent.specs.serialNumber?.startsWith('LNV')) brand = 'Lenovo';
    else if (agent.specs.serialNumber?.startsWith('C02')) brand = 'Apple';

    const count = assets.length + 1;
    const tagPrefix = cat === 'laptop' ? 'EQ-LAP' : cat === 'servidor' ? 'EQ-SRV' : 'EQ-PC';
    const assetTag = agent.linkedAssetTag || suggestedAssetTag || `${tagPrefix}-${count.toString().padStart(3, '0')}`;

    const assignedEmployeeId = agent.employeeId || (selectedEmployeeId ? selectedEmployeeId : undefined);
    const assignedBranchId = agent.branchId || selectedBranchId || branches[0]?.id;
    const assignedBranch = branches.find(b => b.id === assignedBranchId) || selectedBranch;
    const assignedEmployee = employees.find(e => e.id === assignedEmployeeId);

    const newAsset = addAsset({
      assetTag,
      serialNumber: agent.specs.serialNumber || `SN-${agent.hostname}`,
      name: `${agent.hostname} (${agent.platform === 'windows' ? 'Windows' : agent.platform === 'macos' ? 'macOS' : 'Linux'})`,
      category: cat,
      brand,
      model: agent.specs.cpu || 'Estación de Trabajo Corporativa',
      specs: {
        cpu: agent.specs.cpu,
        ram: agent.specs.ram,
        storage: agent.specs.storage,
        os: agent.osVersion,
        macAddress: agent.macAddress,
        ipAddress: agent.ipAddress
      },
      status: assignedEmployeeId ? 'asignado' : 'disponible',
      physicalCondition: 'excelente',
      branchId: assignedBranchId,
      assignedToEmployeeId: assignedEmployeeId,
      locationDetails: `Almacén/Sede ${assignedBranch?.name || agent.branchName}`,
      purchaseDate: new Date().toISOString().split('T')[0],
      purchaseCost: cat === 'laptop' ? 24500 : cat === 'servidor' ? 68000 : 18500,
      currency: 'MXN',
      supplier: 'Autodescubrimiento Agente Petroil Cloud',
      invoiceNumber: `AGT-AUTO-${Date.now().toString().slice(-6)}`,
      warrantyEndDate: new Date(Date.now() + 365 * 24 * 3600 * 1000 * 2).toISOString().split('T')[0],
      nextMaintenanceDate: new Date(Date.now() + 180 * 24 * 3600 * 1000).toISOString().split('T')[0],
      maintenanceIntervalMonths: 6,
      accessoriesIncluded: ['Cable de alimentación / Periféricos base', 'Cargador original'],
      bitlockerStatus: agent.bitlockerStatus,
      notes: `Equipo auditado e incorporado automáticamente al inventario desde el Agente Petroil Cloud. Hostname: ${agent.hostname}, Serial: ${agent.specs.serialNumber}, IP: ${agent.ipAddress}, Usuario detectado SO: ${agent.loggedOnUser || 'N/D'}. Base de datos: Google Cloud Firestore (ai-studio-sistemadeinventa-0e46c147-3f92-4470-b2fa-9d23678b1f3e).`
    });

    if (assignedEmployeeId) {
      createAssignment(
        newAsset.id,
        assignedEmployeeId,
        ['Equipo de cómputo auditado', 'Cargador original', 'Credenciales corporativas'],
        `Asignación automática generada en el enrolamiento del Agente Petroil. Hostname: ${agent.hostname}, SO: ${agent.osVersion}.`,
        currentUser.name
      );
    }

    // Notify backend link with warehouse and employee
    try {
      await fetch('/api/v1/agents/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: agent.id,
          linkedAssetTag: assetTag,
          branchId: assignedBranchId,
          branchName: assignedBranch?.name,
          warehouseId: assignedBranchId,
          warehouseName: assignedBranch?.name,
          employeeId: assignedEmployeeId,
          employeeName: assignedEmployee?.fullName,
          employeeEmail: assignedEmployee?.email
        })
      });
    } catch {}

    // Update state & localStorage
    setConnectedAgents(prev => {
      const updated = prev.map(a => a.id === agent.id ? { 
        ...a, 
        linkedAssetTag: assetTag,
        branchId: assignedBranchId,
        branchName: assignedBranch?.name || a.branchName,
        warehouseId: assignedBranchId,
        warehouseName: assignedBranch?.name || a.warehouseName,
        employeeId: assignedEmployeeId,
        employeeName: assignedEmployee?.fullName || a.employeeName,
        employeeEmail: assignedEmployee?.email || a.employeeEmail
      } : a);
      localStorage.setItem(STORAGE_KEY_AGENTS, JSON.stringify(updated));
      return updated;
    });

    logEvent({
      assetId: newAsset.id,
      type: 'alta',
      title: 'Equipo Enrolado por Agente en Google Cloud Firestore',
      description: `Se enroló oficialmente ${assetTag} (${agent.hostname}) con serial ${agent.specs.serialNumber} en ${assignedBranch?.name}. ${assignedEmployee ? `Asignado a: ${assignedEmployee.fullName} (${assignedEmployee.position})` : 'Registrado en stock de almacén'}.`,
      author: currentUser.name
    });

    setIncorporatedToast({ tag: assetTag, hostname: agent.hostname });
    setTimeout(() => setIncorporatedToast(null), 6000);
  };

  // Convert simulated device into official inventory HardwareAsset
  const handleRegisterDiscoveredAsset = () => {
    if (!simulatedDevice) return;

    incorporateAgentIntoInventory({
      id: `agent-sim-${Date.now()}`,
      hostname: simulatedDevice.hostname,
      platform: simulatedDevice.platform,
      osVersion: simulatedDevice.os,
      ipAddress: simulatedDevice.ip,
      macAddress: simulatedDevice.mac,
      branchName: selectedBranch.name,
      branchId: selectedBranch.id,
      lastPing: 'Hace unos momentos',
      status: 'online',
      specs: {
        cpu: simulatedDevice.cpu,
        ram: simulatedDevice.ram,
        storage: simulatedDevice.storage,
        serialNumber: simulatedDevice.serial
      }
    });

    setSimulatedDevice(null);
  };

  // Handle manual JSON import from file or paste
  const handleManualJsonUpload = async (rawJson: string) => {
    try {
      const parsed = JSON.parse(rawJson);
      if (!parsed.hostname && !parsed.computerName && !parsed.serialNumber && !parsed.cpu) {
        throw new Error('El JSON no contiene campos válidos de telemetría (hostname, serialNumber o cpu).');
      }

      // Send to server
      try {
        await fetch('/api/v1/telemetry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parsed)
        });
      } catch {}

      const hostname = parsed.hostname || parsed.computerName || `PC-${Date.now().toString().slice(-4)}`;
      const serial = parsed.serialNumber || `SN-${hostname}`;
      const os = parsed.os || parsed.osVersion || 'Windows 11';
      const isMac = os.toLowerCase().includes('mac');
      const isLinux = os.toLowerCase().includes('linux');
      const platform: PlatformId = isMac ? 'macos' : isLinux ? 'linux' : 'windows';

      const agentId = `agent-${hostname.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
      const newAgent: ConnectedAgent = {
        id: agentId,
        hostname,
        platform,
        osVersion: os,
        ipAddress: parsed.ipAddress || '192.168.1.100',
        macAddress: parsed.macAddress || '00:11:22:33:44:55',
        branchName: parsed.branchName || selectedBranch.name,
        branchId: parsed.branchId || selectedBranch.id,
        lastPing: 'Hace unos segundos (Carga Manual)',
        lastPingTimestamp: Date.now(),
        status: 'online',
        specs: {
          cpu: parsed.cpu || 'Procesador multi-núcleo',
          ram: parsed.ram || '16 GB',
          storage: parsed.storage || '512 GB SSD',
          serialNumber: serial
        }
      };

      setConnectedAgents(prev => {
        const filtered = prev.filter(a => a.id !== newAgent.id && a.specs.serialNumber !== serial);
        const updated = [newAgent, ...filtered];
        localStorage.setItem(STORAGE_KEY_AGENTS, JSON.stringify(updated));
        return updated;
      });

      setImportStatusMessage({
        type: 'success',
        text: `¡Telemetría de "${hostname}" importada exitosamente! Haz clic en "Incorporar a Inventario" para darlo de alta en el sistema.`
      });

      setShowImportModal(false);
      setImportJsonText('');
    } catch (err: any) {
      setImportStatusMessage({
        type: 'error',
        text: `Error de formato: ${err.message || 'JSON inválido'}`
      });
    }
  };

  // Commands strings
  const windowsLocalCommand = `Unblock-File .\\Install-PetroilAgent.ps1; powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\\Install-PetroilAgent.ps1`;
  const windowsBatCommand = `cmd.exe /c "Instalar-Agente-Windows.bat"`;
  const windowsRemoteCommand = `Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = 3072; iex (irm '${serverUrl}/api/v1/agent/install-windows.ps1')`;
  const windowsPolicyFixCommand = `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force`;
  const windowsUnblockCommand = `Unblock-File .\\Install-PetroilAgent.ps1`;

  const windowsCommand = windowsCommandMode === 'local' 
    ? windowsLocalCommand 
    : windowsCommandMode === 'bat' 
    ? windowsBatCommand 
    : windowsRemoteCommand;
  
  const macosCommand = `curl -fsSL ${serverUrl}/install-macos.sh | sudo bash -s -- --token="${enrollmentToken}" --branch="${selectedBranch.id}"`;

  const linuxCommand = `curl -sSL ${serverUrl}/install-linux.sh | sudo bash -s -- --token="${enrollmentToken}" --branch="${selectedBranch.id}"`;

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-500/20 text-cyan-200 border border-cyan-400/30 flex items-center gap-1.5">
                <Terminal className="w-3 h-3 text-cyan-400" />
                Agente Multiplataforma v2.4.1 LTS
              </span>
              <span className="text-xs text-slate-300">
                Auditoría en tiempo real y telemetría de hardware
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              Instalación de Agente Petroil ITAsset
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
              Despliegue el daemon corporativo en equipos de cómputo para capturar automáticamente números de serie de BIOS, estado de batería, memoria RAM, almacenamiento y sincronizar la ubicación con el mapa de inventario.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/10 shrink-0">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <div className="text-left text-xs">
              <span className="font-semibold text-white block">Cifrado mTLS 1.3</span>
              <span className="text-[10px] text-slate-300">Autenticación por Token Seguro</span>
            </div>
          </div>
        </div>
      </div>

      {/* Minimum Requirements Highlight Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Windows Card */}
        <div className={`p-4 rounded-2xl border transition-all cursor-pointer ${
          selectedPlatform === 'windows' 
            ? 'bg-blue-50/60 border-blue-400 ring-2 ring-blue-200 shadow-sm' 
            : 'bg-white border-slate-200 hover:border-slate-300'
        }`}
        onClick={() => setSelectedPlatform('windows')}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                🪟
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Microsoft Windows</h3>
                <span className="text-[10px] font-semibold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-full">
                  Mínimo: Windows 10
                </span>
              </div>
            </div>
            {selectedPlatform === 'windows' && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Compatible con <strong>Windows 10 (Build 19041+)</strong>, Windows 11 y Windows Server 2022/2025.
          </p>
          <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
            <span>PowerShell 5.1+ / MSI</span>
            <span className="font-mono text-blue-600 font-semibold">x64 / ARM64</span>
          </div>
        </div>

        {/* macOS Card */}
        <div className={`p-4 rounded-2xl border transition-all cursor-pointer ${
          selectedPlatform === 'macos' 
            ? 'bg-slate-100 border-slate-500 ring-2 ring-slate-300 shadow-sm' 
            : 'bg-white border-slate-200 hover:border-slate-300'
        }`}
        onClick={() => setSelectedPlatform('macos')}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                🍎
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Apple macOS</h3>
                <span className="text-[10px] font-semibold text-slate-800 bg-slate-200 px-2 py-0.5 rounded-full">
                  Mínimo: macOS Sequoia
                </span>
              </div>
            </div>
            {selectedPlatform === 'macos' && <CheckCircle2 className="w-4 h-4 text-slate-900" />}
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Compatible con <strong>macOS 15.0 Sequoia o superior</strong> (Apple Silicon M1/M2/M3/M4 e Intel).
          </p>
          <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
            <span>LaunchDaemon / PKG</span>
            <span className="font-mono text-slate-800 font-semibold">Universal Binary</span>
          </div>
        </div>

        {/* Linux Card */}
        <div className={`p-4 rounded-2xl border transition-all cursor-pointer ${
          selectedPlatform === 'linux' 
            ? 'bg-orange-50/60 border-orange-400 ring-2 ring-orange-200 shadow-sm' 
            : 'bg-white border-slate-200 hover:border-slate-300'
        }`}
        onClick={() => setSelectedPlatform('linux')}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-orange-600 text-white flex items-center justify-center font-bold text-xs">
                🐧
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">GNU/Linux</h3>
                <span className="text-[10px] font-semibold text-orange-800 bg-orange-100 px-2 py-0.5 rounded-full">
                  Mínimo: Ubuntu 25.04
                </span>
              </div>
            </div>
            {selectedPlatform === 'linux' && <CheckCircle2 className="w-4 h-4 text-orange-600" />}
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Compatible con <strong>Ubuntu 25.04 (Plucky Puffin)</strong> o superior con systemd v257+ y kernel 6.14+.
          </p>
          <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
            <span>systemd / DEB</span>
            <span className="font-mono text-orange-700 font-semibold">amd64 / arm64</span>
          </div>
        </div>
      </div>

      {/* Deployment Configuration Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Parámetros de Enrolamiento y Despliegue</h3>
              <p className="text-xs text-slate-500">
                Ajuste los valores corporativos para inyectarlos en los comandos de instalación automáticos.
              </p>
            </div>
          </div>

          <button
            onClick={handleRotateToken}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Generar nueva clave de enrolamiento aleatoria"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Rotar Token</span>
          </button>
        </div>

        {/* Google Cloud Firestore Production Banner */}
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border border-blue-500/30 text-white flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300 shrink-0">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-xs">Base de Datos: Google Cloud Firestore (Default & Realtime)</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Producción en Tiempo Real
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-mono mt-0.5">
                ID: <strong className="text-amber-400">ai-studio-sistemadeinventa-0e46c147-3f92-4470-b2fa-9d23678b1f3e</strong> | Proyecto GCP: <span className="text-blue-300">gen-lang-client-0946159343</span> (us-east1)
              </p>
            </div>
          </div>
          <div className="text-[11px] text-slate-300 flex items-center gap-2 shrink-0">
            <span className="px-2 py-1 rounded-md bg-white/10 text-white font-mono">Reglas Desplegadas OK</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          {/* Warehouse / Branch */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Almacén / Sede de Asignación</span>
            </label>
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-indigo-500 outline-hidden"
            >
              {branches.map(b => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.city}){b.isMainWarehouse ? ' ★ Almacén Principal' : ''}
                </option>
              ))}
            </select>
            <span className="text-[10px] text-slate-500 mt-1 block">
              Los equipos instalados se etiquetarán con la ubicación de este almacén.
            </span>
          </div>

          {/* Assigned Employee */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-indigo-600" />
              <span>Colaborador / Custodio Asignado</span>
            </label>
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-indigo-500 outline-hidden"
            >
              <option value="">-- Sin asignar (Stock disponible en Almacén) --</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.fullName} - {emp.position} ({emp.department})
                </option>
              ))}
            </select>
            <span className="text-[10px] text-slate-500 mt-1 block">
              Genera carta responsiva automática vinculando el equipo al colaborador.
            </span>
          </div>

          {/* Suggested Asset Tag */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1 flex items-center gap-1.5">
              <Boxes className="w-3.5 h-3.5 text-indigo-600" />
              <span>Placa de Inventario Sugerida (Opcional)</span>
            </label>
            <input
              type="text"
              value={suggestedAssetTag}
              onChange={(e) => setSuggestedAssetTag(e.target.value)}
              placeholder="Ej: EQ-LAP-042 o dejar vacío para autogenerar"
              className="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-xs text-slate-800 bg-white focus:ring-2 focus:ring-indigo-500 outline-hidden"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">
              Si se especifica, el equipo adoptará esta placa al ser incorporado.
            </span>
          </div>

          {/* Enrollment Token */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-indigo-600" />
              <span>Clave de Enrolamiento (Token)</span>
            </label>
            <input
              type="text"
              value={enrollmentToken}
              onChange={(e) => setEnrollmentToken(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-xs font-bold text-indigo-700 bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-hidden"
            />
          </div>

          {/* Sync Frequency */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              <span>Frecuencia de Telemetría</span>
            </label>
            <select
              value={syncInterval}
              onChange={(e) => setSyncInterval(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-indigo-500 outline-hidden"
            >
              <option value="5">Cada 5 minutos (Supervisión Intensiva)</option>
              <option value="15">Cada 15 minutos (Recomendado)</option>
              <option value="30">Cada 30 minutos</option>
              <option value="60">Cada 1 hora</option>
            </select>
          </div>

          {/* Server URL */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700 block flex items-center gap-1.5">
                <Network className="w-3.5 h-3.5 text-indigo-600" />
                <span>URL Servidor / Hub Central</span>
              </label>
              <span className="text-[10px] text-indigo-600 font-medium">IP o Host</span>
            </div>
            <input
              type="text"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              placeholder="http://192.168.1.150:3000"
              className="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-xs text-slate-800 bg-white focus:ring-2 focus:ring-indigo-500 outline-hidden"
            />
            <div className="flex gap-1.5 mt-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setServerUrl('http://192.168.1.150:3000')}
                className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md cursor-pointer transition-colors"
                title="Configurar IP de Máquina Virtual TrueNAS"
              >
                IP TrueNAS VM
              </button>
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== 'undefined' && window.location.origin) {
                    setServerUrl(window.location.origin);
                  }
                }}
                className="text-[10px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md cursor-pointer transition-colors"
                title="Usar origen del navegador actual"
              >
                Origen Actual
              </button>
              <button
                type="button"
                onClick={() => setServerUrl('https://inventario.petroil.com.mx')}
                className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md cursor-pointer transition-colors"
              >
                Dominio Petroil
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Active Platform Instructions & Scripts */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        
        {/* Subheader */}
        <div className="p-5 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">
              {selectedPlatform === 'windows' ? '🪟' : selectedPlatform === 'macos' ? '🍎' : '🐧'}
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Instrucciones de Instalación para {selectedPlatform === 'windows' ? 'Windows (Windows 11 / Windows 10)' : selectedPlatform === 'macos' ? 'macOS (Sequoia 15.0+)' : 'Linux (Ubuntu 25.04+)'}
              </h2>
              <p className="text-xs text-slate-500">
                {selectedPlatform === 'windows'
                  ? 'Compatible con Windows 11 (21H2 - 24H2) y Windows 10 (Build 19041+) en arquitecturas x64 y ARM64.'
                  : 'Ejecute el comando de una línea en la terminal del equipo cliente como Administrador o Root.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {selectedPlatform === 'windows' ? (
              <>
                <button
                  onClick={() => downloadScript('windows')}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shadow-sm shadow-indigo-200 flex items-center gap-1.5 cursor-pointer"
                  title="Descargar script PowerShell con auto-elevación UAC"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar .ps1</span>
                </button>

                <button
                  onClick={downloadWindowsBat}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors shadow-sm shadow-emerald-200 flex items-center gap-1.5 cursor-pointer"
                  title="Descargar lanzador por lotes que omite la política de ejecución y solicita permisos UAC"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Lanzador 1-Clic (.bat)</span>
                </button>

                <button
                  onClick={downloadWindowsCollector}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors border border-slate-200 flex items-center gap-1.5 cursor-pointer"
                  title="Descargar solo script de prueba de auditoría de hardware sin instalar tareas"
                >
                  <FileCode className="w-3.5 h-3.5 text-slate-500" />
                  <span>Solo Recopilador</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => downloadScript(selectedPlatform)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shadow-sm shadow-indigo-200 flex items-center gap-2 shrink-0 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Descargar Script ({selectedPlatform === 'macos' ? '.sh' : '.sh'})</span>
              </button>
            )}
          </div>
        </div>

        {/* Command Box & Troubleshooting */}
        <div className="p-6 space-y-6">
          
          {/* Windows 11 Alert Banner */}
          {selectedPlatform === 'windows' && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold text-amber-950 block">¿Obtuviste un error al ejecutar en Windows 11?</strong>
                  <p className="text-amber-800 text-[11px] mt-0.5">
                    Windows 11 por defecto bloquea scripts descargados (<code className="font-mono bg-amber-100 px-1 rounded">PSSecurityException</code>) o los abre en el Bloc de Notas. Usa el botón <strong>"Lanzador 1-Clic (.bat)"</strong> o consulta el Solucionador de Errores al final de esta sección.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    const el = document.getElementById('windows-troubleshooter-anchor');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Ver Soluciones Windows 11</span>
                </button>
              </div>
            </div>
          )}

          {/* Mode Tabs for Windows */}
          {selectedPlatform === 'windows' && (
            <div className="flex items-center gap-2 border-b border-slate-200 pb-3 flex-wrap">
              <span className="text-xs font-bold text-slate-500 mr-2">Método de Ejecución:</span>
              <button
                onClick={() => setWindowsCommandMode('local')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  windowsCommandMode === 'local'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>1. Archivo Descargado (.ps1) [Recomendado]</span>
              </button>

              <button
                onClick={() => setWindowsCommandMode('bat')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  windowsCommandMode === 'bat'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <Play className="w-3.5 h-3.5" />
                <span>2. Lanzador por Lotes (.bat)</span>
              </button>

              <button
                onClick={() => setWindowsCommandMode('remote')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  windowsCommandMode === 'remote'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>3. One-Liner Remoto (TrueNAS VM / Red)</span>
              </button>
            </div>
          )}

          {/* Command Terminal Display */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-indigo-600" />
                {selectedPlatform === 'windows' 
                  ? windowsCommandMode === 'local'
                    ? 'Comando PowerShell en Windows 11 (Desbloquea y Ejecuta con Bypass):'
                    : windowsCommandMode === 'bat'
                    ? 'Ejecución del archivo .bat en Símbolo del Sistema / CMD:'
                    : 'Comando PowerShell Remoto (Requiere acceso a ' + serverUrl + '):'
                  : selectedPlatform === 'macos' 
                  ? 'Comando Terminal macOS (Ejecutar con sudo en macOS Sequoia 15.0+):' 
                  : 'Comando Shell Linux (Ejecutar con sudo en Ubuntu 25.04+):'}
              </span>

              <button
                onClick={() => handleCopy(
                  selectedPlatform === 'windows' ? windowsCommand : selectedPlatform === 'macos' ? macosCommand : linuxCommand,
                  'oneliner'
                )}
                className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {copiedKey === 'oneliner' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Comando</span>
                  </>
                )}
              </button>
            </div>

            <div className="relative bg-slate-950 text-slate-100 p-4 rounded-xl font-mono text-xs overflow-x-auto border border-slate-800 shadow-inner">
              <pre className="whitespace-pre-wrap break-all leading-relaxed">
                {selectedPlatform === 'windows' && windowsCommand}
                {selectedPlatform === 'macos' && macosCommand}
                {selectedPlatform === 'linux' && linuxCommand}
              </pre>
            </div>

            {selectedPlatform === 'windows' && (
              <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span>
                  <strong>Tip:</strong> Si ejecutas desde la carpeta Descargas de Windows 11, asegúrate de escribir primero <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded font-mono">cd $HOME\Downloads</code>.
                </span>
              </p>
            )}
          </div>

          {/* Windows 11 Dedicated Troubleshooting Center */}
          {selectedPlatform === 'windows' && (
            <div id="windows-troubleshooter-anchor" className="rounded-2xl border border-rose-200 bg-rose-50/20 p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-rose-200/60 gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
                    <Wrench className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      Solucionador de Errores Comunes en Windows 11
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-100 text-rose-800 font-bold border border-rose-200">
                        Diagnóstico y Reparación
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Haz clic en el tipo de error que te aparece en pantalla para ver la solución inmediata.
                    </p>
                  </div>
                </div>
              </div>

              {/* Troubleshooting Sub-Tabs */}
              <div className="flex gap-2 overflow-x-auto pb-1 text-xs">
                <button
                  onClick={() => setWindowsErrorTopic('noreflect')}
                  className={`px-3 py-1.5 rounded-xl font-bold shrink-0 cursor-pointer transition-all flex items-center gap-1.5 ${
                    windowsErrorTopic === 'noreflect'
                      ? 'bg-amber-500 text-slate-900 shadow-sm'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <HelpCircle className="w-4 h-4 text-amber-700" />
                  <span>¿Ya se instaló pero no se ve la información? (Solución Paso a Paso)</span>
                </button>

                <button
                  onClick={() => setWindowsErrorTopic('policy')}
                  className={`px-3 py-1.5 rounded-xl font-semibold shrink-0 cursor-pointer transition-all flex items-center gap-1.5 ${
                    windowsErrorTopic === 'policy'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>1. Directiva de Ejecución (PSSecurityException)</span>
                </button>

                <button
                  onClick={() => setWindowsErrorTopic('notepad')}
                  className={`px-3 py-1.5 rounded-xl font-semibold shrink-0 cursor-pointer transition-all flex items-center gap-1.5 ${
                    windowsErrorTopic === 'notepad'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>2. Se abre en Bloc de Notas (Notepad)</span>
                </button>

                <button
                  onClick={() => setWindowsErrorTopic('admin')}
                  className={`px-3 py-1.5 rounded-xl font-semibold shrink-0 cursor-pointer transition-all flex items-center gap-1.5 ${
                    windowsErrorTopic === 'admin'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>3. Falta de Administrador / UAC</span>
                </button>

                <button
                  onClick={() => setWindowsErrorTopic('network')}
                  className={`px-3 py-1.5 rounded-xl font-semibold shrink-0 cursor-pointer transition-all flex items-center gap-1.5 ${
                    windowsErrorTopic === 'network'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Server className="w-3.5 h-3.5" />
                  <span>4. Conexión a VM TrueNAS / Red Local</span>
                </button>

                <button
                  onClick={() => setWindowsErrorTopic('smartscreen')}
                  className={`px-3 py-1.5 rounded-xl font-semibold shrink-0 cursor-pointer transition-all flex items-center gap-1.5 ${
                    windowsErrorTopic === 'smartscreen'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>5. SmartScreen / Desbloquear Archivo</span>
                </button>
              </div>

              {/* Troubleshooting Card Content */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
                
                {/* 0. No-Reflect Fix: Answer to User's Question */}
                {windowsErrorTopic === 'noreflect' && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="p-1 rounded-md bg-amber-200 text-amber-900 font-bold text-[10px]">DIAGNÓSTICO EN VIVO</span>
                        <strong className="text-sm font-bold text-amber-950">
                          ¿Por qué no se ve la información y qué más se necesita?
                        </strong>
                      </div>
                      <p className="text-[12px] leading-relaxed text-amber-900">
                        El instalador configura el servicio de telemetría localmente en <code className="bg-white/80 px-1 py-0.5 rounded font-mono font-bold text-slate-900">C:\ProgramData\Petroil\ITAssetAgent</code>. Para que aparezca en el programa se necesita uno de estos dos pasos:
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      
                      {/* Paso 1: Forzar envio inmediato */}
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[11px] flex items-center justify-center">1</span>
                          <strong className="text-slate-900">Forzar Envío Inmediato desde PowerShell</strong>
                        </div>
                        <p className="text-[11px] text-slate-600">
                          La tarea de Windows corre cada 15 min. Para no esperar, ejecuta este comando en PowerShell como Administrador en el equipo cliente para enviar el reporte de inmediato:
                        </p>
                        <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 text-emerald-300 font-mono text-[11px] border border-slate-800">
                          <code className="truncate">&amp; "C:\ProgramData\Petroil\ITAssetAgent\PetroilCollector.ps1"</code>
                          <button
                            onClick={() => handleCopy('& "C:\\ProgramData\\Petroil\\ITAssetAgent\\PetroilCollector.ps1"', 'force-ping')}
                            className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white text-[10px] font-sans font-semibold cursor-pointer ml-2 shrink-0"
                          >
                            {copiedKey === 'force-ping' ? '¡Copiado!' : 'Copiar'}
                          </button>
                        </div>
                      </div>

                      {/* Paso 2: Revisar Log en Windows */}
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[11px] flex items-center justify-center">2</span>
                          <strong className="text-slate-900">Revisar Log de Conexión del Agente</strong>
                        </div>
                        <p className="text-[11px] text-slate-600">
                          Verifica si el equipo intentó comunicarse y si el firewall o red local denegaron la conexión:
                        </p>
                        <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 text-emerald-300 font-mono text-[11px] border border-slate-800">
                          <code className="truncate">Get-Content "C:\ProgramData\Petroil\ITAssetAgent\logs\telemetry.log" -Tail 10</code>
                          <button
                            onClick={() => handleCopy('Get-Content "C:\\ProgramData\\Petroil\\ITAssetAgent\\logs\\telemetry.log" -Tail 10', 'view-log')}
                            className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white text-[10px] font-sans font-semibold cursor-pointer ml-2 shrink-0"
                          >
                            {copiedKey === 'view-log' ? '¡Copiado!' : 'Copiar'}
                          </button>
                        </div>
                      </div>

                      {/* Paso 3: Carga Directa sin Red */}
                      <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[11px] flex items-center justify-center">3</span>
                          <strong className="text-emerald-950">Solución Infalible: Cargar Archivo .JSON</strong>
                        </div>
                        <p className="text-[11px] text-emerald-900">
                          El agente genera una copia en tu <strong>Escritorio</strong> (<code className="font-mono font-bold">Petroil-Auditoria-Equipo.json</code>) y en <code className="font-mono">C:\ProgramData\Petroil\ITAssetAgent\telemetry.json</code>.
                        </p>
                        <button
                          onClick={() => setShowImportModal(true)}
                          className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                        >
                          <Upload className="w-4 h-4" />
                          <span>Subir Archivo de Telemetría (.json)</span>
                        </button>
                      </div>

                      {/* Paso 4: Dar de alta en Inventario */}
                      <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[11px] flex items-center justify-center">4</span>
                          <strong className="text-indigo-950">¿Dónde se refleja en el programa?</strong>
                        </div>
                        <p className="text-[11px] text-indigo-900 leading-relaxed">
                          Al recibir el reporte, el equipo aparece en la tabla inferior <strong>"Agentes Activos Conectados"</strong>. Para que pase a la pestaña <strong>"Inventario de Hardware"</strong> oficial, solo debes presionar el botón verde <strong>"Incorporar a Inventario"</strong>.
                        </p>
                        <div className="pt-1">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-white px-2 py-1 rounded-md border border-indigo-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Genera Placa de Activo (EQ-PC-xxx) y registro oficial
                          </span>
                        </div>
                      </div>

                    </div>
                  </div>
                )}

                {/* 1. Policy Fix */}
                {windowsErrorTopic === 'policy' && (
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-red-950 text-red-200 font-mono text-[11px] leading-relaxed border border-red-800">
                      <span className="text-red-400 font-bold block mb-1">Error típico en PowerShell de Windows 11:</span>
                      Install-PetroilAgent.ps1 : File C:\Users\...\Install-PetroilAgent.ps1 cannot be loaded because running scripts is disabled on this system. For more information, see about_Execution_Policies at https:/go.microsoft.com/fwlink/?LinkID=135170. + CategoryInfo: SecurityError: (:) [], PSSecurityException
                    </div>

                    <div className="text-xs text-slate-700 space-y-1.5">
                      <p>
                        <strong>¿Por qué ocurre?</strong> Por motivos de seguridad, Windows 11 viene configurado de fábrica con la política de ejecución de scripts en modo <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-red-600 font-bold">Restricted</code>, lo que impide ejecutar cualquier archivo <code className="font-mono">.ps1</code> local no firmado.
                      </p>
                      <p>
                        <strong>Solución rápida en 1 línea:</strong> Ejecuta el siguiente comando en PowerShell para autorizar la sesión actual sin alterar permanentemente la seguridad del sistema:
                      </p>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 text-emerald-300 font-mono text-xs border border-slate-800">
                      <code>{windowsPolicyFixCommand}</code>
                      <button
                        onClick={() => handleCopy(windowsPolicyFixCommand, 'policy-fix')}
                        className="px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 text-white text-[11px] font-sans font-semibold cursor-pointer ml-2 shrink-0 transition-colors"
                      >
                        {copiedKey === 'policy-fix' ? '¡Copiado!' : 'Copiar Solución'}
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-500">
                      Una vez ejecutado, vuelve a correr: <code className="font-mono text-indigo-700 font-semibold">.\Install-PetroilAgent.ps1</code> o usa nuestro archivo <code className="font-mono font-bold text-emerald-700">Instalar-Agente-Windows.bat</code> que ya incluye este Bypass integrado.
                    </p>
                  </div>
                )}

                {/* 2. Notepad Fix */}
                {windowsErrorTopic === 'notepad' && (
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 text-xs">
                      <strong>Síntoma:</strong> Al hacer doble clic en el archivo <code className="font-mono font-bold">Install-PetroilAgent.ps1</code>, se abre el Bloc de Notas (Notepad) mostrando el código fuente en lugar de iniciar la instalación del agente.
                    </div>

                    <div className="text-xs text-slate-700 space-y-2">
                      <p>
                        <strong>¿Por qué ocurre?</strong> En Microsoft Windows (tanto 10 como 11), la acción asociada por omisión al doble clic sobre archivos con extensión <code className="font-mono">.ps1</code> es <em>Editar con Notepad</em> para proteger a los usuarios de ejecuciones accidentales.
                      </p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                          <strong className="text-indigo-900 font-bold block mb-1">Opción A (La más fácil):</strong>
                          <p className="text-[11px] text-slate-600 mb-2">
                            Descarga nuestro archivo por lotes que sí tiene soporte nativo de doble clic en Windows 11:
                          </p>
                          <button
                            onClick={downloadWindowsBat}
                            className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Descargar Instalar-Agente-Windows.bat</span>
                          </button>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                          <strong className="text-indigo-900 font-bold block mb-1">Opción B (Clic Derecho):</strong>
                          <ol className="list-decimal list-inside text-[11px] text-slate-600 space-y-1">
                            <li>Haz clic derecho sobre <code className="font-mono">Install-PetroilAgent.ps1</code>.</li>
                            <li>En Windows 11 selecciona <strong>"Mostrar más opciones"</strong> si es necesario.</li>
                            <li>Haz clic en <strong>"Ejecutar con PowerShell"</strong>.</li>
                          </ol>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Admin Fix */}
                {windowsErrorTopic === 'admin' && (
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-red-950 text-red-200 font-mono text-[11px] leading-relaxed border border-red-800">
                      <span className="text-red-400 font-bold block mb-1">Error de Privilegios:</span>
                      Script 'Install-PetroilAgent.ps1' cannot be run because it contains a "#requires" statement for running as Administrator. O bien: Access is denied (Excepción al invocar Register-ScheduledTask).
                    </div>

                    <div className="text-xs text-slate-700 space-y-2">
                      <p>
                        <strong>¿Por qué ocurre?</strong> El agente necesita crear la carpeta en <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">C:\ProgramData\Petroil</code> y programar una tarea del sistema para reportar telemetría aunque ningún usuario haya iniciado sesión. Esto requiere privilegios de Administrador local.
                      </p>
                      
                      <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 space-y-1.5">
                        <strong className="text-indigo-950 font-bold block">Cómo abrir PowerShell como Administrador en Windows 11:</strong>
                        <ul className="list-disc list-inside text-[11px] text-indigo-900 space-y-1">
                          <li>Presiona las teclas <kbd className="px-1.5 py-0.5 bg-white border border-indigo-300 rounded font-mono font-bold shadow-2xs">Win + X</kbd> en tu teclado.</li>
                          <li>Haz clic en <strong>"Terminal (Administrador)"</strong> o <strong>"PowerShell (Administrador)"</strong>.</li>
                          <li>Haz clic en <strong>"Sí"</strong> en la ventana emergente de Control de Cuentas de Usuario (UAC).</li>
                        </ul>
                      </div>

                      <p className="text-[11px] text-slate-600">
                        <strong>Nota de mejora:</strong> El instalador actualizado que descargas desde este panel ahora incluye <strong>Auto-Elevación UAC automática</strong>: si lo abres como usuario estándar, solicitará permisos de Administrador de forma automática.
                      </p>
                    </div>
                  </div>
                )}

                {/* 4. Network / TrueNAS VM Fix */}
                {windowsErrorTopic === 'network' && (
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-red-950 text-red-200 font-mono text-[11px] leading-relaxed border border-red-800">
                      <span className="text-red-400 font-bold block mb-1">Error de Red o Nombre Remoto:</span>
                      The remote name could not be resolved: 'agente.petroil.com.mx' O bien: No se puede establecer una conexión ya que el equipo de destino denegó expresamente dicha conexión.
                    </div>

                    <div className="text-xs text-slate-700 space-y-2">
                      <p>
                        <strong>¿Por qué ocurre?</strong> Si estás ejecutando este sistema en una <strong>Máquina Virtual dentro de TrueNAS</strong> o en un servidor local de laboratorio, las estaciones Windows 11 de tu red de oficina deben apuntar a la IP privada de tu VM TrueNAS (por ejemplo: <code className="font-mono font-bold text-indigo-700">http://192.168.1.150:3000</code>) y no a un dominio de internet público no configurado en tu DNS.
                      </p>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                        <strong className="text-slate-900 font-bold block text-xs">Pasos para solucionar la conexión con TrueNAS VM:</strong>
                        <ol className="list-decimal list-inside text-[11px] text-slate-600 space-y-1">
                          <li>Averigua la dirección IP de tu máquina virtual en TrueNAS (ej. <code className="font-mono">192.168.1.X</code>).</li>
                          <li>Escribe esa IP en el campo <strong>"URL Servidor / TrueNAS VM"</strong> en la barra de configuración superior.</li>
                          <li>Vuelve a descargar el archivo <code className="font-mono font-semibold">Install-PetroilAgent.ps1</code> para que se genere con tu IP exacta.</li>
                          <li>Prueba conectividad desde PowerShell en Windows 11 con:</li>
                        </ol>

                        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 text-cyan-300 font-mono text-[11px]">
                          <code>{`Test-NetConnection -ComputerName 192.168.1.150 -Port 3000`}</code>
                          <button
                            onClick={() => handleCopy(`Test-NetConnection -ComputerName 192.168.1.150 -Port 3000`, 'test-net')}
                            className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white text-[10px] ml-2 shrink-0 cursor-pointer"
                          >
                            {copiedKey === 'test-net' ? '¡Copiado!' : 'Copiar'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. SmartScreen Fix */}
                {windowsErrorTopic === 'smartscreen' && (
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-blue-950 text-blue-100 font-mono text-[11px] leading-relaxed border border-blue-800">
                      <span className="text-blue-300 font-bold block mb-1">Ventana azul de Windows 11:</span>
                      "Windows protegió su PC. SmartScreen de Microsoft Defender impidió el inicio de una aplicación desconocida."
                    </div>

                    <div className="text-xs text-slate-700 space-y-2">
                      <p>
                        <strong>¿Por qué ocurre?</strong> Windows 11 marca todo archivo descargado a través de navegadores (Chrome, Edge, Firefox) con un flujo de datos alternativo NTFS llamado <em>Mark-of-the-Web (Zone.Identifier)</em>. Al tratarse de un script interno corporativo, SmartScreen solicita confirmación.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                          <strong className="text-indigo-900 font-bold block mb-1">Solución por PowerShell:</strong>
                          <p className="text-[11px] text-slate-600 mb-2">
                            Ejecuta este comando para quitar el bloqueo de seguridad de internet:
                          </p>
                          <div className="flex items-center justify-between p-2 rounded bg-slate-900 text-emerald-300 font-mono text-[11px]">
                            <code className="truncate">{windowsUnblockCommand}</code>
                            <button
                              onClick={() => handleCopy(windowsUnblockCommand, 'unblock')}
                              className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white text-[10px] ml-1 shrink-0 cursor-pointer"
                            >
                              {copiedKey === 'unblock' ? '¡OK!' : 'Copiar'}
                            </button>
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                          <strong className="text-indigo-900 font-bold block mb-1">Solución Gráfica (Explorador):</strong>
                          <ol className="list-decimal list-inside text-[11px] text-slate-600 space-y-1">
                            <li>Clic derecho en <code className="font-mono">Install-PetroilAgent.ps1</code>.</li>
                            <li>Selecciona <strong>Propiedades</strong>.</li>
                            <li>En la pestaña <em>General</em>, abajo, marca la casilla <strong>"Desbloquear" (Unblock)</strong>.</li>
                            <li>Clic en <strong>Aceptar</strong>.</li>
                          </ol>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}

          {/* Architecture details and technical specs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-indigo-600" />
                Métricas Recopiladas por el Agente
              </h4>
              <ul className="space-y-1 text-slate-600 text-[11px] list-disc list-inside">
                <li>Número de Serie de BIOS / Placa Madre (DMI / SMBIOS / IOReg)</li>
                <li>Modelo exacto de CPU, conteo de núcleos y frecuencia</li>
                <li>Memoria RAM instalada y tecnología (DDR4 / DDR5 / Unificada)</li>
                <li>Discos duros, estado S.M.A.R.T. y espacio disponible</li>
                <li>Dirección MAC e IP activa del adaptador de red</li>
                <li>Salud de la batería, ciclos de carga y capacidad actual</li>
                <li>Versión y Build del Sistema Operativo con parches de seguridad</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-emerald-600" />
                Garantías de Seguridad y Rendimiento
              </h4>
              <ul className="space-y-1 text-slate-600 text-[11px] list-disc list-inside">
                <li><strong>Bajo consumo:</strong> Huella de memoria &lt; 35 MB RAM y &lt; 0.2% CPU.</li>
                <li><strong>Cifrado:</strong> Comunicación saliente por HTTPS TLS 1.3 (Puerto 443).</li>
                <li><strong>No invasivo:</strong> No inspecciona documentos ni archivos personales.</li>
                <li><strong>Reinicio automático:</strong> Monitoreado por el gestor de servicios nativo.</li>
                <li><strong>Soporte offline:</strong> Almacena telemetría en buffer local si pierde red.</li>
              </ul>
            </div>

          </div>

          {/* Test / Simulator Box */}
          <div className="p-5 rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/30 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-600" />
                  Simulador de Enrolamiento y Descubrimiento en Vivo
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Pruebe el flujo de telemetría simulando el check-in de una máquina con {selectedPlatform === 'windows' ? 'Windows 10' : selectedPlatform === 'macos' ? 'macOS Sequoia' : 'Ubuntu 25.04'}.
                </p>
              </div>

              <button
                onClick={() => handleSimulatePing(selectedPlatform)}
                disabled={simulationRunning}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors flex items-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${simulationRunning ? 'animate-spin' : ''}`} />
                <span>{simulationRunning ? 'Sondeando máquina...' : 'Simular Check-In de Agente'}</span>
              </button>
            </div>

            {simulatedDevice && (
              <div className="bg-white p-4 rounded-xl border border-indigo-200 shadow-sm space-y-3 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-bold text-xs text-slate-900">
                      Dispositivo Descubierto: {simulatedDevice.hostname}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                    Check-in Exitoso
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div className="p-2 rounded-lg bg-slate-50">
                    <span className="text-slate-400 block text-[10px]">Sistema Operativo:</span>
                    <strong className="text-slate-800">{simulatedDevice.os}</strong>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50">
                    <span className="text-slate-400 block text-[10px]">CPU:</span>
                    <strong className="text-slate-800 truncate block">{simulatedDevice.cpu}</strong>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50">
                    <span className="text-slate-400 block text-[10px]">Memoria RAM:</span>
                    <strong className="text-slate-800">{simulatedDevice.ram}</strong>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50">
                    <span className="text-slate-400 block text-[10px]">Número de Serie:</span>
                    <strong className="text-slate-800 font-mono">{simulatedDevice.serial}</strong>
                  </div>
                </div>

                {canEdit && (
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleRegisterDiscoveredAsset}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm shadow-emerald-200"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Incorporar al Inventario Oficial de Hardware</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Connected Agents Monitor Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-600" />
                Terminales y Agentes Detectados ({connectedAgents.length})
              </h3>
              {serverStatus === 'active' ? (
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Servidor API Escuchando (:3000)
                </span>
              ) : (
                <span className="text-[10px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                  <Radio className="w-3 h-3 text-slate-400" />
                  Receptor Local
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Equipos reportando telemetría de hardware (CPU, RAM, discos, serial, IP) listos para incorporarse al inventario institucional.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              onClick={() => {
                setImportStatusMessage(null);
                setImportJsonText('');
                setShowImportModal(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Cargar Telemetría Manual (.json)</span>
            </button>
          </div>
        </div>

        {/* Informative alert if unlinked agents exist */}
        {connectedAgents.some(a => !a.linkedAssetTag) && (
          <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>¡Terminales listas para enrolar!</strong> Se han detectado equipos con el agente. Haz clic en <strong>"Incorporar a Inventario"</strong> en la fila correspondiente para darlo de alta en el catálogo oficial de hardware.
              </span>
            </div>
          </div>
        )}

        {importStatusMessage && (
          <div className={`p-3 rounded-xl text-xs flex items-center justify-between gap-2 border ${
            importStatusMessage.type === 'success' 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
              : 'bg-red-50 border-red-200 text-red-900'
          }`}>
            <span>{importStatusMessage.text}</span>
            <button 
              onClick={() => setImportStatusMessage(null)}
              className="text-xs font-bold px-1.5 py-0.5 rounded hover:bg-black/5"
            >
              ✕
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Equipo / Hostname</th>
                <th className="py-2.5 px-3">Sistema & Hardware</th>
                <th className="py-2.5 px-3">Almacén / Sede</th>
                <th className="py-2.5 px-3">Colaborador / Custodio</th>
                <th className="py-2.5 px-3">Base de Datos & Red</th>
                <th className="py-2.5 px-3">Estado</th>
                <th className="py-2.5 px-3 text-right">Acción / Inventario</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {connectedAgents.map((ag) => (
                <tr key={ag.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <span className="text-base">
                        {ag.platform === 'windows' ? '🪟' : ag.platform === 'macos' ? '🍎' : '🐧'}
                      </span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <strong className="text-slate-900 font-mono text-xs">{ag.hostname}</strong>
                          {ag.bitlockerStatus && (
                            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                              ag.bitlockerStatus.protectionStatus === 'Protegido'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`} title={`BitLocker: ${ag.bitlockerStatus.protectionStatus}`}>
                              {ag.bitlockerStatus.protectionStatus === 'Protegido' ? '🔒 BitLocker' : '🔓 BitLocker Off'}
                            </span>
                          )}
                        </div>
                        <span className="block text-[10px] text-slate-400 font-mono">
                          SN: {ag.specs.serialNumber || 'N/D'}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-medium text-slate-800 block truncate max-w-[190px]">{ag.osVersion}</span>
                    <span className="text-[10px] text-slate-500 font-mono block truncate max-w-[200px]">
                      {ag.specs.cpu} | {ag.specs.ram}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <div>
                        <span className="font-semibold text-slate-800 block text-xs">
                          {ag.branchName || ag.warehouseName || 'Sede Principal'}
                        </span>
                        <button
                          onClick={() => handleOpenReassign(ag)}
                          className="text-[10px] text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                        >
                          Cambiar Almacén &rarr;
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="space-y-0.5">
                      {ag.employeeName ? (
                        <div>
                          <span className="font-semibold text-slate-900 block text-xs flex items-center gap-1">
                            <User className="w-3 h-3 text-indigo-500" />
                            {ag.employeeName}
                          </span>
                          {ag.employeeEmail && (
                            <span className="text-[10px] text-slate-400 font-mono block truncate max-w-[150px]">
                              {ag.employeeEmail}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-[11px] text-slate-500">
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium text-[10px]">
                            En Almacén
                          </span>
                        </div>
                      )}
                      {ag.loggedOnUser && (
                        <span className="text-[10px] text-indigo-600 font-mono block">
                          Sesión: {ag.loggedOnUser}
                        </span>
                      )}
                      <button
                        onClick={() => handleOpenReassign(ag)}
                        className="text-[10px] text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer block"
                      >
                        {ag.employeeName ? 'Reasignar Colaborador' : '+ Asignar Colaborador'}
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-mono text-[11px] text-slate-700">{ag.ipAddress}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{ag.macAddress}</div>
                    <div className="mt-1 flex items-center gap-1">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 inline-flex items-center gap-1 font-mono">
                        <Database className="w-2.5 h-2.5" />
                        Firestore Realtime
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="space-y-1">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        En Línea
                      </span>
                      <div className="flex items-center gap-1 text-slate-500 text-[10px]">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{ag.lastPing}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5 flex-wrap">
                      <button
                        onClick={() => handleOpenAgentSecurity(ag)}
                        className="px-2 py-1 rounded-lg text-[10px] font-bold text-rose-700 hover:text-white hover:bg-rose-600 bg-rose-50 border border-rose-200 transition-colors flex items-center gap-1 cursor-pointer"
                        title="Control Remoto: Bloqueo BitLocker, Bloqueo de Pantalla y Avisos"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>BitLocker</span>
                      </button>

                      <button
                        onClick={() => handleOpenReassign(ag)}
                        className="px-2 py-1 rounded-lg text-[10px] font-bold text-slate-700 hover:text-white hover:bg-slate-700 bg-slate-100 border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                        title="Vincular Almacén o Colaborador"
                      >
                        <Settings className="w-3 h-3" />
                        <span>Ajustar</span>
                      </button>

                      {ag.linkedAssetTag ? (
                        <div className="flex items-center gap-1">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            <CheckCircle2 className="w-3 h-3 text-indigo-600" />
                            {ag.linkedAssetTag}
                          </span>
                          {onNavigateToInventory && (
                            <button
                              onClick={onNavigateToInventory}
                              className="px-1.5 py-0.5 rounded text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 transition-colors cursor-pointer"
                              title="Ir a Inventario de Hardware"
                            >
                              Ver &rarr;
                            </button>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => incorporateAgentIntoInventory(ag)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] inline-flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                          title="Dar de alta como activo oficial en el inventario de hardware de Google Cloud Firestore"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>Incorporar</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reassign Warehouse / Employee / Asset Tag Modal */}
      {reassignAgentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Asignación de Almacén y Colaborador
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    Terminal: {reassignAgentModal.hostname} ({reassignAgentModal.specs.serialNumber || 'Sin serie'})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setReassignAgentModal(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Google Cloud info */}
              <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 flex items-center gap-2 font-mono text-[11px]">
                <Database className="w-4 h-4 text-blue-600 shrink-0" />
                <div>
                  <span>Sincronizando con Google Cloud Firestore</span>
                  <div className="text-[10px] text-blue-700 truncate">
                    BD: ai-studio-sistemadeinventa-0e46c147-3f92-4470-b2fa-9d23678b1f3e
                  </div>
                </div>
              </div>

              {/* Warehouse selector */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Almacén / Sede de Radicación:</span>
                </label>
                <select
                  value={reassignBranchId}
                  onChange={(e) => setReassignBranchId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-indigo-500 outline-hidden"
                >
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.city}){b.isMainWarehouse ? ' ★ Almacén Principal' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Employee selector */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Colaborador Custodio Asignado:</span>
                </label>
                <select
                  value={reassignEmployeeId}
                  onChange={(e) => setReassignEmployeeId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-indigo-500 outline-hidden"
                >
                  <option value="">-- Sin asignar (Stock disponible en Almacén) --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName} - {emp.position} ({emp.department})
                    </option>
                  ))}
                </select>
              </div>

              {/* Asset Tag */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1 flex items-center gap-1.5">
                  <Boxes className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Placa de Inventario Vinculada:</span>
                </label>
                <input
                  type="text"
                  value={reassignAssetTag}
                  onChange={(e) => setReassignAssetTag(e.target.value)}
                  placeholder="Ej: EQ-LAP-001 o dejar en blanco"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-sm tracking-tight text-slate-900 bg-white focus:ring-2 focus:ring-[#ff8200]/25 focus:border-[#ff8200] outline-hidden uppercase caret-[#ff8200]"
                />
              </div>

              {reassignAgentModal.loggedOnUser && (
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
                  <span className="text-[10px] text-slate-400 block">Usuario detectado en sesión Windows:</span>
                  <strong className="font-mono text-slate-900">{reassignAgentModal.loggedOnUser}</strong>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setReassignAgentModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                disabled={assignLoading}
                onClick={handleSaveReassignment}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                {assignLoading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>Guardar Cambios</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual JSON Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Cargar Telemetría del Agente (.json)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Importa el diagnóstico generado en la máquina Windows, macOS o Linux.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowImportModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {/* File upload drag drop zone */}
              <div className="p-4 rounded-xl border-2 border-dashed border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-indigo-50/30 text-center space-y-2 transition-colors">
                <FolderOpen className="w-8 h-8 text-indigo-500 mx-auto" />
                <div className="text-xs text-slate-700">
                  <label className="font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer underline">
                    Selecciona el archivo .JSON
                    <input
                      type="file"
                      accept=".json"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            const content = ev.target?.result as string;
                            if (content) {
                              setImportJsonText(content);
                            }
                          };
                          reader.readAsText(file);
                        }
                      }}
                    />
                  </label>
                  <span> o arrástralo aquí</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Ubicación habitual en Windows 11: <br />
                  <code className="font-mono text-slate-600 font-semibold">Escritorio\Petroil-Auditoria-Equipo.json</code> o <code className="font-mono text-slate-600 font-semibold">C:\ProgramData\Petroil\ITAssetAgent\telemetry.json</code>
                </p>
              </div>

              {/* Or paste JSON text */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  O pega el contenido JSON directamente:
                </label>
                <textarea
                  rows={5}
                  value={importJsonText}
                  onChange={(e) => setImportJsonText(e.target.value)}
                  placeholder='{"hostname": "PETROIL-W11-PC", "serialNumber": "SN-...", "os": "Windows 11...", "cpu": "...", "ram": "16 GB"}'
                  className="w-full text-[13px] font-mono leading-relaxed p-3.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#ff8200]/25 focus:border-[#ff8200] outline-hidden bg-slate-50 focus:bg-white text-slate-900 caret-[#ff8200]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                disabled={!importJsonText.trim()}
                onClick={() => handleManualJsonUpload(importJsonText)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <FileCheck className="w-3.5 h-3.5" />
                <span>Procesar e Importar Equipo</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating toast when asset is incorporated into inventory */}
      {incorporatedToast && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-slate-900 text-white shadow-2xl border border-slate-700 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <strong className="block text-sm font-bold text-white">¡Equipo Incorporado al Inventario!</strong>
            <p className="text-xs text-slate-300">
              {incorporatedToast.hostname} registrado con placa <span className="font-mono text-emerald-400 font-bold">{incorporatedToast.tag}</span>.
            </p>
          </div>
          {onNavigateToInventory && (
            <button
              onClick={onNavigateToInventory}
              className="ml-2 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer transition-colors"
            >
              Ir a Inventario &rarr;
            </button>
          )}
        </div>
      )}

      {/* Remote Security & BitLocker Modal */}
      {securityModalTarget && (
        <RemoteSecurityModal
          asset={securityModalTarget.asset}
          agentHostname={securityModalTarget.agentHostname}
          agentId={securityModalTarget.agentId}
          onClose={() => setSecurityModalTarget(null)}
        />
      )}

    </div>
  );
};
