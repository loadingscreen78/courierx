// HSN Code Database with categories and restrictions

export interface HSNCode {
  code: string;
  description: string;
  category: string;
  requiresLicense: boolean;
  globallyProhibited: boolean;
  globallyRestricted: boolean;
  restrictionReason?: string;
  commonNames: string[];
}

// Comprehensive HSN database
export const hsnDatabase: Record<string, HSNCode> = {
  // Electronics & Batteries
  '85076000': {
    code: '85076000',
    description: 'Lithium-ion batteries',
    category: 'Electronics',
    requiresLicense: false,
    globallyProhibited: false,
    globallyRestricted: true,
    restrictionReason: 'Dangerous goods - requires special packaging and documentation',
    commonNames: ['battery', 'lithium battery', 'rechargeable battery', 'power bank']
  },
  '85078000': {
    code: '85078000',
    description: 'Other electric accumulators',
    category: 'Electronics',
    requiresLicense: false,
    globallyProhibited: false,
    globallyRestricted: true,
    restrictionReason: 'May contain hazardous materials',
    commonNames: ['battery', 'accumulator', 'cell']
  },
  '85171200': {
    code: '85171200',
    description: 'Smartphones and mobile phones',
    category: 'Electronics',
    requiresLicense: false,
    globallyProhibited: false,
    globallyRestricted: false,
    commonNames: ['phone', 'smartphone', 'mobile', 'cellphone']
  },
  '85176200': {
    code: '85176200',
    description: 'Machines for reception, conversion and transmission',
    category: 'Electronics',
    requiresLicense: false,
    globallyProhibited: false,
    globallyRestricted: false,
    commonNames: ['router', 'modem', 'network device']
  },

  // Pharmaceuticals
  '30049099': {
    code: '30049099',
    description: 'Other medicaments',
    category: 'Pharmaceuticals',
    requiresLicense: true,
    globallyProhibited: false,
    globallyRestricted: true,
    restrictionReason: 'Requires prescription and import license',
    commonNames: ['medicine', 'drug', 'medication', 'pharmaceutical']
  },
  '30042000': {
    code: '30042000',
    description: 'Antibiotics',
    category: 'Pharmaceuticals',
    requiresLicense: true,
    globallyProhibited: false,
    globallyRestricted: true,
    restrictionReason: 'Controlled substance - requires prescription',
    commonNames: ['antibiotic', 'antibacterial']
  },

  // Chemicals
  '28112200': {
    code: '28112200',
    description: 'Silicon dioxide',
    category: 'Chemicals',
    requiresLicense: false,
    globallyProhibited: false,
    globallyRestricted: true,
    restrictionReason: 'Chemical substance - requires safety documentation',
    commonNames: ['silica', 'silicon dioxide']
  },
  '38220000': {
    code: '38220000',
    description: 'Diagnostic or laboratory reagents',
    category: 'Chemicals',
    requiresLicense: true,
    globallyProhibited: false,
    globallyRestricted: true,
    restrictionReason: 'Requires import permit and safety certification',
    commonNames: ['reagent', 'chemical', 'laboratory chemical']
  },

  // Textiles & Clothing
  '61091000': {
    code: '61091000',
    description: 'T-shirts, singlets and other vests of cotton',
    category: 'Textiles',
    requiresLicense: false,
    globallyProhibited: false,
    globallyRestricted: false,
    commonNames: ['t-shirt', 'tshirt', 'shirt', 'vest']
  },
  '62114200': {
    code: '62114200',
    description: 'Women\'s or girls\' garments of cotton',
    category: 'Textiles',
    requiresLicense: false,
    globallyProhibited: false,
    globallyRestricted: false,
    commonNames: ['dress', 'garment', 'clothing', 'apparel']
  },
  '64029900': {
    code: '64029900',
    description: 'Other footwear',
    category: 'Textiles',
    requiresLicense: false,
    globallyProhibited: false,
    globallyRestricted: false,
    commonNames: ['shoes', 'footwear', 'sandals', 'slippers']
  },

  // Toys & Games
  '95030010': {
    code: '95030010',
    description: 'Toys',
    category: 'Toys',
    requiresLicense: false,
    globallyProhibited: false,
    globallyRestricted: false,
    commonNames: ['toy', 'game', 'plaything']
  },
  '95030090': {
    code: '95030090',
    description: 'Other toys',
    category: 'Toys',
    requiresLicense: false,
    globallyProhibited: false,
    globallyRestricted: false,
    commonNames: ['toy', 'puzzle', 'game']
  },

  // Books & Stationery
  '49019900': {
    code: '49019900',
    description: 'Printed books, brochures and similar printed matter',
    category: 'Books',
    requiresLicense: false,
    globallyProhibited: false,
    globallyRestricted: false,
    commonNames: ['book', 'magazine', 'publication']
  },
  '96081000': {
    code: '96081000',
    description: 'Ball point pens',
    category: 'Stationery',
    requiresLicense: false,
    globallyProhibited: false,
    globallyRestricted: false,
    commonNames: ['pen', 'ballpoint', 'writing instrument']
  },

  // Cosmetics & Personal Care
  '33049900': {
    code: '33049900',
    description: 'Beauty or make-up preparations',
    category: 'Cosmetics',
    requiresLicense: false,
    globallyProhibited: false,
    globallyRestricted: false,
    commonNames: ['cosmetic', 'makeup', 'beauty product']
  },
  '33074900': {
    code: '33074900',
    description: 'Other perfumery or toilet preparations',
    category: 'Cosmetics',
    requiresLicense: false,
    globallyProhibited: false,
    globallyRestricted: false,
    commonNames: ['perfume', 'fragrance', 'cologne']
  },

  // Jewelry & Accessories
  '71179000': {
    code: '71179000',
    description: 'Imitation jewellery',
    category: 'Jewelry',
    requiresLicense: false,
    globallyProhibited: false,
    globallyRestricted: true,
    restrictionReason: 'May require declaration of materials',
    commonNames: ['jewelry', 'jewellery', 'accessory', 'ornament']
  },
  '42023100': {
    code: '42023100',
    description: 'Wallets, purses and similar articles',
    category: 'Accessories',
    requiresLicense: false,
    globallyProhibited: false,
    globallyRestricted: false,
    commonNames: ['wallet', 'purse', 'bag']
  },

  // Food & Beverages
  '17049000': {
    code: '17049000',
    description: 'Sugar confectionery',
    category: 'Food',
    requiresLicense: false,
    globallyProhibited: false,
    globallyRestricted: true,
    restrictionReason: 'Food items require health certification',
    commonNames: ['candy', 'chocolate', 'sweet', 'confectionery']
  },
  '21069030': {
    code: '21069030',
    description: 'Food preparations',
    category: 'Food',
    requiresLicense: false,
    globallyProhibited: false,
    globallyRestricted: true,
    restrictionReason: 'Food items require import permit',
    commonNames: ['food', 'snack', 'preparation']
  },

  // Home & Kitchen
  '69111000': {
    code: '69111000',
    description: 'Tableware and kitchenware of porcelain or china',
    category: 'Home',
    requiresLicense: false,
    globallyProhibited: false,
    globallyRestricted: false,
    commonNames: ['plate', 'cup', 'dish', 'kitchenware']
  },
  '73239300': {
    code: '73239300',
    description: 'Table, kitchen or other household articles of stainless steel',
    category: 'Home',
    requiresLicense: false,
    globallyProhibited: false,
    globallyRestricted: false,
    commonNames: ['utensil', 'cutlery', 'kitchen item']
  },

  // Jewelry & Precious Items
  '71131900': {
    code: '71131900',
    description: 'Imitation jewellery of other base metal',
    category: 'Jewelry',
    requiresLicense: false,
    globallyProhibited: false,
    globallyRestricted: true,
    restrictionReason: 'May require customs declaration for value assessment',
    commonNames: ['jewelry', 'jewellery', 'imitation jewelry', 'fashion jewelry']
  },
  '71171900': {
    code: '71171900',
    description: 'Imitation jewellery of other materials',
    category: 'Jewelry',
    requiresLicense: false,
    globallyProhibited: false,
    globallyRestricted: false,
    commonNames: ['jewelry', 'jewellery', 'costume jewelry']
  },

  // Prohibited Items
  '93011000': {
    code: '93011000',
    description: 'Artillery weapons',
    category: 'Weapons',
    requiresLicense: true,
    globallyProhibited: true,
    globallyRestricted: true,
    restrictionReason: 'Weapons and ammunition are strictly prohibited',
    commonNames: ['weapon', 'gun', 'firearm']
  },
  '93062900': {
    code: '93062900',
    description: 'Other cartridges',
    category: 'Weapons',
    requiresLicense: true,
    globallyProhibited: true,
    globallyRestricted: true,
    restrictionReason: 'Ammunition is strictly prohibited',
    commonNames: ['ammunition', 'bullets', 'cartridge']
  },
  '29333990': {
    code: '29333990',
    description: 'Other compounds containing pyridine ring',
    category: 'Narcotics',
    requiresLicense: true,
    globallyProhibited: true,
    globallyRestricted: true,
    restrictionReason: 'Controlled narcotic substance',
    commonNames: ['narcotic', 'drug', 'controlled substance']
  },
};

// Search HSN by code
export function getHSNByCode(code: string): HSNCode | null {
  return hsnDatabase[code] || null;
}

// Search HSN by item name
export function searchHSNByName(itemName: string): HSNCode[] {
  const searchTerm = itemName.toLowerCase().trim();
  const results: HSNCode[] = [];
  
  for (const hsn of Object.values(hsnDatabase)) {
    if (
      hsn.description.toLowerCase().includes(searchTerm) ||
      hsn.commonNames.some(name => name.toLowerCase().includes(searchTerm))
    ) {
      results.push(hsn);
    }
  }
  
  return results;
}

// Validate HSN code format
export function isValidHSNFormat(code: string): boolean {
  return /^\d{8}$/.test(code);
}
