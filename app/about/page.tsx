import About from '@/views/About';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us — CourierX India\'s Trusted International Courier Aggregator',
  description: 'Learn about CourierX, India\'s trusted international courier aggregator. Ship medicines, documents & gifts to 150+ countries via DHL, FedEx, Aramex. Our mission, team, and commitment to fast, compliant shipping.',
  keywords: ['about courierx', 'international courier company India', 'courier aggregator India', 'shipping company India', 'who is courierx'],
  openGraph: {
    title: 'About CourierX — India\'s International Courier Aggregator',
    description: 'India\'s trusted courier aggregator for medicines, documents & gifts. Ship to 150+ countries.',
    url: 'https://courierx.in/about',
    type: 'website',
  },
  alternates: { canonical: 'https://courierx.in/about' },
};

export default function AboutPage() {
  return <About />;
}
