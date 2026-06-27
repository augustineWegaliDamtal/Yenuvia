import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import confetti from "canvas-confetti"; 
import { Trophy, Home, CheckCircle2, Sparkles, Loader2 } from "lucide-react";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // 1. Get the reference from the URL Paystack sent back
  const reference = searchParams.get("reference");
  
  // 2. State for the data we will fetch
  const [amount, setAmount] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyAndGetAmount = async () => {
      if (!reference) {
        setLoading(false);
        return;
      }

      try {
        // 🚀 THE CRITICAL FIX: Added credentials: 'include'
        // This sends your cookies/token so the backend doesn't give a 404/401 error
        const res = await fetch(`/api/order/verify?reference=${reference}`, {
          method: 'GET',
          credentials: 'include', 
        });
        
        const data = await res.json();
        
        if (data.success) {
          // ✅ This updates the 0 to the actual price (e.g., 650)
          setAmount(data.amount); 
        } else {
          console.error("Backend Error:", data.message);
        }
      } catch (err) {
        console.error("Verification failed:", err);
      } finally {
        setLoading(false);
      }
    };

    verifyAndGetAmount();

    // 🎨 Arena Signature Confetti
    const duration = 3 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#EAB308", "#FFFFFF"]
      });
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#EAB308", "#000000"]
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, [reference]);

  return (
    <div className="h-screen bg-black flex flex-col items-center justify-center p-8 text-center overflow-hidden">
      
      {/* SUCCESS ICON */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", damping: 12 }}
        className="w-28 h-28 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-[0_20px_50px_rgba(234,179,8,0.3)]"
      >
        <CheckCircle2 className="w-14 h-14 text-black" strokeWidth={3} />
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="space-y-2"
      >
        <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter leading-none">
          Acquisition <span className="text-yellow-500">Complete!</span>
        </h1>
        <p className="text-zinc-500 font-bold text-[10px] uppercase tracking-[0.4em]">
          Transaction: {reference ? reference.slice(0, 10) : "PROCESSING"}...
        </p>
      </motion.div>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mt-8 bg-zinc-900/50 border border-white/5 p-6 rounded-[2rem] w-full max-w-xs backdrop-blur-md"
      >
        <p className="text-zinc-400 text-xs font-medium italic">
          "The masterpiece is officially yours. The artist has been notified and is preparing your delivery."
        </p>
        
        <div className="mt-6 pt-6 border-t border-white/5 flex justify-between items-center">
            <div className="text-left">
                <p className="text-[8px] font-black text-zinc-500 uppercase">Paid</p>
                <div className="text-xl font-black text-white flex items-center gap-2">
                  {loading ? (
                    <Loader2 size={16} className="animate-spin text-yellow-500" />
                  ) : (
                    `GHS ${amount || "0"}`
                  )}
                </div>
            </div>
            <div className="bg-yellow-500/10 p-3 rounded-2xl">
                <Sparkles className="text-yellow-500" size={20} />
            </div>
        </div>
      </motion.div>

      {/* FOOTER ACTIONS */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-12 flex flex-col gap-4 w-full max-w-xs"
      >
        <button
          onClick={() => navigate("/home")}
          className="w-full bg-white text-black py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl"
        >
          <Home size={16} /> Return to Feed
        </button>
        
        <button
          onClick={() => navigate("/profile")}
          className="w-full bg-zinc-900 text-zinc-400 py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-2 hover:text-white transition-all"
        >
          <Trophy size={16} /> View My Collection
        </button>
      </motion.div>

      <p className="mt-8 text-[9px] text-zinc-600 font-bold uppercase tracking-widest">
        A copy of your receipt has been sent to your email.
      </p>
    </div>
  );
};

export default PaymentSuccess;