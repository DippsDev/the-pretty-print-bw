import { NextRequest, NextResponse } from 'next/server';
import { calcomClient } from '@/lib/calcom/client';
import { CalComMapper } from '@/lib/calcom/mapper';

/**
 * GET /api/calcom/slots
 * Fetch available time slots from Cal.com
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const eventTypeId = searchParams.get('eventTypeId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const timeZone = searchParams.get('timeZone');

    // Validate required parameters
    if (!eventTypeId || !dateFrom || !dateTo) {
      return NextResponse.json(
        { 
          error: 'Missing required parameters',
          required: ['eventTypeId', 'dateFrom', 'dateTo']
        },
        { status: 400 }
      );
    }

    // Fetch slots from Cal.com
    const calcomSlots = await calcomClient.getAvailableSlots({
      eventTypeId: parseInt(eventTypeId),
      startTime: dateFrom,
      endTime: dateTo,
      timeZone: timeZone || undefined,
    });

    // Transform Cal.com slots to bel-amour format
    const transformedSlots = CalComMapper.transformSlots(calcomSlots);

    return NextResponse.json({ 
      success: true,
      slots: transformedSlots,
      eventTypeId: parseInt(eventTypeId),
      dateRange: { from: dateFrom, to: dateTo }
    });
    
  } catch (error) {
    console.error('Error fetching slots from Cal.com:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch available slots',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}














