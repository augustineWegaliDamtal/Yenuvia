import React from "react";

const VerifiedBadge = ({ verified = true, size = 16, color = "#1877F2", className = "" }) => {
  if (!verified) return null;

  // Calculate icon size proportionally (roughly 60% of the badge size)
  const iconSize = Math.max(8, Math.floor(size * 0.6));

  return (
    <span
      className={`verified-badge inline-flex items-center justify-center shrink-0 ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: color,
        // Using filter drop-shadow instead of box-shadow so it doesn't get clipped!
        filter: "drop-shadow(0px 0px 1px rgba(0,0,0,0.5))",
        // The serrated starburst shape
        clipPath: "polygon(50% 0%, 61.8% 12.3%, 78.4% 5.8%, 81.3% 22.9%, 97.4% 28.1%, 90.9% 44.8%, 100% 59.8%, 86.8% 70.8%, 86.8% 88.5%, 70.3% 90.1%, 61.1% 100%, 50% 90.3%, 38.9% 100%, 29.7% 90.1%, 13.2% 88.5%, 13.2% 70.8%, 0% 59.8%, 9.1% 44.8%, 2.6% 28.1%, 18.7% 22.9%, 21.6% 5.8%, 38.2% 12.3%)",
      }}
      title="Verified Account"
    >
      <svg 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="4" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        style={{ width: `${iconSize}px`, height: `${iconSize}px`, marginTop: "1px" }}
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </span>
  );
};

export default VerifiedBadge;