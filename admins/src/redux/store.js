import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { persistReducer, persistStore } from "redux-persist";

// 🛑 REMOVED: import storage from "redux-persist/lib/storage";
// 🟢 ADDED: SessionStorage ensures the session dies when the tab closes
import storageSession from "redux-persist/lib/storage/session";

// ✅ Ensure these file paths are 100% correct
import userReducer from "./user/userSlice.js"; 
import adminNotificationsReducer from "./user/adminNotificationsSlice.js";

const rootReducer = combineReducers({
  admin: userReducer, // ✅ We use 'admin' here to match your slice
  adminNotifications: adminNotificationsReducer,
});

const persistConfig = {
  key: "arena_admin_root", 
  storage: storageSession, // 🟢 Updated to use the session storage engine
  version: 1,
  // We tell persist to specifically look for the 'admin' state we just defined
  whitelist: ["admin"], 
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export const persistor = persistStore(store);