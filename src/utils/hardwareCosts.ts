import { AssetCategory, HardwareAsset } from '../types/inventory';

export interface HardwarePriceRule {
  id: string;
  label: string;
  category: AssetCategory;
  brand?: string;
  modelMatch?: string[];
  cost: number;
  currency: string;
  screenSize?: string;
  description: string;
}

/**
 * Official hardware pricing catalog requested by the administration:
 * - Laptop HP: $15,750 MXN
 * - ASUS ExpertBook: $20,000 MXN
 * - ASUS ExpertBook (15.6"): $21,500 MXN
 * - Lenovo ThinkPad L14 / L15: $24,500 MXN
 * - MSI Cyborg 15 (15.6"): $28,500 MXN
 * - TABLETS: $2,300 MXN
 * - MONITORES: $1,800 MXN
 * - ESCRITORIO: $8,000 MXN
 */
export const OFFICIAL_HARDWARE_PRICES: HardwarePriceRule[] = [
  {
    id: 'price-hp-laptop',
    label: 'Laptop HP',
    category: 'laptop',
    brand: 'HP',
    cost: 15750,
    currency: 'MXN',
    description: 'Portátil HP institucional (EliteBook, ProBook, Pavilion, etc.)'
  },
  {
    id: 'price-asus-expertbook',
    label: 'ASUS ExpertBook',
    category: 'laptop',
    brand: 'ASUS',
    modelMatch: ['expertbook'],
    cost: 20000,
    currency: 'MXN',
    description: 'ASUS ExpertBook corporativo (14")'
  },
  {
    id: 'price-asus-expertbook-15',
    label: 'ASUS ExpertBook (15.6")',
    category: 'laptop',
    brand: 'ASUS',
    modelMatch: ['expertbook 15', 'expertbook (15.6")'],
    cost: 21500,
    currency: 'MXN',
    screenSize: '15.6"',
    description: 'ASUS ExpertBook 15.6" con pantalla extendida'
  },
  {
    id: 'price-lenovo-thinkpad-l',
    label: 'Lenovo ThinkPad L14 / L15',
    category: 'laptop',
    brand: 'Lenovo',
    modelMatch: ['l14', 'l15', 'thinkpad l14', 'thinkpad l15'],
    cost: 24500,
    currency: 'MXN',
    description: 'Lenovo ThinkPad serie L14 / L15 profesional'
  },
  {
    id: 'price-msi-cyborg-15',
    label: 'MSI Cyborg 15 (15.6")',
    category: 'laptop',
    brand: 'MSI',
    modelMatch: ['cyborg 15', 'cyborg'],
    cost: 28500,
    currency: 'MXN',
    screenSize: '15.6"',
    description: 'MSI Cyborg 15 (15.6") alto rendimiento'
  },
  {
    id: 'price-tablets',
    label: 'Tablets',
    category: 'tablet',
    cost: 2300,
    currency: 'MXN',
    description: 'Tablets / iPads operativos y de campo'
  },
  {
    id: 'price-monitores',
    label: 'Monitores',
    category: 'monitor',
    cost: 1800,
    currency: 'MXN',
    description: 'Monitores de estación de trabajo'
  },
  {
    id: 'price-escritorio',
    label: 'Escritorio',
    category: 'desktop',
    cost: 8000,
    currency: 'MXN',
    description: 'Computadoras de escritorio / PCs fijas'
  },
  {
    id: 'price-servidores',
    label: 'Servidores',
    category: 'servidor',
    cost: 70000,
    currency: 'MXN',
    description: 'Servidores de rack / torre y centros de datos'
  }
];

/**
 * Returns the official tariff cost based on category, brand, model, and screenSize.
 */
export function getOfficialCost(
  category: string,
  brand?: string,
  model?: string,
  screenSize?: string
): number | null {
  const cat = (category || '').toLowerCase().trim();
  const b = (brand || '').toLowerCase().trim();
  const m = (model || '').toLowerCase().trim();
  const scr = (screenSize || '').toLowerCase().trim();

  // 1. Tablets: $2,300 MXN
  if (cat === 'tablet') {
    return 2300;
  }

  // 2. Monitores: $1,800 MXN
  if (cat === 'monitor') {
    return 1800;
  }

  // 3. Escritorio: $8,000 MXN
  if (cat === 'desktop') {
    return 8000;
  }

  // 4. Servidores: $70,000 MXN
  if (cat === 'servidor' || cat === 'server') {
    return 70000;
  }

  // 4. Laptops
  if (cat === 'laptop') {
    // MSI Cyborg 15 (15.6"): $28,500 MXN
    if (b.includes('msi') || m.includes('cyborg') || (b.includes('cyborg') && scr.includes('15'))) {
      return 28500;
    }

    // ASUS ExpertBook
    if (b.includes('asus') || m.includes('expertbook')) {
      if (m.includes('15') || scr.includes('15') || scr.includes('15.6') || m.includes('15.6')) {
        return 21500; // ASUS ExpertBook (15.6"): $21,500 MXN
      }
      return 20000; // ASUS ExpertBook: $20,000 MXN
    }

    // Lenovo ThinkPad L14 / L15: $24,500 MXN
    if (
      m.includes('l14') || 
      m.includes('l15') || 
      (b.includes('lenovo') && (m.includes('l14') || m.includes('l15') || m.includes('thinkpad l')))
    ) {
      return 24500;
    }

    // HP Laptops: $15,750 MXN
    if (
      b === 'hp' ||
      b.includes('hp') || 
      b.includes('hewlett') || 
      m.includes('elitebook') || 
      m.includes('probook') || 
      m.includes('pavilion') || 
      m.includes('zbook') || 
      m.includes('victus') || 
      m.includes('omen') || 
      m.includes('spectre')
    ) {
      return 15750;
    }
  }

  // Specific check for brand HP under laptop
  if (b.includes('hp') && (cat === 'laptop' || !cat)) {
    return 15750;
  }

  return null;
}

/**
 * Checks if an asset qualifies for an official cost update and returns the target value.
 */
export function getExpectedOfficialCost(asset: Partial<HardwareAsset>): number | null {
  return getOfficialCost(
    asset.category || '',
    asset.brand || '',
    `${asset.model || ''} ${asset.name || ''}`,
    asset.specs?.screenSize || ''
  );
}
