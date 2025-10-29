'use client';

import { useBookingUpdates } from '@/hooks/useBookingUpdates';

// Component that provides real-time booking updates to the entire app
export default function BookingUpdatesProvider() {
  useBookingUpdates();
  return null; // This component doesn't render anything
}
