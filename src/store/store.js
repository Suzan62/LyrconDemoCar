import { configureStore } from '@reduxjs/toolkit';
import inventoryReducer from './slices/inventorySlice';
import userReducer from './slices/userSlice';
import dashboardReducer from './slices/dashboardSlice';
import authReducer from './slices/authSlice';
import inquiryReducer from './slices/inquirySlice';
import financeReducer from './slices/financeSlice';

export const store = configureStore({
    reducer: {
        inventory: inventoryReducer,
        user: userReducer,
        dashboard: dashboardReducer,
        auth: authReducer,
        inquiries: inquiryReducer,
        finance: financeReducer,
    },
});
