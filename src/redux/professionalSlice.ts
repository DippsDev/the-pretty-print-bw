import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ProfessionalState {
  selectedProfessional?: number;
  selectedProfessionals: { [bookingIdx: number]: number | undefined };
}

const initialState: ProfessionalState = {
  selectedProfessional: undefined,
  selectedProfessionals: {},
};

export const professionalSlice = createSlice({
  name: "professional",
  initialState,
  reducers: {
    setSelectedProfessional(state, action: PayloadAction<number | undefined>) {
      state.selectedProfessional = action.payload;
    },
    setSelectedProfessionals(
      state,
      action: PayloadAction<{ bookingIdx: number; id: number | undefined }>
    ) {
      state.selectedProfessionals[action.payload.bookingIdx] = action.payload.id;
    },
    resetProfessionals(state) {
      state.selectedProfessional = undefined;
      state.selectedProfessionals = {};
    },
  },
});

export const {
  setSelectedProfessional,
  setSelectedProfessionals,
  resetProfessionals,
} = professionalSlice.actions;

export default professionalSlice.reducer;
