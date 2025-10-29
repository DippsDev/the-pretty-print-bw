import { createSlice, PayloadAction } from '@reduxjs/toolkit';

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

interface BookingStatusState {
  status: BookingStatus | null;
  lastUpdated: number | null;
}

const initialState: BookingStatusState = {
  status: null,
  lastUpdated: null,
};

export const bookingStatusSlice = createSlice({
  name: 'bookingStatus',
  initialState,
  reducers: {
    updateBookingStatus: (state, action: PayloadAction<BookingStatus>) => {
      state.status = action.payload;
      state.lastUpdated = Date.now();
    },
    clearBookingStatus: (state) => {
      state.status = null;
      state.lastUpdated = null;
    },
  },
});

export const { updateBookingStatus, clearBookingStatus } = bookingStatusSlice.actions;
export default bookingStatusSlice.reducer;
