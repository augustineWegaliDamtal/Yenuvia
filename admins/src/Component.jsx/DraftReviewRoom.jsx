import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Loader2,
  PlayCircle,
  Trophy,
  Zap,
  AlertTriangle,
  X,
  Upload,
  Trash2,
  Eye
} from "lucide-react";
import customFetch from "../utility/customFetch";

// 🎬 SMART HOVER VIDEO CARD COMPONENT
const SmartVideoCard = ({ draft, isSelected, mediaSrc, onSelect, onDelete, onPlayFull }) => {
  const videoRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0; // Reset clip on hover exit
    }
  };

  return (
    <div
      className={`relative group rounded-2xl overflow-hidden border-2 transition-all duration-300 h-64 bg-zinc-950 ${
        isSelected
          ? "border-yellow-500 scale-[0.98] shadow-[0_0_25px_rgba(234,179,8,0.25)]"
          : "border-white/10 hover:border-white/30"
      }`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Click Card Body to Select */}
      <div className="absolute inset-0 cursor-pointer z-10" onClick={() => onSelect(draft)}>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent z-10" />
        {mediaSrc ? (
          <video
            ref={videoRef}
            src={mediaSrc}
            preload="metadata"
            muted
            loop
            playsInline
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ${
              isHovered ? "opacity-90 scale-105" : "opacity-40"
            }`}
          />
        ) : (
          <div className="w-full h-full flex justify-center items-center text-zinc-800 text-[9px] uppercase font-black">
            No Media
          </div>
        )}
      </div>

      {/* Delete Button */}
      <button
        onClick={(e) => onDelete(e, draft._id)}
        className="absolute top-3 left-3 bg-black/60 hover:bg-red-600 text-white p-2.5 rounded-xl z-30 transition-all opacity-0 group-hover:opacity-100 backdrop-blur-md border border-white/10 shadow-lg"
        title="Delete Submission"
      >
        <Trash2 size={15} />
      </button>

      {/* Fullscreen Preview Trigger */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onPlayFull(draft);
        }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-yellow-500 hover:bg-yellow-400 text-black p-3.5 rounded-full z-30 hover:scale-110 transition-transform shadow-[0_0_25px_rgba(234,179,8,0.5)] opacity-0 group-hover:opacity-100 flex items-center justify-center"
        title="Watch Fullscreen"
      >
        <PlayCircle size={26} />
      </button>

      {/* Hover Status Badge */}
      {!isHovered && mediaSrc && !isSelected && (
        <div className="absolute top-3 right-3 z-20 bg-black/70 backdrop-blur-md text-white/60 text-[8px] font-black px-2 py-1 rounded-md border border-white/10 flex items-center gap-1">
          <Eye size={10} className="text-yellow-500" /> HOVER TO PREVIEW
        </div>
      )}

      {/* Selection Badge */}
      {isSelected && (
        <div className="absolute top-3 right-3 z-30 bg-yellow-500 text-black text-[8px] font-black px-2.5 py-1 rounded-md uppercase tracking-widest shadow-md">
          SELECTED
        </div>
      )}

      {/* Video Details */}
      <div className="absolute bottom-4 left-4 right-4 z-20 pointer-events-none flex items-end justify-between">
        <div>
          <h3 className="text-white font-black text-sm italic uppercase leading-none truncate max-w-[150px]">
            {draft.school}
          </h3>
          <p className="text-yellow-500 text-[9px] font-black uppercase mt-1 tracking-tighter">
            @{draft.artistId?.username || "artist"}
          </p>
        </div>
      </div>
    </div>
  );
};

// 🏛️ MAIN ROOM COMPONENT
const DraftReviewRoom = ({ match, onClose, token }) => {
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDrafts, setSelectedDrafts] = useState([]);
  const [pushingLive, setPushingLive] = useState(false);
  const [playingVideo, setPlayingVideo] = useState(null);

  // Upload State for School Crests
  const [crestA, setCrestA] = useState(null);
  const [crestB, setCrestB] = useState(null);

  const [viewMode, setViewMode] = useState("DRAFTS");

  // 🛠️ HELPER 1: Safely resolve Match ID
  const getActiveMatchId = () => {
    if (!match) return "";
    if (typeof match === "string") return match;
    return match._id || match.id || match.matchId || "";
  };

  // 🛠️ HELPER 2: Safely extract media URL
  const getMediaUrl = (draft) => {
    if (!draft) return null;
    if (Array.isArray(draft.mediaUrls) && draft.mediaUrls.length > 0) {
      const item = draft.mediaUrls[0];
      return typeof item === "string" ? item : item?.mediaUrl || item?.url;
    }
    if (Array.isArray(draft.mediaFiles) && draft.mediaFiles.length > 0) {
      const item = draft.mediaFiles[0];
      return typeof item === "string" ? item : item?.mediaUrl || item?.url;
    }
    if (typeof draft.mediaUrl === "string") return draft.mediaUrl;
    return null;
  };

  const activeMatchId = getActiveMatchId();

  // 📡 FETCH DRAFTS FROM BACKEND
  const fetchDrafts = async (mode) => {
    if (!activeMatchId) return;

    setLoading(true);
    setSelectedDrafts([]);
    setCrestA(null);
    setCrestB(null);

    try {
      const endpoint = mode === "WINNERS" 
        ? `/api/matches/${activeMatchId}/winners` 
        : `/api/matches/${activeMatchId}/drafts`;

      console.log(`📡 Fetching ${mode} for Match ID:`, activeMatchId);
      const res = await customFetch(endpoint);
      const data = await res.json();

      console.log("📦 RAW SERVER RESPONSE:", data);

      if (data.success) {
        const fetchedWorks = data.drafts || data.works || data.data || [];
        setDrafts(fetchedWorks);
      } else {
        console.warn("⚠️ Server returned success: false", data.message);
        setDrafts([]);
      }
    } catch (err) {
      console.error("❌ Load error in DraftReviewRoom:", err);
      setDrafts([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial Load & Mode Switch
  useEffect(() => {
    document.body.style.overflow = "hidden";
    fetchDrafts(viewMode);
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [activeMatchId, token, viewMode]);

  // ⌨️ KEYBOARD SHORTCUTS (Esc to exit video player or modal)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (playingVideo) {
          setPlayingVideo(null);
        } else if (onClose) {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [playingVideo, onClose]);

  // ⚡ REAL-TIME SOCKET LISTENER
  useEffect(() => {
    const socket = window.socket;
    if (!socket) return;

    const handleNewWork = (data) => {
      const incomingWork = data.work || data;
      const incomingMatchId = String(incomingWork?.matchId || data?.matchId || "");
      
      if (incomingMatchId === String(activeMatchId) && incomingWork?._id) {
        setDrafts((prev) => [incomingWork, ...prev.filter((d) => d._id !== incomingWork._id)]);
      }
    };

    socket.on("newWorkSubmitted", handleNewWork);
    socket.on("new_match_draft", handleNewWork);

    return () => {
      socket.off("newWorkSubmitted", handleNewWork);
      socket.off("new_match_draft", handleNewWork);
    };
  }, [activeMatchId]);

  const toggleSelection = (draft) => {
    if (selectedDrafts.find((d) => d._id === draft._id)) {
      const newSelections = selectedDrafts.filter((d) => d._id !== draft._id);
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

  const handleDeleteDraft = async (e, draftId) => {
    e.stopPropagation();
    const confirmDelete = window.confirm("Are you sure you want to permanently delete this submission?");
    if (!confirmDelete) return;

    try {
      setSelectedDrafts((prev) => prev.filter((d) => d._id !== draftId));
      const res = await customFetch(`/api/work/${draftId}`, { method: "DELETE" });
      const data = await res.json();

      if (data.success) {
        setDrafts((prev) => prev.filter((d) => d._id !== draftId));
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

    const contendersData = selectedDrafts.map((draft) => ({
      school: draft.school,
      artistId: draft.artistId?._id || draft.artistId,
      workId: draft._id,
      totalStaked: 0
    }));

    const formData = new FormData();
    formData.append("contenders", JSON.stringify(contendersData));
    if (crestA) formData.append("crestA", crestA);
    if (crestB) formData.append("crestB", crestB);

    try {
      const res = await customFetch(`/api/matches/${activeMatchId}/spawn`, {
        method: "POST",
        body: formData
      });
      const data = await res.json();

      if (data.success) {
        alert("🚨 FIXTURE DEPLOYED TO YENUVIA!");
        const remainingDrafts = drafts.filter((d) => !selectedDrafts.find((sd) => sd._id === d._id));
        setDrafts(remainingDrafts);
        setSelectedDrafts([]);
        setCrestA(null);
        setCrestB(null);

        if (remainingDrafts.length < 2 && onClose) onClose();
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
      {/* HEADER */}
      <div className="w-full bg-black/60 backdrop-blur-md border-b border-white/10 p-5 sm:p-6 flex items-center justify-between z-[100]">
        <div className="flex items-center gap-4">
          {/* 👈 ENHANCED GO BACK BUTTON */}
          <button
            onClick={onClose || (() => window.history.back())}
            className="bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-2.5 rounded-xl border border-white/10 hover:border-white/20 transition-all flex items-center gap-2 font-bold text-xs uppercase tracking-wider shadow-lg active:scale-95 group"
          >
            <ArrowLeft size={16} className="text-yellow-500 group-hover:-translate-x-1 transition-transform" />
            <span>Go Back</span>
          </button>

          <div>
            <h1 className="text-lg sm:text-2xl font-black italic uppercase text-yellow-500">Tournament Hub</h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest line-clamp-1 max-w-[200px] sm:max-w-md">
              {match?.directive || "Active Match Room"}
            </p>
          </div>
        </div>

        <button
          onClick={handleSpawnFixture}
          disabled={selectedDrafts.length < 2 || pushingLive}
          className={`px-5 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 transition-all ${
            selectedDrafts.length === 2 ? "bg-red-600 text-white shadow-[0_0_20px_#dc2626] hover:scale-105 active:scale-95" : "bg-zinc-900 text-zinc-600"
          }`}
        >
          {pushingLive ? <Loader2 className="animate-spin" size={16} /> : <><Zap size={16} /> Deploy Fixture</>}
        </button>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 overflow-hidden">
        <div className="max-w-7xl mx-auto w-full h-full grid grid-cols-1 lg:grid-cols-3 gap-8 p-6">
          
          {/* LEFT: GRID */}
          <div className="lg:col-span-2 overflow-y-auto h-full pr-2 custom-scrollbar">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between sticky top-0 bg-black/90 backdrop-blur-md py-3 z-10 mb-6 border-b border-white/5 gap-3">
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white flex items-center gap-2">
                <Trophy size={14} className="text-yellow-500" />
                {viewMode === "WINNERS" ? "Advancing Champions" : "Fresh Submissions"} ({drafts.length})
              </h2>
              <div className="flex bg-white/5 rounded-lg p-1 border border-white/10 shrink-0">
                <button
                  onClick={() => setViewMode("DRAFTS")}
                  className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-md transition-all ${
                    viewMode === "DRAFTS" ? "bg-zinc-800 text-white shadow-lg" : "text-zinc-500 hover:text-white"
                  }`}
                >
                  Round 1 (All)
                </button>
                <button
                  onClick={() => setViewMode("WINNERS")}
                  className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-md transition-all ${
                    viewMode === "WINNERS" ? "bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.3)]" : "text-zinc-500 hover:text-white"
                  }`}
                >
                  Round 2 (Winners)
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-20"><Loader2 className="animate-spin text-yellow-500" size={30} /></div>
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
                  const isSelected = !!selectedDrafts.find((d) => d._id === draft._id);
                  const mediaSrc = getMediaUrl(draft);

                  return (
                    <SmartVideoCard
                      key={draft._id}
                      draft={draft}
                      isSelected={isSelected}
                      mediaSrc={mediaSrc}
                      onSelect={toggleSelection}
                      onDelete={handleDeleteDraft}
                      onPlayFull={setPlayingVideo}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT: DERBY PREVIEW */}
          <div className="hidden lg:block">
            <div className="bg-zinc-950 border border-white/10 rounded-3xl p-6 shadow-2xl sticky top-0">
              <h2 className="text-xs font-black uppercase tracking-[0.2em] mb-6 text-white text-center">Derby Preview</h2>

              <div className="space-y-4">
                {/* CONTENDER A */}
                <div className={`h-auto min-h-[6rem] rounded-2xl border ${selectedDrafts[0] ? "border-yellow-500/50 bg-yellow-500/5" : "border-white/5 bg-black"} flex flex-col p-3 transition-all`}>
                  {selectedDrafts[0] ? (
                    <>
                      <div className="flex items-center gap-3">
                        {getMediaUrl(selectedDrafts[0]) ? (
                          <video src={getMediaUrl(selectedDrafts[0])} preload="metadata" className="w-16 h-16 rounded-xl object-cover" autoPlay muted loop playsInline />
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
                        {crestA ? crestA.name.substring(0, 18) + "..." : "Upload Crest A"}
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => setCrestA(e.target.files[0])} />
                      </label>
                    </>
                  ) : (
                    <div className="h-full flex items-center justify-center"><p className="w-full text-center text-zinc-700 text-[8px] font-black uppercase py-4">Pick Champion 1</p></div>
                  )}
                </div>

                <div className="text-center text-zinc-800 font-black italic text-xs">VS</div>

                {/* CONTENDER B */}
                <div className={`h-auto min-h-[6rem] rounded-2xl border ${selectedDrafts[1] ? "border-green-500/50 bg-green-500/5" : "border-white/5 bg-black"} flex flex-col p-3 transition-all`}>
                  {selectedDrafts[1] ? (
                    <>
                      <div className="flex items-center gap-3">
                        {getMediaUrl(selectedDrafts[1]) ? (
                          <video src={getMediaUrl(selectedDrafts[1])} preload="metadata" className="w-16 h-16 rounded-xl object-cover" autoPlay muted loop playsInline />
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
                        {crestB ? crestB.name.substring(0, 18) + "..." : "Upload Crest B"}
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => setCrestB(e.target.files[0])} />
                      </label>
                    </>
                  ) : (
                    <div className="h-full flex items-center justify-center"><p className="w-full text-center text-zinc-700 text-[8px] font-black uppercase py-4">Pick Champion 2</p></div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FULLSCREEN PLAYER MODAL */}
      <AnimatePresence>
        {playingVideo && (
          <div className="fixed inset-0 z-[999999] bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-lg aspect-[9/16] bg-zinc-900 rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl"
            >
              <button
                onClick={() => setPlayingVideo(null)}
                className="absolute top-6 right-6 z-[100] bg-black/60 hover:bg-red-600 text-white p-3 rounded-full transition-all border border-white/10 shadow-xl"
              >
                <X size={22} />
              </button>
              {getMediaUrl(playingVideo) && (
                <video
                  src={getMediaUrl(playingVideo)}
                  autoPlay
                  controls
                  className="w-full h-full object-contain bg-black"
                />
              )}
              <div className="absolute bottom-10 left-8 right-8 pointer-events-none z-20">
                <p className="text-yellow-500 font-black uppercase text-[10px] tracking-widest mb-1">
                  {playingVideo.school}
                </p>
                <h2 className="text-white font-bold text-xl uppercase tracking-tighter">
                  @{playingVideo.artistId?.username || "artist"}
                </h2>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default DraftReviewRoom;