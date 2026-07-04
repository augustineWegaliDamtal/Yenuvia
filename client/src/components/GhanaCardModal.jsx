import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { X, ShieldCheck, Loader2 } from "lucide-react";
import { SET_LIVE_ALERT } from "../redux/users/notificationsSlice";
import { artistUpdateUserSuccess } from "../redux/users/artistSlice";
import customFetch from "../util/customFetch.js";


const GhanaCardModal = ({ onClose, onSuccess }) => {
  const [cardNumber, setCardNumber] = useState("GHA-");
  const [isVerifying, setIsVerifying] = useState(false);
  const dispatch = useDispatch();
  
  // Grab whichever user is currently logged in
  const regularUser = useSelector((state) => state.user?.currentUser);
  const artistUser = useSelector((state) => state.artist?.currentUserArtist);
  const activeUser = regularUser || artistUser;

  const handleVerify = async (e) => {
    e.preventDefault();
    if (cardNumber.length < 10) {
      return dispatch(SET_LIVE_ALERT({ type: "error", title: "Invalid ID", message: "Please enter a valid Ghana Card number." }));
    }

    setIsVerifying(true);

    try {
      const res = await customFetch("/api/user/verify-ghana-card", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${activeUser.token}`,
        },
        body: JSON.stringify({ ghanaCardNumber: cardNumber }),
      });

      const data = await res.json();

      if (data.success) {
        // Update Redux state so the app instantly knows they are verified
        if (artistUser) dispatch(artistUpdateUserSuccess(data.user));
        // if (regularUser) dispatch(updateUserSuccess(data.user)); // Add this if you have a regular user slice

        dispatch(SET_LIVE_ALERT({ type: "success", title: "Identity Verified", message: "Your account is now secured." }));
        
        // Trigger whatever action they were trying to do (like continuing to checkout)
        if (onSuccess) onSuccess(); 
        onClose();
      } else {
        dispatch(SET_LIVE_ALERT({ type: "error", title: "Verification Failed", message: data.message }));
      }
    } catch (err) {
      dispatch(SET_LIVE_ALERT({ type: "error", title: "Network Error", message: "Failed to connect to verification servers." }));
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl w-full max-w-md p-6 relative shadow-2xl">
        
        {/* Close Button */}
        <button onClick={onClose} disabled={isVerifying} className="absolute top-4 right-4 p-2 bg-white/5 rounded-full text-zinc-400 hover:text-white transition-colors">
          <X size={20} />
        </button>

        <div className="flex flex-col items-center text-center mt-4">
          <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/30 rounded-full flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
            <ShieldCheck size={32} className="text-blue-500" />
          </div>
          
          <h2 className="text-white font-black italic uppercase text-xl tracking-tighter mb-2">
            Identity Verification
          </h2>
          <p className="text-zinc-400 text-xs font-medium leading-relaxed px-4 mb-6">
            To protect our community and secure physical deliveries, you must verify your identity with a valid Ghana Card before proceeding.
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">
              Ghana Card Number
            </label>
            <input
              type="text"
              value={cardNumber}
              onChange={(e) => {
  const inputValue = e.target.value.toUpperCase();
  if (inputValue.startsWith("GHA-")) {
    setCardNumber(inputValue);
  } else if (inputValue.length < 4) {
    setCardNumber("GHA-");
  }
}}
              placeholder="GHA-000000000-0"
              disabled={isVerifying}
              className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white font-black tracking-widest outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={isVerifying}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-xs py-4 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {isVerifying ? (
              <><Loader2 size={16} className="animate-spin" /> Verifying Identity...</>
            ) : (
              "Secure My Account"
            )}
          </button>
        </form>
        
        <p className="text-center text-[9px] text-zinc-600 font-bold uppercase tracking-widest mt-6">
          Secured by National ID Database
        </p>
      </div>
    </div>
  );
};

export default GhanaCardModal;