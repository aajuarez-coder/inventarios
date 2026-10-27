import { AssetCategory, AssetStatus, PhysicalCondition } from '../types/inventory';

export const formatCurrency = (amount: number, currency: string = 'MXN'): string => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 0
  }).format(amount);
};

export const formatDate = (dateString?: string): string => {
  if (!dateString) return 'No registrado';
  try {
    const parts = dateString.split('T')[0].split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const date = new Date(year, month, day);
      return date.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
};

export const formatDateTime = (isoString?: string): string => {
  if (!isoString) return 'N/A';
  try {
    const d = new Date(isoString);
    return `${d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })} ${d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`;
  } catch {
    return isoString;
  }
};

export interface WarrantyStatus {
  status: 'vigente' | 'por_vencer' | 'vencida';
  label: string;
  daysRemaining: number;
  badgeClass: string;
}

export const getWarrantyStatus = (warrantyEndDate: string): WarrantyStatus => {
  if (!warrantyEndDate) {
    return {
      status: 'vencida',
      label: 'Sin Garantía',
      daysRemaining: 0,
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-300'
    };
  }

  const today = new Date('2026-10-16'); // Current local date from environment
  const end = new Date(warrantyEndDate);
  const diffTime = end.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      status: 'vencida',
      label: `Vencida (${Math.abs(diffDays)}d)`,
      daysRemaining: diffDays,
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200'
    };
  } else if (diffDays <= 30) {
    return {
      status: 'por_vencer',
      label: `Vence en ${diffDays} días`,
      daysRemaining: diffDays,
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-300 animate-pulse'
    };
  } else {
    return {
      status: 'vigente',
      label: `Vigente (${Math.floor(diffDays / 30)} meses)`,
      daysRemaining: diffDays,
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    };
  }
};

export interface MaintenanceStatus {
  status: 'al_dia' | 'proximo' | 'vencido';
  label: string;
  daysRemaining: number;
  badgeClass: string;
}

export const getMaintenanceStatus = (nextMaintenanceDate: string): MaintenanceStatus => {
  if (!nextMaintenanceDate) {
    return {
      status: 'al_dia',
      label: 'Sin programar',
      daysRemaining: 999,
      badgeClass: 'bg-slate-100 text-slate-600 border-slate-200'
    };
  }

  const today = new Date('2026-10-16');
  const target = new Date(nextMaintenanceDate);
  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      status: 'vencido',
      label: `Atrasado ${Math.abs(diffDays)}d`,
      daysRemaining: diffDays,
      badgeClass: 'bg-red-100 text-red-800 border-red-300'
    };
  } else if (diffDays <= 14) {
    return {
      status: 'proximo',
      label: `En ${diffDays} días`,
      daysRemaining: diffDays,
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-300'
    };
  } else {
    return {
      status: 'al_dia',
      label: `Programado`,
      daysRemaining: diffDays,
      badgeClass: 'bg-sky-50 text-sky-700 border-sky-200'
    };
  }
};

export const getStatusBadge = (status: AssetStatus): { label: string; className: string } => {
  switch (status) {
    case 'disponible':
      return { label: 'En Almacén', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case 'asignado':
      return { label: 'Asignado', className: 'bg-blue-50 text-blue-700 border-blue-200' };
    case 'mantenimiento':
      return { label: 'En Taller / Mant.', className: 'bg-amber-50 text-amber-700 border-amber-200' };
    case 'traslado':
      return { label: 'En Traslado', className: 'bg-purple-50 text-purple-700 border-purple-200' };
    case 'baja':
      return { label: 'Dado de Baja', className: 'bg-gray-100 text-gray-700 border-gray-300 line-through' };
    default:
      return { label: status, className: 'bg-slate-100 text-slate-700 border-slate-200' };
  }
};

export const getCategoryIconName = (category: AssetCategory): string => {
  switch (category) {
    case 'laptop': return 'Laptop';
    case 'desktop': return 'Monitor';
    case 'servidor': return 'Server';
    case 'monitor': return 'Tv';
    case 'impresora': return 'Printer';
    case 'redes': return 'Network';
    case 'tablet': return 'Tablet';
    case 'periferico': return 'HardDrive';
    default: return 'Cpu';
  }
};

export const getConditionLabel = (condition: PhysicalCondition): { label: string; color: string } => {
  switch (condition) {
    case 'excelente': return { label: 'Excelente (Como nuevo)', color: 'text-emerald-600' };
    case 'bueno': return { label: 'Bueno (Uso normal)', color: 'text-blue-600' };
    case 'regular': return { label: 'Regular (Detalles estéticos)', color: 'text-amber-600' };
    case 'dañado': return { label: 'Dañado / En falla', color: 'text-red-600' };
    case 'obsoleto': return { label: 'Obsoleto / Descontinuado', color: 'text-rose-600' };
  }
};

export const calculateDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
};

