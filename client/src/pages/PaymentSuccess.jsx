import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import confetti from "canvas-confetti"; 
import { Trophy, Home, CheckCircle2, Sparkles, Loader2, AlertTriangle } from "lucide-react";
import customFetch from "../util/customFetch.js";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const reference = searchParams.get("reference");
  
  const [amount, setAmount] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // 🔍 ADDED: A state to catch and display backend errors on the phone
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    const verifyAndGetAmount = async () => {
      if (!reference) {
        setErrorMsg("No transaction reference found in URL.");
        setLoading(false);
        return;
      }

      try {
        const res = await customFetch(`/api/order/verify?reference=${reference}`, {
          // Double check your backend: Is your verify route definitely a GET request? 
          // (Some devs use POST for verifications)
          method: 'GET',
          credentials: 'include', 
        });
        
        // Safety check to ensure the backend didn't crash and return an HTML page
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            throw new Error("Server crashed or returned HTML instead of JSON.");
        }

        const data = await res.json();
        
        if (data.success) {
          setAmount(data.amount); 
          
          // 🎉 MOVED: Confetti now ONLY plays if the backend confirms the payment
          triggerConfetti();
        } else {
          // Show the exact backend error message on the screen
          setErrorMsg(data.message || "Backend returned success: false");
        }
      } catch (err) {
        // Show network or parsing errors on the screen
        setErrorMsg(err.message || "Failed to fetch verification data.");
      } finally {
        setLoading(false);
      }
    };

    verifyAndGetAmount();
  }, [reference]);

  const triggerConfetti = () => {
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
  };

  return (
    <div className="h-screen bg-black flex flex-col items-center justify-center p-8 text-center overflow-hidden">
      
      {/* Dynamic Icon based on Error State */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", damping: 12 }}
        className={`w-28 h-28 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-2xl ${
          errorMsg 
            ? "bg-gradient-to-br from-red-500 to-red-900 shadow-red-500/30" 
            : "bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-yellow-500/30"
        }`}
      >
        {errorMsg ? (
           <AlertTriangle className="w-14 h-14 text-black" strokeWidth={3} />
        ) : (
           <CheckCircle2 className="w-14 h-14 text-black" strokeWidth={3} />
        )}
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="space-y-2"
      >
        <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter leading-none">
          {errorMsg ? (
            <>Verification <span className="text-red-500">Failed</span></>
          ) : (
            <>Acquisition <span className="text-yellow-500">Complete!</span></>
          )}
        </h1>
        <p className="text-zinc-500 font-bold text-[10px] uppercase tracking-[0.4em]">
          Transaction: {reference ? reference.slice(0, 10) : "UNKNOWN"}...
        </p>
      </motion.div>

      {/* 🔴 ERROR MESSAGE DISPLAY */}
      {errorMsg && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="mt-6 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl w-full max-w-xs text-xs font-bold"
        >
          {errorMsg}
        </motion.div>
      )}

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mt-8 bg-zinc-900/50 border border-white/5 p-6 rounded-[2rem] w-full max-w-xs backdrop-blur-md"
      >
        <p className="text-zinc-400 text-xs font-medium italic">
          {errorMsg 
            ? `"Your payment was processed, but we couldn't verify it with the server. Please contact support."` 
            : `"The masterpiece is officially yours. The artist has been notified and is preparing your delivery."`
          }
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
                <Sparkles className={`text-${errorMsg ? "red" : "yellow"}-500`} size={20} />
            </div>
        </div>
      </motion.div>

      {/* FOOTER ACTIONS */}
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
        className="mt-12 flex flex-col gap-4 w-full max-w-xs"
      >
        <button
          onClick={() => navigate("/home")}
          className="w-full bg-white text-black py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl"
        >
          <Home size={16} /> Return to Feed
        </button>
      </motion.div>
    </div>
  );
};

export default PaymentSuccess;