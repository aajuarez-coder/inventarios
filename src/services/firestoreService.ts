import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  collection, 
  getDocs,
  getDocFromServer, 
  writeBatch 
} from 'firebase/firestore';
import { initializeApp, getApps, getApp } from 'firebase/app';
import firebaseConfig from '../../firebase-applet-config.json';
import { 
  HardwareAsset, 
  Employee, 
  Assignment, 
  MaintenanceRecord, 
  Branch, 
  Transfer, 
  TimelineEvent, 
  EmailNotification,
  AppUser,
  EquipmentLoan,
  Company 
} from '../types/inventory';
import { 
  INITIAL_ASSETS, 
  INITIAL_EMPLOYEES, 
  INITIAL_ASSIGNMENTS, 
  INITIAL_MAINTENANCE_RECORDS, 
  INITIAL_BRANCHES, 
  INITIAL_TRANSFERS, 
  INITIAL_TIMELINE, 
  INITIAL_EMAIL_LOGS,
  SYSTEM_USERS,
  INITIAL_LOANS,
  INITIAL_COMPANIES 
} from '../data/mockData';

// Re-use or initialize Firebase app
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore targeting the provisioned custom database ID
const dbId = (firebaseConfig as any).firestoreDatabaseId;
export const firestoreDb = dbId ? getFirestore(app, dbId) : getFirestore(app);

// Test connection on boot per Firebase skill guidelines
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(firestoreDb, 'test', 'connection'));
    console.log('[Firestore] Conectado exitosamente al servidor Google Cloud Firestore.');
    return true;
  } catch (error: any) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('[Firestore] Cliente en modo offline.');
    }
    return false;
  }
}
testFirestoreConnection();

export const COLLECTIONS = {
  ASSETS: 'assets',
  EMPLOYEES: 'employees',
  ASSIGNMENTS: 'assignments',
  MAINTENANCE: 'maintenanceRecords',
  BRANCHES: 'branches',
  TRANSFERS: 'transfers',
  TIMELINE: 'timeline',
  EMAIL_LOGS: 'emailLogs',
  LOANS: 'loans',
  SYSTEM_USERS: 'systemUsers',
  DEVICE_COMMANDS: 'deviceCommands',
  COMPANIES: 'companies'
} as const;

/**
 * Sanitizes an object deeply for Firestore:
 * Firestore throws a runtime error if ANY property contains `undefined`.
 * This recursive function strips undefined keys and normalizes values so writes never abort.
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === undefined) {
    return null as any;
  }
  if (data === null || typeof data !== 'object') {
    return data;
  }
  if (data instanceof Date) {
    return data.toISOString() as any;
  }
  if (Array.isArray(data)) {
    return data
      .filter(item => item !== undefined)
      .map(item => sanitizeForFirestore(item)) as any;
  }
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      clean[key] = sanitizeForFirestore(value);
    }
  }
  return clean as T;
}

/**
 * Seeds initial collection documents if Firestore is initially empty,
 * and ensures essential system users and companies exist in Firestore.
 */
export async function seedInitialFirestoreDataIfEmpty() {
  try {
    const metaDocRef = doc(firestoreDb, '_system_meta', 'seed_status');
    const metaSnap = await getDoc(metaDocRef);

    if (metaSnap.exists() && metaSnap.data()?.seeded) {
      // Ensure missing system users are seeded if they are not yet in Firestore
      try {
        const usersSnap = await getDocs(collection(firestoreDb, COLLECTIONS.SYSTEM_USERS));
        const existingIds = new Set(usersSnap.docs.map(d => d.id));
        const existingEmails = new Set(usersSnap.docs.map(d => (d.data() as AppUser).email?.toLowerCase()));

        const missingUsers = SYSTEM_USERS.filter(u => 
          !existingIds.has(u.id) && !existingEmails.has(u.email.toLowerCase())
        );

        if (missingUsers.length > 0) {
          console.log(`[Firestore] Sincronizando ${missingUsers.length} usuarios base faltantes en Firestore...`);
          const userBatch = writeBatch(firestoreDb);
          for (const u of missingUsers) {
            userBatch.set(doc(firestoreDb, COLLECTIONS.SYSTEM_USERS, u.id), sanitizeForFirestore(u), { merge: true });
          }
          await userBatch.commit();
          console.log('[Firestore] Usuarios base sincronizados exitosamente.');
        }
      } catch (userCheckErr) {
        console.warn('[Firestore] Verificación de usuarios existentes omitida:', userCheckErr);
      }

      // Ensure companies collection is populated if empty
      try {
        const compSnap = await getDocs(collection(firestoreDb, COLLECTIONS.COMPANIES));
        if (compSnap.empty) {
          console.log('[Firestore] Inicializando catálogo de Empresas de Grupo Petroil en Firestore...');
          const compBatch = writeBatch(firestoreDb);
          INITIAL_COMPANIES.forEach(comp => {
            compBatch.set(doc(firestoreDb, COLLECTIONS.COMPANIES, comp.id), sanitizeForFirestore(comp), { merge: true });
          });
          await compBatch.commit();
          console.log('[Firestore] Catálogo de Empresas sincronizado con éxito.');
        }
      } catch (compCheckErr) {
        console.warn('[Firestore] Verificación de empresas omitida:', compCheckErr);
      }

      return;
    }

    console.log('[Firestore] Inicializando colecciones iniciales de base de datos...');
    const batch = writeBatch(firestoreDb);

    // Initial assets
    INITIAL_ASSETS.forEach(item => {
      batch.set(doc(firestoreDb, COLLECTIONS.ASSETS, item.id), sanitizeForFirestore(item), { merge: true });
    });

    // Initial employees
    INITIAL_EMPLOYEES.forEach(item => {
      batch.set(doc(firestoreDb, COLLECTIONS.EMPLOYEES, item.id), sanitizeForFirestore(item), { merge: true });
    });

    // Initial assignments
    INITIAL_ASSIGNMENTS.forEach(item => {
      batch.set(doc(firestoreDb, COLLECTIONS.ASSIGNMENTS, item.id), sanitizeForFirestore(item), { merge: true });
    });

    // Initial maintenance records
    INITIAL_MAINTENANCE_RECORDS.forEach(item => {
      batch.set(doc(firestoreDb, COLLECTIONS.MAINTENANCE, item.id), sanitizeForFirestore(item), { merge: true });
    });

    // Initial branches
    INITIAL_BRANCHES.forEach(item => {
      batch.set(doc(firestoreDb, COLLECTIONS.BRANCHES, item.id), sanitizeForFirestore(item), { merge: true });
    });

    // Initial transfers
    INITIAL_TRANSFERS.forEach(item => {
      batch.set(doc(firestoreDb, COLLECTIONS.TRANSFERS, item.id), sanitizeForFirestore(item), { merge: true });
    });

    // Initial timeline
    INITIAL_TIMELINE.forEach(item => {
      batch.set(doc(firestoreDb, COLLECTIONS.TIMELINE, item.id), sanitizeForFirestore(item), { merge: true });
    });

    // Initial email logs
    INITIAL_EMAIL_LOGS.forEach(item => {
      batch.set(doc(firestoreDb, COLLECTIONS.EMAIL_LOGS, item.id), sanitizeForFirestore(item), { merge: true });
    });

    // Initial loans
    INITIAL_LOANS.forEach(item => {
      batch.set(doc(firestoreDb, COLLECTIONS.LOANS, item.id), sanitizeForFirestore(item), { merge: true });
    });

    // Initial system users
    SYSTEM_USERS.forEach(item => {
      batch.set(doc(firestoreDb, COLLECTIONS.SYSTEM_USERS, item.id), sanitizeForFirestore(item), { merge: true });
    });

    // Mark as seeded
    batch.set(metaDocRef, {
      seeded: true,
      seededAt: new Date().toISOString(),
      projectId: firebaseConfig.projectId
    });

    await batch.commit();
    console.log('[Firestore] Inicialización de base de datos concluida con éxito.');
  } catch (err) {
    console.warn('[Firestore] Error al inicializar datos:', err);
  }
}

/**
 * Saves or updates a single document in Firestore with automatic recursive sanitization.
 * Never throws "Unsupported field value: undefined".
 */
export async function saveDocumentToFirestore(
  collectionName: string, 
  id: string, 
  data: any
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!id) {
      console.error(`[Firestore] Error: ID de documento vacío para colección ${collectionName}`);
      return { success: false, error: 'ID de documento vacío' };
    }
    const cleanData = sanitizeForFirestore(data);
    await setDoc(doc(firestoreDb, collectionName, id), cleanData, { merge: true });
    return { success: true };
  } catch (err: any) {
    console.error(`[Firestore] Error al guardar documento en ${collectionName}/${id}:`, err);
    return { success: false, error: err?.message || String(err) };
  }
}

/**
 * Saves multiple documents in chunks of up to 400 using writeBatch.
 * Sanitizes all records and commits atomically.
 */
export async function saveBatchToFirestore(
  collectionName: string, 
  items: Array<{ id: string; data: any }>
): Promise<{ success: boolean; count: number; error?: string }> {
  if (!items || items.length === 0) {
    return { success: true, count: 0 };
  }

  try {
    const CHUNK_SIZE = 400;
    for (let i = 0; i < items.length; i += CHUNK_SIZE) {
      const chunk = items.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(firestoreDb);
      for (const item of chunk) {
        if (item.id && item.data) {
          const cleanData = sanitizeForFirestore(item.data);
          batch.set(doc(firestoreDb, collectionName, item.id), cleanData, { merge: true });
        }
      }
      await batch.commit();
    }
    return { success: true, count: items.length };
  } catch (err: any) {
    console.error(`[Firestore] Error en guardado por lote en ${collectionName}:`, err);
    return { success: false, count: 0, error: err?.message || String(err) };
  }
}

/**
 * Deletes a single document from Firestore.
 */
export async function deleteDocumentFromFirestore(
  collectionName: string, 
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!id) return { success: false, error: 'ID vacío' };
    await deleteDoc(doc(firestoreDb, collectionName, id));
    return { success: true };
  } catch (err: any) {
    console.error(`[Firestore] Error al eliminar documento en ${collectionName}/${id}:`, err);
    return { success: false, error: err?.message || String(err) };
  }
}
