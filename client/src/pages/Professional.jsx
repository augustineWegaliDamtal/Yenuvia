import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import FeedCard from "../components/FeedCard";
import { Loader2, Briefcase, Grid, List, ArrowLeft } from "lucide-react"; // 🔥 Added ArrowLeft
import customFetch from "../util/customFetch";

const Professional = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'feed'
  const [filter, setFilter] = useState("All");

  const { currentUserArtist } = useSelector((state) => state.artist);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await customFetch(`/api/work/professionals?type=${filter}`);
      const data = await res.json();
      if (data.success) setPosts(data.posts);
    } catch (err) {
      console.error("Pro Sync Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filter]);

  // 🔥 THE ENGINE: Wakes up videos on scroll and pauses the rest!
  useEffect(() => {
    if (viewMode !== "feed") return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Find all videos in the specific FeedCard that just entered/left the screen
          const videos = entry.target.querySelectorAll("video");
          
          if (entry.isIntersecting) {
            // Play when it snaps into view
            videos.forEach((v) => v.play().catch(() => console.log("Autoplay blocked")));
          } else {
            // Pause and reset when swiped away
            videos.forEach((v) => {
              v.pause();
              v.currentTime = 0;
            });
          }
        });
      },
      { threshold: 0.6 } // Triggers when the card is 60% visible
    );

    // Attach observer to all feed cards
    const items = document.querySelectorAll(".feed-card-item");
    items.forEach((item) => observer.observe(item));

    return () => observer.disconnect();
  }, [posts, viewMode]);

  const handleLike = async (id) => {
    try {
      const res = await customFetch(`/api/work/${id}/like`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${currentUserArtist?.token}` },
      });
      const data = await res.json();
      if (data.success) setPosts(prev => prev.map(p => p._id === id ? data.data : p));
    } catch (err) { console.error(err); }
  };

  const handleComment = async (id, text) => {
    // Keep your optimistic logic here
  };

  return (
    <div className="bg-black min-h-screen pb-24 px-4 pt-4 relative">
      {/* 🏛️ PRO HEADER & CONTROLS */}
      <div className="flex flex-col gap-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
             <div className="bg-yellow-500 p-2 rounded-xl text-black">
               <Briefcase size={20} />
             </div>
             <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white">
               Pro <span className="text-yellow-500">Showroom</span>
             </h2>
          </div>
          
          <div className="flex bg-zinc-900 rounded-full p-1 border border-white/5">
            <button 
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-full transition ${viewMode === "grid" ? "bg-yellow-500 text-black" : "text-gray-500"}`}
            >
              <Grid size={18} />
            </button>
            <button 
              onClick={() => setViewMode("feed")}
              className={`p-2 rounded-full transition ${viewMode === "feed" ? "bg-yellow-500 text-black" : "text-gray-500"}`}
            >
              <List size={18} />
            </button>
          </div>
        </div>

        {/* 🏷️ FILTER CHIPS */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {["All", "Image", "Video", "Carousel"].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                filter === type 
                ? "bg-yellow-500 text-black shadow-[0_0_15px_#eab308]" 
                : "bg-zinc-900 text-gray-500 border border-white/5"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* 🖼️ CONTENT RENDERER */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="text-yellow-500 animate-spin" size={32} />
        </div>
      ) : posts.length === 0 ? (
        <p className="text-center text-gray-600 font-bold uppercase text-xs italic py-20">
          The Professional Arena is waiting for talent...
        </p>
      ) : viewMode === "grid" ? (
        
        /* 📱 MASONRY STYLE GRID */
        <div className="grid grid-cols-2 gap-3">
          {posts.map((post) => (
            <div 
              key={post._id} 
              onClick={() => setViewMode("feed")} // Jump to immersive feed on click
              className="relative aspect-[3/4] rounded-3xl overflow-hidden border border-white/5 bg-zinc-900 group cursor-pointer"
            >
              {post.type === "video" ? (
                <video 
                  src={post.mediaUrls?.[0] || post.mediaUrl} 
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500 pointer-events-none"
                  autoPlay 
                  muted 
                  loop 
                  playsInline
                />
              ) : (
                <img 
                  src={post.mediaUrls?.[0] || post.mediaUrl} 
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500 pointer-events-none" 
                  alt={post.title}
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80 pointer-events-none" />
              <div className="absolute bottom-3 left-3 right-3 pointer-events-none">
                <p className="text-white font-black italic uppercase text-[9px] truncate">{post.title}</p>
                <p className="text-yellow-500 text-[8px] font-bold">@{post.artistName || post.artistId?.username}</p>
              </div>
            </div>
          ))}
        </div>

      ) : (

        /* 🎬 IMMERSIVE FULL-SCREEN FEED */
        <div className="fixed inset-0 z-[100] bg-black">
          
          {/* Floating Back Button to return to Grid */}
          <button 
            onClick={() => setViewMode("grid")} 
            className="absolute top-[env(safe-area-inset-top,20px)] left-4 z-[110] mt-4 p-3 bg-black/40 backdrop-blur-md rounded-full text-white border border-white/10 active:scale-90 transition-transform shadow-2xl"
          >
            <ArrowLeft size={24} />
          </button>

          {/* The Snap-Scroll Container */}
          <div className="h-[100dvh] w-full overflow-y-auto snap-y snap-mandatory no-scrollbar pb-20">
            {posts.map((post) => (
              <div key={post._id} className="feed-card-item w-full h-[100dvh] snap-start">
                <FeedCard
                  post={post}
                  handleLike={handleLike}
                  handleComment={handleComment}
                  handleShare={() => {}}
                  handleDeleteComment={() => {}}
                />
              </div>
            ))}
          </div>
        </div>

      )}
    </div>
  );
};

export default Professional;