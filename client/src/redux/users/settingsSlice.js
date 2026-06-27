// redux/ui/uiSlice.js
import { createSlice } from "@reduxjs/toolkit";

const uiSlice = createSlice({
  name: "ui",
  initialState: {
    isGlobalMuted: true, // 🟢 Master default
  },
  reducers: {
    setGlobalMute: (state, action) => {
      state.isGlobalMuted = action.payload;
    },
    toggleGlobalMute: (state) => {
      state.isGlobalMuted = !state.isGlobalMuted;
    }
  },
});

export const { setGlobalMute, toggleGlobalMute } = uiSlice.actions;
export default uiSlice.reducer;