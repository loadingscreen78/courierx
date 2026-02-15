// ETA Calculator

import { ShippingZone, getCountryByCode } from './countries';
import { Carrier } from './rateCalculator';

export interface ETABreakdown {
  pickupToWarehouse: number;
  warehouseProcessing: number;
  internationalTransit: { min: number; max: number };
  customsClearance: { min: number; max: number };
  lastMileDelivery: { min: number; max: number };
}

export interface ETACalculation {
  breakdown: ETABreakdown;
  totalBusinessDays: { min: number; max: number };
  estimatedDeliveryDate: { earliest: Date; latest: Date };
  carrier: Carrier;
}

// Zone-based transit times
const zoneTransitTimes: Record<ShippingZone, {
  internationalTransit: { min: number; max: number };
  customsClearance: { min: number; max: number };
  lastMileDelivery: { min: number; max: number };
}> = {
  1: { // Middle East
    internationalTransit: { min: 2, max: 3 },
    customsClearance: { min: 0, max: 1 },
    lastMileDelivery: { min: 1, max: 1 },
  },
  2: { // Southeast Asia
    internationalTransit: { min: 2, max: 4 },
    customsClearance: { min: 1, max: 1 },
    lastMileDelivery: { min: 1, max: 1 },
  },
  3: { // Europe
    internationalTransit: { min: 3, max: 5 },
    customsClearance: { min: 1, max: 2 },
    lastMileDelivery: { min: 1, max: 1 },
  },
  4: { // Americas
    internationalTransit: { min: 4, max: 6 },
    customsClearance: { min: 1, max: 2 },
    lastMileDelivery: { min: 1, max: 2 },
  },
  5: { // Oceania
    internationalTransit: { min: 5, max: 7 },
    customsClearance: { min: 1, max: 2 },
    lastMileDelivery: { min: 1, max: 2 },
  },
  6: { // Rest of World
    internationalTransit: { min: 6, max: 10 },
    customsClearance: { min: 2, max: 3 },
    lastMileDelivery: { min: 2, max: 2 },
  },
};

// Carrier speed adjustments (days faster)
const carrierSpeedAdjustments: Record<Carrier, number> = {
  'DHL': 1,
  'FedEx': 1,
  'Aramex': 0,
  'ShipGlobal': -2, // Slower
};

// Standard processing times
const PICKUP_TO_WAREHOUSE = 1; // 1 business day
const WAREHOUSE_PROCESSING = 1; // 24 hours QC

export const calculateETA = (
  destinationCountryCode: string,
  carrier: Carrier = 'DHL'
): ETACalculation | null => {
  const country = getCountryByCode(destinationCountryCode);
  if (!country || !country.isServed) {
    return null;
  }

  const zoneTimes = zoneTransitTimes[country.zone];
  const speedAdjustment = carrierSpeedAdjustments[carrier];

  const breakdown: ETABreakdown = {
    pickupToWarehouse: PICKUP_TO_WAREHOUSE,
    warehouseProcessing: WAREHOUSE_PROCESSING,
    internationalTransit: {
      min: Math.max(1, zoneTimes.internationalTransit.min - speedAdjustment),
      max: Math.max(2, zoneTimes.internationalTransit.max - speedAdjustment),
    },
    customsClearance: zoneTimes.customsClearance,
    lastMileDelivery: zoneTimes.lastMileDelivery,
  };

  const totalMin = 
    breakdown.pickupToWarehouse +
    breakdown.warehouseProcessing +
    breakdown.internationalTransit.min +
    breakdown.customsClearance.min +
    breakdown.lastMileDelivery.min;

  const totalMax = 
    breakdown.pickupToWarehouse +
    breakdown.warehouseProcessing +
    breakdown.internationalTransit.max +
    breakdown.customsClearance.max +
    breakdown.lastMileDelivery.max;

  // Calculate actual dates (excluding weekends)
  const today = new Date();
  const earliestDate = addBusinessDays(today, totalMin);
  const latestDate = addBusinessDays(today, totalMax);

  return {
    breakdown,
    totalBusinessDays: { min: totalMin, max: totalMax },
    estimatedDeliveryDate: { earliest: earliestDate, latest: latestDate },
    carrier,
  };
};

// Add business days (skip weekends)
export const addBusinessDays = (startDate: Date, days: number): Date => {
  const result = new Date(startDate);
  let addedDays = 0;
  
  while (addedDays < days) {
    result.setDate(result.getDate() + 1);
    const dayOfWeek = result.getDay();
    // Skip Saturday (6) and Sunday (0)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      addedDays++;
    }
  }
  
  return result;
};

// Format date range for display
export const formatETARange = (eta: ETACalculation): string => {
  const options: Intl.DateTimeFormatOptions = { 
    day: 'numeric', 
    month: 'short' 
  };
  
  const earliest = eta.estimatedDeliveryDate.earliest.toLocaleDateString('en-IN', options);
  const latest = eta.estimatedDeliveryDate.latest.toLocaleDateString('en-IN', options);
  
  if (earliest === latest) {
    return earliest;
  }
  
  return `${earliest} - ${latest}`;
};

// Get ETA text for display
export const getETAText = (eta: ETACalculation): string => {
  const { min, max } = eta.totalBusinessDays;
  
  if (min === max) {
    return `${min} business days`;
  }
  
  return `${min}-${max} business days`;
};

// Calculate pickup date (next business day)
export const getNextPickupDate = (): Date => {
  const today = new Date();
  const currentHour = today.getHours();
  
  // If it's after 2 PM, pickup is next business day
  if (currentHour >= 14) {
    return addBusinessDays(today, 1);
  }
  
  // If it's a weekend, pickup is next Monday
  const dayOfWeek = today.getDay();
  if (dayOfWeek === 0) { // Sunday
    return addBusinessDays(today, 1);
  } else if (dayOfWeek === 6) { // Saturday
    return addBusinessDays(today, 1);
  }
  
  // Otherwise, today is the pickup date
  return today;
};

// Format pickup date for display
export const formatPickupDate = (): string => {
  const pickupDate = getNextPickupDate();
  const today = new Date();
  
  // Check if it's today
  if (pickupDate.toDateString() === today.toDateString()) {
    return 'Today';
  }
  
  // Check if it's tomorrow
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (pickupDate.toDateString() === tomorrow.toDateString()) {
    return 'Tomorrow';
  }
  
  // Otherwise, show the date
  return pickupDate.toLocaleDateString('en-IN', { 
    weekday: 'short', 
    day: 'numeric', 
    month: 'short' 
  });
};
