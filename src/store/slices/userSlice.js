import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    profile: {
        name: "Admin User",
        role: "Manager",
        email: "admin@lyrcon.com",
        phone: "+1 (555) 123-4567",
        phone: "+1 (555) 123-4567",
        location: "New York, NY",
        profilePic: null
    }
};

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        updateUserProfile: (state, action) => {
            state.profile = { ...state.profile, ...action.payload };
        }
    }
});

export const { updateUserProfile } = userSlice.actions;
export default userSlice.reducer;
