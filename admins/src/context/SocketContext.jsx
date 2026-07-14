import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux'; 
import { io } from 'socket.io-client';

// 🔌 Bind your notification actions directly to the global socket manager
import { INCREMENT_MESSAGE_COUNT, SET_UNREAD_BY_USER } from '../redux/user/adminNotificationsSlice';

const SocketContext = createContext();

// Realigns dev default to port 3000 to match your active backend server
const SOCKET_URL = import.meta.env.PROD 
  ? import.meta.env.VITE_BACKEND_URL 
  : import.meta.env.VITE_DEV_BACKEND_URL || "http://localhost:3000"; 

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const dispatch = useDispatch(); 
  
  // ✅ FIX: Fixed target to pull 'currentUser' from your admin state block
  const currentUser = useSelector((state) => state.user?.currentUser || state.admin?.currentUser);

  useEffect(() => {
    if (!currentUser?._id) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    console.log(`🔌 Admin initializing socket connection for user: ${currentUser._id} at ${SOCKET_URL}`);

    const newSocket = io(SOCKET_URL, {
      path: "/socket.io",
      withCredentials: true,
      auth: {
        userId: currentUser._id,
        role: currentUser.role || "admin" 
      },
      transports: ['polling', 'websocket'] 
    });

    newSocket.on("connect", () => {
      console.log(`✅ Admin Socket connected successfully! Assignment ID: ${newSocket.id}`);
    });

    newSocket.on("connect_error", (err) => {
      console.error("❌ Admin Socket failed to hook to backend server:", err.message);
    });

    // --- 🚨 GLOBAL ALERT LISTENER (THE BACKGROUND BACKGROUND BADGE engine) ---
    newSocket.on("receiveMessage", (newMessage) => {
      console.log("Stream received by global context listener:", newMessage);
      
      const senderId = String(newMessage.sender?._id || newMessage.sender || "");
      if (senderId && senderId !== String(currentUser._id)) {
        // Automatically sync global navigation badge state down to redux store hooks
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