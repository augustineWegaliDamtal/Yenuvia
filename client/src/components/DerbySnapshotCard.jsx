import React, { useState, useEffect } from 'react';
import { Trophy, Swords, Flame, ArrowRight, Shield, Zap, Timer, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import customFetch from '../util/customFetch.js';

const DerbySnapshotCard = ({ liveUpdateTrigger }) => {
  const navigate = useNavigate();
  const [cardState, setCardState] = useState({ type: "LOADING", data: null });

  useEffect(() => {
    const fetchCardData = async () => {
      try {
        const cacheBuster = Date.now();
        // Consuming the exact same unified endpoint your HeroBanner uses for matching state
        const res = await customFetch(`/api/matches/hero-banner?_t=${cacheBuster}`);
        const json = await res.json();

        if (json.success) {
          if (json.type === "LIVE") {
            // Sort contenders by stake points for the leaderboard layout
            const sortedContenders = json.data.contenders.sort((a, b) => b.totalStaked - a.totalStaked);
            const mappedLeaderboard = sortedContenders.map((contender, index) => ({
              rank: index + 1,
              school: contender.school,
              points: contender.totalStaked || 0,
              logoUrl: contender.logoUrl,
              username: contender.artistId?.username || "artist"
            }));
            
            setCardState({ 
              type: "LIVE", 
              data: { ...json.data, leaderboard: mappedLeaderboard } 
            });
          } else {
            setCardState({ type: json.type, data: json.data });
          }
        } else {
          setCardState({ type: "EMPTY", data: null });
        }
      } catch (error) {
        console.error("Failed to sync derby snapshot:", error);
        setCardState({ type: "EMPTY", data: null });
      }
    };

    fetchCardData();
  }, [liveUpdateTrigger]);

  // ⏳ 1. LOADING STATE
  if (cardState.type === "LOADING") {
    return (
      <div className="w-full max-w-2xl mx-auto my-8 bg-[#0a0a0a] border border-white/5 rounded-[2rem] p-12 flex justify-center items-center">
        <Loader2 className="animate-spin text-zinc-600" size={32} />
      </div>
    );
  }

  // 📭 2. EMPTY STATE
  if (cardState.type === "EMPTY" || !cardState.data) return null;

  const match = cardState.data;

  // 🔴 3. ACTIVE LIVE DERBY MODE
  if (cardState.type === "LIVE") {
    return (
      <div className="w-full max-w-2xl mx-auto my-8 relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-yellow-500 rounded-[2.5rem] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
        
        <div className="relative bg-[#0a0a0a] border border-white/10 rounded-[2rem] p-6 sm:p-8 overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-red-500/10 p-2.5 rounded-xl border border-red-500/20">
                <Swords size={24} className="text-red-500" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black italic uppercase tracking-tighter text-white">
                  Live <span className="text-red-500">Derby</span>
                </h2>
                <p className="text-[10px] sm:text-xs text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                  National Creator Standings
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-red-500 text-[10px] font-black uppercase tracking-widest animate-pulse">
              <Flame size={14} /> Live
            </div>
          </div>

          <div className="space-y-3 mb-8">
            {match.leaderboard.map((team, index) => (
              <div key={team.school} className={`flex items-center justify-between p-4 rounded-2xl border ${index === 0 ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-white/5 border-white/5'}`}>
                <div className="flex items-center gap-4">
                  <span className={`text-lg font-black ${index === 0 ? 'text-yellow-500' : 'text-gray-500'}`}>
                    #{team.rank}
                  </span>

                  {team.logoUrl ? (
                    <img src={team.logoUrl} alt={`${team.school} Crest`} className="w-8 h-8 object-contain drop-shadow-md" />
                  ) : (
                    <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
                      <Shield size={16} className="text-gray-400" />
                    </div>
                  )}

                  <div>
                    <span className={`text-sm sm:text-base font-black uppercase tracking-widest block ${index === 0 ? 'text-white' : 'text-gray-300'}`}>
                      {team.school}
                    </span>
                    <span className="text-[9px] font-bold text-zinc-500 block">@{team.username}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {index === 0 && <Trophy size={16} className="text-yellow-500" />}
                  <span className="text-xs sm:text-sm font-bold font-mono text-gray-300">
                    {team.points.toLocaleString()} PTS
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* 🔥 Redirects down into the active match experience arena */}
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent("switchTab", { detail: "schools" }))}
            className="w-full bg-red-600 hover:bg-red-500 text-white px-6 py-4 rounded-xl font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-[0_0_20px_rgba(220,38,38,0.2)]"
          >
            <Swords size={16} /> Enter Derby Arena <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  // 🟡 4. FALLBACK FIXTURE MODE (WHEN THERE IS NO LIVE MATCH)
  return (
    <div className="w-full max-w-2xl mx-auto my-8 relative group">
      <div className="absolute -inset-1 bg-gradient-to-r from-yellow-600 to-amber-500 rounded-[2.5rem] blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
      
      <div className="relative bg-[#050505] border border-yellow-500/20 rounded-[2rem] p-6 sm:p-8 overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-500/10 p-2.5 rounded-xl border border-yellow-500/20">
              <Zap size={20} className="text-yellow-500" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black italic uppercase tracking-tighter text-white">
                Upcoming <span className="text-yellow-500">Fixture</span>
              </h2>
              <p className="text-[10px] sm:text-xs text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                {match.league} League Directive Running
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] font-black uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-md border border-white/5">
            <Timer size={12} className="text-zinc-400" /> 
            Closes: {new Date(match.endTime || match.startTime).toLocaleDateString()}
          </div>
        </div>

        {/* Big styled prompt text container */}
        <div className="bg-black/40 border border-white/5 rounded-2xl p-6 mb-8 text-center">
          <p className="text-zinc-500 text-[9px] font-black tracking-widest uppercase mb-2">Current Creative Objective</p>
          <h3 className="text-white text-base sm:text-lg font-black italic tracking-tight leading-relaxed">
            "{match.directive}"
          </h3>
        </div>

        {/* Action Button points directly to the submissions page to pitch on the pending challenge */}
        <button 
          onClick={() => navigate('/uploads')}
          className="w-full bg-zinc-900 hover:bg-yellow-500 hover:text-black border border-white/10 text-white px-6 py-4 rounded-xl font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          Submit Your Draft Entry <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default DerbySnapshotCard;