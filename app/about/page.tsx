import About from '@/views/About';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us | CourierX - International Shipping from India',
  description: 'Learn about CourierX, India\'s trusted international courier aggregator. Our mission, vision, and commitment to fast, compliant, and secure shipping worldwide.',
  keywords: ['about courierx', 'international shipping india', 'courier company', 'shipping services'],
  openGraph: {
    title: 'About CourierX - International Shipping from India',
    description: 'Learn about CourierX, India\'s trusted international courier aggregator.',
    type: 'website',
  },
};

export default function AboutPage() {
  return <About />;
}
