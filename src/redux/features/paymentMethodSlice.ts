import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type PaymentMethodType = "card" | "venue";

interface PaymentMethodState {
  selected: PaymentMethodType | null;
}

const initialState: PaymentMethodState = {
  selected: null,
};

export const paymentMethodSlice = createSlice({
  name: "paymentMethod",
  initialState,
  reducers: {
    setPaymentMethod(state, action: PayloadAction<PaymentMethodType>) {
      state.selected = action.payload;
    },
    resetPaymentMethod(state) {
      state.selected = null;
    },
  },
});

export const { setPaymentMethod, resetPaymentMethod } = paymentMethodSlice.actions;
export default paymentMethodSlice.reducer;
