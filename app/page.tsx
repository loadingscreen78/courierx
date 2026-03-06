import type { Metadata } from 'next';
import { SectionLoader } from '@/components/landing/SectionLoader';
import dynamic from 'next/dynamic';

// ── SEO Metadata (rendered server-side, fully crawlable) ──────────────────────
export const metadata: Metadata = {
  title: 'CourierX — International Courier for Medicines, Documents & Gifts',
  description:
    'India\'s trusted international courier aggregator. Ship medicines, documents, and personal gifts to 150+ countries. CSB-IV compliant, fast delivery in 3–7 days.',
  keywords: [
    'international courier India',
    'ship medicines abroad',
    'send documents overseas',
    'CSB-IV compliant shipping',
    'courier aggregator India',
    'DHL FedEx Aramex India',
    'CourierX',
  ],
  openGraph: {
    title: 'CourierX — Ship Your Essentials Across the Globe',
    description:
      'Fast, compliant, and secure international shipping for medicines, documents, and gifts from India to 150+ countries.',
    url: 'https://courierxpayments.com',
    siteName: 'CourierX',
    type: 'website',
    images: [
      {
        url: '/lovable-uploads/19a008e8-fa55-402b-94a0-f1a05b4d70b4.png',
        width: 1200,
        height: 630,
        alt: 'CourierX — International Shipping',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CourierX — International Courier for Medicines, Documents & Gifts',
    description:
      'Ship to 150+ countries from India. CSB-IV compliant. Fast 3–7 day delivery.',
    images: ['/lovable-uploads/19a008e8-fa55-402b-94a0-f1a05b4d70b4.png'],
  },
  alternates: {
    canonical: 'https://courierxpayments.com',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

// ── Below-fold sections loaded lazily (no SSR needed, reduces initial JS) ─────
const LandingHeader = dynamic(
  () => import('@/components/landing/LandingHeader').then((m) => m.LandingHeader),
  { ssr: false }
);
const LandingFooter = dynamic(
  () => import('@/components/landing/LandingFooter').then((m) => m.LandingFooter),
  { ssr: false }
);
const HeroSection = dynamic(
  () => import('@/components/landing/HeroSection').then((m) => m.HeroSection),
  { ssr: false }
);
const FeaturesSection = dynamic(
  () => import('@/components/landing/FeaturesSection').then((m) => m.FeaturesSection),
  { ssr: false }
);
const HowItWorksSection = dynamic(
  () => import('@/components/landing/HowItWorksSection').then((m) => m.HowItWorksSection),
  { ssr: false }
);
const TestimonialsSection = dynamic(
  () => import('@/components/landing/TestimonialsSection').then((m) => m.TestimonialsSection),
  { ssr: false }
);
const CTASection = dynamic(
  () => import('@/components/landing/CTASection').then((m) => m.CTASection),
  { ssr: false }
);

// ── Page (Server Component — no "use client") ─────────────────────────────────
export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header is client-side (scroll detection, mobile menu) */}
      <LandingHeader />

      <main className="flex-1">
        {/* Hero is above-the-fold — rendered immediately, no lazy wrapper */}
        <HeroSection />

        {/* Below-fold sections: each wrapped in SectionLoader so they only
            mount when the user scrolls near them, keeping initial JS small */}
        <section id="features">
          <SectionLoader rootMargin="300px">
            <FeaturesSection />
          </SectionLoader>
        </section>

        <SectionLoader rootMargin="300px">
          <HowItWorksSection />
        </SectionLoader>

        <SectionLoader rootMargin="300px">
          <TestimonialsSection />
        </SectionLoader>

        <SectionLoader rootMargin="300px">
          <CTASection />
        </SectionLoader>
      </main>

      <LandingFooter />

      {/* Static links for crawlers — hidden visually but present in HTML */}
      <div style={{ display: 'none' }}>
        <a href="/privacy-policy">Privacy Policy</a>
        <a href="/terms">Terms of Service</a>
      </div>
    </div>
  );
}
