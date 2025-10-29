import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { updateBookingStatus } from '@/redux/features/bookingStatusSlice';

// Hook for real-time booking status updates
export function useBookingUpdates() {
  const dispatch = useDispatch();

  useEffect(() => {
    // Connect to real-time updates
    const eventSource = new EventSource('/api/chat/updates');
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'booking-update') {
          dispatch(updateBookingStatus(data.data));
        }
      } catch (error) {
        console.error('Failed to parse booking update:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('Booking updates connection error:', error);
    };

    // Cleanup on unmount
    return () => {
      eventSource.close();
    };
  }, [dispatch]);
}

// Hook for booking time slots
export function useBookingActions() {
  const bookTimeSlot = async (time: string, duration: number, professional?: string) => {
    try {
      const response = await fetch('/api/chat/updates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ time, duration, professional }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to book time slot');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Booking error:', error);
      throw error;
    }
  };

  return { bookTimeSlot };
}
