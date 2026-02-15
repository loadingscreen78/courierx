// Country-specific prohibited and restricted items database

export interface ProhibitedItem {
  hsnCode: string;
  itemName: string;
  reason: string;
  severity: 'prohibited' | 'restricted' | 'requires-license';
  alternatives?: string;
}

export interface CountryRestrictions {
  countryCode: string;
  countryName: string;
  prohibitedItems: ProhibitedItem[];
  generalRestrictions: string[];
}

// Global prohibited items (applies to all countries)
export const globalProhibited: ProhibitedItem[] = [
  {
    hsnCode: '93040000',
    itemName: 'Weapons, firearms, and ammunition',
    reason: 'Dangerous goods - strictly prohibited by international law',
    severity: 'prohibited',
  },
  {
    hsnCode: '36041000',
    itemName: 'Fireworks and explosives',
    reason: 'Explosive materials - aviation safety hazard',
    severity: 'prohibited',
  },
  {
    hsnCode: '38220000',
    itemName: 'Biological samples and infectious substances',
    reason: 'Biohazard - requires special handling and permits',
    severity: 'prohibited',
  },
  {
    hsnCode: '28112200',
    itemName: 'Hazardous chemicals',
    reason: 'Dangerous goods - not permitted via courier',
    severity: 'prohibited',
  },
];

// Country-specific restrictions
export const countryRestrictions: Record<string, CountryRestrictions> = {
  // Middle East Countries
  AE: {
    countryCode: 'AE',
    countryName: 'United Arab Emirates',
    prohibitedItems: [
      {
        hsnCode: '22030000',
        itemName: 'Alcoholic beverages',
        reason: 'Islamic law - alcohol prohibited without special permit',
        severity: 'prohibited',
        alternatives: 'Non-alcoholic beverages',
      },
      {
        hsnCode: '02071400',
        itemName: 'Pork products',
        reason: 'Islamic dietary laws - pork prohibited',
        severity: 'prohibited',
        alternatives: 'Halal meat products',
      },
      {
        hsnCode: '49019900',
        itemName: 'Religious materials (non-Islamic)',
        reason: 'May be restricted if deemed offensive to Islam',
        severity: 'restricted',
      },
      {
        hsnCode: '30049099',
        itemName: 'Prescription medicines',
        reason: 'Requires Ministry of Health approval',
        severity: 'requires-license',
        alternatives: 'Over-the-counter medicines with proper documentation',
      },
    ],
    generalRestrictions: [
      'All shipments subject to customs inspection',
      'Medicines require prescription and approval',
      'Drones and radio-controlled devices need permits',
    ],
  },
  
  SA: {
    countryCode: 'SA',
    countryName: 'Saudi Arabia',
    prohibitedItems: [
      {
        hsnCode: '22030000',
        itemName: 'Alcoholic beverages',
        reason: 'Strictly prohibited under Saudi law',
        severity: 'prohibited',
      },
      {
        hsnCode: '02071400',
        itemName: 'Pork products',
        reason: 'Islamic dietary laws',
        severity: 'prohibited',
      },
      {
        hsnCode: '49019900',
        itemName: 'Non-Islamic religious materials',
        reason: 'Prohibited by Saudi customs',
        severity: 'prohibited',
      },
      {
        hsnCode: '33074900',
        itemName: 'Perfumes with alcohol',
        reason: 'Alcohol content restrictions',
        severity: 'restricted',
      },
    ],
    generalRestrictions: [
      'Very strict customs regulations',
      'All medicines require prescription',
      'Electronic items may require CITC approval',
    ],
  },
  
  // United States
  US: {
    countryCode: 'US',
    countryName: 'United States',
    prohibitedItems: [
      {
        hsnCode: '30049099',
        itemName: 'Prescription medicines',
        reason: 'FDA regulations - requires prescription and approval',
        severity: 'requires-license',
      },
      {
        hsnCode: '71131900',
        itemName: 'Counterfeit goods',
        reason: 'Intellectual property violations',
        severity: 'prohibited',
      },
      {
        hsnCode: '12119099',
        itemName: 'Plant materials and seeds',
        reason: 'USDA phytosanitary regulations',
        severity: 'requires-license',
      },
    ],
    generalRestrictions: [
      'Strict FDA regulations for food and medicines',
      'Customs declaration required for all items',
      'Value over $800 subject to duties',
    ],
  },
  
  // United Kingdom
  GB: {
    countryCode: 'GB',
    countryName: 'United Kingdom',
    prohibitedItems: [
      {
        hsnCode: '93040000',
        itemName: 'Offensive weapons',
        reason: 'UK weapons laws',
        severity: 'prohibited',
      },
      {
        hsnCode: '30049099',
        itemName: 'Controlled medicines',
        reason: 'Requires MHRA approval',
        severity: 'requires-license',
      },
    ],
    generalRestrictions: [
      'Post-Brexit customs procedures apply',
      'VAT applicable on imports',
      'Medicines require proper documentation',
    ],
  },
  
  // Australia
  AU: {
    countryCode: 'AU',
    countryName: 'Australia',
    prohibitedItems: [
      {
        hsnCode: '12119099',
        itemName: 'Seeds and plant materials',
        reason: 'Biosecurity - strict quarantine laws',
        severity: 'prohibited',
      },
      {
        hsnCode: '02071400',
        itemName: 'Meat and dairy products',
        reason: 'Biosecurity regulations',
        severity: 'prohibited',
      },
      {
        hsnCode: '30049099',
        itemName: 'Medicines',
        reason: 'TGA approval required',
        severity: 'requires-license',
      },
      {
        hsnCode: '17049000',
        itemName: 'Food items',
        reason: 'Strict biosecurity - requires declaration',
        severity: 'restricted',
      },
    ],
    generalRestrictions: [
      'Extremely strict biosecurity laws',
      'All food items must be declared',
      'Heavy penalties for non-compliance',
    ],
  },
  
  // Singapore
  SG: {
    countryCode: 'SG',
    countryName: 'Singapore',
    prohibitedItems: [
      {
        hsnCode: '24031100',
        itemName: 'Tobacco products',
        reason: 'Requires import license and high duties',
        severity: 'requires-license',
      },
      {
        hsnCode: '36041000',
        itemName: 'Firecrackers',
        reason: 'Prohibited under Singapore law',
        severity: 'prohibited',
      },
      {
        hsnCode: '85065000',
        itemName: 'E-cigarettes and vaping devices',
        reason: 'Banned in Singapore',
        severity: 'prohibited',
      },
    ],
    generalRestrictions: [
      'Strict regulations on tobacco',
      'Chewing gum restrictions',
      'Medicines require HSA approval',
    ],
  },
  
  // China
  CN: {
    countryCode: 'CN',
    countryName: 'China',
    prohibitedItems: [
      {
        hsnCode: '49019900',
        itemName: 'Political or religious materials',
        reason: 'Content restrictions',
        severity: 'prohibited',
      },
      {
        hsnCode: '85171200',
        itemName: 'Encrypted communication devices',
        reason: 'Requires government approval',
        severity: 'requires-license',
      },
      {
        hsnCode: '30049099',
        itemName: 'Medicines',
        reason: 'NMPA approval required',
        severity: 'requires-license',
      },
    ],
    generalRestrictions: [
      'Strict content censorship',
      'Electronics may require CCC certification',
      'Customs clearance can be slow',
    ],
  },
};

// Get restrictions for a country
export function getCountryRestrictions(countryCode: string): CountryRestrictions | null {
  return countryRestrictions[countryCode] || null;
}

// Check if item is prohibited for a specific country
export function checkItemRestriction(
  hsnCode: string,
  countryCode: string
): { isAllowed: boolean; restriction?: ProhibitedItem } {
  // Check global prohibitions first
  const globalRestriction = globalProhibited.find(item => item.hsnCode === hsnCode);
  if (globalRestriction) {
    return { isAllowed: false, restriction: globalRestriction };
  }
  
  // Check country-specific restrictions
  const countryRules = countryRestrictions[countryCode];
  if (countryRules) {
    const countryRestriction = countryRules.prohibitedItems.find(item => item.hsnCode === hsnCode);
    if (countryRestriction) {
      return { 
        isAllowed: countryRestriction.severity !== 'prohibited', 
        restriction: countryRestriction 
      };
    }
  }
  
  return { isAllowed: true };
}

// Get all restrictions for multiple items
export function validateShipment(items: { hsnCode: string; name: string }[], countryCode: string) {
  const issues: Array<{
    itemName: string;
    hsnCode: string;
    restriction: ProhibitedItem;
  }> = [];
  
  for (const item of items) {
    const check = checkItemRestriction(item.hsnCode, countryCode);
    if (!check.isAllowed && check.restriction) {
      issues.push({
        itemName: item.name,
        hsnCode: item.hsnCode,
        restriction: check.restriction,
      });
    }
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    countryRules: countryRestrictions[countryCode],
  };
}
