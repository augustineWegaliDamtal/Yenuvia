import { createSlice } from "@reduxjs/toolkit";

const adminNotificationsSlice = createSlice({
  name: "adminNotifications",
  initialState: { 
    unreadWorkCount: 0,    // For new uploads/moderation (Ops icon)
    unreadMessageCount: 0, // For the Inbox/Chat (Comms icon)
    unreadMap: {},         // For the Sidebar Red Dots { "artistID": count }
    notifications: []      // History of recent alerts
  },
  reducers: {
    // 🎨 Moderation Alerts (Ops Icon)
    INCREMENT_UNREAD_ADMIN: (state) => {
      state.unreadWorkCount += 1;
    },
    CLEAR_UNREAD_ADMIN: (state) => {
      state.unreadWorkCount = 0;
    },

    // 💬 Communication Alerts (Comms Icon & Red Dots)
    INCREMENT_MESSAGE_COUNT: (state) => {
      state.unreadMessageCount += 1;
    },
    CLEAR_MESSAGE_COUNT: (state) => {
      state.unreadMessageCount = 0;
    },
    
    // ✅ This is the engine for the Sidebar Red Dots
    SET_UNREAD_BY_USER: (state, action) => {
      const { senderId, count } = action.payload;
      // We ensure the key is always a string to avoid ID mismatch
      state.unreadMap[String(senderId)] = count;
    },

    // 📜 Notification Feed Logic
    ADD_NOTIFICATION: (state, action) => {
      state.notifications.unshift(action.payload);
      if (state.notifications.length > 20) state.notifications.pop();
    },

    RESET_ALL_NOTIFICATIONS: (state) => {
      state.unreadWorkCount = 0;
      state.unreadMessageCount = 0;
      state.unreadMap = {};
      state.notifications = [];
    }
  },
});

// ✅ CRITICAL: Ensure SET_UNREAD_BY_USER is exported here!
export const { 
  INCREMENT_UNREAD_ADMIN, 
  CLEAR_UNREAD_ADMIN, 
  INCREMENT_MESSAGE_COUNT, 
  CLEAR_MESSAGE_COUNT,
  SET_UNREAD_BY_USER,
  ADD_NOTIFICATION,
  RESET_ALL_NOTIFICATIONS
} = adminNotificationsSlice.actions;

export default adminNotificationsSlice.reducer;