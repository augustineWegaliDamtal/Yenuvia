import React from "react";
// 🟢 NEW: Import the smart component we just built!
import NotificationBell from "./NotificationBell"; 
import { useEffect } from "react";

const TopNav = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: "forYou", label: "Arena" },
    { id: "schools", label: "DERBY" },
    { id: "professional", label: "Pro" },
  ];
  useEffect(() => {
    const handleTabSwitch = (e) => setActiveTab(e.detail);
    window.addEventListener("switchTab", handleTabSwitch);
    return () => window.removeEventListener("switchTab", handleTabSwitch);
  }, [setActiveTab]);

  return (
    <div className="flex items-center justify-between px-4 bg-black/80 backdrop-blur-md sticky top-0 z-[100] border-b border-white/5 shadow-2xl">
      
      {/* 🚀 TAB NAVIGATION */}
      <div className="flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative py-4 px-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${
              activeTab === tab.id 
                ? "text-yellow-500 italic" 
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-yellow-500 shadow-[0_-4px_10px_#eab308]" />
            )}
          </button>
        ))}
      </div>

      {/* 🔔 THE NEW SMART NOTIFICATION BELL */}
      <div className="py-2">
        <NotificationBell />
      </div>
      
    </div>
  );
};

export default TopNav;