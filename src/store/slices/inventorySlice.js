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
      const { id, transaction_type, ...data } = action.payload;
      // Use composite check: ID + Transaction Type
      const index = state.items.findIndex(item =>
        item.id == id &&
        (!transaction_type || !item.transaction_type || item.transaction_type === transaction_type)
      );

      if (index !== -1) {
        state.items[index] = { ...state.items[index], ...data };
        if (transaction_type) state.items[index].transaction_type = transaction_type;
      }
    },
    deleteVehicle: (state, action) => {
      const payload = action.payload; // Can be ID or Object
      let idToDelete = payload;
      let typeToDelete = null;

      if (typeof payload === 'object') {
        idToDelete = payload.id;
        typeToDelete = payload.transaction_type;
      }

      state.items = state.items.filter(item => {
        if (item.id != idToDelete) return true;
        // If IDs match, check type if provided
        if (typeToDelete && item.transaction_type && item.transaction_type !== typeToDelete) return true;
        return false; // Match found, remove
      });
    }
  }
});

export const { setVehicles, addVehicle, updateVehicle, deleteVehicle } = inventorySlice.actions;
export default inventorySlice.reducer;
