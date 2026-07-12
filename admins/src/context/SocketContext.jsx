import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
// 1. Import your auth hook so we know who is currently logged in!
// (Adjust the import path below to match where your auth context lives, e.g., useAuth, useSelector, etc.)
import { useAuth } from './AuthContext'; 

const SocketContext = createContext();

// 2. Automatically switch: Use real backend URL in production, or "/" for local Vite proxy
const SOCKET_URL = import.meta.env.PROD 
  ? import.meta.env.VITE_BACKEND_URL 
  : "/";

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { currentUser } = useAuth(); // Extract the logged-in user

  useEffect(() => {
    // If there's no logged-in user yet, don't spin up an unauthenticated socket
    if (!currentUser?._id) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    console.log(`🔌 Initializing socket connection for user: ${currentUser._id}`);

    // 🔥 THE FIX: Pass the user's ID and role so the backend auto-joins their notification room!
    const newSocket = io(SOCKET_URL, {
      path: "/socket.io",
      withCredentials: true, // Required for secure cookies/sessions across domains
      query: {
        userId: currentUser._id,
        role: currentUser.role || "user"
      },
      // In production across separate domains, polling must establish the handshake before upgrading to websockets
      transports: ['polling', 'websocket'] 
    });

    newSocket.on("connect", () => {
      console.log(`✅ Socket connected successfully with ID: ${newSocket.id}`);
    });

    newSocket.on("connect_error", (err) => {
      console.error("❌ Socket connection error:", err.message);
    });

    setSocket(newSocket);

    return () => {
      console.log(`🧹 Disconnecting socket for user: ${currentUser._id}`);
      newSocket.disconnect();
    };
  }, [currentUser?._id, currentUser?.role]); // Re-run if the user logs in, logs out, or switches accounts

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);