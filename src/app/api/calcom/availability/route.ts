import { NextRequest, NextResponse } from 'next/server';
import { calcomClient } from '@/lib/calcom/client';
import { CalComMapper } from '@/lib/calcom/mapper';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventTypeIdParam = searchParams.get('eventTypeId');
    const start = searchParams.get('start');
    const end = searchParams.get('end');
    const timeZone = searchParams.get('timeZone') || undefined;

    if (!eventTypeIdParam || !start || !end) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameters: eventTypeId, start, end',
        },
        { status: 400 }
      );
    }

    const eventTypeId = Number(eventTypeIdParam);
    if (Number.isNaN(eventTypeId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'eventTypeId must be a valid number',
        },
        { status: 400 }
      );
    }

    const slots = await calcomClient.getAvailableSlots({
      eventTypeId,
      startTime: start,
      endTime: end,
      timeZone,
    });

    const transformed = CalComMapper.transformSlots(slots);

    return NextResponse.json({
      success: true,
      slots: transformed,
    });
  } catch (error) {
    console.error('Error fetching Cal.com availability:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch availability',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}





