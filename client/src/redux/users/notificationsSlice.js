import { createSlice } from "@reduxjs/toolkit";

const notificationsSlice = createSlice({
  name: "notifications",
  initialState: { 
    unreadMessageCount: 0, 
    unreadAlertCount: 0,   
    latestAlert: null      
  },
  reducers: {
    INCREMENT_UNREAD_MESSAGE: (state) => {
      state.unreadMessageCount += 1;
    },
    CLEAR_UNREAD_MESSAGES: (state) => {
      state.unreadMessageCount = 0;
    },
    SET_LIVE_ALERT: (state, action) => {
      state.latestAlert = action.payload;
      state.unreadAlertCount += 1;
    },
    CLEAR_LATEST_ALERT: (state) => {
      state.latestAlert = null;
    },
    CLEAR_ALERT_BADGE: (state) => {
      state.unreadAlertCount = 0;
    },
    RESET_NOTIFICATIONS: (state) => {
      state.unreadMessageCount = 0;
      state.unreadAlertCount = 0;
      state.latestAlert = null;
    }
  }
});

export const { 
  INCREMENT_UNREAD_MESSAGE, 
  CLEAR_UNREAD_MESSAGES, 
  SET_LIVE_ALERT, 
  CLEAR_LATEST_ALERT,
  CLEAR_ALERT_BADGE,
  RESET_NOTIFICATIONS
} = notificationsSlice.actions;

export default notificationsSlice.reducer;