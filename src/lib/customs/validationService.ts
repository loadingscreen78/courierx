// Customs validation service

import { getHSNByCode, isValidHSNFormat, HSNCode } from './hsnDatabase';
import {
  getCountryRestrictions,
  isProhibitedInCountry,
  isRestrictedInCountry,
  isCategoryProhibited,
  isCategoryRestricted,
} from './countryRestrictions';

export type ValidationStatus = 'valid' | 'restricted' | 'prohibited' | 'invalid';

export interface ValidationResult {
  status: ValidationStatus;
  hsnCode: string;
  hsnInfo: HSNCode | null;
  issues: ValidationIssue[];
  canProceed: boolean;
}

export interface ValidationIssue {
  type: 'error' | 'warning' | 'info';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  message: string;
  recommendation?: string;
}

// Validate HSN code and check restrictions
export function validateHSNForCountry(
  hsnCode: string,
  destinationCountry: string
): ValidationResult {
  const issues: ValidationIssue[] = [];
  
  // Check HSN format
  if (!isValidHSNFormat(hsnCode)) {
    return {
      status: 'invalid',
      hsnCode,
      hsnInfo: null,
      issues: [{
        type: 'error',
        severity: 'critical',
        title: 'Invalid HSN Code Format',
        message: 'HSN code must be exactly 8 digits',
        recommendation: 'Please enter a valid 8-digit HSN code'
      }],
      canProceed: false,
    };
  }
  
  // Get HSN information
  const hsnInfo = getHSNByCode(hsnCode);
  if (!hsnInfo) {
    // If HSN not in database, create a generic valid entry
    // This allows any valid 8-digit HSN code to pass
    const genericHSN: HSNCode = {
      code: hsnCode,
      description: 'General merchandise',
      category: 'General',
      requiresLicense: false,
      globallyProhibited: false,
      globallyRestricted: false,
      commonNames: [],
    };
    
    return {
      status: 'valid',
      hsnCode,
      hsnInfo: genericHSN,
      issues: [{
        type: 'info',
        severity: 'low',
        title: 'HSN Code Accepted',
        message: `HSN code ${hsnCode} has been accepted for shipping`,
        recommendation: 'Standard customs clearance will apply'
      }],
      canProceed: true,
    };
  }
  
  let status: ValidationStatus = 'valid';
  let canProceed = true;
  
  // Check if globally prohibited
  if (hsnInfo.globallyProhibited) {
    status = 'prohibited';
    canProceed = false;
    issues.push({
      type: 'error',
      severity: 'critical',
      title: 'Globally Prohibited Item',
      message: `${hsnInfo.description} is prohibited for international shipping`,
      recommendation: hsnInfo.restrictionReason || 'This item cannot be shipped internationally'
    });
  }
  
  // Check if globally restricted
  if (hsnInfo.globallyRestricted && status !== 'prohibited') {
    status = 'restricted';
    issues.push({
      type: 'warning',
      severity: 'high',
      title: 'Restricted Item',
      message: `${hsnInfo.description} has shipping restrictions`,
      recommendation: hsnInfo.restrictionReason || 'Special documentation may be required'
    });
  }
  
  // Check if requires license
  if (hsnInfo.requiresLicense) {
    issues.push({
      type: 'warning',
      severity: 'high',
      title: 'License Required',
      message: `${hsnInfo.description} requires an import/export license`,
      recommendation: 'Ensure you have the necessary licenses before proceeding'
    });
  }
  
  // Check country-specific restrictions
  const countryRestrictions = getCountryRestrictions(destinationCountry);
  if (countryRestrictions) {
    // Check if prohibited in destination country
    if (isProhibitedInCountry(hsnCode, destinationCountry)) {
      status = 'prohibited';
      canProceed = false;
      issues.push({
        type: 'error',
        severity: 'critical',
        title: `Prohibited in ${countryRestrictions.countryName}`,
        message: `This item cannot be imported into ${countryRestrictions.countryName}`,
        recommendation: 'Please remove this item or choose a different destination'
      });
    }
    
    // Check if category is prohibited
    if (isCategoryProhibited(hsnInfo.category, destinationCountry)) {
      status = 'prohibited';
      canProceed = false;
      issues.push({
        type: 'error',
        severity: 'critical',
        title: `Category Prohibited in ${countryRestrictions.countryName}`,
        message: `${hsnInfo.category} items are prohibited in ${countryRestrictions.countryName}`,
        recommendation: 'This category of items cannot be shipped to this destination'
      });
    }
    
    // Check if restricted in destination country
    if (isRestrictedInCountry(hsnCode, destinationCountry) && status !== 'prohibited') {
      status = 'restricted';
      issues.push({
        type: 'warning',
        severity: 'high',
        title: `Restricted in ${countryRestrictions.countryName}`,
        message: `Additional documentation required for ${countryRestrictions.countryName}`,
        recommendation: 'Import permit or special clearance may be needed'
      });
    }
    
    // Check if category is restricted
    if (isCategoryRestricted(hsnInfo.category, destinationCountry) && status !== 'prohibited') {
      if (status !== 'restricted') status = 'restricted';
      issues.push({
        type: 'warning',
        severity: 'medium',
        title: `Category Restricted in ${countryRestrictions.countryName}`,
        message: `${hsnInfo.category} items may require additional clearance`,
        recommendation: 'Check with customs for specific requirements'
      });
    }
    
    // Add country-specific notes
    if (countryRestrictions.specialNotes.length > 0) {
      issues.push({
        type: 'info',
        severity: 'low',
        title: `${countryRestrictions.countryName} Import Notes`,
        message: countryRestrictions.specialNotes.join('. '),
      });
    }
  }
  
  return {
    status,
    hsnCode,
    hsnInfo,
    issues,
    canProceed,
  };
}

// Batch validate multiple items
export function validateMultipleItems(
  items: Array<{ hsnCode: string; name: string }>,
  destinationCountry: string
): Map<string, ValidationResult> {
  const results = new Map<string, ValidationResult>();
  
  items.forEach((item, index) => {
    const result = validateHSNForCountry(item.hsnCode, destinationCountry);
    results.set(`${index}-${item.hsnCode}`, result);
  });
  
  return results;
}

// Check if any item blocks shipment
export function hasBlockingIssues(results: Map<string, ValidationResult>): boolean {
  for (const result of results.values()) {
    if (!result.canProceed) {
      return true;
    }
  }
  return false;
}

// Get summary of validation results
export function getValidationSummary(results: Map<string, ValidationResult>): {
  total: number;
  valid: number;
  restricted: number;
  prohibited: number;
  invalid: number;
  canProceed: boolean;
} {
  let valid = 0;
  let restricted = 0;
  let prohibited = 0;
  let invalid = 0;
  
  results.forEach(result => {
    switch (result.status) {
      case 'valid': valid++; break;
      case 'restricted': restricted++; break;
      case 'prohibited': prohibited++; break;
      case 'invalid': invalid++; break;
    }
  });
  
  return {
    total: results.size,
    valid,
    restricted,
    prohibited,
    invalid,
    canProceed: !hasBlockingIssues(results),
  };
}
