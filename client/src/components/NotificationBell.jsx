import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Bell, Heart, MessageSquare, Gift, UserPlus, Package, Info, CheckCheck, Truck } from "lucide-react";

const NotificationBell = ({ socket }) => {
  // 🟢 UPDATED: Now points perfectly to your artistSlice!
  const { currentUserArtist } = useSelector((state) => state.artist); 
  const navigate = useNavigate();
  
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // 1. FETCH INITIAL NOTIFICATIONS
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch("/api/notifications", {
          // 🟢 UPDATED: Using currentUserArtist
          headers: { Authorization: `Bearer ${currentUserArtist?.token}` }, 
        });
        const data = await res.json();
        if (data.success) {
          setNotifications(data.notifications);
          setUnreadCount(data.unreadCount);
        }
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      }
    };

    if (currentUserArtist?.token) fetchNotifications();
  }, [currentUserArtist]);

  // 2. REAL-TIME SOCKET LISTENER
  useEffect(() => {
    if (socket) {
      socket.on("newNotification", (newNotif) => {
        setNotifications((prev) => [newNotif, ...prev]);
        setUnreadCount((prev) => prev + 1);
      });
    }
    return () => {
      if (socket) socket.off("newNotification");
    };
  }, [socket]);

  // Close dropdown if clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 3. MARK SINGLE AS READ & NAVIGATE
  const handleNotificationClick = async (notif) => {
    // Optimistic UI update
    if (!notif.isRead) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
      setNotifications((prev) =>
        prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
      );

      // Tell backend
      await fetch(`/api/notifications/${notif._id}/read`, {
        method: "PUT",
        // 🟢 UPDATED: Using currentUserArtist
        headers: { Authorization: `Bearer ${currentUserArtist?.token}` }, 
      });
    }

    setIsOpen(false);

    // Route them based on the type
    if (notif.type === "order" && notif.relatedOrder) {
      navigate(`/order/${notif.relatedOrder._id}`);
    } else if (notif.relatedWork) {
      navigate(`/work/${notif.relatedWork._id}`);
    }
  };

  // 4. MARK ALL AS READ
  const handleMarkAllRead = async () => {
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    
    await fetch("/api/notifications/read-all", {
      method: "PUT",
      // 🟢 UPDATED: Using currentUserArtist
      headers: { Authorization: `Bearer ${currentUserArtist?.token}` }, 
    });
  };

  // Helper to pick the right icon
  const getIcon = (type) => {
    switch (type) {
      case "like": return <Heart size={16} className="text-rose-500" />;
      case "comment": return <MessageSquare size={16} className="text-blue-500" />;
      case "gift": return <Gift size={16} className="text-yellow-500" />;
      case "follow": return <UserPlus size={16} className="text-green-500" />;
      case "order": return <Package size={16} className="text-yellow-500" />;
      case "delivery": return <Truck size={16} className="text-purple-500" />;
      default: return <Info size={16} className="text-gray-400" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 🔔 THE BELL BUTTON */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-white/10 transition-colors group"
      >
        <Bell size={24} className="text-gray-300 group-hover:text-yellow-500 transition-colors" />
        
        {/* 🔴 THE RED BADGE */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-[#0a0a0a] animate-in zoom-in">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* 📜 THE DROPDOWN MENU */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-[#0f0f0f] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200">
          
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
            <h3 className="font-black italic uppercase tracking-tighter text-lg text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllRead}
                className="text-[10px] font-bold uppercase tracking-widest text-yellow-500 hover:text-yellow-400 flex items-center gap-1"
              >
                <CheckCheck size={14} /> Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500 flex flex-col items-center">
                <Bell size={32} className="opacity-20 mb-2" />
                <p className="text-sm font-medium">All caught up!</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif._id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`flex items-start gap-3 p-4 border-b border-white/5 cursor-pointer transition-colors hover:bg-white/5 ${
                    !notif.isRead ? "bg-yellow-500/5" : ""
                  }`}
                >
                  {/* Sender Avatar */}
                  <img
                    src={notif.sender?.avatar || "/default-avatar.png"}
                    alt="avatar"
                    className="w-10 h-10 rounded-full object-cover border border-white/10"
                  />
                  
                  {/* Content */}
                  <div className="flex-1">
                    <p className="text-sm text-gray-200 leading-snug">
                      <span className="font-bold text-white">{notif.sender?.username}</span>{" "}
                      {notif.message}
                    </p>
                    
                    {/* Timestamp & Icon */}
                    <div className="flex items-center gap-2 mt-2">
                      {getIcon(notif.type)}
                      <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">
                        {new Date(notif.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Unread Indicator Dot */}
                  {!notif.isRead && (
                    <div className="w-2 h-2 rounded-full bg-yellow-500 mt-1 shrink-0 shadow-[0_0_8px_rgba(234,179,8,0.8)]"></div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;