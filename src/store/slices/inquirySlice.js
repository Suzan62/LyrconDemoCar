import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Async Thunks
export const fetchInquiries = createAsyncThunk(
    'inquiries/fetchInquiries',
    async () => {
        const response = await fetch('/api/inquiries');
        if (!response.ok) throw new Error('Failed to fetch inquiries');
        return await response.json();
    }
);

export const addInquiry = createAsyncThunk(
    'inquiries/addInquiry',
    async (inquiryData) => {
        const response = await fetch('/api/inquiries', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(inquiryData)
        });
        if (!response.ok) throw new Error('Failed to add inquiry');
        const data = await response.json();
        return data.inquiry;
    }
);

export const deleteInquiry = createAsyncThunk(
    'inquiries/deleteInquiry',
    async (id) => {
        const response = await fetch(`/api/inquiries/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete inquiry');
        return id;
    }
);

export const updateInquiry = createAsyncThunk(
    'inquiries/updateInquiry',
    async ({ id, ...updates }) => {
        const response = await fetch(`/api/inquiries/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
        if (!response.ok) throw new Error('Failed to update inquiry');
        const data = await response.json();
        return data.inquiry;
    }
);


const initialState = {
    items: [],
    loading: false,
    error: null
};

const inquirySlice = createSlice({
    name: 'inquiries',
    initialState,
    reducers: {
        // Optional: Client-side only filters or sorts could go here
    },
    extraReducers: (builder) => {
        builder
            // Fetch
            .addCase(fetchInquiries.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchInquiries.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload;
            })
            .addCase(fetchInquiries.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })
            // Add
            .addCase(addInquiry.fulfilled, (state, action) => {
                state.items.unshift(action.payload);
            })
            // Delete
            .addCase(deleteInquiry.fulfilled, (state, action) => {
                state.items = state.items.filter(item => item.id !== action.payload);
            })
            // Update
            .addCase(updateInquiry.fulfilled, (state, action) => {
                const index = state.items.findIndex(item => item.id === action.payload.id);
                if (index !== -1) {
                    state.items[index] = action.payload;
                }
            });
    }
});

import { createSelector } from 'reselect';

// Selectors
export const selectInquiries = (state) => state.inquiries.items;

export const selectInquiryStats = createSelector(
    [selectInquiries],
    (items) => ({
        total: items.length,
        completed: items.filter(i => i.status === 'completed' || i.status === 'Completed').length,
        pending: items.filter(i => i.status === 'pending' || i.status === 'Pending').length
    })
);

export default inquirySlice.reducer;
