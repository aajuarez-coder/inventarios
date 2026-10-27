import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  Search, 
  Printer, 
  Download, 
  Copy, 
  Check, 
  Terminal, 
  ExternalLink, 
  ShieldCheck, 
  Laptop, 
  Users, 
  FileText, 
  Wrench, 
  Truck, 
  MapPin, 
  BellRing, 
  History, 
  HelpCircle, 
  AlertTriangle, 
  FileDown, 
  ChevronRight, 
  CheckCircle2, 
  Info,
  Server,
  Lock,
  Repeat,
  Monitor,
  Send
} from 'lucide-react';
import { TabId } from './Sidebar';

interface UserManualProps {
  onNavigate?: (tab: TabId) => void;
}

interface SectionItem {
  id: string;
  title: string;
  category: string;
  icon: React.ElementType;
  tabTarget?: TabId;
  keywords: string[];
  content: React.ReactNode;
}

export const UserManual: React.FC<UserManualProps> = ({ onNavigate }) => {
  const [activeSectionId, setActiveSectionId] = useState<string>('intro');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);
  const [copiedFullMd, setCopiedFullMd] = useState(false);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(id);
    setTimeout(() => setCopiedSnippet(null), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadMarkdown = () => {
    // Fetch or construct download
    const link = document.createElement('a');
    link.href = '/MANUAL_DE_USUARIO.md';
    link.download = 'PETROIL_ITASSET_MANUAL_DE_USUARIO.md';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const sections: SectionItem[] = useMemo(() => [
    {
      id: 'intro',
      title: '1. Introducción y Arquitectura',
      category: 'General',
      icon: BookOpen,
      tabTarget: 'dashboard',
      keywords: ['introduccion', 'objetivos', 'arquitectura', 'petroil', 'alcance', 'hardware'],
      content: (
        <div className="space-y-4">
          <p className="text-sm text-slate-600 leading-relaxed">
            El <strong>Sistema de Gestión de Activos de Hardware Petroil ITAsset (v2.4.1 LTS)</strong> es la solución integral oficial de Grupo Petroil para el control, auditoría, trazabilidad y supervisión del ciclo de vida del parque informático corporativo.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="border border-slate-200 bg-slate-50/50 p-4 rounded-xl">
              <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider block mb-1">Cero Extravíos</span>
              <p className="text-xs text-slate-600">Custodia jurídica mediante cartas responsivas con firma digital y folio institucional.</p>
            </div>
            <div className="border border-slate-200 bg-slate-50/50 p-4 rounded-xl">
              <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider block mb-1">Mantenimiento Proactivo</span>
              <p className="text-xs text-slate-600">Control de cronogramas semestrales, alertas por vencer y score técnico de diagnóstico (1-100).</p>
            </div>
            <div className="border border-slate-200 bg-slate-50/50 p-4 rounded-xl">
              <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider block mb-1">Telemetría Automatizada</span>
              <p className="text-xs text-slate-600">Agentes multiplataforma para Windows 11/10, macOS Sequoia y Linux Ubuntu con auto-registro.</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'rbac',
      title: '2. Roles de Usuario y Matriz RBAC',
      category: 'Seguridad',
      icon: ShieldCheck,
      tabTarget: 'users',
      keywords: ['rbac', 'roles', 'permisos', 'admin', 'tecnico', 'auditor', 'seguridad', 'usuarios'],
      content: (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            La plataforma implementa Control de Acceso Basado en Roles (RBAC) con tres perfiles principales:
          </p>
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="p-3 font-semibold">Operación / Módulo</th>
                  <th className="p-3 font-semibold text-center">Administrador TI</th>
                  <th className="p-3 font-semibold text-center">Técnico TI</th>
                  <th className="p-3 font-semibold text-center">Auditor / Consulta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr>
                  <td className="p-3 font-medium">Alta y edición de hardware</td>
                  <td className="p-3 text-center text-emerald-600 font-bold">✓ Total</td>
                  <td className="p-3 text-center text-emerald-600 font-bold">✓ Total</td>
                  <td className="p-3 text-center text-slate-400">Sólo lectura</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">Emisión y firma de cartas responsivas</td>
                  <td className="p-3 text-center text-emerald-600 font-bold">✓ Total</td>
                  <td className="p-3 text-center text-emerald-600 font-bold">✓ Total</td>
                  <td className="p-3 text-center text-slate-400">Sólo lectura</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">Registro de mantenimientos & score</td>
                  <td className="p-3 text-center text-emerald-600 font-bold">✓ Total</td>
                  <td className="p-3 text-center text-emerald-600 font-bold">✓ Total</td>
                  <td className="p-3 text-center text-slate-400">Sólo lectura</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">Aprobación de traslados entre sedes</td>
                  <td className="p-3 text-center text-emerald-600 font-bold">✓ Total</td>
                  <td className="p-3 text-center text-amber-600 font-medium">Creación</td>
                  <td className="p-3 text-center text-slate-400">Sólo lectura</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">Gestión de usuarios del sistema</td>
                  <td className="p-3 text-center text-emerald-600 font-bold">✓ Total</td>
                  <td className="p-3 text-center text-rose-500 font-medium">✕ Denegado</td>
                  <td className="p-3 text-center text-rose-500 font-medium">✕ Denegado</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-3 text-xs text-indigo-900 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <span>Los usuarios con perfil de <strong>Auditor</strong> pueden exportar reportes y consultar fichas sin riesgo de modificación o eliminación accidental.</span>
          </div>
        </div>
      )
    },
    {
      id: 'dashboard',
      title: '3. Tablero de Control y Estadísticas',
      category: 'Módulos',
      icon: BookOpen,
      tabTarget: 'dashboard',
      keywords: ['dashboard', 'metricas', 'kpis', 'estadisticas', 'graficas', 'almacen'],
      content: (
        <div className="space-y-4 text-sm text-slate-600">
          <p>
            El panel inicial concentra los indicadores clave de desempeño (KPIs) en tiempo real:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-xs text-slate-700">
            <li><strong>Valor Total de Activos:</strong> Sumatoria contable del costo de adquisición registrado en pesos mexicanos (MXN).</li>
            <li><strong>Distribución por Estado:</strong> Desglose porcentual entre activos <em>En Uso</em>, <em>Disponible en Almacén</em>, <em>En Mantenimiento</em> y <em>De Baja</em>.</li>
            <li><strong>Alertas de Póliza y Garantía:</strong> Conteo de equipos con garantía vencida o próxima a caducar en los siguientes 30 días.</li>
            <li><strong>Acciones Directas:</strong> Botones de navegación a altas de equipo, asignación de responsiva o programación de mantenimiento.</li>
          </ul>
        </div>
      )
    },
    {
      id: 'inventory',
      title: '4. Inventario de Hardware y Etiquetas de Código de Barras',
      category: 'Módulos',
      icon: Laptop,
      tabTarget: 'inventory',
      keywords: ['inventario', 'hardware', 'activos', 'codigo de barras', 'qr', 'chasis', 'etiquetas', 'serie'],
      content: (
        <div className="space-y-4 text-sm text-slate-600">
          <p>
            El catálogo central almacena especificaciones detalladas: procesador, memoria RAM, almacenamiento (SSD/HDD), número de serie, MAC address, costo de compra y póliza de garantía.
          </p>
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Flujo de Alta y Etiquetado:</h4>
            <ol className="list-decimal pl-5 space-y-1.5 text-xs text-slate-700">
              <li>Haga clic en <strong>"Nuevo Activo"</strong> en el módulo de Inventario.</li>
              <li>Ingrese el modelo, marca, número de serie único y sede física de radicación.</li>
              <li>Al guardar, el sistema asigna el folio patrimonial consecutivo (ej. <code>PET-LPT-001</code>).</li>
              <li>Presione el botón <strong>"Imprimir Etiqueta"</strong> para generar el formato adhesivo térmico estándar (Code128 + QR) para el chasis del equipo.</li>
            </ol>
          </div>
        </div>
      )
    },
    {
      id: 'assignments',
      title: '5. Cartas Responsivas y Firma Digital Táctil',
      category: 'Módulos',
      icon: FileText,
      tabTarget: 'assignments',
      keywords: ['responsivas', 'cartas', 'asignacion', 'firma digital', 'comodato', 'resguardo', 'devolucion'],
      content: (
        <div className="space-y-4 text-sm text-slate-600">
          <p>
            La custodia legal del hardware de Petroil se formaliza mediante la <strong>Carta Responsiva en Comodato</strong> con validez interna institucional.
          </p>
          <div className="space-y-3">
            <div className="border-l-2 border-indigo-600 pl-4 py-1">
              <span className="text-xs font-bold text-slate-900 block">Firma Electrónica Táctil:</span>
              <p className="text-xs text-slate-600 mt-1">
                El colaborador puede plasmar su rúbrica directamente en la pantalla de una tableta o mediante ratón óptico. El sistema estampa fecha, hora y datos del equipo.
              </p>
            </div>
            <div className="border-l-2 border-emerald-600 pl-4 py-1">
              <span className="text-xs font-bold text-slate-900 block">Proceso de Devolución / Finiquito:</span>
              <p className="text-xs text-slate-600 mt-1">
                Al concluir la relación laboral o sustituir el equipo, se registra el check-out de devolución, liberando el equipo para reasignación o enviándolo a revisión técnica.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'loans',
      title: '6. Préstamos Temporales de Hardware (Salidas Provisionales)',
      category: 'Módulos',
      icon: Repeat,
      tabTarget: 'loans',
      keywords: ['prestamo', 'prestamos', 'temporales', 'viaje', 'comision', 'devolucion', 'retraso', 'salida'],
      content: (
        <div className="space-y-4 text-sm text-slate-600">
          <p>
            Módulo especializado para el control de hardware prestado temporalmente por comisiones laborales, viajes a plantas, guardias técnicas, auditorías o sustituciones provisionales por reparación.
          </p>
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Flujo Operativo de Préstamos:</h4>
            <ol className="list-decimal pl-5 space-y-2 text-xs text-slate-700">
              <li>
                <strong>Registro de Salida:</strong> Selección del equipo disponible en almacén, colaborador solicitante, fechas de salida y fecha acordada de retorno.
              </li>
              <li>
                <strong>Checklist de Accesorios:</strong> Registro de periféricos incluidos (cargadores, maletines antirrobo, cables HDMI, adaptadores y candados de seguridad).
              </li>
              <li>
                <strong>Firma y Vale Oficial:</strong> Captura de firma digital táctil del solicitante e impresión instantánea del <em>Vale de Préstamo Temporal en PDF</em> con validez legal interna.
              </li>
              <li>
                <strong>Recepción y Devolución:</strong> Al retorno del colaborador, el técnico valida la condición física (Excelente, Bueno, Regular, Dañado), registra observaciones en bitácora y libera el equipo al stock general disponible.
              </li>
            </ol>
          </div>
        </div>
      )
    },
    {
      id: 'maintenance',
      title: '7. Mantenimiento Preventivo, Correctivo & Score Diagnóstico',
      category: 'Módulos',
      icon: Wrench,
      tabTarget: 'maintenance',
      keywords: ['mantenimiento', 'preventivo', 'correctivo', 'score', 'diagnostico', 'reparacion', 'checklist'],
      content: (
        <div className="space-y-4 text-sm text-slate-600">
          <p>
            Permite asegurar la continuidad operativa de los equipos mediante revisiones periódicas obligatorias cada 6 meses.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/50">
              <span className="text-xs font-bold text-slate-800 block mb-1">Checklist Técnico Obligatorio:</span>
              <ul className="list-disc pl-4 space-y-1 text-xs text-slate-600">
                <li>Limpieza interna de disipadores y ventiladores</li>
                <li>Cambio de pasta térmica</li>
                <li>Actualizaciones de seguridad de SO y parches</li>
                <li>Pruebas de estrés de memoria y batería</li>
              </ul>
            </div>
            <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/50">
              <span className="text-xs font-bold text-slate-800 block mb-1">Score Diagnóstico de Salud (1-100):</span>
              <ul className="list-disc pl-4 space-y-1 text-xs text-slate-600">
                <li><strong className="text-emerald-700">90-100:</strong> Condición Excelente (Óptimo)</li>
                <li><strong className="text-cyan-700">75-89:</strong> Buena con desgaste normal</li>
                <li><strong className="text-amber-700">60-74:</strong> Regular (Requiere optimización)</li>
                <li><strong className="text-rose-700">&lt;60:</strong> Crítica (Candidato a renovación)</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'branches',
      title: '7. Sedes, Sucursales y Traslados con Guía de Paquetería',
      category: 'Módulos',
      icon: Truck,
      tabTarget: 'branches',
      keywords: ['sucursales', 'sedes', 'traslados', 'paqueteria', 'guia', 'plantas', 'logistica'],
      content: (
        <div className="space-y-4 text-sm text-slate-600">
          <p>
            Control logístico para el movimiento de activos entre el Corporativo Mazatlán, plantas de almacenamiento y estaciones de servicio en la República Mexicana.
          </p>
          <div className="space-y-2 text-xs text-slate-700">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div>
                <strong>1. Emisión de Traslado:</strong> Selección de sede origen, destino, motivo y empresa de mensajería (DHL, FedEx, Estafeta o Transporte Interno).
              </div>
              <span className="text-[11px] font-mono text-purple-700 font-semibold bg-purple-50 px-2 py-0.5 rounded">En Tránsito</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div>
                <strong>2. Confirmación de Recepción:</strong> El responsable técnico de la sede receptora valida el estado del chasis y da clic en "Confirmar Arribo".
              </div>
              <span className="text-[11px] font-mono text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">Entregado</span>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'geolocation',
      title: '8. Geolocalización de Sedes y Activos',
      category: 'Módulos',
      icon: MapPin,
      tabTarget: 'geolocation',
      keywords: ['geolocalizacion', 'mapa', 'gps', 'coordenadas', 'sedes', 'plantas'],
      content: (
        <div className="space-y-4 text-sm text-slate-600">
          <p>
            Visualización interactiva cartográfica con marcadores clasificados por sede y clusters de equipos. Permite filtrar activos por planta física y desplegar su ficha técnica con un solo clic sobre el marcador del mapa.
          </p>
        </div>
      )
    },
    {
      id: 'agent',
      title: '9. Agente de Telemetría (Windows 11, macOS, Linux, VM)',
      category: 'Agente TI',
      icon: Terminal,
      tabTarget: 'agent-installation',
      keywords: ['agente', 'telemetria', 'windows 11', 'powershell', 'uac', 'script', 'truenas', 'linux', 'curl'],
      content: (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            El agente recolecta automáticamente hardware specs (CPU, RAM, Disco, Serial, MAC, Batería) y los transmite mediante HTTPS/HTTP al servidor en el endpoint <code>/api/v1/telemetry</code>.
          </p>

          <div className="border border-amber-200 bg-amber-50/70 p-4 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-amber-900 font-semibold text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Resolución de Errores Comunes al Ejecutar en Windows 11 / 10:</span>
            </div>
            <ul className="list-disc pl-5 space-y-2 text-xs text-amber-900">
              <li>
                <strong>Error: "No se puede cargar el archivo porque la ejecución de scripts está deshabilitada":</strong>
                <p className="text-slate-700 mt-0.5">Windows 11 bloquea scripts .ps1 por defecto. Para ejecutar el instalador sin modificar la directiva global del sistema operativo, abra PowerShell y corra:</p>
                <div className="mt-1.5 flex items-center justify-between bg-slate-900 text-slate-100 p-2.5 rounded-lg font-mono text-[11px]">
                  <code>powershell -ExecutionPolicy Bypass -File .\install-agent.ps1</code>
                  <button 
                    onClick={() => handleCopy('powershell -ExecutionPolicy Bypass -File .\\install-agent.ps1', 'bypass-cmd')}
                    className="ml-2 text-xs text-indigo-300 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    {copiedSnippet === 'bypass-cmd' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSnippet === 'bypass-cmd' ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>
              </li>
              <li>
                <strong>Error: El script abre en el Bloc de Notas (Notepad) en lugar de ejecutarse:</strong>
                <p className="text-slate-700 mt-0.5">Haga clic derecho en el archivo descargado <code>install-agent.ps1</code> &gt; <em>"Ejecutar con PowerShell"</em> o ábralo desde una consola de PowerShell con privilegios de Administrador.</p>
              </li>
              <li>
                <strong>Error: "El agente se instaló pero no se ve reflejada la información en el programa":</strong>
                <p className="text-slate-700 mt-0.5">
                  1. Vaya a la pestaña <strong>"Equipos Descubiertos por Agente"</strong> dentro del módulo de Instalación de Agente. Los equipos nuevos aparecen allí para ser incorporados al catálogo mediante el botón <em>"Vincular / Agregar a Inventario"</em>.<br />
                  2. Si el firewall corporativo bloquea el puerto 3000, utilice el botón <strong>"Subir JSON de Telemetría Manualmente"</strong> para cargar el diagnóstico generado por el agente en formato .json.
                </p>
              </li>
            </ul>
          </div>

          <div className="border border-slate-200 bg-slate-50 p-4 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-slate-800 font-semibold text-xs">
              <Server className="w-4 h-4 text-indigo-600" />
              <span>Instalación en Máquinas Virtuales TrueNAS / Linux:</span>
            </div>
            <p className="text-xs text-slate-600">
              En instancias virtuales Linux alojadas en TrueNAS SCALE/CORE o servidores Ubuntu, ejecute el script de una sola línea:
            </p>
            <div className="flex items-center justify-between bg-slate-900 text-slate-100 p-2.5 rounded-lg font-mono text-[11px]">
              <code>curl -fsSL http://localhost:3000/api/v1/agent-scripts/linux | bash</code>
              <button 
                onClick={() => handleCopy('curl -fsSL http://localhost:3000/api/v1/agent-scripts/linux | bash', 'linux-cmd')}
                className="ml-2 text-xs text-indigo-300 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                {copiedSnippet === 'linux-cmd' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSnippet === 'linux-cmd' ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'remote-security',
      title: '11. Bloqueo BitLocker Remoto, Bloqueo de Pantalla y Avisos',
      category: 'Seguridad TI',
      icon: Lock,
      tabTarget: 'inventory',
      keywords: ['bitlocker', 'bloqueo', 'remoto', 'pantalla', 'avisos', 'seguridad', 'clave de recuperacion', '48 digitos', 'manage-bde'],
      content: (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            La plataforma permite a los administradores de TI ejecutar acciones de seguridad reactiva y preventiva directamente sobre los equipos con el agente instalado:
          </p>
          <div className="space-y-3">
            <div className="p-3.5 border border-rose-200 bg-rose-50/60 rounded-xl space-y-1">
              <span className="font-bold text-xs text-rose-900 block flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-rose-600" />
                1. Bloqueo Remoto de BitLocker:
              </span>
              <p className="text-xs text-rose-800 leading-relaxed">
                Al solicitar el bloqueo desde la plataforma, el agente ejecuta <code>manage-bde.exe -forcerecovery C:</code> deshabilitando los protectores de arranque del TPM. En el próximo reinicio o encendido en frío, el equipo exigirá la clave numérica de recuperación de 48 dígitos, protegiendo los datos corporativos ante pérdida o robo.
              </p>
            </div>

            <div className="p-3.5 border border-indigo-200 bg-indigo-50/60 rounded-xl space-y-1">
              <span className="font-bold text-xs text-indigo-900 block flex items-center gap-1.5">
                <Monitor className="w-3.5 h-3.5 text-indigo-600" />
                2. Bloqueo Inmediato de Pantalla (LockWorkStation):
              </span>
              <p className="text-xs text-indigo-800 leading-relaxed">
                Fuerza el bloqueo gráfico inmediato del escritorio activo del colaborador mediante <code>rundll32.exe user32.dll,LockWorkStation</code> con opción de temporizador de gracia (10, 15, 30 segundos) y justificación institucional.
              </p>
            </div>

            <div className="p-3.5 border border-amber-200 bg-amber-50/60 rounded-xl space-y-1">
              <span className="font-bold text-xs text-amber-900 block flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-amber-600" />
                3. Envío de Avisos Emergentes en Pantalla:
              </span>
              <p className="text-xs text-amber-800 leading-relaxed">
                Despliega cuadros de diálogo en primer plano con niveles de severidad (Informativo, Advertencia, Bloqueo Inminente) y duración configurable (30s, 60s, 120s) para notificaciones urgentes del área de TI.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'traceability',
      title: '12. Trazabilidad y Línea de Tiempo del Activo',
      category: 'Auditoría',
      icon: History,
      tabTarget: 'inventory',
      keywords: ['trazabilidad', 'linea de tiempo', 'timeline', 'auditoria', 'historial', 'cambios', 'reparaciones'],
      content: (
        <div className="space-y-4 text-sm text-slate-600">
          <p>
            El módulo de <strong>Trazabilidad (AssetTraceability)</strong> integrado en la ficha detallada de cada activo registra de manera inmutable todos los eventos sucedidos al equipo a lo largo de los años.
          </p>
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Filtros de Auditoría Disponibles:</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="font-semibold text-slate-800 block">👤 Asignaciones</span>
                <span className="text-[11px] text-slate-500">Cambios de custodio y firma</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="font-semibold text-slate-800 block">🚚 Traslados</span>
                <span className="text-[11px] text-slate-500">Envíos entre sucursales</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="font-semibold text-slate-800 block">🔧 Reparaciones</span>
                <span className="text-[11px] text-slate-500">Mantenimiento y refacciones</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="font-semibold text-slate-800 block">💻 Alta / Sistema</span>
                <span className="text-[11px] text-slate-500">Registro patrimonial inicial</span>
              </div>
            </div>
            <p className="text-xs text-slate-600 pt-1">
              <strong>Registro Manual de Bitácora:</strong> Si realiza una actualización física (por ejemplo, ampliación de 8GB a 16GB de RAM o cambio de disco SSD), presione <em>"+ Registrar Evento en Bitácora"</em> para documentar fecha, técnico responsable y descripción técnica.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'alerts',
      title: '11. Centro de Alertas y Notificaciones por Correo',
      category: 'Módulos',
      icon: BellRing,
      tabTarget: 'notifications',
      keywords: ['alertas', 'notificaciones', 'correo', 'email', 'garantias', 'mantenimiento'],
      content: (
        <div className="space-y-4 text-sm text-slate-600">
          <p>
            Módulo de monitoreo automático que agrupa alertas según severidad:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-700">
            <li><strong>Mantenimientos Vencidos:</strong> Notificación prioritaria con envío de correo al técnico asignado.</li>
            <li><strong>Pólizas de Garantía Próximas a Expirar:</strong> Recordatorio para renovación o reclamo ante el fabricante antes del plazo límite.</li>
            <li><strong>Simulador / Despacho de Correo:</strong> Envío de formatos pre-redactados de aviso de servicio o recordatorio de firma de responsiva.</li>
          </ul>
        </div>
      )
    },
    {
      id: 'reports',
      title: '12. Centro de Reportes Ejecutivos e Impresión',
      category: 'Módulos',
      icon: Printer,
      tabTarget: 'reports',
      keywords: ['reportes', 'pdf', 'csv', 'impresion', 'auditoria', 'financiero'],
      content: (
        <div className="space-y-4 text-sm text-slate-600">
          <p>
            Generación de documentos institucionales con formato oficial de Petroil listos para entrega a Dirección, Auditoría Interna o Contabilidad:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="border border-slate-200 p-3 rounded-xl bg-white">
              <span className="font-bold text-slate-800 block">Reporte de Inventario</span>
              <p className="text-slate-500 mt-1">Listado completo con número de serie, marcas, modelos y valores en MXN.</p>
            </div>
            <div className="border border-slate-200 p-3 rounded-xl bg-white">
              <span className="font-bold text-slate-800 block">Reporte de Mantenimiento</span>
              <p className="text-slate-500 mt-1">Bitácora semestral de servicios ejecutados, costos e insumos reemplazados.</p>
            </div>
            <div className="border border-slate-200 p-3 rounded-xl bg-white">
              <span className="font-bold text-slate-800 block">Exportación CSV / Excel</span>
              <p className="text-slate-500 mt-1">Base de datos estructurada para conciliación contable patrimonial.</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'faq',
      title: '13. Preguntas Frecuentes (FAQ) y Soporte',
      category: 'Soporte',
      icon: HelpCircle,
      keywords: ['faq', 'preguntas frecuentes', 'soporte', 'ayuda', 'telefono', 'mesa de ayuda', 'contacto'],
      content: (
        <div className="space-y-3">
          <details className="border border-slate-200 rounded-xl p-3 bg-white group">
            <summary className="text-xs font-bold text-slate-800 cursor-pointer list-none flex items-center justify-between">
              <span>¿Qué hacer si un colaborador no puede firmar digitalmente en su dispositivo?</span>
              <ChevronRight className="w-4 h-4 text-slate-400 group-open:rotate-90 transition-transform" />
            </summary>
            <p className="text-xs text-slate-600 mt-2 pl-1 border-t border-slate-100 pt-2 leading-relaxed">
              El técnico puede abrir la carta responsiva en la tableta del departamento de TI o imprimir el formato físico en papel desde el botón "Imprimir PDF", recabar la firma autógrafa y posteriormente adjuntarla o validarla con el checkbox de autorización.
            </p>
          </details>

          <details className="border border-slate-200 rounded-xl p-3 bg-white group">
            <summary className="text-xs font-bold text-slate-800 cursor-pointer list-none flex items-center justify-between">
              <span>¿Cómo dar de baja un equipo dañado o en desuso?</span>
              <ChevronRight className="w-4 h-4 text-slate-400 group-open:rotate-90 transition-transform" />
            </summary>
            <p className="text-xs text-slate-600 mt-2 pl-1 border-t border-slate-100 pt-2 leading-relaxed">
              En la ficha del activo, presione "Editar", cambie el estado a "De Baja" y registre el motivo en la bitácora de trazabilidad. El equipo dejará de computar en los avisos preventivos y quedará archivado para auditoría.
            </p>
          </details>

          <details className="border border-slate-200 rounded-xl p-3 bg-white group">
            <summary className="text-xs font-bold text-slate-800 cursor-pointer list-none flex items-center justify-between">
              <span>Contacto de Mesa de Ayuda TI Grupo Petroil</span>
              <ChevronRight className="w-4 h-4 text-slate-400 group-open:rotate-90 transition-transform" />
            </summary>
            <div className="text-xs text-slate-600 mt-2 pl-1 border-t border-slate-100 pt-2 space-y-1">
              <p><strong>Correo electrónico:</strong> soporte.ti@grupopetroil.com.mx</p>
              <p><strong>Extensión interna:</strong> Ext. 2400 / 2401</p>
              <p><strong>Horario de atención:</strong> Lunes a Viernes de 08:00 a 18:30 hrs (Hora del Pacífico)</p>
            </div>
          </details>
        </div>
      )
    }
  ], [copiedSnippet]);

  // Search filter
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return sections;
    const q = searchQuery.toLowerCase();
    return sections.filter(sec => 
      sec.title.toLowerCase().includes(q) ||
      sec.category.toLowerCase().includes(q) ||
      sec.keywords.some(k => k.includes(q))
    );
  }, [sections, searchQuery]);

  const activeSection = sections.find(s => s.id === activeSectionId) || sections[0];

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full">
              Documentación Oficial v2.4.1 LTS
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500">Grupo Petroil TI</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Manual de Usuario y Operación
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Guía integral de procedimientos, instalación de agente, cartas responsivas, trazabilidad y resolución de errores.
          </p>
        </div>

        {/* Global Documentation Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleDownloadMarkdown}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            title="Descargar archivo Markdown completo"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Descargar .md</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer"
            title="Imprimir o guardar como PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir en PDF</span>
          </button>
        </div>
      </div>

      {/* Interactive Two-Column Reader */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Table of Contents / Search */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-4 lg:sticky lg:top-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar tema, error, Windows 11, código..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>

          <div className="space-y-1 max-h-[600px] overflow-y-auto pr-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 block mb-1">
              Capítulos del Manual ({filteredSections.length})
            </span>
            {filteredSections.map((sec) => {
              const Icon = sec.icon;
              const isSelected = activeSectionId === sec.id;
              return (
                <button
                  key={sec.id}
                  onClick={() => setActiveSectionId(sec.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs transition-all cursor-pointer group ${
                    isSelected 
                      ? 'bg-indigo-600 text-white font-medium shadow-xs' 
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-slate-400 group-hover:text-indigo-600'}`} />
                    <span className="truncate">{sec.title}</span>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 shrink-0 opacity-60 ${isSelected ? 'text-white' : 'text-slate-300'}`} />
                </button>
              );
            })}
          </div>

          {/* Quick Support Callout */}
          <div className="pt-3 border-t border-slate-100">
            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
              <span className="font-semibold text-slate-800 block">¿Dudas o soporte urgente?</span>
              <p className="text-slate-500 text-[11px]">Contacte a la Mesa de Ayuda TI en Mazatlán, Sinaloa.</p>
              <span className="font-mono text-[11px] text-indigo-600 font-semibold block pt-0.5">soporte.ti@grupopetroil.com.mx</span>
            </div>
          </div>
        </div>

        {/* Right Content Pane */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 lg:p-8 shadow-xs space-y-6">
          {/* Section Title Header */}
          <div className="border-b border-slate-100 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 block mb-1">
                {activeSection.category}
              </span>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <activeSection.icon className="w-5 h-5 text-indigo-600 shrink-0" />
                <span>{activeSection.title}</span>
              </h2>
            </div>

            {/* Jump to live module if available */}
            {activeSection.tabTarget && onNavigate && (
              <button
                onClick={() => onNavigate(activeSection.tabTarget!)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors shrink-0 cursor-pointer"
              >
                <span>Ir al Módulo</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Section Body */}
          <div className="text-slate-700 leading-relaxed">
            {activeSection.content}
          </div>

          {/* Section Bottom Navigation Footer */}
          <div className="border-t border-slate-100 pt-5 flex items-center justify-between">
            {(() => {
              const currentIndex = sections.findIndex(s => s.id === activeSection.id);
              const prev = currentIndex > 0 ? sections[currentIndex - 1] : null;
              const next = currentIndex < sections.length - 1 ? sections[currentIndex + 1] : null;

              return (
                <>
                  {prev ? (
                    <button
                      onClick={() => setActiveSectionId(prev.id)}
                      className="text-xs font-medium text-slate-600 hover:text-indigo-600 flex items-center gap-1 cursor-pointer"
                    >
                      <span>← {prev.title.split('.')[1] || prev.title}</span>
                    </button>
                  ) : <div />}

                  {next ? (
                    <button
                      onClick={() => setActiveSectionId(next.id)}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                    >
                      <span>{next.title.split('.')[1] || next.title} →</span>
                    </button>
                  ) : <div />}
                </>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};
