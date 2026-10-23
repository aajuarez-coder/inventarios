# 📘 MANUAL DE USUARIO — SISTEMA INTEGRAL DE GESTIÓN DE ACTIVOS TI (PETROIL ITASSET)
**Versión de la Plataforma:** 2.4.1 LTS  
**Organización:** Grupo Petroil — Dirección de Tecnologías de la Información  
**Documento:** Manual Oficial de Operación y Procedimientos de Hardware  
**Fecha de Publicación:** Octubre 2026  

---

## 📑 ÍNDICE GENERAL

1. [Introducción y Objetivos del Sistema](#1-introducción-y-objetivos-del-sistema)
2. [Roles de Usuario y Matriz de Permisos (RBAC)](#2-roles-de-usuario-y-matriz-de-permisos-rbac)
3. [Inicio de Sesión y Acceso a la Plataforma](#3-inicio-de-sesión-y-acceso-a-la-plataforma)
4. [Módulo 1: Tablero de Control y Estadísticas (Dashboard)](#4-módulo-1-tablero-de-control-y-estadísticas-dashboard)
5. [Módulo 2: Inventario de Hardware](#5-módulo-2-inventario-de-hardware)
   - 5.1 Alta de Nuevos Equipos
   - 5.2 Búsqueda y Filtros Multicriterio
   - 5.3 Códigos de Barras y Etiquetas QR para Chasis
   - 5.4 Exportación de Listados de Inventario en PDF Institucional
6. [Módulo 3: Directorio de Colaboradores](#6-módulo-3-directorio-de-colaboradores)
7. [Módulo 4: Cartas Responsivas y Firma Digital](#7-módulo-4-cartas-responsivas-y-firma-digital)
   - 7.1 Creación de Asignaciones en Comodato
   - 7.2 Panel de Firma Digital Táctil / Ratón
   - 7.3 Generación e Impresión del Formato Oficial de Responsiva
   - 7.4 Devolución y Finiquito de Resguardo
8. [Módulo 5: Mantenimiento Preventivo y Reparaciones](#8-módulo-5-mantenimiento-preventivo-y-reparaciones)
   - 8.1 Cronograma Semestral y Semáforo de Vencimiento
   - 8.2 Registro de Mantenimientos y Checklists Técnicos
   - 8.3 Calificación Diagnóstica de Hardware (Score 1-100) y Costos
9. [Módulo 6: Sucursales y Traslados entre Sedes](#9-módulo-6-sucursales-y-traslados-entre-sedes)
   - 9.1 Catálogo de Sucursales y Plantas
   - 9.2 Órdenes de Traslado y Guías de Paquetería
   - 9.3 Confirmación de Arribo en Destino
10. [Módulo 7: Geolocalización TI](#10-módulo-7-geolocalización-ti)
11. [Módulo 8: Agente de Telemetría (Windows, macOS, Linux)](#11-módulo-8-agente-de-telemetría-windows-macos-linux)
    - 11.1 Requisitos Mínimos por Sistema Operativo
    - 11.2 Métodos de Instalación en Windows 11/10
    - 11.3 Resolución de Errores Comunes en Windows 11 (Políticas, UAC, Notepad)
    - 11.4 Alojamiento en Máquina Virtual TrueNAS
    - 11.5 Diagnóstico y Carga Manual de Telemetría (.json)
    - 11.6 Incorporación de Equipos Descubiertos al Inventario
12. [Módulo 9: Trazabilidad y Línea de Tiempo del Activo](#12-módulo-9-trazabilidad-y-línea-de-tiempo-del-activo)
    - 12.1 Visualización de Trazabilidad en AssetDetailModal
    - 12.2 Filtros de Auditoría (Usuarios, Traslados, Reparaciones, Altas)
    - 12.3 Registro Manual de Cambios en Bitácora
13. [Módulo 10: Centro de Alertas y Notificaciones por Correo](#13-módulo-10-centro-de-alertas-y-notificaciones-por-correo)
14. [Módulo 11: Centro de Reportes Ejecutivos](#14-módulo-11-centro-de-reportes-ejecutivos)
15. [Módulo 12: Administración de Usuarios y Seguridad](#15-módulo-12-administración-de-usuarios-y-seguridad)
16. [Preguntas Frecuentes (FAQ) y Soporte](#16-preguntas-frecuentes-faq-y-soporte)

---

## 1. INTRODUCCIÓN Y OBJETIVOS DEL SISTEMA

El **Sistema de Gestión de Activos de Hardware Petroil ITAsset** es la solución centralizada desarrollada para registrar, monitorear, auditar y controlar el ciclo de vida completo de los recursos informáticos (computadoras portátiles, estaciones de trabajo, servidores, conmutadores, impresoras y periféricos) en todas las sedes y plantas industriales de Petroil.

### Objetivos Clave:
- **Cero Extravíos:** Control estricto de custodia legal mediante cartas responsivas con firma electrónica digital de colaboradores.
- **Mantenimiento Proactivo:** Prevención de fallas mediante alertas automáticas antes del vencimiento de pólizas de garantía y mantenimientos periódicos.
- **Logística Transparente:** Rastreo de equipos enviados entre sucursales mediante órdenes de traslado con folios y guías de mensajería.
- **Automatización mediante Agente:** Telemetría directa desde equipos Windows, macOS y Linux que recopila hardware real sin intervención manual.
- **Trazabilidad 360°:** Auditoría cronológica de cada cambio de usuario, traslado de sede y reparación técnica sufrida por cada activo.

---

## 2. ROLES DE USUARIO Y MATRIZ DE PERMISOS (RBAC)

El sistema cuenta con un modelo de Control de Acceso Basado en Roles (**RBAC**) para salvaguardar la integridad de los datos institucionales:

| Rol | Título Institucional | Permisos Principales |
| :--- | :--- | :--- |
| **edicion_total** | Super Administrador TI | Acceso total a todos los módulos: creación, edición, borrado, baja de equipos, firma de responsivas, gestión de sucursales y administración de usuarios. |
| **admin_ti** | Administrador de Infraestructura | Gestión completa de activos, asignación de responsivas, traslados, mantenimientos y enrolamiento de agentes. |
| **soporte_tecnico** | Ingeniero de Soporte / Taller | Registro y conclusión de mantenimientos preventivos y correctivos, diagnóstico técnico y visualización de inventario. |
| **almacenista** | Encargado de Almacén y Logística | Despacho y confirmación de arribo de traslados, alta inicial de compras y gestión de inventario en bodega. |
| **visor** | Auditor / Consulta (Solo Lectura) | Consulta de estadísticas, lectura de inventario, visualización de trazabilidad y descarga de reportes PDF. No puede modificar ni borrar datos. |

---

## 3. INICIO DE SESIÓN Y ACCESO A LA PLATAFORMA

1. Ingrese a la URL institucional del sistema (servidor local, VM TrueNAS o enlace en la nube).
2. En la pantalla de autenticación:
   - Ingrese su **Correo Institucional Petroil** (ej. `aajuarez@petroil.com.mx`, `cmendoza@petroil.com.mx`) o su nombre de usuario asignado (`admin`, `ti`, `visor`).
   - Introduzca su contraseña (o la contraseña institucional temporal autorizada: `admin123`).
3. Al hacer clic en **"Iniciar Sesión en Petroil ITAsset"**, el sistema validará sus credenciales y cargará la interfaz con los permisos correspondientes a su rol.
4. Para cerrar sesión de forma segura, haga clic en el botón **"Cerrar Sesión"** ubicado en la esquina superior derecha o en la parte inferior de la barra lateral.

---

## 4. MÓDULO 1: TABLERO DE CONTROL Y ESTADÍSTICAS (DASHBOARD)

El tablero de control ofrece una vista ejecutiva panorámica en tiempo real:

- **Indicadores Clave (KPIs):**
  - **Total de Equipos:** Activos inventariados en toda la empresa.
  - **Equipos en Operación:** Laptops y estaciones de trabajo asignadas activamente a colaboradores.
  - **Disponibles en Almacén:** Stock listo para ser asignado o despachado a sucursales.
  - **En Taller / Mantenimiento:** Equipos en revisión técnica preventiva o correctiva.
- **Alertas Prioritarias:** Muestra equipos con garantías próximas a expirar en menos de 30 días y servicios técnicos pendientes.
- **Distribución por Categorías:** Gráfica interactiva de Laptops, Desktops, Servidores, Dispositivos de Red e Impresoras.
- **Activos por Sucursal:** Conteo desglosado por planta (Torre Central CDMX, Planta Monterrey, Guadalajara, etc.).

---

## 5. MÓDULO 2: INVENTARIO DE HARDWARE

Este módulo es el núcleo del catálogo de equipos de la empresa.

### 5.1 Alta de Nuevos Equipos
1. Haga clic en el botón superior **"+ Nuevo Equipo"** (disponible para roles con permisos de escritura).
2. Complete la ficha técnica institucional:
   - **Placa de Inventario (Asset Tag):** Código interno institucional (ej. `EQ-LAP-015`).
   - **Número de Serie (S/N):** Serial físico de fabricante (BIOS / Placa Madre).
   - **Categoría y Tipo:** Laptop, Desktop, Servidor, Impresora, etc.
   - **Marca y Modelo:** Ej. *Lenovo ThinkPad T14 Gen 4*, *Apple MacBook Pro 16" M3*, *Dell OptiPlex 7010*.
   - **Especificaciones de Hardware:** Procesador (CPU), Memoria RAM, Almacenamiento (SSD/HDD), Sistema Operativo, Dirección MAC e IP.
   - **Ubicación y Sede:** Selección de la sucursal de Petroil y ubicación interna (ej. *Oficina Contraloría Piso 2*).
   - **Datos de Compra y Proveedor:** Costo de adquisición (MXN), Proveedor, Número de Factura, Fecha de Adquisición y Vencimiento de Garantía.
3. Presione **"Guardar Activo"** para darlo de alta en el sistema.

### 5.2 Búsqueda y Filtros Multicriterio
- **Buscador en Vivo:** Escriba cualquier término (Asset Tag, número de serie, modelo, colaborador o procesador) para filtrar los resultados instantáneamente.
- **Filtro por Sede:** Desglose equipos pertenecientes a una planta específica.
- **Filtro por Estado:** En almacén disponible, asignado, en taller o en traslado.
- **Filtro por Categoría:** Laptops, PCs, Servidores o Periféricos.

### 5.3 Códigos de Barras y Etiquetas QR para Chasis
1. En la tabla de inventario, haga clic en el equipo para abrir su detalle.
2. Seleccione la pestaña **"Placa y Código de Barras"**.
3. Se generará la etiqueta física corporativa de Petroil con:
   - Logo oficial de Petroil.
   - Código de barras Code128 con la placa de activo.
   - Código QR para escaneo rápido con dispositivos móviles.
   - Datos clave: Serial, Modelo y Teléfono de Soporte TI.
4. Presione **"Imprimir Etiqueta"** para imprimir en papel autoadhesivo térmico y colocar en el chasis del equipo.

### 5.4 Exportación de Listados de Inventario en PDF Institucional
1. En la parte superior derecha del Inventario, haga clic en el botón **"Exportar a PDF"**.
2. El sistema compilará la información visible (aplicando los filtros vigentes) y generará un documento institucional oficial con:
   - Membrete y Logotipo oficial de Grupo Petroil.
   - Fecha y hora exacta de emisión.
   - Nombre del operador responsable de la emisión.
   - Tabla estructurada con Placas, Números de Serie, Modelos, Sedes, Estados y Colaboradores en posesión.
3. El archivo PDF se descargará automáticamente y estará listo para imprimir o anexar a auditorías corporativas.

---

## 6. MÓDULO 3: DIRECTORIO DE COLABORADORES

Permite consultar el personal de la empresa y los recursos tecnológicos bajo su custodia:
- **Ficha del Empleado:** Nombre completo, Número de Nómina, Departamento, Puesto, Correo Electrónico y Sede.
- **Equipos en Posesión:** Muestra en tiempo real qué computadora, monitor o periférico tiene asignado.
- **Acción Rápida de Asignación:** Botón directo para asignarle un equipo del almacén sin salir del directorio.

---

## 7. MÓDULO 4: CARTAS RESPONSIVAS Y FIRMA DIGITAL

Este módulo formaliza legalmente la entrega de herramientas de trabajo informáticas.

### 7.1 Creación de Asignaciones en Comodato
1. Seleccione un equipo en estado *"Disponible en Almacén"* y haga clic en **"Asignar a Colaborador"**.
2. Seleccione el colaborador receptor de la lista desplegable.
3. Verifique y marque los accesorios entregados:
   - Cable de corriente / Cargador original.
   - Maletín o mochila ejecutiva.
   - Mouse inalámbrico / Teclado.
   - Candado de seguridad / Adaptadores de video.
4. Redacte observaciones sobre las condiciones físicas del equipo (ej. *"Equipo nuevo sin detalles estéticos, software antivirus corporativo instalado"*).

### 7.2 Panel de Firma Digital Táctil / Ratón
1. En la sección de firmas de la responsiva:
   - **Firma del Colaborador:** El usuario firma directamente en el recuadro digital utilizando una pantalla táctil, lápiz óptico o ratón.
   - **Firma del Personal de TI:** El ingeniero de soporte o administrador de TI plasma su firma como emisor de la entrega.
2. El sistema incorpora un botón de *"Limpiar Firma"* para repetir el trazo si es necesario.
3. Las firmas se guardan codificadas de forma permanente en la base de datos de la responsiva.

### 7.3 Generación e Impresión del Formato Oficial de Responsiva
1. Al completarse la asignación, se genera automáticamente el **Folio de Responsiva** institucional (ej. `RESP-2026-0042`).
2. Haga clic en **"Imprimir Carta Responsiva (PDF)"**.
3. Se generará un documento formal de 2 páginas que incluye:
   - Membrete y encabezado de Petroil.
   - Cláusulas legales de comodato, confidencialidad, uso no indebido y reporte de incidentes.
   - Ficha técnica completa del equipo entregado y sus accesorios.
   - Recuadros con las dos firmas digitales incrustadas y sellos de tiempo.

### 7.4 Devolución y Finiquito de Resguardo
1. Cuando un colaborador deja el puesto o cambia de equipo, busque la responsiva activa en el módulo.
2. Haga clic en **"Registrar Devolución"**.
3. Capture el estado físico en que se recibe el activo y confirme la entrega.
4. El equipo volverá automáticamente a estado *"Disponible en Almacén"* y el evento quedará asentado en la trazabilidad del activo.

---

## 8. MÓDULO 5: MANTENIMIENTO PREVENTIVO Y REPARACIONES

Asegura el funcionamiento ininterrumpido del parque computacional.

### 8.1 Cronograma Semestral y Semáforo de Vencimiento
Los equipos cuentan con un ciclo programado de mantenimiento (habitualmente cada 6 meses):
- 🟢 **Al Día:** Servicio vigente y sin anomalías.
- 🟡 **Próximo a Vencer (< 14 días):** Requiere coordinar fecha con el colaborador.
- 🔴 **Vencido:** Requiere intervención prioritaria de soporte técnico.

### 8.2 Registro de Mantenimientos y Checklists Técnicos
1. Haga clic en **"Registrar Mantenimiento"** sobre el equipo a intervenir.
2. Seleccione el tipo de servicio:
   - **Preventivo:** Limpieza física interna, soplado de ventiladores, cambio de pasta térmica, actualización de parches y BIOS.
   - **Correctivo:** Reparación de componentes dañados (pantalla, teclado, fuente de poder, disco duro).
   - **Actualización de Hardware:** Incremento de memoria RAM, migración a SSD NVMe.
   - **Limpieza Profunda:** Descontaminación de polvo en plantas o bodegas industriales.
3. Ingrese el técnico responsable, el costo incurrido (MXN) y marque las casillas del checklist de tareas realizadas.

### 8.3 Calificación Diagnóstica de Hardware (Score 1-100) y Costos
- Asigne un puntaje cuantitativo (ej. *95/100 Puntos*) según el estado de salud de batería, sectores S.M.A.R.T. de disco y temperatura bajo carga.
- El costo se acumula automáticamente en el historial financiero del activo.

---

## 9. MÓDULO 6: SUCURSALES Y TRASLADOS ENTRE SEDES

Gestiona la movilidad física de equipos entre las diferentes ubicaciones de Petroil.

### 9.1 Catálogo de Sucursales y Plantas
Permite registrar y consultar información de cada sede:
- Dirección completa, ciudad y estado.
- Teléfono y Encargado o Administrador de la sucursal.
- Coordenadas geográficas para su visualización en el mapa interactivo.

### 9.2 Órdenes de Traslado y Guías de Paquetería
1. Para enviar uno o varios equipos a otra sede, presione **"+ Nueva Orden de Traslado"**.
2. Seleccione la sucursal de origen y la de destino.
3. Agregue los activos a despachar de la lista de equipos disponibles.
4. Ingrese la empresa de mensajería (ej. *DHL Express, Estafeta, Transporte Interno Petroil*) y el **Número de Guía de Rastreo**.
5. Al guardar, los equipos cambian su estado a *"En Traslado"*, impidiendo que sean asignados localmente mientras viajan.

### 9.3 Confirmación de Arribo en Destino
1. Cuando la paquetería entrega el paquete en la sucursal de destino, el encargado abre el módulo de traslados.
2. Localiza la orden en tránsito y presiona **"Confirmar Recepción"**.
3. Captura el nombre de quien recibe e inspecciona los equipos.
4. Los activos pasan automáticamente a pertenecer a la nueva sucursal y quedan *"Disponibles"* en el almacén local.

---

## 10. MÓDULO 7: GEOLOCALIZACIÓN TI

Visualización espacial del parque computacional:
- **Mapa Satelital e Híbrido:** Despliega marcadores interactivos en cada planta y sucursal corporativa de Petroil en la República Mexicana.
- **Inspección de Sedes:** Al hacer clic en una sucursal, se despliega el listado de computadoras, servidores y conmutadores operando en esa coordenada.
- **Rutas de Traslado:** Muestra visualmente las trayectorias de los envíos en tránsito entre ciudades.

---

## 11. MÓDULO 8: AGENTE DE TELEMETRÍA (WINDOWS, MACOS, LINUX)

El Agente Petroil Daemon permite auditar terminales de cómputo en segundo plano y enviar automáticamente las especificaciones técnicas hacia el sistema central.

### 11.1 Requisitos Mínimos por Sistema Operativo
- **Microsoft Windows:** Windows 10 (Build 19041+) o Windows 11 (21H2, 22H2, 23H2, 24H2) de 64 bits.
- **Apple macOS:** macOS 15.0 Sequoia o versiones superiores.
- **Linux:** Ubuntu 25.04 (Plucky Puffin) o superior con `systemd`.

### 11.2 Métodos de Instalación en Windows 11 / 10
En la pestaña **"Instalación de Agente"**, seleccione la tarjeta de Windows. Dispone de 3 métodos:

1. **Método Recomendado (Lanzador 1-Clic .bat):**
   - Haga clic en **"Descargar Lanzador 1-Clic (.bat)"**.
   - En la máquina Windows, haga doble clic sobre `Instalar-Agente-Windows.bat`.
   - El script solicitará elevación de Administrador (UAC), omitirá restricciones y completará la instalación en 10 segundos.

2. **Método Script PowerShell (.ps1):**
   - Descargue `Install-PetroilAgent.ps1`.
   - Abra PowerShell como Administrador (`Win + X` $\rightarrow$ *Terminal (Administrador)*).
   - Ejecute:
     ```powershell
     Unblock-File .\Install-PetroilAgent.ps1
     powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\Install-PetroilAgent.ps1
     ```

3. **Método Remoto One-Liner (Red Local / VM TrueNAS):**
   - Ejecute en PowerShell:
     ```powershell
     Set-ExecutionPolicy Bypass -Scope Process -Force; iex (irm 'http://<IP_SERVIDOR>:3000/api/v1/agent/install-windows.ps1')
     ```

### 11.3 Resolución de Errores Comunes en Windows 11
- **Error de Directiva (`PSSecurityException`):** Windows 11 bloquea scripts no firmados.  
  *Solución:* Ejecute en PowerShell: `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force`.
- **Se abre en Bloc de Notas (Notepad):** El doble clic en Windows 11 está configurado para editar `.ps1`.  
  *Solución:* Utilice el archivo `Instalar-Agente-Windows.bat` o haga clic derecho $\rightarrow$ *"Ejecutar con PowerShell"*.
- **Falta de Administrador:** El agente requiere escribir en `C:\ProgramData\Petroil`.  
  *Solución:* Abra Terminal con `Win + X` seleccionando *"Terminal (Administrador)"*. El instalador actual incluye auto-elevación UAC integrada.

### 11.4 Alojamiento en Máquina Virtual TrueNAS
Si aloja el sistema en una VM de TrueNAS:
1. Configure una dirección IP estática en la VM (ej. `192.168.1.150`).
2. En los parámetros de enrolamiento, establezca el campo **"URL del Servidor / VM TrueNAS"** apuntando a esa IP (ej. `http://192.168.1.150:3000`).
3. El agente de las máquinas cliente se comunicará directamente con dicha dirección.

### 11.5 Diagnóstico y Carga Manual de Telemetría (.json)
Si una máquina cliente está en una red aislada o con cortafuegos estricto:
1. El script genera una copia de la auditoría en su **Escritorio**: `Petroil-Auditoria-Equipo.json` (y en `C:\ProgramData\Petroil\ITAssetAgent\telemetry.json`).
2. En la pantalla del Agente en el sistema, presione **"Cargar Telemetría Manual (.json)"**.
3. Arrastre el archivo y el equipo aparecerá inmediatamente.

Para forzar el envío inmediato sin esperar 15 minutos, ejecute en PowerShell:
```powershell
& "C:\ProgramData\Petroil\ITAssetAgent\PetroilCollector.ps1"
```

### 11.6 Incorporación de Equipos Descubiertos al Inventario
1. En la tabla **"Terminales y Agentes Detectados"**, localice la fila del equipo recién descubierto.
2. Haga clic en el botón verde **"[ + Incorporar a Inventario ]"**.
3. El sistema creará automáticamente la ficha de hardware asignándole su placa oficial (`EQ-PC-xxx` o `EQ-LAP-xxx`), vinculando el procesador, memoria RAM, discos y serial del BIOS.

---

## 12. MÓDULO 9: TRAZABILIDAD Y LÍNEA DE TIEMPO DEL ACTIVO

El componente de Trazabilidad (`AssetTraceability`) unifica todo el historial histórico del equipo en un solo lugar.

### 12.1 Visualización de Trazabilidad en AssetDetailModal
1. Haga clic sobre cualquier equipo en el Inventario para abrir su modal de detalle.
2. Seleccione la pestaña **"Trazabilidad & Línea de Tiempo"**.
3. Se desplegará la línea de tiempo vertical cronológica (del evento más reciente al más antiguo).

### 12.2 Filtros de Auditoría
Utilice la barra segmentada para auditar aspectos específicos:
- **Todos:** Vista global acumulada.
- **Cambios de Usuario:** Asignaciones históricas, folios de responsivas y devoluciones.
- **Traslados:** Despachos y recepciones entre sucursales.
- **Reparaciones y Servicio:** Mantenimientos preventivos y correctivos con técnico y costo.
- **Altas y Hardware:** Compra inicial, facturación y modificaciones físicas.

### 12.3 Registro Manual de Cambios en Bitácora
1. En la parte superior de la Trazabilidad, presione el botón **"+ Registrar Evento"**.
2. Seleccione la categoría del cambio (Usuario, Traslado, Reparación o Hardware).
3. Ingrese el título (ej. *"Reemplazo de cargador USB-C por daño físico"*), observaciones y autor.
4. Presione **"Guardar en Bitácora"**. El cambio se registrará permanentemente en el historial del activo.

---

## 13. MÓDULO 10: CENTRO DE ALERTAS Y NOTIFICACIONES POR CORREO

Centraliza los avisos críticos del parque computacional:
- **Pólizas de Garantía por Expirar:** Notifica con anticipación para tramitar reclamaciones con fabricantes (Dell, Lenovo, HP, Apple).
- **Mantenimientos Semestrales Vencidos o Próximos:** Envío de correos automáticos al colaborador citándolo a servicio.
- **Simulador de Envío de Correo:** Permite previsualizar la plantilla de correo institucional de Petroil antes del despacho real.

---

## 14. MÓDULO 11: CENTRO DE REPORTES EJECUTIVOS

Permite exportar información consolidada para gerencia, auditoría fiscal y contraloría:
1. Seleccione el tipo de reporte:
   - **Reporte General de Inventario de Hardware.**
   - **Historial Completo de Mantenimiento y Costos.**
   - **Pólizas y Resguardo de Activos por Empleado.**
2. Presione **"Imprimir / Exportar Reporte Institucional en PDF"**.
3. El documento se genera con el logotipo oficial de Petroil, fecha de corte, firmas de autorización y tablas tabulares listas para impresión en papel membretado.

---

## 15. MÓDULO 12: ADMINISTRACIÓN DE USUARIOS Y SEGURIDAD

Disponible para administradores para dar de alta operadores del sistema:
- **Creación de Cuentas:** Nombre, correo electrónico, contraseña y asignación de rol.
- **Activación / Suspensión:** Botón para suspender el acceso de un operador sin borrar su historial.
- **Respaldo y Restauración JSON:** Permite exportar una copia completa de la base de datos en archivo `.json` para salvaguarda en servidores fríos o migración entre instancias.

---

## 16. MÓDULO: PRÉSTAMOS TEMPORALES DE HARDWARE (SALIDAS PROVISIONALES)

El módulo de **Préstamos de Equipos** resuelve la necesidad operativa de prestar laptops, proyectores, periféricos o cargadores de forma provisional (comisiones, viajes a plantas, guardias técnicas, auditorías o sustituciones temporales mientras el equipo titular se encuentra en mantenimiento).

### 16.1 Flujo de Registro de Préstamo
1. Navegue al módulo **"Préstamos de Equipos"** en el menú lateral.
2. Haga clic en **"Nuevo Préstamo de Equipo"**.
3. Seleccione el activo disponible en almacén y el colaborador solicitante.
4. Establezca la **Fecha de Salida** y la **Fecha Estimada de Devolución** (el sistema calcula automáticamente los días vigentes o de retraso).
5. Marque los accesorios incluidos en la salida (cargador original, mochila protectora, mouse inalámbrico, adaptador HDMI, candado Kensington).
6. Capture opcionalmente la **Firma Digital Táctil** del colaborador.
7. Al guardar, se genera el folio institucional consecutivo (ej. `PREST-2026-001`).

### 16.2 Recepción y Devolución de Equipos Prestados
- Al vencer o concluir el préstamo, presione el botón **"Devolver"**.
- El técnico valida el estado físico (Excelente, Bueno, Regular, Dañado) y anota el checklist de cables/accesorios devueltos.
- Al confirmar la devolución, el activo se libera inmediatamente de regreso al stock **"Disponible"** del inventario general y queda registrado en la bitácora de trazabilidad.

### 16.3 Impresión Oficial de Vale de Salida Temporal
- Cada préstamo cuenta con un botón de **Impresión en PDF** con diseño membretado institucional de Grupo Petroil, incluyendo responsabilidades legales de custodia y recuadros de firmas.

---

## 17. MÓDULO: SEGURIDAD REMOTA, BLOQUEO BITLOCKER Y AVISOS EN PANTALLA

Este módulo permite a los administradores y técnicos de TI ejecutar directivas de seguridad inmediatas en terminales Windows que cuenten con el agente de telemetría Petroil ITAsset activo.

### 17.1 Bloqueo Remoto de Cifrado BitLocker
- **Objetivo:** Ante sospecha de robo, extravío o desvinculación laboral no entregada, el administrador puede ordenar el bloqueo del volumen del sistema operativo (`C:`).
- **Mecanismo:** El agente invoca:
  ```powershell
  manage-bde.exe -forcerecovery C:
  ```
  Esto deshabilita temporalmente la liberación automática mediante el TPM 2.0. En el próximo reinicio o encendido en frío, el equipo muestra la pantalla azul de BitLocker exigiendo obligatoriamente la clave numérica de recuperación de 48 dígitos.
- **Clave de Recuperación de 48 Dígitos:** La plataforma almacena y permite revelar, copiar e imprimir la ficha confidencial con los 8 bloques de números (ej. `582914-381920-491028-192847-592817-482910-384918-294819`).
- **Desbloqueo / Restauración:** Una vez recuperado el equipo y validada la identidad, el técnico puede ingresar la clave o enviar el comando **"Desbloquear / Restaurar TPM"** para reanudar el arranque seguro normal.

### 17.2 Bloqueo Inmediato de Pantalla (LockWorkStation)
- **Función:** Cierra la visualización del escritorio activo del colaborador mediante:
  ```powershell
  rundll32.exe user32.dll,LockWorkStation
  ```
- **Configuración:** Permite establecer una cuenta regresiva previa en pantalla (10, 15, 30 segundos) con la justificación del área de TI antes de bloquear la sesión.

### 17.3 Envío de Avisos Emergentes en Pantalla
- **Uso:** Comunicación directa de alta prioridad desde la consola central al escritorio del colaborador.
- **Niveles de Urgencia:**
  - *Informativo (Azul):* Recordatorios de inventario y políticas.
  - *Advertencia (Ámbar):* Próximo mantenimiento preventivo programado o fin de póliza.
  - *Crítico (Rojo):* Notificación de bloqueo inminente por auditoría o reporte de extravío.
- **Duración Configurable:** Permite definir si el diálogo permanece en pantalla 30, 60, 120 o 300 segundos.

---

## 18. PREGUNTAS FRECUENTES (FAQ) Y SOPORTE

### P: ¿Por qué instalé el agente en Windows y no se ve reflejada la información de inmediato?
**R:** El agente programa una tarea periódica cada 15 minutos. Para forzar el reporte de inmediato, ejecute en PowerShell como Administrador:
```powershell
& "C:\ProgramData\Petroil\ITAssetAgent\PetroilCollector.ps1"
```
O bien, utilice el botón **"Cargar Telemetría Manual (.json)"** y seleccione el archivo `Petroil-Auditoria-Equipo.json` que el script guardó en su Escritorio.

### P: ¿Cómo paso un equipo reportado por el agente al inventario general?
**R:** En la pestaña *"Instalación de Agente"*, ubique la tabla *"Terminales y Agentes Detectados"* y haga clic en el botón verde **"Incorporar a Inventario"**. El equipo quedará registrado formalmente con su placa de activo.

### P: ¿Qué sucede si el colaborador no firma la carta responsiva en ese momento?
**R:** La asignación queda guardada con el estado *"Pendiente de firma"*. Posteriormente, puede abrir la responsiva, presionar *"Completar Firma"* y solicitar al colaborador su firma digital.

### P: ¿Puedo usar el sistema en tabletas o iPads en bodega?
**R:** Sí. El diseño es 100% responsivo y permite capturar firmas táctiles directamente con el dedo o Apple Pencil/Stylus.

---
**Dirección de Tecnologías de la Información — Grupo Petroil**  
*Mesa de Ayuda TI:* soporte-ti@petroil.com.mx  
*Línea de Asistencia:* Ext. 4040 / 4041  
*Mazatlán, Sinaloa · Ciudad de México · Monterrey · Guadalajara*
