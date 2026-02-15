import PublicRateCalculator from '@/views/PublicRateCalculator';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Rate Calculator - Compare International Shipping Rates',
  description: 'Calculate and compare international shipping rates from India. Get instant quotes from DHL, FedEx, Aramex, and more carriers.',
  keywords: ['shipping calculator', 'rate calculator', 'international shipping rates', 'courier rates'],
};

export default function PublicRateCalculatorPage() {
  return <PublicRateCalculator />;
}
