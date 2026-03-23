import DataRetentionPolicy from '@/views/policies/DataRetentionPolicy';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Data Retention Policy — CourierX Data Storage & Deletion',
  description: 'CourierX data retention policy. Learn how long we store your personal data, shipment records, and payment information, and how to request data deletion.',
  alternates: { canonical: 'https://courierx.in/data-retention-policy' },
};

export default function DataRetentionPolicyPage() {
  return <DataRetentionPolicy />;
}
