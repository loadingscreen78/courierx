import TermsAndConditions from '@/views/policies/TermsAndConditions';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms & Conditions — CourierX Shipping Terms of Service',
  description: 'Read CourierX terms and conditions for international and domestic courier services. Understand shipping terms, liability, refund eligibility, and user responsibilities.',
  alternates: { canonical: 'https://courierx.in/terms' },
};

export default function TermsPage() {
  return <TermsAndConditions />;
}
