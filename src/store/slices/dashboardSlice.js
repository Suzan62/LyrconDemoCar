import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    stats: {
        carsSold: 12,
        revenue: 485000,
        loansApproved: 8
    },
    salesData: [
        { name: 'Jan', sales: 4000, prediction: 4200 },
        { name: 'Feb', sales: 3000, prediction: 3200 },
        { name: 'Mar', sales: 2000, prediction: 2400 },
        { name: 'Apr', sales: 2780, prediction: 3000 },
        { name: 'May', sales: 1890, prediction: 2500 },
        { name: 'Jun', sales: 2390, prediction: 2800 },
        { name: 'Jul', sales: 3490, prediction: 3600 },
        { name: 'Aug', sales: 4200, prediction: 4500 },
        { name: 'Sep', sales: 4800, prediction: 5100 },
    ]
};

const dashboardSlice = createSlice({
    name: 'dashboard',
    initialState,
    reducers: {
        updateStats: (state, action) => {
            state.stats = { ...state.stats, ...action.payload };
        }
    }
});

export const { updateStats } = dashboardSlice.actions;
export default dashboardSlice.reducer;
