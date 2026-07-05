import React, { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, Plus, Swords, X, Loader2, CheckCircle2, Users, Gavel, Trash2, Banknote, Phone, Trophy } from "lucide-react"; 
import DraftReviewRoom from "../Component.jsx/DraftReviewRoom";
// 🔥 1. BRING IN THE GLOBAL SOCKET
import { useSocket } from "../context/SocketContext";
import customFetch from "../utility/customFetch";

const AdminDashboard = () => {
  const { currentUser } = useSelector((state) => state.admin);

  const [matches, setMatches] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [reviewingMatch, setReviewingMatch] = useState(null);
  const [settlingMatch, setSettlingMatch] = useState(null);
  const [isSettling, setIsSettling] = useState(false);

  // 🔥 2. INITIALIZE THE SOCKET
  const socket = useSocket();

  const [formData, setFormData] = useState({
    directive: "",
    league: "UNI",
    daysActive: 3,
  });

  const fetchAdminMatches = useCallback(async () => {
    try {
      // Only set loading to true if it's the very first boot, 
      // otherwise real-time silent refreshes will cause flickering!
      if (matches.length === 0) setLoading(true); 
      
      const res = await customFetch("/api/matches?status=all");
      const data = await res.json();
      if (data.success) {
        setMatches(data.matches);
      }
    } catch (error) {
      console.error("Failed to load command center:", error);
    } finally {
      setLoading(false);
    }
  }, [matches.length]);

  const fetchPayouts = useCallback(async () => {
    try {
      const res = await customFetch("/api/payouts/admin/pending");
      const data = await res.json();
      if (data.success) setPayouts(data.requests);
    } catch (error) {
      console.error("Payout load error:", error);
    }
  }, [currentUser?.token]);

  // Initial Load
  useEffect(() => {
    fetchAdminMatches();
    fetchPayouts();
  }, [fetchAdminMatches, fetchPayouts]);

  // ⚡ 3. THE REAL-TIME ADMIN OBSERVER ENGINE
  useEffect(() => {
    if (!socket) return;

    // Listen for live updates and silently refresh the dashboard
    const handleSilentMatchRefresh = () => fetchAdminMatches();
    const handleSilentPayoutRefresh = () => fetchPayouts();

    // Event Triggers
    socket.on("pool_updated", handleSilentMatchRefresh); // Watch money flow live
    socket.on("match_settled", handleSilentMatchRefresh); // Watch another admin settle a match
    socket.on("new_payout_request", handleSilentPayoutRefresh); // Instantly see new withdrawal requests

    return () => {
      socket.off("pool_updated", handleSilentMatchRefresh);
      socket.off("match_settled", handleSilentMatchRefresh);
      socket.off("new_payout_request", handleSilentPayoutRefresh);
    };
  }, [socket, fetchAdminMatches, fetchPayouts]);


  const handleTakeDown = async (matchId) => {
    if (!window.confirm("🚨 Are you sure you want to scrap this item? This action is permanent.")) return;
    try {
      const res = await customFetch(`/api/matches/${matchId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) fetchAdminMatches();
      else alert(data.message || "Failed to take down.");
    } catch (err) {
      console.error("Take down error:", err);
      alert("Network Error.");
    }
  };

  const handleApprovePayout = async (payoutId) => {
    if (!window.confirm("Confirm: Have you manually sent the MoMo to this user?")) return;
    try {
      const res = await customFetch(`/api/payouts/approve/${payoutId}`, {
        method: "PUT",
      });
      const data = await res.json();
      if (data.success) fetchPayouts(); 
    } catch (err) { alert("Action failed."); }
  };

  const handleFinalSettle = async (matchId, winningContenderId) => {
    if (!window.confirm("Are you sure? This will distribute all funds and cannot be undone.")) return;
    try {
      setIsSettling(true);
      const res = await customFetch(`/api/matches/${matchId}/settle`, {
        method: "PUT",
        body: JSON.stringify({ winningContenderId })
      });
      const data = await res.json();
      if (data.success) {
        alert("🏆 Match Settled! Winnings distributed.");
        setSettlingMatch(null);
        fetchAdminMatches();
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("Settlement Error:", error);
      alert("Failed to settle match.");
    } finally {
      setIsSettling(false);
    }
  };

  const handleCreateFixture = async (e) => {
    e.preventDefault();
    if (creating) return;
    setCreating(true);
    const start = new Date();
    const end = new Date();
    end.setDate(start.getDate() + Number(formData.daysActive));
    try {
      const res = await customFetch("/api/matches", {
        method: "POST",
        body: JSON.stringify({
          directive: formData.directive,
          league: formData.league,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          contenders: [] 
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowCreateModal(false);
        setFormData({ directive: "", league: "UNI", daysActive: 3 });
        fetchAdminMatches(); 
      } else {
        alert(data.message || "Failed to deploy fixture.");
      }
    } catch (error) {
      console.error("Deploy Error:", error);
      alert("Network error.");
    } finally {
      setCreating(false);
    }
  };

  if (!currentUser || currentUser.role !== "superadmin") {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-red-500 p-6 text-center">
        <ShieldAlert size={60} className="mb-4" />
        <h1 className="text-2xl font-black uppercase tracking-widest">Restricted Area</h1>
        <p className="text-xs font-bold text-gray-400 mt-2">You do not have Superadmin clearance.</p>
      </div>
    );
  }

  return (
    <div className="text-white pt-2 pb-24 font-sans w-full h-full animate-fade-in">
      
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-8 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black italic tracking-tighter uppercase text-yellow-500">Command Center</h1>
          <p className="text-[10px] font-black tracking-widest text-gray-500 uppercase mt-1">Superadmin Access Granted</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="bg-yellow-500 text-black px-5 py-3 sm:py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-yellow-400 transition-all active:scale-95 shadow-[0_0_15px_rgba(234,179,8,0.3)] shrink-0"
        >
          <Plus size={16} /> Deploy Fixture
        </button>
      </header>

      <div className="w-full">
        <h2 className="text-sm font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2 text-zinc-300">
          <Swords size={16} className="text-zinc-500"/> Managing Fixtures
        </h2>
        
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 size={30} className="animate-spin text-yellow-500"/></div>
        ) : matches.length === 0 ? (
          <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-10 text-center">
            <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">No active fixtures deployed.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {matches.map(match => {
              const isTournamentHub = !match.parentMatchId;

              return (
              <div 
                key={match._id} 
                className={`bg-[#0a0a0a] border rounded-2xl p-5 relative overflow-hidden group flex flex-col h-full shadow-lg ${isTournamentHub ? 'border-yellow-500/30' : 'border-white/10'}`}
              >
                <div className={`absolute top-0 right-0 w-1.5 h-full ${match.status === 'LIVE' && !isTournamentHub ? 'bg-red-500 shadow-[0_0_15px_#ef4444]' : 'bg-yellow-500'}`} />
                
                <div className="flex justify-between items-center mb-4">
                  <span className={`bg-white/5 border border-white/10 px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-widest shrink-0 ${isTournamentHub ? 'text-yellow-500' : 'text-zinc-400'}`}>
                    {isTournamentHub ? "🏆 HUB" : "⚔️ DERBY"} • {match.league}
                  </span>
                  
                  {match.status === 'LIVE' && !isTournamentHub && (
                    <button 
                      onClick={() => setSettlingMatch(match)}
                      className="bg-red-600/20 text-red-500 border border-red-500/30 text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all flex items-center gap-1"
                    >
                      <Gavel size={10} /> Settle
                    </button>
                  )}

                  {match.status !== 'LIVE' && (
                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">
                      {match.status}
                    </span>
                  )}
                </div>
                
                <h3 className="text-white text-base sm:text-lg font-bold leading-snug pr-3 mb-6 line-clamp-3 break-words italic">
                  "{match.directive}"
                </h3>
                
                <div className="flex items-center justify-between border-t border-white/10 pt-4 mt-auto">
                  <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] font-bold uppercase tracking-widest">
                    <Users size={14} /> {match.contenders?.length || 0}
                    <span className="hidden sm:inline"> Contenders</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleTakeDown(match._id)}
                      className="bg-red-600/10 text-red-500 p-2 rounded-lg hover:bg-red-600 hover:text-white transition-all border border-red-600/20 active:scale-95"
                      title="Scrap Fixture"
                    >
                      <Trash2 size={16} />
                    </button>

                    {isTournamentHub && (
                      <button 
                        onClick={() => setReviewingMatch(match)}
                        className="text-black bg-yellow-500 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-yellow-400 transition-all shadow-md shadow-yellow-500/20"
                      >
                        Open Hub →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )})}
          </div>
        )}
      </div>

      {/* PAYOUT MANAGER */}
      <div className="w-full mt-12 pt-10 border-t border-white/5">
        <h2 className="text-sm font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2 text-zinc-300">
          <Banknote size={16} className="text-green-500"/> Pending Vault Withdrawals
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {payouts.length === 0 ? (
            <div className="col-span-full bg-zinc-900/30 border border-white/5 p-8 rounded-3xl text-center">
                <p className="text-zinc-600 font-bold uppercase text-[9px] tracking-widest italic">No pending cashouts to process.</p>
            </div>
          ) : (
            payouts.map(p => (
                <div key={p._id} className="bg-[#0f0f0f] border border-white/5 p-4 rounded-2xl flex justify-between items-center group">
                    <div className="flex items-center gap-3">
                        <div className="bg-green-500/10 p-2 rounded-lg">
                            <Phone size={16} className="text-green-500" />
                        </div>
                        <div>
                            <p className="text-white font-black text-sm">GHS {p.amount.toLocaleString()}</p>
                            <p className="text-[9px] font-black uppercase text-zinc-500 tracking-tighter">
                                {p.network} • {p.phone} • @{p.userId?.username}
                            </p>
                        </div>
                    </div>
                    <button 
                      onClick={() => handleApprovePayout(p._id)}
                      className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase hover:bg-green-500 transition-all shadow-lg active:scale-90"
                    >
                        Mark Paid
                    </button>
                </div>
            ))
          )}
        </div>
      </div>

      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-[#0a0a0a] border border-yellow-500/30 w-full max-w-lg rounded-[2rem] p-6 relative shadow-2xl"
            >
              <button onClick={() => setShowCreateModal(false)} className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors bg-white/5 p-1.5 rounded-full">
                <X size={18} />
              </button>

              <h2 className="text-xl font-black italic uppercase tracking-tighter mb-1 text-white pr-8">New Fixture</h2>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-6">Launch a national directive</p>

              <form onSubmit={handleCreateFixture} className="space-y-5">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">The Directive (The Problem)</label>
                  <textarea 
                    required
                    value={formData.directive}
                    onChange={(e) => setFormData({...formData, directive: e.target.value})}
                    placeholder="e.g., Build an offline USSD payment system for Trotros"
                    className="w-full bg-black border border-white/10 rounded-xl p-4 text-white text-sm font-bold outline-none focus:border-yellow-500 transition-colors min-h-[110px] resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">League</label>
                    <select 
                      value={formData.league}
                      onChange={(e) => setFormData({...formData, league: e.target.value})}
                      className="w-full bg-black border border-white/10 rounded-xl p-3.5 text-white text-[11px] font-black uppercase outline-none focus:border-yellow-500 appearance-none cursor-pointer"
                    >
                      <option value="UNI">University (UNI)</option>
                      <option value="SHS">High School (SHS)</option>
                      <option value="TECH_HUB">Tech Hubs</option>
                      <option value="NATIONAL">National Open</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Duration</label>
                    <select 
                      value={formData.daysActive}
                      onChange={(e) => setFormData({...formData, daysActive: e.target.value})}
                      className="w-full bg-black border border-white/10 rounded-xl p-3.5 text-white text-[11px] font-black uppercase outline-none focus:border-yellow-500 appearance-none cursor-pointer"
                    >
                      <option value="1">24 Hours (Blitz)</option>
                      <option value="3">3 Days (Weekend)</option>
                      <option value="7">1 Week (Standard)</option>
                    </select>
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={creating || !formData.directive}
                  className="w-full bg-yellow-500 text-black mt-2 p-4 rounded-xl font-black uppercase tracking-[0.2em] text-[11px] hover:bg-yellow-400 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 flex justify-center items-center gap-2"
                >
                  {creating ? <Loader2 size={16} className="animate-spin"/> : <><CheckCircle2 size={16}/> Deploy to Network</>}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {reviewingMatch && (
          <DraftReviewRoom 
            match={reviewingMatch} 
            token={currentUser?.token} 
            onClose={() => {
              setReviewingMatch(null);
              fetchAdminMatches(); 
            }} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {settlingMatch && (
          <div className="fixed inset-0 z-[99999] bg-black/90 backdrop-blur-md flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#0a0a0a] border border-red-500/30 p-8 rounded-[2rem] max-w-md w-full text-center relative shadow-2xl">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-red-600 p-4 rounded-full shadow-lg shadow-red-600/40">
                <Gavel size={32} className="text-white" />
              </div>
              
              <h2 className="text-xl font-black italic uppercase text-white mb-2 mt-4">Final Judgement</h2>
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-8">
                {settlingMatch.totalPool > 0 
                  ? `Distribute GHS ${settlingMatch.totalPool.toLocaleString()} to the winners`
                  : "No funds pledged. Closing fixture."}
              </p>
              
              <div className="grid grid-cols-1 gap-3">
                {settlingMatch.contenders.map((c) => (
                  <button 
                    key={c._id}
                    disabled={isSettling}
                    onClick={() => handleFinalSettle(settlingMatch._id, c._id)}
                    className="bg-white/5 border border-white/10 p-5 rounded-2xl hover:border-yellow-500 transition-all group flex items-center justify-between"
                  >
                    <div className="text-left">
                      <p className="text-yellow-500 font-black uppercase text-[10px] mb-0.5">{c.school}</p>
                      <p className="text-white font-bold text-xs">@{c.artistId?.username}</p>
                    </div>
                    <div className="bg-yellow-500/10 px-3 py-1 rounded text-[9px] font-black text-yellow-500 uppercase">
                      Select Winner
                    </div>
                  </button>
                ))}
              </div>

              <button 
                disabled={isSettling}
                onClick={() => setSettlingMatch(null)} 
                className="mt-8 text-zinc-600 font-black uppercase text-[10px] tracking-widest hover:text-white transition-colors"
              >
                Go Back
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard; 