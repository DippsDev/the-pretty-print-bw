import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { updateBookingStatus } from '@/redux/features/bookingStatusSlice';

// Hook for real-time booking status updates
export function useBookingUpdates() {
  const dispatch = useDispatch();

  useEffect(() => {
    // Connect to real-time updates. EventSource reconnects on its own when
    // the stream drops (navigation, Fast Refresh). Its error event is an
    // empty Event, and logging it opens the Next.js error overlay.
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

    return () => {
      eventSource.close();
    };
  }, [dispatch]);
}

// Hook for booking time slots
interface BookingActionPayload {
  date: string;
  time: string;
  duration?: number;
  professional?: string;
}

export function useBookingActions() {
  const dispatch = useDispatch();

  const bookSlot = async ({ date, time, duration = 30, professional }: BookingActionPayload) => {
    try {
      const response = await fetch('/api/chat/updates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, time, duration, professional }),
      });

      const result = await response.json();

      if (!response.ok || !result?.success) {
        throw new Error(result?.error || 'Failed to book time slot');
      }

      if (result.status) {
        dispatch(updateBookingStatus(result.status));
      }

      return result;
    } catch (error) {
      console.error('Booking error:', error);
      throw error;
    }
  };

  const cancelSlot = async ({ date, time, duration = 30, professional }: BookingActionPayload) => {
    try {
      const response = await fetch('/api/chat/updates', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, time, duration, professional }),
      });

      const result = await response.json();

      if (!response.ok || !result?.success) {
        throw new Error(result?.error || 'Failed to cancel time slot');
      }

      if (result.status) {
        dispatch(updateBookingStatus(result.status));
      }

      return result;
    } catch (error) {
      console.error('Cancel booking error:', error);
      throw error;
    }
  };

  return { bookSlot, cancelSlot };
}
