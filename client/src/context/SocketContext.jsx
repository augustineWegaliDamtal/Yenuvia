import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { io } from 'socket.io-client';

const SocketContext = createContext();

// 🔥 THE FIX: Dynamically switch to your live API domain in production, 
// while keeping "/" for local Vite development proxying.
const SOCKET_URL = import.meta.env.PROD 
  ? import.meta.env.VITE_BACKEND_URL 
  : "/";

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  
  // Grab the logged-in user so the backend knows WHO is connecting
  const activeUser = useSelector((state) => state.user?.currentUser || state.artist?.currentUserArtist);

  useEffect(() => {
    // If nobody is logged in, don't connect to the socket yet
    if (!activeUser?._id) return;

    console.log(`🔌 Initializing live socket for: ${activeUser._id}`);

    const newSocket = io(SOCKET_URL, {
      path: "/socket.io",
      query: { 
        userId: activeUser._id,
        role: activeUser.role || "user"
      },
      // Required to match your backend CORS credentials configuration across production domains
      withCredentials: true, 
      // In cross-domain production environments, polling must establish the CORS handshake before upgrading to WebSockets
      transports: ['polling', 'websocket']
    });

    newSocket.on("connect", () => {
      console.log(`✅ Client Socket Connected: ${newSocket.id}`);
    });

    newSocket.on("connect_error", (err) => {
      console.error("❌ Socket Connection Error:", err.message);
    });

    setSocket(newSocket);

    // Cleanup when the user logs out or leaves
    return () => {
      console.log("🧹 Disconnecting client socket...");
      newSocket.disconnect();
    };
  }, [activeUser?._id]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);