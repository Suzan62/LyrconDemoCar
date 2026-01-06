import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    items: [
        {
            id: "#INQ-83",
            customer: "DEMO",
            customerPhone: "DEMO",
            email: "demo@example.com",
            vehicle: "MO",
            carType: "OLD",
            date: "26 JUL 2025",
            status: "Pending",
            source: "Walk-in",
            notes: "Interested in the Ford Mustang."
        }
    ],
    loading: false,
    error: null
};

const inquirySlice = createSlice({
    name: 'inquiries',
    initialState,
    reducers: {
        addInquiry: (state, action) => {
            // Generate a simple ID logic for demo purposes if not provided
            const newInquiry = {
                ...action.payload,
                id: action.payload.id || `#INQ-${Math.floor(Math.random() * 1000)}`,
                date: action.payload.date || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase(),
                status: action.payload.status || 'Pending'
            };
            state.items.unshift(newInquiry);
        },
        updateInquiry: (state, action) => {
            const { id, ...data } = action.payload;
            const index = state.items.findIndex(item => item.id === id);
            if (index !== -1) {
                state.items[index] = { ...state.items[index], ...data };
            }
        },
        deleteInquiry: (state, action) => {
            state.items = state.items.filter(item => item.id !== action.payload);
        },
        setInquiries: (state, action) => {
            state.items = action.payload;
        }
    }
});

export const { addInquiry, updateInquiry, deleteInquiry, setInquiries } = inquirySlice.actions;

// Selectors
export const selectInquiries = (state) => state.inquiries.items;
export const selectInquiryStats = (state) => {
    const items = state.inquiries.items;
    return {
        total: items.length,
        completed: items.filter(i => i.status === 'Completed').length,
        pending: items.filter(i => i.status === 'Pending').length
    };
};

export default inquirySlice.reducer;
