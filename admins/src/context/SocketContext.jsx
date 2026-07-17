import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
 
import { useDispatch, useSelector } from "react-redux";
import { io } from 'socket.io-client';

// 🔌 Notification actions
import { INCREMENT_MESSAGE_COUNT } from '../redux/user/adminNotificationsSlice';

const SocketContext = createContext();

// 💡 FIX 1: Sanitize URL and prevent undefined URL falling back to frontend host
const rawUrl = import.meta.env.PROD 
  ? import.meta.env.VITE_BACKEND_URL 
  : import.meta.env.VITE_DEV_BACKEND_URL || "http://localhost:3000"; 

// Remove trailing slash if present
const SOCKET_URL = (rawUrl || "http://localhost:3000").replace(/\/$/, "");

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const dispatch = useDispatch(); 
  
  const currentUser = useSelector((state) => state.user?.currentUser || state.admin?.currentUser);
  
  // 💡 FIX 2: Use ref to always have fresh user ID in event listeners without reconnecting
  const userIdRef = useRef(currentUser?._id);

  useEffect(() => {
    userIdRef.current = currentUser?._id;
  }, [currentUser?._id]);

  useEffect(() => {
    if (!currentUser?._id) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    console.log(`🔌 Initializing admin socket to: ${SOCKET_URL}`);

    const newSocket = io(SOCKET_URL, {
      path: "/socket.io",
      withCredentials: true,
      // 💡 FIX 3: Prioritize websocket over polling for production proxies
      transports: ['websocket', 'polling'], 
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      auth: {
        userId: currentUser._id,
        role: currentUser.role || "admin" 
      }
    });

    newSocket.on("connect", () => {
      console.log(`✅ Admin Socket connected! ID: ${newSocket.id}`);
    });

    newSocket.on("connect_error", (err) => {
      console.error("❌ Admin Socket connection error:", err.message);
    });

    // 🚨 GLOBAL MESSAGE LISTENER
    newSocket.on("receiveMessage", (newMessage) => {
      console.log("📩 Message received in socket context:", newMessage);
      
      const activeUserId = String(userIdRef.current || "");
      const senderId = String(newMessage.sender?._id || newMessage.sender || "");
      
      // If message is from someone else, increment unread badge count
      if (senderId && senderId !== activeUserId) {
        dispatch(INCREMENT_MESSAGE_COUNT());
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.off("receiveMessage"); 
      newSocket.disconnect();
    };
  }, [currentUser?._id, dispatch]); 

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);