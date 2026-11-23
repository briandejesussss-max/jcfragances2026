import type { Metadata } from 'next';
import { TrackOrder } from '@/views/store/tracking/TrackOrder';

export const metadata: Metadata = { title: 'Rastrear pedido', robots: { index: false } };

export default function TrackingPage() {
  return <TrackOrder />;
}
