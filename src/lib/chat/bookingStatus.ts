// Booking status management system
export interface BookingStatus {
  availableTimes: string[];
  bookedTimes: string[];
  bookedSlots: {
    [date: string]: string[]; // Date in YYYY-MM-DD format, array of time slots
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

// Get current booking status
export function getBookingStatus(): BookingStatus {
  return { ...bookingStatus };
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
export function bookDateTimeSlots(date: string, startTime: string, duration: number): boolean {
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
  
  // Initialize date if not exists
  if (!bookingStatus.bookedSlots[date]) {
    bookingStatus.bookedSlots[date] = [];
  }
  
  // Check if any required slots are already booked for this date
  const unavailableSlots = requiredSlots.filter(slot => 
    bookingStatus.bookedSlots[date].includes(slot)
  );
  
  if (unavailableSlots.length > 0) {
    return false; // Some slots are already booked for this date
  }
  
  // Book all required slots for this date
  requiredSlots.forEach(slot => {
    if (!bookingStatus.bookedSlots[date].includes(slot)) {
      bookingStatus.bookedSlots[date].push(slot);
    }
  });
  
  return true;
}

// Check if a specific date and time slot is available
export function isSlotAvailable(date: string, time: string): boolean {
  if (!bookingStatus.bookedSlots[date]) {
    return true; // Date has no bookings
  }
  return !bookingStatus.bookedSlots[date].includes(time);
}

// Get available time slots for a specific date
export function getAvailableTimeSlotsForDate(date: string): string[] {
  if (!bookingStatus.bookedSlots[date]) {
    return [...bookingStatus.availableTimes]; // All times available
  }
  return bookingStatus.availableTimes.filter(time => 
    !bookingStatus.bookedSlots[date].includes(time)
  );
}

// Release time slots for a specific date
export function releaseDateTimeSlots(date: string, startTime: string, duration: number): boolean {
  if (!bookingStatus.bookedSlots[date]) {
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
  
  // Remove slots from booked slots for this date
  requiredSlots.forEach(slot => {
    const index = bookingStatus.bookedSlots[date].indexOf(slot);
    if (index !== -1) {
      bookingStatus.bookedSlots[date].splice(index, 1);
    }
  });
  
  // Clean up empty date entries
  if (bookingStatus.bookedSlots[date].length === 0) {
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
