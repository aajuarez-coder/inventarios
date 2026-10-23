import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
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

    const agentRecord: StoredAgent = {
      id: agentId,
      hostname,
      platform,
      osVersion: osRaw,
      ipAddress: payload.ipAddress || clientIp,
      macAddress: payload.macAddress || '00:00:00:00:00:00',
      branchId: payload.branchId,
      branchName: payload.branchName || 'Sede Principal Petroil',
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
        linkedAssetTag: cachedAgents[existingIndex].linkedAssetTag // preserve link
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

// Delete an agent
app.delete('/api/v1/agents/:id', (req, res) => {
  const id = req.params.id;
  cachedAgents = cachedAgents.filter(a => a.id !== id);
  saveStoredAgents(cachedAgents);
  res.json({ success: true });
});

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

// Agent endpoint to poll pending commands
app.get('/api/v1/agent/commands', (req, res) => {
  const { agentId, hostname } = req.query;
  if (!agentId && !hostname) {
    return res.status(400).json({ success: false, error: 'agentId o hostname requerido' });
  }

  const pending = cachedCommands.filter(c => {
    const matchAgent = agentId && c.agentId === agentId;
    const matchHost = hostname && c.targetHostname.toLowerCase() === String(hostname).toLowerCase();
    return (matchAgent || matchHost) && c.status === 'pending';
  });

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

  // If command was bitlocker lock, update agent bitlocker status
  if (cmd.commandType === 'bitlocker_lock') {
    const ag = cachedAgents.find(a => a.id === cmd.agentId || a.hostname.toLowerCase() === cmd.targetHostname.toLowerCase());
    if (ag && ag.bitlockerStatus) {
      ag.bitlockerStatus.lockState = 'locked';
      ag.bitlockerStatus.protectionStatus = 'Bloqueado';
      saveStoredAgents(cachedAgents);
    }
  } else if (cmd.commandType === 'bitlocker_unlock') {
    const ag = cachedAgents.find(a => a.id === cmd.agentId || a.hostname.toLowerCase() === cmd.targetHostname.toLowerCase());
    if (ag && ag.bitlockerStatus) {
      ag.bitlockerStatus.lockState = 'unlocked';
      ag.bitlockerStatus.protectionStatus = 'Protegido';
      saveStoredAgents(cachedAgents);
    }
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
