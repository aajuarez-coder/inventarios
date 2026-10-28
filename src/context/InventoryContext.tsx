import React, { createContext, useContext, useState, useEffect } from 'react';
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
  UserRole,
  UserPermissions,
  EquipmentLoan,
  DeviceCommand,
  DeviceCommandType,
  PhysicalCondition
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
import { getDefaultPermissionsForRole } from '../utils/permissionHelpers';
import { collection, onSnapshot } from 'firebase/firestore';
import { 
  firestoreDb, 
  COLLECTIONS, 
  seedInitialFirestoreDataIfEmpty, 
  saveDocumentToFirestore, 
  deleteDocumentFromFirestore 
} from '../services/firestoreService';

interface InventoryContextType {
  assets: HardwareAsset[];
  employees: Employee[];
  assignments: Assignment[];
  maintenanceRecords: MaintenanceRecord[];
  branches: Branch[];
  transfers: Transfer[];
  timeline: TimelineEvent[];
  emailLogs: EmailNotification[];
  currentUser: AppUser;
  isAuthenticated: boolean;
  canEdit: boolean;
  isViewer: boolean;
  isCloudSyncing: boolean;
  lastCloudSyncTime: string;
  
  // Auth & Session
  verifyCredentials: (email: string, password?: string) => { success: boolean; error?: string; user?: AppUser };
  verifyGoogleLogin: (email: string, displayName?: string | null) => { success: boolean; error?: string; user?: AppUser };
  completeLogin: (user: AppUser) => void;
  login: (email: string, password?: string) => { success: boolean; error?: string; user?: AppUser };
  logout: () => void;
  setCurrentUser: (user: AppUser) => void;
  setUserRole: (role: UserRole) => void;

  // System Users & Permissions Management (Operators with software access)
  systemUsers: AppUser[];
  addSystemUser: (user: Omit<AppUser, 'id'>) => AppUser;
  updateSystemUser: (id: string, updates: Partial<AppUser>) => void;
  deleteSystemUser: (id: string) => { success: boolean; error?: string };
  toggleUserStatus: (id: string) => void;
  hasPermission: (permission: keyof UserPermissions) => boolean;
  
  // Asset actions
  addAsset: (asset: Omit<HardwareAsset, 'id'>) => HardwareAsset;
  addMultipleAssets: (assetsData: Omit<HardwareAsset, 'id'>[]) => number;
  updateAsset: (id: string, updates: Partial<HardwareAsset>) => void;
  deleteAsset: (id: string) => void;
  retireAsset: (id: string, reason: string) => void;
  
  // Employee actions
  addEmployee: (employee: Omit<Employee, 'id'>) => Employee;
  addMultipleEmployees: (employeesData: Omit<Employee, 'id'>[]) => number;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  deleteEmployee: (id: string) => { success: boolean; error?: string };
  
  // Assignment & Responsiva actions
  createAssignment: (
    assetId: string, 
    employeeId: string, 
    accessories: string[], 
    notes: string,
    itStaffName: string
  ) => Assignment;
  signResponsiva: (
    assignmentId: string, 
    employeeSignatureUrl: string, 
    itStaffSignatureUrl?: string
  ) => void;
  returnAsset: (identifier: string, condition: string, notes: string, targetBranchId?: string) => void;
  
  // Maintenance actions
  createMaintenanceRecord: (record: Omit<MaintenanceRecord, 'id'>) => MaintenanceRecord;
  completeMaintenance: (maintenanceId: string, tasks: string[], score: number, nextDate: string) => void;
  
  // Email Notifications
  sendMaintenanceEmailAlert: (assetId: string, scheduledDate?: string, customNote?: string) => EmailNotification;
  sendWarrantyEmailAlert: (assetId: string) => EmailNotification;
  
  // Transfers
  createTransfer: (transfer: Omit<Transfer, 'id' | 'folio'>) => Transfer;
  confirmTransferArrival: (transferId: string, receivedBy: string) => void;
  
  // Branches
  addBranch: (branch: Omit<Branch, 'id'>) => Branch;
  updateBranch: (id: string, updates: Partial<Branch>) => void;
  deleteBranch: (id: string) => { success: boolean; error?: string };

  // Equipment Loans (Préstamos Temporales)
  loans: EquipmentLoan[];
  createLoan: (loanData: {
    assetId: string;
    employeeId: string;
    startDate: string;
    expectedReturnDate: string;
    purpose: EquipmentLoan['purpose'];
    purposeDescription: string;
    accessoriesIncluded: string[];
    conditionOnCheckout: PhysicalCondition;
    deliveryNotes?: string;
    technicianOutName: string;
    employeeSignatureCheckout?: string;
    itSignatureCheckout?: string;
  }) => EquipmentLoan;
  returnLoan: (
    loanId: string,
    conditionOnReturn: PhysicalCondition,
    returnNotes: string,
    technicianInName: string,
    employeeSignatureReturn?: string,
    itSignatureReturn?: string
  ) => void;
  cancelLoan: (loanId: string, reason: string) => void;

  // Remote Commands & Security (BitLocker, Pantalla, Avisos)
  sendRemoteCommand: (params: {
    targetId: string;
    commandType: DeviceCommandType;
    parameters?: Record<string, any>;
    agentId?: string;
    targetHostname?: string;
  }) => Promise<{ success: boolean; command?: DeviceCommand; error?: string }>;
  simulateCommandExecution: (commandId: string) => Promise<{ success: boolean; command?: DeviceCommand; error?: string }>;
  fetchDeviceCommands: (targetId: string) => Promise<DeviceCommand[]>;
  
  // Traceability & Timeline
  logEvent: (event: Omit<TimelineEvent, 'id' | 'timestamp'>) => void;
  
  // Cloud & Data Persistence
  exportDataJSON: () => void;
  importDataJSON: (jsonString: string) => boolean;
  resetToDefaults: () => void;
  forceCloudSync: () => void;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

const STORAGE_KEYS = {
  ASSETS: 'itasset_assets_v1',
  EMPLOYEES: 'itasset_employees_v1',
  ASSIGNMENTS: 'itasset_assignments_v1',
  MAINTENANCE: 'itasset_maintenance_v1',
  BRANCHES: 'itasset_branches_v1',
  TRANSFERS: 'itasset_transfers_v1',
  TIMELINE: 'itasset_timeline_v1',
  EMAIL_LOGS: 'itasset_emails_v1',
  CURRENT_USER: 'itasset_current_user_v1',
  AUTH_SESSION: 'itasset_auth_session_v1',
  SYSTEM_USERS: 'itasset_system_users_v1',
  LOANS: 'itasset_loans_v1',
};

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [assets, setAssets] = useState<HardwareAsset[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ASSETS);
    return saved ? JSON.parse(saved) : INITIAL_ASSETS;
  });

  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
    return saved ? JSON.parse(saved) : INITIAL_EMPLOYEES;
  });

  const [assignments, setAssignments] = useState<Assignment[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ASSIGNMENTS);
    return saved ? JSON.parse(saved) : INITIAL_ASSIGNMENTS;
  });

  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MAINTENANCE);
    return saved ? JSON.parse(saved) : INITIAL_MAINTENANCE_RECORDS;
  });

  const [branches, setBranches] = useState<Branch[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BRANCHES);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((b: Branch) => {
            const initial = INITIAL_BRANCHES.find(ib => ib.id === b.id || ib.code === b.code);
            return {
              ...b,
              latitude: b.latitude ?? initial?.latitude ?? 19.4270,
              longitude: b.longitude ?? initial?.longitude ?? -99.1677
            };
          });
        }
      } catch (e) {
        // fallback
      }
    }
    return INITIAL_BRANCHES;
  });

  const [transfers, setTransfers] = useState<Transfer[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TRANSFERS);
    return saved ? JSON.parse(saved) : INITIAL_TRANSFERS;
  });

  const [timeline, setTimeline] = useState<TimelineEvent[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TIMELINE);
    return saved ? JSON.parse(saved) : INITIAL_TIMELINE;
  });

  const [emailLogs, setEmailLogs] = useState<EmailNotification[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.EMAIL_LOGS);
    return saved ? JSON.parse(saved) : INITIAL_EMAIL_LOGS;
  });

  const [loans, setLoans] = useState<EquipmentLoan[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LOANS);
    return saved ? JSON.parse(saved) : INITIAL_LOANS;
  });

  // Dynamic system users with permissions and active status
  const [systemUsers, setSystemUsers] = useState<AppUser[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SYSTEM_USERS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((u: AppUser) => ({
            ...u,
            status: u.status || 'activo',
            permissions: u.permissions || getDefaultPermissionsForRole(u.role),
            canEdit: u.permissions ? !u.permissions.isReadOnly : u.role !== 'visor'
          }));
        }
      } catch (e) {
        console.error('Error parsing stored system users:', e);
      }
    }
    // Seed with INITIAL SYSTEM_USERS enriched with permissions
    return SYSTEM_USERS.map(u => ({
      ...u,
      status: 'activo' as const,
      createdAt: '2026-01-15',
      permissions: getDefaultPermissionsForRole(u.role),
      canEdit: u.role !== 'visor'
    }));
  });

  const [currentUser, setCurrentUser] = useState<AppUser>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          status: parsed.status || 'activo',
          permissions: parsed.permissions || getDefaultPermissionsForRole(parsed.role),
          canEdit: parsed.permissions ? !parsed.permissions.isReadOnly : parsed.role !== 'visor'
        };
      } catch (e) {
        // fallback
      }
    }
    const def = SYSTEM_USERS[0];
    return {
      ...def,
      status: 'activo',
      permissions: getDefaultPermissionsForRole(def.role)
    };
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AUTH_SESSION);
    return saved === 'true';
  });

  const canEdit = currentUser?.canEdit !== false && currentUser?.role !== 'visor' && currentUser?.permissions?.isReadOnly !== true;
  const isViewer = currentUser?.role === 'visor' || currentUser?.permissions?.isReadOnly === true;

  const hasPermission = (permission: keyof UserPermissions): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'edicion_total') return true;
    const perms = currentUser.permissions || getDefaultPermissionsForRole(currentUser.role);
    return Boolean(perms[permission]);
  };

  const verifyCredentials = (email: string, password?: string): { success: boolean; error?: string; user?: AppUser } => {
    const cleanInput = (email || '').trim().toLowerCase();
    if (!cleanInput) {
      return { success: false, error: 'Usuario no encontrado' };
    }

    // 1. Search in database system users
    let user = systemUsers.find(u => {
      const uEmail = u.email.toLowerCase();
      const uUser = uEmail.split('@')[0];
      return (
        uEmail === cleanInput ||
        uUser === cleanInput ||
        u.id.toLowerCase() === cleanInput
      );
    });

    // 2. Search in database employees directory
    if (!user) {
      const matchedEmp = employees.find(e => 
        e.email.toLowerCase() === cleanInput || 
        e.email.toLowerCase().split('@')[0] === cleanInput ||
        e.employeeNumber.toLowerCase() === cleanInput
      );

      if (matchedEmp) {
        user = {
          id: `user-${matchedEmp.id}`,
          name: matchedEmp.fullName,
          email: matchedEmp.email,
          password: 'admin123',
          role: 'edicion_total',
          roleTitle: `${matchedEmp.position} (Acceso Corporativo)`,
          branchName: branches.find(b => b.id === matchedEmp.branchId)?.name || 'Corporativo Torre Central (CDMX)',
          canEdit: true,
          status: 'activo',
          permissions: getDefaultPermissionsForRole('edicion_total'),
          avatarUrl: matchedEmp.avatarUrl
        };
      }
    }

    // If user does not exist in the database, deny access with exact requested legend
    if (!user) {
      return { success: false, error: 'Usuario no encontrado' };
    }

    // Check account active status
    if (user.status === 'inactivo') {
      return { 
        success: false, 
        error: `La cuenta de acceso "${user.email}" se encuentra inactiva en la base de datos.` 
      };
    }

    // Verify password against database record
    const cleanPassword = (password || '').trim();
    const storedPassword = (user.password || 'admin123').trim();

    if (!cleanPassword || cleanPassword !== storedPassword) {
      return { success: false, error: 'Contraseña incorrecta' };
    }

    return { success: true, user };
  };

  const verifyGoogleLogin = (email: string, displayName?: string | null): { success: boolean; error?: string; user?: AppUser } => {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, error: 'Usuario no encontrado' };
    }

    // 1. Search in systemUsers
    let user = systemUsers.find(u => u.email.toLowerCase() === cleanEmail);

    // 2. Also match username prefix or known corporate account
    if (!user) {
      if (cleanEmail === 'aajuarez@petroil.com.mx' || cleanEmail.startsWith('aajuarez@')) {
        user = {
          id: 'user-aajuarez',
          name: displayName || 'Ing. Alejandro Juárez',
          email: 'aajuarez@petroil.com.mx',
          role: 'edicion_total',
          roleTitle: 'Administrador General (Edición Total)',
          branchName: 'Corporativo Torre Central (CDMX)',
          canEdit: true,
          status: 'activo'
        };
      } else {
        const emp = employees.find(e => e.email.toLowerCase() === cleanEmail);
        if (emp) {
          user = {
            id: `user-${emp.id}`,
            name: emp.fullName,
            email: emp.email,
            role: 'edicion_total',
            roleTitle: `${emp.position} (Operador Autorizado)`,
            branchName: branches.find(b => b.id === emp.branchId)?.name || 'Corporativo',
            canEdit: true,
            status: 'activo'
          };
        }
      }
    }

    if (!user) {
      return { 
        success: false, 
        error: 'Usuario no encontrado'
      };
    }

    if (user.status === 'inactivo') {
      return { 
        success: false, 
        error: `La cuenta corporativa "${user.email}" se encuentra inactiva en la base de datos de Grupo Petroil.` 
      };
    }

    return { success: true, user };
  };

  const completeLogin = (user: AppUser) => {
    const updatedUser = {
      ...user,
      lastLogin: new Date().toISOString()
    };

    setCurrentUser(updatedUser);
    setIsAuthenticated(true);
    localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, 'true');
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(updatedUser));
  };

  const login = (email: string, password?: string): { success: boolean; error?: string; user?: AppUser } => {
    const verification = verifyCredentials(email, password);
    if (!verification.success || !verification.user) {
      return verification;
    }
    completeLogin(verification.user);
    return verification;
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, 'false');
  };

  const addSystemUser = (userData: Omit<AppUser, 'id'>): AppUser => {
    const newId = `user-${Date.now()}`;
    const perms = userData.permissions || getDefaultPermissionsForRole(userData.role);
    const newUser: AppUser = {
      ...userData,
      id: newId,
      status: userData.status || 'activo',
      createdAt: new Date().toISOString().split('T')[0],
      permissions: perms,
      canEdit: !perms.isReadOnly
    };

    setSystemUsers(prev => [newUser, ...prev]);
    saveDocumentToFirestore(COLLECTIONS.SYSTEM_USERS, newId, newUser);

    logEvent({
      assetId: 'sys-user',
      type: 'alta',
      title: `Alta de Usuario del Sistema: ${newUser.name}`,
      description: `Operador registrado con correo ${newUser.email} y rol ${newUser.roleTitle}.`,
      author: currentUser.name
    });

    triggerCloudSyncAnimation();
    return newUser;
  };

  const updateSystemUser = (id: string, updates: Partial<AppUser>) => {
    let updatedUser: AppUser | undefined;
    setSystemUsers(prev => prev.map(u => {
      if (u.id === id) {
        const newRole = updates.role || u.role;
        const newPerms = updates.permissions || (updates.role && updates.role !== u.role ? getDefaultPermissionsForRole(newRole) : u.permissions);
        const updated: AppUser = {
          ...u,
          ...updates,
          permissions: newPerms,
          canEdit: newPerms ? !newPerms.isReadOnly : u.canEdit
        };
        updatedUser = updated;
        if (currentUser.id === id) {
          setCurrentUser(updated);
        }
        return updated;
      }
      return u;
    }));

    if (updatedUser) {
      saveDocumentToFirestore(COLLECTIONS.SYSTEM_USERS, id, updatedUser);
    }

    logEvent({
      assetId: 'sys-user',
      type: 'actualizacion',
      title: `Modificación de Cuenta de Usuario`,
      description: `Se actualizaron los privilegios o datos del operador con ID: ${id}.`,
      author: currentUser.name
    });

    triggerCloudSyncAnimation();
  };

  const deleteSystemUser = (id: string): { success: boolean; error?: string } => {
    if (currentUser.id === id) {
      return { success: false, error: 'No es posible eliminar su propia cuenta mientras esté en sesión activa.' };
    }
    const target = systemUsers.find(u => u.id === id);
    if (!target) {
      return { success: false, error: 'Usuario no encontrado en el sistema.' };
    }

    // Safety check: ensure at least one active edicion_total admin remains
    const otherAdmins = systemUsers.filter(u => u.id !== id && u.role === 'edicion_total' && u.status === 'activo');
    if (target.role === 'edicion_total' && otherAdmins.length === 0) {
      return { success: false, error: 'Operación denegada: El sistema debe mantener al menos un Administrador Maestro activo.' };
    }

    deleteDocumentFromFirestore(COLLECTIONS.SYSTEM_USERS, id);
    setSystemUsers(prev => prev.filter(u => u.id !== id));

    logEvent({
      assetId: 'sys-user',
      type: 'baja',
      title: `Baja de Usuario del Sistema`,
      description: `Se revocó el acceso y se eliminó la cuenta ${target.email} (${target.name}).`,
      author: currentUser.name
    });

    triggerCloudSyncAnimation();
    return { success: true };
  };

  const toggleUserStatus = (id: string) => {
    if (currentUser.id === id) return;
    const target = systemUsers.find(u => u.id === id);
    if (target) {
      const nextStatus: 'activo' | 'inactivo' = target.status === 'inactivo' ? 'activo' : 'inactivo';
      const updated: AppUser = { ...target, status: nextStatus };
      saveDocumentToFirestore(COLLECTIONS.SYSTEM_USERS, id, updated);
      setSystemUsers(prev => prev.map(u => u.id === id ? updated : u));
      triggerCloudSyncAnimation();
    }
  };

  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);
  const [lastCloudSyncTime, setLastCloudSyncTime] = useState<string>(() => new Date().toLocaleTimeString());

  // Initialize Firestore collections & real-time synchronization
  useEffect(() => {
    seedInitialFirestoreDataIfEmpty();

    const unsubAssets = onSnapshot(collection(firestoreDb, COLLECTIONS.ASSETS), (snap) => {
      if (!snap.empty) {
        const remoteAssets = snap.docs.map(d => d.data() as HardwareAsset);
        setAssets(remoteAssets);
        setLastCloudSyncTime(new Date().toLocaleTimeString());
      }
    }, (err) => console.warn('[Firestore] Error en listener de assets:', err?.message));

    const unsubEmployees = onSnapshot(collection(firestoreDb, COLLECTIONS.EMPLOYEES), (snap) => {
      if (!snap.empty) {
        const remoteEmployees = snap.docs.map(d => d.data() as Employee);
        setEmployees(remoteEmployees);
      }
    }, (err) => console.warn('[Firestore] Error en listener de employees:', err?.message));

    const unsubAssignments = onSnapshot(collection(firestoreDb, COLLECTIONS.ASSIGNMENTS), (snap) => {
      if (!snap.empty) {
        const remoteAsg = snap.docs.map(d => d.data() as Assignment);
        setAssignments(remoteAsg);
      }
    }, (err) => console.warn('[Firestore] Error en listener de assignments:', err?.message));

    const unsubMaint = onSnapshot(collection(firestoreDb, COLLECTIONS.MAINTENANCE), (snap) => {
      if (!snap.empty) {
        const remoteMaint = snap.docs.map(d => d.data() as MaintenanceRecord);
        setMaintenanceRecords(remoteMaint);
      }
    }, (err) => console.warn('[Firestore] Error en listener de maintenance:', err?.message));

    const unsubBranches = onSnapshot(collection(firestoreDb, COLLECTIONS.BRANCHES), (snap) => {
      if (!snap.empty) {
        const remoteBranches = snap.docs.map(d => d.data() as Branch);
        setBranches(remoteBranches);
      }
    }, (err) => console.warn('[Firestore] Error en listener de branches:', err?.message));

    const unsubTransfers = onSnapshot(collection(firestoreDb, COLLECTIONS.TRANSFERS), (snap) => {
      if (!snap.empty) {
        const remoteTransfers = snap.docs.map(d => d.data() as Transfer);
        setTransfers(remoteTransfers);
      }
    }, (err) => console.warn('[Firestore] Error en listener de transfers:', err?.message));

    const unsubTimeline = onSnapshot(collection(firestoreDb, COLLECTIONS.TIMELINE), (snap) => {
      if (!snap.empty) {
        const remoteTl = snap.docs.map(d => d.data() as TimelineEvent);
        remoteTl.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setTimeline(remoteTl);
      }
    }, (err) => console.warn('[Firestore] Error en listener de timeline:', err?.message));

    const unsubEmailLogs = onSnapshot(collection(firestoreDb, COLLECTIONS.EMAIL_LOGS), (snap) => {
      if (!snap.empty) {
        const remoteEmails = snap.docs.map(d => d.data() as EmailNotification);
        remoteEmails.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
        setEmailLogs(remoteEmails);
      }
    }, (err) => console.warn('[Firestore] Error en listener de email logs:', err?.message));

    const unsubLoans = onSnapshot(collection(firestoreDb, COLLECTIONS.LOANS), (snap) => {
      if (!snap.empty) {
        const remoteLoans = snap.docs.map(d => d.data() as EquipmentLoan);
        setLoans(remoteLoans);
      }
    }, (err) => console.warn('[Firestore] Error en listener de loans:', err?.message));

    const unsubUsers = onSnapshot(collection(firestoreDb, COLLECTIONS.SYSTEM_USERS), (snap) => {
      if (!snap.empty) {
        const remoteUsers = snap.docs.map(d => d.data() as AppUser);
        setSystemUsers(remoteUsers);
      }
    }, (err) => console.warn('[Firestore] Error en listener de system users:', err?.message));

    return () => {
      unsubAssets();
      unsubEmployees();
      unsubAssignments();
      unsubMaint();
      unsubBranches();
      unsubTransfers();
      unsubTimeline();
      unsubEmailLogs();
      unsubLoans();
      unsubUsers();
    };
  }, []);

  // Save to localStorage as offline cache whenever state changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify(assets));
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
    localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(assignments));
    localStorage.setItem(STORAGE_KEYS.MAINTENANCE, JSON.stringify(maintenanceRecords));
    localStorage.setItem(STORAGE_KEYS.BRANCHES, JSON.stringify(branches));
    localStorage.setItem(STORAGE_KEYS.TRANSFERS, JSON.stringify(transfers));
    localStorage.setItem(STORAGE_KEYS.TIMELINE, JSON.stringify(timeline));
    localStorage.setItem(STORAGE_KEYS.EMAIL_LOGS, JSON.stringify(emailLogs));
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
    localStorage.setItem(STORAGE_KEYS.SYSTEM_USERS, JSON.stringify(systemUsers));
    localStorage.setItem(STORAGE_KEYS.LOANS, JSON.stringify(loans));
  }, [assets, employees, assignments, maintenanceRecords, branches, transfers, timeline, emailLogs, currentUser, systemUsers, loans]);

  const triggerCloudSyncAnimation = () => {
    setIsCloudSyncing(true);
    setTimeout(() => {
      setIsCloudSyncing(false);
      setLastCloudSyncTime(new Date().toLocaleTimeString());
    }, 700);
  };

  const forceCloudSync = async () => {
    setIsCloudSyncing(true);
    try {
      // Re-push state to Firestore to ensure complete synchronization
      assets.forEach(a => saveDocumentToFirestore(COLLECTIONS.ASSETS, a.id, a));
      employees.forEach(e => saveDocumentToFirestore(COLLECTIONS.EMPLOYEES, e.id, e));
      assignments.forEach(asg => saveDocumentToFirestore(COLLECTIONS.ASSIGNMENTS, asg.id, asg));
      branches.forEach(b => saveDocumentToFirestore(COLLECTIONS.BRANCHES, b.id, b));
      transfers.forEach(t => saveDocumentToFirestore(COLLECTIONS.TRANSFERS, t.id, t));
      maintenanceRecords.forEach(m => saveDocumentToFirestore(COLLECTIONS.MAINTENANCE, m.id, m));
      loans.forEach(l => saveDocumentToFirestore(COLLECTIONS.LOANS, l.id, l));
      systemUsers.forEach(u => saveDocumentToFirestore(COLLECTIONS.SYSTEM_USERS, u.id, u));
      setLastCloudSyncTime(new Date().toLocaleTimeString());
    } finally {
      setTimeout(() => setIsCloudSyncing(false), 700);
    }
  };

  const setUserRole = (role: UserRole) => {
    const found = SYSTEM_USERS.find(u => u.role === role);
    if (found) {
      setCurrentUser(found);
    }
  };

  const logEvent = (eventData: Omit<TimelineEvent, 'id' | 'timestamp'>) => {
    const newEvent: TimelineEvent = {
      ...eventData,
      id: `tl-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString()
    };
    setTimeline(prev => [newEvent, ...prev]);
    saveDocumentToFirestore(COLLECTIONS.TIMELINE, newEvent.id, newEvent);
    triggerCloudSyncAnimation();
  };

  const addAsset = (assetData: Omit<HardwareAsset, 'id'>): HardwareAsset => {
    const newId = `asset-${Date.now()}`;
    const newAsset: HardwareAsset = {
      ...assetData,
      id: newId
    };
    setAssets(prev => [newAsset, ...prev]);
    saveDocumentToFirestore(COLLECTIONS.ASSETS, newId, newAsset);
    
    logEvent({
      assetId: newId,
      type: 'alta',
      title: `Alta de Equipo: ${newAsset.name}`,
      description: `Equipo registrado en el inventario con placa ${newAsset.assetTag} y serie ${newAsset.serialNumber}.`,
      author: currentUser.name
    });

    triggerCloudSyncAnimation();
    return newAsset;
  };

  const addMultipleAssets = (assetsData: Omit<HardwareAsset, 'id'>[]): number => {
    if (assetsData.length === 0) return 0;
    const timestamp = Date.now();
    const newAssets: HardwareAsset[] = assetsData.map((data, idx) => ({
      ...data,
      id: `asset-${timestamp}-${idx}`
    }));

    setAssets(prev => [...newAssets, ...prev]);
    newAssets.forEach(item => saveDocumentToFirestore(COLLECTIONS.ASSETS, item.id, item));

    logEvent({
      assetId: newAssets[0].id,
      type: 'alta',
      title: `Importación Masiva de ${newAssets.length} Equipos`,
      description: `Se incorporaron ${newAssets.length} activos al inventario general mediante importación de archivo CSV.`,
      author: currentUser.name
    });

    triggerCloudSyncAnimation();
    return newAssets.length;
  };

  const updateAsset = (id: string, updates: Partial<HardwareAsset>) => {
    const existing = assets.find(a => a.id === id);
    if (existing) {
      saveDocumentToFirestore(COLLECTIONS.ASSETS, id, { ...existing, ...updates });
    }
    setAssets(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
    logEvent({
      assetId: id,
      type: 'actualizacion',
      title: 'Actualización de Datos del Equipo',
      description: `Se actualizaron las especificaciones o estado del activo.`,
      author: currentUser.name
    });
    triggerCloudSyncAnimation();
  };

  const deleteAsset = (id: string) => {
    const asset = assets.find(a => a.id === id);
    deleteDocumentFromFirestore(COLLECTIONS.ASSETS, id);
    setAssets(prev => prev.filter(a => a.id !== id));
    if (asset) {
      logEvent({
        assetId: id,
        type: 'baja',
        title: `Eliminación de Activo: ${asset.assetTag}`,
        description: `El equipo ${asset.name} fue removido del catálogo de inventario.`,
        author: currentUser.name
      });
    }
    triggerCloudSyncAnimation();
  };

  const retireAsset = (id: string, reason: string) => {
    setAssets(prev => prev.map(a => a.id === id ? { ...a, status: 'baja', notes: `${a.notes || ''} [Baja formal: ${reason}]` } : a));
    logEvent({
      assetId: id,
      type: 'baja',
      title: 'Baja Formal por Dictamen Técnico',
      description: `El equipo ha sido dado de baja del servicio activo. Motivo: ${reason}`,
      author: currentUser.name
    });
    triggerCloudSyncAnimation();
  };

  const addEmployee = (employeeData: Omit<Employee, 'id'>): Employee => {
    const newId = `emp-${Date.now()}`;
    const newEmp: Employee = {
      ...employeeData,
      id: newId
    };
    setEmployees(prev => [...prev, newEmp]);
    saveDocumentToFirestore(COLLECTIONS.EMPLOYEES, newId, newEmp);
    triggerCloudSyncAnimation();
    return newEmp;
  };

  const addMultipleEmployees = (employeesData: Omit<Employee, 'id'>[]): number => {
    if (employeesData.length === 0) return 0;
    const timestamp = Date.now();
    const newEmployees: Employee[] = employeesData.map((data, idx) => ({
      ...data,
      id: `emp-${timestamp}-${idx}`
    }));

    setEmployees(prev => [...prev, ...newEmployees]);
    newEmployees.forEach(e => saveDocumentToFirestore(COLLECTIONS.EMPLOYEES, e.id, e));
    triggerCloudSyncAnimation();
    return newEmployees.length;
  };

  const updateEmployee = (id: string, updates: Partial<Employee>) => {
    const existing = employees.find(e => e.id === id);
    if (existing) {
      saveDocumentToFirestore(COLLECTIONS.EMPLOYEES, id, { ...existing, ...updates });
    }
    setEmployees(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
    triggerCloudSyncAnimation();
  };

  const deleteEmployee = (id: string): { success: boolean; error?: string } => {
    const emp = employees.find(e => e.id === id);
    if (!emp) {
      return { success: false, error: 'Colaborador no encontrado.' };
    }

    const assignedAssets = assets.filter(a => a.assignedToEmployeeId === id && a.status === 'asignado');
    if (assignedAssets.length > 0) {
      return {
        success: false,
        error: `No es posible eliminar a ${emp.fullName}: tiene ${assignedAssets.length} equipo(s) actualmente en resguardo (${assignedAssets.map(a => a.assetTag).join(', ')}). Debe devolver o reasignar los equipos primero.`
      };
    }

    const activeLoans = loans.filter(l => l.employeeId === id && l.status === 'activo');
    if (activeLoans.length > 0) {
      return {
        success: false,
        error: `No es posible eliminar a ${emp.fullName}: tiene préstamos de equipo activos (${activeLoans.map(l => l.folio).join(', ')}). Registre la devolución previa.`
      };
    }

    deleteDocumentFromFirestore(COLLECTIONS.EMPLOYEES, id);
    setEmployees(prev => prev.filter(e => e.id !== id));
    logEvent({
      assetId: 'colab-baja',
      type: 'baja',
      title: `Baja de Colaborador: ${emp.fullName}`,
      description: `Registro de colaborador (${emp.employeeNumber} - ${emp.position}) eliminado del directorio institucional.`,
      author: currentUser.name
    });
    triggerCloudSyncAnimation();
    return { success: true };
  };

  const createAssignment = (
    assetId: string, 
    employeeId: string, 
    accessories: string[], 
    notes: string,
    itStaffName: string
  ): Assignment => {
    const year = new Date().getFullYear();
    const count = assignments.length + 1;
    const folio = `RESP-${year}-${count.toString().padStart(4, '0')}`;
    const newAssignment: Assignment = {
      id: `asg-${Date.now()}`,
      folioResponsiva: folio,
      assetId,
      employeeId,
      assignedDate: new Date().toISOString().split('T')[0],
      status: 'activa',
      accessoriesDelivered: accessories,
      itStaffName: itStaffName || currentUser.name,
      conditionNotes: notes || 'Equipo en óptimas condiciones de funcionamiento y estética.',
      clausesAccepted: true
    };

    setAssignments(prev => [newAssignment, ...prev]);
    saveDocumentToFirestore(COLLECTIONS.ASSIGNMENTS, newAssignment.id, newAssignment);

    // Update asset status
    setAssets(prev => prev.map(a => {
      if (a.id === assetId) {
        const updated = {
          ...a,
          status: 'asignado' as const,
          assignedToEmployeeId: employeeId,
          assignedDate: newAssignment.assignedDate
        };
        saveDocumentToFirestore(COLLECTIONS.ASSETS, assetId, updated);
        return updated;
      }
      return a;
    }));

    const emp = employees.find(e => e.id === employeeId);
    const ast = assets.find(a => a.id === assetId);

    logEvent({
      assetId,
      type: 'asignacion',
      title: `Asignación a ${emp?.fullName || 'Colaborador'}`,
      description: `Generada Carta Responsiva Folio ${folio}. Accesorios: ${accessories.join(', ')}.`,
      author: currentUser.name
    });

    triggerCloudSyncAnimation();
    return newAssignment;
  };

  const signResponsiva = (
    assignmentId: string, 
    employeeSignatureUrl: string, 
    itStaffSignatureUrl?: string
  ) => {
    const asg = assignments.find(a => a.id === assignmentId);
    if (asg) {
      const updated = {
        ...asg,
        employeeSignatureUrl,
        itStaffSignatureUrl: itStaffSignatureUrl || asg.itStaffSignatureUrl,
        signedAt: new Date().toISOString()
      };
      saveDocumentToFirestore(COLLECTIONS.ASSIGNMENTS, assignmentId, updated);
    }

    setAssignments(prev => prev.map(a => {
      if (a.id === assignmentId) {
        return {
          ...a,
          employeeSignatureUrl,
          itStaffSignatureUrl: itStaffSignatureUrl || a.itStaffSignatureUrl,
          signedAt: new Date().toISOString()
        };
      }
      return a;
    }));

    if (asg) {
      logEvent({
        assetId: asg.assetId,
        type: 'asignacion',
        title: `Carta Responsiva Firmada (${asg.folioResponsiva})`,
        description: `El colaborador y el área de TI han firmado digitalmente la carta responsiva de resguardo.`,
        author: currentUser.name
      });
    }

    triggerCloudSyncAnimation();
  };

  const returnAsset = (
    identifier: string, 
    condition: string, 
    notes: string,
    targetBranchId?: string
  ) => {
    // Locate assignment if provided directly or by assetId
    let asg = assignments.find(a => a.id === identifier);
    if (!asg) {
      asg = assignments.find(a => a.assetId === identifier && a.status === 'activa');
    }

    const returnDate = new Date().toISOString().split('T')[0];
    const targetAssetId = asg ? asg.assetId : identifier;

    if (asg) {
      const updatedAsg = { ...asg, status: 'devuelta' as const, returnDate };
      saveDocumentToFirestore(COLLECTIONS.ASSIGNMENTS, asg.id, updatedAsg);
      setAssignments(prev => prev.map(a => a.id === asg!.id ? updatedAsg : a));
    }

    const selectedBranch = branches.find(b => b.id === targetBranchId);

    // Update asset back to disponible and assign to selected return warehouse
    setAssets(prev => prev.map(a => {
      if (a.id === targetAssetId) {
        const finalBranchId = targetBranchId || a.branchId;
        const branchObj = branches.find(b => b.id === finalBranchId);
        const updatedAsset = {
          ...a,
          status: 'disponible' as const,
          branchId: finalBranchId,
          locationDetails: branchObj ? `Almacén ${branchObj.name}` : (a.locationDetails || 'Almacén General TI'),
          assignedToEmployeeId: undefined,
          assignedDate: undefined,
          physicalCondition: (condition as any) || a.physicalCondition,
          notes: `${a.notes || ''} [Devuelto el ${returnDate} a sede ${branchObj?.name || 'Almacén'}: ${notes}]`
        };
        saveDocumentToFirestore(COLLECTIONS.ASSETS, targetAssetId, updatedAsset);
        return updatedAsset;
      }
      return a;
    }));

    const assetObj = assets.find(a => a.id === targetAssetId);
    const branchName = selectedBranch ? selectedBranch.name : 'Almacén TI';

    logEvent({
      assetId: targetAssetId,
      type: 'devolucion',
      title: `Devolución a ${branchName}`,
      description: `Equipo ${assetObj ? `[${assetObj.assetTag}] ${assetObj.brand} ${assetObj.model}` : ''} reingresado al almacén disponible (${branchName}). Estado físico: ${condition}. Observaciones: ${notes}`,
      author: currentUser.name
    });

    triggerCloudSyncAnimation();
  };

  const createMaintenanceRecord = (recordData: Omit<MaintenanceRecord, 'id'>): MaintenanceRecord => {
    const newRecord: MaintenanceRecord = {
      ...recordData,
      id: `maint-${Date.now()}`
    };

    setMaintenanceRecords(prev => [newRecord, ...prev]);
    saveDocumentToFirestore(COLLECTIONS.MAINTENANCE, newRecord.id, newRecord);

    // Update asset next maintenance date
    setAssets(prev => prev.map(a => {
      if (a.id === recordData.assetId) {
        const updated = {
          ...a,
          lastMaintenanceDate: recordData.date,
          nextMaintenanceDate: recordData.nextScheduledDate,
          status: (recordData.status === 'programado' ? 'mantenimiento' : a.status) as any
        };
        saveDocumentToFirestore(COLLECTIONS.ASSETS, a.id, updated);
        return updated;
      }
      return a;
    }));

    logEvent({
      assetId: recordData.assetId,
      type: 'mantenimiento',
      title: `Mantenimiento ${recordData.type.toUpperCase()}`,
      description: `${recordData.description} Técnico: ${recordData.technicianName}. Próximo servicio: ${recordData.nextScheduledDate}`,
      author: currentUser.name
    });

    triggerCloudSyncAnimation();
    return newRecord;
  };

  const completeMaintenance = (maintenanceId: string, tasks: string[], score: number, nextDate: string) => {
    const maint = maintenanceRecords.find(m => m.id === maintenanceId);
    if (!maint) return;

    const today = new Date().toISOString().split('T')[0];

    const updatedMaint = {
      ...maint,
      status: 'completado' as const,
      tasksCompleted: tasks,
      diagnosticScore: score,
      nextScheduledDate: nextDate,
      date: today
    };
    saveDocumentToFirestore(COLLECTIONS.MAINTENANCE, maintenanceId, updatedMaint);

    setMaintenanceRecords(prev => prev.map(m => m.id === maintenanceId ? updatedMaint : m));

    setAssets(prev => prev.map(a => {
      if (a.id === maint.assetId) {
        const updated = {
          ...a,
          status: (a.assignedToEmployeeId ? 'asignado' : 'disponible') as any,
          lastMaintenanceDate: today,
          nextMaintenanceDate: nextDate
        };
        saveDocumentToFirestore(COLLECTIONS.ASSETS, a.id, updated);
        return updated;
      }
      return a;
    }));

    logEvent({
      assetId: maint.assetId,
      type: 'mantenimiento',
      title: 'Mantenimiento Preventivo Concluido',
      description: `Mantenimiento finalizado exitosamente. Puntuación diagnóstica: ${score}/100. Próxima fecha fijada para: ${nextDate}`,
      author: currentUser.name
    });

    triggerCloudSyncAnimation();
  };

  const sendMaintenanceEmailAlert = (assetId: string, scheduledDate?: string, customNote?: string): EmailNotification => {
    const asset = assets.find(a => a.id === assetId);
    const employee = employees.find(e => e.id === asset?.assignedToEmployeeId);
    const dateToUse = scheduledDate || asset?.nextMaintenanceDate || new Date().toISOString().split('T')[0];

    const newNotification: EmailNotification = {
      id: `em-${Date.now()}`,
      toEmail: employee?.email || 'soporte-ti@petroil.com.mx',
      toName: employee?.fullName || 'Colaborador Asignado',
      assetTag: asset?.assetTag || 'EQ-GENERAL',
      assetName: asset ? `${asset.brand} ${asset.model}` : 'Equipo de Cómputo',
      subject: `[Soporte TI] Aviso de Mantenimiento Preventivo Periódico - ${asset?.assetTag}`,
      type: 'mantenimiento_preventivo',
      scheduledDate: dateToUse,
      sentAt: new Date().toISOString(),
      status: 'enviado',
      contentSnippet: `Estimado(a) ${employee?.fullName || 'Usuario'}: Le informamos que a su equipo ${asset?.brand} ${asset?.model} (Placa ${asset?.assetTag}) le corresponde su mantenimiento preventivo periódico programado para el día ${dateToUse}. Favor de acudir al área de TI con cargador o coordinar recolección.`
    };

    setEmailLogs(prev => [newNotification, ...prev]);
    saveDocumentToFirestore(COLLECTIONS.EMAIL_LOGS, newNotification.id, newNotification);

    // Mark maintenance as notified if exists
    setMaintenanceRecords(prev => prev.map(m => {
      if (m.assetId === assetId) {
        const updated = {
          ...m,
          emailNotified: true,
          emailNotifiedAt: new Date().toISOString()
        };
        saveDocumentToFirestore(COLLECTIONS.MAINTENANCE, m.id, updated);
        return updated;
      }
      return m;
    }));

    logEvent({
      assetId,
      type: 'mantenimiento',
      title: 'Correo de Notificación de Mantenimiento Enviado',
      description: `Aviso enviado automáticamente a ${newNotification.toEmail} para servicio preventivo del ${dateToUse}.`,
      author: currentUser.name
    });

    triggerCloudSyncAnimation();
    return newNotification;
  };

  const sendWarrantyEmailAlert = (assetId: string): EmailNotification => {
    const asset = assets.find(a => a.id === assetId);
    const newNotification: EmailNotification = {
      id: `em-${Date.now()}`,
      toEmail: 'compras-ti@petroil.com.mx',
      toName: 'Administración de TI & Garantías',
      assetTag: asset?.assetTag || 'EQ-GENERAL',
      assetName: asset ? `${asset.brand} ${asset.model}` : 'Equipo',
      subject: `[Alerta Crítica] Vencimiento Próximo de Garantía - ${asset?.assetTag}`,
      type: 'garantia_por_vencer',
      sentAt: new Date().toISOString(),
      status: 'enviado',
      contentSnippet: `Aviso urgente: La garantía con el fabricante ${asset?.supplier || 'Proveedor'} para el equipo ${asset?.assetTag} vencerá el ${asset?.warrantyEndDate}. Solicite revisión preventiva antes de expirar.`
    };

    setEmailLogs(prev => [newNotification, ...prev]);
    saveDocumentToFirestore(COLLECTIONS.EMAIL_LOGS, newNotification.id, newNotification);
    triggerCloudSyncAnimation();
    return newNotification;
  };

  const createTransfer = (transferData: Omit<Transfer, 'id' | 'folio'>): Transfer => {
    const year = new Date().getFullYear();
    const count = transfers.length + 1;
    const folio = `TRAS-${year}-${count.toString().padStart(4, '0')}`;

    const newTransfer: Transfer = {
      ...transferData,
      id: `trf-${Date.now()}`,
      folio,
      status: 'en_transito'
    };

    setTransfers(prev => [newTransfer, ...prev]);
    saveDocumentToFirestore(COLLECTIONS.TRANSFERS, newTransfer.id, newTransfer);

    // Update assets status to 'traslado'
    setAssets(prev => prev.map(a => {
      if (transferData.assetIds.includes(a.id)) {
        return {
          ...a,
          status: 'traslado',
          locationDetails: `En traslado por ${transferData.carrier} (Guía: ${transferData.trackingNumber})`
        };
      }
      return a;
    }));

    transferData.assetIds.forEach(assetId => {
      logEvent({
        assetId,
        type: 'traslado',
        title: `Traslado Despachado (${folio})`,
        description: `Enviado hacia sucursal destino con guía ${transferData.trackingNumber} vía ${transferData.carrier}.`,
        author: currentUser.name
      });
    });

    triggerCloudSyncAnimation();
    return newTransfer;
  };

  const confirmTransferArrival = (transferId: string, receivedBy: string) => {
    const trf = transfers.find(t => t.id === transferId);
    if (!trf) return;

    const arrivalDate = new Date().toISOString().split('T')[0];

    setTransfers(prev => prev.map(t => {
      if (t.id === transferId) {
        return {
          ...t,
          status: 'recibido',
          actualArrival: arrivalDate,
          receivedBy
        };
      }
      return t;
    }));

    // Update assets to new branch and disponible
    setAssets(prev => prev.map(a => {
      if (trf.assetIds.includes(a.id)) {
        return {
          ...a,
          branchId: trf.targetBranchId,
          status: 'disponible',
          locationDetails: 'Almacén Sucursal Destino'
        };
      }
      return a;
    }));

    trf.assetIds.forEach(assetId => {
      logEvent({
        assetId,
        type: 'traslado',
        title: `Arribo Confirmado (${trf.folio})`,
        description: `Equipo recibido en destino por ${receivedBy}. Reincorporado al almacén disponible.`,
        author: currentUser.name
      });
    });

    triggerCloudSyncAnimation();
  };

  const addBranch = (branchData: Omit<Branch, 'id'>): Branch => {
    const newId = `branch-${Date.now()}`;
    const newBranch: Branch = {
      ...branchData,
      id: newId
    };
    saveDocumentToFirestore(COLLECTIONS.BRANCHES, newId, newBranch);
    setBranches(prev => [...prev, newBranch]);
    triggerCloudSyncAnimation();
    return newBranch;
  };

  const updateBranch = (id: string, updates: Partial<Branch>) => {
    let updatedBranch: Branch | undefined;
    setBranches(prev => prev.map(b => {
      if (b.id === id) {
        updatedBranch = { ...b, ...updates };
        return updatedBranch;
      }
      return b;
    }));
    if (updatedBranch) {
      saveDocumentToFirestore(COLLECTIONS.BRANCHES, id, updatedBranch);
    }
    triggerCloudSyncAnimation();
  };

  const deleteBranch = (id: string): { success: boolean; error?: string } => {
    const br = branches.find(b => b.id === id);
    if (!br) {
      return { success: false, error: 'Sede o sucursal no encontrada.' };
    }

    if (branches.length <= 1) {
      return {
        success: false,
        error: 'No se puede eliminar la única sede restante. El sistema requiere al menos una sucursal activa en catálogo.'
      };
    }

    const branchAssets = assets.filter(a => a.branchId === id && a.status !== 'baja');
    if (branchAssets.length > 0) {
      return {
        success: false,
        error: `No es posible eliminar la sucursal "${br.name}": tiene ${branchAssets.length} activo(s) de hardware registrados en ella. Debe trasladarlos o reasignarlos a otra sede primero.`
      };
    }

    const branchEmployees = employees.filter(e => e.branchId === id && e.status !== 'baja');
    if (branchEmployees.length > 0) {
      return {
        success: false,
        error: `No es posible eliminar la sucursal "${br.name}": tiene ${branchEmployees.length} colaborador(es) adscritos a esta ubicación. Debe reubicarlos a otra sede primero.`
      };
    }

    deleteDocumentFromFirestore(COLLECTIONS.BRANCHES, id);
    setBranches(prev => prev.filter(b => b.id !== id));
    logEvent({
      assetId: 'sucursal-baja',
      type: 'baja',
      title: `Eliminación de Sede/Almacén: ${br.name}`,
      description: `Sucursal ${br.code} (${br.city}) eliminada del catálogo institucional.`,
      author: currentUser.name
    });
    triggerCloudSyncAnimation();
    return { success: true };
  };

  // ==========================================
  // EQUIPMENT LOANS (PRÉSTAMOS TEMPORALES)
  // ==========================================
  const createLoan = (loanData: {
    assetId: string;
    employeeId: string;
    startDate: string;
    expectedReturnDate: string;
    purpose: EquipmentLoan['purpose'];
    purposeDescription: string;
    accessoriesIncluded: string[];
    conditionOnCheckout: PhysicalCondition;
    deliveryNotes?: string;
    technicianOutName: string;
    employeeSignatureCheckout?: string;
    itSignatureCheckout?: string;
  }): EquipmentLoan => {
    const year = new Date().getFullYear();
    const count = loans.length + 1;
    const folio = `PREST-${year}-${String(count).padStart(3, '0')}`;
    const newId = `loan-${Date.now()}`;

    const newLoan: EquipmentLoan = {
      ...loanData,
      id: newId,
      folio,
      status: 'activo',
      createdAt: new Date().toISOString()
    };

    saveDocumentToFirestore(COLLECTIONS.LOANS, newId, newLoan);
    setLoans(prev => [newLoan, ...prev]);

    // Update asset status to asignado
    setAssets(prev => prev.map(a => {
      if (a.id === loanData.assetId) {
        const updatedAsset = {
          ...a,
          status: 'asignado' as const,
          assignedToEmployeeId: loanData.employeeId,
          assignedDate: loanData.startDate
        };
        saveDocumentToFirestore(COLLECTIONS.ASSETS, a.id, updatedAsset);
        return updatedAsset;
      }
      return a;
    }));

    const employee = employees.find(e => e.id === loanData.employeeId);

    logEvent({
      assetId: loanData.assetId,
      type: 'prestamo',
      title: `Préstamo Temporal Otorgado (${folio})`,
      description: `Equipo prestado a ${employee?.fullName || 'Colaborador'} por motivo: ${loanData.purposeDescription}. Fecha estimada de devolución: ${loanData.expectedReturnDate.split('T')[0]}.`,
      author: currentUser.name
    });

    triggerCloudSyncAnimation();
    return newLoan;
  };

  const returnLoan = (
    loanId: string,
    conditionOnReturn: PhysicalCondition,
    returnNotes: string,
    technicianInName: string,
    employeeSignatureReturn?: string,
    itSignatureReturn?: string
  ) => {
    const loan = loans.find(l => l.id === loanId);
    if (!loan) return;

    const returnDate = new Date().toISOString();

    let updatedLoanObj: EquipmentLoan | undefined;
    setLoans(prev => prev.map(l => {
      if (l.id === loanId) {
        updatedLoanObj = {
          ...l,
          status: 'devuelto',
          actualReturnDate: returnDate,
          conditionOnReturn,
          returnNotes,
          technicianInName,
          employeeSignatureReturn,
          itSignatureReturn
        };
        return updatedLoanObj;
      }
      return l;
    }));
    if (updatedLoanObj) {
      saveDocumentToFirestore(COLLECTIONS.LOANS, loanId, updatedLoanObj);
    }

    // Free asset to disponible
    setAssets(prev => prev.map(a => {
      if (a.id === loan.assetId) {
        return {
          ...a,
          status: 'disponible',
          physicalCondition: conditionOnReturn,
          assignedToEmployeeId: undefined,
          assignedDate: undefined
        };
      }
      return a;
    }));

    logEvent({
      assetId: loan.assetId,
      type: 'prestamo_devolucion',
      title: `Devolución de Préstamo Concluida (${loan.folio})`,
      description: `Equipo retornado y verificado por ${technicianInName}. Condición física: ${conditionOnReturn}. Reincorporado al almacén disponible.`,
      author: currentUser.name
    });

    triggerCloudSyncAnimation();
  };

  const cancelLoan = (loanId: string, reason: string) => {
    const loan = loans.find(l => l.id === loanId);
    if (!loan) return;

    const updatedLoan = { ...loan, status: 'cancelado' as const, returnNotes: `Cancelado: ${reason}` };
    saveDocumentToFirestore(COLLECTIONS.LOANS, loanId, updatedLoan);
    setLoans(prev => prev.map(l => l.id === loanId ? updatedLoan : l));

    // Restore asset
    setAssets(prev => prev.map(a => {
      if (a.id === loan.assetId) {
        const restored = { ...a, status: 'disponible' as const, assignedToEmployeeId: undefined };
        saveDocumentToFirestore(COLLECTIONS.ASSETS, a.id, restored);
        return restored;
      }
      return a;
    }));

    logEvent({
      assetId: loan.assetId,
      type: 'prestamo_devolucion',
      title: `Préstamo Cancelado (${loan.folio})`,
      description: `Préstamo cancelado por ${currentUser.name}. Motivo: ${reason}`,
      author: currentUser.name
    });

    triggerCloudSyncAnimation();
  };

  // ==========================================
  // REMOTE COMMANDS & SECURITY (BITLOCKER / PANTALLA)
  // ==========================================
  const sendRemoteCommand = async (params: {
    targetId: string;
    commandType: DeviceCommandType;
    parameters?: Record<string, any>;
    agentId?: string;
    targetHostname?: string;
  }): Promise<{ success: boolean; command?: DeviceCommand; error?: string }> => {
    const asset = assets.find(a => a.id === params.targetId);
    const targetHostname = params.targetHostname || asset?.name || asset?.assetTag || params.targetId;
    const agentId = params.agentId || `agent-${targetHostname.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

    try {
      const res = await fetch(`/api/v1/devices/${params.targetId}/commands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commandType: params.commandType,
          parameters: params.parameters || {},
          requestedBy: currentUser.name,
          agentId,
          targetHostname
        })
      });

      let command: DeviceCommand;
      if (res.ok) {
        const data = await res.json();
        command = data.command;
      } else {
        // Optimistic fallback
        command = {
          id: `cmd-local-${Date.now()}`,
          assetId: params.targetId,
          agentId,
          targetHostname,
          commandType: params.commandType,
          parameters: params.parameters || {},
          status: 'pending',
          createdAt: new Date().toISOString(),
          requestedBy: currentUser.name
        };
      }

      // Log to timeline
      let eventType: TimelineEvent['type'] = 'actualizacion';
      let title = `Comando Remoto: ${params.commandType}`;
      let desc = `Comando enviado al agente en host ${targetHostname}.`;

      if (params.commandType === 'bitlocker_lock') {
        eventType = 'bloqueo_bitlocker';
        title = `Bloqueo de Seguridad BitLocker Solicitado`;
        desc = `Fuerza recuperación de arranque y bloqueo de volumen BitLocker. Motivo: ${params.parameters?.reason || 'Solicitud de seguridad por sospecha o extravío'}.`;
      } else if (params.commandType === 'bitlocker_unlock') {
        eventType = 'desbloqueo_bitlocker';
        title = `Desbloqueo / Restauración BitLocker`;
        desc = `Protectores TPM de BitLocker reactivados para arranque normal.`;
      } else if (params.commandType === 'screen_lock') {
        eventType = 'bloqueo_pantalla';
        title = `Bloqueo Inmediato de Pantalla`;
        desc = `Comando LockWorkStation despachado al equipo activo.`;
      } else if (params.commandType === 'display_message') {
        eventType = 'aviso_pantalla';
        title = `Aviso Emergente en Pantalla Despachado`;
        desc = `Mensaje: "${params.parameters?.messageTitle || 'Aviso TI'}: ${params.parameters?.messageText || ''}"`;
      }

      logEvent({
        assetId: params.targetId,
        type: eventType,
        title,
        description: desc,
        author: currentUser.name
      });

      triggerCloudSyncAnimation();
      return { success: true, command };
    } catch (err) {
      console.error('Error dispatching remote command:', err);
      return { success: false, error: String(err) };
    }
  };

  const simulateCommandExecution = async (commandId: string): Promise<{ success: boolean; command?: DeviceCommand; error?: string }> => {
    try {
      const res = await fetch(`/api/v1/agent/commands/${commandId}/simulate-exec`, {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        triggerCloudSyncAnimation();
        return { success: true, command: data.command };
      }
      return { success: false, error: 'No se pudo simular la ejecución' };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  };

  const fetchDeviceCommands = async (targetId: string): Promise<DeviceCommand[]> => {
    try {
      const res = await fetch(`/api/v1/devices/${targetId}/commands`);
      if (res.ok) {
        const data = await res.json();
        return data.commands || [];
      }
    } catch (err) {
      console.warn('Error fetching device commands:', err);
    }
    return [];
  };

  const exportDataJSON = () => {
    const fullBackup = {
      version: '1.2',
      exportedAt: new Date().toISOString(),
      assets,
      employees,
      assignments,
      maintenanceRecords,
      branches,
      transfers,
      timeline,
      emailLogs,
      systemUsers,
      loans
    };

    const blob = new Blob([JSON.stringify(fullBackup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `itasset_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importDataJSON = (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (data.assets && Array.isArray(data.assets)) setAssets(data.assets);
      if (data.employees && Array.isArray(data.employees)) setEmployees(data.employees);
      if (data.assignments && Array.isArray(data.assignments)) setAssignments(data.assignments);
      if (data.maintenanceRecords && Array.isArray(data.maintenanceRecords)) setMaintenanceRecords(data.maintenanceRecords);
      if (data.branches && Array.isArray(data.branches)) setBranches(data.branches);
      if (data.transfers && Array.isArray(data.transfers)) setTransfers(data.transfers);
      if (data.timeline && Array.isArray(data.timeline)) setTimeline(data.timeline);
      if (data.emailLogs && Array.isArray(data.emailLogs)) setEmailLogs(data.emailLogs);
      if (data.systemUsers && Array.isArray(data.systemUsers)) setSystemUsers(data.systemUsers);
      if (data.loans && Array.isArray(data.loans)) setLoans(data.loans);
      triggerCloudSyncAnimation();
      return true;
    } catch (e) {
      console.error('Error importing JSON data:', e);
      return false;
    }
  };

  const resetToDefaults = () => {
    setAssets(INITIAL_ASSETS);
    setEmployees(INITIAL_EMPLOYEES);
    setAssignments(INITIAL_ASSIGNMENTS);
    setMaintenanceRecords(INITIAL_MAINTENANCE_RECORDS);
    setBranches(INITIAL_BRANCHES);
    setTransfers(INITIAL_TRANSFERS);
    setTimeline(INITIAL_TIMELINE);
    setEmailLogs(INITIAL_EMAIL_LOGS);
    setLoans(INITIAL_LOANS);
    setSystemUsers(SYSTEM_USERS.map(u => ({
      ...u,
      status: 'activo' as const,
      createdAt: '2026-01-15',
      permissions: getDefaultPermissionsForRole(u.role),
      canEdit: u.role !== 'visor'
    })));
    setCurrentUser(SYSTEM_USERS[0]);
    triggerCloudSyncAnimation();
  };

  return (
    <InventoryContext.Provider
      value={{
        assets,
        employees,
        assignments,
        maintenanceRecords,
        branches,
        transfers,
        timeline,
        emailLogs,
        currentUser,
        systemUsers,
        loans,
        isAuthenticated,
        canEdit,
        isViewer,
        isCloudSyncing,
        lastCloudSyncTime,
        verifyCredentials,
        verifyGoogleLogin,
        completeLogin,
        login,
        logout,
        setCurrentUser,
        setUserRole,
        addSystemUser,
        updateSystemUser,
        deleteSystemUser,
        toggleUserStatus,
        hasPermission,
        addAsset,
        addMultipleAssets,
        updateAsset,
        deleteAsset,
        retireAsset,
        addEmployee,
        addMultipleEmployees,
        updateEmployee,
        deleteEmployee,
        createAssignment,
        signResponsiva,
        returnAsset,
        createMaintenanceRecord,
        completeMaintenance,
        sendMaintenanceEmailAlert,
        sendWarrantyEmailAlert,
        createTransfer,
        confirmTransferArrival,
        addBranch,
        updateBranch,
        deleteBranch,
        createLoan,
        returnLoan,
        cancelLoan,
        sendRemoteCommand,
        simulateCommandExecution,
        fetchDeviceCommands,
        logEvent,
        exportDataJSON,
        importDataJSON,
        resetToDefaults,
        forceCloudSync
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
