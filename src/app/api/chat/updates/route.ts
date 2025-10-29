import { NextRequest } from 'next/server';
import { getBookingStatus } from '@/lib/chat/bookingStatus';

// Real-time booking status updates endpoint
export async function GET(request: NextRequest) {
  const stream = new ReadableStream({
    start(controller) {
      // Send initial booking status
      const initialStatus = getBookingStatus();
      controller.enqueue(
        new TextEncoder().encode(
          `data: ${JSON.stringify({ type: 'booking-update', data: initialStatus })}\n\n`
        )
      );

      // Set up periodic updates (every 5 seconds)
      const interval = setInterval(() => {
        const currentStatus = getBookingStatus();
        controller.enqueue(
          new TextEncoder().encode(
            `data: ${JSON.stringify({ type: 'booking-update', data: currentStatus })}\n\n`
          )
        );
      }, 5000);

      // Clean up on client disconnect
      const cleanup = () => {
        clearInterval(interval);
      };

      // Handle client disconnect
      request.signal.addEventListener('abort', cleanup);
      
      return cleanup;
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

// Endpoint to book time slots (called when user confirms booking)
export async function POST(request: NextRequest) {
  try {
    const { time, duration, professional, date } = await request.json();
    
    if (!time) {
      return Response.json({ error: 'Time is required' }, { status: 400 });
    }

    // Import booking functions
    const { bookServiceTimeSlots, bookDateTimeSlots, setProfessionalAvailability } = await import('@/lib/chat/bookingStatus');
    
    let success: boolean;
    
    if (date) {
      // Book for specific date
      success = bookDateTimeSlots(date, time, duration || 30);
    } else {
      // Book general time slot (legacy)
      success = bookServiceTimeSlots(time, duration || 30);
    }
    
    if (!success) {
      return Response.json({ error: 'Time slot not available' }, { status: 409 });
    }

    // Set professional as unavailable if specified
    if (professional) {
      setProfessionalAvailability(professional, false);
    }

    return Response.json({ 
      success: true, 
      message: date ? 
        `Time slot ${time} on ${date} booked successfully` : 
        'Time slot booked successfully' 
    });
  } catch (error) {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
