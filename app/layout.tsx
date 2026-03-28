import type { Metadata } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import { Providers } from "./providers";
import { OrganizationJsonLd, WebSiteJsonLd, CourierServiceJsonLd } from "@/components/seo/JsonLd";
import "@/index.css";

export const metadata: Metadata = {
  title: {
    default: "CourierX — Send Medicines, Documents & Gifts from India | International Courier",
    template: "%s | CourierX"
  },
  description: "India's #1 international courier aggregator. Ship prescription medicines, documents & gifts to USA, UK, Canada, Australia, UAE & 150+ countries. CSB-IV compliant. Compare DHL, FedEx, Aramex rates. 3-7 day delivery.",
  keywords: [
    "international courier India",
    "send medicines abroad from India",
    "ship prescription medicine internationally",
    "international medicine courier",
    "send documents overseas from India",
    "international document courier India",
    "send gifts abroad from India",
    "courier service India to USA",
    "courier service India to UK",
    "courier service India to Canada",
    "courier service India to Australia",
    "courier service India to UAE",
    "CSB-IV compliant shipping",
    "DHL courier India",
    "FedEx courier India",
    "Aramex courier India",
    "cheapest international courier India",
    "domestic courier India",
    "parcel delivery India",
    "courier aggregator India",
    "send medicine to USA from India",
    "send medicine to UK from India",
    "prescription medicine courier",
    "international shipping rates India",
    "person to person courier India",
    "CourierX",
  ],
  authors: [{ name: "CourierX" }],
  creator: "CourierX",
  publisher: "CourierX",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://courierx.in'),
  alternates: {
    canonical: 'https://courierx.in',
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://courierx.in',
    siteName: 'CourierX',
    title: 'CourierX — International Courier for Medicines, Documents & Gifts from India',
    description: 'Ship medicines, documents & gifts from India to 150+ countries. Compare DHL, FedEx, Aramex rates. CSB-IV compliant. Fast 3-7 day delivery.',
    images: [
      {
        url: '/lovable-uploads/19a008e8-fa55-402b-94a0-f1a05b4d70b4.png',
        width: 1200,
        height: 630,
        alt: 'CourierX — International Courier from India for Medicines, Documents & Gifts',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CourierX — International Courier from India',
    description: 'Ship medicines, documents & gifts from India to 150+ countries. CSB-IV compliant. Fast 3-7 day delivery.',
    images: ['/lovable-uploads/19a008e8-fa55-402b-94a0-f1a05b4d70b4.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
  other: {
    'geo.region': 'IN',
    'geo.placename': 'India',
    'ICBM': '20.5937, 78.9629',
  },
  icons: {
    icon: '/favicon.jpg',
    apple: '/favicon.jpg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light" style={{ colorScheme: 'light' }} suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  localStorage.setItem('courierx-theme', 'light');
                  document.documentElement.classList.remove('dark');
                  document.documentElement.classList.add('light');
                  document.documentElement.style.colorScheme = 'light';
                } catch (e) {}
              })();
            `,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" type="image/jpeg" href="/favicon.jpg" />
        <link rel="apple-touch-icon" href="/favicon.jpg" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="bg-background text-foreground" suppressHydrationWarning>
        <OrganizationJsonLd />
        <WebSiteJsonLd />
        <CourierServiceJsonLd />
        <Providers>{children}</Providers>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
