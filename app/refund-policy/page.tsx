import RefundPolicy from '@/views/policies/RefundPolicy';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Refund Policy — CourierX Shipping Refund & Cancellation',
  description: 'CourierX refund policy for international and domestic courier bookings. Learn about cancellation, refund eligibility, timelines, and wallet credit process.',
  alternates: { canonical: 'https://courierx.in/refund-policy' },
};

export default function RefundPolicyPage() {
  return <RefundPolicy />;
}
