import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Loader2, PlayCircle, Trophy, Zap, AlertTriangle, X, Upload, Trash2 } from "lucide-react";
import customFetch from "../utility/customFetch";

const DraftReviewRoom = ({ match, onClose, token }) => {
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDrafts, setSelectedDrafts] = useState([]);
  const [pushingLive, setPushingLive] = useState(false);
  const [playingVideo, setPlayingVideo] = useState(null);
  
  // 🔥 Upload State for School Crests
  const [crestA, setCrestA] = useState(null);
  const [crestB, setCrestB] = useState(null);

  const [viewMode, setViewMode] = useState("DRAFTS"); 

  const fetchDrafts = async (mode) => {
    setLoading(true);
    setSelectedDrafts([]); 
    setCrestA(null); 
    setCrestB(null);
    try {
      const endpoint = mode === "WINNERS" 
        ? `/api/matches/${match._id}/winners` 
        : `/api/matches/${match._id}/drafts`;
        
      const res = await customFetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setDrafts(data.drafts || []);
    } catch (err) {
      console.error("Load error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.body.style.overflow = "hidden";
    fetchDrafts(viewMode);
    return () => { document.body.style.overflow = "auto"; };
  }, [match._id, token, viewMode]);

  const toggleSelection = (draft) => {
    if (selectedDrafts.find(d => d._id === draft._id)) {
      const newSelections = selectedDrafts.filter(d => d._id !== draft._id);
      setSelectedDrafts(newSelections);
      if (newSelections.length === 0) {
        setCrestA(null);
        setCrestB(null);
      } else if (newSelections.length === 1) {
        setCrestB(null); 
      }
      return;
    }
    if (selectedDrafts.length >= 2) {
      alert("Yenuvia is currently optimized for Head-to-Head Derbies! Unselect a champion first.");
      return;
    }
    setSelectedDrafts([...selectedDrafts, draft]);
  };

  // 🔥 1. THE NEW DELETE HANDLER
  const handleDeleteDraft = async (e, draftId) => {
    e.stopPropagation(); // Stop the card from selecting when clicking delete
    
    const confirmDelete = window.confirm("Are you sure you want to permanently delete this submission from the Arena?");
    if (!confirmDelete) return;

    try {
      // Unselect it first if it happens to be selected
      setSelectedDrafts(prev => prev.filter(d => d._id !== draftId));
      
      const res = await customFetch(`/api/work/${draftId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = await res.json();
      
      if (data.success) {
        // Remove it from the local state instantly
        setDrafts(prev => prev.filter(d => d._id !== draftId));
      } else {
        alert(data.message || "Failed to delete submission.");
      }
    } catch (err) {
      console.error("Delete Error:", err);
      alert("Network error while trying to delete.");
    }
  };

  const handleSpawnFixture = async () => {
    if (selectedDrafts.length < 2) return;
    setPushingLive(true);
    
    const contendersData = selectedDrafts.map(draft => ({
      school: draft.school,
      artistId: draft.artistId._id || draft.artistId,
      workId: draft._id,
      totalStaked: 0
    }));

    const formData = new FormData();
    formData.append("contenders", JSON.stringify(contendersData));
    
    if (crestA) formData.append("crestA", crestA);
    if (crestB) formData.append("crestB", crestB);

    try {
      const res = await customFetch(`/api/matches/${match._id}/spawn`, {
        method: "POST", 
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      
      if (data.success) {
        alert("🚨 FIXTURE DEPLOYED TO ARENA!");
        
        const remainingDrafts = drafts.filter(d => !selectedDrafts.find(sd => sd._id === d._id));
        setDrafts(remainingDrafts);
        setSelectedDrafts([]); 
        setCrestA(null);
        setCrestB(null);
        
        if (remainingDrafts.length < 2) onClose();
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert("Network Error");
    } finally {
      setPushingLive(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black z-[99999] flex flex-col font-sans">
      
      {/* 🔙 PINNED HEADER */}
      <div className="w-full bg-black/50 backdrop-blur-md border-b border-white/10 p-6 flex items-center justify-between z-[100]">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="bg-white/10 p-2.5 rounded-full hover:bg-white/20 transition-colors">
            <ArrowLeft size={20} className="text-white" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black italic uppercase text-yellow-500">Tournament Hub</h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest line-clamp-1 max-w-[200px] sm:max-w-md">{match.directive}</p>
          </div>
        </div>
        
        <button 
          onClick={handleSpawnFixture}
          disabled={selectedDrafts.length < 2 || pushingLive}
          className={`px-5 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 transition-all ${
            selectedDrafts.length === 2 ? 'bg-red-600 text-white shadow-[0_0_20px_#dc2626] hover:scale-105 active:scale-95' : 'bg-zinc-900 text-zinc-600'
          }`}
        >
          {pushingLive ? <Loader2 className="animate-spin" size={16} /> : <><Zap size={16}/> Deploy Fixture</>}
        </button>
      </div>

      {/* 📜 MAIN CONTENT */}
      <div className="flex-1 overflow-hidden">
        <div className="max-w-7xl mx-auto w-full h-full grid grid-cols-1 lg:grid-cols-3 gap-8 p-6">
          
          {/* LEFT: THE SCROLLABLE GRID */}
          <div className="lg:col-span-2 overflow-y-auto h-full pr-2 custom-scrollbar">
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between sticky top-0 bg-black/90 backdrop-blur-md py-3 z-10 mb-6 border-b border-white/5 gap-3">
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white flex items-center gap-2">
                <Trophy size={14} className="text-yellow-500"/> 
                {viewMode === "WINNERS" ? "Advancing Champions" : "Fresh Submissions"} ({drafts.length})
              </h2>
              <div className="flex bg-white/5 rounded-lg p-1 border border-white/10 shrink-0">
                <button 
                  onClick={() => setViewMode("DRAFTS")}
                  className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-md transition-all ${viewMode === "DRAFTS" ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}
                >
                  Round 1 (All)
                </button>
                <button 
                  onClick={() => setViewMode("WINNERS")}
                  className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-md transition-all ${viewMode === "WINNERS" ? 'bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.3)]' : 'text-zinc-500 hover:text-white'}`}
                >
                  Round 2 (Winners)
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-20"><Loader2 className="animate-spin text-yellow-500" size={30}/></div>
            ) : drafts.length === 0 ? (
               <div className="bg-zinc-900/50 p-10 rounded-3xl text-center border border-white/5">
                 <AlertTriangle className="text-zinc-600 mx-auto mb-3" size={30} />
                 <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
                   {viewMode === "WINNERS" ? "No champions have advanced yet. Settle matches first." : "No drafts found."}
                 </p>
               </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pb-20">
                {drafts.map((draft) => {
                  const isSelected = selectedDrafts.find(d => d._id === draft._id);
                  return (
                    <div 
                      key={draft._id} 
                      className={`relative group rounded-2xl overflow-hidden border-2 transition-all h-64 bg-zinc-950 ${isSelected ? 'border-yellow-500 scale-[0.98]' : 'border-white/10'}`}
                    >
                      <div className="absolute inset-0 cursor-pointer" onClick={() => toggleSelection(draft)}>
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
                        {draft.mediaUrls?.[0] ? (
                          <video src={draft.mediaUrls[0]} className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity" autoPlay muted loop playsInline />
                        ) : (
                          <div className="w-full h-full flex justify-center items-center text-zinc-800 text-[9px] uppercase font-black">No Media</div>
                        )}
                      </div>

                      {/* 🔥 2. THE NEW DELETE BUTTON */}
                      <button 
                        onClick={(e) => handleDeleteDraft(e, draft._id)}
                        className="absolute top-4 left-4 bg-black/60 hover:bg-red-600 text-white p-2 rounded-lg z-20 transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm border border-white/10"
                        title="Delete Submission"
                      >
                        <Trash2 size={16} />
                      </button>

                      <button 
                        onClick={(e) => { e.stopPropagation(); setPlayingVideo(draft); }}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-yellow-500 text-black p-3 rounded-full z-20 hover:scale-110 transition-transform shadow-xl opacity-0 group-hover:opacity-100"
                      >
                        <PlayCircle size={28} />
                      </button>

                      <div className="absolute bottom-4 left-4 z-20 pointer-events-none">
                        <h3 className="text-white font-black text-sm italic uppercase leading-none">{draft.school}</h3>
                        <p className="text-yellow-500 text-[9px] font-black uppercase mt-1 tracking-tighter">@{draft.artistId?.username || "artist"}</p>
                      </div>

                      {isSelected && (
                        <div className="absolute top-4 right-4 z-20 bg-yellow-500 text-black text-[8px] font-black px-2 py-1 rounded uppercase tracking-widest">
                          SELECTED
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT: PINNED PREVIEW */}
          <div className="hidden lg:block">
             <div className="bg-zinc-950 border border-white/10 rounded-3xl p-6 shadow-2xl sticky top-0">
                <h2 className="text-xs font-black uppercase tracking-[0.2em] mb-6 text-white text-center">Derby Preview</h2>
                
                <div className="space-y-4">
                  {/* CONTENDER A */}
                  <div className={`h-auto min-h-[6rem] rounded-2xl border ${selectedDrafts[0] ? 'border-yellow-500/50 bg-yellow-500/5' : 'border-white/5 bg-black'} flex flex-col p-3 transition-all`}>
                    {selectedDrafts[0] ? (
                      <>
                        <div className="flex items-center gap-3">
                          {selectedDrafts[0].mediaUrls?.[0] ? (
                             <video src={selectedDrafts[0].mediaUrls[0]} className="w-16 h-16 rounded-xl object-cover" autoPlay muted loop playsInline />
                          ) : (
                             <div className="w-16 h-16 rounded-xl bg-zinc-900" />
                          )}
                          <div className="overflow-hidden">
                            <p className="text-yellow-500 text-[8px] font-black uppercase mb-1">Contender A</p>
                            <h4 className="text-white font-black text-xs uppercase truncate">{selectedDrafts[0].school}</h4>
                          </div>
                        </div>
                        <label className="mt-3 w-full bg-white/5 hover:bg-white/10 border border-white/10 border-dashed rounded-lg py-2.5 flex items-center justify-center gap-2 cursor-pointer transition-colors text-[10px] text-gray-400 hover:text-white uppercase font-bold tracking-widest">
                          <Upload size={14} className={crestA ? "text-green-500" : ""} />
                          {crestA ? crestA.name.substring(0,20)+'...' : "Upload Crest A"}
                          <input type="file" accept="image/*" className="hidden" onChange={e => setCrestA(e.target.files[0])} />
                        </label>
                      </>
                    ) : <div className="h-full flex items-center justify-center"><p className="w-full text-center text-zinc-700 text-[8px] font-black uppercase">Pick Champion 1</p></div>}
                  </div>

                  <div className="text-center text-zinc-800 font-black italic text-xs">VS</div>

                  {/* CONTENDER B */}
                  <div className={`h-auto min-h-[6rem] rounded-2xl border ${selectedDrafts[1] ? 'border-green-500/50 bg-green-500/5' : 'border-white/5 bg-black'} flex flex-col p-3 transition-all`}>
                    {selectedDrafts[1] ? (
                      <>
                        <div className="flex items-center gap-3">
                          {selectedDrafts[1].mediaUrls?.[0] ? (
                             <video src={selectedDrafts[1].mediaUrls[0]} className="w-16 h-16 rounded-xl object-cover" autoPlay muted loop playsInline />
                          ) : (
                             <div className="w-16 h-16 rounded-xl bg-zinc-900" />
                          )}
                          <div className="overflow-hidden">
                            <p className="text-green-500 text-[8px] font-black uppercase mb-1">Contender B</p>
                            <h4 className="text-white font-black text-xs uppercase truncate">{selectedDrafts[1].school}</h4>
                          </div>
                        </div>
                        <label className="mt-3 w-full bg-white/5 hover:bg-white/10 border border-white/10 border-dashed rounded-lg py-2.5 flex items-center justify-center gap-2 cursor-pointer transition-colors text-[10px] text-gray-400 hover:text-white uppercase font-bold tracking-widest">
                          <Upload size={14} className={crestB ? "text-green-500" : ""} />
                          {crestB ? crestB.name.substring(0,20)+'...' : "Upload Crest B"}
                          <input type="file" accept="image/*" className="hidden" onChange={e => setCrestB(e.target.files[0])} />
                        </label>
                      </>
                    ) : <div className="h-full flex items-center justify-center"><p className="w-full text-center text-zinc-700 text-[8px] font-black uppercase">Pick Champion 2</p></div>}
                  </div>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* 🔥 THE CINEMA MODE PLAYER */}
      <AnimatePresence>
        {playingVideo && (
          <div className="fixed inset-0 z-[999999] bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-lg aspect-[9/16] bg-zinc-900 rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl"
            >
              <button onClick={() => setPlayingVideo(null)} className="absolute top-6 right-6 z-[100] bg-black/60 hover:bg-red-600 text-white p-3 rounded-full transition-all">
                <X size={24} />
              </button>
              <video src={playingVideo.mediaUrls[0]} autoPlay controls className="w-full h-full object-contain" />
              <div className="absolute bottom-10 left-8 right-8 pointer-events-none">
                <p className="text-yellow-500 font-black uppercase text-[10px] tracking-widest mb-1">{playingVideo.school}</p>
                <h2 className="text-white font-bold text-xl uppercase tracking-tighter">@{playingVideo.artistId?.username || "artist"}</h2>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default DraftReviewRoom;