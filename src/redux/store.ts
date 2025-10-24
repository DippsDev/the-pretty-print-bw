import { configureStore } from '@reduxjs/toolkit';
import navigationReducer from './features/navigationSlice';
import professionalReducer from './professionalSlice';
import serviceReducer from './serviceSlice';
import paymentMethodReducer from './features/paymentMethodSlice';

export const store = configureStore({
  reducer: {
    navigation: navigationReducer,
    professional: professionalReducer,
    service: serviceReducer,
    paymentMethod: paymentMethodReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
