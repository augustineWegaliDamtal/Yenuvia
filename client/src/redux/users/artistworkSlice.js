import { createSlice } from "@reduxjs/toolkit";

const artistworkSlice = createSlice({
  name: "artistwork",
  initialState: {
    feedPosts: [],       // ✅ Permanent Feed Memory
    lastFetched: null,   // ✅ Timestamp for background sync
    loading: false,      // ✅ Global loading state
    error: null,
  },
  reducers: {
    // 📥 SET: Used for the initial load or a "Pull to Refresh"
    SET_FEED_POSTS: (state, action) => {
      state.feedPosts = action.payload;
      state.lastFetched = Date.now();
      state.loading = false;
    },

    // ➕ APPEND: Used for Infinite Scroll (adding page 2, 3, etc.)
    APPEND_FEED_POSTS: (state, action) => {
      // Filter out duplicates to keep the Arena feed clean
      const newPosts = action.payload.filter(
        (newPost) => !state.feedPosts.some((p) => p._id === newPost._id)
      );
      state.feedPosts = [...state.feedPosts, ...newPosts];
      state.loading = false;
    },

    // ⚡ OPTIMISTIC UPDATE: The "TikTok Snap" for Likes/Comments
    // This updates the UI at 0ms before the server even responds
    UPDATE_SINGLE_POST: (state, action) => {
      const index = state.feedPosts.findIndex(p => p._id === action.payload._id);
      if (index !== -1) {
        // Merge the new data (like new likes count) into the existing post
        state.feedPosts[index] = { ...state.feedPosts[index], ...action.payload };
      }
    },

    // 🛠️ LOADING STATES
    SET_FEED_LOADING: (state, action) => {
      state.loading = action.payload;
    },

    // 🧹 CLEANUP: Used when the user logs out to clear local memory
    CLEAR_FEED: (state) => {
      state.feedPosts = [];
      state.lastFetched = null;
      state.loading = false;
    },
  },
});

export const { 
  SET_FEED_POSTS, 
  APPEND_FEED_POSTS, 
  UPDATE_SINGLE_POST, 
  SET_FEED_LOADING,
  CLEAR_FEED 
} = artistworkSlice.actions;

export default artistworkSlice.reducer;