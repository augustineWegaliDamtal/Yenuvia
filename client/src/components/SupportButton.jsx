import React, { useState } from "react";
import { PaystackButton } from "react-paystack"; // 🔥 FIX 1: Import the stable component
import { Loader2, ShieldCheck, CheckCircle2 } from "lucide-react";
import { useSelector } from "react-redux";
import customFetch from "../util/customFetch";

const SupportButton = ({ matchId, contenderId, schoolName, onComplete, theme = "yellow" }) => {
  const { currentUserArtist } = useSelector((state) => state.artist) || {}; 
  const { currentUser } = useSelector((state) => state.user) || {}; 
  const activeUser = currentUserArtist || currentUser;

  const [amount, setAmount] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const onSuccess = async (referenceObj) => {
    setIsVerifying(true);
    
    try {
      const res = await customFetch(`/api/matches/${matchId}/support`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${activeUser?.token}` 
        },
        body: JSON.stringify({
          reference: referenceObj.reference,
          contenderId: contenderId
        })
      });

      const data = await res.json();
      
      if (data.success) {
        setShowSuccess(true);
        setAmount("");
        if (onComplete) onComplete(); 
        
        setTimeout(() => setShowSuccess(false), 4000);
      } else {
        alert("Verification failed: " + data.message);
      }
    } catch (err) {
      console.error("Verification Error:", err);
      alert("Network error during verification. Contact support if you were charged.");
    } finally {
      setIsVerifying(false);
    }
  };

  const onClose = () => {
    console.log("Paystack modal closed.");
  };

  // 🔥 FIX 2: Pack all props securely into an object
  const paystackProps = {
    email: activeUser?.email || "damtal@yenuvia.com",
    amount: (Number(amount) || 0) * 100,
    publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
    currency: 'GHS',
    reference: `ARV_${new Date().getTime()}_${Math.floor(Math.random() * 1000)}`,
    onSuccess: onSuccess,
    onClose: onClose,
  };

  if (isVerifying) {
    return (
      <div className={`w-full border p-4 rounded-xl flex items-center justify-center gap-3 transition-all ${theme === 'yellow' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500' : 'bg-green-500/10 border-green-500/30 text-green-500'}`}>
        <Loader2 className="animate-spin" size={18} />
        <span className="text-[10px] font-black uppercase tracking-widest">Securing Funds...</span>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className={`w-full border p-4 rounded-xl flex items-center justify-center gap-3 transition-all shadow-[0_0_20px_rgba(0,0,0,0.5)] ${theme === 'yellow' ? 'bg-yellow-500/20 border-yellow-500 text-yellow-500' : 'bg-green-500/20 border-green-500 text-green-500'}`}>
        <CheckCircle2 size={18} />
        <span className="text-[10px] font-black uppercase tracking-widest">Boost Confirmed!</span>
      </div>
    );
  }

  return (
    <div className="w-full flex items-center gap-2 mt-3">
      <div className={`flex-1 flex items-center bg-black border rounded-xl px-3 transition-colors h-12 ${theme === 'yellow' ? 'border-white/10 focus-within:border-yellow-500' : 'border-white/10 focus-within:border-green-500'}`}>
        <span className="text-zinc-500 font-black text-xs">GHS</span>
        <input 
          type="number" 
          min="1"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full bg-transparent text-white font-bold px-2 outline-none text-right placeholder:text-zinc-700"
        />
      </div>

      {/* 🔥 FIX 3: Use PaystackButton to guarantee the callback fires */}
      <PaystackButton 
        {...paystackProps}
        className={`h-12 px-5 rounded-xl font-black text-[11px] uppercase tracking-widest active:scale-95 transition-all flex items-center gap-2 whitespace-nowrap text-black ${theme === 'yellow' ? 'bg-yellow-500 hover:bg-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.3)]' : 'bg-green-500 hover:bg-green-400 shadow-[0_0_15px_rgba(34,197,94,0.3)]'}`}
      >
        <ShieldCheck size={16} /> Pay
      </PaystackButton>
    </div>
  );
};

export default SupportButton;