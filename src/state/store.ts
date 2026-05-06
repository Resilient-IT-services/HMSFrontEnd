import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import pharmacyReducer from './pharmacySlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    pharmacy: pharmacyReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
