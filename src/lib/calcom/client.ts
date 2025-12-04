
/**
 * Cal.com API Client
 * Handles communication with your deployed Cal.com instance
 */

const CALCOM_API_URL = process.env.NEXT_PUBLIC_CALCOM_API_URL || 'http://localhost:5555';
const CAL_API_VERSION_HEADER = 'cal-api-version';
const SLOTS_API_VERSION = '2024-09-04';
const BOOKINGS_API_VERSION = '2024-08-13';

export interface CalComSlot {
  start?: string;
  end?: string;
  time?: string;
  attendees?: number;
  attendeesCount?: number;
}

export type CalComSlotsResponse = Record<string, CalComSlot[]>;

interface CalComBookingRequest {
  eventTypeId: number;
  start: string;
  lengthInMinutes: number;
  attendee: {
    name: string;
    email?: string;
    timeZone: string;
    phoneNumber?: string;
  };
  bookingFieldsResponses?: Record<string, string>;
  metadata?: Record<string, string>;
}

interface CalComBookingResponse {
  id: number;
  uid: string;
  title?: string | null;
  status: string;
  start?: string;
  end?: string;
  attendees?: Array<{
    email?: string;
    name?: string;
  }>;
  [key: string]: unknown;
}

type JsonRecord = Record<string, unknown>;

function buildHeaders(version: string) {
  return {
    'Content-Type': 'application/json',
    [CAL_API_VERSION_HEADER]: version,
  };
}

function extractErrorMessage(payload: JsonRecord | null, fallback: string) {
  if (!payload) return fallback;
  if (typeof payload.message === 'string' && payload.message.trim().length > 0) {
    return payload.message;
  }
  if (typeof payload.error === 'string' && payload.error.trim().length > 0) {
    return payload.error;
  }
  return fallback;
}

/**
 * Fetch available time slots from Cal.com (API v2)
 */
export async function getAvailableSlots(params: {
  eventTypeId: number;
  startTime: string;
  endTime: string;
  timeZone?: string;
}): Promise<CalComSlotsResponse> {
  try {
    const timeZone = params.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    const url = new URL(`${CALCOM_API_URL}/v2/slots`);
    url.searchParams.set('eventTypeId', String(params.eventTypeId));
    url.searchParams.set('start', params.startTime);
    url.searchParams.set('end', params.endTime);
    if (timeZone) {
      url.searchParams.set('timeZone', timeZone);
    }

    const response = await fetch(url.toString(), {
      headers: buildHeaders(SLOTS_API_VERSION),
    });

    const payload = (await response.json().catch(() => null)) as JsonRecord | null;

    if (!response.ok) {
      throw new Error(extractErrorMessage(payload, 'Failed to fetch slots'));
    }

    const data = (payload?.data as CalComSlotsResponse | undefined) ?? {};
    return data;
  } catch (error) {
    console.error('Error fetching available slots:', error);
    throw error;
  }
}

/**
 * Create a booking in Cal.com (API v2)
 */
export async function createBooking(booking: CalComBookingRequest): Promise<CalComBookingResponse> {
  try {
    const response = await fetch(`${CALCOM_API_URL}/v2/bookings`, {
      method: 'POST',
      headers: buildHeaders(BOOKINGS_API_VERSION),
      body: JSON.stringify(booking),
    });

    const payload = (await response.json().catch(() => null)) as JsonRecord | null;

    if (!response.ok || payload?.status !== 'success') {
      throw new Error(extractErrorMessage(payload, 'Failed to create booking'));
    }

    return (payload?.data as CalComBookingResponse) ?? ({} as CalComBookingResponse);
  } catch (error) {
    console.error('Error creating booking:', error);
    throw error;
  }
}

/**
 * Cancel a booking in Cal.com (API v2)
 */
export async function cancelBooking(params: { uid: string; reason?: string }) {
  const { uid, reason } = params;
  try {
    const response = await fetch(`${CALCOM_API_URL}/v2/bookings/${encodeURIComponent(uid)}/cancel`, {
      method: 'POST',
      headers: buildHeaders(BOOKINGS_API_VERSION),
      body: JSON.stringify(
        reason?.trim()
          ? {
              cancellationReason: reason.trim(),
            }
          : {}
      ),
    });

    const payload = (await response.json().catch(() => null)) as JsonRecord | null;

    if (!response.ok || payload?.status !== 'success') {
      throw new Error(extractErrorMessage(payload, 'Failed to cancel booking'));
    }

    return payload?.data ?? {};
  } catch (error) {
    console.error('Error cancelling booking:', error);
    throw error;
  }
}

/**
 * Get booking details (API v2)
 */
export async function getBooking(uid: string) {
  try {
    const response = await fetch(`${CALCOM_API_URL}/v2/bookings/${encodeURIComponent(uid)}`, {
      headers: buildHeaders(BOOKINGS_API_VERSION),
    });

    const payload = (await response.json().catch(() => null)) as JsonRecord | null;

    if (!response.ok || payload?.status !== 'success') {
      throw new Error(extractErrorMessage(payload, 'Failed to fetch booking'));
    }

    return payload?.data;
  } catch (error) {
    console.error('Error fetching booking:', error);
    throw error;
  }
}

export const calcomClient = {
  getAvailableSlots,
  createBooking,
  cancelBooking,
  getBooking,
};