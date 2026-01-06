import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Async Thunks
export const fetchFinances = createAsyncThunk(
    'finance/fetchFinances',
    async (_, { rejectWithValue }) => {
        try {
            const response = await fetch('/api/finances');
            if (!response.ok) throw new Error('Failed to fetch finances');
            const data = await response.json();
            return data;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const addFinance = createAsyncThunk(
    'finance/addFinance',
    async (financeData, { rejectWithValue }) => {
        try {
            const response = await fetch('/api/finances', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(financeData),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to add finance record');
            }
            const data = await response.json();
            return { ...financeData, id: data.id }; // Return data with new ID
        } catch (error) {
            console.error("Add Finance Error:", error);
            return rejectWithValue(error.message);
        }
    }
);

export const updateFinance = createAsyncThunk(
    'finance/updateFinance',
    async ({ id, data }, { rejectWithValue }) => {
        try {
            const response = await fetch(`/api/finances/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!response.ok) throw new Error('Failed to update finance record');
            return { id, ...data };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const deleteFinance = createAsyncThunk(
    'finance/deleteFinance',
    async (id, { rejectWithValue }) => {
        try {
            const response = await fetch(`/api/finances/${id}`, {
                method: 'DELETE',
            });
            if (!response.ok) throw new Error('Failed to delete finance record');
            return id;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

const initialState = {
    items: [],
    loading: false,
    error: null,
};

const financeSlice = createSlice({
    name: 'finance',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            // Fetch
            .addCase(fetchFinances.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchFinances.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload;
            })
            .addCase(fetchFinances.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Add
            .addCase(addFinance.fulfilled, (state, action) => {
                state.items.unshift(action.payload);
            })
            // Update
            .addCase(updateFinance.fulfilled, (state, action) => {
                const index = state.items.findIndex(item => item.id === action.payload.id);
                if (index !== -1) {
                    state.items[index] = { ...state.items[index], ...action.payload };
                }
            })
            // Delete
            .addCase(deleteFinance.fulfilled, (state, action) => {
                state.items = state.items.filter(item => item.id !== action.payload);
            });
    },
});

export const selectFinances = (state) => state.finance.items;
export const selectFinanceStats = (state) => {
    return {
        total: state.finance.items.length,
    };
};

export default financeSlice.reducer;
