// Rate calculation engine

import { Country, ShippingZone, getCountryByCode } from './countries';

export type Carrier = 'DHL' | 'FedEx' | 'Aramex' | 'ShipGlobal';
export type ShipmentType = 'medicine' | 'document' | 'gift';

export interface ShippingRate {
  basePrice: number;
  weightRate: number; // Per 500g
  volumetricDivisor: number;
  fuelSurchargePercent: number;
  insurancePercent: number;
  handlingFee: number;
  customsClearanceFee: number;
}

export interface CourierOption {
  carrier: Carrier;
  serviceName: string;
  price: number;
  transitDays: { min: number; max: number };
  isRecommended: boolean;
  features: string[];
}

export interface RateCalculationResult {
  baseRate: number;
  weightCharge: number;
  fuelSurcharge: number;
  insurance: number;
  handlingFee: number;
  customsFee: number;
  subtotal: number;
  gst: number;
  total: number;
  breakdown: {
    label: string;
    amount: number;
  }[];
}

// Zone-based rates
const zoneRates: Record<ShippingZone, Record<ShipmentType, ShippingRate>> = {
  1: { // Middle East
    medicine: { basePrice: 1450, weightRate: 200, volumetricDivisor: 5000, fuelSurchargePercent: 15, insurancePercent: 2, handlingFee: 150, customsClearanceFee: 200 },
    document: { basePrice: 850, weightRate: 150, volumetricDivisor: 5000, fuelSurchargePercent: 15, insurancePercent: 1, handlingFee: 100, customsClearanceFee: 0 },
    gift: { basePrice: 1250, weightRate: 180, volumetricDivisor: 5000, fuelSurchargePercent: 15, insurancePercent: 2, handlingFee: 150, customsClearanceFee: 250 },
  },
  2: { // Southeast Asia
    medicine: { basePrice: 1650, weightRate: 225, volumetricDivisor: 5000, fuelSurchargePercent: 15, insurancePercent: 2, handlingFee: 150, customsClearanceFee: 200 },
    document: { basePrice: 950, weightRate: 175, volumetricDivisor: 5000, fuelSurchargePercent: 15, insurancePercent: 1, handlingFee: 100, customsClearanceFee: 0 },
    gift: { basePrice: 1450, weightRate: 200, volumetricDivisor: 5000, fuelSurchargePercent: 15, insurancePercent: 2, handlingFee: 150, customsClearanceFee: 250 },
  },
  3: { // Europe
    medicine: { basePrice: 1850, weightRate: 250, volumetricDivisor: 5000, fuelSurchargePercent: 18, insurancePercent: 2, handlingFee: 175, customsClearanceFee: 250 },
    document: { basePrice: 1050, weightRate: 200, volumetricDivisor: 5000, fuelSurchargePercent: 18, insurancePercent: 1, handlingFee: 125, customsClearanceFee: 0 },
    gift: { basePrice: 1650, weightRate: 225, volumetricDivisor: 5000, fuelSurchargePercent: 18, insurancePercent: 2, handlingFee: 175, customsClearanceFee: 300 },
  },
  4: { // Americas
    medicine: { basePrice: 2100, weightRate: 275, volumetricDivisor: 5000, fuelSurchargePercent: 20, insurancePercent: 2, handlingFee: 200, customsClearanceFee: 300 },
    document: { basePrice: 1200, weightRate: 225, volumetricDivisor: 5000, fuelSurchargePercent: 20, insurancePercent: 1, handlingFee: 150, customsClearanceFee: 0 },
    gift: { basePrice: 1900, weightRate: 250, volumetricDivisor: 5000, fuelSurchargePercent: 20, insurancePercent: 2, handlingFee: 200, customsClearanceFee: 350 },
  },
  5: { // Oceania
    medicine: { basePrice: 2250, weightRate: 300, volumetricDivisor: 5000, fuelSurchargePercent: 20, insurancePercent: 2, handlingFee: 200, customsClearanceFee: 300 },
    document: { basePrice: 1300, weightRate: 250, volumetricDivisor: 5000, fuelSurchargePercent: 20, insurancePercent: 1, handlingFee: 150, customsClearanceFee: 0 },
    gift: { basePrice: 2050, weightRate: 275, volumetricDivisor: 5000, fuelSurchargePercent: 20, insurancePercent: 2, handlingFee: 200, customsClearanceFee: 350 },
  },
  6: { // Rest of World
    medicine: { basePrice: 2450, weightRate: 325, volumetricDivisor: 5000, fuelSurchargePercent: 22, insurancePercent: 2.5, handlingFee: 225, customsClearanceFee: 350 },
    document: { basePrice: 1400, weightRate: 275, volumetricDivisor: 5000, fuelSurchargePercent: 22, insurancePercent: 1.5, handlingFee: 175, customsClearanceFee: 0 },
    gift: { basePrice: 2250, weightRate: 300, volumetricDivisor: 5000, fuelSurchargePercent: 22, insurancePercent: 2.5, handlingFee: 225, customsClearanceFee: 400 },
  },
};

// Carrier-specific multipliers and features
const carrierConfigs: Record<Carrier, {
  multiplier: number;
  speedBonus: number; // Days faster than base
  features: string[];
  preferredZones: ShippingZone[];
  preferredRegions: string[];
}> = {
  'DHL': {
    multiplier: 1.15,
    speedBonus: 1,
    features: ['Express delivery', 'Real-time tracking', 'Temperature controlled', 'Priority customs'],
    preferredZones: [3],
    preferredRegions: ['europe'],
  },
  'FedEx': {
    multiplier: 1.12,
    speedBonus: 1,
    features: ['Express delivery', 'Detailed tracking', 'Money-back guarantee', 'Custom clearance support'],
    preferredZones: [4, 5],
    preferredRegions: ['americas', 'asia-pacific'],
  },
  'Aramex': {
    multiplier: 1.0,
    speedBonus: 0,
    features: ['Local expertise', 'Arabic support', 'Door-to-door', 'Flexible delivery'],
    preferredZones: [1],
    preferredRegions: ['middle-east'],
  },
  'ShipGlobal': {
    multiplier: 0.85,
    speedBonus: -2,
    features: ['Economy shipping', 'Basic tracking', 'Cost-effective', 'Consolidation available'],
    preferredZones: [1, 2, 3, 4, 5, 6],
    preferredRegions: [],
  },
};

export interface CalculateRateParams {
  destinationCountryCode: string;
  shipmentType: ShipmentType;
  weightGrams: number;
  dimensions?: { length: number; width: number; height: number }; // in cm
  declaredValue: number;
}

export const calculateVolumetricWeight = (
  length: number,
  width: number,
  height: number,
  divisor: number = 5000
): number => {
  return (length * width * height) / divisor;
};

export const calculateRate = (params: CalculateRateParams): RateCalculationResult | null => {
  const country = getCountryByCode(params.destinationCountryCode);
  if (!country || !country.isServed) {
    return null;
  }

  const rate = zoneRates[country.zone][params.shipmentType];
  if (!rate) {
    return null;
  }

  // Calculate actual weight in kg
  const actualWeightKg = params.weightGrams / 1000;

  // Calculate volumetric weight if dimensions provided
  let chargeableWeight = actualWeightKg;
  if (params.dimensions) {
    const volumetricWeight = calculateVolumetricWeight(
      params.dimensions.length,
      params.dimensions.width,
      params.dimensions.height,
      rate.volumetricDivisor
    );
    chargeableWeight = Math.max(actualWeightKg, volumetricWeight);
  }

  // Calculate weight units (per 500g)
  const weightUnits = Math.ceil(chargeableWeight * 2); // Convert to 500g units

  // Calculate components
  const baseRate = rate.basePrice;
  const weightCharge = weightUnits > 1 ? (weightUnits - 1) * rate.weightRate : 0;
  const subtotalBeforeFees = baseRate + weightCharge;
  const fuelSurcharge = Math.round(subtotalBeforeFees * rate.fuelSurchargePercent / 100);
  const insurance = Math.round(params.declaredValue * rate.insurancePercent / 100);
  const handlingFee = rate.handlingFee;
  const customsFee = rate.customsClearanceFee;

  const subtotal = subtotalBeforeFees + fuelSurcharge + insurance + handlingFee + customsFee;
  const gst = Math.round(subtotal * 0.18); // 18% GST
  const total = subtotal + gst;

  return {
    baseRate,
    weightCharge,
    fuelSurcharge,
    insurance,
    handlingFee,
    customsFee,
    subtotal,
    gst,
    total,
    breakdown: [
      { label: 'Base shipping rate', amount: baseRate },
      { label: `Weight charge (${chargeableWeight.toFixed(1)} kg)`, amount: weightCharge },
      { label: 'Fuel surcharge', amount: fuelSurcharge },
      { label: 'Insurance', amount: insurance },
      { label: 'Handling fee', amount: handlingFee },
      ...(customsFee > 0 ? [{ label: 'Customs clearance', amount: customsFee }] : []),
      { label: 'GST (18%)', amount: gst },
    ],
  };
};

export const getCourierOptions = (
  params: CalculateRateParams
): CourierOption[] => {
  const country = getCountryByCode(params.destinationCountryCode);
  if (!country || !country.isServed) {
    return [];
  }

  const baseResult = calculateRate(params);
  if (!baseResult) {
    return [];
  }

  const baseTransitDays = getBaseTransitDays(country.zone);

  const options: CourierOption[] = Object.entries(carrierConfigs).map(([carrier, config]) => {
    const isPreferred = config.preferredZones.includes(country.zone) || 
                       config.preferredRegions.includes(country.region);

    const price = Math.round(baseResult.total * config.multiplier);
    const transitMin = Math.max(2, baseTransitDays.min - config.speedBonus);
    const transitMax = Math.max(3, baseTransitDays.max - config.speedBonus);

    return {
      carrier: carrier as Carrier,
      serviceName: carrier === 'ShipGlobal' ? 'Economy' : 'Express',
      price,
      transitDays: { min: transitMin, max: transitMax },
      isRecommended: isPreferred,
      features: config.features,
    };
  });

  // Sort by recommendation first, then by price
  return options.sort((a, b) => {
    if (a.isRecommended && !b.isRecommended) return -1;
    if (!a.isRecommended && b.isRecommended) return 1;
    return a.price - b.price;
  });
};

const getBaseTransitDays = (zone: ShippingZone): { min: number; max: number } => {
  const transitDays: Record<ShippingZone, { min: number; max: number }> = {
    1: { min: 3, max: 5 },
    2: { min: 4, max: 6 },
    3: { min: 5, max: 8 },
    4: { min: 6, max: 10 },
    5: { min: 7, max: 11 },
    6: { min: 10, max: 15 },
  };
  return transitDays[zone];
};

// CSB IV compliance check
export const checkCSBIVCompliance = (declaredValue: number): {
  isCompliant: boolean;
  message?: string;
} => {
  const CSB_IV_LIMIT = 25000; // ₹25,000
  
  if (declaredValue > CSB_IV_LIMIT) {
    return {
      isCompliant: false,
      message: `Declared value exceeds CSB IV limit of ₹${CSB_IV_LIMIT.toLocaleString()}. Please contact us for assistance.`,
    };
  }
  
  return { isCompliant: true };
};
