import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Zap, Swords, Timer, Loader2, Lock, ArrowRight } from "lucide-react";
import { Link, useNavigate } from 'react-router-dom';

const HeroBanner = ({ setActiveTab, liveUpdateTrigger }) => {
  const navigate = useNavigate();
  const activeUser = useSelector((state) => state.user?.currentUser || state.artist?.currentUserArtist || state.admin?.currentUser);
  
  const [bannerState, setBannerState] = useState({ type: "LOADING", data: null });
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!activeUser) return;

    const fetchHero = async () => {
      try {
        const cacheBuster = Date.now();
        const res = await fetch(`/api/matches/hero-banner?_t=${cacheBuster}`);
        
        const json = await res.json();
        if (json.success) setBannerState({ type: json.type, data: json.data });
      } catch (err) {
        console.error(err);
        setBannerState({ type: "EMPTY", data: null });
      }
    };
    fetchHero();
  }, [activeUser, liveUpdateTrigger]); 

  // --- 🔒 GUEST STATE: SIGN IN CTA ---
  if (!activeUser) {
    return (
      <div className="bg-gradient-to-br from-[#0a0a0a] to-black border border-white/5 rounded-2xl p-4 mb-3 relative overflow-hidden shadow-xl flex flex-col items-center text-center group cursor-pointer"
           onClick={() => navigate('/signin')}>
        <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-500/5 blur-[40px] rounded-full" />
        
        <div className="bg-white/5 p-1.5 rounded-xl mb-2 border border-white/10 group-hover:border-yellow-500/50 transition-all">
          <Lock size={14} className="text-zinc-500 group-hover:text-yellow-500 transition-colors" />
        </div>

        <h3 className="text-white font-black italic uppercase tracking-tighter text-sm mb-1">
          Unlock the Yenuvia
        </h3>
        <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest max-w-[200px] leading-relaxed mb-2">
          Sign in to view active fixtures, school directives, and support your favorites.
        </p>

        <button className="flex items-center gap-1.5 text-yellow-500 font-black uppercase text-[9px] tracking-[0.2em] group-hover:gap-2 transition-all">
          Sign In to Participate <ArrowRight size={12} />
        </button>
      </div>
    );
  }

  // --- ⏳ LOADING STATE ---
  if (bannerState.type === "LOADING") {
    return <div className="flex justify-center p-4 mb-3"><Loader2 className="animate-spin text-zinc-600 size-5"/></div>;
  }
  
  // --- 📭 EMPTY STATE ---
  if (bannerState.type === "EMPTY") return null;

  const match = bannerState.data;

  // --- 🔴 STATE 1: LIVE DERBY (REVENUE MODE) ---
  if (bannerState.type === "LIVE") {
    return (
      <div className="bg-gradient-to-br from-black to-[#0a0a0a] border border-red-600/30 rounded-2xl p-3 mb-3 relative overflow-hidden shadow-2xl group">
        <div className="absolute top-0 right-0 w-20 h-20 bg-red-600/10 blur-[40px] rounded-full group-hover:bg-red-600/20 transition-all" />
        
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-2">
            <span className="flex items-center gap-1.5 bg-red-600/20 text-red-500 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border border-red-600/30">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" /> LIVE DERBY
            </span>
            <span className="text-yellow-500 font-black text-[9px] uppercase tracking-widest bg-yellow-500/10 px-2 py-0.5 rounded-lg border border-yellow-500/20">
               GHS {match.totalPool?.toLocaleString() || 0} BOUNTY
            </span>
          </div>

          <div className="flex items-center justify-between mt-1.5 bg-black/40 p-2 rounded-xl border border-white/5">
            <div className="text-left w-[40%]">
               <h3 className="text-white font-black italic uppercase text-xs truncate">{match.contenders[0]?.school}</h3>
               <p className="text-yellow-500 text-[8px] font-bold mt-0.5">@{match.contenders[0]?.artistId?.username}</p>
            </div>
            <div className="bg-black p-1.5 rounded-full border border-white/10 shrink-0 z-10 shadow-[0_0_10px_rgba(0,0,0,0.5)]">
               <Swords size={12} className="text-zinc-500" />
            </div>
            <div className="text-right w-[40%]">
               <h3 className="text-white font-black italic uppercase text-xs truncate">{match.contenders[1]?.school}</h3>
               <p className="text-green-500 text-[8px] font-bold mt-0.5">@{match.contenders[1]?.artistId?.username}</p>
            </div>
          </div>

          <button 
            onClick={() => window.dispatchEvent(new CustomEvent("switchTab", { detail: "schools" }))}
            className="w-full mt-2.5 bg-red-600 hover:bg-red-500 text-white py-2 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-[0_0_15px_rgba(220,38,38,0.3)] active:scale-95 transition-all"
          >
            Enter Derby to Support
          </button>
        </div>
      </div>
    );
  }

  // --- 🟡 STATE 2: DIRECTIVE (SUPPLY MODE) ---
  return (
    <div className="bg-[#050505] border border-yellow-500/20 rounded-2xl p-3  mb-3 relative overflow-hidden shadow-xl group">
      <div className="absolute -top-6 -right-6 w-24 h-24 bg-yellow-500/10 blur-[40px] rounded-full group-hover:bg-yellow-500/20 transition-all" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-1.5 mb-1.5">
          <div className="bg-yellow-500/20 p-1 rounded-md">
            <Zap size={10} className="text-yellow-500" />
          </div>
          <span className="text-[8px] font-black uppercase tracking-[0.2em] text-yellow-500">
            {match.league} LEAGUE DIRECTIVE
          </span>
        </div>

        <div>
          <h3 className={`text-white text-sm font-black italic tracking-tight leading-snug mb-0.5 transition-all duration-300 ${!isExpanded ? 'line-clamp-2' : ''}`}>
            "{match.directive}"
          </h3>
          
          {match.directive?.length > 60 && (
            <button 
              onClick={(e) => {
                e.preventDefault(); 
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="text-yellow-500 text-[9px] font-black uppercase tracking-widest mt-0.5 hover:underline cursor-pointer"
            >
              {isExpanded ? "SEE LESS" : "SEE MORE"}
            </button>
          )}
        </div>

        <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5">
          <div className="flex items-center gap-1.5 text-zinc-500 text-[8px] font-black uppercase tracking-widest bg-white/5 px-2 py-1 rounded-md">
            <Timer size={10} className="text-zinc-400" /> 
            CLOSES: {new Date(match.endTime || match.startTime).toLocaleDateString()}
          </div>
          <Link to='/uploads'>
            <button className="bg-white/10 hover:bg-yellow-500 hover:text-black text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all">
            Submit Draft
          </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HeroBanner;