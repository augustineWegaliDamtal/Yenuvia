import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaHome, 
  FaChartBar, 
  FaCommentDots, 
  FaUserAstronaut, 
  FaTerminal 
} from "react-icons/fa";
import { 
  CLEAR_UNREAD_ADMIN, 
  CLEAR_MESSAGE_COUNT 
} from "../redux/user/adminNotificationsSlice";

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  
  const { currentUser } = useSelector((state) => state.admin || {});
  
  // ✅ 1. Get counts from Redux
  const { unreadWorkCount, unreadMessageCount } = useSelector(
    (state) => state.adminNotifications || { unreadWorkCount: 0, unreadMessageCount: 0 }
  );

  const isSuperAdmin = currentUser?.role === "superadmin";
  const isAdmin = currentUser?.role === "admin";

  // --- CONFIGURATION ---
  const navItems = [
    { label: "Arena", icon: <FaHome />, path: "/home" },
    
    (isAdmin || isSuperAdmin) && { 
      label: "Ops", 
      icon: <FaChartBar />, 
      path: "/dashboard",
      // ✅ FIX: Ops uses unreadWorkCount
      badge: unreadWorkCount 
    },

    currentUser && { 
      label: "Comms", 
      icon: <FaCommentDots />, 
      path: "/inbox",
      // ✅ FIX: Comms uses unreadMessageCount
      badge: unreadMessageCount 
    },

    isSuperAdmin && { 
      label: "Root", 
      icon: <FaTerminal />, 
      path: "/superadmin" 
    },

    isAdmin && { 
      label: "Pilot", 
      icon: <FaUserAstronaut />, 
      path: "/profile" 
    },
  ].filter(Boolean);

  if (!currentUser) return null;

  const handleNavigation = (path, label) => {
    // ✅ 2. Clear Comms badge when clicking Comms
    if (label === "Comms") {
      dispatch(CLEAR_MESSAGE_COUNT());
    }
    // ✅ 3. Clear Ops badge when clicking Ops
    if (label === "Ops" || path === "/dashboard") {
      dispatch(CLEAR_UNREAD_ADMIN());
    }
    navigate(path);
  };

  return (
    <div className="fixed bottom-6 left-0 right-0 px-6 z-[100]">
      <nav className="max-w-lg mx-auto bg-black/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] h-20 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex justify-around items-center px-4 relative overflow-hidden">
        
        <div className="absolute inset-0 bg-gradient-to-t from-yellow-500/5 to-transparent pointer-events-none" />

        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          
          return (
            <button
              key={item.path}
              onClick={() => handleNavigation(item.path, item.label)}
              className="relative flex flex-col items-center justify-center min-w-[60px] h-full transition-all group"
            >
              <AnimatePresence>
                {isActive && (
                  <motion.div 
                    layoutId="nav-glow"
                    className="absolute -top-1 w-12 h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent shadow-[0_0_15px_#eab308]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  />
                )}
              </AnimatePresence>

              <div className={`relative p-2 transition-all duration-500 ${
                isActive ? "text-yellow-500 -translate-y-1" : "text-gray-500 group-hover:text-gray-300"
              }`}>
                <span className={`text-xl transition-transform duration-300 ${isActive ? "scale-125" : "scale-100"}`}>
                  {item.icon}
                </span>
                
                {/* ✅ 4. Use item.badge directly from the array config */}
                {item.badge > 0 && (
                  <span className="absolute top-1 -right-1 bg-red-500 text-white text-[8px] font-black rounded-full w-4 h-4 flex items-center justify-center border border-black ring-2 ring-red-500/20 animate-pulse">
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                )}
              </div>
              
              <span className={`text-[8px] font-black uppercase tracking-[0.2em] mt-1 transition-all duration-300 ${
                isActive ? "text-yellow-500 opacity-100" : "text-gray-600 opacity-0"
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default BottomNav;