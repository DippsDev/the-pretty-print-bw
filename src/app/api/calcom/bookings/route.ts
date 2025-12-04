import { NextRequest, NextResponse } from 'next/server';
import { calcomClient } from '@/lib/calcom/client';
import { CalComMapper } from '@/lib/calcom/mapper';

/**
 * POST /api/calcom/bookings
 * Create a booking in Cal.com
 */
export async function POST(request: NextRequest) {
  try {
    const belAmourBooking = await request.json();

    if (!belAmourBooking.eventTypeId) {
      return NextResponse.json(
        { 
          success: false,
          error: 'eventTypeId is required. Please supply a valid Cal.com event type id.'
        },
        { status: 400 }
      );
    }

    if (!belAmourBooking.date || !belAmourBooking.time) {
      return NextResponse.json(
        {
          success: false,
          error: 'Both date and time are required to create a booking.',
        },
        { status: 400 }
      );
    }

    if (!belAmourBooking.customer?.email || !belAmourBooking.customer?.name) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Customer name and email are required'
        },
        { status: 400 }
      );
    }

    // Map bel-amour booking to Cal.com format
    const calcomBooking = CalComMapper.toCalComBooking(belAmourBooking);

    // Create booking in Cal.com
    const result = await calcomClient.createBooking(calcomBooking);
    const bookingData = Array.isArray(result) ? result[0] : result;
    const normalizedBooking = bookingData
      ? {
          id: bookingData.id,
          uid: bookingData.uid,
          title: bookingData.title ?? null,
          status: bookingData.status,
          start: bookingData.start ?? bookingData.startTime ?? null,
          end: bookingData.end ?? bookingData.endTime ?? null,
          attendees: bookingData.attendees ?? [],
        }
      : null;

    // Return success response with booking details
    return NextResponse.json({
      success: true,
      booking: normalizedBooking,
      message: 'Booking created successfully'
    });
    
  } catch (error) {
    console.error('Error creating booking in Cal.com:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to create booking',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/calcom/bookings?uid=xxx
 * Get a booking from Cal.com
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');

    if (!uid) {
      return NextResponse.json(
        { error: 'Booking UID is required' },
        { status: 400 }
      );
    }

    const booking = await calcomClient.getBooking(uid);

    return NextResponse.json({
      success: true,
      booking
    });
    
  } catch (error) {
    console.error('Error fetching booking from Cal.com:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch booking',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/calcom/bookings
 * Cancel a booking in Cal.com
 */
export async function DELETE(request: NextRequest) {
  try {
    const { uid, reason } = await request.json();

    if (!uid) {
      return NextResponse.json(
        { error: 'Booking UID is required' },
        { status: 400 }
      );
    }

    await calcomClient.cancelBooking({ uid, reason });

    return NextResponse.json({
      success: true,
      message: 'Booking cancelled successfully'
    });
    
  } catch (error) {
    console.error('Error cancelling booking in Cal.com:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to cancel booking',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}







