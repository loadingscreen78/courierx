// Country database with 150+ countries organized by region and shipping zone

export type Region = 'americas' | 'europe' | 'middle-east' | 'asia-pacific' | 'africa';
export type ShippingZone = 1 | 2 | 3 | 4 | 5 | 6;

export interface Country {
  code: string;
  name: string;
  region: Region;
  zone: ShippingZone;
  currency: string;
  phoneCode: string;
  isServed: boolean;
  notServedReason?: string;
  flag: string;
}

// Zone definitions:
// Zone 1: Middle East (AE, SA, QA, KW, OM, BH) - 3-5 days
// Zone 2: Southeast Asia (SG, MY, TH, ID, PH, VN) - 4-6 days
// Zone 3: Europe - 4-7 days
// Zone 4: Americas (US, CA, MX) - 5-8 days
// Zone 5: Oceania (AU, NZ) - 6-9 days
// Zone 6: Rest of World - 7-12 days

export const countries: Country[] = [
  // MIDDLE EAST - Zone 1
  { code: 'AE', name: 'United Arab Emirates', region: 'middle-east', zone: 1, currency: 'AED', phoneCode: '+971', isServed: true, flag: '🇦🇪' },
  { code: 'SA', name: 'Saudi Arabia', region: 'middle-east', zone: 1, currency: 'SAR', phoneCode: '+966', isServed: true, flag: '🇸🇦' },
  { code: 'QA', name: 'Qatar', region: 'middle-east', zone: 1, currency: 'QAR', phoneCode: '+974', isServed: true, flag: '🇶🇦' },
  { code: 'KW', name: 'Kuwait', region: 'middle-east', zone: 1, currency: 'KWD', phoneCode: '+965', isServed: true, flag: '🇰🇼' },
  { code: 'OM', name: 'Oman', region: 'middle-east', zone: 1, currency: 'OMR', phoneCode: '+968', isServed: true, flag: '🇴🇲' },
  { code: 'BH', name: 'Bahrain', region: 'middle-east', zone: 1, currency: 'BHD', phoneCode: '+973', isServed: true, flag: '🇧🇭' },
  { code: 'JO', name: 'Jordan', region: 'middle-east', zone: 1, currency: 'JOD', phoneCode: '+962', isServed: true, flag: '🇯🇴' },
  { code: 'LB', name: 'Lebanon', region: 'middle-east', zone: 1, currency: 'LBP', phoneCode: '+961', isServed: true, flag: '🇱🇧' },
  { code: 'IL', name: 'Israel', region: 'middle-east', zone: 1, currency: 'ILS', phoneCode: '+972', isServed: true, flag: '🇮🇱' },
  { code: 'IQ', name: 'Iraq', region: 'middle-east', zone: 6, currency: 'IQD', phoneCode: '+964', isServed: false, notServedReason: 'Limited courier access', flag: '🇮🇶' },
  { code: 'IR', name: 'Iran', region: 'middle-east', zone: 6, currency: 'IRR', phoneCode: '+98', isServed: false, notServedReason: 'International sanctions', flag: '🇮🇷' },
  { code: 'SY', name: 'Syria', region: 'middle-east', zone: 6, currency: 'SYP', phoneCode: '+963', isServed: false, notServedReason: 'Limited courier access', flag: '🇸🇾' },
  { code: 'YE', name: 'Yemen', region: 'middle-east', zone: 6, currency: 'YER', phoneCode: '+967', isServed: false, notServedReason: 'Limited courier access', flag: '🇾🇪' },
  { code: 'TR', name: 'Turkey', region: 'middle-east', zone: 3, currency: 'TRY', phoneCode: '+90', isServed: true, flag: '🇹🇷' },
  { code: 'EG', name: 'Egypt', region: 'middle-east', zone: 1, currency: 'EGP', phoneCode: '+20', isServed: true, flag: '🇪🇬' },

  // SOUTHEAST ASIA - Zone 2
  { code: 'SG', name: 'Singapore', region: 'asia-pacific', zone: 2, currency: 'SGD', phoneCode: '+65', isServed: true, flag: '🇸🇬' },
  { code: 'MY', name: 'Malaysia', region: 'asia-pacific', zone: 2, currency: 'MYR', phoneCode: '+60', isServed: true, flag: '🇲🇾' },
  { code: 'TH', name: 'Thailand', region: 'asia-pacific', zone: 2, currency: 'THB', phoneCode: '+66', isServed: true, flag: '🇹🇭' },
  { code: 'ID', name: 'Indonesia', region: 'asia-pacific', zone: 2, currency: 'IDR', phoneCode: '+62', isServed: true, flag: '🇮🇩' },
  { code: 'PH', name: 'Philippines', region: 'asia-pacific', zone: 2, currency: 'PHP', phoneCode: '+63', isServed: true, flag: '🇵🇭' },
  { code: 'VN', name: 'Vietnam', region: 'asia-pacific', zone: 2, currency: 'VND', phoneCode: '+84', isServed: true, flag: '🇻🇳' },
  { code: 'MM', name: 'Myanmar', region: 'asia-pacific', zone: 2, currency: 'MMK', phoneCode: '+95', isServed: true, flag: '🇲🇲' },
  { code: 'KH', name: 'Cambodia', region: 'asia-pacific', zone: 2, currency: 'KHR', phoneCode: '+855', isServed: true, flag: '🇰🇭' },
  { code: 'LA', name: 'Laos', region: 'asia-pacific', zone: 2, currency: 'LAK', phoneCode: '+856', isServed: true, flag: '🇱🇦' },
  { code: 'BN', name: 'Brunei', region: 'asia-pacific', zone: 2, currency: 'BND', phoneCode: '+673', isServed: true, flag: '🇧🇳' },
  { code: 'TL', name: 'Timor-Leste', region: 'asia-pacific', zone: 6, currency: 'USD', phoneCode: '+670', isServed: true, flag: '🇹🇱' },

  // EAST ASIA - Zone 2-3
  { code: 'JP', name: 'Japan', region: 'asia-pacific', zone: 2, currency: 'JPY', phoneCode: '+81', isServed: true, flag: '🇯🇵' },
  { code: 'KR', name: 'South Korea', region: 'asia-pacific', zone: 2, currency: 'KRW', phoneCode: '+82', isServed: true, flag: '🇰🇷' },
  { code: 'CN', name: 'China', region: 'asia-pacific', zone: 2, currency: 'CNY', phoneCode: '+86', isServed: true, flag: '🇨🇳' },
  { code: 'HK', name: 'Hong Kong', region: 'asia-pacific', zone: 2, currency: 'HKD', phoneCode: '+852', isServed: true, flag: '🇭🇰' },
  { code: 'TW', name: 'Taiwan', region: 'asia-pacific', zone: 2, currency: 'TWD', phoneCode: '+886', isServed: true, flag: '🇹🇼' },
  { code: 'MO', name: 'Macau', region: 'asia-pacific', zone: 2, currency: 'MOP', phoneCode: '+853', isServed: true, flag: '🇲🇴' },
  { code: 'MN', name: 'Mongolia', region: 'asia-pacific', zone: 6, currency: 'MNT', phoneCode: '+976', isServed: true, flag: '🇲🇳' },
  { code: 'KP', name: 'North Korea', region: 'asia-pacific', zone: 6, currency: 'KPW', phoneCode: '+850', isServed: false, notServedReason: 'International sanctions', flag: '🇰🇵' },

  // SOUTH ASIA - Zone 2
  { code: 'BD', name: 'Bangladesh', region: 'asia-pacific', zone: 2, currency: 'BDT', phoneCode: '+880', isServed: true, flag: '🇧🇩' },
  { code: 'PK', name: 'Pakistan', region: 'asia-pacific', zone: 2, currency: 'PKR', phoneCode: '+92', isServed: true, flag: '🇵🇰' },
  { code: 'LK', name: 'Sri Lanka', region: 'asia-pacific', zone: 2, currency: 'LKR', phoneCode: '+94', isServed: true, flag: '🇱🇰' },
  { code: 'NP', name: 'Nepal', region: 'asia-pacific', zone: 2, currency: 'NPR', phoneCode: '+977', isServed: true, flag: '🇳🇵' },
  { code: 'BT', name: 'Bhutan', region: 'asia-pacific', zone: 2, currency: 'BTN', phoneCode: '+975', isServed: true, flag: '🇧🇹' },
  { code: 'MV', name: 'Maldives', region: 'asia-pacific', zone: 2, currency: 'MVR', phoneCode: '+960', isServed: true, flag: '🇲🇻' },
  { code: 'AF', name: 'Afghanistan', region: 'asia-pacific', zone: 6, currency: 'AFN', phoneCode: '+93', isServed: false, notServedReason: 'Limited courier access', flag: '🇦🇫' },

  // CENTRAL ASIA - Zone 6
  { code: 'KZ', name: 'Kazakhstan', region: 'asia-pacific', zone: 6, currency: 'KZT', phoneCode: '+7', isServed: true, flag: '🇰🇿' },
  { code: 'UZ', name: 'Uzbekistan', region: 'asia-pacific', zone: 6, currency: 'UZS', phoneCode: '+998', isServed: true, flag: '🇺🇿' },
  { code: 'KG', name: 'Kyrgyzstan', region: 'asia-pacific', zone: 6, currency: 'KGS', phoneCode: '+996', isServed: true, flag: '🇰🇬' },
  { code: 'TJ', name: 'Tajikistan', region: 'asia-pacific', zone: 6, currency: 'TJS', phoneCode: '+992', isServed: true, flag: '🇹🇯' },
  { code: 'TM', name: 'Turkmenistan', region: 'asia-pacific', zone: 6, currency: 'TMT', phoneCode: '+993', isServed: true, flag: '🇹🇲' },

  // CAUCASUS - Zone 6
  { code: 'GE', name: 'Georgia', region: 'asia-pacific', zone: 6, currency: 'GEL', phoneCode: '+995', isServed: true, flag: '🇬🇪' },
  { code: 'AM', name: 'Armenia', region: 'asia-pacific', zone: 6, currency: 'AMD', phoneCode: '+374', isServed: true, flag: '🇦🇲' },
  { code: 'AZ', name: 'Azerbaijan', region: 'asia-pacific', zone: 6, currency: 'AZN', phoneCode: '+994', isServed: true, flag: '🇦🇿' },

  // OCEANIA - Zone 5
  { code: 'AU', name: 'Australia', region: 'asia-pacific', zone: 5, currency: 'AUD', phoneCode: '+61', isServed: true, flag: '🇦🇺' },
  { code: 'NZ', name: 'New Zealand', region: 'asia-pacific', zone: 5, currency: 'NZD', phoneCode: '+64', isServed: true, flag: '🇳🇿' },
  { code: 'FJ', name: 'Fiji', region: 'asia-pacific', zone: 5, currency: 'FJD', phoneCode: '+679', isServed: true, flag: '🇫🇯' },
  { code: 'PG', name: 'Papua New Guinea', region: 'asia-pacific', zone: 6, currency: 'PGK', phoneCode: '+675', isServed: true, flag: '🇵🇬' },
  { code: 'NC', name: 'New Caledonia', region: 'asia-pacific', zone: 5, currency: 'XPF', phoneCode: '+687', isServed: true, flag: '🇳🇨' },
  { code: 'PF', name: 'French Polynesia', region: 'asia-pacific', zone: 5, currency: 'XPF', phoneCode: '+689', isServed: true, flag: '🇵🇫' },
  { code: 'WS', name: 'Samoa', region: 'asia-pacific', zone: 6, currency: 'WST', phoneCode: '+685', isServed: true, flag: '🇼🇸' },
  { code: 'TO', name: 'Tonga', region: 'asia-pacific', zone: 6, currency: 'TOP', phoneCode: '+676', isServed: true, flag: '🇹🇴' },
  { code: 'VU', name: 'Vanuatu', region: 'asia-pacific', zone: 6, currency: 'VUV', phoneCode: '+678', isServed: true, flag: '🇻🇺' },
  { code: 'SB', name: 'Solomon Islands', region: 'asia-pacific', zone: 6, currency: 'SBD', phoneCode: '+677', isServed: true, flag: '🇸🇧' },
  { code: 'GU', name: 'Guam', region: 'asia-pacific', zone: 5, currency: 'USD', phoneCode: '+1', isServed: true, flag: '🇬🇺' },

  // EUROPE - Zone 3
  { code: 'GB', name: 'United Kingdom', region: 'europe', zone: 3, currency: 'GBP', phoneCode: '+44', isServed: true, flag: '🇬🇧' },
  { code: 'DE', name: 'Germany', region: 'europe', zone: 3, currency: 'EUR', phoneCode: '+49', isServed: true, flag: '🇩🇪' },
  { code: 'FR', name: 'France', region: 'europe', zone: 3, currency: 'EUR', phoneCode: '+33', isServed: true, flag: '🇫🇷' },
  { code: 'NL', name: 'Netherlands', region: 'europe', zone: 3, currency: 'EUR', phoneCode: '+31', isServed: true, flag: '🇳🇱' },
  { code: 'BE', name: 'Belgium', region: 'europe', zone: 3, currency: 'EUR', phoneCode: '+32', isServed: true, flag: '🇧🇪' },
  { code: 'IT', name: 'Italy', region: 'europe', zone: 3, currency: 'EUR', phoneCode: '+39', isServed: true, flag: '🇮🇹' },
  { code: 'ES', name: 'Spain', region: 'europe', zone: 3, currency: 'EUR', phoneCode: '+34', isServed: true, flag: '🇪🇸' },
  { code: 'PT', name: 'Portugal', region: 'europe', zone: 3, currency: 'EUR', phoneCode: '+351', isServed: true, flag: '🇵🇹' },
  { code: 'CH', name: 'Switzerland', region: 'europe', zone: 3, currency: 'CHF', phoneCode: '+41', isServed: true, flag: '🇨🇭' },
  { code: 'AT', name: 'Austria', region: 'europe', zone: 3, currency: 'EUR', phoneCode: '+43', isServed: true, flag: '🇦🇹' },
  { code: 'SE', name: 'Sweden', region: 'europe', zone: 3, currency: 'SEK', phoneCode: '+46', isServed: true, flag: '🇸🇪' },
  { code: 'NO', name: 'Norway', region: 'europe', zone: 3, currency: 'NOK', phoneCode: '+47', isServed: true, flag: '🇳🇴' },
  { code: 'DK', name: 'Denmark', region: 'europe', zone: 3, currency: 'DKK', phoneCode: '+45', isServed: true, flag: '🇩🇰' },
  { code: 'FI', name: 'Finland', region: 'europe', zone: 3, currency: 'EUR', phoneCode: '+358', isServed: true, flag: '🇫🇮' },
  { code: 'IE', name: 'Ireland', region: 'europe', zone: 3, currency: 'EUR', phoneCode: '+353', isServed: true, flag: '🇮🇪' },
  { code: 'PL', name: 'Poland', region: 'europe', zone: 3, currency: 'PLN', phoneCode: '+48', isServed: true, flag: '🇵🇱' },
  { code: 'CZ', name: 'Czech Republic', region: 'europe', zone: 3, currency: 'CZK', phoneCode: '+420', isServed: true, flag: '🇨🇿' },
  { code: 'GR', name: 'Greece', region: 'europe', zone: 3, currency: 'EUR', phoneCode: '+30', isServed: true, flag: '🇬🇷' },
  { code: 'HU', name: 'Hungary', region: 'europe', zone: 3, currency: 'HUF', phoneCode: '+36', isServed: true, flag: '🇭🇺' },
  { code: 'RO', name: 'Romania', region: 'europe', zone: 3, currency: 'RON', phoneCode: '+40', isServed: true, flag: '🇷🇴' },
  { code: 'BG', name: 'Bulgaria', region: 'europe', zone: 3, currency: 'BGN', phoneCode: '+359', isServed: true, flag: '🇧🇬' },
  { code: 'HR', name: 'Croatia', region: 'europe', zone: 3, currency: 'EUR', phoneCode: '+385', isServed: true, flag: '🇭🇷' },
  { code: 'SK', name: 'Slovakia', region: 'europe', zone: 3, currency: 'EUR', phoneCode: '+421', isServed: true, flag: '🇸🇰' },
  { code: 'SI', name: 'Slovenia', region: 'europe', zone: 3, currency: 'EUR', phoneCode: '+386', isServed: true, flag: '🇸🇮' },
  { code: 'EE', name: 'Estonia', region: 'europe', zone: 3, currency: 'EUR', phoneCode: '+372', isServed: true, flag: '🇪🇪' },
  { code: 'LV', name: 'Latvia', region: 'europe', zone: 3, currency: 'EUR', phoneCode: '+371', isServed: true, flag: '🇱🇻' },
  { code: 'LT', name: 'Lithuania', region: 'europe', zone: 3, currency: 'EUR', phoneCode: '+370', isServed: true, flag: '🇱🇹' },
  { code: 'UA', name: 'Ukraine', region: 'europe', zone: 6, currency: 'UAH', phoneCode: '+380', isServed: false, notServedReason: 'Service suspended due to conflict', flag: '🇺🇦' },
  { code: 'RS', name: 'Serbia', region: 'europe', zone: 3, currency: 'RSD', phoneCode: '+381', isServed: true, flag: '🇷🇸' },
  { code: 'BY', name: 'Belarus', region: 'europe', zone: 6, currency: 'BYN', phoneCode: '+375', isServed: false, notServedReason: 'International sanctions', flag: '🇧🇾' },
  { code: 'MT', name: 'Malta', region: 'europe', zone: 3, currency: 'EUR', phoneCode: '+356', isServed: true, flag: '🇲🇹' },
  { code: 'CY', name: 'Cyprus', region: 'europe', zone: 3, currency: 'EUR', phoneCode: '+357', isServed: true, flag: '🇨🇾' },
  { code: 'LU', name: 'Luxembourg', region: 'europe', zone: 3, currency: 'EUR', phoneCode: '+352', isServed: true, flag: '🇱🇺' },
  { code: 'IS', name: 'Iceland', region: 'europe', zone: 3, currency: 'ISK', phoneCode: '+354', isServed: true, flag: '🇮🇸' },
  { code: 'MC', name: 'Monaco', region: 'europe', zone: 3, currency: 'EUR', phoneCode: '+377', isServed: true, flag: '🇲🇨' },
  { code: 'AD', name: 'Andorra', region: 'europe', zone: 3, currency: 'EUR', phoneCode: '+376', isServed: true, flag: '🇦🇩' },
  { code: 'SM', name: 'San Marino', region: 'europe', zone: 3, currency: 'EUR', phoneCode: '+378', isServed: true, flag: '🇸🇲' },
  { code: 'LI', name: 'Liechtenstein', region: 'europe', zone: 3, currency: 'CHF', phoneCode: '+423', isServed: true, flag: '🇱🇮' },
  { code: 'VA', name: 'Vatican City', region: 'europe', zone: 3, currency: 'EUR', phoneCode: '+39', isServed: true, flag: '🇻🇦' },
  { code: 'RU', name: 'Russia', region: 'europe', zone: 6, currency: 'RUB', phoneCode: '+7', isServed: false, notServedReason: 'International sanctions', flag: '🇷🇺' },
  { code: 'AL', name: 'Albania', region: 'europe', zone: 3, currency: 'ALL', phoneCode: '+355', isServed: true, flag: '🇦🇱' },
  { code: 'MK', name: 'North Macedonia', region: 'europe', zone: 3, currency: 'MKD', phoneCode: '+389', isServed: true, flag: '🇲🇰' },
  { code: 'BA', name: 'Bosnia and Herzegovina', region: 'europe', zone: 3, currency: 'BAM', phoneCode: '+387', isServed: true, flag: '🇧🇦' },
  { code: 'ME', name: 'Montenegro', region: 'europe', zone: 3, currency: 'EUR', phoneCode: '+382', isServed: true, flag: '🇲🇪' },
  { code: 'XK', name: 'Kosovo', region: 'europe', zone: 3, currency: 'EUR', phoneCode: '+383', isServed: true, flag: '🇽🇰' },
  { code: 'MD', name: 'Moldova', region: 'europe', zone: 3, currency: 'MDL', phoneCode: '+373', isServed: true, flag: '🇲🇩' },

  // AMERICAS - Zone 4
  { code: 'US', name: 'United States', region: 'americas', zone: 4, currency: 'USD', phoneCode: '+1', isServed: true, flag: '🇺🇸' },
  { code: 'CA', name: 'Canada', region: 'americas', zone: 4, currency: 'CAD', phoneCode: '+1', isServed: true, flag: '🇨🇦' },
  { code: 'MX', name: 'Mexico', region: 'americas', zone: 4, currency: 'MXN', phoneCode: '+52', isServed: true, flag: '🇲🇽' },
  { code: 'BR', name: 'Brazil', region: 'americas', zone: 4, currency: 'BRL', phoneCode: '+55', isServed: true, flag: '🇧🇷' },
  { code: 'AR', name: 'Argentina', region: 'americas', zone: 4, currency: 'ARS', phoneCode: '+54', isServed: true, flag: '🇦🇷' },
  { code: 'CL', name: 'Chile', region: 'americas', zone: 4, currency: 'CLP', phoneCode: '+56', isServed: true, flag: '🇨🇱' },
  { code: 'CO', name: 'Colombia', region: 'americas', zone: 4, currency: 'COP', phoneCode: '+57', isServed: true, flag: '🇨🇴' },
  { code: 'PE', name: 'Peru', region: 'americas', zone: 4, currency: 'PEN', phoneCode: '+51', isServed: true, flag: '🇵🇪' },
  { code: 'VE', name: 'Venezuela', region: 'americas', zone: 6, currency: 'VES', phoneCode: '+58', isServed: false, notServedReason: 'Banking restrictions', flag: '🇻🇪' },
  { code: 'EC', name: 'Ecuador', region: 'americas', zone: 4, currency: 'USD', phoneCode: '+593', isServed: true, flag: '🇪🇨' },
  { code: 'UY', name: 'Uruguay', region: 'americas', zone: 4, currency: 'UYU', phoneCode: '+598', isServed: true, flag: '🇺🇾' },
  { code: 'PY', name: 'Paraguay', region: 'americas', zone: 4, currency: 'PYG', phoneCode: '+595', isServed: true, flag: '🇵🇾' },
  { code: 'BO', name: 'Bolivia', region: 'americas', zone: 4, currency: 'BOB', phoneCode: '+591', isServed: true, flag: '🇧🇴' },
  { code: 'CR', name: 'Costa Rica', region: 'americas', zone: 4, currency: 'CRC', phoneCode: '+506', isServed: true, flag: '🇨🇷' },
  { code: 'PA', name: 'Panama', region: 'americas', zone: 4, currency: 'PAB', phoneCode: '+507', isServed: true, flag: '🇵🇦' },
  { code: 'GT', name: 'Guatemala', region: 'americas', zone: 4, currency: 'GTQ', phoneCode: '+502', isServed: true, flag: '🇬🇹' },
  { code: 'CU', name: 'Cuba', region: 'americas', zone: 6, currency: 'CUP', phoneCode: '+53', isServed: false, notServedReason: 'Trade restrictions', flag: '🇨🇺' },
  { code: 'DO', name: 'Dominican Republic', region: 'americas', zone: 4, currency: 'DOP', phoneCode: '+1', isServed: true, flag: '🇩🇴' },
  { code: 'PR', name: 'Puerto Rico', region: 'americas', zone: 4, currency: 'USD', phoneCode: '+1', isServed: true, flag: '🇵🇷' },
  { code: 'JM', name: 'Jamaica', region: 'americas', zone: 4, currency: 'JMD', phoneCode: '+1', isServed: true, flag: '🇯🇲' },
  { code: 'TT', name: 'Trinidad and Tobago', region: 'americas', zone: 4, currency: 'TTD', phoneCode: '+1', isServed: true, flag: '🇹🇹' },
  { code: 'BS', name: 'Bahamas', region: 'americas', zone: 4, currency: 'BSD', phoneCode: '+1', isServed: true, flag: '🇧🇸' },
  { code: 'BB', name: 'Barbados', region: 'americas', zone: 4, currency: 'BBD', phoneCode: '+1', isServed: true, flag: '🇧🇧' },
  { code: 'HT', name: 'Haiti', region: 'americas', zone: 6, currency: 'HTG', phoneCode: '+509', isServed: true, flag: '🇭🇹' },
  { code: 'SV', name: 'El Salvador', region: 'americas', zone: 4, currency: 'USD', phoneCode: '+503', isServed: true, flag: '🇸🇻' },
  { code: 'HN', name: 'Honduras', region: 'americas', zone: 4, currency: 'HNL', phoneCode: '+504', isServed: true, flag: '🇭🇳' },
  { code: 'NI', name: 'Nicaragua', region: 'americas', zone: 4, currency: 'NIO', phoneCode: '+505', isServed: true, flag: '🇳🇮' },
  { code: 'GY', name: 'Guyana', region: 'americas', zone: 4, currency: 'GYD', phoneCode: '+592', isServed: true, flag: '🇬🇾' },
  { code: 'SR', name: 'Suriname', region: 'americas', zone: 4, currency: 'SRD', phoneCode: '+597', isServed: true, flag: '🇸🇷' },
  { code: 'BZ', name: 'Belize', region: 'americas', zone: 4, currency: 'BZD', phoneCode: '+501', isServed: true, flag: '🇧🇿' },

  // AFRICA - Zone 6
  { code: 'ZA', name: 'South Africa', region: 'africa', zone: 6, currency: 'ZAR', phoneCode: '+27', isServed: true, flag: '🇿🇦' },
  { code: 'NG', name: 'Nigeria', region: 'africa', zone: 6, currency: 'NGN', phoneCode: '+234', isServed: true, flag: '🇳🇬' },
  { code: 'KE', name: 'Kenya', region: 'africa', zone: 6, currency: 'KES', phoneCode: '+254', isServed: true, flag: '🇰🇪' },
  { code: 'GH', name: 'Ghana', region: 'africa', zone: 6, currency: 'GHS', phoneCode: '+233', isServed: true, flag: '🇬🇭' },
  { code: 'MA', name: 'Morocco', region: 'africa', zone: 6, currency: 'MAD', phoneCode: '+212', isServed: true, flag: '🇲🇦' },
  { code: 'TN', name: 'Tunisia', region: 'africa', zone: 6, currency: 'TND', phoneCode: '+216', isServed: true, flag: '🇹🇳' },
  { code: 'ET', name: 'Ethiopia', region: 'africa', zone: 6, currency: 'ETB', phoneCode: '+251', isServed: true, flag: '🇪🇹' },
  { code: 'TZ', name: 'Tanzania', region: 'africa', zone: 6, currency: 'TZS', phoneCode: '+255', isServed: true, flag: '🇹🇿' },
  { code: 'UG', name: 'Uganda', region: 'africa', zone: 6, currency: 'UGX', phoneCode: '+256', isServed: true, flag: '🇺🇬' },
  { code: 'RW', name: 'Rwanda', region: 'africa', zone: 6, currency: 'RWF', phoneCode: '+250', isServed: true, flag: '🇷🇼' },
  { code: 'SN', name: 'Senegal', region: 'africa', zone: 6, currency: 'XOF', phoneCode: '+221', isServed: true, flag: '🇸🇳' },
  { code: 'CI', name: 'Ivory Coast', region: 'africa', zone: 6, currency: 'XOF', phoneCode: '+225', isServed: true, flag: '🇨🇮' },
  { code: 'CM', name: 'Cameroon', region: 'africa', zone: 6, currency: 'XAF', phoneCode: '+237', isServed: true, flag: '🇨🇲' },
  { code: 'AO', name: 'Angola', region: 'africa', zone: 6, currency: 'AOA', phoneCode: '+244', isServed: true, flag: '🇦🇴' },
  { code: 'MU', name: 'Mauritius', region: 'africa', zone: 6, currency: 'MUR', phoneCode: '+230', isServed: true, flag: '🇲🇺' },
  { code: 'MZ', name: 'Mozambique', region: 'africa', zone: 6, currency: 'MZN', phoneCode: '+258', isServed: true, flag: '🇲🇿' },
  { code: 'ZW', name: 'Zimbabwe', region: 'africa', zone: 6, currency: 'ZWL', phoneCode: '+263', isServed: true, flag: '🇿🇼' },
  { code: 'BW', name: 'Botswana', region: 'africa', zone: 6, currency: 'BWP', phoneCode: '+267', isServed: true, flag: '🇧🇼' },
  { code: 'NA', name: 'Namibia', region: 'africa', zone: 6, currency: 'NAD', phoneCode: '+264', isServed: true, flag: '🇳🇦' },
  { code: 'ZM', name: 'Zambia', region: 'africa', zone: 6, currency: 'ZMW', phoneCode: '+260', isServed: true, flag: '🇿🇲' },
  { code: 'DZ', name: 'Algeria', region: 'africa', zone: 6, currency: 'DZD', phoneCode: '+213', isServed: true, flag: '🇩🇿' },
  { code: 'LY', name: 'Libya', region: 'africa', zone: 6, currency: 'LYD', phoneCode: '+218', isServed: false, notServedReason: 'Limited courier access', flag: '🇱🇾' },
  { code: 'SD', name: 'Sudan', region: 'africa', zone: 6, currency: 'SDG', phoneCode: '+249', isServed: false, notServedReason: 'International sanctions', flag: '🇸🇩' },
  { code: 'SS', name: 'South Sudan', region: 'africa', zone: 6, currency: 'SSP', phoneCode: '+211', isServed: false, notServedReason: 'Limited courier access', flag: '🇸🇸' },
  { code: 'SO', name: 'Somalia', region: 'africa', zone: 6, currency: 'SOS', phoneCode: '+252', isServed: false, notServedReason: 'Limited courier access', flag: '🇸🇴' },
];

// Helper functions
export const getCountryByCode = (code: string): Country | undefined => {
  return countries.find(c => c.code === code);
};

export const getServedCountries = (): Country[] => {
  return countries.filter(c => c.isServed);
};

export const getNotServedCountries = (): Country[] => {
  return countries.filter(c => !c.isServed);
};

export const getCountriesByRegion = (region: Region): Country[] => {
  return countries.filter(c => c.region === region);
};

export const getCountriesByZone = (zone: ShippingZone): Country[] => {
  return countries.filter(c => c.zone === zone);
};

export const searchCountries = (query: string): Country[] => {
  const lowerQuery = query.toLowerCase();
  return countries.filter(c => 
    c.name.toLowerCase().includes(lowerQuery) || 
    c.code.toLowerCase().includes(lowerQuery)
  );
};

export const regionLabels: Record<Region, string> = {
  'americas': 'Americas',
  'europe': 'Europe',
  'middle-east': 'Middle East',
  'asia-pacific': 'Asia Pacific',
  'africa': 'Africa',
};
