import ShippingPolicy from '@/views/policies/ShippingPolicy';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shipping Policy — CourierX International & Domestic Delivery Terms',
  description: 'CourierX shipping policy covering delivery timelines, packaging requirements, customs clearance, prohibited items, and shipping insurance for international and domestic courier.',
  alternates: { canonical: 'https://courierx.in/shipping-policy' },
};

export default function ShippingPolicyPage() {
  return <ShippingPolicy />;
}
