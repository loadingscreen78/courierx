// Prohibited and restricted items database

export interface ProhibitedItem {
  id: string;
  name: string;
  category: 'global' | 'medicine' | 'gift' | 'document';
  severity: 'blocked' | 'restricted' | 'warning';
  description: string;
  countries?: string[]; // If empty, applies globally
}

// Items that are globally prohibited regardless of destination
export const globalProhibitedItems: ProhibitedItem[] = [
  { id: 'gold', name: 'Gold', category: 'global', severity: 'blocked', description: 'Gold bars, coins, jewelry, or any gold items are strictly prohibited under CSB IV.' },
  { id: 'silver', name: 'Silver', category: 'global', severity: 'blocked', description: 'Silver bars, coins, jewelry, or any silver items are strictly prohibited under CSB IV.' },
  { id: 'currency', name: 'Currency', category: 'global', severity: 'blocked', description: 'Cash, foreign currency, or negotiable instruments are prohibited.' },
  { id: 'cards', name: 'Credit/Debit Cards', category: 'global', severity: 'blocked', description: 'Credit cards, debit cards, or any payment cards are prohibited.' },
  { id: 'passport', name: 'Passport', category: 'global', severity: 'blocked', description: 'Passports and travel documents cannot be shipped internationally.' },
  { id: 'antiques', name: 'Antiques', category: 'global', severity: 'blocked', description: 'Antique items over 100 years old require special export permits.' },
  { id: 'weapons', name: 'Weapons', category: 'global', severity: 'blocked', description: 'Any weapons, ammunition, or weapon parts are strictly prohibited.' },
  { id: 'explosives', name: 'Explosives', category: 'global', severity: 'blocked', description: 'Explosives, fireworks, or pyrotechnics are prohibited.' },
  { id: 'narcotics', name: 'Narcotics', category: 'global', severity: 'blocked', description: 'Illegal drugs and narcotics are strictly prohibited.' },
  { id: 'counterfeit', name: 'Counterfeit Goods', category: 'global', severity: 'blocked', description: 'Fake branded items or counterfeit products are prohibited.' },
  { id: 'hazardous', name: 'Hazardous Materials', category: 'global', severity: 'blocked', description: 'Flammable, corrosive, radioactive, or toxic materials are prohibited.' },
  { id: 'ivory', name: 'Ivory', category: 'global', severity: 'blocked', description: 'Ivory and products from endangered species are prohibited.' },
  { id: 'human_remains', name: 'Human Remains', category: 'global', severity: 'blocked', description: 'Human remains or ashes require special permits.' },
];

// Items with warnings/restrictions for gifts
export const giftRestrictedItems: ProhibitedItem[] = [
  { id: 'battery', name: 'Batteries', category: 'gift', severity: 'warning', description: 'Lithium batteries require special packaging and declaration. Maximum 2 devices per shipment.' },
  { id: 'chemicals', name: 'Chemicals', category: 'gift', severity: 'restricted', description: 'Household chemicals, cleaning agents require proper labeling and may be restricted.' },
  { id: 'liquids', name: 'Liquids', category: 'gift', severity: 'warning', description: 'Liquids must be in sealed containers, max 500ml per item. Leak-proof packaging required.' },
  { id: 'imitation_jewelry', name: 'Imitation Jewelry', category: 'gift', severity: 'warning', description: 'Imitation/artificial jewelry is allowed but must be clearly declared to avoid customs issues.' },
  { id: 'food_items', name: 'Food Items', category: 'gift', severity: 'restricted', description: 'Food items are restricted in many countries. Check destination regulations.' },
  { id: 'alcohol', name: 'Alcohol', category: 'gift', severity: 'restricted', description: 'Alcohol is prohibited to many countries, especially Middle East.' },
  { id: 'tobacco', name: 'Tobacco Products', category: 'gift', severity: 'restricted', description: 'Tobacco and related products face heavy restrictions.' },
  { id: 'perfume', name: 'Perfumes/Fragrances', category: 'gift', severity: 'warning', description: 'Perfumes contain alcohol. Special packaging required. Check destination rules.' },
  { id: 'electronics', name: 'Electronics', category: 'gift', severity: 'warning', description: 'Electronics must have batteries removed or properly secured.' },
  { id: 'cosmetics', name: 'Cosmetics', category: 'gift', severity: 'warning', description: 'Cosmetics may have restrictions. Ensure proper labeling.' },
  { id: 'seeds', name: 'Seeds/Plants', category: 'gift', severity: 'blocked', description: 'Seeds, plants, and plant products are prohibited to most countries due to biosecurity.' },
  { id: 'meat', name: 'Meat Products', category: 'gift', severity: 'blocked', description: 'Meat, poultry, and related products are prohibited to most countries.' },
  { id: 'dairy', name: 'Dairy Products', category: 'gift', severity: 'blocked', description: 'Dairy products are prohibited to many countries.' },
];

// Country-specific prohibited items
export const countrySpecificProhibitions: Record<string, ProhibitedItem[]> = {
  'AE': [
    { id: 'pork', name: 'Pork Products', category: 'gift', severity: 'blocked', description: 'Pork and pork-derived products are prohibited in UAE.' },
    { id: 'religious', name: 'Non-Islamic Religious Items', category: 'gift', severity: 'restricted', description: 'Religious items for personal use only. Commercial quantities prohibited.' },
  ],
  'SA': [
    { id: 'pork', name: 'Pork Products', category: 'gift', severity: 'blocked', description: 'Pork and pork-derived products are strictly prohibited in Saudi Arabia.' },
    { id: 'alcohol', name: 'Alcohol', category: 'gift', severity: 'blocked', description: 'All alcohol and alcohol-containing products are strictly prohibited.' },
    { id: 'religious', name: 'Non-Islamic Religious Items', category: 'gift', severity: 'blocked', description: 'Non-Islamic religious items are prohibited.' },
  ],
  'AU': [
    { id: 'food', name: 'Food Items', category: 'gift', severity: 'blocked', description: 'Australia has very strict biosecurity. Most food items are prohibited.' },
    { id: 'wood', name: 'Wooden Items', category: 'gift', severity: 'restricted', description: 'Untreated wood products may be rejected by Australian customs.' },
  ],
  'NZ': [
    { id: 'food', name: 'Food Items', category: 'gift', severity: 'blocked', description: 'New Zealand has strict biosecurity. Food items are generally prohibited.' },
    { id: 'honey', name: 'Honey', category: 'gift', severity: 'blocked', description: 'Honey and bee products are prohibited.' },
  ],
  'JP': [
    { id: 'food', name: 'Food Items', category: 'gift', severity: 'blocked', description: 'Japan restricts most food imports. Special permits required.' },
    { id: 'certain_medicines', name: 'Common Medicines', category: 'medicine', severity: 'restricted', description: 'Many common medicines (codeine, pseudoephedrine) are restricted in Japan.' },
  ],
  'SG': [
    { id: 'chewing_gum', name: 'Chewing Gum', category: 'gift', severity: 'blocked', description: 'Chewing gum is prohibited in Singapore except therapeutic gum.' },
    { id: 'vape', name: 'Vaping Products', category: 'gift', severity: 'blocked', description: 'E-cigarettes and vaping products are banned in Singapore.' },
  ],
  'US': [
    { id: 'kinder', name: 'Kinder Eggs', category: 'gift', severity: 'blocked', description: 'Kinder Surprise eggs are banned in the USA due to choking hazard regulations.' },
    { id: 'cuban', name: 'Cuban Products', category: 'gift', severity: 'blocked', description: 'Products of Cuban origin are restricted.' },
  ],
};

// Medicine-specific prohibited items
export const medicineProhibitedItems: ProhibitedItem[] = [
  { id: 'controlled_class_a', name: 'Class A Controlled Substances', category: 'medicine', severity: 'blocked', description: 'Morphine, Heroin, Cocaine and other Class A substances are prohibited.' },
  { id: 'controlled_class_b', name: 'Class B Controlled Substances', category: 'medicine', severity: 'restricted', description: 'Amphetamines, Barbiturates require special permits and documentation.' },
  { id: 'psychotropics', name: 'Psychotropic Substances', category: 'medicine', severity: 'restricted', description: 'Sedatives, anti-anxiety medications may require additional documentation.' },
  { id: 'steroids', name: 'Anabolic Steroids', category: 'medicine', severity: 'restricted', description: 'Anabolic steroids require prescription and may be restricted in some countries.' },
];

// Helper functions
export const getAllProhibitedItems = (): ProhibitedItem[] => {
  return [...globalProhibitedItems, ...giftRestrictedItems, ...medicineProhibitedItems];
};

export const getProhibitedItemsForCountry = (countryCode: string): ProhibitedItem[] => {
  const countrySpecific = countrySpecificProhibitions[countryCode] || [];
  return [...globalProhibitedItems, ...countrySpecific];
};

export const getGiftRestrictionsForCountry = (countryCode: string): ProhibitedItem[] => {
  const countrySpecific = countrySpecificProhibitions[countryCode]?.filter(i => i.category === 'gift') || [];
  return [...giftRestrictedItems, ...countrySpecific];
};

export const getMedicineRestrictionsForCountry = (countryCode: string): ProhibitedItem[] => {
  const countrySpecific = countrySpecificProhibitions[countryCode]?.filter(i => i.category === 'medicine') || [];
  return [...medicineProhibitedItems, ...countrySpecific];
};

export const checkItemProhibition = (itemName: string, countryCode: string): ProhibitedItem | undefined => {
  const allItems = getProhibitedItemsForCountry(countryCode);
  const lowerName = itemName.toLowerCase();
  return allItems.find(item => 
    lowerName.includes(item.name.toLowerCase()) || 
    item.name.toLowerCase().includes(lowerName)
  );
};

// Safety checklist items for gift booking
export const safetyChecklistItems = [
  { id: 'battery', label: 'Contains batteries', warning: 'Lithium batteries require special handling and declaration.' },
  { id: 'chemical', label: 'Contains chemicals', warning: 'Chemicals may be restricted. Please specify type.' },
  { id: 'liquid', label: 'Contains liquids', warning: 'Liquids must be properly sealed. Max 500ml per container.' },
  { id: 'imitation_jewelry', label: 'Contains imitation jewelry', warning: 'Must be declared to avoid customs issues.' },
  { id: 'food', label: 'Contains food items', warning: 'Food items are restricted in many countries. Check destination rules.' },
  { id: 'fragile', label: 'Contains fragile items', warning: 'Fragile items require special packaging.' },
];
