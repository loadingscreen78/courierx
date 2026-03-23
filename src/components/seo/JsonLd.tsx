// JSON-LD Structured Data for SEO, AEO, and GEO optimization
export function OrganizationJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'CourierX',
    url: 'https://courierx.in',
    logo: 'https://courierx.in/lovable-uploads/19a008e8-fa55-402b-94a0-f1a05b4d70b4.png',
    description:
      'India\'s trusted international courier aggregator for medicines, documents, and gifts. CSB-IV compliant shipping to 150+ countries.',
    foundingDate: '2024',
    sameAs: [],
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer service',
        availableLanguage: ['English', 'Hindi'],
        areaServed: ['IN', 'US', 'GB', 'CA', 'AU', 'AE', 'SG', 'DE'],
      },
    ],
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'IN',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function WebSiteJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'CourierX',
    url: 'https://courierx.in',
    description:
      'International courier service from India for medicines, documents, and gifts.',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://courierx.in/public/track?awb={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}


export function CourierServiceJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: 'International Courier Service',
    provider: {
      '@type': 'Organization',
      name: 'CourierX',
      url: 'https://courierx.in',
    },
    name: 'International Courier & Shipping from India',
    description:
      'Ship medicines, documents, and personal gifts from India to 150+ countries via DHL, FedEx, and Aramex. CSB-IV compliant, door-to-door delivery in 3-7 days.',
    areaServed: {
      '@type': 'GeoShape',
      name: 'Worldwide — 150+ countries',
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Courier Services',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'International Medicine Courier',
            description:
              'Send prescription medicines from India to USA, UK, Canada, Australia, UAE, and 150+ countries. Compliant with customs regulations.',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'International Document Courier',
            description:
              'Fast and secure international document delivery from India. Ship legal papers, certificates, and important documents worldwide.',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'International Gift Courier',
            description:
              'Send personal gifts from India to loved ones abroad. Secure packaging and reliable delivery to 150+ countries.',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Domestic Courier India',
            description:
              'Fast and affordable domestic courier service across India. Door-to-door parcel delivery with real-time tracking.',
          },
        },
      ],
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function FAQJsonLd({ faqs }: { faqs: { question: string; answer: string }[] }) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function BreadcrumbJsonLd({ items }: { items: { name: string; url: string }[] }) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
