// components/VerifyAccountButton.jsx
import React, { useState } from "react";

const VerifyAccountButton = ({ verified }) => {
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/payments/verify/initiate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        // Redirect to Paystack checkout
        window.location.href = data.authorization_url;
      } else {
        alert("Failed to initiate verification payment");
      }
    } catch (err) {
      console.error(err);
      alert("Error initiating verification");
    } finally {
      setLoading(false);
    }
  };

  if (verified) {
    return <span className="badge badge-success">Verified ✅</span>;
  }

  return (
    <button onClick={handleVerify} disabled={loading} className="text-slate-700 font-bold">
      {loading ? "Processing..." : "Verify Account"}
    </button>
  );
};

export default VerifyAccountButton;
