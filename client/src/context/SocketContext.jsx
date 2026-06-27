import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { io } from 'socket.io-client';

const SocketContext = createContext();

// We keep this for future-proofing, though the tunnel relies on "/"
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  
  // Grab the logged-in user so the backend knows WHO is connecting
  const activeUser = useSelector((state) => state.user?.currentUser || state.artist?.currentUserArtist);

  useEffect(() => {
    // If nobody is logged in, don't connect to the socket yet
    if (!activeUser?._id) return;

    // 🔥 FIX 1 & 2: Use "/" to allow Vite's proxy to handle the routing, 
    // and include 'polling' as a fallback for unstable mobile networks.
    const newSocket = io("/", {
      path: "/socket.io",
      query: { userId: activeUser._id },
      transports: ['websocket', 'polling']
    });

    setSocket(newSocket);

    // Cleanup when the user logs out or leaves
    return () => newSocket.disconnect();
  }, [activeUser?._id]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);