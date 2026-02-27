/**
 * Country data with phone rules, postal code formats, and address labels.
 * Used across all booking forms for consistent validation and auto-formatting.
 */

export interface CountryPhoneRule {
  dialCode: string;
  maxDigits: number; // max digits AFTER dial code
  format: string;    // display format hint
  example: string;   // placeholder example
}

export interface CountryPostalRule {
  label: string;     // "ZIP Code", "Postal Code", "Postcode", etc.
  regex: RegExp;     // validation pattern
  example: string;   // placeholder
  maxLength: number;
}

export interface CountryInfo {
  code: string;
  name: string;
  phone: CountryPhoneRule;
  postal: CountryPostalRule;
}

export const COUNTRY_DATA: CountryInfo[] = [
  {
    code: 'AF', name: 'Afghanistan',
    phone: { dialCode: '+93', maxDigits: 9, format: '+93 XX XXX XXXX', example: '+93 70 123 4567' },
    postal: { label: 'Postal Code', regex: /^\d{4}$/, example: '1001', maxLength: 4 },
  },
  {
    code: 'AL', name: 'Albania',
    phone: { dialCode: '+355', maxDigits: 9, format: '+355 XX XXX XXXX', example: '+355 69 123 4567' },
    postal: { label: 'Postal Code', regex: /^\d{4}$/, example: '1001', maxLength: 4 },
  },
  {
    code: 'DZ', name: 'Algeria',
    phone: { dialCode: '+213', maxDigits: 9, format: '+213 XXX XX XX XX', example: '+213 555 12 34 56' },
    postal: { label: 'Postal Code', regex: /^\d{5}$/, example: '16000', maxLength: 5 },
  },
  {
    code: 'AR', name: 'Argentina',
    phone: { dialCode: '+54', maxDigits: 10, format: '+54 XX XXXX XXXX', example: '+54 11 1234 5678' },
    postal: { label: 'Postal Code', regex: /^[A-Z]\d{4}[A-Z]{3}$|^\d{4}$/, example: 'C1420', maxLength: 8 },
  },
  {
    code: 'AM', name: 'Armenia',
    phone: { dialCode: '+374', maxDigits: 8, format: '+374 XX XXXXXX', example: '+374 91 123456' },
    postal: { label: 'Postal Code', regex: /^\d{4}$/, example: '0010', maxLength: 4 },
  },
  {
    code: 'AU', name: 'Australia',
    phone: { dialCode: '+61', maxDigits: 9, format: '+61 X XXXX XXXX', example: '+61 4 1234 5678' },
    postal: { label: 'Postcode', regex: /^\d{4}$/, example: '2000', maxLength: 4 },
  },
  {
    code: 'AT', name: 'Austria',
    phone: { dialCode: '+43', maxDigits: 10, format: '+43 XXX XXXXXXX', example: '+43 664 1234567' },
    postal: { label: 'Postal Code', regex: /^\d{4}$/, example: '1010', maxLength: 4 },
  },
  {
    code: 'AZ', name: 'Azerbaijan',
    phone: { dialCode: '+994', maxDigits: 9, format: '+994 XX XXX XXXX', example: '+994 50 123 4567' },
    postal: { label: 'Postal Code', regex: /^AZ\d{4}$|^\d{4}$/, example: 'AZ1000', maxLength: 6 },
  },
  {
    code: 'BH', name: 'Bahrain',
    phone: { dialCode: '+973', maxDigits: 8, format: '+973 XXXX XXXX', example: '+973 3612 3456' },
    postal: { label: 'Postal Code', regex: /^\d{3,4}$/, example: '317', maxLength: 4 },
  },
  {
    code: 'BD', name: 'Bangladesh',
    phone: { dialCode: '+880', maxDigits: 10, format: '+880 XXXX XXXXXX', example: '+880 1712 345678' },
    postal: { label: 'Postal Code', regex: /^\d{4}$/, example: '1205', maxLength: 4 },
  },
  {
    code: 'BY', name: 'Belarus',
    phone: { dialCode: '+375', maxDigits: 9, format: '+375 XX XXX XX XX', example: '+375 29 123 45 67' },
    postal: { label: 'Postal Code', regex: /^\d{6}$/, example: '220000', maxLength: 6 },
  },
  {
    code: 'BE', name: 'Belgium',
    phone: { dialCode: '+32', maxDigits: 9, format: '+32 XXX XX XX XX', example: '+32 470 12 34 56' },
    postal: { label: 'Postal Code', regex: /^\d{4}$/, example: '1000', maxLength: 4 },
  },
  {
    code: 'BT', name: 'Bhutan',
    phone: { dialCode: '+975', maxDigits: 8, format: '+975 XX XXX XXX', example: '+975 17 123 456' },
    postal: { label: 'Postal Code', regex: /^\d{5}$/, example: '11001', maxLength: 5 },
  },
  {
    code: 'BR', name: 'Brazil',
    phone: { dialCode: '+55', maxDigits: 11, format: '+55 XX XXXXX XXXX', example: '+55 11 91234 5678' },
    postal: { label: 'CEP', regex: /^\d{5}-?\d{3}$/, example: '01001-000', maxLength: 9 },
  },
  {
    code: 'BN', name: 'Brunei',
    phone: { dialCode: '+673', maxDigits: 7, format: '+673 XXX XXXX', example: '+673 712 3456' },
    postal: { label: 'Postal Code', regex: /^[A-Z]{2}\d{4}$/, example: 'BS8811', maxLength: 6 },
  },
  {
    code: 'BG', name: 'Bulgaria',
    phone: { dialCode: '+359', maxDigits: 9, format: '+359 XX XXX XXXX', example: '+359 88 123 4567' },
    postal: { label: 'Postal Code', regex: /^\d{4}$/, example: '1000', maxLength: 4 },
  },
  {
    code: 'KH', name: 'Cambodia',
    phone: { dialCode: '+855', maxDigits: 9, format: '+855 XX XXX XXXX', example: '+855 12 345 678' },
    postal: { label: 'Postal Code', regex: /^\d{5,6}$/, example: '12000', maxLength: 6 },
  },
  {
    code: 'CA', name: 'Canada',
    phone: { dialCode: '+1', maxDigits: 10, format: '+1 XXX XXX XXXX', example: '+1 416 555 1234' },
    postal: { label: 'Postal Code', regex: /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i, example: 'M5V 2T6', maxLength: 7 },
  },
  {
    code: 'CL', name: 'Chile',
    phone: { dialCode: '+56', maxDigits: 9, format: '+56 X XXXX XXXX', example: '+56 9 1234 5678' },
    postal: { label: 'Postal Code', regex: /^\d{7}$/, example: '8320000', maxLength: 7 },
  },
  {
    code: 'CN', name: 'China',
    phone: { dialCode: '+86', maxDigits: 11, format: '+86 XXX XXXX XXXX', example: '+86 138 1234 5678' },
    postal: { label: 'Postal Code', regex: /^\d{6}$/, example: '100000', maxLength: 6 },
  },
  {
    code: 'CO', name: 'Colombia',
    phone: { dialCode: '+57', maxDigits: 10, format: '+57 XXX XXX XXXX', example: '+57 310 123 4567' },
    postal: { label: 'Postal Code', regex: /^\d{6}$/, example: '110111', maxLength: 6 },
  },
  {
    code: 'HR', name: 'Croatia',
    phone: { dialCode: '+385', maxDigits: 9, format: '+385 XX XXX XXXX', example: '+385 91 123 4567' },
    postal: { label: 'Postal Code', regex: /^\d{5}$/, example: '10000', maxLength: 5 },
  },
  {
    code: 'CY', name: 'Cyprus',
    phone: { dialCode: '+357', maxDigits: 8, format: '+357 XX XXXXXX', example: '+357 96 123456' },
    postal: { label: 'Postal Code', regex: /^\d{4}$/, example: '1000', maxLength: 4 },
  },
  {
    code: 'CZ', name: 'Czech Republic',
    phone: { dialCode: '+420', maxDigits: 9, format: '+420 XXX XXX XXX', example: '+420 601 123 456' },
    postal: { label: 'Postal Code', regex: /^\d{3}\s?\d{2}$/, example: '110 00', maxLength: 6 },
  },
  {
    code: 'DK', name: 'Denmark',
    phone: { dialCode: '+45', maxDigits: 8, format: '+45 XX XX XX XX', example: '+45 20 12 34 56' },
    postal: { label: 'Postal Code', regex: /^\d{4}$/, example: '1000', maxLength: 4 },
  },
  {
    code: 'EG', name: 'Egypt',
    phone: { dialCode: '+20', maxDigits: 10, format: '+20 XX XXXX XXXX', example: '+20 10 1234 5678' },
    postal: { label: 'Postal Code', regex: /^\d{5}$/, example: '11511', maxLength: 5 },
  },
  {
    code: 'EE', name: 'Estonia',
    phone: { dialCode: '+372', maxDigits: 8, format: '+372 XXXX XXXX', example: '+372 5123 4567' },
    postal: { label: 'Postal Code', regex: /^\d{5}$/, example: '10111', maxLength: 5 },
  },
  {
    code: 'ET', name: 'Ethiopia',
    phone: { dialCode: '+251', maxDigits: 9, format: '+251 XX XXX XXXX', example: '+251 91 123 4567' },
    postal: { label: 'Postal Code', regex: /^\d{4}$/, example: '1000', maxLength: 4 },
  },
  {
    code: 'FI', name: 'Finland',
    phone: { dialCode: '+358', maxDigits: 10, format: '+358 XX XXXXXXX', example: '+358 40 1234567' },
    postal: { label: 'Postal Code', regex: /^\d{5}$/, example: '00100', maxLength: 5 },
  },
  {
    code: 'FR', name: 'France',
    phone: { dialCode: '+33', maxDigits: 9, format: '+33 X XX XX XX XX', example: '+33 6 12 34 56 78' },
    postal: { label: 'Code Postal', regex: /^\d{5}$/, example: '75001', maxLength: 5 },
  },
  {
    code: 'GE', name: 'Georgia',
    phone: { dialCode: '+995', maxDigits: 9, format: '+995 XXX XX XX XX', example: '+995 555 12 34 56' },
    postal: { label: 'Postal Code', regex: /^\d{4}$/, example: '0100', maxLength: 4 },
  },
  {
    code: 'DE', name: 'Germany',
    phone: { dialCode: '+49', maxDigits: 11, format: '+49 XXX XXXXXXXX', example: '+49 170 1234567' },
    postal: { label: 'Postleitzahl', regex: /^\d{5}$/, example: '10115', maxLength: 5 },
  },
  {
    code: 'GH', name: 'Ghana',
    phone: { dialCode: '+233', maxDigits: 9, format: '+233 XX XXX XXXX', example: '+233 24 123 4567' },
    postal: { label: 'Postal Code', regex: /^[A-Z]{2}-?\d{3,4}-?\d{4}$|^.+$/, example: 'GA-184-958', maxLength: 12 },
  },
  {
    code: 'GR', name: 'Greece',
    phone: { dialCode: '+30', maxDigits: 10, format: '+30 XXX XXX XXXX', example: '+30 694 123 4567' },
    postal: { label: 'Postal Code', regex: /^\d{3}\s?\d{2}$/, example: '104 31', maxLength: 6 },
  },
  {
    code: 'HK', name: 'Hong Kong',
    phone: { dialCode: '+852', maxDigits: 8, format: '+852 XXXX XXXX', example: '+852 9123 4567' },
    postal: { label: 'Postal Code', regex: /^.{0,10}$/, example: 'N/A', maxLength: 10 },
  },
  {
    code: 'HU', name: 'Hungary',
    phone: { dialCode: '+36', maxDigits: 9, format: '+36 XX XXX XXXX', example: '+36 20 123 4567' },
    postal: { label: 'Postal Code', regex: /^\d{4}$/, example: '1011', maxLength: 4 },
  },
  {
    code: 'IS', name: 'Iceland',
    phone: { dialCode: '+354', maxDigits: 7, format: '+354 XXX XXXX', example: '+354 611 1234' },
    postal: { label: 'Postal Code', regex: /^\d{3}$/, example: '101', maxLength: 3 },
  },
  {
    code: 'ID', name: 'Indonesia',
    phone: { dialCode: '+62', maxDigits: 12, format: '+62 XXX XXXX XXXX', example: '+62 812 3456 7890' },
    postal: { label: 'Postal Code', regex: /^\d{5}$/, example: '10110', maxLength: 5 },
  },
  {
    code: 'IR', name: 'Iran',
    phone: { dialCode: '+98', maxDigits: 10, format: '+98 XXX XXX XXXX', example: '+98 912 345 6789' },
    postal: { label: 'Postal Code', regex: /^\d{10}$/, example: '1234567890', maxLength: 10 },
  },
  {
    code: 'IQ', name: 'Iraq',
    phone: { dialCode: '+964', maxDigits: 10, format: '+964 XXX XXX XXXX', example: '+964 770 123 4567' },
    postal: { label: 'Postal Code', regex: /^\d{5}$/, example: '10001', maxLength: 5 },
  },
  {
    code: 'IE', name: 'Ireland',
    phone: { dialCode: '+353', maxDigits: 9, format: '+353 XX XXX XXXX', example: '+353 85 123 4567' },
    postal: { label: 'Eircode', regex: /^[A-Z0-9]{3}\s?[A-Z0-9]{4}$/i, example: 'D02 AF30', maxLength: 8 },
  },
  {
    code: 'IL', name: 'Israel',
    phone: { dialCode: '+972', maxDigits: 9, format: '+972 XX XXX XXXX', example: '+972 50 123 4567' },
    postal: { label: 'Postal Code', regex: /^\d{7}$/, example: '6100000', maxLength: 7 },
  },
  {
    code: 'IT', name: 'Italy',
    phone: { dialCode: '+39', maxDigits: 10, format: '+39 XXX XXX XXXX', example: '+39 320 123 4567' },
    postal: { label: 'CAP', regex: /^\d{5}$/, example: '00100', maxLength: 5 },
  },
  {
    code: 'JP', name: 'Japan',
    phone: { dialCode: '+81', maxDigits: 10, format: '+81 XX XXXX XXXX', example: '+81 90 1234 5678' },
    postal: { label: 'Postal Code', regex: /^\d{3}-?\d{4}$/, example: '100-0001', maxLength: 8 },
  },
  {
    code: 'JO', name: 'Jordan',
    phone: { dialCode: '+962', maxDigits: 9, format: '+962 X XXXX XXXX', example: '+962 7 9012 3456' },
    postal: { label: 'Postal Code', regex: /^\d{5}$/, example: '11110', maxLength: 5 },
  },
  {
    code: 'KZ', name: 'Kazakhstan',
    phone: { dialCode: '+7', maxDigits: 10, format: '+7 XXX XXX XX XX', example: '+7 701 123 45 67' },
    postal: { label: 'Postal Code', regex: /^\d{6}$/, example: '010000', maxLength: 6 },
  },
  {
    code: 'KE', name: 'Kenya',
    phone: { dialCode: '+254', maxDigits: 9, format: '+254 XXX XXXXXX', example: '+254 712 345678' },
    postal: { label: 'Postal Code', regex: /^\d{5}$/, example: '00100', maxLength: 5 },
  },
  {
    code: 'KW', name: 'Kuwait',
    phone: { dialCode: '+965', maxDigits: 8, format: '+965 XXXX XXXX', example: '+965 5012 3456' },
    postal: { label: 'Postal Code', regex: /^\d{5}$/, example: '13001', maxLength: 5 },
  },
  {
    code: 'KG', name: 'Kyrgyzstan',
    phone: { dialCode: '+996', maxDigits: 9, format: '+996 XXX XXXXXX', example: '+996 555 123456' },
    postal: { label: 'Postal Code', regex: /^\d{6}$/, example: '720000', maxLength: 6 },
  },
  {
    code: 'LA', name: 'Laos',
    phone: { dialCode: '+856', maxDigits: 10, format: '+856 XX XX XXX XXX', example: '+856 20 55 123 456' },
    postal: { label: 'Postal Code', regex: /^\d{5}$/, example: '01000', maxLength: 5 },
  },
  {
    code: 'LV', name: 'Latvia',
    phone: { dialCode: '+371', maxDigits: 8, format: '+371 XX XXX XXX', example: '+371 20 123 456' },
    postal: { label: 'Postal Code', regex: /^LV-?\d{4}$/i, example: 'LV-1001', maxLength: 7 },
  },
  {
    code: 'LB', name: 'Lebanon',
    phone: { dialCode: '+961', maxDigits: 8, format: '+961 XX XXX XXX', example: '+961 71 123 456' },
    postal: { label: 'Postal Code', regex: /^\d{4}\s?\d{4}$|^\d{4}$/, example: '1100', maxLength: 9 },
  },
  {
    code: 'LT', name: 'Lithuania',
    phone: { dialCode: '+370', maxDigits: 8, format: '+370 XXX XXXXX', example: '+370 612 34567' },
    postal: { label: 'Postal Code', regex: /^LT-?\d{5}$/i, example: 'LT-01001', maxLength: 8 },
  },
  {
    code: 'LU', name: 'Luxembourg',
    phone: { dialCode: '+352', maxDigits: 9, format: '+352 XXX XXX XXX', example: '+352 621 123 456' },
    postal: { label: 'Postal Code', regex: /^\d{4}$/, example: '1009', maxLength: 4 },
  },
  {
    code: 'MO', name: 'Macau',
    phone: { dialCode: '+853', maxDigits: 8, format: '+853 XXXX XXXX', example: '+853 6612 3456' },
    postal: { label: 'Postal Code', regex: /^.{0,10}$/, example: 'N/A', maxLength: 10 },
  },
  {
    code: 'MY', name: 'Malaysia',
    phone: { dialCode: '+60', maxDigits: 10, format: '+60 XX XXXX XXXX', example: '+60 12 3456 7890' },
    postal: { label: 'Postcode', regex: /^\d{5}$/, example: '50000', maxLength: 5 },
  },
  {
    code: 'MV', name: 'Maldives',
    phone: { dialCode: '+960', maxDigits: 7, format: '+960 XXX XXXX', example: '+960 912 3456' },
    postal: { label: 'Postal Code', regex: /^\d{5}$/, example: '20026', maxLength: 5 },
  },
  {
    code: 'MT', name: 'Malta',
    phone: { dialCode: '+356', maxDigits: 8, format: '+356 XXXX XXXX', example: '+356 9912 3456' },
    postal: { label: 'Postal Code', regex: /^[A-Z]{3}\s?\d{4}$/i, example: 'VLT 1000', maxLength: 8 },
  },
  {
    code: 'MU', name: 'Mauritius',
    phone: { dialCode: '+230', maxDigits: 8, format: '+230 XXXX XXXX', example: '+230 5712 3456' },
    postal: { label: 'Postal Code', regex: /^\d{5}$/, example: '11401', maxLength: 5 },
  },
  {
    code: 'MX', name: 'Mexico',
    phone: { dialCode: '+52', maxDigits: 10, format: '+52 XX XXXX XXXX', example: '+52 55 1234 5678' },
    postal: { label: 'Código Postal', regex: /^\d{5}$/, example: '06600', maxLength: 5 },
  },
  {
    code: 'MD', name: 'Moldova',
    phone: { dialCode: '+373', maxDigits: 8, format: '+373 XX XXX XXX', example: '+373 69 123 456' },
    postal: { label: 'Postal Code', regex: /^MD-?\d{4}$/i, example: 'MD-2001', maxLength: 7 },
  },
  {
    code: 'MN', name: 'Mongolia',
    phone: { dialCode: '+976', maxDigits: 8, format: '+976 XXXX XXXX', example: '+976 9912 3456' },
    postal: { label: 'Postal Code', regex: /^\d{5,6}$/, example: '14200', maxLength: 6 },
  },
  {
    code: 'MA', name: 'Morocco',
    phone: { dialCode: '+212', maxDigits: 9, format: '+212 XXX XXXXXX', example: '+212 661 234567' },
    postal: { label: 'Postal Code', regex: /^\d{5}$/, example: '10000', maxLength: 5 },
  },
  {
    code: 'MM', name: 'Myanmar',
    phone: { dialCode: '+95', maxDigits: 10, format: '+95 XX XXX XXXX', example: '+95 9 123 4567' },
    postal: { label: 'Postal Code', regex: /^\d{5}$/, example: '11181', maxLength: 5 },
  },
  {
    code: 'NP', name: 'Nepal',
    phone: { dialCode: '+977', maxDigits: 10, format: '+977 XX XXXX XXXX', example: '+977 98 1234 5678' },
    postal: { label: 'Postal Code', regex: /^\d{5}$/, example: '44600', maxLength: 5 },
  },
  {
    code: 'NL', name: 'Netherlands',
    phone: { dialCode: '+31', maxDigits: 9, format: '+31 X XX XX XX XX', example: '+31 6 12 34 56 78' },
    postal: { label: 'Postcode', regex: /^\d{4}\s?[A-Z]{2}$/i, example: '1012 AB', maxLength: 7 },
  },
  {
    code: 'NZ', name: 'New Zealand',
    phone: { dialCode: '+64', maxDigits: 9, format: '+64 XX XXX XXXX', example: '+64 21 123 4567' },
    postal: { label: 'Postcode', regex: /^\d{4}$/, example: '1010', maxLength: 4 },
  },
  {
    code: 'NG', name: 'Nigeria',
    phone: { dialCode: '+234', maxDigits: 10, format: '+234 XXX XXX XXXX', example: '+234 801 234 5678' },
    postal: { label: 'Postal Code', regex: /^\d{6}$/, example: '100001', maxLength: 6 },
  },
  {
    code: 'NO', name: 'Norway',
    phone: { dialCode: '+47', maxDigits: 8, format: '+47 XXX XX XXX', example: '+47 412 34 567' },
    postal: { label: 'Postnummer', regex: /^\d{4}$/, example: '0001', maxLength: 4 },
  },
  {
    code: 'OM', name: 'Oman',
    phone: { dialCode: '+968', maxDigits: 8, format: '+968 XXXX XXXX', example: '+968 9212 3456' },
    postal: { label: 'Postal Code', regex: /^\d{3}$/, example: '100', maxLength: 3 },
  },
  {
    code: 'PK', name: 'Pakistan',
    phone: { dialCode: '+92', maxDigits: 10, format: '+92 XXX XXXXXXX', example: '+92 300 1234567' },
    postal: { label: 'Postal Code', regex: /^\d{5}$/, example: '44000', maxLength: 5 },
  },
  {
    code: 'PA', name: 'Panama',
    phone: { dialCode: '+507', maxDigits: 8, format: '+507 XXXX XXXX', example: '+507 6123 4567' },
    postal: { label: 'Postal Code', regex: /^\d{4}$/, example: '0801', maxLength: 4 },
  },
  {
    code: 'PH', name: 'Philippines',
    phone: { dialCode: '+63', maxDigits: 10, format: '+63 XXX XXX XXXX', example: '+63 917 123 4567' },
    postal: { label: 'ZIP Code', regex: /^\d{4}$/, example: '1000', maxLength: 4 },
  },
  {
    code: 'PL', name: 'Poland',
    phone: { dialCode: '+48', maxDigits: 9, format: '+48 XXX XXX XXX', example: '+48 512 345 678' },
    postal: { label: 'Kod Pocztowy', regex: /^\d{2}-?\d{3}$/, example: '00-001', maxLength: 6 },
  },
  {
    code: 'PT', name: 'Portugal',
    phone: { dialCode: '+351', maxDigits: 9, format: '+351 XXX XXX XXX', example: '+351 912 345 678' },
    postal: { label: 'Código Postal', regex: /^\d{4}-?\d{3}$/, example: '1000-001', maxLength: 8 },
  },
  {
    code: 'QA', name: 'Qatar',
    phone: { dialCode: '+974', maxDigits: 8, format: '+974 XXXX XXXX', example: '+974 5512 3456' },
    postal: { label: 'Postal Code', regex: /^\d{4,5}$/, example: '12345', maxLength: 5 },
  },
  {
    code: 'RO', name: 'Romania',
    phone: { dialCode: '+40', maxDigits: 9, format: '+40 XXX XXX XXX', example: '+40 721 234 567' },
    postal: { label: 'Postal Code', regex: /^\d{6}$/, example: '010011', maxLength: 6 },
  },
  {
    code: 'RU', name: 'Russia',
    phone: { dialCode: '+7', maxDigits: 10, format: '+7 XXX XXX XX XX', example: '+7 916 123 45 67' },
    postal: { label: 'Postal Code', regex: /^\d{6}$/, example: '101000', maxLength: 6 },
  },
  {
    code: 'SA', name: 'Saudi Arabia',
    phone: { dialCode: '+966', maxDigits: 9, format: '+966 XX XXX XXXX', example: '+966 50 123 4567' },
    postal: { label: 'Postal Code', regex: /^\d{5}(-\d{4})?$/, example: '11564', maxLength: 10 },
  },
  {
    code: 'RS', name: 'Serbia',
    phone: { dialCode: '+381', maxDigits: 9, format: '+381 XX XXX XXXX', example: '+381 63 123 4567' },
    postal: { label: 'Postal Code', regex: /^\d{5,6}$/, example: '11000', maxLength: 6 },
  },
  {
    code: 'SG', name: 'Singapore',
    phone: { dialCode: '+65', maxDigits: 8, format: '+65 XXXX XXXX', example: '+65 9123 4567' },
    postal: { label: 'Postal Code', regex: /^\d{6}$/, example: '018956', maxLength: 6 },
  },
  {
    code: 'SK', name: 'Slovakia',
    phone: { dialCode: '+421', maxDigits: 9, format: '+421 XXX XXX XXX', example: '+421 901 234 567' },
    postal: { label: 'Postal Code', regex: /^\d{3}\s?\d{2}$/, example: '811 01', maxLength: 6 },
  },
  {
    code: 'SI', name: 'Slovenia',
    phone: { dialCode: '+386', maxDigits: 8, format: '+386 XX XXX XXX', example: '+386 31 123 456' },
    postal: { label: 'Postal Code', regex: /^\d{4}$/, example: '1000', maxLength: 4 },
  },
  {
    code: 'ZA', name: 'South Africa',
    phone: { dialCode: '+27', maxDigits: 9, format: '+27 XX XXX XXXX', example: '+27 82 123 4567' },
    postal: { label: 'Postal Code', regex: /^\d{4}$/, example: '2000', maxLength: 4 },
  },
  {
    code: 'KR', name: 'South Korea',
    phone: { dialCode: '+82', maxDigits: 10, format: '+82 XX XXXX XXXX', example: '+82 10 1234 5678' },
    postal: { label: 'Postal Code', regex: /^\d{5}$/, example: '03051', maxLength: 5 },
  },
  {
    code: 'ES', name: 'Spain',
    phone: { dialCode: '+34', maxDigits: 9, format: '+34 XXX XXX XXX', example: '+34 612 345 678' },
    postal: { label: 'Código Postal', regex: /^\d{5}$/, example: '28001', maxLength: 5 },
  },
  {
    code: 'LK', name: 'Sri Lanka',
    phone: { dialCode: '+94', maxDigits: 9, format: '+94 XX XXX XXXX', example: '+94 77 123 4567' },
    postal: { label: 'Postal Code', regex: /^\d{5}$/, example: '00100', maxLength: 5 },
  },
  {
    code: 'SE', name: 'Sweden',
    phone: { dialCode: '+46', maxDigits: 9, format: '+46 XX XXX XX XX', example: '+46 70 123 45 67' },
    postal: { label: 'Postnummer', regex: /^\d{3}\s?\d{2}$/, example: '111 22', maxLength: 6 },
  },
  {
    code: 'CH', name: 'Switzerland',
    phone: { dialCode: '+41', maxDigits: 9, format: '+41 XX XXX XX XX', example: '+41 79 123 45 67' },
    postal: { label: 'PLZ', regex: /^\d{4}$/, example: '8001', maxLength: 4 },
  },
  {
    code: 'TW', name: 'Taiwan',
    phone: { dialCode: '+886', maxDigits: 9, format: '+886 XXX XXX XXX', example: '+886 912 345 678' },
    postal: { label: 'Postal Code', regex: /^\d{3,5}$/, example: '100', maxLength: 5 },
  },
  {
    code: 'TJ', name: 'Tajikistan',
    phone: { dialCode: '+992', maxDigits: 9, format: '+992 XX XXX XXXX', example: '+992 90 123 4567' },
    postal: { label: 'Postal Code', regex: /^\d{6}$/, example: '734000', maxLength: 6 },
  },
  {
    code: 'TZ', name: 'Tanzania',
    phone: { dialCode: '+255', maxDigits: 9, format: '+255 XXX XXX XXX', example: '+255 712 345 678' },
    postal: { label: 'Postal Code', regex: /^\d{5}$/, example: '11101', maxLength: 5 },
  },
  {
    code: 'TH', name: 'Thailand',
    phone: { dialCode: '+66', maxDigits: 9, format: '+66 XX XXXX XXXX', example: '+66 81 234 5678' },
    postal: { label: 'Postal Code', regex: /^\d{5}$/, example: '10100', maxLength: 5 },
  },
  {
    code: 'TR', name: 'Turkey',
    phone: { dialCode: '+90', maxDigits: 10, format: '+90 XXX XXX XXXX', example: '+90 532 123 4567' },
    postal: { label: 'Postal Code', regex: /^\d{5}$/, example: '34000', maxLength: 5 },
  },
  {
    code: 'TM', name: 'Turkmenistan',
    phone: { dialCode: '+993', maxDigits: 8, format: '+993 XX XXXXXX', example: '+993 65 123456' },
    postal: { label: 'Postal Code', regex: /^\d{6}$/, example: '744000', maxLength: 6 },
  },
  {
    code: 'UA', name: 'Ukraine',
    phone: { dialCode: '+380', maxDigits: 9, format: '+380 XX XXX XX XX', example: '+380 50 123 45 67' },
    postal: { label: 'Postal Code', regex: /^\d{5}$/, example: '01001', maxLength: 5 },
  },
  {
    code: 'AE', name: 'United Arab Emirates',
    phone: { dialCode: '+971', maxDigits: 9, format: '+971 XX XXX XXXX', example: '+971 50 123 4567' },
    postal: { label: 'Postal Code', regex: /^\d{5,6}$|^.{0,10}$/, example: '00000', maxLength: 10 },
  },
  {
    code: 'GB', name: 'United Kingdom',
    phone: { dialCode: '+44', maxDigits: 10, format: '+44 XXXX XXXXXX', example: '+44 7911 123456' },
    postal: { label: 'Postcode', regex: /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i, example: 'SW1A 1AA', maxLength: 8 },
  },
  {
    code: 'US', name: 'United States',
    phone: { dialCode: '+1', maxDigits: 10, format: '+1 XXX XXX XXXX', example: '+1 212 555 1234' },
    postal: { label: 'ZIP Code', regex: /^\d{5}(-\d{4})?$/, example: '10001', maxLength: 10 },
  },
  {
    code: 'UZ', name: 'Uzbekistan',
    phone: { dialCode: '+998', maxDigits: 9, format: '+998 XX XXX XX XX', example: '+998 90 123 45 67' },
    postal: { label: 'Postal Code', regex: /^\d{6}$/, example: '100000', maxLength: 6 },
  },
  {
    code: 'VN', name: 'Vietnam',
    phone: { dialCode: '+84', maxDigits: 9, format: '+84 XXX XXX XXX', example: '+84 912 345 678' },
    postal: { label: 'Postal Code', regex: /^\d{6}$/, example: '100000', maxLength: 6 },
  },
  {
    code: 'YE', name: 'Yemen',
    phone: { dialCode: '+967', maxDigits: 9, format: '+967 XXX XXX XXX', example: '+967 711 234 567' },
    postal: { label: 'Postal Code', regex: /^\d{4,5}$/, example: '1234', maxLength: 5 },
  },
  {
    code: 'ZM', name: 'Zambia',
    phone: { dialCode: '+260', maxDigits: 9, format: '+260 XX XXXXXXX', example: '+260 97 1234567' },
    postal: { label: 'Postal Code', regex: /^\d{5}$/, example: '10101', maxLength: 5 },
  },
  {
    code: 'ZW', name: 'Zimbabwe',
    phone: { dialCode: '+263', maxDigits: 9, format: '+263 XX XXX XXXX', example: '+263 77 123 4567' },
    postal: { label: 'Postal Code', regex: /^.{0,10}$/, example: '00263', maxLength: 10 },
  },
];

// Quick lookup helpers
export function getCountryByCode(code: string): CountryInfo | undefined {
  return COUNTRY_DATA.find(c => c.code === code);
}

export function getPhoneRuleForCountry(code: string): CountryPhoneRule | undefined {
  return getCountryByCode(code)?.phone;
}

export function getPostalRuleForCountry(code: string): CountryPostalRule | undefined {
  return getCountryByCode(code)?.postal;
}

/**
 * Format a phone number with the country dial code prefix.
 * If the user already typed the dial code, don't double it.
 */
export function formatPhoneWithDialCode(phone: string, countryCode: string): string {
  const rule = getPhoneRuleForCountry(countryCode);
  if (!rule) return phone;
  const cleaned = phone.replace(/[^\d+]/g, '');
  if (cleaned.startsWith(rule.dialCode)) return phone;
  if (cleaned.startsWith('+')) return phone;
  return `${rule.dialCode} ${phone}`;
}

/**
 * Validate a phone number against country rules.
 * Returns true if the digits (after dial code) are within expected length.
 */
export function validatePhone(phone: string, countryCode: string): boolean {
  const rule = getPhoneRuleForCountry(countryCode);
  if (!rule) return phone.length > 0;
  const digits = phone.replace(/\D/g, '');
  // Allow dial code + digits or just digits
  const dialDigits = rule.dialCode.replace(/\D/g, '');
  const localDigits = digits.startsWith(dialDigits)
    ? digits.slice(dialDigits.length)
    : digits;
  return localDigits.length >= (rule.maxDigits - 2) && localDigits.length <= rule.maxDigits;
}

/**
 * Validate a postal/zip code against country rules.
 */
export function validatePostalCode(code: string, countryCode: string): boolean {
  const rule = getPostalRuleForCountry(countryCode);
  if (!rule) return code.length > 0;
  return rule.regex.test(code);
}
