import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom"; // 🔥 Added for navigation
import { motion, AnimatePresence } from "framer-motion";
import { 
  Clock, TrendingUp, Swords, Flame, Loader2, 
  Zap, X, Maximize2, Trophy, Hourglass, Lock // 🔥 Added Lock icon
} from "lucide-react";
import SupportButton from "../components/SupportButton";
import { useSocket } from '../context/SocketContext'; 
import customFetch from "../util/customFetch.js";

// --- 🏆 THE UPGRADED VICTORY CARD ---
const VictoryCard = ({ match }) => {
  const winner = match.contenders.find(c => 
    c.isWinner === true || 
    (match.winner && c._id.toString() === match.winner.toString())
  );
  
  const loser = match.contenders.find(c => c._id !== winner?._id);

  if (!winner) return null; 

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-yellow-500/10 to-black border border-yellow-500/30 rounded-2xl p-4 mb-4 flex items-center justify-between shadow-[0_0_20px_rgba(234,179,8,0.1)]"
    >
      <div className="flex items-center gap-4 overflow-hidden pr-2">
        <div className="bg-yellow-500 text-black p-3 rounded-xl shadow-lg shrink-0">
          <Trophy size={24} />
        </div>
        <div className="min-w-0">
          <p className="text-yellow-500 text-[10px] font-black uppercase tracking-widest mb-0.5">Round Winner</p>
          <h3 className="text-white font-black text-sm sm:text-lg italic uppercase leading-none truncate">{winner.school}</h3>
          {loser && <p className="text-zinc-400 text-[9px] font-bold uppercase mt-1 truncate">Defeated {loser.school}</p>}
        </div>
      </div>
      <div className="text-right shrink-0 pl-2">
        <p className="text-zinc-500 text-[9px] font-black uppercase tracking-widest">Funds Secured</p>
        <p className="text-green-500 font-black text-sm">GHS {match.totalPool?.toLocaleString()}</p>
      </div>
    </motion.div>
  );
};

// --- 🥊 THE INDIVIDUAL MATCH CARD COMPONENT (LIVE MATCHES) ---
const DerbyMatchCard = ({ match, activeUser, onSupportSuccess }) => {
  const [playingVideo, setPlayingVideo] = useState(null);
  const socket = useSocket();
  const [livePool, setLivePool] = useState(match.totalPool);
  const [liveContenders, setLiveContenders] = useState(match.contenders);

  useEffect(() => {
    if (!socket) return;
    socket.emit("join_match", match._id);

    const handlePoolUpdate = (data) => {
      if (data.matchId === match._id) {
        setLivePool(data.newTotalPool);
        setLiveContenders(data.contenders);
      }
    };

    socket.on("pool_updated", handlePoolUpdate);
    return () => {
      socket.off("pool_updated", handlePoolUpdate);
    };
  }, [socket, match._id]);

  const contenderA = liveContenders[0];
  const contenderB = liveContenders[1];
  const percentA = livePool > 0 && contenderA ? Math.round((contenderA.totalStaked / livePool) * 100) : 50;
  const percentB = livePool > 0 && contenderB ? Math.round((contenderB.totalStaked / livePool) * 100) : 50;

  if (!contenderA || !contenderB) return null;

  return (
    <div className="bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-5 shadow-2xl w-full mb-8 font-sans transition-all hover:border-white/20">
      
      {/* HEADER */}
      <div className="flex justify-between items-start mb-5">
        <div className="flex-1 pr-4">
          <span className="text-red-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 mb-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_#ef4444]" /> LIVE DERBY
          </span>
          <h2 className="text-white text-sm font-bold leading-tight line-clamp-2 italic tracking-tight">
             <Zap size={12} className="inline mr-1 text-yellow-500" /> {match.directive}
          </h2>
        </div>
        <div className="bg-white/5 border border-white/10 px-3 py-2 rounded-xl text-center shrink-0 min-w-[80px]">
          <Clock size={14} className="text-yellow-500 mx-auto mb-1" />
          <p className="text-white text-[8px] font-black uppercase tracking-widest leading-none">CLOSES SOON</p>
        </div>
      </div>

      {/* THE CROWDFUND PROGRESS BAR */}
      <div className="mb-6 bg-black/40 p-3 rounded-2xl border border-white/5">
        <div className="flex justify-between text-[9px] font-black uppercase tracking-[0.15em] mb-2">
          <span className="text-yellow-500 truncate pr-2">{contenderA.school} ({percentA}%)</span>
          <span className="text-green-500 truncate pl-2">({percentB}%) {contenderB.school}</span>
        </div>
        <div className="w-full h-1.5 rounded-full flex overflow-hidden bg-zinc-800">
          <motion.div initial={{ width: 0 }} animate={{ width: `${percentA}%` }} className="h-full bg-yellow-500 shadow-[0_0_10px_#eab308]" />
          <motion.div initial={{ width: 0 }} animate={{ width: `${percentB}%` }} className="h-full bg-green-500 shadow-[0_0_10px_#22c55e]" />
        </div>
        <div className="text-center mt-3 flex items-center justify-center gap-2">
          <TrendingUp size={14} className="text-zinc-500" />
          <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest">
            TOTAL Support Funds: <span className="text-white">GHS {livePool.toLocaleString()}</span>
          </span>
        </div>
      </div>

      {/* THE BATTLE VISUALS */}
      <div className="flex items-center gap-2 mb-6">
        {[contenderA, contenderB].map((contender, idx) => (
          <React.Fragment key={contender._id}>
            <div 
              onClick={() => setPlayingVideo(contender)} 
              className={`flex-1 relative group rounded-2xl overflow-hidden border-2 transition-all h-48 bg-zinc-900 cursor-pointer ${idx === 0 ? 'hover:border-yellow-500' : 'hover:border-green-500'}`}
            >
               {contender.workId?.mediaUrls?.[0] ? (
                 <>
                   <video 
                     src={contender.workId.mediaUrls[0]} 
                     className="w-full h-full object-cover opacity-50 group-hover:opacity-80 transition-opacity" 
                     loop muted autoPlay playsInline 
                   />
                   <div className="absolute inset-0 flex items-center justify-center">
                     <div className="bg-black/40 backdrop-blur-sm p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
                        <Maximize2 className="text-white" size={20} />
                     </div>
                   </div>
                 </>
               ) : (
                 <div className="w-full h-full flex items-center justify-center bg-zinc-950 text-zinc-800 font-black uppercase text-[8px]">No Media</div>
               )}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent pointer-events-none" />
              <div className={`absolute bottom-3 ${idx === 0 ? 'left-3' : 'right-3 text-right'} pointer-events-none`}>
                <h3 className="text-white font-black text-sm sm:text-lg italic uppercase tracking-tighter leading-none">{contender.school}</h3>
              </div>
            </div>
            {idx === 0 && <div className="shrink-0 bg-black p-2 rounded-full border border-white/10 z-10 -mx-4 shadow-2xl"><Swords size={18} className="text-white" /></div>}
          </React.Fragment>
        ))}
      </div>

      {/* SUPPORT ENGINE */}
      <div className="bg-white/5 p-4 rounded-3xl border border-white/10">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3 text-center">
          Support your best Work
        </h4>
        <div className="flex flex-col gap-1">
          <SupportButton matchId={match._id} contenderId={contenderA._id} schoolName={contenderA.school} theme="yellow" onComplete={onSupportSuccess} />
          <SupportButton matchId={match._id} contenderId={contenderB._id} schoolName={contenderB.school} theme="green" onComplete={onSupportSuccess} />
        </div>
        <p className="mt-4 text-[8px] text-zinc-600 font-bold uppercase tracking-[0.1em] leading-relaxed text-center px-2">
          Funds generated will fund project development and student/school donations.
        </p>
      </div>

      {/* CINEMA MODE OVERLAY */}
      <AnimatePresence>
        {playingVideo && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="relative w-full max-w-lg aspect-[9/16] bg-zinc-900 rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl">
              <button onClick={() => setPlayingVideo(null)} className="absolute top-6 right-6 z-[100] bg-black/50 text-white p-3 rounded-full hover:bg-red-600 transition-all">
                <X size={24} />
              </button>
              <video src={playingVideo.workId.mediaUrls[0]} autoPlay controls playsInline className="w-full h-full object-cover" />
              <div className="absolute bottom-10 left-8 right-8 pointer-events-none">
                <p className="text-yellow-500 font-black uppercase text-xs mb-1 tracking-widest">{playingVideo.school}</p>
                <h3 className="text-white font-black text-2xl uppercase italic tracking-tighter">@{playingVideo.artistId?.username}</h3>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- 🏟️ THE MAIN LEAGUE SCREEN ---
const Schools = () => {
  // 1. ALL HOOKS AT THE TOP
  const [liveMatches, setLiveMatches] = useState([]);
  const [completedMatches, setCompletedMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeLeague, setActiveLeague] = useState("UNI");
  const [liveUpdateTrigger, setLiveUpdateTrigger] = useState(0);
  
  const activeUser = useSelector((state) => state.user?.currentUser || state.artist?.currentUserArtist);
  const navigate = useNavigate(); // 🔥 Setup Navigation
  const socket = useSocket();

  const fetchMatches = async () => {
    try {
      if (liveMatches.length === 0 && completedMatches.length === 0) setLoading(true);
      
      const res = await customFetch(`/api/matches?league=${activeLeague}&status=LIVE,COMPLETED`);
      const data = await res.json();
      
      if (data.success) {
        setLiveMatches(data.matches.filter(m => m.status === "LIVE"));
        setCompletedMatches(data.matches.filter(m => m.status === "COMPLETED").slice(0, 5));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 🔥 Guard: Don't waste server resources fetching if there's no user
    if (!activeUser) return; 
    fetchMatches();
  }, [activeLeague, liveUpdateTrigger, activeUser]);

  useEffect(() => {
    // 🔥 Guard: Don't attach socket listeners if there's no user
    if (!socket || !activeUser) return;

    const handleMatchStructuralChange = () => {
      console.log("Yenuvia Match structural update detected!");
      setLiveUpdateTrigger(prev => prev + 1);
    };

    socket.on("new_match", handleMatchStructuralChange);
    socket.on("match_settled", handleMatchStructuralChange);

    return () => {
      socket.off("new_match", handleMatchStructuralChange);
      socket.off("match_settled", handleMatchStructuralChange);
    };
  }, [socket, activeUser]);


  // 2. 🔥 EARLY RETURN FOR UNAUTHENTICATED USERS (Must be placed AFTER all hooks)
  if (!activeUser) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-[#050505] min-h-screen flex flex-col items-center justify-center p-4">
        <div className="bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-8 max-w-sm w-full text-center shadow-2xl relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute inset-0 bg-yellow-500/5 blur-3xl rounded-full pointer-events-none" />
          
          <div className="relative z-10">
            <div className="bg-yellow-500/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border border-yellow-500/20 shadow-[0_0_30px_rgba(234,179,8,0.15)]">
              <Lock size={36} className="text-yellow-500" />
            </div>
            
            <h2 className="text-white font-black italic text-3xl uppercase tracking-tighter mb-3">
              Access<br/>Restricted
            </h2>
            
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.15em] leading-relaxed mb-8 px-4">
              You must be verified to enter the National Derby arena and support the best team.
            </p>
            
            <button
              onClick={() => navigate('/signin')}
              className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-black uppercase text-xs tracking-[0.2em] py-4 rounded-2xl transition-all shadow-[0_0_20px_rgba(234,179,8,0.2)]"
            >
              Sign In To Enter
            </button>
          </div>
        </div>
      </motion.div>
    );
  }


  // 3. MAIN RENDER FOR AUTHENTICATED USERS
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-[#050505] min-h-screen pb-24">
      {/* LEAGUE FILTERS */}
      <div className="sticky top-0 z-50 bg-[#050505]/90 backdrop-blur-xl border-b border-white/5 pt-4 pb-2 px-4">
        <div className="flex justify-between items-center mb-4 px-2">
          <div className="flex items-center gap-2 text-yellow-500">
            <Flame size={20} />
            <h1 className="text-white font-black italic text-2xl uppercase tracking-tighter">NATIONAL DERBY</h1>
          </div>
          <div className="flex items-center gap-1.5 bg-red-600/10 px-2.5 py-1 rounded-full border border-red-600/20">
             <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse" />
             <span className="text-red-600 font-black uppercase text-[9px] tracking-widest">{liveMatches.length} LIVE</span>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 px-2">
          {["UNI", "SHS", "TECH_HUB", "NATIONAL"].map((league) => (
            <button
              key={league}
              onClick={() => setActiveLeague(league)}
              className={`shrink-0 px-5 py-2 rounded-full font-black text-[10px] uppercase tracking-widest transition-all ${
                activeLeague === league 
                ? "bg-yellow-500 text-black shadow-[0_0_15px_#eab308]" 
                : "bg-white/5 text-gray-500 border border-white/5"
              }`}
            >
              {league} LEAGUE
            </button>
          ))}
        </div>
      </div>

      <div className="pt-6 px-4 max-w-2xl mx-auto">
        
        {/* TOURNAMENT RESULTS SECTION */}
        {completedMatches.length > 0 && (
          <div className="mb-10">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] mb-4 text-zinc-500 flex items-center gap-2">
              <Trophy size={14} className="text-yellow-500"/> Tournament Results
            </h2>
            {completedMatches.map(match => (
              <VictoryCard key={match._id} match={match} />
            ))}
          </div>
        )}

        {/* LIVE BATTLES SECTION */}
        <h2 className="text-xs font-black uppercase tracking-[0.2em] mb-4 text-zinc-500 flex items-center gap-2">
          <Swords size={14} className="text-red-500"/> Active Battles
        </h2>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-yellow-500" size={30} /></div>
        ) : liveMatches.length === 0 && completedMatches.length > 0 ? (
          
          <div className="py-16 text-center border border-yellow-500/20 rounded-[2.5rem] bg-yellow-500/5 px-6 mt-4 shadow-[0_0_30px_rgba(234,179,8,0.05)]">
            <Hourglass size={40} className="text-yellow-500 mx-auto mb-4 animate-pulse" />
            <p className="text-yellow-500 font-black italic uppercase text-xl tracking-tighter">Halftime Deliberation</p>
            <p className="text-zinc-400 text-[10px] font-bold uppercase mt-2 leading-relaxed">
              The previous round has concluded.<br/>Yenuvia Master is preparing the next bracket...
            </p>
          </div>

        ) : liveMatches.length === 0 ? (
          
          <div className="py-24 text-center border border-white/5 rounded-[2.5rem] bg-zinc-950 px-6 mt-4">
            <Swords size={40} className="text-zinc-800 mx-auto mb-4" />
            <p className="text-gray-500 font-black italic uppercase text-xl tracking-tighter">No Active Directives</p>
            <p className="text-zinc-600 text-[10px] font-black uppercase mt-2">Next battle starting soon...</p>
          </div>

        ) : (
          liveMatches.map((match) => (
            <DerbyMatchCard 
              key={match._id} 
              match={match} 
              activeUser={activeUser}
              onSupportSuccess={fetchMatches}
            />
          ))
        )}
      </div>
    </motion.div>
  );
};

export default Schools;