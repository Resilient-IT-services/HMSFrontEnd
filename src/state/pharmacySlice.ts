import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { MedicineResponse } from '@/types/api';

interface CartItem extends MedicineResponse {
  quantity: number;
}

interface PharmacyState {
  cart: CartItem[];
  recentSales: any[];
  alerts: {
    lowStock: number;
    expiringSoon: number;
  };
}

const initialState: PharmacyState = {
  cart: [],
  recentSales: [],
  alerts: {
    lowStock: 0,
    expiringSoon: 0,
  },
};

const pharmacySlice = createSlice({
  name: 'pharmacy',
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<MedicineResponse>) => {
      const existingItem = state.cart.find(item => item.id === action.payload.id);
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        state.cart.push({ ...action.payload, quantity: 1 });
      }
    },
    removeFromCart: (state, action: PayloadAction<string>) => {
      state.cart = state.cart.filter(item => item.id !== action.payload);
    },
    updateCartQuantity: (state, action: PayloadAction<{ id: string; quantity: number }>) => {
      const item = state.cart.find(item => item.id === action.payload.id);
      if (item) {
        item.quantity = action.payload.quantity;
      }
    },
    clearCart: (state) => {
      state.cart = [];
    },
    setAlerts: (state, action: PayloadAction<{ lowStock: number; expiringSoon: number }>) => {
      state.alerts = action.payload;
    },
  },
});

export const { 
  addToCart, 
  removeFromCart, 
  updateCartQuantity, 
  clearCart, 
  setAlerts 
} = pharmacySlice.actions;

export default pharmacySlice.reducer;
