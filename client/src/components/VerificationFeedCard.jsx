import React, { useState } from 'react';
import { ShieldCheck, ArrowRight, CheckCircle2, Loader2, Star } from 'lucide-react';
import { useSelector } from 'react-redux';
import customFetch from '../util/customFetch.js';

const VerificationFeedCard = () => {
  const { currentUserArtist } = useSelector((state) => state.artist);
  const [loading, setLoading] = useState(false);
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' or 'annually'

  // If they are not logged in, or already verified, hide the card completely
  if (!currentUserArtist || currentUserArtist.verified) {
    return null; 
  }

  const handleSubscribe = async (e) => {
    e.stopPropagation();
    try {
      setLoading(true);
      // Calls the new subscription route in your verificationController
      const response = await customFetch("/api/payments/verify/initiate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentUserArtist.token}`, 
        },
        body: JSON.stringify({ cycle: billingCycle }),
      });

      const data = await response.json();

      if (data.success) {
        // Redirect straight to Paystack checkout!
        window.location.href = data.authorization_url;
      } else {
        alert(data.message || "Failed to initialize secure checkout.");
      }
    } catch (err) {
      console.error(err);
      alert("Error contacting the Yenuvia gateway.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto my-8 relative group cursor-default">
      {/* GLOW EFFECT */}
      <div className="absolute -inset-1 bg-gradient-to-r from-yellow-600 to-yellow-400 rounded-[2.5rem] blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
      
      {/* MAIN CARD */}
      <div className="relative bg-[#0a0a0a] border border-white/10 rounded-[2rem] p-8 flex flex-col md:flex-row items-center gap-8 overflow-hidden">
        
        {/* ICON SHIELD */}
        <div className="relative flex-shrink-0">
          <div className="absolute inset-0 bg-yellow-500/20 blur-xl rounded-full"></div>
          <ShieldCheck size={80} strokeWidth={1} className="text-yellow-500 relative z-10" />
        </div>

        {/* TEXT CONTENT & TOGGLE */}
        <div className="flex-1 text-center md:text-left space-y-4">
          <div>
            <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white flex items-center justify-center md:justify-start gap-2">
              Yenuvia <span className="text-yellow-500 flex items-center">Pro <Star size={16} className="ml-1" fill="currentColor"/></span>
            </h2>
            <p className="text-sm text-gray-400 font-medium mt-1">
              Unlock the golden checkmark, 0% listing fees, and instant MoMo payouts.
            </p>
          </div>

          {/* 🟢 THE PRICING TOGGLE */}
          <div className="flex items-center justify-center md:justify-start gap-4 p-1 bg-white/5 rounded-xl inline-flex w-max mx-auto md:mx-0">
            <button 
              onClick={(e) => { e.stopPropagation(); setBillingCycle('monthly'); }}
              className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${billingCycle === 'monthly' ? 'bg-yellow-500 text-black' : 'text-gray-500 hover:text-white'}`}
            >
              Monthly
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); setBillingCycle('annually'); }}
              className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${billingCycle === 'annually' ? 'bg-yellow-500 text-black' : 'text-gray-500 hover:text-white'}`}
            >
              Annually <span className="text-[8px] bg-green-500 text-black px-1.5 py-0.5 rounded ml-1">-16%</span>
            </button>
          </div>
          
          {/* BENEFITS LIST */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2 items-center md:items-start justify-center md:justify-start">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold text-gray-500">
               <CheckCircle2 size={12} className="text-green-500" /> Fast MoMo Payouts
            </div>
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold text-gray-500">
               <CheckCircle2 size={12} className="text-green-500" /> Verified Badge
            </div>
          </div>
        </div>

        {/* 🚀 SUBSCRIBE BUTTON */}
        <button 
          onClick={handleSubscribe}
          disabled={loading}
          className="flex-shrink-0 bg-yellow-500 hover:bg-yellow-400 text-black px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>Processing <Loader2 size={16} className="animate-spin" /></>
          ) : (
            <>Get Verified <ArrowRight size={16} /></>
          )}
        </button>

      </div>
    </div>
  );
};

export default VerificationFeedCard;