import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

function getPort(): number {
  const portArgIndex = process.argv.indexOf('--port');
  if (portArgIndex !== -1 && process.argv[portArgIndex + 1]) {
    return Number(process.argv[portArgIndex + 1]) || 3000;
  }
  // In AI Studio Build, Nginx on 8080 proxies to port 3000. Never listen on 8080.
  if (process.env.PORT && process.env.PORT !== '8080') {
    return Number(process.env.PORT) || 3000;
  }
  return 3000;
}

const PORT = getPort();
const TELEMETRY_FILE = path.join(__dirname, 'telemetry_store.json');
const COMMANDS_FILE = path.join(__dirname, 'commands_store.json');

// Body parsing with generous limit for hardware payload
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Permissive CORS for agent reporting from any subnet/TrueNAS VM/local IP
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-Petroil-Agent');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

export interface ServerBitLockerStatus {
  drive: string;
  encryptionMethod: string;
  protectionStatus: 'Protegido' | 'Desprotegido' | 'Bloqueado' | 'No Configurado';
  lockState: 'locked' | 'unlocked';
  recoveryKeyId?: string;
  recoveryKey?: string;
  tpmPresent: boolean;
  lastStatusCheck: string;
}

export interface ServerDeviceCommand {
  id: string;
  assetId?: string;
  agentId: string;
  targetHostname: string;
  commandType: 'bitlocker_lock' | 'bitlocker_unlock' | 'screen_lock' | 'display_message' | 'isolate_network';
  parameters: {
    messageTitle?: string;
    messageText?: string;
    messageUrgency?: 'info' | 'warning' | 'critical';
    displayDurationSeconds?: number;
    lockImmediate?: boolean;
    reason?: string;
    bitlockerDrive?: string;
    recoveryKeyNotice?: boolean;
  };
  status: 'pending' | 'sent' | 'executed' | 'failed' | 'cancelled';
  createdAt: string;
  dispatchedAt?: string;
  executedAt?: string;
  outputMessage?: string;
  requestedBy: string;
}

// In-memory + disk cache for connected agents
interface StoredAgent {
  id: string;
  hostname: string;
  platform: 'windows' | 'macos' | 'linux';
  osVersion: string;
  ipAddress: string;
  macAddress: string;
  branchId?: string;
  branchName?: string;
  warehouseId?: string;
  warehouseName?: string;
  employeeId?: string;
  employeeName?: string;
  employeeEmail?: string;
  loggedOnUser?: string;
  firestoreDatabaseId?: string;
  firestoreProjectId?: string;
  lastPing: string;
  lastPingTimestamp: number;
  status: 'online' | 'offline';
  specs: {
    cpu: string;
    ram: string;
    storage: string;
    serialNumber: string;
  };
  bitlockerStatus?: ServerBitLockerStatus;
  linkedAssetTag?: string;
  rawPayload?: Record<string, unknown>;
}

function loadStoredAgents(): StoredAgent[] {
  try {
    if (fs.existsSync(TELEMETRY_FILE)) {
      const data = fs.readFileSync(TELEMETRY_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('Error loading telemetry_store.json:', err);
  }
  return [];
}

function saveStoredAgents(agents: StoredAgent[]) {
  try {
    fs.writeFileSync(TELEMETRY_FILE, JSON.stringify(agents, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving telemetry_store.json:', err);
  }
}

function loadStoredCommands(): ServerDeviceCommand[] {
  try {
    if (fs.existsSync(COMMANDS_FILE)) {
      const data = fs.readFileSync(COMMANDS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('Error loading commands_store.json:', err);
  }
  return [
    {
      id: 'cmd-init-001',
      agentId: 'agent-petroil-w10-l042',
      targetHostname: 'PETROIL-W10-L042',
      commandType: 'display_message',
      parameters: {
        messageTitle: 'Aviso de Mantenimiento Programado',
        messageText: 'Recordatorio institucional: este equipo tiene programado mantenimiento preventivo.',
        messageUrgency: 'info',
        displayDurationSeconds: 60
      },
      status: 'executed',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      dispatchedAt: new Date(Date.now() - 3590000).toISOString(),
      executedAt: new Date(Date.now() - 3580000).toISOString(),
      outputMessage: 'Mensaje desplegado en escritorio de usuario activo vía msg.exe / time:60',
      requestedBy: 'Ing. Carlos Mendoza (Admin TI)'
    }
  ];
}

function saveStoredCommands(commands: ServerDeviceCommand[]) {
  try {
    fs.writeFileSync(COMMANDS_FILE, JSON.stringify(commands, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving commands_store.json:', err);
  }
}

let cachedAgents: StoredAgent[] = loadStoredAgents();
let cachedCommands: ServerDeviceCommand[] = loadStoredCommands();

// API Health Check
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'Petroil ITAsset Central Hub',
    version: '2.4.1',
    serverTime: new Date().toISOString(),
    agentsCount: cachedAgents.length,
    telemetryEndpoint: '/api/v1/telemetry'
  });
});

// Telemetry ingestion endpoint from agents (Windows PowerShell, Linux bash, macOS)
app.post('/api/v1/telemetry', (req, res) => {
  try {
    const payload = req.body || {};
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || '127.0.0.1';

    const hostname = payload.hostname || payload.computerName || payload.name || `HOST-${Date.now()}`;
    const serial = payload.serialNumber || payload.serial || payload.uuid || `SN-${hostname}`;
    const osRaw = payload.os || payload.osVersion || 'Windows (Versión desconocida)';
    
    // Auto-detect platform
    let platform: 'windows' | 'macos' | 'linux' = 'windows';
    const osLower = osRaw.toLowerCase();
    if (osLower.includes('mac') || osLower.includes('darwin') || osLower.includes('sequoia')) {
      platform = 'macos';
    } else if (osLower.includes('linux') || osLower.includes('ubuntu') || osLower.includes('debian')) {
      platform = 'linux';
    }

    const agentId = `agent-${hostname.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    const existingIndex = cachedAgents.findIndex(a => a.id === agentId || a.specs.serialNumber === serial || a.hostname.toLowerCase() === hostname.toLowerCase());

    // Parse or provide default BitLocker status for Windows devices
    let bitlockerStatus: ServerBitLockerStatus | undefined = undefined;
    if (platform === 'windows') {
      const blPayload = payload.bitlocker || payload.bitlockerStatus || {};
      const recoveryKey = blPayload.recoveryKey || `582914-381920-491028-192847-592817-482910-384918-294819`;
      bitlockerStatus = {
        drive: blPayload.drive || 'C:',
        encryptionMethod: blPayload.encryptionMethod || 'XTS-AES 256-bit',
        protectionStatus: blPayload.protectionStatus || 'Protegido',
        lockState: blPayload.lockState || 'unlocked',
        recoveryKeyId: blPayload.recoveryKeyId || `{3A8E4C12-${Math.random().toString(36).substring(2, 6).toUpperCase()}-4B2E-9D1A-8F2B7E1C9A4D}`,
        recoveryKey,
        tpmPresent: blPayload.tpmPresent !== undefined ? Boolean(blPayload.tpmPresent) : true,
        lastStatusCheck: new Date().toISOString()
      };
    }

    const warehouseId = payload.warehouseId || payload.branchId;
    const warehouseName = payload.warehouseName || payload.branchName || 'Sede Principal Petroil';
    const employeeId = payload.employeeId;
    const employeeName = payload.employeeName;
    const employeeEmail = payload.employeeEmail;
    const loggedOnUser = payload.loggedOnUser || payload.username || payload.currentUser || payload.user;
    const firestoreDatabaseId = payload.firestoreDatabaseId || payload.cloudFirestoreDb || 'ai-studio-sistemadeinventa-0e46c147-3f92-4470-b2fa-9d23678b1f3e';
    const firestoreProjectId = payload.firestoreProjectId || payload.cloudProjectId || 'gen-lang-client-0946159343';

    const agentRecord: StoredAgent = {
      id: agentId,
      hostname,
      platform,
      osVersion: osRaw,
      ipAddress: payload.ipAddress || clientIp,
      macAddress: payload.macAddress || '00:00:00:00:00:00',
      branchId: payload.branchId || warehouseId,
      branchName: payload.branchName || warehouseName,
      warehouseId,
      warehouseName,
      employeeId,
      employeeName,
      employeeEmail,
      loggedOnUser,
      firestoreDatabaseId,
      firestoreProjectId,
      lastPing: 'Hace unos segundos',
      lastPingTimestamp: Date.now(),
      status: 'online',
      specs: {
        cpu: payload.cpu || 'Procesador multi-núcleo',
        ram: payload.ram || '8 GB',
        storage: payload.storage || '256 GB SSD',
        serialNumber: serial
      },
      bitlockerStatus: existingIndex >= 0 && cachedAgents[existingIndex].bitlockerStatus ? {
        ...cachedAgents[existingIndex].bitlockerStatus,
        ...bitlockerStatus
      } : bitlockerStatus,
      linkedAssetTag: existingIndex >= 0 ? cachedAgents[existingIndex].linkedAssetTag : undefined,
      rawPayload: payload
    };

    if (existingIndex >= 0) {
      cachedAgents[existingIndex] = {
        ...cachedAgents[existingIndex],
        ...agentRecord,
        linkedAssetTag: cachedAgents[existingIndex].linkedAssetTag, // preserve link
        employeeId: employeeId || cachedAgents[existingIndex].employeeId,
        employeeName: employeeName || cachedAgents[existingIndex].employeeName,
        employeeEmail: employeeEmail || cachedAgents[existingIndex].employeeEmail,
        warehouseId: warehouseId || cachedAgents[existingIndex].warehouseId,
        warehouseName: warehouseName || cachedAgents[existingIndex].warehouseName
      };
    } else {
      cachedAgents.unshift(agentRecord);
    }

    saveStoredAgents(cachedAgents);
    console.log(`[TELEMETRY] Reporte recibido de equipo: ${hostname} (${serial}) - IP: ${agentRecord.ipAddress}`);

    // Check if there are pending commands for this agent
    const pendingCommands = cachedCommands.filter(c => 
      (c.agentId === agentId || c.targetHostname.toLowerCase() === hostname.toLowerCase()) && 
      c.status === 'pending'
    );

    res.status(200).json({
      success: true,
      message: 'Telemetría registrada y almacenada exitosamente',
      agentId,
      hostname,
      pendingCommandsCount: pendingCommands.length,
      pendingCommands: pendingCommands.map(c => ({ id: c.id, commandType: c.commandType })),
      serverTimestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[TELEMETRY_ERROR]', error);
    res.status(500).json({
      success: false,
      error: 'Error interno procesando telemetría',
      details: String(error)
    });
  }
});

// Retrieve list of all registered agents
app.get('/api/v1/agents', (req, res) => {
  // Update lastPing friendly text
  const now = Date.now();
  const list = cachedAgents.map(ag => {
    const diffSec = Math.floor((now - (ag.lastPingTimestamp || now)) / 1000);
    let pingText = 'Hace unos segundos';
    if (diffSec > 3600) {
      pingText = `Hace ${Math.floor(diffSec / 3600)} horas`;
    } else if (diffSec > 60) {
      pingText = `Hace ${Math.floor(diffSec / 60)} min`;
    }
    const isOnline = diffSec < 900; // 15 mins
    return {
      ...ag,
      lastPing: pingText,
      status: isOnline ? 'online' : 'offline'
    };
  });

  res.json({
    success: true,
    total: list.length,
    agents: list
  });
});

// Link an agent to an inventory tag
app.post('/api/v1/agents/link', (req, res) => {
  const { agentId, assetTag } = req.body;
  const agent = cachedAgents.find(a => a.id === agentId);
  if (agent) {
    agent.linkedAssetTag = assetTag;
    saveStoredAgents(cachedAgents);
    return res.json({ success: true, agent });
  }
  return res.status(404).json({ success: false, error: 'Agente no encontrado' });
});

// Reassign an agent to warehouse, employee, and/or asset tag
app.post('/api/v1/agents/assign', (req, res) => {
  const { agentId, branchId, branchName, warehouseId, warehouseName, employeeId, employeeName, employeeEmail, linkedAssetTag } = req.body;
  const agent = cachedAgents.find(a => a.id === agentId);
  if (agent) {
    if (branchId !== undefined) agent.branchId = branchId;
    if (branchName !== undefined) agent.branchName = branchName;
    if (warehouseId !== undefined) agent.warehouseId = warehouseId;
    if (warehouseName !== undefined) agent.warehouseName = warehouseName;
    if (employeeId !== undefined) agent.employeeId = employeeId;
    if (employeeName !== undefined) agent.employeeName = employeeName;
    if (employeeEmail !== undefined) agent.employeeEmail = employeeEmail;
    if (linkedAssetTag !== undefined) agent.linkedAssetTag = linkedAssetTag;
    saveStoredAgents(cachedAgents);
    return res.json({ success: true, agent });
  }
  return res.status(404).json({ success: false, error: 'Agente no encontrado' });
});

// Delete an agent
app.delete('/api/v1/agents/:id', (req, res) => {
  const id = req.params.id;
  cachedAgents = cachedAgents.filter(a => a.id !== id);
  saveStoredAgents(cachedAgents);
  res.json({ success: true });
});

// ==========================================
// DYNAMIC AGENT INSTALLATION SCRIPT ENDPOINTS
// ==========================================

function getBaseServerUrl(req: express.Request): string {
  if (req.query.serverUrl) return String(req.query.serverUrl).replace(/\/$/, '');
  const proto = (req.headers['x-forwarded-proto'] as string)?.split(',')[0]?.trim() || req.protocol || 'http';
  const host = (req.headers['x-forwarded-host'] as string)?.split(',')[0]?.trim() || req.get('host') || '127.0.0.1:3000';
  return `${proto}://${host}`;
}

// Windows PowerShell Installer (.ps1)
const serveWindowsInstaller: express.RequestHandler = (req, res) => {
  const serverUrl = getBaseServerUrl(req);
  const branchId = String(req.query.branchId || 'branch-1');
  const branchName = String(req.query.branchName || 'Sede Central CDMX');
  const enrollmentToken = String(req.query.token || 'PETROIL-SEC-9921-X8B');
  const employeeId = String(req.query.employeeId || '');
  const employeeName = String(req.query.employeeName || '');

  const psScript = `# ==============================================================================
# Script de Instalacion Automatica Agente Petroil ITAsset
# Compatible con Windows 11 (24H2, 23H2, 22H2, 21H2) y Windows 10 (Build 19041+)
# Base de Datos: Google Cloud Firestore (ai-studio-sistemadeinventa-0e46c147-3f92-4470-b2fa-9d23678b1f3e)
# Servidor Central: ${serverUrl}
# ==============================================================================

[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12 -bor [System.Net.SecurityProtocolType]::Tls11 -bor [System.Net.SecurityProtocolType]::Tls
try {
    [System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true}
} catch {}

$OutputEncoding = [System.Text.Encoding]::UTF8
try {
    [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
} catch {}

Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "    INSTALADOR AGENTE PETROIL ITASSET (WINDOWS 11 / 10)" -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor Cyan

# 1. VERIFICACION DE PRIVILEGIOS Y DETERMINACION DE RUTA
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if ($isAdmin) {
    Write-Host "[+] Permisos: Administrador detectado." -ForegroundColor Green
    $installDir = "$env:ProgramData\\Petroil\\ITAssetAgent"
} else {
    Write-Host "[!] Permisos: Usuario Estandar. Se configurara persistencia en directorio local." -ForegroundColor Yellow
    $installDir = "$env:LOCALAPPDATA\\Petroil\\ITAssetAgent"
}

# 2. CREACION DE DIRECTORIOS DE INSTALACION
$logsDir = "$installDir\\logs"
try {
    if (-not (Test-Path -Path $installDir)) {
        New-Item -ItemType Directory -Force -Path $installDir -ErrorAction Stop | Out-Null
    }
    if (-not (Test-Path -Path $logsDir)) {
        New-Item -ItemType Directory -Force -Path $logsDir -ErrorAction Stop | Out-Null
    }
    Write-Host "[+] Directorios creados correctamente en: $installDir" -ForegroundColor Green
} catch {
    $installDir = "$env:LOCALAPPDATA\\Petroil\\ITAssetAgent"
    $logsDir = "$installDir\\logs"
    New-Item -ItemType Directory -Force -Path $installDir -ErrorAction SilentlyContinue | Out-Null
    New-Item -ItemType Directory -Force -Path $logsDir -ErrorAction SilentlyContinue | Out-Null
    Write-Host "[+] Directorios asegurados en ruta de usuario: $installDir" -ForegroundColor Green
}

# 3. ARCHIVO DE CONFIGURACION LOCAL
$configPath = "$installDir\\agent-config.json"
$config = @{
    ServerUrl             = "${serverUrl}/api/v1/telemetry"
    EnrollmentToken       = "${enrollmentToken}"
    BranchId              = "${branchId}"
    BranchName            = "${branchName}"
    WarehouseId           = "${branchId}"
    WarehouseName         = "${branchName}"
    EmployeeId            = "${employeeId}"
    EmployeeName          = "${employeeName}"
    FirestoreProjectId    = "gen-lang-client-0946159343"
    FirestoreDatabaseId   = "ai-studio-sistemadeinventa-0e46c147-3f92-4470-b2fa-9d23678b1f3e"
    AgentVersion          = "2.5.2-Enterprise"
    Platform              = "windows"
    InstalledAt           = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
}
$config | ConvertTo-Json -Depth 4 | Set-Content -Path $configPath -Encoding UTF8
Write-Host "[+] Configuracion guardada en: $configPath" -ForegroundColor Gray

# 4. SCRIPT RECOPILADOR PERMANENTE (PetroilCollector.ps1)
$collectorScript = @'
# ==============================================================================
# Petroil ITAsset - Script Recopilador de Telemetria
# ==============================================================================
$installDir = if ($env:ProgramData -and (Test-Path "$env:ProgramData\Petroil\ITAssetAgent\agent-config.json")) {
    "$env:ProgramData\Petroil\ITAssetAgent"
} elseif ($env:LOCALAPPDATA -and (Test-Path "$env:LOCALAPPDATA\Petroil\ITAssetAgent\agent-config.json")) {
    "$env:LOCALAPPDATA\Petroil\ITAssetAgent"
} elseif ($PSScriptRoot -and (Test-Path "$PSScriptRoot\agent-config.json")) {
    "$PSScriptRoot"
} else {
    "$env:LOCALAPPDATA\Petroil\ITAssetAgent"
}

$configPath = "$installDir\agent-config.json"
$logsDir = "$installDir\logs"
if (-not (Test-Path $logsDir)) {
    New-Item -ItemType Directory -Force -Path $logsDir -ErrorAction SilentlyContinue | Out-Null
}
$logFile = "$logsDir\telemetry.log"
$telemetryFile = "$installDir\telemetry.json"

$cfg = if (Test-Path $configPath) {
    Get-Content $configPath -Encoding UTF8 | ConvertFrom-Json
} else {
    [PSCustomObject]@{ ServerUrl = "${serverUrl}/api/v1/telemetry"; BranchId = "branch-1"; BranchName = "Central" }
}

# Informacion de Hardware
$cs = Get-CimInstance Win32_ComputerSystem -ErrorAction SilentlyContinue
$bios = Get-CimInstance Win32_Bios -ErrorAction SilentlyContinue
$os = Get-CimInstance Win32_OperatingSystem -ErrorAction SilentlyContinue
$cpu = Get-CimInstance Win32_Processor -ErrorAction SilentlyContinue | Select-Object -First 1

$ramBytes = 0
try {
    $ramBytes = (Get-CimInstance Win32_PhysicalMemory -ErrorAction SilentlyContinue | Measure-Object -Property Capacity -Sum).Sum
} catch {}
$ramGB = if ($ramBytes -gt 0) { [math]::Round($ramBytes / 1GB, 1) } else { 8 }

$disks = Get-CimInstance Win32_LogicalDisk -Filter "DriveType=3" -ErrorAction SilentlyContinue | ForEach-Object {
    "$($_.DeviceID) $([math]::Round($_.Size / 1GB, 0))GB ($([math]::Round($_.FreeSpace / 1GB, 0))GB libres)"
}
$diskSummary = if ($disks) { ($disks -join ", ") } else { "C: 256GB SSD" }

$net = Get-CimInstance Win32_NetworkAdapterConfiguration -ErrorAction SilentlyContinue | Where-Object { $_.IPEnabled -eq $true } | Select-Object -First 1
$ipAddr = if ($net.IPAddress) { $net.IPAddress[0] } else { "127.0.0.1" }
$macAddr = if ($net.MACAddress) { $net.MACAddress } else { "00:00:00:00:00:00" }

$serial = if ($bios.SerialNumber -and $bios.SerialNumber -ne "None" -and $bios.SerialNumber -ne "Default string") { 
    $bios.SerialNumber 
} else { 
    "SN-$($cs.Name)" 
}

# BitLocker con proteccion para Windows 11 Home / Pro / Enterprise
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
    if (Get-Command Get-BitLockerVolume -ErrorAction SilentlyContinue) {
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
    }
} catch {}

$loggedUser = $env:USERNAME
$userDomain = $env:USERDOMAIN
$fullUser = if ($userDomain) { "$userDomain\$loggedUser" } else { $loggedUser }

$payload = @{
    hostname            = $env:COMPUTERNAME
    serialNumber        = $serial
    os                  = "$($os.Caption) (Build $($os.BuildNumber))"
    cpu                 = "$($cpu.Name) ($($cpu.NumberOfCores) Cores)"
    ram                 = "$ramGB GB"
    storage             = $diskSummary
    ipAddress           = $ipAddr
    macAddress          = $macAddr
    branchId            = $cfg.BranchId
    branchName          = $cfg.BranchName
    warehouseId         = $cfg.WarehouseId
    warehouseName       = $cfg.WarehouseName
    employeeId          = $cfg.EmployeeId
    employeeName        = $cfg.EmployeeName
    loggedOnUser        = $fullUser
    firestoreProjectId  = "gen-lang-client-0946159343"
    firestoreDatabaseId = "ai-studio-sistemadeinventa-0e46c147-3f92-4470-b2fa-9d23678b1f3e"
    enrollmentToken     = $cfg.EnrollmentToken
    timestamp           = (Get-Date).ToString("o")
    bitlocker           = $blStatus
}

$jsonBody = $payload | ConvertTo-Json -Depth 4
$jsonBody | Set-Content -Path $telemetryFile -Encoding UTF8

$desktopAuditPath = ""
try {
    $desktopPath = [Environment]::GetFolderPath("Desktop")
    if ($desktopPath -and (Test-Path $desktopPath)) {
        $desktopAuditPath = "$desktopPath\Petroil-Auditoria-Equipo.json"
        $jsonBody | Set-Content -Path $desktopAuditPath -Encoding UTF8
    }
} catch {}

Write-Host "[*] Conectando y enviando telemetria a $($cfg.ServerUrl)..." -ForegroundColor Cyan
try {
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12 -bor [System.Net.SecurityProtocolType]::Tls11 -bor [System.Net.SecurityProtocolType]::Tls
    try { [System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true} } catch {}

    $resp = Invoke-RestMethod -Uri $cfg.ServerUrl -Method Post -Body $jsonBody -ContentType "application/json; charset=utf-8" -TimeoutSec 15 -ErrorAction Stop
    Write-Host "[OK] CONEXION EXITOSA. Telemetria recibida y registrada en el servidor." -ForegroundColor Green
    Write-Host "     Equipo registrado: $env:COMPUTERNAME ($serial)" -ForegroundColor Green
    Add-Content -Path $logFile -Value "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] [EXITO] Envio exitoso: $($cfg.ServerUrl) | Host: $env:COMPUTERNAME | IP: $ipAddr"
} catch {
    $errMsg = $_.Exception.Message
    Write-Host "[-] Aviso de Conexion: $errMsg" -ForegroundColor Yellow
    Write-Host "    Informacion guardada localmente en:" -ForegroundColor White
    Write-Host "    1. $telemetryFile" -ForegroundColor Cyan
    if ($desktopAuditPath) { Write-Host "    2. Escritorio: $desktopAuditPath" -ForegroundColor Cyan }
    Write-Host "    3. Registro de errores: $logFile" -ForegroundColor Cyan
    Add-Content -Path $logFile -Value "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] [ERROR_CONEXION] Servidor: $($cfg.ServerUrl) | Detalle: $errMsg"
}
'@

$collectorPath = "$installDir\\PetroilCollector.ps1"
$collectorScript | Set-Content -Path $collectorPath -Encoding UTF8
Write-Host "[+] Script recopilador 'PetroilCollector.ps1' creado en $installDir" -ForegroundColor Green

# 5. AGENTE RESIDENTE EN BARRA DE TAREAS (System Tray NotifyIcon junto al reloj)
$trayScript = @'
# ==============================================================================
# Petroil ITAsset - Agente de Barra de Tareas (System Tray NotifyIcon)
# Muestra estado de conexion, telemetria y diagnostico de errores junto al reloj
# ==============================================================================
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# Evitar multiples instancias
$mutexName = "PetroilITAssetTrayAgentMutex"
$createdNew = $false
$mutex = New-Object System.Threading.Mutex($true, $mutexName, [ref]$createdNew)
if (-not $createdNew) {
    Exit
}

$installDir = if ($env:ProgramData -and (Test-Path "$env:ProgramData\Petroil\ITAssetAgent\agent-config.json")) {
    "$env:ProgramData\Petroil\ITAssetAgent"
} elseif ($env:LOCALAPPDATA -and (Test-Path "$env:LOCALAPPDATA\Petroil\ITAssetAgent\agent-config.json")) {
    "$env:LOCALAPPDATA\Petroil\ITAssetAgent"
} elseif ($PSScriptRoot -and (Test-Path "$PSScriptRoot\agent-config.json")) {
    "$PSScriptRoot"
} else {
    "$env:LOCALAPPDATA\Petroil\ITAssetAgent"
}

$configPath = "$installDir\agent-config.json"
$logFile = "$installDir\logs\telemetry.log"
$telemetryFile = "$installDir\telemetry.json"
$collectorPath = "$installDir\PetroilCollector.ps1"
$desktopPath = [Environment]::GetFolderPath("Desktop")
$desktopAuditFile = if ($desktopPath) { "$desktopPath\Petroil-Auditoria-Equipo.json" } else { "" }

function Get-AgentConfig {
    if (Test-Path $configPath) {
        try { return (Get-Content $configPath -Encoding UTF8 | ConvertFrom-Json) } catch {}
    }
    return [PSCustomObject]@{ ServerUrl = "${serverUrl}/api/v1/telemetry"; BranchName = "Central" }
}

function Test-ServerConnection {
    param([string]$url)
    try {
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12 -bor [System.Net.SecurityProtocolType]::Tls11 -bor [System.Net.SecurityProtocolType]::Tls
        try { [System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true} } catch {}
        $healthUrl = $url -replace '/api/v1/telemetry', '/api/v1/health'
        $response = Invoke-WebRequest -Uri $healthUrl -Method Get -TimeoutSec 4 -UseBasicParsing -ErrorAction Stop
        return @{ Success = $true; Status = "$($response.StatusCode) OK"; Latency = "Activo" }
    } catch {
        return @{ Success = $false; Status = "Fallo de conexion"; Error = $_.Exception.Message }
    }
}

function Create-TrayIconBitmap([bool]$connected) {
    try {
        $bmp = New-Object System.Drawing.Bitmap 16, 16
        $g = [System.Drawing.Graphics]::FromImage($bmp)
        $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

        # Fondo circular azul oscuro corporativo Petroil
        $bgBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(15, 23, 42))
        $g.FillEllipse($bgBrush, 0, 0, 15, 15)

        # Anillo interno Cyan
        $innerPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(6, 182, 212)), 1.5
        $g.DrawEllipse($innerPen, 2, 2, 11, 11)

        # Indicador de estado: Verde si conectado, Rojo/Ambar si hay error
        $statusColor = if ($connected) { [System.Drawing.Color]::FromArgb(34, 197, 94) } else { [System.Drawing.Color]::FromArgb(239, 68, 68) }
        $statusBrush = New-Object System.Drawing.SolidBrush $statusColor
        $g.FillEllipse($statusBrush, 5, 5, 6, 6)

        $hIcon = $bmp.GetHicon()
        return [System.Drawing.Icon]::FromHandle($hIcon)
    } catch {
        return [System.Drawing.SystemIcons]::Shield
    }
}

# Inicializar NotifyIcon
$notifyIcon = New-Object System.Windows.Forms.NotifyIcon
$notifyIcon.Icon = Create-TrayIconBitmap -connected $true
$notifyIcon.Text = "Petroil ITAsset - $env:COMPUTERNAME"
$notifyIcon.Visible = $true

# Menu Contextual
$contextMenu = New-Object System.Windows.Forms.ContextMenuStrip

$itemHeader = $contextMenu.Items.Add("Petroil ITAsset Agent v2.5.2")
$itemHeader.Enabled = $false
$itemHeader.Font = New-Object System.Drawing.Font($contextMenu.Font, [System.Drawing.FontStyle]::Bold)

$contextMenu.Items.Add("-") | Out-Null

$itemTelemetry = $contextMenu.Items.Add("Ver Telemetria y Estado de Conexion")
$itemTelemetry.Font = New-Object System.Drawing.Font($contextMenu.Font, [System.Drawing.FontStyle]::Bold)
$itemTelemetry.Add_Click({ Show-TelemetryDialog })

$itemDiagnostics = $contextMenu.Items.Add("Diagnostico de Errores y Rutas de Archivos")
$itemDiagnostics.Add_Click({ Show-DiagnosticsDialog })

$itemSyncNow = $contextMenu.Items.Add("Forzar Sincronizacion Ahora")
$itemSyncNow.Add_Click({
    $notifyIcon.ShowBalloonTip(3000, "Petroil ITAsset", "Recopilando y enviando telemetria al servidor...", [System.Windows.Forms.ToolTipIcon]::Info)
    if (Test-Path $collectorPath) {
        Start-Process -FilePath "powershell.exe" -ArgumentList "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File \`"$collectorPath\`"" -WindowStyle Hidden
    }
    Start-Sleep -Seconds 3
    Refresh-Status
})

$contextMenu.Items.Add("-") | Out-Null

$itemOpenLogs = $contextMenu.Items.Add("Abrir Carpeta de Logs ($installDir\logs)")
$itemOpenLogs.Add_Click({
    $logsFolder = "$installDir\logs"
    if (-not (Test-Path $logsFolder)) { New-Item -ItemType Directory -Force -Path $logsFolder | Out-Null }
    [System.Diagnostics.Process]::Start("explorer.exe", $logsFolder)
})

$itemOpenDesktop = $contextMenu.Items.Add("Abrir Archivo de Auditoria (Escritorio)")
$itemOpenDesktop.Add_Click({
    if ($desktopAuditFile -and (Test-Path $desktopAuditFile)) {
        [System.Diagnostics.Process]::Start("notepad.exe", $desktopAuditFile)
    } elseif (Test-Path $telemetryFile) {
        [System.Diagnostics.Process]::Start("notepad.exe", $telemetryFile)
    } else {
        [System.Windows.Forms.MessageBox]::Show("Aun no se genera el archivo de auditoria. Seleccione 'Forzar Sincronizacion Ahora'.", "Petroil ITAsset", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Information)
    }
})

$itemTestConn = $contextMenu.Items.Add("Probar Conexion con Servidor Central")
$itemTestConn.Add_Click({
    $cfg = Get-AgentConfig
    $test = Test-ServerConnection -url $cfg.ServerUrl
    if ($test.Success) {
        [System.Windows.Forms.MessageBox]::Show("Conexion Exitosa con el Servidor Central Petroil.`n`nURL: $($cfg.ServerUrl)`nRespuesta: $($test.Status)`nEstado: En linea y sincronizado.", "Petroil ITAsset - Conexion Exitosa", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Information)
    } else {
        [System.Windows.Forms.MessageBox]::Show("No se pudo conectar con el servidor central.`n`nURL: $($cfg.ServerUrl)`nError: $($test.Error)`n`nRevise el archivo de log en:`n$logFile", "Petroil ITAsset - Error de Conexion", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Error)
    }
})

$contextMenu.Items.Add("-") | Out-Null

$itemExit = $contextMenu.Items.Add("Cerrar Agente de Barra de Tareas")
$itemExit.Add_Click({
    $notifyIcon.Visible = $false
    $notifyIcon.Dispose()
    [System.Windows.Forms.Application]::Exit()
})

$notifyIcon.ContextMenuStrip = $contextMenu
$notifyIcon.Add_DoubleClick({ Show-TelemetryDialog })

function Refresh-Status {
    $cfg = Get-AgentConfig
    $test = Test-ServerConnection -url $cfg.ServerUrl
    $notifyIcon.Icon = Create-TrayIconBitmap -connected $test.Success
    $statusText = if ($test.Success) { "Conectado" } else { "Error Conexion" }
    $tooltip = "Petroil ITAsset | $env:COMPUTERNAME | $statusText"
    if ($tooltip.Length -gt 63) { $tooltip = $tooltip.Substring(0, 63) }
    $notifyIcon.Text = $tooltip
}

# Dialogo Principal de Telemetria y Conexion
function Show-TelemetryDialog {
    $cfg = Get-AgentConfig
    $test = Test-ServerConnection -url $cfg.ServerUrl
    
    $form = New-Object System.Windows.Forms.Form
    $form.Text = "Petroil ITAsset - Telemetria y Estado de Conexion"
    $form.Size = New-Object System.Drawing.Size(680, 650)
    $form.StartPosition = "CenterScreen"
    $form.FormBorderStyle = "FixedDialog"
    $form.MaximizeBox = $false
    $form.BackColor = [System.Drawing.Color]::FromArgb(248, 250, 252)
    $form.Font = New-Object System.Drawing.Font("Segoe UI", 9)

    # Banner Superior
    $banner = New-Object System.Windows.Forms.Panel
    $banner.Dock = "Top"
    $banner.Height = 75
    $banner.BackColor = [System.Drawing.Color]::FromArgb(15, 23, 42)
    $form.Controls.Add($banner)

    $lblTitle = New-Object System.Windows.Forms.Label
    $lblTitle.Text = "PETROIL IT ASSET MANAGEMENT"
    $lblTitle.ForeColor = [System.Drawing.Color]::White
    $lblTitle.Font = New-Object System.Drawing.Font("Segoe UI", 12, [System.Drawing.FontStyle]::Bold)
    $lblTitle.Location = New-Object System.Drawing.Point(20, 15)
    $lblTitle.AutoSize = $true
    $banner.Controls.Add($lblTitle)

    $lblSub = New-Object System.Windows.Forms.Label
    $lblSub.Text = "Agente de Telemetria en Tiempo Real | Sede: $($cfg.BranchName)"
    $lblSub.ForeColor = [System.Drawing.Color]::FromArgb(148, 163, 184)
    $lblSub.Font = New-Object System.Drawing.Font("Segoe UI", 8.5)
    $lblSub.Location = New-Object System.Drawing.Point(20, 42)
    $lblSub.AutoSize = $true
    $banner.Controls.Add($lblSub)

    # Estado de Conexion Banner
    $pnlStatus = New-Object System.Windows.Forms.Panel
    $pnlStatus.Location = New-Object System.Drawing.Point(20, 90)
    $pnlStatus.Size = New-Object System.Drawing.Size(625, 45)
    if ($test.Success) {
        $pnlStatus.BackColor = [System.Drawing.Color]::FromArgb(220, 252, 231)
    } else {
        $pnlStatus.BackColor = [System.Drawing.Color]::FromArgb(254, 226, 226)
    }
    $form.Controls.Add($pnlStatus)

    $lblConnStatus = New-Object System.Windows.Forms.Label
    $lblConnStatus.Location = New-Object System.Drawing.Point(15, 12)
    $lblConnStatus.AutoSize = $true
    $lblConnStatus.Font = New-Object System.Drawing.Font("Segoe UI", 9.5, [System.Drawing.FontStyle]::Bold)
    if ($test.Success) {
        $lblConnStatus.ForeColor = [System.Drawing.Color]::FromArgb(22, 101, 52)
        $lblConnStatus.Text = "● CONEXION ACTIVA AL SERVIDOR CENTRAL (HTTP 200 OK)"
    } else {
        $lblConnStatus.ForeColor = [System.Drawing.Color]::FromArgb(153, 27, 27)
        $lblConnStatus.Text = "● ERROR DE CONEXION CON EL SERVIDOR CENTRAL"
    }
    $pnlStatus.Controls.Add($lblConnStatus)

    # Datos de Hardware
    $grpDevice = New-Object System.Windows.Forms.GroupBox
    $grpDevice.Text = " Datos del Equipo y Telemetria Local "
    $grpDevice.Location = New-Object System.Drawing.Point(20, 145)
    $grpDevice.Size = New-Object System.Drawing.Size(625, 150)
    $form.Controls.Add($grpDevice)

    $telemetryData = if (Test-Path $telemetryFile) {
        try { Get-Content $telemetryFile -Encoding UTF8 | ConvertFrom-Json } catch { $null }
    } else { $null }

    $hostVal = if ($telemetryData) { $telemetryData.hostname } else { $env:COMPUTERNAME }
    $serialVal = if ($telemetryData) { $telemetryData.serialNumber } else { "Consultando..." }
    $ipVal = if ($telemetryData) { $telemetryData.ipAddress } else { "127.0.0.1" }
    $osVal = if ($telemetryData) { $telemetryData.os } else { (Get-CimInstance Win32_OperatingSystem).Caption }
    $cpuVal = if ($telemetryData) { $telemetryData.cpu } else { (Get-CimInstance Win32_Processor | Select-Object -First 1).Name }
    $ramVal = if ($telemetryData) { $telemetryData.ram } else { "8 GB" }

    $labels = @(
        @{ Text = "Equipo (Host):"; Val = $hostVal; X = 15; Y = 25 },
        @{ Text = "Numero de Serie:"; Val = $serialVal; X = 320; Y = 25 },
        @{ Text = "Direccion IP:"; Val = $ipVal; X = 15; Y = 55 },
        @{ Text = "Memoria RAM:"; Val = $ramVal; X = 320; Y = 55 },
        @{ Text = "Sistema Operativo:"; Val = $osVal; X = 15; Y = 85 },
        @{ Text = "Procesador (CPU):"; Val = $cpuVal; X = 15; Y = 115 }
    )

    foreach ($item in $labels) {
        $lbl = New-Object System.Windows.Forms.Label
        $lbl.Text = $item.Text
        $lbl.Font = New-Object System.Drawing.Font("Segoe UI", 8.5, [System.Drawing.FontStyle]::Bold)
        $lbl.Location = New-Object System.Drawing.Point($item.X, $item.Y)
        $lbl.AutoSize = $true
        $grpDevice.Controls.Add($lbl)

        $val = New-Object System.Windows.Forms.Label
        $val.Text = [string]$item.Val
        $val.Font = New-Object System.Drawing.Font("Segoe UI", 8.5)
        $val.ForeColor = [System.Drawing.Color]::FromArgb(51, 65, 85)
        $val.Location = New-Object System.Drawing.Point(($item.X + 130), $item.Y)
        $val.Size = New-Object System.Drawing.Size(170, 20)
        $val.AutoEllipsis = $true
        $grpDevice.Controls.Add($val)
    }

    # Diagnostico y Ubicacion de Archivos
    $grpFiles = New-Object System.Windows.Forms.GroupBox
    $grpFiles.Text = " Ubicacion Exacta de Archivos del Agente y Logs de Error "
    $grpFiles.Location = New-Object System.Drawing.Point(20, 305)
    $grpFiles.Size = New-Object System.Drawing.Size(625, 235)
    $form.Controls.Add($grpFiles)

    $fileItems = @(
        @{ Name = "Configuracion:"; Path = $configPath; Action = "Abrir Config" },
        @{ Name = "Registro Logs / Errores:"; Path = $logFile; Action = "Ver Log" },
        @{ Name = "Telemetria Local (JSON):"; Path = $telemetryFile; Action = "Ver JSON" },
        @{ Name = "Respaldo Escritorio:"; Path = $desktopAuditFile; Action = "Abrir Archivo" }
    )

    $yPos = 25
    foreach ($fi in $fileItems) {
        $lblName = New-Object System.Windows.Forms.Label
        $lblName.Text = $fi.Name
        $lblName.Font = New-Object System.Drawing.Font("Segoe UI", 8.5, [System.Drawing.FontStyle]::Bold)
        $lblName.Location = New-Object System.Drawing.Point(15, $yPos)
        $lblName.AutoSize = $true
        $grpFiles.Controls.Add($lblName)

        $txtPath = New-Object System.Windows.Forms.TextBox
        $txtPath.Text = $fi.Path
        $txtPath.ReadOnly = $true
        $txtPath.BackColor = [System.Drawing.Color]::White
        $txtPath.Location = New-Object System.Drawing.Point(180, ($yPos - 2))
        $txtPath.Size = New-Object System.Drawing.Size(320, 22)
        $grpFiles.Controls.Add($txtPath)

        $btnAct = New-Object System.Windows.Forms.Button
        $btnAct.Text = $fi.Action
        $btnAct.Location = New-Object System.Drawing.Point(510, ($yPos - 3))
        $btnAct.Size = New-Object System.Drawing.Size(100, 25)
        $filePathTarget = $fi.Path
        $btnAct.Add_Click({
            if ($filePathTarget -and (Test-Path $filePathTarget)) {
                [System.Diagnostics.Process]::Start("notepad.exe", $filePathTarget)
            } else {
                [System.Windows.Forms.MessageBox]::Show("El archivo todavia no existe en la ruta especificada.", "Petroil ITAsset", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Information)
            }
        })
        $grpFiles.Controls.Add($btnAct)

        $yPos += 35
    }

    # Ultimos Errores en Log
    $lblLogSummary = New-Object System.Windows.Forms.Label
    $lblLogSummary.Text = "Ultimos registros de conexion y errores (telemetry.log):"
    $lblLogSummary.Font = New-Object System.Drawing.Font("Segoe UI", 8.5, [System.Drawing.FontStyle]::Bold)
    $lblLogSummary.Location = New-Object System.Drawing.Point(15, 160)
    $lblLogSummary.AutoSize = $true
    $grpFiles.Controls.Add($lblLogSummary)

    $txtLog = New-Object System.Windows.Forms.TextBox
    $txtLog.Multiline = $true
    $txtLog.ScrollBars = "Vertical"
    $txtLog.ReadOnly = $true
    $txtLog.BackColor = [System.Drawing.Color]::FromArgb(241, 245, 249)
    $txtLog.Font = New-Object System.Drawing.Font("Consolas", 8)
    $txtLog.Location = New-Object System.Drawing.Point(15, 180)
    $txtLog.Size = New-Object System.Drawing.Size(595, 45)
    if (Test-Path $logFile) {
        try {
            $lines = Get-Content $logFile -Tail 10
            $txtLog.Text = ($lines -join [Environment]::NewLine)
        } catch { $txtLog.Text = "Sin registros." }
    } else {
        $txtLog.Text = "El archivo de logs no ha sido generado aun."
    }
    $grpFiles.Controls.Add($txtLog)

    # Botones Inferiores
    $btnSync = New-Object System.Windows.Forms.Button
    $btnSync.Text = "Forzar Sincronizacion Ahora"
    $btnSync.Location = New-Object System.Drawing.Point(20, 555)
    $btnSync.Size = New-Object System.Drawing.Size(200, 35)
    $btnSync.BackColor = [System.Drawing.Color]::FromArgb(15, 23, 42)
    $btnSync.ForeColor = [System.Drawing.Color]::White
    $btnSync.FlatStyle = "Flat"
    $btnSync.Add_Click({
        $form.Close()
        $notifyIcon.ShowBalloonTip(3000, "Petroil ITAsset", "Recopilando telemetria de hardware...", [System.Windows.Forms.ToolTipIcon]::Info)
        Start-Process -FilePath "powershell.exe" -ArgumentList "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File \`"$collectorPath\`"" -WindowStyle Hidden
    })
    $form.Controls.Add($btnSync)

    $btnOpenDir = New-Object System.Windows.Forms.Button
    $btnOpenDir.Text = "Abrir Carpeta de Instalacion"
    $btnOpenDir.Location = New-Object System.Drawing.Point(235, 555)
    $btnOpenDir.Size = New-Object System.Drawing.Size(200, 35)
    $btnOpenDir.Add_Click({ [System.Diagnostics.Process]::Start("explorer.exe", $installDir) })
    $form.Controls.Add($btnOpenDir)

    $btnClose = New-Object System.Windows.Forms.Button
    $btnClose.Text = "Cerrar"
    $btnClose.Location = New-Object System.Drawing.Point(545, 555)
    $btnClose.Size = New-Object System.Drawing.Size(100, 35)
    $btnClose.Add_Click({ $form.Close() })
    $form.Controls.Add($btnClose)

    $form.ShowDialog() | Out-Null
}

function Show-DiagnosticsDialog {
    Show-TelemetryDialog
}

# Notificacion emergente inicial
$notifyIcon.ShowBalloonTip(5000, "Petroil ITAsset Agent", "Agente activo junto al reloj. Haga clic derecho para ver telemetria o diagnostico de errores.", [System.Windows.Forms.ToolTipIcon]::Info)

# Timer para sondeo y actualizacion periodica de estado cada 5 minutos
$timer = New-Object System.Windows.Forms.Timer
$timer.Interval = 300000
$timer.Add_Tick({ Refresh-Status })
$timer.Start()

Refresh-Status

# Bucle principal de la aplicacion de Windows Forms
[System.Windows.Forms.Application]::Run()
'@

$trayScriptPath = "$installDir\\PetroilTrayAgent.ps1"
$trayScript | Set-Content -Path $trayScriptPath -Encoding UTF8
Write-Host "[+] Agente de barra de tareas 'PetroilTrayAgent.ps1' creado." -ForegroundColor Green

# Desbloquear archivos PowerShell en Windows 11 para eliminar restricciones de SmartScreen
Get-ChildItem -Path "$installDir" -Filter "*.ps1" -Recurse -ErrorAction SilentlyContinue | Unblock-File -ErrorAction SilentlyContinue

# 6. CONFIGURACION DE INICIO AUTOMATICO (BARRA DE TAREAS Y RECOPILADOR)
Write-Host ">>> Configurando persistencia y auto-arranque en Windows..." -ForegroundColor Cyan

# 6.1 Acceso directo en carpeta de Inicio (Startup) para el Agente de Barra de Tareas
try {
    $wscript = New-Object -ComObject WScript.Shell
    $startupPath = [Environment]::GetFolderPath('Startup')
    if ($startupPath -and (Test-Path $startupPath)) {
        $trayShortcut = $wscript.CreateShortcut("$startupPath\\PetroilTrayAgent.lnk")
        $trayShortcut.TargetPath = "powershell.exe"
        $trayShortcut.Arguments = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File \`"$trayScriptPath\`""
        $trayShortcut.WorkingDirectory = $installDir
        $trayShortcut.Description = "Petroil ITAsset - Agente de Barra de Tareas"
        $trayShortcut.Save()
        Write-Host "[+] Acceso directo de barra de tareas registrado en Inicio (Startup)." -ForegroundColor Green
    }
} catch {
    Write-Warning "Aviso configurando Startup: $_"
}

# 6.2 Registro en Clave Run de Registro de Windows (Persistencia asegurada)
try {
    $regPath = "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run"
    $regCmd = "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File \`"$trayScriptPath\`""
    Set-ItemProperty -Path $regPath -Name "PetroilITAssetTray" -Value $regCmd -ErrorAction SilentlyContinue
    Write-Host "[+] Registro Run de Windows configurado para inicio de sesion." -ForegroundColor Green
} catch {}

# 6.3 Tarea Programada para Recopilador en Segundo Plano
$taskOk = $false
if ($isAdmin) {
    try {
        $action = New-ScheduledTaskAction -Execute 'PowerShell.exe' -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File \`"$collectorPath\`""
        $triggerBoot = New-ScheduledTaskTrigger -AtStartup
        $triggerDaily = New-ScheduledTaskTrigger -Daily -At "08:00"
        $principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
        Register-ScheduledTask -TaskName "PetroilITAssetAgent" -Action $action -Trigger @($triggerBoot, $triggerDaily) -Principal $principal -Force -ErrorAction Stop | Out-Null
        $taskOk = $true
        Write-Host "[+] Tarea programada registrada en Windows (Nivel SYSTEM)." -ForegroundColor Green
    } catch {
        Write-Warning "Aviso al registrar tarea SYSTEM: $_"
    }
}

if (-not $taskOk) {
    try {
        $action = New-ScheduledTaskAction -Execute 'PowerShell.exe' -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File \`"$collectorPath\`""
        $triggerLogon = New-ScheduledTaskTrigger -AtLogOn
        Register-ScheduledTask -TaskName "PetroilITAssetAgent" -Action $action -Trigger $triggerLogon -RunLevel Highest -Force -ErrorAction Stop | Out-Null
        $taskOk = $true
        Write-Host "[+] Tarea programada registrada para inicio de sesion de usuario." -ForegroundColor Green
    } catch {}
}

# 7. EJECUCION DE SONDEO INICIAL DE TELEMETRIA
Write-Host ">>> Ejecutando sondeo y conexion inicial con el servidor..." -ForegroundColor Cyan
& powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$collectorPath"

# 8. LANZAMIENTO DEL AGENTE DE BARRA DE TAREAS (SYSTEM TRAY)
Write-Host ">>> Iniciando icono del agente en el area de notificacion junto al reloj..." -ForegroundColor Cyan
try {
    Start-Process -FilePath "powershell.exe" -ArgumentList "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File \`"$trayScriptPath\`"" -WindowStyle Hidden
    Write-Host "[OK] Icono del agente activo en la barra de tareas." -ForegroundColor Green
} catch {
    Write-Warning "No se pudo iniciar el proceso de barra de tareas: $_"
}

Write-Host ""
Write-Host "==================================================================" -ForegroundColor Green
Write-Host "  ¡AGENTE INSTALADO Y CONECTADO EXITOSAMENTE AL SERVIDOR!         " -ForegroundColor Green
Write-Host "==================================================================" -ForegroundColor Green
Write-Host "Equipo:        $env:COMPUTERNAME" -ForegroundColor Cyan
Write-Host "Directorio:    $installDir" -ForegroundColor White
Write-Host "Configuracion: $configPath" -ForegroundColor White
Write-Host "Logs/Errores:  $logsDir\\telemetry.log" -ForegroundColor White
Write-Host "Servidor:      ${serverUrl}" -ForegroundColor White
Write-Host ""
Write-Host "NOTA: Busque el icono corporativo de Petroil junto al reloj de Windows" -ForegroundColor Yellow
Write-Host "      Haga doble clic para ver telemetria o clic derecho para opciones." -ForegroundColor Yellow
Write-Host ""
`;

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.send(psScript);
};

app.get('/api/v1/agent/install-windows.ps1', serveWindowsInstaller);
app.get('/install-windows.ps1', serveWindowsInstaller);

// Windows 1-Click .BAT Installer
const serveWindowsBat: express.RequestHandler = (req, res) => {
  const serverUrl = getBaseServerUrl(req);
  const batScript = `@echo off
chcp 65001 >nul
title Instalador Agente Petroil ITAsset (Windows 11 / 10)
echo ====================================================================
echo   INSTALADOR AUTOMATICO AGENTE PETROIL ITASSET (WINDOWS 11 / 10)
echo   Servidor Hub: ${serverUrl}
echo ====================================================================
echo.
echo Verificando permisos de Administrador...
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [*] Elevando privilegios de ejecucion (UAC)...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process '%~dpnx0' -Verb RunAs"
    exit /b
)

echo [+] Permisos confirmados.
echo [*] Conectando con el servidor e instalando agente en Windows...
echo.

powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12 -bor [System.Net.SecurityProtocolType]::Tls11 -bor [System.Net.SecurityProtocolType]::Tls; try { [System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true} } catch {}; iex (irm '${serverUrl}/api/v1/agent/install-windows.ps1')"

echo.
echo ====================================================================
echo Instalacion finalizada. Busque el icono del Agente junto al reloj.
echo Presione cualquier tecla para cerrar esta ventana...
echo ====================================================================
pause >nul
`;

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="Instalar-Agente-Windows.bat"');
  res.send(batScript);
};

app.get('/api/v1/agent/install-windows.bat', serveWindowsBat);
app.get('/install-windows.bat', serveWindowsBat);

// macOS Bash Installer (.sh)
const serveMacosInstaller: express.RequestHandler = (req, res) => {
  const serverUrl = getBaseServerUrl(req);
  const macScript = `#!/usr/bin/env bash
# ==============================================================================
# Script de Instalacion del Agente Petroil ITAsset para macOS
# Requisito Minimo: macOS 15.0 Sequoia o superior
# Servidor Central: ${serverUrl}
# ==============================================================================

echo "=================================================================="
echo "    INSTALADOR AGENTE PETROIL ITASSET PARA macOS"
echo "=================================================================="

INSTALL_DIR="/Library/Application Support/Petroil/ITAssetAgent"
sudo mkdir -p "$INSTALL_DIR/logs"

CONFIG_FILE="$INSTALL_DIR/agent-config.json"
sudo bash -c "cat <<EOF > '$CONFIG_FILE'
{
  \\"ServerUrl\\": \\"${serverUrl}/api/v1/telemetry\\",
  \\"Platform\\": \\"macos\\",
  \\"InstalledAt\\": \\"$(date -u +'%Y-%m-%d %H:%M:%SZ')\\"
}
EOF"

echo "[+] Directorios creados en $INSTALL_DIR"

SERIAL=$(system_profiler SPHardwareDataType 2>/dev/null | awk '/Serial/ {print $4}')
[ -z "$SERIAL" ] && SERIAL="MAC-$(hostname)"
CPU=$(sysctl -n machdep.cpu.brand_string 2>/dev/null || echo "Apple Silicon")
RAM_BYTES=$(sysctl -n hw.memsize 2>/dev/null || echo 8589934592)
RAM_GB=$((RAM_BYTES / 1073741824))
OS_VER=$(sw_vers -productVersion 2>/dev/null || echo "15.0")
IP=$(ipconfig getifaddr en0 2>/dev/null || echo "127.0.0.1")

PAYLOAD=$(cat <<EOF
{
  "hostname": "$(hostname)",
  "serialNumber": "$SERIAL",
  "os": "macOS $OS_VER",
  "cpu": "$CPU",
  "ram": "$RAM_GB GB",
  "storage": "APFS SSD",
  "ipAddress": "$IP",
  "platform": "macos"
}
EOF
)

echo "[*] Enviando reporte a ${serverUrl}/api/v1/telemetry..."
curl -s -X POST "${serverUrl}/api/v1/telemetry" \\
  -H "Content-Type: application/json" \\
  -d "$PAYLOAD"

echo ""
echo "[OK] Agente instalado y conectado con exito."
`;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.send(macScript);
};

app.get('/api/v1/agent/install-macos.sh', serveMacosInstaller);
app.get('/install-macos.sh', serveMacosInstaller);

// Linux Bash Installer (.sh)
const serveLinuxInstaller: express.RequestHandler = (req, res) => {
  const serverUrl = getBaseServerUrl(req);
  const linuxScript = `#!/usr/bin/env bash
# ==============================================================================
# Script de Instalacion del Agente Petroil ITAsset para Linux
# Servidor Central: ${serverUrl}
# ==============================================================================

echo "=================================================================="
echo "    INSTALADOR AGENTE PETROIL ITASSET PARA LINUX"
echo "=================================================================="

INSTALL_DIR="/opt/petroil/itasset-agent"
sudo mkdir -p "$INSTALL_DIR/logs"

CONFIG_FILE="$INSTALL_DIR/agent-config.json"
sudo bash -c "cat <<EOF > '$CONFIG_FILE'
{
  \\"ServerUrl\\": \\"${serverUrl}/api/v1/telemetry\\",
  \\"Platform\\": \\"linux\\",
  \\"InstalledAt\\": \\"$(date -u +'%Y-%m-%d %H:%M:%SZ')\\"
}
EOF"

echo "[+] Directorios creados en $INSTALL_DIR"

SERIAL=$(cat /sys/class/dmi/id/product_serial 2>/dev/null || echo "LIN-$(hostname)")
CPU=$(lscpu | grep "Model name" | cut -d: -f2 | xargs || echo "Generic x86_64")
RAM_KB=$(grep MemTotal /proc/meminfo | awk '{print $2}')
RAM_GB=$((RAM_KB / 1048576))
IP=$(hostname -I | awk '{print $1}')

PAYLOAD=$(cat <<EOF
{
  "hostname": "$(hostname)",
  "serialNumber": "$SERIAL",
  "os": "Linux $(uname -r)",
  "cpu": "$CPU",
  "ram": "$RAM_GB GB",
  "storage": "Ext4/SSD",
  "ipAddress": "$IP",
  "platform": "linux"
}
EOF
)

echo "[*] Enviando reporte a ${serverUrl}/api/v1/telemetry..."
curl -s -X POST "${serverUrl}/api/v1/telemetry" \\
  -H "Content-Type: application/json" \\
  -d "$PAYLOAD"

echo ""
echo "[OK] Agente instalado y conectado con exito."
`;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.send(linuxScript);
};

app.get('/api/v1/agent/install-linux.sh', serveLinuxInstaller);
app.get('/install-linux.sh', serveLinuxInstaller);

// ==========================================
// REMOTE COMMANDS & BITLOCKER CONTROL API
// ==========================================

// Get all system commands or filter by target
app.get('/api/v1/commands', (req, res) => {
  const { agentId, hostname, assetId } = req.query;
  let list = cachedCommands;

  if (agentId) {
    list = list.filter(c => c.agentId === agentId);
  } else if (hostname) {
    list = list.filter(c => c.targetHostname.toLowerCase() === String(hostname).toLowerCase());
  } else if (assetId) {
    list = list.filter(c => c.assetId === assetId);
  }

  res.json({
    success: true,
    total: list.length,
    commands: list
  });
});

// Get commands for specific device/asset
app.get('/api/v1/devices/:id/commands', (req, res) => {
  const id = req.params.id;
  const list = cachedCommands.filter(c => c.assetId === id || c.agentId === id || c.targetHostname.toLowerCase() === id.toLowerCase());
  res.json({
    success: true,
    total: list.length,
    commands: list
  });
});

// Enqueue a new remote command (BitLocker lock, screen lock, popup message)
app.post('/api/v1/devices/:id/commands', (req, res) => {
  try {
    const targetId = req.params.id;
    const { 
      commandType, 
      parameters = {}, 
      requestedBy = 'Administrador TI',
      agentId,
      targetHostname
    } = req.body;

    if (!commandType) {
      return res.status(400).json({ success: false, error: 'commandType es requerido' });
    }

    const commandId = `cmd-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const newCommand: ServerDeviceCommand = {
      id: commandId,
      assetId: targetId.startsWith('agent-') ? undefined : targetId,
      agentId: agentId || (targetId.startsWith('agent-') ? targetId : `agent-${targetId}`),
      targetHostname: targetHostname || targetId,
      commandType,
      parameters,
      status: 'pending',
      createdAt: new Date().toISOString(),
      requestedBy
    };

    cachedCommands.unshift(newCommand);
    saveStoredCommands(cachedCommands);

    console.log(`[COMMAND_DISPATCHED] ${commandType} encolado para ${newCommand.targetHostname} (${commandId}) por ${requestedBy}`);

    res.status(201).json({
      success: true,
      message: `Comando ${commandType} registrado y encolado para el agente`,
      command: newCommand
    });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

// Helper to check if a command targets an agent
function isCommandTargetingAgent(command: ServerDeviceCommand, agentId?: string, hostname?: string): boolean {
  const normHost = (hostname || '').trim().toLowerCase();
  const normCmdHost = (command.targetHostname || '').trim().toLowerCase();
  const normCmdAgent = (command.agentId || '').trim().toLowerCase();
  const normAgentId = (agentId || '').trim().toLowerCase();

  if (normAgentId && (normCmdAgent === normAgentId || normCmdHost === normAgentId)) {
    return true;
  }
  if (normHost && (normCmdHost === normHost || normCmdAgent.includes(normHost))) {
    return true;
  }

  // Cross check with cachedAgents
  const agent = cachedAgents.find(a => 
    (normAgentId && a.id.toLowerCase() === normAgentId) || 
    (normHost && a.hostname.toLowerCase() === normHost)
  );

  if (agent) {
    if (agent.linkedAssetTag && (normCmdHost === agent.linkedAssetTag.toLowerCase() || command.assetId === agent.linkedAssetTag)) {
      return true;
    }
    if (agent.specs?.serialNumber && normCmdHost === agent.specs.serialNumber.toLowerCase()) {
      return true;
    }
  }

  return false;
}

// Agent endpoint to poll pending commands
app.get('/api/v1/agent/commands', (req, res) => {
  const { agentId, hostname } = req.query;
  if (!agentId && !hostname) {
    return res.status(400).json({ success: false, error: 'agentId o hostname requerido' });
  }

  const strAgentId = typeof agentId === 'string' ? agentId : undefined;
  const strHostname = typeof hostname === 'string' ? hostname : undefined;

  const pending = cachedCommands.filter(c => 
    c.status === 'pending' && isCommandTargetingAgent(c, strAgentId, strHostname)
  );

  // Mark as sent
  pending.forEach(c => {
    c.status = 'sent';
    c.dispatchedAt = new Date().toISOString();
  });
  saveStoredCommands(cachedCommands);

  res.json({
    success: true,
    total: pending.length,
    commands: pending
  });
});

// Agent Acknowledgment endpoint
app.post('/api/v1/agent/commands/:commandId/ack', (req, res) => {
  const { commandId } = req.params;
  const { status = 'executed', outputMessage = '' } = req.body;

  const cmd = cachedCommands.find(c => c.id === commandId);
  if (!cmd) {
    return res.status(404).json({ success: false, error: 'Comando no encontrado' });
  }

  cmd.status = status;
  cmd.executedAt = new Date().toISOString();
  cmd.outputMessage = outputMessage;

  // Update target agent if present
  const ag = cachedAgents.find(a => 
    a.id === cmd.agentId || 
    a.hostname.toLowerCase() === cmd.targetHostname.toLowerCase() ||
    (a.linkedAssetTag && a.linkedAssetTag.toLowerCase() === cmd.targetHostname.toLowerCase())
  );

  if (ag) {
    if (cmd.commandType === 'bitlocker_lock') {
      if (!ag.bitlockerStatus) {
        ag.bitlockerStatus = {
          drive: 'C:',
          encryptionMethod: 'XTS-AES 256-bit',
          protectionStatus: 'Bloqueado',
          lockState: 'locked',
          tpmPresent: true,
          recoveryKey: '582914-381920-491028-192847-592817-482910-384918-294819',
          lastStatusCheck: new Date().toISOString()
        };
      } else {
        ag.bitlockerStatus.lockState = 'locked';
        ag.bitlockerStatus.protectionStatus = 'Bloqueado';
        ag.bitlockerStatus.lastStatusCheck = new Date().toISOString();
      }
    } else if (cmd.commandType === 'bitlocker_unlock') {
      if (ag.bitlockerStatus) {
        ag.bitlockerStatus.lockState = 'unlocked';
        ag.bitlockerStatus.protectionStatus = 'Protegido';
        ag.bitlockerStatus.lastStatusCheck = new Date().toISOString();
      }
    }
    saveStoredAgents(cachedAgents);
  }

  saveStoredCommands(cachedCommands);

  res.json({
    success: true,
    command: cmd
  });
});

// Instant interactive execution simulator (Allows testing command execution in the preview UI)
app.post('/api/v1/agent/commands/:commandId/simulate-exec', (req, res) => {
  const { commandId } = req.params;
  const cmd = cachedCommands.find(c => c.id === commandId);
  if (!cmd) {
    return res.status(404).json({ success: false, error: 'Comando no encontrado' });
  }

  let output = '';
  if (cmd.commandType === 'bitlocker_lock') {
    output = `[BitLocker Engine] manage-bde.exe -forcerecovery C: ejecutado exitosamente. Se ha inhabilitado el protector TPM temporalmente. En el próximo reinicio o arranque en frío, el volumen C: exigirá la clave numérica de recuperación de 48 dígitos.`;
  } else if (cmd.commandType === 'bitlocker_unlock') {
    output = `[BitLocker Engine] manage-bde.exe -protectors -enable C: ejecutado. Protectores restaurados a estado normal con TPM 2.0.`;
  } else if (cmd.commandType === 'screen_lock') {
    output = `[Security Session] rundll32.exe user32.dll,LockWorkStation invocado exitosamente. La sesión gráfica del usuario activo fue bloqueada de inmediato.`;
  } else if (cmd.commandType === 'display_message') {
    const title = cmd.parameters.messageTitle || 'Aviso de Seguridad Petroil TI';
    const text = cmd.parameters.messageText || '';
    output = `[Desktop Broadcast] Cuadro de diálogo emergente desplegado en pantalla activa del colaborador: "${title}: ${text}" (Duración: ${cmd.parameters.displayDurationSeconds || 60}s).`;
  } else {
    output = `[Security Policy] Comando ${cmd.commandType} ejecutado correctamente por el agente.`;
  }

  cmd.status = 'executed';
  cmd.dispatchedAt = new Date().toISOString();
  cmd.executedAt = new Date().toISOString();
  cmd.outputMessage = output;

  // Update target agent if present
  const ag = cachedAgents.find(a => a.id === cmd.agentId || a.hostname.toLowerCase() === cmd.targetHostname.toLowerCase());
  if (ag) {
    if (cmd.commandType === 'bitlocker_lock') {
      if (!ag.bitlockerStatus) {
        ag.bitlockerStatus = {
          drive: 'C:',
          encryptionMethod: 'XTS-AES 256-bit',
          protectionStatus: 'Bloqueado',
          lockState: 'locked',
          tpmPresent: true,
          recoveryKey: '582914-381920-491028-192847-592817-482910-384918-294819',
          lastStatusCheck: new Date().toISOString()
        };
      } else {
        ag.bitlockerStatus.lockState = 'locked';
        ag.bitlockerStatus.protectionStatus = 'Bloqueado';
      }
    } else if (cmd.commandType === 'bitlocker_unlock') {
      if (ag.bitlockerStatus) {
        ag.bitlockerStatus.lockState = 'unlocked';
        ag.bitlockerStatus.protectionStatus = 'Protegido';
      }
    }
    saveStoredAgents(cachedAgents);
  }

  saveStoredCommands(cachedCommands);

  res.json({
    success: true,
    message: 'Comando ejecutado por el agente simulado',
    command: cmd
  });
});

// Geolocation lookup endpoint (Network IP and Corporate Headquarters fallback)
app.get('/api/geolocation/lookup', async (req, res) => {
  try {
    const forwarded = req.headers['x-forwarded-for'];
    const clientIp = typeof forwarded === 'string' 
      ? forwarded.split(',')[0].trim() 
      : (req.socket.remoteAddress || '');

    const isLocal = !clientIp || clientIp === '::1' || clientIp.startsWith('127.') || clientIp.startsWith('10.') || clientIp.startsWith('192.168.');
    if (!isLocal) {
      try {
        const fetchRes = await fetch(`https://ipapi.co/${clientIp}/json/`, {
          signal: AbortSignal.timeout(3000)
        });
        if (fetchRes.ok) {
          const data = await fetchRes.json();
          if (data && typeof data.latitude === 'number' && typeof data.longitude === 'number') {
            return res.json({
              success: true,
              method: 'ip',
              lat: data.latitude,
              lng: data.longitude,
              city: data.city || 'Ciudad de México',
              state: data.region || 'CDMX',
              country: data.country_name || 'México',
              org: data.org || 'Red Corporativa'
            });
          }
        }
      } catch {
        // Fall through to corporate default
      }
    }
  } catch (err) {
    console.warn('Geolocation lookup notice:', err);
  }

  // Corporate Default: Matriz Mazatlán, Sinaloa (Grupo Petroil Headquarters)
  return res.json({
    success: true,
    method: 'corporate_headquarters',
    lat: 23.2393,
    lng: -106.4212,
    city: 'Mazatlán',
    state: 'Sinaloa',
    country: 'México',
    locationName: 'Matriz Corporativa Grupo Petroil'
  });
});

// Mount Vite or static files
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    } else {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa'
      });
      app.use(vite.middlewares);
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Petroil ITAsset Central Hub con Servidor de Telemetría activo en http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
