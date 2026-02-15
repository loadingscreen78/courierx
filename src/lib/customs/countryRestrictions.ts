// Country-specific import restrictions and prohibited items

export interface CountryRestriction {
  countryCode: string;
  countryName: string;
  prohibitedCategories: string[];
  restrictedCategories: string[];
  prohibitedHSNCodes: string[];
  restrictedHSNCodes: string[];
  specialNotes: string[];
}

export const countryRestrictions: Record<string, CountryRestriction> = {
  'AE': {
    countryCode: 'AE',
    countryName: 'United Arab Emirates',
    prohibitedCategories: ['Weapons', 'Narcotics', 'Pork Products'],
    restrictedCategories: ['Pharmaceuticals', 'Alcohol'],
    prohibitedHSNCodes: ['93011000', '93062900', '29333990'],
    restrictedHSNCodes: ['30049099', '30042000', '33074900'],
    specialNotes: [
      'Alcohol and pork products are strictly prohibited',
      'Pharmaceuticals require import permit',
      'Religious materials may be subject to review'
    ]
  },
  'SA': {
    countryCode: 'SA',
    countryName: 'Saudi Arabia',
    prohibitedCategories: ['Weapons', 'Narcotics', 'Pork Products', 'Alcohol'],
    restrictedCategories: ['Pharmaceuticals', 'Electronics'],
    prohibitedHSNCodes: ['93011000', '93062900', '29333990', '33074900'],
    restrictedHSNCodes: ['30049099', '30042000', '85076000'],
    specialNotes: [
      'Alcohol is strictly prohibited',
      'All pharmaceuticals require prescription',
      'Electronics may require CITC approval'
    ]
  },
  'US': {
    countryCode: 'US',
    countryName: 'United States',
    prohibitedCategories: ['Weapons', 'Narcotics', 'Counterfeit Goods'],
    restrictedCategories: ['Pharmaceuticals', 'Food', 'Plants'],
    prohibitedHSNCodes: ['93011000', '93062900', '29333990'],
    restrictedHSNCodes: ['30049099', '30042000'],
    specialNotes: [
      'FDA approval required for pharmaceuticals',
      'Food items require FDA registration',
      'Plant materials require USDA permit'
    ]
  },
  'GB': {
    countryCode: 'GB',
    countryName: 'United Kingdom',
    prohibitedCategories: ['Weapons', 'Narcotics'],
    restrictedCategories: ['Pharmaceuticals', 'Food'],
    prohibitedHSNCodes: ['93011000', '93062900', '29333990'],
    restrictedHSNCodes: ['30049099', '30042000'],
    specialNotes: [
      'Pharmaceuticals require MHRA approval',
      'Food items must meet UK standards',
      'Post-Brexit customs requirements apply'
    ]
  },
  'AU': {
    countryCode: 'AU',
    countryName: 'Australia',
    prohibitedCategories: ['Weapons', 'Narcotics', 'Biological Materials'],
    restrictedCategories: ['Pharmaceuticals', 'Food', 'Plants', 'Animal Products'],
    prohibitedHSNCodes: ['93011000', '93062900', '29333990'],
    restrictedHSNCodes: ['30049099', '30042000'],
    specialNotes: [
      'Extremely strict biosecurity laws',
      'All food and plant materials require permits',
      'Pharmaceuticals require TGA approval'
    ]
  },
  'SG': {
    countryCode: 'SG',
    countryName: 'Singapore',
    prohibitedCategories: ['Weapons', 'Narcotics', 'Chewing Gum'],
    restrictedCategories: ['Pharmaceuticals', 'Tobacco'],
    prohibitedHSNCodes: ['93011000', '93062900', '29333990'],
    restrictedHSNCodes: ['30049099', '30042000'],
    specialNotes: [
      'Chewing gum is prohibited (except dental/medical)',
      'Strict drug laws with severe penalties',
      'Tobacco products heavily taxed'
    ]
  },
  'CN': {
    countryCode: 'CN',
    countryName: 'China',
    prohibitedCategories: ['Weapons', 'Narcotics', 'Political Materials'],
    restrictedCategories: ['Pharmaceuticals', 'Electronics', 'Books'],
    prohibitedHSNCodes: ['93011000', '93062900', '29333990'],
    restrictedHSNCodes: ['30049099', '30042000', '85076000'],
    specialNotes: [
      'Strict customs inspection',
      'Electronics require CCC certification',
      'Books and media subject to content review'
    ]
  },
  'JP': {
    countryCode: 'JP',
    countryName: 'Japan',
    prohibitedCategories: ['Weapons', 'Narcotics'],
    restrictedCategories: ['Pharmaceuticals', 'Food', 'Cosmetics'],
    prohibitedHSNCodes: ['93011000', '93062900', '29333990'],
    restrictedHSNCodes: ['30049099', '30042000', '33049900'],
    specialNotes: [
      'Pharmaceuticals require MHLW approval',
      'Cosmetics must meet Japanese standards',
      'Food items require detailed labeling'
    ]
  },
  'DE': {
    countryCode: 'DE',
    countryName: 'Germany',
    prohibitedCategories: ['Weapons', 'Narcotics', 'Nazi Symbols'],
    restrictedCategories: ['Pharmaceuticals', 'Food'],
    prohibitedHSNCodes: ['93011000', '93062900', '29333990'],
    restrictedHSNCodes: ['30049099', '30042000'],
    specialNotes: [
      'EU customs regulations apply',
      'Nazi symbols and memorabilia prohibited',
      'Pharmaceuticals require EU approval'
    ]
  },
  'CA': {
    countryCode: 'CA',
    countryName: 'Canada',
    prohibitedCategories: ['Weapons', 'Narcotics'],
    restrictedCategories: ['Pharmaceuticals', 'Food', 'Plants'],
    prohibitedHSNCodes: ['93011000', '93062900', '29333990'],
    restrictedHSNCodes: ['30049099', '30042000'],
    specialNotes: [
      'Health Canada approval for pharmaceuticals',
      'CFIA inspection for food and plants',
      'Strict biosecurity measures'
    ]
  },
};

// Get restrictions for a country
export function getCountryRestrictions(countryCode: string): CountryRestriction | null {
  return countryRestrictions[countryCode] || null;
}

// Check if HSN is prohibited in country
export function isProhibitedInCountry(hsnCode: string, countryCode: string): boolean {
  const restrictions = getCountryRestrictions(countryCode);
  if (!restrictions) return false;
  
  return restrictions.prohibitedHSNCodes.includes(hsnCode);
}

// Check if HSN is restricted in country
export function isRestrictedInCountry(hsnCode: string, countryCode: string): boolean {
  const restrictions = getCountryRestrictions(countryCode);
  if (!restrictions) return false;
  
  return restrictions.restrictedHSNCodes.includes(hsnCode);
}

// Check if category is prohibited in country
export function isCategoryProhibited(category: string, countryCode: string): boolean {
  const restrictions = getCountryRestrictions(countryCode);
  if (!restrictions) return false;
  
  return restrictions.prohibitedCategories.includes(category);
}

// Check if category is restricted in country
export function isCategoryRestricted(category: string, countryCode: string): boolean {
  const restrictions = getCountryRestrictions(countryCode);
  if (!restrictions) return false;
  
  return restrictions.restrictedCategories.includes(category);
}
