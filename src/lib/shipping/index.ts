// Shipping module exports

// Countries
export * from './countries';

// Regulations
export { 
  type MedicineRegulation,
  type DocumentRegulation,
  type GiftRegulation,
  type ShipmentType,
  medicineRegulations,
  documentRegulations,
  giftRegulations,
  getMedicineRegulation,
  getDocumentRegulation,
  getGiftRegulation,
  getDefaultMedicineRegulation,
  getDefaultGiftRegulation,
} from './regulations';

// Prohibited items
export * from './prohibitedItems';

// Rate calculator
export {
  type Carrier,
  type ShippingRate,
  type CourierOption,
  type RateCalculationResult,
  type CalculateRateParams,
  calculateVolumetricWeight,
  calculateRate,
  getCourierOptions,
  checkCSBIVCompliance,
} from './rateCalculator';

// ETA calculator
export * from './etaCalculator';

// Courier selection
export * from './courierSelection';
