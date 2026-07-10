import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShoppingBag, 
  CheckCircle2, 
  Sparkles, 
  Loader2, 
  User, 
  ArrowLeft,
  ShieldCheck,
  Info
} from "lucide-react";
import CheckoutModal from "./CheckoutModal";
import customFetch from "../util/customFetch";

const WorkDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [work, setWork] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCheckout, setShowCheckout] = useState(false);

  useEffect(() => {
    const fetchWork = async () => {
      try {
        setLoading(true);
        // Hits Zone 6 of your Routes
        const res = await customFetch(`/api/work/${id}`);
        const data = await res.json();
        
        if (data.success) {
          setWork(data.work);
        }
      } catch (err) {
        console.error("Arena Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchWork();
  }, [id]);

  // 1. 🛡️ LOADING GUARD
  if (loading) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-yellow-500 mb-4" size={40} />
        <p className="text-zinc-500 font-black uppercase text-[10px] tracking-[0.3em]">Unveiling Masterpiece...</p>
      </div>
    );
  }

  // 2. 🛑 NOT FOUND
  if (!work) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center p-10 text-center">
        <h1 className="text-white font-black italic uppercase text-2xl mb-2">Not Found</h1>
        <button onClick={() => navigate(-1)} className="text-yellow-500 font-bold uppercase text-[10px] flex items-center gap-2">
          <ArrowLeft size={14}/> Return to Showroom
        </button>
      </div>
    );
  }

  // ✅ 3. Determine Media Type safely (Firebase compatible)
  const mainMediaUrl = work.mediaUrls?.[0] || work.mediaUrl;
  const isVideo = mainMediaUrl?.match(/\.(mp4|webm|ogg|mov)/i);

  return (
    // 🔥 Kept your massive bottom padding for the main wrapper
 
    <div className="h-[100dvh] overflow-y-auto bg-black text-white p-6 pb-40 overflow-x-hidden relative">
      
      {/* NAVIGATION */}
      <div className="flex justify-between items-center mb-8">
        <button onClick={() => navigate(-1)} className="p-4 bg-zinc-900/50 rounded-full border border-white/5 text-zinc-400">
          <ArrowLeft size={20} />
        </button>
        {work.isForSale && (
          <div className="flex items-center gap-2 bg-yellow-500/10 px-4 py-2 rounded-full border border-yellow-500/20">
            <ShieldCheck className="text-yellow-500" size={14} />
            <span className="text-[9px] font-black uppercase text-yellow-500 tracking-tighter">Marketplace Verified</span>
          </div>
        )}
      </div>

      {/* MEDIA */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-[3rem] overflow-hidden shadow-2xl mb-10 border border-white/10 bg-zinc-900 relative"
      >
        {/* ✅ Dynamic Rendering: Video vs Image */}
        {isVideo ? (
          <video 
            src={mainMediaUrl} 
            autoPlay 
            loop 
            controls // 🔥 ADDED: Gives the user play, pause, and volume controls
            playsInline
            className="w-full h-auto min-h-[350px] object-cover bg-black" 
          />
        ) : (
          <img 
            src={mainMediaUrl} 
            className="w-full h-auto min-h-[350px] object-cover" 
            alt={work.title} 
          />
        )}
      </motion.div>

      {/* CONTENT */}
      {/* 🔥 THE FIX: Added pb-32 to create a massive safe zone at the bottom of the text */}
      <div className="space-y-8 pb-32">
        <div className="flex justify-between items-start">
          <div className="max-w-[70%]">
            <h1 className="text-5xl font-black italic uppercase tracking-tighter leading-none mb-4">{work.title}</h1>
            <span className="px-4 py-2 bg-zinc-900 border border-white/5 rounded-full text-[9px] font-black uppercase text-zinc-400">
              {work.category}
            </span>
          </div>
          {work.isForSale && (
            <div className="text-right">
              <p className="text-3xl font-black italic text-white">GHS {work.price}</p>
              <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest mt-2">Sale Price</p>
            </div>
          )}
        </div>

        <p className="text-zinc-400 text-base leading-relaxed italic border-l-2 border-yellow-500/30 pl-6 py-2">
          "{work.description}"
        </p>

        {/* ARTIST INFO */}
        <div className="bg-zinc-900/40 p-6 rounded-[2.5rem] flex items-center justify-between border border-white/5 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-zinc-800 rounded-full flex items-center justify-center border border-white/10 overflow-hidden">
              {work.artistId?.avatar ? (
                <img src={work.artistId.avatar} className="w-full h-full object-cover" alt="avatar" />
              ) : (
                <User className="text-zinc-600" size={24} />
              )}
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 font-black uppercase mb-1">Created By</p>
              <p className="text-lg font-black text-white uppercase">{work.artistId?.username || "Yenuvia Creator"}</p>
              <p className="text-[10px] text-yellow-500/60 font-bold uppercase mt-1">{work.artistId?.school || "Yenuvia"}</p>
            </div>
          </div>
          <Sparkles className="text-yellow-500/10" size={32} />
        </div>
      </div>

      {/* 🛒 CONDITIONAL ACTION BUTTON */}
      {/* 🔥 THE FIX: Added a fade gradient at the bottom so text scrolling behind it looks seamless */}
      <div className="fixed bottom-0 left-0 right-0 p-6 pb-10 z-50 flex justify-center bg-gradient-to-t from-black via-black/90 to-transparent pointer-events-none">
        
        {/* Add pointer-events-auto back ONLY to the buttons so the gradient doesn't block clicks */}
        <div className="w-full max-w-md pointer-events-auto flex justify-center mt-8">
          {work.isForSale ? (
            <motion.button 
              whileTap={{ scale: 0.95 }}
              onClick={() => !work.isSold && setShowCheckout(true)}
              disabled={work.isSold}
              className={`w-full py-7 rounded-[2.5rem] font-black uppercase tracking-[0.3em] text-[11px] transition-all shadow-[0_25px_50px_rgba(0,0,0,0.8)] flex items-center justify-center gap-3 border ${
                work.isSold 
                ? "bg-zinc-900 text-zinc-600 border-white/5 cursor-not-allowed" 
                : "bg-white text-black border-transparent"
              }`}
            >
              {work.isSold ? (
                <><CheckCircle2 size={18}/> Masterpiece Sold</>
              ) : (
                <><ShoppingBag size={18}/> Acquire Now — GHS {work.price}</>
              )}
            </motion.button>
          ) : (
            /* DISPLAY ONLY FOR PORTFOLIO ITEMS */
            <div className="bg-zinc-900/90 backdrop-blur-xl border border-white/10 px-10 py-5 rounded-full flex items-center gap-3 shadow-[0_20px_40px_rgba(0,0,0,0.8)]">
              <Sparkles className="text-yellow-500" size={16} />
              <span className="text-[10px] font-black uppercase text-white tracking-[0.2em]">Exhibition Piece</span>
            </div>
          )}
        </div>

      </div>

      {showCheckout && (
        <CheckoutModal isOpen={showCheckout} onClose={() => setShowCheckout(false)} work={work} />
      )}
    </div>
  );
};

export default WorkDetail;