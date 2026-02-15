// Country-specific shipping regulations

export type ShipmentType = 'medicine' | 'document' | 'gift';

export interface MedicineRegulation {
  countryCode: string;
  requiresPrescription: boolean;
  maxSupplyDays: number;
  maxDeclaredValue: number; // In INR
  controlledSubstancesAllowed: boolean;
  additionalDocuments?: string[];
  prohibitedMedicines?: string[];
  notes?: string;
}

export interface DocumentRegulation {
  countryCode: string;
  maxWeightGrams: number;
  requiresApostille: boolean;
  legalDocumentsAllowed: boolean;
  financialDocsRestricted: boolean;
  notes?: string;
}

export interface GiftRegulation {
  countryCode: string;
  maxDeclaredValue: number; // In INR
  dutyFreeThreshold: number; // In local currency equivalent INR
  foodItemsAllowed: boolean;
  alcoholAllowed: boolean;
  cosmeticsRestrictions?: string;
  notes?: string;
}

// Medicine regulations by country
export const medicineRegulations: MedicineRegulation[] = [
  // Middle East
  { countryCode: 'AE', requiresPrescription: true, maxSupplyDays: 30, maxDeclaredValue: 25000, controlledSubstancesAllowed: false, additionalDocuments: ['MOHAP approval for controlled substances'], notes: 'UAE has strict medicine import rules. Ensure prescription is in English or Arabic.' },
  { countryCode: 'SA', requiresPrescription: true, maxSupplyDays: 30, maxDeclaredValue: 25000, controlledSubstancesAllowed: false, additionalDocuments: ['SFDA import license for certain medications'], notes: 'Saudi Arabia requires SFDA approval for many medications.' },
  { countryCode: 'QA', requiresPrescription: true, maxSupplyDays: 30, maxDeclaredValue: 25000, controlledSubstancesAllowed: false, notes: 'Qatar requires all medicines to be accompanied by prescription.' },
  { countryCode: 'KW', requiresPrescription: true, maxSupplyDays: 30, maxDeclaredValue: 25000, controlledSubstancesAllowed: false, notes: 'Kuwait has strict import regulations for pharmaceuticals.' },
  { countryCode: 'OM', requiresPrescription: true, maxSupplyDays: 30, maxDeclaredValue: 25000, controlledSubstancesAllowed: false, notes: 'Oman requires valid prescription for all medications.' },
  { countryCode: 'BH', requiresPrescription: true, maxSupplyDays: 30, maxDeclaredValue: 25000, controlledSubstancesAllowed: false, notes: 'Bahrain allows personal medicine imports with prescription.' },
  { countryCode: 'JO', requiresPrescription: true, maxSupplyDays: 60, maxDeclaredValue: 25000, controlledSubstancesAllowed: false },
  { countryCode: 'LB', requiresPrescription: true, maxSupplyDays: 60, maxDeclaredValue: 25000, controlledSubstancesAllowed: false },
  { countryCode: 'IL', requiresPrescription: true, maxSupplyDays: 90, maxDeclaredValue: 25000, controlledSubstancesAllowed: false, additionalDocuments: ['Hebrew/English prescription'] },
  { countryCode: 'EG', requiresPrescription: true, maxSupplyDays: 60, maxDeclaredValue: 25000, controlledSubstancesAllowed: false },
  { countryCode: 'TR', requiresPrescription: true, maxSupplyDays: 90, maxDeclaredValue: 25000, controlledSubstancesAllowed: false },

  // Southeast Asia
  { countryCode: 'SG', requiresPrescription: true, maxSupplyDays: 90, maxDeclaredValue: 25000, controlledSubstancesAllowed: false, additionalDocuments: ['HSA approval for certain medications'], notes: 'Singapore Health Sciences Authority regulates all medicine imports.' },
  { countryCode: 'MY', requiresPrescription: true, maxSupplyDays: 90, maxDeclaredValue: 25000, controlledSubstancesAllowed: false, notes: 'Malaysia requires prescription for regulated medicines.' },
  { countryCode: 'TH', requiresPrescription: true, maxSupplyDays: 30, maxDeclaredValue: 25000, controlledSubstancesAllowed: false, notes: 'Thailand has strict drug import laws. 30-day supply limit.' },
  { countryCode: 'ID', requiresPrescription: true, maxSupplyDays: 90, maxDeclaredValue: 25000, controlledSubstancesAllowed: false },
  { countryCode: 'PH', requiresPrescription: true, maxSupplyDays: 90, maxDeclaredValue: 25000, controlledSubstancesAllowed: false },
  { countryCode: 'VN', requiresPrescription: true, maxSupplyDays: 60, maxDeclaredValue: 25000, controlledSubstancesAllowed: false },

  // East Asia
  { countryCode: 'JP', requiresPrescription: true, maxSupplyDays: 30, maxDeclaredValue: 25000, controlledSubstancesAllowed: false, additionalDocuments: ['Yakkan Shoumei (import certificate) for certain medicines'], notes: 'Japan has very strict medicine import rules. Many common medicines are prohibited.' },
  { countryCode: 'KR', requiresPrescription: true, maxSupplyDays: 90, maxDeclaredValue: 25000, controlledSubstancesAllowed: false, notes: 'South Korea requires prescription for regulated drugs.' },
  { countryCode: 'CN', requiresPrescription: true, maxSupplyDays: 30, maxDeclaredValue: 25000, controlledSubstancesAllowed: false, notes: 'China has strict pharmaceutical import restrictions.' },
  { countryCode: 'HK', requiresPrescription: true, maxSupplyDays: 90, maxDeclaredValue: 25000, controlledSubstancesAllowed: false },
  { countryCode: 'TW', requiresPrescription: true, maxSupplyDays: 60, maxDeclaredValue: 25000, controlledSubstancesAllowed: false },

  // South Asia
  { countryCode: 'BD', requiresPrescription: true, maxSupplyDays: 90, maxDeclaredValue: 25000, controlledSubstancesAllowed: false },
  { countryCode: 'PK', requiresPrescription: true, maxSupplyDays: 90, maxDeclaredValue: 25000, controlledSubstancesAllowed: false },
  { countryCode: 'LK', requiresPrescription: true, maxSupplyDays: 90, maxDeclaredValue: 25000, controlledSubstancesAllowed: false },
  { countryCode: 'NP', requiresPrescription: true, maxSupplyDays: 90, maxDeclaredValue: 25000, controlledSubstancesAllowed: false },

  // Oceania
  { countryCode: 'AU', requiresPrescription: true, maxSupplyDays: 90, maxDeclaredValue: 25000, controlledSubstancesAllowed: false, additionalDocuments: ['TGA permit for certain medications'], notes: 'Australia Therapeutic Goods Administration regulates all medicine imports.' },
  { countryCode: 'NZ', requiresPrescription: true, maxSupplyDays: 90, maxDeclaredValue: 25000, controlledSubstancesAllowed: false, notes: 'New Zealand allows 3-month supply with valid prescription.' },

  // Europe
  { countryCode: 'GB', requiresPrescription: true, maxSupplyDays: 90, maxDeclaredValue: 25000, controlledSubstancesAllowed: false, additionalDocuments: ['UK prescription or doctor letter'], notes: 'UK allows personal medicine imports with documentation.' },
  { countryCode: 'DE', requiresPrescription: true, maxSupplyDays: 90, maxDeclaredValue: 25000, controlledSubstancesAllowed: true, additionalDocuments: ['EU prescription', 'Schengen certificate for controlled substances'], notes: 'Germany allows controlled substances with Schengen certificate.' },
  { countryCode: 'FR', requiresPrescription: true, maxSupplyDays: 90, maxDeclaredValue: 25000, controlledSubstancesAllowed: false, additionalDocuments: ['French or EU prescription'] },
  { countryCode: 'NL', requiresPrescription: true, maxSupplyDays: 90, maxDeclaredValue: 25000, controlledSubstancesAllowed: false },
  { countryCode: 'BE', requiresPrescription: true, maxSupplyDays: 90, maxDeclaredValue: 25000, controlledSubstancesAllowed: false },
  { countryCode: 'IT', requiresPrescription: true, maxSupplyDays: 90, maxDeclaredValue: 25000, controlledSubstancesAllowed: false },
  { countryCode: 'ES', requiresPrescription: true, maxSupplyDays: 90, maxDeclaredValue: 25000, controlledSubstancesAllowed: false },
  { countryCode: 'PT', requiresPrescription: true, maxSupplyDays: 90, maxDeclaredValue: 25000, controlledSubstancesAllowed: false },
  { countryCode: 'CH', requiresPrescription: true, maxSupplyDays: 90, maxDeclaredValue: 25000, controlledSubstancesAllowed: false },
  { countryCode: 'AT', requiresPrescription: true, maxSupplyDays: 90, maxDeclaredValue: 25000, controlledSubstancesAllowed: false },
  { countryCode: 'SE', requiresPrescription: true, maxSupplyDays: 90, maxDeclaredValue: 25000, controlledSubstancesAllowed: false },
  { countryCode: 'NO', requiresPrescription: true, maxSupplyDays: 90, maxDeclaredValue: 25000, controlledSubstancesAllowed: false },
  { countryCode: 'DK', requiresPrescription: true, maxSupplyDays: 90, maxDeclaredValue: 25000, controlledSubstancesAllowed: false },
  { countryCode: 'FI', requiresPrescription: true, maxSupplyDays: 90, maxDeclaredValue: 25000, controlledSubstancesAllowed: false },
  { countryCode: 'IE', requiresPrescription: true, maxSupplyDays: 90, maxDeclaredValue: 25000, controlledSubstancesAllowed: false },
  { countryCode: 'PL', requiresPrescription: true, maxSupplyDays: 90, maxDeclaredValue: 25000, controlledSubstancesAllowed: false },
  { countryCode: 'CZ', requiresPrescription: true, maxSupplyDays: 90, maxDeclaredValue: 25000, controlledSubstancesAllowed: false },
  { countryCode: 'GR', requiresPrescription: true, maxSupplyDays: 90, maxDeclaredValue: 25000, controlledSubstancesAllowed: false },
  { countryCode: 'HU', requiresPrescription: true, maxSupplyDays: 90, maxDeclaredValue: 25000, controlledSubstancesAllowed: false },
  { countryCode: 'RO', requiresPrescription: true, maxSupplyDays: 90, maxDeclaredValue: 25000, controlledSubstancesAllowed: false },

  // Americas
  { countryCode: 'US', requiresPrescription: true, maxSupplyDays: 90, maxDeclaredValue: 25000, controlledSubstancesAllowed: false, additionalDocuments: ['FDA declaration for certain medications'], notes: 'USA FDA regulates medicine imports. Personal use quantities allowed.' },
  { countryCode: 'CA', requiresPrescription: true, maxSupplyDays: 90, maxDeclaredValue: 25000, controlledSubstancesAllowed: false, notes: 'Canada allows 90-day supply with prescription.' },
  { countryCode: 'MX', requiresPrescription: true, maxSupplyDays: 90, maxDeclaredValue: 25000, controlledSubstancesAllowed: false },
  { countryCode: 'BR', requiresPrescription: true, maxSupplyDays: 90, maxDeclaredValue: 25000, controlledSubstancesAllowed: false },
  { countryCode: 'AR', requiresPrescription: true, maxSupplyDays: 90, maxDeclaredValue: 25000, controlledSubstancesAllowed: false },

  // Africa
  { countryCode: 'ZA', requiresPrescription: true, maxSupplyDays: 90, maxDeclaredValue: 25000, controlledSubstancesAllowed: false },
  { countryCode: 'NG', requiresPrescription: true, maxSupplyDays: 90, maxDeclaredValue: 25000, controlledSubstancesAllowed: false },
  { countryCode: 'KE', requiresPrescription: true, maxSupplyDays: 90, maxDeclaredValue: 25000, controlledSubstancesAllowed: false },
  { countryCode: 'GH', requiresPrescription: true, maxSupplyDays: 90, maxDeclaredValue: 25000, controlledSubstancesAllowed: false },
];

// Document regulations by country
export const documentRegulations: DocumentRegulation[] = [
  // Default for most countries
  { countryCode: 'DEFAULT', maxWeightGrams: 2000, requiresApostille: false, legalDocumentsAllowed: true, financialDocsRestricted: false },
  
  // Specific country regulations
  { countryCode: 'US', maxWeightGrams: 2000, requiresApostille: true, legalDocumentsAllowed: true, financialDocsRestricted: false, notes: 'Apostille required for legal documents to be used officially.' },
  { countryCode: 'GB', maxWeightGrams: 2000, requiresApostille: true, legalDocumentsAllowed: true, financialDocsRestricted: false },
  { countryCode: 'AU', maxWeightGrams: 2000, requiresApostille: true, legalDocumentsAllowed: true, financialDocsRestricted: false },
  { countryCode: 'CA', maxWeightGrams: 2000, requiresApostille: true, legalDocumentsAllowed: true, financialDocsRestricted: false },
  { countryCode: 'DE', maxWeightGrams: 2000, requiresApostille: true, legalDocumentsAllowed: true, financialDocsRestricted: false },
  { countryCode: 'FR', maxWeightGrams: 2000, requiresApostille: true, legalDocumentsAllowed: true, financialDocsRestricted: false },
  { countryCode: 'AE', maxWeightGrams: 2000, requiresApostille: true, legalDocumentsAllowed: true, financialDocsRestricted: true, notes: 'Financial documents may require additional verification.' },
  { countryCode: 'SA', maxWeightGrams: 2000, requiresApostille: true, legalDocumentsAllowed: true, financialDocsRestricted: true },
  { countryCode: 'SG', maxWeightGrams: 2000, requiresApostille: false, legalDocumentsAllowed: true, financialDocsRestricted: false },
  { countryCode: 'JP', maxWeightGrams: 2000, requiresApostille: true, legalDocumentsAllowed: true, financialDocsRestricted: false },
];

// Gift regulations by country
export const giftRegulations: GiftRegulation[] = [
  // Middle East
  { countryCode: 'AE', maxDeclaredValue: 25000, dutyFreeThreshold: 5000, foodItemsAllowed: false, alcoholAllowed: false, notes: 'Food items and alcohol prohibited.' },
  { countryCode: 'SA', maxDeclaredValue: 25000, dutyFreeThreshold: 5000, foodItemsAllowed: false, alcoholAllowed: false, notes: 'Strict regulations on gift contents.' },
  { countryCode: 'QA', maxDeclaredValue: 25000, dutyFreeThreshold: 5000, foodItemsAllowed: false, alcoholAllowed: false },
  { countryCode: 'KW', maxDeclaredValue: 25000, dutyFreeThreshold: 5000, foodItemsAllowed: false, alcoholAllowed: false },
  
  // Asia Pacific
  { countryCode: 'SG', maxDeclaredValue: 25000, dutyFreeThreshold: 3500, foodItemsAllowed: true, alcoholAllowed: false, notes: 'Food items allowed with proper declaration.' },
  { countryCode: 'MY', maxDeclaredValue: 25000, dutyFreeThreshold: 4000, foodItemsAllowed: true, alcoholAllowed: false },
  { countryCode: 'TH', maxDeclaredValue: 25000, dutyFreeThreshold: 3000, foodItemsAllowed: true, alcoholAllowed: false },
  { countryCode: 'JP', maxDeclaredValue: 25000, dutyFreeThreshold: 8000, foodItemsAllowed: false, alcoholAllowed: false, notes: 'Strict food import regulations.' },
  { countryCode: 'KR', maxDeclaredValue: 25000, dutyFreeThreshold: 12000, foodItemsAllowed: true, alcoholAllowed: false },
  { countryCode: 'AU', maxDeclaredValue: 25000, dutyFreeThreshold: 8000, foodItemsAllowed: false, alcoholAllowed: false, notes: 'Very strict biosecurity - no food items.' },
  { countryCode: 'NZ', maxDeclaredValue: 25000, dutyFreeThreshold: 6000, foodItemsAllowed: false, alcoholAllowed: false, notes: 'Strict biosecurity regulations.' },

  // Europe
  { countryCode: 'GB', maxDeclaredValue: 25000, dutyFreeThreshold: 3500, foodItemsAllowed: true, alcoholAllowed: true, cosmeticsRestrictions: 'Must comply with UK cosmetic regulations' },
  { countryCode: 'DE', maxDeclaredValue: 25000, dutyFreeThreshold: 3900, foodItemsAllowed: true, alcoholAllowed: true },
  { countryCode: 'FR', maxDeclaredValue: 25000, dutyFreeThreshold: 3900, foodItemsAllowed: true, alcoholAllowed: true },
  { countryCode: 'NL', maxDeclaredValue: 25000, dutyFreeThreshold: 3900, foodItemsAllowed: true, alcoholAllowed: true },
  { countryCode: 'IT', maxDeclaredValue: 25000, dutyFreeThreshold: 3900, foodItemsAllowed: true, alcoholAllowed: true },
  { countryCode: 'ES', maxDeclaredValue: 25000, dutyFreeThreshold: 3900, foodItemsAllowed: true, alcoholAllowed: true },
  { countryCode: 'CH', maxDeclaredValue: 25000, dutyFreeThreshold: 2500, foodItemsAllowed: true, alcoholAllowed: true },

  // Americas
  { countryCode: 'US', maxDeclaredValue: 25000, dutyFreeThreshold: 6700, foodItemsAllowed: false, alcoholAllowed: false, notes: 'FDA regulates food imports. Most foods prohibited.' },
  { countryCode: 'CA', maxDeclaredValue: 25000, dutyFreeThreshold: 1600, foodItemsAllowed: false, alcoholAllowed: false, notes: 'CBSA restricts food items.' },
  { countryCode: 'MX', maxDeclaredValue: 25000, dutyFreeThreshold: 4000, foodItemsAllowed: true, alcoholAllowed: false },
  { countryCode: 'BR', maxDeclaredValue: 25000, dutyFreeThreshold: 4000, foodItemsAllowed: true, alcoholAllowed: false },

  // Africa
  { countryCode: 'ZA', maxDeclaredValue: 25000, dutyFreeThreshold: 3000, foodItemsAllowed: true, alcoholAllowed: true },
  { countryCode: 'NG', maxDeclaredValue: 25000, dutyFreeThreshold: 4000, foodItemsAllowed: true, alcoholAllowed: false },
  { countryCode: 'KE', maxDeclaredValue: 25000, dutyFreeThreshold: 4000, foodItemsAllowed: true, alcoholAllowed: true },
];

// Helper functions
export const getMedicineRegulation = (countryCode: string): MedicineRegulation | undefined => {
  return medicineRegulations.find(r => r.countryCode === countryCode);
};

export const getDocumentRegulation = (countryCode: string): DocumentRegulation => {
  const specific = documentRegulations.find(r => r.countryCode === countryCode);
  return specific || documentRegulations.find(r => r.countryCode === 'DEFAULT')!;
};

export const getGiftRegulation = (countryCode: string): GiftRegulation | undefined => {
  return giftRegulations.find(r => r.countryCode === countryCode);
};

// Default regulation for countries not in the list
export const getDefaultMedicineRegulation = (): MedicineRegulation => ({
  countryCode: 'DEFAULT',
  requiresPrescription: true,
  maxSupplyDays: 90,
  maxDeclaredValue: 25000,
  controlledSubstancesAllowed: false,
});

export const getDefaultGiftRegulation = (): GiftRegulation => ({
  countryCode: 'DEFAULT',
  maxDeclaredValue: 25000,
  dutyFreeThreshold: 4000,
  foodItemsAllowed: true,
  alcoholAllowed: false,
});
