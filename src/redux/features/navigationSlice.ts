import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface NavigationState {
  currentPage: string;
  navbarOpen: boolean;
  servicesPanelOpen: boolean;
  selectedService?: string;
  selectedPackage?: string;
  selectedTime?: string;
  currentSection?: string;
  currentStep?: string;
}

const initialState: NavigationState = {
  currentPage: 'home',
  navbarOpen: false,
  servicesPanelOpen: false,
  selectedService: undefined,
  selectedPackage: undefined,
  selectedTime: undefined,
  currentSection: undefined,
  currentStep: undefined,
};

export const navigationSlice = createSlice({
  name: 'navigation',
  initialState,
  reducers: {
    setCurrentPage: (state, action: PayloadAction<string>) => {
      state.currentPage = action.payload;
    },
    setNavbarOpen: (state, action: PayloadAction<boolean>) => {
      state.navbarOpen = action.payload;
    },
    toggleNavbar: (state) => {
      state.navbarOpen = !state.navbarOpen;
    },
    setServicesPanelOpen: (state, action: PayloadAction<boolean>) => {
      state.servicesPanelOpen = action.payload;
    },
    setServiceSelection: (
      state,
      action: PayloadAction<{ service: string; pkg: string; time: string }>
    ) => {
      state.selectedService = action.payload.service;
      state.selectedPackage = action.payload.pkg;
      state.selectedTime = action.payload.time;
    },
    clearServiceSelection: (state) => {
      state.selectedService = undefined;
      state.selectedPackage = undefined;
      state.selectedTime = undefined;
    },
    setCurrentSection: (state, action: PayloadAction<string | undefined>) => {
      state.currentSection = action.payload;
    },
    setStep: (state, action: PayloadAction<string | undefined>) => {
      state.currentStep = action.payload;
    },
  },
});

export const {
  setCurrentPage,
  setNavbarOpen,
  toggleNavbar,
  setServicesPanelOpen,
  setServiceSelection,
  clearServiceSelection,
  setCurrentSection,
  setStep,
} = navigationSlice.actions;
export default navigationSlice.reducer;
