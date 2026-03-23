import PrivacyPolicy from '@/views/policies/PrivacyPolicy';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — How CourierX Protects Your Data',
  description: 'Read CourierX privacy policy. Learn how we collect, use, and protect your personal information when using our international and domestic courier services from India.',
  alternates: { canonical: 'https://courierx.in/privacy-policy' },
};

export default function PrivacyPolicyPage() {
  return <PrivacyPolicy />;
}
