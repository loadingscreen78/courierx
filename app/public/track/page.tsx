import PublicTracking from '@/views/PublicTracking';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Track Shipment - Real-time Package Tracking',
  description: 'Track your international shipment in real-time. Enter your tracking number to get live updates on your package location and delivery status.',
  keywords: ['track shipment', 'package tracking', 'courier tracking', 'shipment status'],
};

export default function PublicTrackPage() {
  return <PublicTracking />;
}
