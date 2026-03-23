import ProhibitedItemsPolicy from '@/views/policies/ProhibitedItemsPolicy';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Prohibited Items — What You Cannot Ship with CourierX',
  description: 'List of prohibited and restricted items for international and domestic courier from India. Check what you can and cannot ship before booking with CourierX.',
  keywords: ['prohibited items courier India', 'restricted items international shipping', 'what can I ship from India', 'courier restrictions India'],
  alternates: { canonical: 'https://courierx.in/prohibited-items' },
};

export default function ProhibitedItemsPage() {
  return <ProhibitedItemsPolicy />;
}
