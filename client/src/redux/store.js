import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { persistReducer, persistStore } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

// 1. IMPORT ALL REDUCERS
import artistReducer from './users/artistSlice.js';
import notificationsReducer from './users/notificationsSlice.js';
import artistworkReducer from "./users/artistworkSlice.js"; 
import settingsReducer from "./users/settingsSlice";
// 2. COMBINE REDUCERS
const rootReducer = combineReducers({
  artist: artistReducer, 
  notifications: notificationsReducer,
  artistwork: artistworkReducer,
  ui: settingsReducer, 
});

// 3. PERSIST CONFIG (The Speed Secret)
const persistConfig = {
  key: "arenaArtistRoot",
  storage,
  version: 1,
  // ✅ WHITELIST: This saves the feed to the phone's memory for 0ms loading
  whitelist: ["artist", "artistwork"], 
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

// 4. CONFIGURE STORE
export const store = configureStore({
  reducer: persistedReducer,
  devTools: process.env.NODE_ENV !== 'production',
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, 
    }),
});

export const persistor = persistStore(store);