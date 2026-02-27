/**
 * International ZIP/Postal code lookup using Zippopotam.us API.
 * Free, no API key required. Supports 60+ countries.
 * Falls back gracefully if the API is unavailable.
 */

export interface ZipLookupResult {
  city: string;
  state: string;
  country: string;
}

// Map our 2-letter codes to Zippopotam.us supported country codes (lowercase)
const SUPPORTED_COUNTRIES = new Set([
  'AD', 'AR', 'AS', 'AT', 'AU', 'BD', 'BE', 'BG', 'BR', 'BY',
  'CA', 'CH', 'CL', 'CN', 'CO', 'CR', 'CZ', 'DE', 'DK', 'DO',
  'DZ', 'EE', 'ES', 'FI', 'FO', 'FR', 'GB', 'GF', 'GG', 'GL',
  'GP', 'GT', 'GU', 'HR', 'HU', 'ID', 'IE', 'IL', 'IM', 'IN',
  'IS', 'IT', 'JE', 'JP', 'KR', 'LI', 'LK', 'LT', 'LU', 'LV',
  'MC', 'MD', 'MH', 'MK', 'MP', 'MQ', 'MT', 'MX', 'MY', 'NL',
  'NO', 'NZ', 'PH', 'PK', 'PL', 'PM', 'PR', 'PT', 'RE', 'RO',
  'RU', 'SE', 'SG', 'SI', 'SJ', 'SK', 'SM', 'TH', 'TR', 'UA',
  'US', 'VA', 'VI', 'YT', 'ZA',
]);

export function isZipLookupSupported(countryCode: string): boolean {
  return SUPPORTED_COUNTRIES.has(countryCode.toUpperCase());
}

export async function lookupZipcode(
  zipcode: string,
  countryCode: string,
): Promise<ZipLookupResult | null> {
  if (!zipcode || !countryCode) return null;
  const cc = countryCode.toUpperCase();
  if (!SUPPORTED_COUNTRIES.has(cc)) return null;

  // Clean the zip for the API (remove spaces for lookup)
  const cleanZip = zipcode.trim().replace(/\s+/g, '%20');

  try {
    const res = await fetch(
      `https://api.zippopotam.us/${cc.toLowerCase()}/${cleanZip}`,
      { signal: AbortSignal.timeout(5000) },
    );
    if (!res.ok) return null;

    const data = await res.json();
    if (!data?.places?.length) return null;

    const place = data.places[0];
    return {
      city: place['place name'] || '',
      state: place['state'] || place['state abbreviation'] || '',
      country: data['country'] || '',
    };
  } catch {
    console.warn('ZIP code lookup failed for', cc, zipcode);
    return null;
  }
}
