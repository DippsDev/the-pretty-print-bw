// Booking status management system
export interface BookingStatus {
  availableTimes: string[];
  bookedTimes: string[];
  bookedSlots: {
    [date: string]: {
      all: string[];
      byProfessional: {
        [professional: string]: string[];
      };
    };
  };
  professionals: {
    name: string;
    available: boolean;
  }[];
}

// In-memory storage for demo (use database in production)
let bookingStatus: BookingStatus = {
  availableTimes: [
    "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
    "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM",
    "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM", "5:00 PM"
  ],
  bookedTimes: [],
  bookedSlots: {},
  professionals: [
    { name: 'Banele', available: true },
    { name: 'Dineo', available: true },
    { name: 'Michelle', available: true }
  ]
};

function normalizeProfessional(professional?: string): string {
  if (!professional) return 'any';
  const trimmed = professional.trim().toLowerCase();
  if (!trimmed || trimmed === 'any professional' || trimmed === 'any') {
    return 'any';
  }
  return trimmed;
}

function ensureDateEntry(date: string) {
  if (!bookingStatus.bookedSlots[date]) {
    bookingStatus.bookedSlots[date] = {
      all: [],
      byProfessional: {},
    };
  }
  return bookingStatus.bookedSlots[date];
}

// Get current booking status
export function getBookingStatus(): BookingStatus {
  return JSON.parse(JSON.stringify(bookingStatus)) as BookingStatus;
}

// Book a time slot
export function bookTimeSlot(time: string): boolean {
  if (bookingStatus.bookedTimes.includes(time)) {
    return false; // Already booked
  }
  bookingStatus.bookedTimes.push(time);
  return true;
}

// Release a time slot
export function releaseTimeSlot(time: string): boolean {
  const index = bookingStatus.bookedTimes.indexOf(time);
  if (index === -1) {
    return false; // Not booked
  }
  bookingStatus.bookedTimes.splice(index, 1);
  return true;
}

// Set professional availability
export function setProfessionalAvailability(name: string, available: boolean): boolean {
  const prof = bookingStatus.professionals.find(p => p.name.toLowerCase() === name.toLowerCase());
  if (!prof) {
    return false;
  }
  prof.available = available;
  return true;
}

// Book multiple time slots for a service duration
export function bookServiceTimeSlots(startTime: string, duration: number): boolean {
  const timeSlots = bookingStatus.availableTimes;
  const startIndex = timeSlots.indexOf(startTime);
  
  if (startIndex === -1) {
    return false; // Invalid start time
  }
  
  // Calculate how many 30-minute slots we need
  const slotsNeeded = Math.ceil(duration / 30);
  const endIndex = startIndex + slotsNeeded;
  
  if (endIndex > timeSlots.length) {
    return false; // Not enough time slots available
  }
  
  // Check if all required slots are available
  const requiredSlots = timeSlots.slice(startIndex, endIndex);
  const unavailableSlots = requiredSlots.filter(slot => bookingStatus.bookedTimes.includes(slot));
  
  if (unavailableSlots.length > 0) {
    return false; // Some slots are already booked
  }
  
  // Book all required slots
  requiredSlots.forEach(slot => {
    if (!bookingStatus.bookedTimes.includes(slot)) {
      bookingStatus.bookedTimes.push(slot);
    }
  });
  
  return true;
}

// Book time slots for a specific date
export function bookDateTimeSlots(date: string, startTime: string, duration: number, professional?: string): boolean {
  const timeSlots = bookingStatus.availableTimes;
  const startIndex = timeSlots.indexOf(startTime);
  
  if (startIndex === -1) {
    return false; // Invalid start time
  }
  
  // Calculate how many 30-minute slots we need
  const slotsNeeded = Math.ceil(duration / 30);
  const endIndex = startIndex + slotsNeeded;
  
  if (endIndex > timeSlots.length) {
    return false; // Not enough time slots available
  }
  
  // Get required slots
  const requiredSlots = timeSlots.slice(startIndex, endIndex);

  const professionalKey = normalizeProfessional(professional);
  const entry = ensureDateEntry(date);

  const isSlotTaken = requiredSlots.some(slot => {
    if (entry.all.includes(slot)) {
      return true;
    }
    if (professionalKey !== 'any') {
      const bucket = entry.byProfessional[professionalKey];
      if (bucket && bucket.includes(slot)) {
        return true;
      }
    }
    return false;
  });

  if (isSlotTaken) {
    return false;
  }

  if (professionalKey === 'any') {
    requiredSlots.forEach(slot => {
      if (!entry.all.includes(slot)) {
        entry.all.push(slot);
      }
    });
  } else {
    if (!entry.byProfessional[professionalKey]) {
      entry.byProfessional[professionalKey] = [];
    }
    const bucket = entry.byProfessional[professionalKey];
    requiredSlots.forEach(slot => {
      if (!bucket.includes(slot)) {
        bucket.push(slot);
      }
    });
  }

  return true;
}

// Check if a specific date and time slot is available
export function isSlotAvailable(date: string, time: string, professional?: string): boolean {
  const entry = bookingStatus.bookedSlots[date];
  if (!entry) {
    return true; // Date has no bookings
  }

  if (entry.all.includes(time)) {
    return false;
  }

  const professionalKey = normalizeProfessional(professional);
  if (professionalKey === 'any') {
    return true;
  }

  const bucket = entry.byProfessional[professionalKey];
  return !(bucket && bucket.includes(time));
}

// Get available time slots for a specific date
export function getAvailableTimeSlotsForDate(date: string, professional?: string): string[] {
  const entry = bookingStatus.bookedSlots[date];
  if (!entry) {
    return [...bookingStatus.availableTimes]; // All times available
  }

  const blocked = new Set(entry.all);
  const professionalKey = normalizeProfessional(professional);
  if (professionalKey !== 'any') {
    const bucket = entry.byProfessional[professionalKey];
    if (bucket) {
      bucket.forEach(slot => blocked.add(slot));
    }
  }

  return bookingStatus.availableTimes.filter(time => !blocked.has(time));
}

// Release time slots for a specific date
export function releaseDateTimeSlots(date: string, startTime: string, duration: number, professional?: string): boolean {
  const entry = bookingStatus.bookedSlots[date];
  if (!entry) {
    return false; // No bookings for this date
  }
  
  const timeSlots = bookingStatus.availableTimes;
  const startIndex = timeSlots.indexOf(startTime);
  
  if (startIndex === -1) {
    return false; // Invalid start time
  }
  
  const slotsNeeded = Math.ceil(duration / 30);
  const endIndex = startIndex + slotsNeeded;
  const requiredSlots = timeSlots.slice(startIndex, endIndex);
  
  const professionalKey = normalizeProfessional(professional);

  const removeFromArray = (arr: string[]) => {
    requiredSlots.forEach(slot => {
      const idx = arr.indexOf(slot);
      if (idx !== -1) {
        arr.splice(idx, 1);
      }
    });
  };

  if (professionalKey === 'any') {
    removeFromArray(entry.all);
  } else if (entry.byProfessional[professionalKey]) {
    removeFromArray(entry.byProfessional[professionalKey]);
    if (entry.byProfessional[professionalKey].length === 0) {
      delete entry.byProfessional[professionalKey];
    }
  }

  if (entry.all.length === 0 && Object.keys(entry.byProfessional).length === 0) {
    delete bookingStatus.bookedSlots[date];
  }

  return true;
}

// Get available time slots
export function getAvailableTimeSlots(): string[] {
  return bookingStatus.availableTimes.filter(time => !bookingStatus.bookedTimes.includes(time));
}

// Reset booking status (for testing)
export function resetBookingStatus(): void {
  bookingStatus = {
    availableTimes: [
      "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
      "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM",
      "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM", "5:00 PM"
    ],
    bookedTimes: [],
    bookedSlots: {},
    professionals: [
      { name: 'Banele', available: true },
      { name: 'Dineo', available: true },
      { name: 'Michelle', available: true }
    ]
  };
}
