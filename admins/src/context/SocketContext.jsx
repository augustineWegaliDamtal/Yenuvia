import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

// Kept for future production reference, but local dev relies on the Vite proxy ("/")
// Change VITE_API_URL to VITE_BACKEND_URL
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    console.log(`🔌 Admin initializing socket connection...`);

    // 🔥 THE FIX: Use "/" so Vite handles the Cloudflare routing, 
    // and add polling fallback for unstable mobile networks.
    const newSocket = io("/", {
      path: "/socket.io",
      withCredentials: true, // Important for Admin auth cookies/sessions
      transports: ['websocket', 'polling'] 
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect(); // 'disconnect' is the standard Socket.io cleanup method
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);