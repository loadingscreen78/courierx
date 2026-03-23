import KycPolicy from '@/views/policies/KycPolicy';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'KYC Policy — CourierX Identity Verification for Shipping',
  description: 'CourierX KYC (Know Your Customer) policy. Understand identity verification requirements for booking international courier shipments from India.',
  alternates: { canonical: 'https://courierx.in/kyc-policy' },
};

export default function KycPolicyPage() {
  return <KycPolicy />;
}
