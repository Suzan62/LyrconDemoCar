import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: []
};

const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    setVehicles: (state, action) => {
      state.items = action.payload;
    },
    addVehicle: (state, action) => {
      state.items.unshift(action.payload);
    },
    updateVehicle: (state, action) => {
      const { id, ...data } = action.payload;
      const index = state.items.findIndex(item => item.id === id);
      if (index !== -1) {
        state.items[index] = { ...state.items[index], ...data };
      }
    },
    deleteVehicle: (state, action) => {
      state.items = state.items.filter(item => item.id !== action.payload);
    }
  }
});

export const { setVehicles, addVehicle, updateVehicle, deleteVehicle } = inventorySlice.actions;
export default inventorySlice.reducer;
