import React from "react";
import BottomNav from "../components/BottomNav";

const MainLayout = ({ children }) => {
  return (
    <div className="pb-16 max-w-md mx-auto">
      {/* Page content */}
      {children}

      {/* Global BottomNav */}
      <BottomNav />
    </div>
  );
};

export default MainLayout;
