import React from "react";
import BottomNav from "../components/BottomNav";

const AppLayout = ({ children }) => {
  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-black text-white">
      {/* Page content */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>

      {/* Persistent BottomNav */}
      <BottomNav />
    </div>
  );
};

export default AppLayout;
