// Hook for compliance checking

import { useMemo } from 'react';
import { 
  getMedicineRegulation, 
  getDocumentRegulation, 
  getGiftRegulation,
  getDefaultMedicineRegulation,
  getDefaultGiftRegulation,
  MedicineRegulation,
  DocumentRegulation,
  GiftRegulation,
  ShipmentType,
} from '@/lib/shipping/regulations';
import { 
  getProhibitedItemsForCountry, 
  getGiftRestrictionsForCountry,
  getMedicineRestrictionsForCountry,
  ProhibitedItem,
  checkItemProhibition,
} from '@/lib/shipping/prohibitedItems';
import { getCountryByCode } from '@/lib/shipping/countries';

export interface ComplianceIssue {
  type: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  details?: string;
}

export interface MedicineComplianceParams {
  countryCode: string;
  supplyDays: number;
  declaredValue: number;
  hasControlledSubstances: boolean;
  itemNames?: string[];
}

export interface GiftComplianceParams {
  countryCode: string;
  declaredValue: number;
  itemNames?: string[];
  hasBattery?: boolean;
  hasChemical?: boolean;
  hasLiquid?: boolean;
  hasFood?: boolean;
  hasAlcohol?: boolean;
}

export interface DocumentComplianceParams {
  countryCode: string;
  weightGrams: number;
  isLegalDocument?: boolean;
  isFinancialDocument?: boolean;
}

export interface UseComplianceCheckReturn {
  // Regulations
  medicineRegulation: MedicineRegulation | undefined;
  documentRegulation: DocumentRegulation;
  giftRegulation: GiftRegulation | undefined;
  
  // Prohibited items
  prohibitedItems: ProhibitedItem[];
  
  // Compliance check results
  issues: ComplianceIssue[];
  hasBlockingIssues: boolean;
  hasWarnings: boolean;
  
  // Check functions
  checkMedicineCompliance: (params: MedicineComplianceParams) => ComplianceIssue[];
  checkGiftCompliance: (params: GiftComplianceParams) => ComplianceIssue[];
  checkDocumentCompliance: (params: DocumentComplianceParams) => ComplianceIssue[];
  checkItemName: (itemName: string, countryCode: string) => ProhibitedItem | undefined;
}

export const useComplianceCheck = (
  countryCode: string,
  shipmentType: ShipmentType
): UseComplianceCheckReturn => {
  // Get regulations for the country
  const medicineRegulation = useMemo(() => {
    if (!countryCode) return undefined;
    return getMedicineRegulation(countryCode) || getDefaultMedicineRegulation();
  }, [countryCode]);

  const documentRegulation = useMemo(() => {
    if (!countryCode) return getDocumentRegulation('DEFAULT');
    return getDocumentRegulation(countryCode);
  }, [countryCode]);

  const giftRegulation = useMemo(() => {
    if (!countryCode) return undefined;
    return getGiftRegulation(countryCode) || getDefaultGiftRegulation();
  }, [countryCode]);

  // Get prohibited items
  const prohibitedItems = useMemo(() => {
    if (!countryCode) return [];
    
    switch (shipmentType) {
      case 'medicine':
        return getMedicineRestrictionsForCountry(countryCode);
      case 'gift':
        return getGiftRestrictionsForCountry(countryCode);
      default:
        return getProhibitedItemsForCountry(countryCode);
    }
  }, [countryCode, shipmentType]);

  // Medicine compliance check
  const checkMedicineCompliance = (params: MedicineComplianceParams): ComplianceIssue[] => {
    const issues: ComplianceIssue[] = [];
    const regulation = getMedicineRegulation(params.countryCode) || getDefaultMedicineRegulation();
    const country = getCountryByCode(params.countryCode);

    // Check if country is served
    if (country && !country.isServed) {
      issues.push({
        type: 'error',
        code: 'COUNTRY_NOT_SERVED',
        message: `We don't currently ship to ${country.name}`,
        details: country.notServedReason,
      });
      return issues;
    }

    // Check supply days limit
    if (params.supplyDays > regulation.maxSupplyDays) {
      issues.push({
        type: 'error',
        code: 'SUPPLY_DAYS_EXCEEDED',
        message: `Medicine supply exceeds ${regulation.maxSupplyDays}-day limit for ${country?.name || 'this country'}`,
        details: `Maximum allowed supply is ${regulation.maxSupplyDays} days. Your shipment contains ${params.supplyDays} days supply.`,
      });
    }

    // Check declared value (CSB IV limit)
    if (params.declaredValue > regulation.maxDeclaredValue) {
      issues.push({
        type: 'error',
        code: 'VALUE_EXCEEDED',
        message: `Declared value exceeds ₹${regulation.maxDeclaredValue.toLocaleString()} limit`,
        details: 'CSB IV regulations limit the declared value. Please contact us for assistance.',
      });
    }

    // Check controlled substances
    if (params.hasControlledSubstances && !regulation.controlledSubstancesAllowed) {
      issues.push({
        type: 'error',
        code: 'CONTROLLED_SUBSTANCES_NOT_ALLOWED',
        message: `Controlled substances cannot be shipped to ${country?.name || 'this country'}`,
        details: 'This destination does not allow controlled substance imports for personal use.',
      });
    }

    // Check additional documents required
    if (regulation.additionalDocuments && regulation.additionalDocuments.length > 0) {
      issues.push({
        type: 'info',
        code: 'ADDITIONAL_DOCS_REQUIRED',
        message: 'Additional documentation may be required',
        details: regulation.additionalDocuments.join(', '),
      });
    }

    // Check regulation notes
    if (regulation.notes) {
      issues.push({
        type: 'info',
        code: 'COUNTRY_NOTES',
        message: regulation.notes,
      });
    }

    // Check item names for prohibited items
    if (params.itemNames) {
      params.itemNames.forEach(name => {
        const prohibited = checkItemProhibition(name, params.countryCode);
        if (prohibited) {
          issues.push({
            type: prohibited.severity === 'blocked' ? 'error' : 'warning',
            code: `ITEM_${prohibited.severity.toUpperCase()}`,
            message: `${prohibited.name}: ${prohibited.description}`,
          });
        }
      });
    }

    return issues;
  };

  // Gift compliance check
  const checkGiftCompliance = (params: GiftComplianceParams): ComplianceIssue[] => {
    const issues: ComplianceIssue[] = [];
    const regulation = getGiftRegulation(params.countryCode) || getDefaultGiftRegulation();
    const country = getCountryByCode(params.countryCode);

    // Check if country is served
    if (country && !country.isServed) {
      issues.push({
        type: 'error',
        code: 'COUNTRY_NOT_SERVED',
        message: `We don't currently ship to ${country.name}`,
        details: country.notServedReason,
      });
      return issues;
    }

    // Check declared value (CSB IV limit)
    if (params.declaredValue > regulation.maxDeclaredValue) {
      issues.push({
        type: 'error',
        code: 'VALUE_EXCEEDED',
        message: `Declared value exceeds ₹${regulation.maxDeclaredValue.toLocaleString()} limit`,
        details: 'CSB IV regulations limit the declared value. Please contact us for assistance.',
      });
    }

    // Check duty-free threshold
    if (params.declaredValue > regulation.dutyFreeThreshold) {
      issues.push({
        type: 'warning',
        code: 'DUTY_APPLICABLE',
        message: 'Import duty may apply',
        details: `Value exceeds duty-free threshold of ₹${regulation.dutyFreeThreshold.toLocaleString()}. Recipient may need to pay import duties.`,
      });
    }

    // Check food items
    if (params.hasFood && !regulation.foodItemsAllowed) {
      issues.push({
        type: 'error',
        code: 'FOOD_NOT_ALLOWED',
        message: `Food items cannot be shipped to ${country?.name || 'this country'}`,
        details: 'This destination has strict biosecurity regulations prohibiting food imports.',
      });
    }

    // Check alcohol
    if (params.hasAlcohol && !regulation.alcoholAllowed) {
      issues.push({
        type: 'error',
        code: 'ALCOHOL_NOT_ALLOWED',
        message: `Alcohol cannot be shipped to ${country?.name || 'this country'}`,
      });
    }

    // Warnings for restricted items
    if (params.hasBattery) {
      issues.push({
        type: 'warning',
        code: 'BATTERY_WARNING',
        message: 'Batteries require special handling',
        details: 'Lithium batteries must be declared and may require special packaging. Maximum 2 battery-powered devices per shipment.',
      });
    }

    if (params.hasChemical) {
      issues.push({
        type: 'warning',
        code: 'CHEMICAL_WARNING',
        message: 'Chemicals may be restricted',
        details: 'Household chemicals and cleaning agents require proper labeling and may be restricted.',
      });
    }

    if (params.hasLiquid) {
      issues.push({
        type: 'warning',
        code: 'LIQUID_WARNING',
        message: 'Liquids require special packaging',
        details: 'Liquids must be in sealed containers, max 500ml per item. Leak-proof packaging required.',
      });
    }

    // Check regulation notes
    if (regulation.notes) {
      issues.push({
        type: 'info',
        code: 'COUNTRY_NOTES',
        message: regulation.notes,
      });
    }

    // Check item names for prohibited items
    if (params.itemNames) {
      params.itemNames.forEach(name => {
        const prohibited = checkItemProhibition(name, params.countryCode);
        if (prohibited) {
          issues.push({
            type: prohibited.severity === 'blocked' ? 'error' : 'warning',
            code: `ITEM_${prohibited.severity.toUpperCase()}`,
            message: `${prohibited.name}: ${prohibited.description}`,
          });
        }
      });
    }

    return issues;
  };

  // Document compliance check
  const checkDocumentCompliance = (params: DocumentComplianceParams): ComplianceIssue[] => {
    const issues: ComplianceIssue[] = [];
    const regulation = getDocumentRegulation(params.countryCode);
    const country = getCountryByCode(params.countryCode);

    // Check if country is served
    if (country && !country.isServed) {
      issues.push({
        type: 'error',
        code: 'COUNTRY_NOT_SERVED',
        message: `We don't currently ship to ${country.name}`,
        details: country.notServedReason,
      });
      return issues;
    }

    // Check weight limit
    if (params.weightGrams > regulation.maxWeightGrams) {
      issues.push({
        type: 'error',
        code: 'WEIGHT_EXCEEDED',
        message: `Document weight exceeds ${regulation.maxWeightGrams}g limit`,
        details: 'Document shipments have a maximum weight limit.',
      });
    }

    // Check apostille requirement
    if (params.isLegalDocument && regulation.requiresApostille) {
      issues.push({
        type: 'info',
        code: 'APOSTILLE_RECOMMENDED',
        message: 'Apostille may be required',
        details: 'Legal documents may require apostille certification for official use in this country.',
      });
    }

    // Check financial document restrictions
    if (params.isFinancialDocument && regulation.financialDocsRestricted) {
      issues.push({
        type: 'warning',
        code: 'FINANCIAL_DOCS_RESTRICTED',
        message: 'Financial documents may require verification',
        details: 'Financial documents to this destination may undergo additional verification.',
      });
    }

    // Check regulation notes
    if (regulation.notes) {
      issues.push({
        type: 'info',
        code: 'COUNTRY_NOTES',
        message: regulation.notes,
      });
    }

    return issues;
  };

  // Check item name against prohibited list
  const checkItemName = (itemName: string, targetCountryCode: string): ProhibitedItem | undefined => {
    return checkItemProhibition(itemName, targetCountryCode);
  };

  // Aggregate issues based on current context (would need to be called with specific params)
  const issues: ComplianceIssue[] = [];
  const hasBlockingIssues = issues.some(i => i.type === 'error');
  const hasWarnings = issues.some(i => i.type === 'warning');

  return {
    medicineRegulation,
    documentRegulation,
    giftRegulation,
    prohibitedItems,
    issues,
    hasBlockingIssues,
    hasWarnings,
    checkMedicineCompliance,
    checkGiftCompliance,
    checkDocumentCompliance,
    checkItemName,
  };
};
