import type { Metadata } from "next";
import { Providers } from "./providers";
import "@/index.css";

export const metadata: Metadata = {
  title: {
    default: "CourierX - International Shipping from India",
    template: "%s | CourierX"
  },
  description: "Ship medicines, documents, and gifts internationally from India. CSB-IV compliant, fast delivery to 150+ countries. Compare DHL, FedEx, Aramex rates.",
  keywords: ["courier", "shipping", "international", "medicine", "documents", "gifts", "India", "DHL", "FedEx", "Aramex"],
  authors: [{ name: "CourierX" }],
  creator: "CourierX",
  publisher: "CourierX",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://courierx.in'),
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://courierx.in',
    siteName: 'CourierX',
    title: 'CourierX - International Shipping from India',
    description: 'Ship medicines, documents, and gifts internationally from India. Fast, reliable, and secure shipping services.',
    images: [
      {
        url: '/lovable-uploads/19a008e8-fa55-402b-94a0-f1a05b4d70b4.png',
        width: 1200,
        height: 630,
        alt: 'CourierX - International Shipping',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CourierX - International Shipping from India',
    description: 'Ship medicines, documents, and gifts internationally from India.',
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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light" style={{ colorScheme: 'light' }} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('courierx-theme') || 'light';
                  document.documentElement.classList.remove('light', 'dark');
                  document.documentElement.classList.add(theme);
                  document.documentElement.style.colorScheme = theme;
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
        <link rel="icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="bg-background text-foreground" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
