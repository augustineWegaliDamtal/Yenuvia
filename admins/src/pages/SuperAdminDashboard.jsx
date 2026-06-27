import React, { useState } from "react";
import { Routes, Route, NavLink } from "react-router-dom";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { Shield } from "lucide-react"; 

import AdminList from "./AdminList";
import SystemLogs from "./SystemLogs";
import SuperAdminProfile from "./SuperAdminProfile";
import SuperAdminContent from "./SuperAdminContent";
import AwardVerification from "./AwardVerification";
import AdminSignup from "./AdminSignup"; 
import AdminDashboard from "./AdminDashboard"; 
import AdminBillboard from "../Component.jsx/AdminBillboard";
import AdminDisputePanel from "../Component.jsx/AdminDisputePanel";
// 🔥 Fixed the import path (since it's in the same folder now)


const SuperAdminDashboard = () => {
  const { currentUser } = useSelector((state) => state.admin);
  
  const [showAdminSignup, setShowAdminSignup] = useState(false);

  // Protect route: only superadmins allowed
  if (!currentUser || currentUser.role !== "superadmin") {
    return (
      <div className="p-6 text-center text-red-600">
        Access denied. Only superadmins can view this page.
      </div>
    );
  }

  return (
    <div className="p-6 relative">
      
      {/* Header flex container to hold Title and Button */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white"> SuperAdmin Dashboard</h1>
        
        {/* The Trigger Button */}
        <button
          onClick={() => setShowAdminSignup(true)}
          className="bg-[#0a0a0a] text-yellow-500 border border-yellow-500/30 px-5 py-2.5 rounded-xl font-bold uppercase text-sm tracking-widest flex items-center gap-2 hover:bg-yellow-500 hover:text-black transition-all shadow-lg hover:shadow-yellow-500/20 active:scale-95 cursor-pointer"
        >
          <Shield size={18} />
          New Admin
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-4 mb-6 flex-wrap gap-y-4">
        <NavLink
          to="/superadmin/admins"
          className={({ isActive }) =>
            `px-4 py-2 rounded font-semibold transition-colors ${
              isActive ? "bg-blue-600 text-white" : "bg-gray-200 text-black hover:bg-gray-300"
            }`
          }
        >
          Admins
        </NavLink>
        <NavLink
          to="/superadmin/logs"
          className={({ isActive }) =>
            `px-4 py-2 rounded font-semibold transition-colors ${
              isActive ? "bg-blue-600 text-white" : "bg-gray-200 text-black hover:bg-gray-300"
            }`
          }
        >
          System Logs
        </NavLink>

        <NavLink
          to="/superadmin/content"
          className={({ isActive }) =>
            `px-4 py-2 rounded font-semibold transition-colors ${
              isActive ? "bg-blue-600 text-white" : "bg-gray-200 text-black hover:bg-gray-300"
            }`
          }
        >
          Content
        </NavLink>
        
        <NavLink
          to="/superadmin/verification"
          className={({ isActive }) =>
            `px-4 py-2 rounded font-semibold transition-colors ${
              isActive ? "bg-blue-600 text-white" : "bg-gray-200 text-black hover:bg-gray-300"
            }`
          }
        >
          Award Verification
        </NavLink>

        <NavLink
          to="/superadmin/fixtures"
          className={({ isActive }) =>
            `px-4 py-2 rounded font-semibold transition-colors ${
              isActive ? "bg-yellow-500 text-black shadow-lg" : "bg-gray-200 text-black hover:bg-gray-300"
            }`
          }
        >
          Derby Fixtures
        </NavLink>

        {/* 🔥 NEW ADMIN BILLBOARD TAB */}
        <NavLink
          to="/superadmin/billboard"
          className={({ isActive }) =>
            `px-4 py-2 rounded font-semibold transition-colors ${
              isActive ? "bg-zinc-700 text-white shadow-lg border border-zinc-500" : "bg-gray-200 text-black hover:bg-gray-300"
            }`
          }
        >
          Live Billboard
        </NavLink>

        {/* PROFILE IMAGE TAB */}
        <NavLink
          to="/superadmin/profile"
          className={({ isActive }) =>
            `ml-auto flex flex-col items-center justify-center transition-all hover:scale-105 group ${
              isActive ? "opacity-100" : "opacity-70 hover:opacity-100"
            }`
          }
        >
          <img
            src={
              currentUser?.avatar?.startsWith("/uploads") 
                ? `http://localhost:3000${currentUser.avatar}` 
                : currentUser?.avatar || "/default-avatar.png"
            }
            alt="Profile"
            className="w-10 h-10 rounded-full object-cover border-2 border-yellow-500 shadow-lg group-hover:border-yellow-400"
          />
          <span className="text-[10px] font-bold uppercase mt-1 text-white tracking-widest group-hover:text-yellow-400 transition-colors">
            Profile
          </span>
        </NavLink>

        {/* 🚨 ESCROW DISPUTES TAB */}
        <NavLink
          to="/superadmin/disputes"
          className={({ isActive }) =>
            `px-4 py-2 rounded font-semibold transition-colors ${
              isActive ? "bg-red-600 text-white shadow-lg border border-red-500" : "bg-gray-200 text-black hover:bg-gray-300"
            }`
          }
        >
          Escrow Disputes
        </NavLink>
      </div>

      {/* Nested Routes */}
      <Routes>
        <Route path="admins" element={<AdminList />} />
        <Route path="logs" element={<SystemLogs />} />
        <Route path="profile" element={<SuperAdminProfile />} />
        <Route path="content" element={<SuperAdminContent/>} />
        <Route path="verification" element={<AwardVerification/>} />
        <Route path="fixtures" element={<AdminDashboard />} /> 
        <Route path="disputes" element={<AdminDisputePanel />} />
        {/* Your Billboard Route is perfect! */}
        <Route path="billboard" element={<AdminBillboard/>} />
      </Routes>

      {/* The Command Center Fullscreen Overlay */}
      <AnimatePresence>
        {showAdminSignup && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-[999] bg-black/80 backdrop-blur-md overflow-y-auto flex items-center justify-center"
          >
            <AdminSignup onClose={() => setShowAdminSignup(false)} />
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default SuperAdminDashboard;