import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard',
          '/admin',
          '/cxbc/dashboard',
          '/api',
          '/auth/kyc',
          '/onboarding',
        ],
      },
    ],
    sitemap: 'https://courierx.in/sitemap.xml',
  };
}
