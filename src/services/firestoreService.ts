import { getFirestore, doc, getDoc, setDoc, updateDoc, deleteDoc, collection, onSnapshot, getDocFromServer, writeBatch } from 'firebase/firestore';
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
  EquipmentLoan 
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
  INITIAL_LOANS 
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
    console.log('[Firestore] Conectado exitosamente al servidor.');
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
  DEVICE_COMMANDS: 'deviceCommands'
} as const;

/**
 * Seeds initial collection documents if Firestore is initially empty
 */
export async function seedInitialFirestoreDataIfEmpty() {
  try {
    const metaDocRef = doc(firestoreDb, '_system_meta', 'seed_status');
    const metaSnap = await getDoc(metaDocRef);

    if (metaSnap.exists() && metaSnap.data()?.seeded) {
      return; // Already initialized
    }

    console.log('[Firestore] Inicializando colecciones iniciales de base de datos...');
    const batch = writeBatch(firestoreDb);

    // Initial assets
    INITIAL_ASSETS.forEach(item => {
      batch.set(doc(firestoreDb, COLLECTIONS.ASSETS, item.id), item);
    });

    // Initial employees
    INITIAL_EMPLOYEES.forEach(item => {
      batch.set(doc(firestoreDb, COLLECTIONS.EMPLOYEES, item.id), item);
    });

    // Initial assignments
    INITIAL_ASSIGNMENTS.forEach(item => {
      batch.set(doc(firestoreDb, COLLECTIONS.ASSIGNMENTS, item.id), item);
    });

    // Initial maintenance records
    INITIAL_MAINTENANCE_RECORDS.forEach(item => {
      batch.set(doc(firestoreDb, COLLECTIONS.MAINTENANCE, item.id), item);
    });

    // Initial branches
    INITIAL_BRANCHES.forEach(item => {
      batch.set(doc(firestoreDb, COLLECTIONS.BRANCHES, item.id), item);
    });

    // Initial transfers
    INITIAL_TRANSFERS.forEach(item => {
      batch.set(doc(firestoreDb, COLLECTIONS.TRANSFERS, item.id), item);
    });

    // Initial timeline
    INITIAL_TIMELINE.forEach(item => {
      batch.set(doc(firestoreDb, COLLECTIONS.TIMELINE, item.id), item);
    });

    // Initial email logs
    INITIAL_EMAIL_LOGS.forEach(item => {
      batch.set(doc(firestoreDb, COLLECTIONS.EMAIL_LOGS, item.id), item);
    });

    // Initial loans
    INITIAL_LOANS.forEach(item => {
      batch.set(doc(firestoreDb, COLLECTIONS.LOANS, item.id), item);
    });

    // Initial system users
    SYSTEM_USERS.forEach(item => {
      batch.set(doc(firestoreDb, COLLECTIONS.SYSTEM_USERS, item.id), item);
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
 * Generic document persistence helpers
 */
export async function saveDocumentToFirestore(collectionName: string, id: string, data: any) {
  try {
    await setDoc(doc(firestoreDb, collectionName, id), data, { merge: true });
  } catch (err) {
    console.error(`[Firestore] Error al guardar documento en ${collectionName}/${id}:`, err);
  }
}

export async function deleteDocumentFromFirestore(collectionName: string, id: string) {
  try {
    await deleteDoc(doc(firestoreDb, collectionName, id));
  } catch (err) {
    console.error(`[Firestore] Error al eliminar documento en ${collectionName}/${id}:`, err);
  }
}
