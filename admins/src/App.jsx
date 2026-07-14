import React, { useEffect, useRef } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux"; 

// 🔥 1. Global Socket Hook
import { useSocket } from "./context/SocketContext"; 

// --- PAGES ---
import LandingPage from "./pages/LandingPage";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Upload from "./pages/Upload";
import Inbox from "./pages/Inbox";
import AdminSignup from "./pages/AdminSignup";
import AdminSignin from "./pages/AdminSignin";
import SuperAdminSignin from "./pages/SuperAdminSignin";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import SetChallengeForms from "./pages/SetChallengeForms";

// --- COMPONENTS ---
import BottomNav from "./Component.jsx/BottomNav";

// --- REDUX ACTIONS ---
import { 
  INCREMENT_UNREAD_ADMIN, 
  INCREMENT_MESSAGE_COUNT,
  SET_UNREAD_BY_USER // 🔥 Added to allow background tracking
} from "./redux/user/adminNotificationsSlice";

const App = () => {
  const { currentUser } = useSelector((state) => state.admin || {});
  const { unreadMap } = useSelector((state) => state.adminNotifications) || { unreadMap: {} };
  const dispatch = useDispatch();

  const isAdmin = currentUser?.role === "admin";
  const isSuperAdmin = currentUser?.role === "superadmin";
  const isAuthenticated = isAdmin || isSuperAdmin;

  // 🔥 2. GRAB THE GLOBAL SOCKET INSTANCE
  const socket = useSocket();

  // 🛡️ Safety Ref to track unread maps without breaking socket triggers
  const unreadMapRef = useRef(unreadMap);
  useEffect(() => { 
    unreadMapRef.current = unreadMap; 
  }, [unreadMap]);

  // 🔌 3. REAL-TIME ENGINE (Listening & Connected Mode)
  useEffect(() => {
    if (!socket || !currentUser?._id) return;
    console.log("📡 [SOCKET DIAGNOSTIC]:", {
    socketExists: !!socket,
    isConnected: socket?.connected || false,
    socketId: socket?.id || "NO ID",
    currentUserId: currentUser?._id || "NOT LOGGED IN"
  });

    // 🚪 1. Safety Net: Ensure Admin is joined to their private room
    const connectAdminToRoom = () => {
      socket.emit("join", currentUser._id);
      console.log("🟢 Admin joined socket room globally!");
    };

    if (socket.connected) {
      connectAdminToRoom();
    }
    socket.on("connect", connectAdminToRoom);

    // 💬 2. CHANNEL 1: CHAT MESSAGES (Global Alert Fix)
    const handleReceiveMessage = (message) => {
      console.log("🚀 SOCKET RECEIVED [Global]:", {
        sender: message.sender?._id || message.sender,
        content: message.content,
        timestamp: new Date().toISOString()
      });
      
      const senderId = String(message.sender?._id || message.sender);
      
      // Only trigger an alert if the message was sent by someone else
      if (senderId && senderId !== String(currentUser._id)) {
        // Safely increment your global unread badge counter (BottomNav)
        dispatch(INCREMENT_MESSAGE_COUNT());
        
        // 🔥 PERFECT BACKGROUND SYNC: 
        // Updates the individual sidebar count even if you are on the Home/Dashboard pages!
        const currentCount = unreadMapRef.current[senderId] || 0;
        dispatch(SET_UNREAD_BY_USER({ senderId: senderId, count: currentCount + 1 }));

        console.log("🔔 Global message caught! Dispatching unread badge count...");
      }
    };

    // 🚨 3. CHANNEL 1.5: SPECIFIC ADMIN TRIGGER
    const handleNewAdminMessage = (data) => {
      console.log("🚨 Global Admin received a specific message trigger:", data);
    };

    // 🎨 4. CHANNEL 2: NEW ART SUBMISSIONS
    const handleNewWork = (data) => {
      console.log("🚨 Admin Alert (New Work):", data?.message);
      dispatch(INCREMENT_UNREAD_ADMIN());
    };

    // Turn on the listeners
    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("new_admin_message", handleNewAdminMessage);
    socket.on("newWorkSubmitted", handleNewWork);

    // Cleanup listeners when component unmounts or dependencies change
    return () => {
      socket.off("connect", connectAdminToRoom);
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("new_admin_message", handleNewAdminMessage);
      socket.off("newWorkSubmitted", handleNewWork);
    };
    
  }, [socket, currentUser?._id, dispatch]);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-black text-white relative selection:bg-yellow-500 selection:text-black">
        <Routes>
          {/* --- PUBLIC ACCESS --- */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/admin-signup" element={<AdminSignup />} />
          <Route path="/admin-signin" element={<AdminSignin />} />
          <Route path="/superadmin-signin" element={<SuperAdminSignin />} />
          
          {/* --- PROTECTED --- */}
          <Route path="/home" element={isAuthenticated ? <Home /> : <Navigate to="/admin-signin" />} />
          <Route path="/upload" element={isAuthenticated ? <Upload /> : <Navigate to="/admin-signin" />} />
          <Route path="/inbox" element={isAuthenticated ? <Inbox /> : <Navigate to="/admin-signin" />} />
          <Route path="/profile" element={isAuthenticated ? <Profile /> : <Navigate to="/admin-signin" />} />
          <Route path="/artist/:id" element={isAuthenticated ? <Profile /> : <Navigate to="/admin-signin" />} />
          <Route path="/set-challenge" element={isAuthenticated ? <SetChallengeForms /> : <Navigate to="/admin-signin" />} />
          <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/admin-signin" />} />
          <Route path="/superadmin/*" element={isSuperAdmin ? <SuperAdminDashboard /> : <Navigate to="/superadmin-signin" />} />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>

        {/* Global Navigation - Only shows when logged in */}
        {isAuthenticated && <BottomNav />}
      </div>
    </BrowserRouter>
  );
};

export default App;