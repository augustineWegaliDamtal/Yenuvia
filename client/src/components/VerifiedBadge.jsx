// components/VerifiedBadge.jsx
import React from "react";

const VerifiedBadge = ({ verified }) => {
  if (!verified) return null;

  return (
    <span
      className="verified-badge"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "16px",                  // Slight size bump for visibility
        height: "16px",
        marginLeft: "4px",              // Maintain snug positioning
        backgroundColor: "#1877F2",     // Premium Facebook Blue
        color: "white",
        
        // --- THIS PART CREATES THE SERRATED STARBURST SHAPE ---
        clipPath: "polygon(50% 0%, 61.8% 12.3%, 78.4% 5.8%, 81.3% 22.9%, 97.4% 28.1%, 90.9% 44.8%, 100% 59.8%, 86.8% 70.8%, 86.8% 88.5%, 70.3% 90.1%, 61.1% 100%, 50% 90.3%, 38.9% 100%, 29.7% 90.1%, 13.2% 88.5%, 13.2% 70.8%, 0% 59.8%, 9.1% 44.8%, 2.6% 28.1%, 18.7% 22.9%, 21.6% 5.8%, 38.2% 12.3%)",
        
        boxShadow: "0 0 0 1px #fff",  // White outline
      }}
      title="Verified Account"
    >
      {/* 🔥 Flawless, perfectly proportioned vector checkmark */}
      <svg 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="4" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        style={{ width: "10px", height: "10px", marginTop: "1px" }}
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </span>
  );
};

export default VerifiedBadge;