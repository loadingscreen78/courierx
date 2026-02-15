// Hook for rate calculation

import { useState, useMemo, useCallback } from 'react';
import { 
  calculateRate, 
  getCourierOptions, 
  checkCSBIVCompliance,
  CalculateRateParams,
  RateCalculationResult,
  CourierOption,
  Carrier,
} from '@/lib/shipping/rateCalculator';
import { calculateETA, ETACalculation, formatETARange, getETAText } from '@/lib/shipping/etaCalculator';
import { getCountryByCode } from '@/lib/shipping/countries';

export interface UseRateCalculatorParams {
  destinationCountryCode: string;
  shipmentType: 'medicine' | 'document' | 'gift';
  weightGrams: number;
  dimensions?: { length: number; width: number; height: number };
  declaredValue: number;
}

export interface UseRateCalculatorReturn {
  // Rate data
  baseRate: RateCalculationResult | null;
  courierOptions: CourierOption[];
  selectedCourier: CourierOption | null;
  selectCourier: (carrier: Carrier) => void;
  
  // ETA data
  eta: ETACalculation | null;
  etaText: string;
  etaRange: string;
  
  // Compliance
  isCompliant: boolean;
  complianceMessage: string | undefined;
  
  // State
  isCalculating: boolean;
  error: string | null;
  
  // Country info
  isCountryServed: boolean;
  countryNotServedReason: string | undefined;
}

export const useRateCalculator = (params: UseRateCalculatorParams): UseRateCalculatorReturn => {
  const [selectedCarrier, setSelectedCarrier] = useState<Carrier | null>(null);

  // Check if country is served
  const country = useMemo(() => {
    if (!params.destinationCountryCode) return null;
    return getCountryByCode(params.destinationCountryCode);
  }, [params.destinationCountryCode]);

  const isCountryServed = country?.isServed ?? false;
  const countryNotServedReason = country?.notServedReason;

  // CSB IV compliance check
  const compliance = useMemo(() => {
    return checkCSBIVCompliance(params.declaredValue);
  }, [params.declaredValue]);

  // Calculate base rate
  const baseRate = useMemo(() => {
    if (!params.destinationCountryCode || !isCountryServed) return null;
    if (params.weightGrams <= 0) return null;
    
    return calculateRate({
      destinationCountryCode: params.destinationCountryCode,
      shipmentType: params.shipmentType,
      weightGrams: params.weightGrams,
      dimensions: params.dimensions,
      declaredValue: params.declaredValue,
    });
  }, [params, isCountryServed]);

  // Get courier options
  const courierOptions = useMemo(() => {
    if (!params.destinationCountryCode || !isCountryServed) return [];
    if (params.weightGrams <= 0) return [];
    
    return getCourierOptions({
      destinationCountryCode: params.destinationCountryCode,
      shipmentType: params.shipmentType,
      weightGrams: params.weightGrams,
      dimensions: params.dimensions,
      declaredValue: params.declaredValue,
    });
  }, [params, isCountryServed]);

  // Selected courier (default to recommended)
  const selectedCourier = useMemo(() => {
    if (courierOptions.length === 0) return null;
    
    if (selectedCarrier) {
      const found = courierOptions.find(o => o.carrier === selectedCarrier);
      if (found) return found;
    }
    
    // Default to recommended or first option
    return courierOptions.find(o => o.isRecommended) || courierOptions[0];
  }, [courierOptions, selectedCarrier]);

  // Calculate ETA based on selected courier
  const eta = useMemo(() => {
    if (!params.destinationCountryCode || !isCountryServed) return null;
    const carrier = selectedCourier?.carrier || 'DHL';
    return calculateETA(params.destinationCountryCode, carrier);
  }, [params.destinationCountryCode, selectedCourier, isCountryServed]);

  const etaText = useMemo(() => {
    if (!eta) return '';
    return getETAText(eta);
  }, [eta]);

  const etaRange = useMemo(() => {
    if (!eta) return '';
    return formatETARange(eta);
  }, [eta]);

  const selectCourier = useCallback((carrier: Carrier) => {
    setSelectedCarrier(carrier);
  }, []);

  return {
    baseRate,
    courierOptions,
    selectedCourier,
    selectCourier,
    eta,
    etaText,
    etaRange,
    isCompliant: compliance.isCompliant,
    complianceMessage: compliance.message,
    isCalculating: false,
    error: null,
    isCountryServed,
    countryNotServedReason,
  };
};
