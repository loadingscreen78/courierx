import ChargebackPolicy from '@/views/policies/ChargebackPolicy';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Chargeback Policy — CourierX Payment Dispute Resolution',
  description: 'CourierX chargeback policy for payment disputes. Understand the dispute resolution process, timelines, and how chargebacks are handled for courier bookings.',
  alternates: { canonical: 'https://courierx.in/chargeback-policy' },
};

export default function ChargebackPolicyPage() {
  return <ChargebackPolicy />;
}
