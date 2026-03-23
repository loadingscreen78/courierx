import PublicRateCalculator from '@/views/PublicRateCalculator';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shipping Rate Calculator — Compare International Courier Rates from India',
  description: 'Calculate and compare international shipping rates from India instantly. Get quotes from DHL, FedEx, Aramex for medicines, documents & gifts to 150+ countries. Find the cheapest courier.',
  keywords: ['shipping rate calculator', 'international courier rates India', 'compare shipping rates', 'DHL rates India', 'FedEx rates India', 'Aramex rates India', 'cheapest international courier India', 'courier cost calculator'],
  alternates: { canonical: 'https://courierx.in/public/rate-calculator' },
};

export default function PublicRateCalculatorPage() {
  return <PublicRateCalculator />;
}
