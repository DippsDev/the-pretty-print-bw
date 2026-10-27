import { NextRequest } from 'next/server';
import { getBookingStatus } from '@/lib/chat/bookingStatus';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Real-time booking status updates endpoint
export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();
  let interval: ReturnType<typeof setInterval> | undefined;

  const stream = new ReadableStream({
    start(controller) {
      const send = () => {
        try {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: 'booking-update', data: getBookingStatus() })}\n\n`
            )
          );
        } catch {
          // Client already disconnected; enqueue throws once the controller is closed.
          if (interval) clearInterval(interval);
        }
      };

      send();
      interval = setInterval(send, 5000);

      request.signal.addEventListener('abort', () => {
        if (interval) clearInterval(interval);
      });
    },
    cancel() {
      if (interval) clearInterval(interval);
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
    const { bookServiceTimeSlots, bookDateTimeSlots } = await import('@/lib/chat/bookingStatus');
    
    let success: boolean;
    
    if (date) {
      // Book for specific date
      success = bookDateTimeSlots(date, time, duration || 30, professional);
    } else {
      // Book general time slot (legacy)
      success = bookServiceTimeSlots(time, duration || 30);
    }
    
    if (!success) {
      return Response.json({ error: 'Time slot not available' }, { status: 409 });
    }

    // Set professional as unavailable if specified
    const updatedStatus = getBookingStatus();

    return Response.json({ 
      success: true, 
      status: updatedStatus,
      message: date ? 
        `Time slot ${time} on ${date} booked successfully` : 
        'Time slot booked successfully' 
    });
  } catch (error) {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { time, duration, professional, date } = await request.json();

    if (!time) {
      return Response.json({ error: 'Time is required' }, { status: 400 });
    }

    const { releaseTimeSlot, releaseDateTimeSlots } = await import('@/lib/chat/bookingStatus');

    let success: boolean;

    if (date) {
      success = releaseDateTimeSlots(date, time, duration || 30, professional);
    } else {
      success = releaseTimeSlot(time);
    }

    if (!success) {
      return Response.json({ error: 'Time slot could not be released' }, { status: 404 });
    }

    const updatedStatus = getBookingStatus();

    return Response.json({
      success: true,
      status: updatedStatus,
      message: date ?
        `Time slot ${time} on ${date} released successfully` :
        'Time slot released successfully'
    });
  } catch (error) {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
