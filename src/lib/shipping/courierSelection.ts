// Courier selection algorithm

import { Country, getCountryByCode, Region } from './countries';
import { Carrier } from './rateCalculator';
import { ShipmentType } from './regulations';

export interface CourierRecommendation {
  carrier: Carrier;
  reason: string;
  isPrimary: boolean;
}

// Define which couriers are best for which regions/countries
const regionPreferences: Record<Region, Carrier[]> = {
  'middle-east': ['Aramex', 'DHL', 'FedEx', 'ShipGlobal'],
  'europe': ['DHL', 'FedEx', 'Aramex', 'ShipGlobal'],
  'americas': ['FedEx', 'DHL', 'ShipGlobal', 'Aramex'],
  'asia-pacific': ['FedEx', 'DHL', 'Aramex', 'ShipGlobal'],
  'africa': ['DHL', 'FedEx', 'Aramex', 'ShipGlobal'],
};

// Country-specific preferences
const countryPreferences: Record<string, Carrier> = {
  // Middle East - Aramex is the local champion
  'AE': 'Aramex',
  'SA': 'Aramex',
  'QA': 'Aramex',
  'KW': 'Aramex',
  'OM': 'Aramex',
  'BH': 'Aramex',
  'JO': 'Aramex',
  'EG': 'Aramex',
  
  // Europe - DHL headquarters
  'DE': 'DHL',
  'GB': 'DHL',
  'FR': 'DHL',
  'NL': 'DHL',
  'BE': 'DHL',
  'AT': 'DHL',
  'CH': 'DHL',
  
  // Americas - FedEx dominance
  'US': 'FedEx',
  'CA': 'FedEx',
  'MX': 'FedEx',
  'BR': 'FedEx',
  
  // Asia Pacific
  'AU': 'FedEx',
  'NZ': 'FedEx',
  'SG': 'DHL',
  'HK': 'DHL',
  'JP': 'DHL',
  'KR': 'DHL',
};

// Shipment type considerations
const shipmentTypePreferences: Record<ShipmentType, Carrier[]> = {
  'medicine': ['DHL', 'FedEx', 'Aramex', 'ShipGlobal'], // Temperature sensitive - prefer premium carriers
  'document': ['DHL', 'FedEx', 'Aramex', 'ShipGlobal'], // Speed matters
  'gift': ['ShipGlobal', 'Aramex', 'FedEx', 'DHL'], // Cost-effective options first
};

export const getRecommendedCourier = (
  countryCode: string,
  shipmentType: ShipmentType
): CourierRecommendation[] => {
  const country = getCountryByCode(countryCode);
  if (!country || !country.isServed) {
    return [];
  }

  const recommendations: CourierRecommendation[] = [];
  
  // Check for country-specific preference
  const countryPreference = countryPreferences[countryCode];
  if (countryPreference) {
    recommendations.push({
      carrier: countryPreference,
      reason: `Best network coverage in ${country.name}`,
      isPrimary: true,
    });
  }
  
  // Add region-based recommendations
  const regionOrder = regionPreferences[country.region];
  
  regionOrder.forEach((carrier, index) => {
    // Skip if already added as country preference
    if (carrier === countryPreference) return;
    
    let reason = '';
    switch (carrier) {
      case 'DHL':
        reason = 'Fast express delivery with real-time tracking';
        break;
      case 'FedEx':
        reason = 'Reliable service with money-back guarantee';
        break;
      case 'Aramex':
        reason = 'Excellent local delivery network';
        break;
      case 'ShipGlobal':
        reason = 'Most economical option';
        break;
    }
    
    recommendations.push({
      carrier,
      reason,
      isPrimary: index === 0 && !countryPreference,
    });
  });
  
  // Adjust for shipment type (medicines should prefer premium carriers)
  if (shipmentType === 'medicine') {
    const sorted = [...recommendations].sort((a, b) => {
      const aIndex = shipmentTypePreferences.medicine.indexOf(a.carrier);
      const bIndex = shipmentTypePreferences.medicine.indexOf(b.carrier);
      return aIndex - bIndex;
    });
    
    // Update isPrimary based on new order
    sorted.forEach((rec, index) => {
      rec.isPrimary = index === 0;
    });
    
    return sorted;
  }
  
  return recommendations;
};

// Get the single best courier for a destination
export const getBestCourier = (
  countryCode: string,
  shipmentType: ShipmentType
): Carrier => {
  const recommendations = getRecommendedCourier(countryCode, shipmentType);
  const primary = recommendations.find(r => r.isPrimary);
  return primary?.carrier || 'DHL';
};

// Get carrier description
export const getCarrierDescription = (carrier: Carrier): string => {
  const descriptions: Record<Carrier, string> = {
    'DHL': 'Global leader in express logistics with extensive European network',
    'FedEx': 'Premium express delivery with comprehensive tracking',
    'Aramex': 'Middle East specialist with excellent local coverage',
    'ShipGlobal': 'Economy shipping solution for cost-conscious customers',
  };
  return descriptions[carrier];
};

// Get carrier logo/icon color
export const getCarrierColor = (carrier: Carrier): string => {
  const colors: Record<Carrier, string> = {
    'DHL': '#FFCC00', // DHL Yellow
    'FedEx': '#4D148C', // FedEx Purple
    'Aramex': '#FF6600', // Aramex Orange
    'ShipGlobal': '#2563EB', // Blue
  };
  return colors[carrier];
};

// Get carrier display info
export const getCarrierInfo = (carrier: Carrier): {
  name: string;
  fullName: string;
  color: string;
  description: string;
} => {
  const info: Record<Carrier, { name: string; fullName: string; color: string; description: string }> = {
    'DHL': {
      name: 'DHL',
      fullName: 'DHL Express',
      color: '#FFCC00',
      description: 'Global express logistics leader',
    },
    'FedEx': {
      name: 'FedEx',
      fullName: 'FedEx International',
      color: '#4D148C',
      description: 'Premium worldwide delivery',
    },
    'Aramex': {
      name: 'Aramex',
      fullName: 'Aramex International',
      color: '#FF6600',
      description: 'Middle East & Asia specialist',
    },
    'ShipGlobal': {
      name: 'ShipGlobal',
      fullName: 'ShipGlobal Economy',
      color: '#2563EB',
      description: 'Cost-effective shipping',
    },
  };
  return info[carrier];
};
