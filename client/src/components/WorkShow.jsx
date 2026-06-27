import React, { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { Loader2, Trash2, Film, Image as ImageIcon, Store } from "lucide-react";
import { useSocket } from "../context/SocketContext";

const WorkShow = ({ userId, isOwner, activeTab }) => {
  const activeUser = useSelector((state) => state.user?.currentUser || state.artist?.currentUserArtist);
  
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const socket = useSocket();

  const fetchWorks = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const queryTab = (activeTab === "showroom" || activeTab === "shop") ? "shop" : "portfolio";
      const res = await fetch(`/api/work/user/${userId}?tab=${queryTab}`, {
        headers: { Authorization: `Bearer ${activeUser?.token}` }
      });
      const data = await res.json();
      
      if (data.success) {
        setWorks(data.works);
      } else {
        setError(data.message || "Failed to load assets");
      }
    } catch (err) {
      console.error(err);
      setError("Arena Link Offline. Check your connection.");
    } finally {
      setLoading(false);
    }
  }, [userId, activeTab, activeUser?.token]); 

  // 🔥 THE ENGINE: Wakes up videos when they enter the viewport
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const video = entry.target.querySelector('video');
        if (!video) return;

        if (entry.isIntersecting) {
          video.play().catch(e => console.log("Autoplay blocked"));
        } else {
          video.pause();
          video.currentTime = 0;
        }
      });
    }, { threshold: 0.5 });

    const items = document.querySelectorAll('.work-item-wrapper');
    items.forEach(item => observer.observe(item));

    return () => observer.disconnect();
  }, [works]); 

  useEffect(() => {
    if (userId) fetchWorks();
  }, [userId, fetchWorks]);

  useEffect(() => {
    if (!socket) return;
    const handleStatusUpdate = () => fetchWorks(true);
    socket.on("newNotification", handleStatusUpdate);
    return () => socket.off("newNotification", handleStatusUpdate);
  }, [socket, fetchWorks]);

  const handleDelete = async (workId) => {
    if (!window.confirm("🚨 Are you sure you want to delete this piece? This cannot be undone.")) return;
    
    try {
      const res = await fetch(`/api/work/${workId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${activeUser?.token}` }
      });
      const data = await res.json();
      
      if (data.success) {
        setWorks((prev) => prev.filter((w) => w._id !== workId));
      } else {
        alert(data.message || "Failed to delete.");
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'approved': return <span className="bg-green-500/10 text-green-500 border border-green-500/20 px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest">Approved</span>;
      case 'billboard': return <span className="bg-purple-500/10 text-purple-500 border border-purple-500/20 px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest">Billboard</span>;
      case 'rejected': return <span className="bg-red-500/10 text-red-500 border border-red-500/20 px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest">Rejected</span>;
      case 'pending': return <span className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest animate-pulse">Pending</span>;
      default: return <span className="bg-zinc-500/10 text-zinc-500 border border-zinc-500/20 px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest">{status}</span>;
    }
  };

  const isShowroom = activeTab === "showroom" || activeTab === "shop";

  return (
    <div className="bg-black min-h-screen pb-20 w-full animate-fade-in">
      <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4 px-2">
        <div>
          <h2 className="text-xl font-black text-white italic uppercase tracking-tighter flex items-center gap-2">
            {isShowroom ? <><Store size={20} className="text-yellow-500"/> {isOwner ? "My Showroom" : "Showroom"}</> : (isOwner ? "My Portfolio" : "Portfolio")}
          </h2>
          <p className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase mt-1">
            {isShowroom ? "Assets currently available for acquisition" : "Deployed assets"}
          </p>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="animate-spin text-yellow-500" size={32} />
        </div>
      )}
      
      {error && <p className="text-red-500 text-xs font-bold uppercase text-center py-10">{error}</p>}

      {!loading && !error && works.length === 0 && (
        <div className="text-center py-20 bg-[#0a0a0a] border border-white/5 rounded-3xl mx-2">
          <p className="text-zinc-500 font-black text-xs uppercase tracking-widest italic">
            {isShowroom ? "No assets currently for sale." : "No assets deployed yet."}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 px-2">
        {works.map((work) => {
          const media = work.mediaUrls?.[0] || work.mediaUrl;
          const isVideo = work.type === "video" || (media && media.match(/\.(mp4|webm|ogg|mov)$/i));

          return (
            // 🔥 WRAPPED IN LINK FOR NAVIGATION, ADDED work-item-wrapper FOR OBSERVER
            <Link 
              to={`/work/${work._id}`} 
              key={work._id}
              className="work-item-wrapper bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden shadow-lg hover:border-yellow-500/30 transition-all group flex flex-col"
            >
              <div className="relative w-full h-48 bg-zinc-950 overflow-hidden">
                {isVideo ? (
                  <>
                    <video 
                      src={media} 
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
                      muted 
                      loop 
                      playsInline 
                      preload="metadata" 
                    />
                    <div className="absolute top-3 right-3 bg-black/60 p-1.5 rounded-md backdrop-blur-md">
                      <Film size={14} className="text-white" />
                    </div>
                  </>
                ) : (
                  <>
                    <img src={media} alt={work.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute top-3 right-3 bg-black/60 p-1.5 rounded-md backdrop-blur-md">
                      <ImageIcon size={14} className="text-white" />
                    </div>
                  </>
                )}
                
                <div className="absolute top-3 left-3 backdrop-blur-md bg-black/40 rounded">
                  {getStatusBadge(work.status)}
                </div>
              </div>

              <div className="p-5 flex flex-col flex-1">
                <div className="flex justify-between items-start gap-2 mb-2">
                  <h3 className="text-white font-black italic uppercase tracking-tight text-lg line-clamp-1">
                    {work.title}
                  </h3>
                  {isShowroom && work.price > 0 && (
                    <span className="text-yellow-500 font-black text-sm shrink-0">₵{work.price}</span>
                  )}
                </div>
                
                <p className="text-xs text-zinc-400 line-clamp-2 mb-4 flex-1">
                  {work.description}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-white/10 mt-auto">
                  <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 bg-white/5 px-2 py-1 rounded">
                    {work.category}
                  </span>
                  
                  {isOwner && (
                    <button 
                      onClick={(e) => { e.preventDefault(); handleDelete(work._id); }}
                      className="text-red-500/50 hover:text-red-500 hover:bg-red-500/10 p-2 rounded-lg transition-all active:scale-95 z-10"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default WorkShow;