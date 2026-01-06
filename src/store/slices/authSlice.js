import { createSlice } from '@reduxjs/toolkit';

// Helper to get initial state from localStorage
const getInitialState = () => {
    const user = localStorage.getItem('currentUser');
    return {
        isAuthenticated: !!user,
        currentUser: user ? JSON.parse(user) : null,
        loading: false,
        error: null
    };
};

const authSlice = createSlice({
    name: 'auth',
    initialState: getInitialState(),
    reducers: {
        loginStart: (state) => {
            state.loading = true;
            state.error = null;
        },
        loginSuccess: (state, action) => {
            state.loading = false;
            state.isAuthenticated = true;
            state.currentUser = action.payload;
            state.error = null;
            localStorage.setItem('currentUser', JSON.stringify(action.payload));
        },
        loginFailure: (state, action) => {
            state.loading = false;
            state.error = action.payload;
        },
        logout: (state) => {
            state.isAuthenticated = false;
            state.currentUser = null;
            localStorage.removeItem('currentUser');
        },
        registerSuccess: (state, action) => {
            state.loading = false;
            state.isAuthenticated = true;
            state.currentUser = action.payload;
            state.error = null;
            localStorage.setItem('currentUser', JSON.stringify(action.payload));
        }
    }
});

export const { loginStart, loginSuccess, loginFailure, logout, registerSuccess } = authSlice.actions;
export default authSlice.reducer;
