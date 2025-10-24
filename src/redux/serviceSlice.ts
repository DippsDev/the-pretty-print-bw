import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface Booking {
  name: string;
  option: string;
  time: string;
  price: string;
}

interface ServiceState {
  bookings: Booking[];
}

const initialState: ServiceState = {
  bookings: [],
};

export const serviceSlice = createSlice({
  name: "service",
  initialState,
  reducers: {
    addBooking(state, action: PayloadAction<Booking>) {
      state.bookings.push(action.payload);
    },
    removeBooking(state, action: PayloadAction<number>) {
      state.bookings.splice(action.payload, 1);
    },
    resetBookings(state) {
      state.bookings = [];
    },
  },
});

export const { addBooking, removeBooking, resetBookings } = serviceSlice.actions;
export default serviceSlice.reducer;
