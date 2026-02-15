export interface KnowledgeArticle {
  id: string;
  title: string;
  summary: string;
  content: string[];
}

export interface KnowledgeCategory {
  id: string;
  title: string;
  icon: string;
  articles: KnowledgeArticle[];
}

export const knowledgeBaseData: KnowledgeCategory[] = [
  {
    id: 'shipping-guidelines',
    title: 'Shipping Guidelines',
    icon: 'Package',
    articles: [
      {
        id: 'packing-medicines',
        title: 'How to Pack Medicines Safely',
        summary: 'Best practices for packaging medicines for international shipping',
        content: [
          'Keep medicines in their original packaging with labels intact',
          'Include the pharmacy bill inside the package for reference',
          'Use bubble wrap for glass bottles or fragile containers',
          'For temperature-sensitive medicines, inform us during booking',
          'Liquids must be in sealed, leak-proof containers',
          'Powders should be in original sealed sachets or containers',
          'Do not mix multiple patients\' medicines in one shipment'
        ]
      },
      {
        id: 'document-shipping',
        title: 'Document Shipping Requirements',
        summary: 'Guidelines for shipping important documents internationally',
        content: [
          'Use rigid cardboard envelopes or folders to prevent bending',
          'Original documents should be placed in plastic sleeves',
          'Keep copies of all documents for your records',
          'Certificates requiring apostille should be processed before shipping',
          'Do not staple or punch holes in original documents',
          'Multiple documents can be shipped together in one package',
          'Declare the correct document type for accurate customs processing'
        ]
      },
      {
        id: 'gift-packaging',
        title: 'Gift Packaging Dos and Don\'ts',
        summary: 'How to properly package gifts for international delivery',
        content: [
          'DO: Use sturdy boxes with adequate cushioning',
          'DO: Wrap fragile items individually with bubble wrap',
          'DO: Include a gift note or greeting card',
          'DO: Declare accurate values for customs',
          'DON\'T: Gift-wrap the entire package (customs may need to inspect)',
          'DON\'T: Include prohibited items like currency or jewelry',
          'DON\'T: Over-pack - leave room for inspection if needed',
          'DON\'T: Use newspaper for padding (ink may transfer)'
        ]
      }
    ]
  },
  {
    id: 'csb-iv-guide',
    title: 'CSB IV Compliance',
    icon: 'Shield',
    articles: [
      {
        id: 'what-is-csb-iv',
        title: 'Understanding CSB IV',
        summary: 'Complete guide to Courier Shipping Bill IV regulations',
        content: [
          'CSB IV is a customs category under Indian Customs regulations for personal shipments',
          'Maximum declared value: ₹25,000 per shipment',
          'Items must be for personal use only - no commercial goods',
          'Sender\'s identity verification (Aadhaar KYC) is mandatory',
          'Each item requires an HSN code for customs classification',
          'Medicines are limited to 90 days supply per shipment',
          'Multiple shipments to same recipient may trigger customs scrutiny'
        ]
      },
      {
        id: 'value-limits',
        title: 'Understanding Value Limits',
        summary: 'What happens when you exceed the ₹25,000 limit',
        content: [
          'The ₹25,000 limit applies to the total declared value of all items',
          'Exceeding this limit means your shipment cannot be processed under CSB IV',
          'Higher-value items require formal customs clearance (not currently supported)',
          'Undervaluing items is illegal and may result in shipment seizure',
          'Insurance claims are based on declared value - declare accurately',
          'For high-value shipments, contact our support for alternative options'
        ]
      },
      {
        id: 'personal-use-definition',
        title: 'What Qualifies as Personal Use?',
        summary: 'Criteria for personal use classification',
        content: [
          'Items sent to family members for their personal consumption',
          'Medicines prescribed to the recipient for their own use',
          'Personal documents belonging to the sender or recipient',
          'Gifts with no commercial value or resale intent',
          'NOT personal use: items for resale, business samples, bulk quantities',
          'NOT personal use: items sent to businesses or commercial addresses',
          'When in doubt, contact support before booking'
        ]
      }
    ]
  },
  {
    id: 'country-regulations',
    title: 'Country Regulations',
    icon: 'Globe',
    articles: [
      {
        id: 'usa-regulations',
        title: 'USA Import Regulations',
        summary: 'What you need to know about shipping to the United States',
        content: [
          'FDA regulates medicine imports - prescription required',
          'Maximum 90-day supply of medicines allowed',
          'Controlled substances face strict restrictions',
          'Food items (including Ayurvedic) may need FDA approval',
          'Gifts under $800 are generally duty-free',
          'Accurate HS codes required for all items',
          'Commercial invoice required for customs clearance'
        ]
      },
      {
        id: 'uae-regulations',
        title: 'UAE Import Regulations',
        summary: 'Guidelines for shipping to United Arab Emirates',
        content: [
          'Medicines require approval from UAE Ministry of Health',
          'Some common medicines are controlled in UAE',
          'No pork products or alcohol allowed',
          'Religious materials may be inspected',
          'Gifts under AED 1,000 may be duty-free',
          'De minimis value: AED 1,000',
          'Fast clearance typically within 24-48 hours'
        ]
      },
      {
        id: 'uk-regulations',
        title: 'UK Import Regulations',
        summary: 'Post-Brexit shipping guidelines for United Kingdom',
        content: [
          'Medicines must be for personal use only',
          'Controlled drugs require Home Office license',
          'CITES permits required for certain Ayurvedic products',
          'Gifts under £39 are generally duty-free',
          'VAT may apply on items over £135',
          'EORI number not required for personal shipments',
          'Transit time typically 5-7 business days'
        ]
      }
    ]
  },
  {
    id: 'prohibited-items',
    title: 'Prohibited Items',
    icon: 'Ban',
    articles: [
      {
        id: 'global-prohibitions',
        title: 'Globally Prohibited Items',
        summary: 'Items that cannot be shipped to any destination',
        content: [
          'Narcotics and illegal drugs',
          'Weapons, ammunition, and explosives',
          'Hazardous materials (flammables, corrosives, radioactive)',
          'Live animals and plants (without CITES permits)',
          'Counterfeit goods and pirated materials',
          'Currency notes and coins',
          'Pornographic materials',
          'Items that violate intellectual property rights'
        ]
      },
      {
        id: 'courierx-restrictions',
        title: 'CourierX-Specific Restrictions',
        summary: 'Additional items not accepted by CourierX',
        content: [
          'Gold, silver, and precious metals',
          'Jewelry and precious stones',
          'Antiques and collectibles',
          'Passports and government IDs',
          'Credit/debit cards and financial instruments',
          'Perishable food items',
          'Loose lithium batteries',
          'Items requiring cold chain logistics'
        ]
      },
      {
        id: 'rejection-process',
        title: 'What Happens if Shipment is Rejected?',
        summary: 'Process when items are rejected at any stage',
        content: [
          'QC Rejection: You\'ll be notified with options to modify or cancel',
          'Customs Rejection: Shipment may be returned or destroyed',
          'Carrier Rejection: We\'ll contact you for alternative arrangements',
          'Refund policy applies based on rejection stage',
          'Return shipping charges may apply for QC rejections',
          'No refund for customs seizures due to prohibited items',
          'Always declare items accurately to avoid rejections'
        ]
      }
    ]
  }
];
