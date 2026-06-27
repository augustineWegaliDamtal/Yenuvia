import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentUserArtist: null,
  error: null,
  loading: false,
};

export const artistSlice = createSlice({
  name: 'artist',
  initialState,
  reducers: {
    // --- 🔑 SIGN IN ---
    artistSigninStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    artistSigninSuccess: (state, action) => {
      state.currentUserArtist = action.payload;
      state.error = null;
      state.loading = false;
    },
    artistSigninFailure: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },

    // --- 📝 UPDATE PROFILE ---
    artistUpdateUserStart: (state) => {
      state.loading = true;
    },
    artistUpdateUserSuccess: (state, action) => {
      state.currentUserArtist = action.payload;
      state.error = null;
      state.loading = false;
    },
    artistUpdateUserFailure: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },

    // --- 🗑️ DELETE ACCOUNT ---
    artistDeleteUserStart: (state) => {
      state.loading = true;
    },
    artistDeleteUserSuccess: (state) => {
      state.currentUserArtist = null;
      state.error = null;
      state.loading = false;
    },
    artistDeleteUserFailure: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },

    // --- 🚪 SIGN OUT ---
    artistSignoutUserStart: (state) => {
      state.loading = true;
    },
    artistSignoutUserSuccess: (state) => {
      state.currentUserArtist = null;
      state.error = null;
      state.loading = false;
    },
    artistSignoutUserFailure: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },

    // --- 🛠️ UTILITY ---
    artistClearError: (state) => {
      state.error = null;
    },

    // --- ✨ REAL-TIME VERIFICATION UPDATE ---
    updateVerificationStatus: (state, action) => {
      if (state.currentUserArtist) {
        state.currentUserArtist.verified = action.payload;
      }
    }
  },
});

export const {
  artistSigninStart,
  artistSigninSuccess,
  artistSigninFailure,
  artistUpdateUserStart,
  artistUpdateUserSuccess,
  artistUpdateUserFailure,
  artistDeleteUserStart,
  artistDeleteUserSuccess,
  artistDeleteUserFailure,
  artistSignoutUserStart,
  artistSignoutUserSuccess,
  artistSignoutUserFailure,
  artistClearError,
  updateVerificationStatus // 👈 Exported here!
} = artistSlice.actions;

export default artistSlice.reducer;