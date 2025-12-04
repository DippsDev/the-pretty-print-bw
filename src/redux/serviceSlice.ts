import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface BookingMetadata {
  serviceSlug?: string;
  durationMinutes?: number;
}

export interface Booking {
  name: string;
  option: string;
  time: string;
  price: string;
  metadata?: BookingMetadata;
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
  extraReducers: (builder) => {
    builder.addCase('ADD_PACKAGE_SERVICE', (state, action: any) => {
      const { group, pkg } = action.payload || {};
      if (!group || !pkg) return;
      // Find the price for the selected package
      const priceObj = (group.prices || []).find((p: any) => p.label === pkg);
      const price = priceObj ? priceObj.value : '';
      // Add a booking for the package group
      state.bookings.push({
        name: group.label,
        option: pkg,
        time: '',
        price,
        metadata: {
          serviceSlug: priceObj?.slug,
        },
      });
    });
  },
});

export const { addBooking, removeBooking, resetBookings } = serviceSlice.actions;
export default serviceSlice.reducer;
