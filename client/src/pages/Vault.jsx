import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import { 
  ShieldCheck, ArrowUpRight, 
  Clock, CheckCircle2, XCircle, Loader2
} from "lucide-react";
import customFetch from "../util/customFetch.js";

const Vault = () => {
  const activeUser = useSelector((state) => state.user?.currentUser || state.artist?.currentUserArtist);
  
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch their history of pledges
  useEffect(() => {
    const fetchLedger = async () => {
      try {
        const res = await customFetch("/api/stakes/my-ledger", {
          headers: { Authorization: `Bearer ${activeUser?.token}` }
        });
        const data = await res.json();
        if (data.success) {
          setLedger(data.history);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    if (activeUser) fetchLedger();
  }, [activeUser]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-[#050505] min-h-screen pt-6 pb-24 font-sans text-white px-4">
      <div className="max-w-2xl mx-auto">
        
        {/* HEADER */}
        <div className="flex items-center gap-3 mb-10">
          <div className="bg-yellow-500/10 p-3 rounded-xl border border-yellow-500/20">
            <ShieldCheck size={24} className="text-yellow-500" />
          </div>
          <div>
            <h1 className="text-2xl font-black italic uppercase tracking-tighter text-white">Patron Vault</h1>
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Sponsorship History</p>
          </div>
        </div>

        {/* 📜 THE LEDGER (STAKES HISTORY) */}
        <h2 className="text-xs font-black uppercase tracking-[0.2em] mb-4 text-zinc-400 flex items-center gap-2">
          <Clock size={14} className="text-yellow-500"/> Support Ledger
        </h2>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-yellow-500" /></div>
        ) : ledger.length === 0 ? (
          <div className="bg-zinc-900/50 border border-white/5 p-10 rounded-[2rem] text-center">
            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">No pledges found on your ledger.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {ledger.map((entry) => (
              <div key={entry._id} className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-4 flex items-center justify-between group hover:border-white/10 transition-colors">
                
                <div className="flex items-center gap-4">
                  {/* Status Icon */}
                  <div className={`p-2.5 rounded-xl shrink-0 ${
                    entry.status === 'WON' ? 'bg-green-500/10 text-green-500' :
                    entry.status === 'LOST' ? 'bg-zinc-800 text-zinc-500' :
                    'bg-yellow-500/10 text-yellow-500'
                  }`}>
                    {entry.status === 'WON' ? <CheckCircle2 size={20} /> :
                     entry.status === 'LOST' ? <XCircle size={20} /> :
                     <Clock size={20} />}
                  </div>

                  {/* Details */}
                  <div>
                    <h4 className="text-white font-bold text-sm line-clamp-1">{entry.matchId?.directive || "Yenuvia Directive"}</h4>
                    <p className="text-[9px] font-black uppercase tracking-widest mt-1 flex items-center gap-2">
                      <span className="text-zinc-500">Pledged:</span>
                      <span className="text-white">GHS {entry.amount}</span>
                    </p>
                  </div>
                </div>

                {/* Return / Status */}
                <div className="text-right shrink-0 pl-4">
                  {entry.status === 'WON' ? (
                    <>
                      <p className="text-[9px] font-black uppercase tracking-widest text-green-500 mb-0.5">Victory</p>
                      <p className="text-white font-black text-sm flex items-center justify-end gap-1">
                        Supported Winner <ArrowUpRight size={14} className="text-green-500"/>
                      </p>
                    </>
                  ) : entry.status === 'LOST' ? (
                    <>
                      <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600 mb-0.5">Defeated</p>
                      <p className="text-zinc-500 font-black text-sm flex items-center justify-end gap-1">
                        Valiant Effort
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-[9px] font-black uppercase tracking-widest text-yellow-500 mb-0.5">Status</p>
                      <p className="text-zinc-400 font-black text-sm">PENDING</p>
                    </>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}

      </div>
    </motion.div>
  );
};

export default Vault;