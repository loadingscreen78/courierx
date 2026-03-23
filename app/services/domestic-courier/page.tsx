import type { Metadata } from 'next';
import Link from 'next/link';
import { FAQJsonLd, BreadcrumbJsonLd } from '@/components/seo/JsonLd';

export const metadata: Metadata = {
  title: 'Domestic Courier India — Fast Parcel Delivery Across India | Door-to-Door',
  description:
    'Fast and affordable domestic courier service across India. Door-to-door parcel delivery with real-time tracking. Compare rates from top carriers. Same-day pickup, 1-5 day delivery.',
  keywords: [
    'domestic courier India',
    'parcel delivery India',
    'courier service India',
    'send parcel within India',
    'cheapest courier India',
    'door to door delivery India',
    'same day courier India',
    'express delivery India',
    'domestic shipping India',
    'courier booking India',
    'online courier booking India',
    'parcel tracking India',
    'ecommerce courier India',
    'bulk courier India',
  ],
  openGraph: {
    title: 'Domestic Courier India — Fast Parcel Delivery | CourierX',
    description: 'Affordable domestic courier across India. Door-to-door delivery, real-time tracking, same-day pickup.',
    url: 'https://courierx.in/services/domestic-courier',
    type: 'website',
  },
  alternates: { canonical: 'https://courierx.in/services/domestic-courier' },
};

const domesticFaqs = [
  {
    question: 'How do I book a domestic courier in India?',
    answer:
      'With CourierX, enter your pickup and delivery pin codes, select package weight and dimensions, compare rates from multiple carriers, and book online. We schedule a doorstep pickup and provide real-time tracking until delivery.',
  },
  {
    question: 'How much does domestic courier cost in India?',
    answer:
      'Domestic courier rates in India start from approximately ₹50 for a 0.5 kg package. Rates vary by weight, distance, and carrier. Use our rate calculator to compare prices from multiple carriers instantly.',
  },
  {
    question: 'How long does domestic delivery take in India?',
    answer:
      'Standard domestic delivery takes 2-5 business days depending on origin and destination. Express and same-day options are available for metro cities. Tier-2 and Tier-3 cities may take 3-7 days.',
  },
  {
    question: 'Do you offer same-day pickup for domestic courier?',
    answer:
      'Yes, CourierX offers same-day pickup for domestic shipments booked before 2 PM in most metro cities including Delhi, Mumbai, Bangalore, Chennai, Hyderabad, Kolkata, and Pune.',
  },
];

export default function DomesticCourierPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://courierx.in' },
          { name: 'Services', url: 'https://courierx.in/services' },
          { name: 'Domestic Courier', url: 'https://courierx.in/services/domestic-courier' },
        ]}
      />
      <FAQJsonLd faqs={domesticFaqs} />

      <div className="min-h-screen bg-background">
        <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/" className="text-xl font-bold text-primary font-typewriter">CourierX</Link>
            <nav className="hidden md:flex gap-6 text-sm">
              <Link href="/services/medicine-courier" className="hover:text-primary">Medicine Courier</Link>
              <Link href="/services/document-courier" className="hover:text-primary">Document Courier</Link>
              <Link href="/services/gift-courier" className="hover:text-primary">Gift Courier</Link>
              <Link href="/public/rate-calculator" className="hover:text-primary">Rate Calculator</Link>
            </nav>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Domestic Courier India — Fast & Affordable Parcel Delivery
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Book domestic courier across India with doorstep pickup and real-time tracking. Compare rates from top carriers. Same-day pickup in metro cities, delivery in 1-5 business days.
          </p>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="border rounded-lg p-6">
              <h3 className="font-semibold mb-2">🚚 Door-to-Door</h3>
              <p className="text-sm text-muted-foreground">Pickup from your doorstep, delivery to the recipient's door. No need to visit a courier office.</p>
            </div>
            <div className="border rounded-lg p-6">
              <h3 className="font-semibold mb-2">📍 Real-Time Tracking</h3>
              <p className="text-sm text-muted-foreground">Track your parcel at every step with live updates via email and WhatsApp notifications.</p>
            </div>
            <div className="border rounded-lg p-6">
              <h3 className="font-semibold mb-2">💰 Best Rates</h3>
              <p className="text-sm text-muted-foreground">Compare rates from multiple carriers and choose the best price for your shipment.</p>
            </div>
          </div>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {domesticFaqs.map((faq, i) => (
                <details key={i} className="border rounded-lg p-4">
                  <summary className="font-medium cursor-pointer">{faq.question}</summary>
                  <p className="mt-3 text-sm text-muted-foreground">{faq.answer}</p>
                </details>
              ))}
            </div>
          </section>

          <div className="text-center bg-primary/5 rounded-xl p-8">
            <h2 className="text-2xl font-bold mb-3">Book Domestic Courier Now</h2>
            <p className="text-muted-foreground mb-6">Compare rates, book online, and get same-day pickup.</p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/auth" className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:opacity-90">
                Book Domestic Courier
              </Link>
              <Link href="/public/rate-calculator" className="border px-6 py-3 rounded-lg font-medium hover:bg-muted">
                Check Rates
              </Link>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
