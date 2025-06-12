import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface NavigationState {
  currentPage: string;
  navbarOpen: boolean;
}

const initialState: NavigationState = {
  currentPage: 'home',
  navbarOpen: false,
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
  },
});

export const { setCurrentPage, setNavbarOpen, toggleNavbar } = navigationSlice.actions;
export default navigationSlice.reducer;
