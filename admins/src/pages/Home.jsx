import React, { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import Dashboard from "./Dashboard"; 
import { Loader2, Monitor, LayoutGrid, X, CheckCircle2, Tag, ShoppingBag } from "lucide-react";

const Home = () => {
  const { currentUser } = useSelector((state) => state.admin || state.user || {});
  
  const [counts, setCounts] = useState({
    admins: 0,
    superadmins: 0,
    artists: 0,
    pendingPosts: 0,
    approvedPosts: 0,
    rejectedPosts: 0,
    billboardPosts: 0,
  });
  const [pendingContent, setPendingContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState(null);

  const fetchDashboard = useCallback(async () => {
    if (!currentUser?.token) return;
    try {
      const res = await fetch("/api/work/dashboard", {
        headers: { Authorization: `Bearer ${currentUser.token}` },
      });
      const data = await res.json();
      
      if (data.success) {
        setCounts({
          admins: data.admins || 0,
          superadmins: data.superadmins || 0,
          artists: data.artists || 0,
          pendingPosts: data.pendingPosts || 0,
          approvedPosts: data.approvedPosts || 0,
          rejectedPosts: data.rejectedPosts || 0,
          billboardPosts: data.billboardPosts || 0,
        });
        setPendingContent(data.pendingContent || []);
      }
    } catch (err) {
      console.error("Dashboard Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.token]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleApprove = async (id, destination) => {
    try {
      const res = await fetch(`/api/work/${id}/approve`, {
        method: "PATCH", 
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentUser.token}`,
        },
        body: JSON.stringify({ destination }), 
      });
      
      const data = await res.json();
      if (data.success) {
        setPendingContent((prev) => prev.filter((c) => c._id !== id));
        setCounts(prev => ({ 
          ...prev, 
          pendingPosts: prev.pendingPosts - 1,
          [destination === "billboard" ? "billboardPosts" : "approvedPosts"]: prev[destination === "billboard" ? "billboardPosts" : "approvedPosts"] + 1
        }));
      }
    } catch (err) {
      console.error("Approval Error:", err);
    }
  };

  const handleReject = async (id) => {
    try {
      const res = await fetch(`/api/work/${id}/reject`, {
        method: "PATCH",
        headers: { 
          Authorization: `Bearer ${currentUser.token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ reason: "Does not meet Arena standards" })
      });
      const data = await res.json();
      if (data.success) {
        setPendingContent((prev) => prev.filter((c) => c._id !== id));
        setCounts(prev => ({ ...prev, pendingPosts: prev.pendingPosts - 1, rejectedPosts: prev.rejectedPosts + 1 }));
      }
    } catch (err) {
      console.error("Rejection Error:", err);
    }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-gray-50">
      <Loader2 className="animate-spin text-blue-600" size={40} />
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      <header className="flex justify-between items-center mb-10">
        <div>
           <h2 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">
            Arena <span className="text-blue-600">Command</span>
          </h2>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mt-2">Moderation & Analytics Engine</p>
        </div>
      </header>

      {/* 📊 Totals Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard color="bg-white" textColor="text-blue-600" label="Total Artists" count={counts.artists} icon={<CheckCircle2 size={20}/>} />
        <StatCard color="bg-white" textColor="text-amber-500" label="Pending Review" count={counts.pendingPosts} icon={<Loader2 size={20}/>} />
        <StatCard color="bg-white" textColor="text-indigo-600" label="Billboard" count={counts.billboardPosts} icon={<Monitor size={20}/>} />
        <StatCard color="bg-white" textColor="text-emerald-600" label="Live on Feed" count={counts.approvedPosts} icon={<LayoutGrid size={20}/>} />
      </div>

      <Dashboard />

      {/* 📋 Moderation Queue */}
      <div className="mt-16">
        <div className="flex items-center gap-4 mb-8">
            <h3 className="text-2xl font-black uppercase italic tracking-widest text-slate-800">Moderation Queue</h3>
            <span className="bg-blue-600 text-white text-xs px-3 py-1 rounded-full font-black">{pendingContent.length}</span>
        </div>
        
        {pendingContent.length === 0 ? (
          <div className="bg-white p-24 rounded-[3rem] text-center border-4 border-dashed border-gray-100 flex flex-col items-center">
              <CheckCircle2 size={48} className="text-emerald-400 mb-4" />
              <p className="text-gray-400 font-black uppercase tracking-[0.2em] italic">The Arena is Clear</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-32">
            {pendingContent.map((item) => (
              <div key={item._id} className={`bg-white rounded-[2.5rem] shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col overflow-hidden border-2 ${item.isForSale ? 'border-yellow-400/40' : 'border-gray-100'} group`}>
                <div className="p-5">
<div 
                    className="relative h-64 bg-slate-900 rounded-[2rem] overflow-hidden cursor-zoom-in group"
                    onClick={() => setSelectedMedia(item)}
                  >
                    {/* 💰 NEW: SHOWROOM INDICATOR */}
                    {item.isForSale && (
                      <div className="absolute top-4 right-4 bg-yellow-500 text-black text-[9px] px-3 py-1.5 rounded-full font-black z-10 shadow-xl uppercase tracking-widest flex items-center gap-1">
                        <ShoppingBag size={10} /> Showroom
                      </div>
                    )}
                    
                    {/* 🔢 SLIDES INDICATOR */}
                    {item.mediaUrls?.length > 1 && (
                      <div className="absolute top-4 left-4 bg-blue-600 text-white text-[9px] px-3 py-1.5 rounded-full font-black z-10 shadow-xl uppercase tracking-widest">
                        {item.mediaUrls.length} Slides
                      </div>
                    )}

                    {/* 🖼️ SMART MEDIA PREVIEW */}
                    {(() => {
                      const slides = item.mediaUrls?.length > 0 ? item.mediaUrls : [item.mediaUrl];
                      const firstMedia = slides[0]?.url || slides[0] || "";
                      const isVideo = typeof firstMedia === 'string' && firstMedia.match(/\.(mp4|webm|ogg|mov)/i) || item.type === "video";

                      if (isVideo) {
                        return (
                          <video 
                            src={firstMedia} 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 pointer-events-none" 
                            muted 
                            loop 
                            autoPlay 
                            playsInline
                            preload="metadata"
                          />
                        );
                      } else if (firstMedia) {
                        return (
                          <img
                            src={firstMedia}
                            alt="Preview"
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 pointer-events-none"
                          />
                        );
                      }
                      return <div className="w-full h-full flex items-center justify-center text-slate-500 text-[10px]">NO MEDIA FOUND</div>;
                    })()}
                  </div>

                  <div className="mt-6 px-2">
                    <h4 className="font-black italic text-xl uppercase tracking-tighter text-slate-900">{item.title}</h4>
                    
                    {/* 💰 NEW: PRICE TAG PREVIEW */}
                    {item.isForSale && (
                      <div className="mt-2 flex items-center gap-2">
                        <Tag size={12} className="text-yellow-600" />
                        <span className="text-sm font-black text-yellow-600 italic">GHS {item.price} <span className="text-[10px] text-slate-400 uppercase not-italic ml-1">({item.condition})</span></span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-3">
                        <img src={item.artistId?.avatar || "/default-avatar.png"} className="w-5 h-5 rounded-full object-cover border border-blue-100" />
                        <span className="text-[10px] text-blue-600 font-black uppercase tracking-widest">@{item.artistId?.username || "Unknown"}</span>
                    </div>
                    <p className="text-slate-400 text-xs mt-4 line-clamp-3 leading-relaxed italic font-medium">"{item.description}"</p>
                  </div>
                </div>

                <div className="p-5 bg-slate-50 flex gap-3 border-t border-gray-100 mt-auto">
                  <button onClick={() => handleApprove(item._id, "billboard")} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[9px] py-4 rounded-2xl uppercase tracking-widest transition-all shadow-lg active:scale-95">Billboard</button>
                  <button onClick={() => handleApprove(item._id, "feed")} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[9px] py-4 rounded-2xl uppercase tracking-widest transition-all shadow-lg active:scale-95">Feed</button>
                  <button onClick={() => handleReject(item._id)} className="bg-rose-500 hover:bg-rose-600 text-white font-black text-[9px] px-5 py-4 rounded-2xl uppercase transition-all shadow-lg active:scale-95"><X size={16}/></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

{/* 🖼️ Multi-Slide Modal */}
      {selectedMedia && (
        <div className="fixed inset-0 bg-slate-950/98 flex items-center justify-center z-[200] p-6" onClick={() => setSelectedMedia(null)}>
          <div className="flex gap-6 overflow-x-auto snap-x snap-mandatory no-scrollbar w-full h-full max-w-6xl items-center" onClick={e => e.stopPropagation()}>
            {(selectedMedia.mediaUrls || [selectedMedia.mediaUrl]).map((mediaItem, idx) => {
              // Safely extract the URL whether it's a string or an object
              const mediaSrc = typeof mediaItem === 'string' ? mediaItem : mediaItem?.url;
              const isVideo = typeof mediaSrc === 'string' && mediaSrc.match(/\.(mp4|webm|ogg|mov)/i);

              return (
                <div key={idx} className="min-w-full h-[85vh] snap-center flex items-center justify-center relative">
                  {isVideo ? (
                    <video 
                      src={mediaSrc} 
                      controls 
                      autoPlay 
                      loop
                      className="max-h-full max-w-full rounded-[2rem] shadow-2xl border border-white/10 object-contain bg-black" 
                    />
                  ) : (
                    <img 
                      src={mediaSrc} 
                      className="max-h-full max-w-full rounded-[2rem] shadow-2xl border border-white/10 object-contain" 
                      alt={`Preview slide ${idx + 1}`}
                    />
                  )}
                  
                  {/* Small badge to show which slide you are looking at */}
                  {(selectedMedia.mediaUrls?.length > 1) && (
                    <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white text-[10px] font-black px-3 py-1.5 rounded-full border border-white/10">
                      SLIDE {idx + 1} OF {selectedMedia.mediaUrls.length}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="absolute top-8 text-white/40 font-black uppercase tracking-[0.5em] text-[10px] animate-pulse">
            Reviewing Asset • Click outside to close (Scroll for more slides)
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ color, textColor, label, count, icon }) => (
  <div className={`${color} rounded-[2.5rem] shadow-sm p-8 flex flex-col items-start border border-gray-100 hover:border-blue-200 transition-all group`}>
    <div className={`p-3 rounded-2xl mb-4 ${textColor} bg-gray-50 group-hover:scale-110 transition-transform`}>{icon}</div>
    <span className={`text-5xl font-black italic tracking-tighter ${textColor}`}>{count}</span>
    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mt-2">{label}</span>
  </div>
);

export default Home;