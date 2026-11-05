import { getAccessToken } from './googleAuth';

export interface GmailProfile {
  emailAddress: string;
  messagesTotal: number;
  threadsTotal: number;
  historyId: string;
}

export interface SendEmailPayload {
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  htmlBody: string;
  plainText?: string;
}

export interface GmailMessageSummary {
  id: string;
  threadId: string;
  snippet: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  labelIds: string[];
}

/**
 * Encodes a string into standard Base64 using UTF-8 byte stream.
 */
export function utf8ToBase64(str: string): string {
  const utf8Bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < utf8Bytes.length; i++) {
    binary += String.fromCharCode(utf8Bytes[i]);
  }
  return btoa(binary);
}

/**
 * Encodes a string into standard Base64URL without padding for Gmail API raw message payload.
 */
export function toBase64Url(str: string): string {
  const base64 = utf8ToBase64(str);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Builds an RFC 2822 compliant MIME email string with UTF-8 Base64 content transfer encoding.
 * This guarantees Spanish accents, ñ, ¿ and HTML formatting are never corrupted or rejected by Gmail API.
 */
export function buildMimeMessage({ to, cc, bcc, subject, htmlBody, plainText }: SendEmailPayload): string {
  const boundary = `boundary_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  
  // Encode subject in standard RFC 2047 UTF-8 Base64 format
  const encodedSubject = `=?UTF-8?B?${utf8ToBase64(subject)}?=`;

  const headers: string[] = [
    `To: ${to}`,
    cc ? `Cc: ${cc}` : null,
    bcc ? `Bcc: ${bcc}` : null,
    `Subject: ${encodedSubject}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`
  ].filter((h): h is string => Boolean(h));

  const textPart = plainText || htmlBody.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                                      .replace(/<[^>]+>/g, ' ')
                                      .replace(/\s+/g, ' ')
                                      .trim();

  // Encode both body alternatives in UTF-8 Base64 to strictly adhere to MIME specifications
  const base64Text = utf8ToBase64(textPart);
  const base64Html = utf8ToBase64(htmlBody);

  const bodyParts = [
    `--${boundary}`,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    base64Text,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    base64Html,
    '',
    `--${boundary}--`
  ];

  return headers.join('\r\n') + '\r\n\r\n' + bodyParts.join('\r\n');
}

/**
 * Fetches current authenticated user's Gmail profile
 */
export async function getGmailProfile(): Promise<GmailProfile> {
  const token = await getAccessToken();
  if (!token) throw new Error('Usuario no autenticado en Google / Gmail');

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Error al obtener perfil de Gmail (${res.status})`);
  }

  return res.json();
}

/**
 * Sends an email using the Gmail API
 */
export async function sendGmailEmail(payload: SendEmailPayload): Promise<{ id: string; threadId: string; labelIds?: string[] }> {
  const token = await getAccessToken();
  if (!token) throw new Error('Debe iniciar sesión con Google para enviar correos vía Gmail.');

  const mimeString = buildMimeMessage(payload);
  const rawBase64Url = toBase64Url(mimeString);

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ raw: rawBase64Url })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Error al enviar correo vía Gmail (${res.status})`);
  }

  return res.json();
}

/**
 * Creates an email draft in Gmail
 */
export async function createGmailDraft(payload: SendEmailPayload): Promise<{ id: string; message: { id: string } }> {
  const token = await getAccessToken();
  if (!token) throw new Error('Debe iniciar sesión con Google para guardar borradores en Gmail.');

  const mimeString = buildMimeMessage(payload);
  const rawBase64Url = toBase64Url(mimeString);

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/drafts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: { raw: rawBase64Url }
    })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Error al crear borrador en Gmail (${res.status})`);
  }

  return res.json();
}

/**
 * Lists recent messages or searches messages with a query
 */
export async function listGmailMessages(query = '', maxResults = 10): Promise<GmailMessageSummary[]> {
  const token = await getAccessToken();
  if (!token) throw new Error('Debe iniciar sesión con Google para consultar la bandeja de Gmail.');

  const params = new URLSearchParams({
    maxResults: maxResults.toString()
  });
  if (query.trim()) {
    params.set('q', query);
  }

  const listRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!listRes.ok) {
    const err = await listRes.json().catch(() => ({}));
    throw new Error(err.error?.message || `Error al consultar mensajes de Gmail (${listRes.status})`);
  }

  const listData = await listRes.json();
  const rawMessages: { id: string; threadId: string }[] = listData.messages || [];

  // Fetch details for each message in parallel
  const detailPromises = rawMessages.map(async (item) => {
    try {
      const msgRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${item.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Date`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!msgRes.ok) return null;
      const msg = await msgRes.json();
      
      const headers = msg.payload?.headers || [];
      const getHeader = (name: string) => headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

      return {
        id: msg.id,
        threadId: msg.threadId,
        snippet: msg.snippet || '',
        subject: getHeader('Subject') || '(Sin Asunto)',
        from: getHeader('From') || '(Remitente desconocido)',
        to: getHeader('To') || '',
        date: getHeader('Date') || '',
        labelIds: msg.labelIds || []
      } as GmailMessageSummary;
    } catch {
      return null;
    }
  });

  const resolved = await Promise.all(detailPromises);
  return resolved.filter((m): m is GmailMessageSummary => m !== null);
}

/**
 * Petroil Corporate HTML Email Builders
 */
export const EmailTemplates = {
  responsivaDelivery: (params: {
    employeeName: string;
    employeeEmail: string;
    folio: string;
    assignedDate: string;
    assetTag: string;
    assetBrandModel: string;
    serialNumber: string;
    category: string;
    condition: string;
    accessories: string[];
    itStaffName: string;
    companyName?: string;
    branchName?: string;
    specs?: {
      cpu?: string;
      ram?: string;
      storage?: string;
      os?: string;
      screenSize?: string;
    };
    charger?: {
      serial?: string;
      brand?: string;
      model?: string;
    };
    notes?: string;
    isSigned?: boolean;
  }) => {
    const accessoriesList = params.accessories.length > 0 
      ? params.accessories.map(acc => `<li style="margin-bottom: 4px;">${acc}</li>`).join('') 
      : '<li>Sin accesorios adicionales especificados</li>';

    const hasCharger = Boolean(params.charger?.serial || params.charger?.brand || params.charger?.model);
    const hasSpecs = Boolean(params.specs?.cpu || params.specs?.ram || params.specs?.storage || params.specs?.screenSize);

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Carta Responsiva de Equipo de Cómputo</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #1e293b;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 640px; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #cbd5e1; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <!-- Header -->
          <tr>
            <td style="background-color: #0f172a; padding: 26px 32px; border-bottom: 4px solid #dc2626;">
              <table width="100%">
                <tr>
                  <td>
                    <span style="display: inline-block; background-color: #dc2626; color: #ffffff; font-size: 11px; font-weight: bold; padding: 4px 10px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.5px;">PETROIL TI • CARTA RESPONSIVA</span>
                    <h1 style="color: #ffffff; margin: 8px 0 0 0; font-size: 19px; font-weight: 700;">Notificación de Asignación y Entrega de Equipo</h1>
                    <p style="color: #94a3b8; margin: 5px 0 0 0; font-size: 13px;">
                      Folio Oficial: <strong style="color: #38bdf8; font-family: monospace;">${params.folio}</strong>
                      ${params.companyName ? ` • Empresa: <strong>${params.companyName}</strong>` : ''}
                      ${params.branchName ? ` • Sede: <strong>${params.branchName}</strong>` : ''}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 28px 32px;">
              <p style="margin: 0 0 14px 0; font-size: 14px; line-height: 1.5;">Estimado(a) <strong>${params.employeeName}</strong>,</p>
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.5; color: #334155;">
                Por medio del presente correo institucional, el Departamento de Tecnologías de la Información le notifica la entrega formal en resguardo del siguiente activo informático y sus accesorios asociados:
              </p>

              <!-- Device Card -->
              <table width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 20px; border-collapse: separate;">
                <tr>
                  <td style="padding: 18px;">
                    <table width="100%" style="font-size: 13px; color: #334155;">
                      <tr>
                        <td style="padding: 5px 0; color: #64748b; width: 150px;">Placa / Asset Tag:</td>
                        <td style="padding: 5px 0; font-weight: bold; color: #0284c7; font-family: monospace; font-size: 14px;">${params.assetTag}</td>
                      </tr>
                      <tr>
                        <td style="padding: 5px 0; color: #64748b;">Equipo y Modelo:</td>
                        <td style="padding: 5px 0; font-weight: 700; color: #0f172a;">${params.assetBrandModel}</td>
                      </tr>
                      <tr>
                        <td style="padding: 5px 0; color: #64748b;">Número de Serie (S/N):</td>
                        <td style="padding: 5px 0; font-family: monospace; color: #334155;">${params.serialNumber}</td>
                      </tr>
                      <tr>
                        <td style="padding: 5px 0; color: #64748b;">Categoría:</td>
                        <td style="padding: 5px 0; text-transform: capitalize;">${params.category}</td>
                      </tr>
                      <tr>
                        <td style="padding: 5px 0; color: #64748b;">Estado Físico:</td>
                        <td style="padding: 5px 0; text-transform: capitalize; color: #166534; font-weight: 600;">${params.condition || 'Excelente'}</td>
                      </tr>
                      <tr>
                        <td style="padding: 5px 0; color: #64748b;">Fecha Asignación:</td>
                        <td style="padding: 5px 0;">${params.assignedDate}</td>
                      </tr>
                      <tr>
                        <td style="padding: 5px 0; color: #64748b;">Entregado por:</td>
                        <td style="padding: 5px 0;">${params.itStaffName} (TI)</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Technical Specifications (if present) -->
              ${hasSpecs ? `
              <div style="margin-bottom: 20px; background-color: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 8px; padding: 14px 18px;">
                <h4 style="margin: 0 0 10px 0; font-size: 12px; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">⚙️ Especificaciones Técnicas:</h4>
                <table width="100%" style="font-size: 12px; color: #334155;">
                  <tr>
                    ${params.specs?.cpu ? `<td style="padding: 3px 0;"><strong>CPU:</strong> ${params.specs.cpu}</td>` : ''}
                    ${params.specs?.ram ? `<td style="padding: 3px 0;"><strong>RAM:</strong> ${params.specs.ram}</td>` : ''}
                  </tr>
                  <tr>
                    ${params.specs?.storage ? `<td style="padding: 3px 0;"><strong>Almacenamiento:</strong> ${params.specs.storage}</td>` : ''}
                    ${params.specs?.screenSize ? `<td style="padding: 3px 0;"><strong>Pantalla:</strong> ${params.specs.screenSize}</td>` : ''}
                  </tr>
                  ${params.specs?.os ? `<tr><td colspan="2" style="padding: 3px 0;"><strong>Sistema Operativo:</strong> ${params.specs.os}</td></tr>` : ''}
                </table>
              </div>
              ` : ''}

              <!-- Charger Details (if registered) -->
              ${hasCharger ? `
              <div style="margin-bottom: 20px; background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 14px 18px;">
                <h4 style="margin: 0 0 8px 0; font-size: 12px; color: #92400e; text-transform: uppercase; letter-spacing: 0.5px;">⚡ Cargador de Corriente Entregado:</h4>
                <table width="100%" style="font-size: 12px; color: #78350f;">
                  <tr>
                    <td style="padding: 2px 0; width: 140px;"><strong>Serie Cargador (S/N):</strong></td>
                    <td style="padding: 2px 0; font-family: monospace;">${params.charger?.serial || 'Original de fábrica'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 2px 0;"><strong>Marca / Fabricante:</strong></td>
                    <td style="padding: 2px 0;">${params.charger?.brand || params.assetBrandModel.split(' ')[0]}</td>
                  </tr>
                  <tr>
                    <td style="padding: 2px 0;"><strong>Modelo / Potencia:</strong></td>
                    <td style="padding: 2px 0;">${params.charger?.model || 'Estándar'}</td>
                  </tr>
                </table>
              </div>
              ` : ''}

              <!-- Accessories -->
              <div style="margin-bottom: 20px;">
                <h4 style="margin: 0 0 8px 0; font-size: 12px; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">Accesorios y periféricos entregados:</h4>
                <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #475569;">
                  ${accessoriesList}
                </ul>
              </div>

              ${params.notes ? `
              <div style="margin-bottom: 20px; padding: 10px 14px; background-color: #f8fafc; border-left: 3px solid #64748b; font-size: 12px; color: #475569;">
                <strong>Observaciones de entrega:</strong> ${params.notes}
              </div>
              ` : ''}

              <!-- Obligations Notice -->
              <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 12px 16px; border-radius: 4px; font-size: 12px; color: #991b1b; line-height: 1.5; margin-bottom: 24px;">
                <strong>Aviso de Custodia Responsable:</strong> El colaborador asume la custodia legal del bien patrimonial para el estricto desempeño de sus funciones laborales en Grupo Petroil. En caso de siniestro, robo o falla técnica, repórtelo de inmediato a la Mesa de Ayuda TI.
              </div>

              <p style="margin: 0; font-size: 13px; color: #64748b; line-height: 1.5;">
                Conserve este comprobante como acuse digital de recibo. Puede consultar y validar la carta responsiva firmada en el portal corporativo ITAM.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 32px; text-align: center; font-size: 11px; color: #64748b;">
              <p style="margin: 0 0 4px 0;"><strong>Departamento de Tecnologías de la Información</strong> • Grupo Petroil</p>
              <p style="margin: 0;">Mesa de Ayuda TI • Mazatlán, Sinaloa, México</p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  },

  maintenanceNotice: (params: {
    employeeName: string;
    assetTag: string;
    assetBrandModel: string;
    scheduledDate: string;
    locationRoom: string;
    backupNote: boolean;
    chargerNote: boolean;
    estimatedDuration?: string;
    additionalInstructions?: string;
  }) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Aviso de Mantenimiento Preventivo TI</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #1e293b;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #cbd5e1; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <tr>
            <td style="background-color: #1e1b4b; padding: 24px 32px; border-bottom: 4px solid #6366f1;">
              <span style="display: inline-block; background-color: #6366f1; color: #ffffff; font-size: 11px; font-weight: bold; padding: 4px 8px; border-radius: 4px; text-transform: uppercase;">Mantenimiento TI</span>
              <h1 style="color: #ffffff; margin: 8px 0 0 0; font-size: 18px; font-weight: 700;">Programación de Mantenimiento Preventivo Periódico</h1>
              <p style="color: #cbd5e1; margin: 4px 0 0 0; font-size: 13px;">Equipo: <strong>${params.assetTag}</strong> (${params.assetBrandModel})</p>
            </td>
          </tr>

          <tr>
            <td style="padding: 28px 32px;">
              <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.5;">Estimado(a) <strong>${params.employeeName}</strong>,</p>
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.5; color: #334155;">
                Le informamos que de acuerdo al calendario oficial de servicio de TI, a su equipo de cómputo en resguardo le corresponde su <strong>mantenimiento preventivo semestral</strong> para optimizar su rendimiento físico y de seguridad.
              </p>

              <!-- Schedule Box -->
              <table width="100%" style="background-color: #eef2ff; border: 1px solid #c7d2fe; border-radius: 8px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px; font-size: 13px; color: #312e81;">
                    <p style="margin: 0 0 8px 0;">📅 <strong>Fecha programada:</strong> ${params.scheduledDate}</p>
                    <p style="margin: 0 0 8px 0;">📍 <strong>Lugar de atención:</strong> ${params.locationRoom}</p>
                    <p style="margin: 0;">⏱️ <strong>Tiempo estimado:</strong> ${params.estimatedDuration || '120 a 150 minutos (2 a 2.5 horas)'}</p>
                  </td>
                </tr>
              </table>

              <!-- Instructions -->
              <div style="margin-bottom: 20px;">
                <h4 style="margin: 0 0 10px 0; font-size: 13px; color: #0f172a; text-transform: uppercase;">Instrucciones para el servicio:</h4>
                <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #475569; line-height: 1.6;">
                  ${params.backupNote ? '<li><strong>Respaldo de información:</strong> Por favor sincronice sus archivos laborales en su unidad corporativa Google Drive antes de entregar el equipo.</li>' : ''}
                  ${params.chargerNote ? '<li><strong>Cargador original:</strong> Acuda al taller con el cargador original de corriente para verificar voltajes de batería.</li>' : ''}
                  <li>El mantenimiento incluye limpieza física interna de ventiladores, actualización de parches de seguridad y diagnóstico de hardware.</li>
                  ${params.additionalInstructions ? `<li>${params.additionalInstructions}</li>` : ''}
                </ul>
              </div>

              <p style="margin: 0; font-size: 13px; color: #64748b; line-height: 1.5;">
                Si requiere reprogramar la fecha por motivos de agenda o viaje corporativo, responda a este correo de inmediato.
              </p>
            </td>
          </tr>

          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 32px; text-align: center; font-size: 11px; color: #64748b;">
              <p style="margin: 0 0 4px 0;"><strong>Mesa de Ayuda & Soporte Técnico TI</strong> • Petroil</p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  },

  warrantyAlert: (params: {
    assetTag: string;
    assetBrandModel: string;
    serialNumber: string;
    supplier: string;
    warrantyEndDate: string;
    daysRemaining: number;
    assignedToName?: string;
  }) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Alerta de Vencimiento de Garantía</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #1e293b;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #cbd5e1;">
          <tr>
            <td style="background-color: #881337; padding: 24px 32px; border-bottom: 4px solid #f43f5e;">
              <span style="display: inline-block; background-color: #f43f5e; color: #ffffff; font-size: 11px; font-weight: bold; padding: 4px 8px; border-radius: 4px; text-transform: uppercase;">Alerta Crítica</span>
              <h1 style="color: #ffffff; margin: 8px 0 0 0; font-size: 18px; font-weight: 700;">Vencimiento Próximo de Garantía Comercial</h1>
              <p style="color: #fecdd3; margin: 4px 0 0 0; font-size: 13px;">Equipo: <strong>${params.assetTag}</strong></p>
            </td>
          </tr>

          <tr>
            <td style="padding: 28px 32px;">
              <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.5;">Atención Departamento de Compras & Contratos TI,</p>
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.5; color: #334155;">
                El sistema de Gestión de Activos Notifica que el siguiente equipo está por concluir su cobertura de garantía con el fabricante/proveedor:
              </p>

              <table width="100%" style="background-color: #fff1f2; border: 1px solid #fecdd3; border-radius: 8px; margin-bottom: 24px; font-size: 13px; color: #881337;">
                <tr>
                  <td style="padding: 16px;">
                    <p style="margin: 0 0 6px 0;">🏷️ <strong>Equipo:</strong> ${params.assetBrandModel}</p>
                    <p style="margin: 0 0 6px 0;">🏷️ <strong>Placa:</strong> ${params.assetTag} | <strong>Serie:</strong> ${params.serialNumber}</p>
                    <p style="margin: 0 0 6px 0;">🏢 <strong>Proveedor:</strong> ${params.supplier}</p>
                    <p style="margin: 0 0 6px 0;">📅 <strong>Fecha Fin de Garantía:</strong> ${params.warrantyEndDate}</p>
                    <p style="margin: 0 0 6px 0;">⏳ <strong>Días restantes:</strong> ${params.daysRemaining > 0 ? `${params.daysRemaining} días` : 'GARANTÍA EXPIRADA'}</p>
                    ${params.assignedToName ? `<p style="margin: 0;">👤 <strong>Asignado actualmente a:</strong> ${params.assignedToName}</p>` : ''}
                  </td>
                </tr>
              </table>

              <p style="margin: 0; font-size: 13px; color: #64748b; line-height: 1.5;">
                Se sugiere programar una inspección técnica preventiva o evaluar la extensión de póliza de servicio antes del vencimiento.
              </p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }
};
