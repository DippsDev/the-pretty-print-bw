/**
 * Data Mapper: bel-amour ↔ Cal.com
 * Transforms data between your custom format and Cal.com's format
 */

interface BelAmourService {
  name: string;
  option?: string;
  description?: string;
  timeOptions?: string[];
  slug?: string;
}

interface BelAmourProfessional {
  id?: number;
  name: string;
  email?: string;
  calcomUserId?: number;
}

interface BelAmourBooking {
  eventTypeId: number;
  start?: string;
  service: BelAmourService;
  professional: BelAmourProfessional;
  date: string; // YYYY-MM-DD
  time: string; // "9:00 AM"
  timeZone?: string;
  durationMinutes?: number; // minutes
  customer: {
    name: string;
    email: string;
    phone?: string;
  };
  notes?: string;
  metadata?: Record<string, unknown>;
}

interface CalComBooking {
  eventTypeId: number;
  start: string; // ISO 8601 UTC
  attendee: {
    name: string;
    email?: string;
    timeZone: string;
    phoneNumber?: string;
  };
  lengthInMinutes: number;
  bookingFieldsResponses?: Record<string, string>;
  metadata?: Record<string, string>;
}

type RawSlot = {
  start?: string;
  end?: string;
  time?: string;
  attendees?: number;
  attendeesCount?: number;
};

export type CalComSlotMap = Record<string, RawSlot[]>;

function sanitizeMetadata(metadata?: Record<string, unknown>): Record<string, string> | undefined {
  if (!metadata) {
    return undefined;
  }

  return Object.entries(metadata).reduce<Record<string, string>>((acc, [key, value]) => {
    if (value === undefined || value === null) {
      return acc;
    }

    if (typeof value === 'string') {
      acc[key] = value;
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      acc[key] = String(value);
    } else {
      try {
        acc[key] = JSON.stringify(value);
      } catch {
        acc[key] = String(value);
      }
    }

    return acc;
  }, {});
}

export class CalComMapper {
  /**
   * Convert time string to 24-hour format
   * "9:00 AM" → "09:00"
   * "2:30 PM" → "14:30"
   */
  static convertTimeTo24Hour(time: string): string {
    const match = time.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return time;

    let [, hours, minutes, period] = match;
    let hour = parseInt(hours, 10);

    if (period.toUpperCase() === 'PM' && hour !== 12) {
      hour += 12;
    } else if (period.toUpperCase() === 'AM' && hour === 12) {
      hour = 0;
    }

    return `${hour.toString().padStart(2, '0')}:${minutes}`;
  }

  /**
   * Calculate end time based on start time and duration
   */
  static calculateEndTime(date: string, time: string, durationMinutes: number = 30): string {
    const time24 = this.convertTimeTo24Hour(time);
    const [hours, minutes] = time24.split(':').map(Number);

    const startDate = new Date(date);
    startDate.setHours(hours, minutes, 0, 0);

    const endDate = new Date(startDate.getTime() + durationMinutes * 60000);

    return endDate.toISOString();
  }

  /**
   * Extract duration from service (default: 30 minutes)
   */
  static extractDuration(service: BelAmourService): number {
    if (service.timeOptions && service.timeOptions.length > 0) {
      const durationMatch = service.timeOptions[0].match(/(\d+)\s*(min|hour)/i);
      if (durationMatch) {
        const value = parseInt(durationMatch[1], 10);
        const unit = durationMatch[2].toLowerCase();
        return unit === 'hour' ? value * 60 : value;
      }
    }

    return 30;
  }

  /**
   * Map bel-amour booking to Cal.com format
   */
  static toCalComBooking(booking: BelAmourBooking): CalComBooking {
    if (!booking.eventTypeId) {
      throw new Error('eventTypeId is required to create a Cal.com booking');
    }

    const duration = booking.durationMinutes ?? this.extractDuration(booking.service) ?? 30;
    const time24 = this.convertTimeTo24Hour(booking.time);
    const startIso = booking.start ?? new Date(`${booking.date}T${time24}:00`).toISOString();
    const timeZone = booking.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

    const bookingFieldsResponses =
      booking.notes && booking.notes.trim().length > 0 ? { notes: booking.notes.trim() } : undefined;

    const metadata = sanitizeMetadata({
      belAmourServiceName: booking.service.name,
      belAmourServiceSlug: booking.service.slug,
      belAmourServiceOption: booking.service.option,
      belAmourProfessionalId: booking.professional.id,
      belAmourProfessionalName: booking.professional.name,
      ...booking.metadata,
    });

    return {
      eventTypeId: booking.eventTypeId,
      start: startIso,
      attendee: {
        name: booking.customer.name,
        email: booking.customer.email,
        phoneNumber: booking.customer.phone,
        timeZone,
      },
      lengthInMinutes: duration,
      bookingFieldsResponses,
      metadata,
    };
  }

  /**
   * Transform Cal.com slots to bel-amour format
   * Cal.com response: { "2024-01-15": [{ start: "2024-01-15T09:00:00Z" }] }
   * bel-amour: { "2024-01-15": ["9:00 AM", "9:30 AM", ...] }
   */
  static transformSlots(slotMap: CalComSlotMap | null | undefined): { [date: string]: string[] } {
    const transformed: { [date: string]: string[] } = {};
    if (!slotMap) {
      return transformed;
    }

    Object.entries(slotMap).forEach(([date, slots]) => {
      transformed[date] = slots
        .filter((slot) => {
          const count =
            typeof slot.attendeesCount === 'number'
              ? slot.attendeesCount
              : typeof slot.attendees === 'number'
              ? slot.attendees
              : 0;
          return count < 1;
        })
        .map((slot) => {
          const iso = slot.start || slot.time;
          if (!iso) return '';
          const slotDate = new Date(iso);
          const hours = slotDate.getHours();
          const minutes = slotDate.getMinutes();
          const period = hours >= 12 ? 'PM' : 'AM';
          const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
          const displayMinutes = minutes.toString().padStart(2, '0');
          return `${displayHours}:${displayMinutes} ${period}`;
        })
        .filter((label) => Boolean(label));
    });

    return transformed;
  }

  /**
   * Convert Cal.com booking to bel-amour format
   */
  static fromCalComBooking(calcomBooking: any, service: BelAmourService, professional: BelAmourProfessional) {
    const startIso = calcomBooking.start ?? calcomBooking.startTime;
    const startDate = new Date(startIso);
    const date = startDate.toISOString().split('T')[0];

    const hours = startDate.getHours();
    const minutes = startDate.getMinutes();
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    const time = `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;

    const attendees = calcomBooking.attendees ?? [];

    return {
      id: calcomBooking.id,
      uid: calcomBooking.uid,
      service,
      professional,
      date,
      time,
      customer: {
        name: attendees[0]?.name || '',
        email: attendees[0]?.email || '',
        phone: calcomBooking.attendees?.[0]?.phoneNumber,
      },
      status: calcomBooking.status,
      notes: calcomBooking.bookingFieldsResponses?.notes ?? calcomBooking.notes,
    };
  }
}

export default CalComMapper;







