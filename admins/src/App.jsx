import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux"; 
// 🔥 1. Removed local socket.io-client and imported the Global Hook
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
  SET_UNREAD_BY_USER 
} from "./redux/user/adminNotificationsSlice";

const App = () => {
  const { currentUser } = useSelector((state) => state.admin || {});
  const { unreadMap } = useSelector((state) => state.adminNotifications || { unreadMap: {} });
  const dispatch = useDispatch();

  const isAdmin = currentUser?.role === "admin";
  const isSuperAdmin = currentUser?.role === "superadmin";
  const isAuthenticated = isAdmin || isSuperAdmin;

  // 🔥 2. GRAB THE GLOBAL WALKIE-TALKIE
  const socket = useSocket();

  // 🔌 3. REAL-TIME ENGINE (Listening Mode)
  useEffect(() => {
    // Wait until the global socket is ready and user is logged in
    if (!socket || !currentUser?._id || !currentUser?.token) return;

    // 💬 CHANNEL 1: CHAT MESSAGES
    const handleReceiveMessage = (message) => {
      const senderId = String(message.sender?._id || message.sender);
      
      if (senderId && senderId !== String(currentUser._id)) {
        // Update Global Nav Count
        dispatch(INCREMENT_MESSAGE_COUNT());
        
        // Update Sidebar Red Dot Map
        dispatch(SET_UNREAD_BY_USER({ 
          senderId, 
          count: (unreadMap[senderId] || 0) + 1 
        }));
      }
    };

    // 🎨 CHANNEL 2: NEW ART SUBMISSIONS (Moderation Queue Alert)
    const handleNewWork = (data) => {
      console.log("🚨 Admin Alert:", data?.message);
      dispatch(INCREMENT_UNREAD_ADMIN());
    };

    // Turn on the listeners
    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("newWorkSubmitted", handleNewWork);

    // Cleanup listeners when component unmounts
    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("newWorkSubmitted", handleNewWork);
    };
  }, [socket, currentUser, dispatch, unreadMap]); 

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

        {isAuthenticated && <BottomNav />}
      </div>
    </BrowserRouter>
  );
};

export default App;