import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Loader2, Film } from "lucide-react"; 

import { toJpeg } from "html-to-image";
import { useSocket } from "../context/SocketContext";
import customFetch from "../utility/customFetch";

const backgroundPreload = (url, callback) => {
  if (!url) return callback();
  const isVideo = url.match(/\.(mp4|webm|ogg|mov)$/i);
  if (isVideo) {
    const vid = document.createElement("video");
    vid.src = url;
    vid.preload = "auto";
    vid.oncanplaythrough = callback; 
    vid.onerror = callback; 
    vid.load();
  } else {
    const img = new Image();
    img.src = url;
    img.onload = callback;
    img.onerror = callback;
  }
};

const AdminBillboard = ({ liveUpdateTrigger }) => {
  // 🔥 FIX 1: Start completely empty and loading. Zero localStorage caching.
  const [billPosts, setBillPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [currentIndex, setCurrentIndex] = useState(0); 
  const [activeSlide, setActiveSlide] = useState(0);   
  const [slideDuration, setSlideDuration] = useState(5);
  
  const [isFetchingNext, setIsFetchingNext] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [isVideoSigning, setIsVideoSigning] = useState(false); 

  const socket = useSocket();
  const billboardRef = useRef(null);

  // 🔥 FIX 2: Always fetch the absolute truth from the database on mount
  useEffect(() => {
    let isMounted = true;
    const syncBillboard = async () => {
      try {
        const postsRes = await customFetch(`/api/work/search?status=billboard&_t=${Date.now()}`);
        const postsData = await postsRes.json();
        
        if (isMounted && postsData.success) {
          const works = postsData.works || [];
          const top6 = works.slice(0, 6);
          
          setBillPosts(top6); // Set state directly. No localStorage!

          const firstUrl = top6[0]?.mediaUrls?.[0] || top6[0]?.mediaUrl;
          backgroundPreload(firstUrl, () => {
            if (isMounted) setLoading(false);
          });
        }
      } catch (err) {
        console.error("Billboard Sync Error:", err);
        if (isMounted) setLoading(false);
      }
    };

    syncBillboard();
    
    return () => { isMounted = false; };
  }, []); 

  // Secondary refresh trigger (if used by a parent component)
  useEffect(() => {
    if (liveUpdateTrigger > 0) {
      const fetchFreshBillboard = async () => {
        try {
          const cacheBuster = Date.now();
          const postsRes = await customFetch(`/api/work/search?status=billboard&_t=${cacheBuster}`);
          const postsData = await postsRes.json();
          if (postsData.success) {
            const top6 = (postsData.works || []).slice(0, 6);
            setBillPosts(top6);
          }
        } catch (err) {
          console.error("Failed to refresh billboard:", err);
        }
      };
      fetchFreshBillboard();
    }
  }, [liveUpdateTrigger]);

  // 🔥 FIX 3: Clean socket listeners that only update React state
  useEffect(() => {
    if (!socket) return;
    
    const handleNewBillboardItem = (data) => {
      if (data.destination === 'billboard' && data.work) {
        setBillPosts(prev => {
          if (prev.some(p => p._id === data.work._id)) return prev;
          const newPosts = [data.work, ...prev].slice(0, 6);
          
          const newUrl = data.work.mediaUrls?.[0] || data.work.mediaUrl;
          backgroundPreload(newUrl, () => {});
          
          return newPosts;
        });
      }
    };

    const handleRemoveItem = (data) => {
      if (data.workId) {
        setBillPosts(prev => prev.filter(post => post._id !== data.workId));
      }
    };

    socket.on("new_global_feed_item", handleNewBillboardItem);
    socket.on("work_removed_from_feed", handleRemoveItem);

    return () => {
      socket.off("new_global_feed_item", handleNewBillboardItem);
      socket.off("work_removed_from_feed", handleRemoveItem);
    };
  }, [socket]);

  useEffect(() => {
    if (currentIndex >= billPosts.length && billPosts.length > 0) {
      setCurrentIndex(0);
      setActiveSlide(0);
    }
  }, [billPosts.length, currentIndex]);

  const triggerNext = useCallback(() => {
    if (isFetchingNext || billPosts.length === 0) return;
    const currentPost = billPosts[currentIndex];
    const totalSlides = currentPost?.mediaUrls?.length || 1;
    let nextSlide = activeSlide;
    let nextIndex = currentIndex;

    if (activeSlide < totalSlides - 1) {
      nextSlide = activeSlide + 1;
    } else {
      nextSlide = 0;
      nextIndex = (currentIndex + 1) % billPosts.length;
    }

    const nextPost = billPosts[nextIndex];
    const nextUrl = nextPost?.mediaUrls?.[nextSlide] || nextPost?.mediaUrl;

    if (!nextUrl) return;
    setIsFetchingNext(true);

    backgroundPreload(nextUrl, () => {
      setActiveSlide(nextSlide);
      setCurrentIndex(nextIndex);
      setIsFetchingNext(false);
    });
  }, [billPosts, currentIndex, activeSlide, isFetchingNext]);

  useEffect(() => {
    if (billPosts.length === 0 || loading || isFetchingNext) return;
    const currentPost = billPosts[currentIndex];
    if (currentPost?.type === "video") return;

    setSlideDuration(5);
    const timer = setTimeout(() => {
      triggerNext();
    }, 5000); 

    return () => clearTimeout(timer);
  }, [billPosts, currentIndex, triggerNext, loading, isFetchingNext]);

  const currentPost = useMemo(() => billPosts[currentIndex], [billPosts, currentIndex]);
  const slides = useMemo(() => (
    currentPost?.mediaUrls?.length > 0 ? currentPost.mediaUrls : [currentPost?.mediaUrl]
  ), [currentPost]);

  // =========================================================================
  // 🔥 BUTTON 1 (TOP): DOWNLOAD CURRENT IMAGE OR STAMP CURRENT VIDEO
  // =========================================================================
  const generateSignature = async (e) => {
    e.stopPropagation();
    if (isSigning || !slides[activeSlide]) return;
    
    setIsSigning(true);
    try {
      const currentMediaUrl = slides[activeSlide];
      const isVideo = currentMediaUrl.match(/\.(mp4|webm|ogg|mov)$/i);

      if (!isVideo) {
        if (!billboardRef.current) throw new Error("Billboard container not found");
        const dataUrl = await toJpeg(billboardRef.current, { 
          quality: 0.85, 
          useCORS: true,
          cacheBust: true
        });
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `Yenuvia-Masterpiece-${currentPost?.artistId?.username || 'Exclusive'}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const res = await customFetch(`/api/viral/generate-video`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            imageUrls: [currentMediaUrl], 
            artistName: currentPost?.artistId?.username || "Yenuvia Creator",
            schoolName: currentPost?.artistId?.school || "Yenuvia Elite"
          })
        });

        if (!res.ok) throw new Error("Backend compilation failed");
        
        const blob = await res.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `Yenuvia-Video-Stamp-${currentPost?.artistId?.username || 'Masterpiece'}.mp4`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      }
    } catch (err) {
      console.error("Download failed:", err);
      alert("Failed to download media. Please check your connection.");
    } finally {
      setIsSigning(false);
    }
  };

  // =========================================================================
  // 🔥 BUTTON 2 (BOTTOM): STITCH IMAGES & IGNORE VIDEOS
  // =========================================================================
  const generateVideoSignature = async (e) => {
    e.stopPropagation();
    if (isVideoSigning || slides.length === 0) return;
    
    const videoExtensions = ['mp4', 'webm', 'ogg', 'mov', 'm4v'];
    const imageOnlyUrls = slides.filter(slide => {
      const url = typeof slide === 'string' ? slide : slide?.url;
      return !videoExtensions.some(ext => url.toLowerCase().includes(`.${ext}`));
    });

    if (imageOnlyUrls.length === 0) {
      alert("No images found to stitch! Please select a post with images.");
      return;
    }

    setIsVideoSigning(true);
    try {
      const res = await customFetch(`/api/viral/generate-video`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          imageUrls: imageOnlyUrls,
          artistName: currentPost?.artistId?.username || "YenuviaCreator",
          schoolName: currentPost?.artistId?.school || "YenuviaElite"
        })
      });

      if (!res.ok) throw new Error("Backend compilation failed");
      
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `Yenuvia-Stitch-${currentPost?.artistId?.username || 'Masterpiece'}.mp4`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      
    } catch (err) {
      console.error("Video compilation failed:", err);
      alert("Backend error stitching images. Check server logs.");
    } finally {
      setIsVideoSigning(false);
    }
  };

  if (loading) return (
    <div className="w-full space-y-4 pt-2 px-4 md:px-0">
      <div className="h-[500px] md:h-[650px] flex items-center justify-center bg-zinc-950 rounded-[3rem] border border-white/5 shadow-2xl">
          <Loader2 className="animate-spin text-zinc-400" size={32} />
      </div>
    </div>
  );

  if (billPosts.length === 0) return (
    <div className="w-full space-y-4 pt-2 px-4 md:px-0">
      <div className="h-[500px] md:h-[650px] flex items-center justify-center bg-zinc-950 rounded-[3rem] border border-white/5 shadow-inner">
        <p className="text-white/20 font-black uppercase tracking-widest italic text-[10px]">Yenuvia Billboard Empty</p>
      </div>
    </div>
  );

  return (
    <div className="w-full space-y-4 pt-2 px-4 md:px-0 select-none">
      
      <div className="relative w-full h-[600px] md:h-[780px] group">
        
        {/* 🔥 INNER REF CONTAINER: Only this part gets screenshotted! */}
        <div ref={billboardRef} className="absolute inset-0 rounded-[3.5rem] overflow-hidden bg-zinc-950 shadow-[0_50px_100px_rgba(0,0,0,0.9)]">
          
          <AnimatePresence mode="wait">
            <motion.div
              key={`${currentPost?._id}-${activeSlide}`} 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }} 
              transition={{ duration: 0.6, ease: "easeInOut" }} 
              className="absolute inset-0 w-full h-full bg-zinc-950 z-0"
            >
              {currentPost?.type === "video" ? (
                <video
                  src={slides[activeSlide]}
                  autoPlay muted playsInline
                  crossOrigin="anonymous" 
                  onEnded={triggerNext} 
                  onLoadedData={(e) => setSlideDuration(e.target.duration || 5)} 
                  className="w-full h-full object-cover brightness-95"
                  style={{ backgroundColor: "transparent" }}
                />
              ) : (
                <img 
                  src={slides[activeSlide]} 
                  crossOrigin="anonymous" 
                  className="w-full h-full object-cover brightness-95" 
                  alt="Yenuvia Billboard" 
                />
              )}
            </motion.div>
          </AnimatePresence>

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/60 pointer-events-none z-10" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40 pointer-events-none z-10" />

          {/* LAYER 3: ASH EFFIGY TYPOGRAPHY HUD */}
          <div className="absolute inset-0 z-20 p-4 md:p-10 pb-12 md:pb-8 flex flex-col justify-between pointer-events-none text-white overflow-hidden">
            
            <div className="absolute inset-0 pointer-events-none flex justify-center items-center z-0 opacity-30 mix-blend-overlay">
              <motion.div
                animate={{ y: [-15, 15, -15], opacity: [0.4, 0.7, 0.4] }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-[15%] -left-6  text-[4rem] md:text-[9rem] font-black font-serif text-zinc-300 leading-none -rotate-6 tracking-tighter"
              >
                BILLBOARD
              </motion.div>
              <motion.div
                animate={{ y: [15, -15, 15], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                className="absolute bottom-[25%] -right-12 -left-4 text-[4rem] md:text-[8rem] font-black font-serif text-zinc-400 leading-none rotate-3 tracking-widest"
              >
                YENUVIA
              </motion.div>
            </div>

            <div className="w-full flex flex-col items-center mt-0 md:mt-4 space-y-1.5 md:space-y-2 z-30 relative">
              <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full shadow-lg scale-90 md:scale-100">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                <p className="text-zinc-100 text-[9px] md:text-[10px] font-black tracking-[0.2em] uppercase">
                  LIVE YENUVIA BILLBOARD
                </p>
              </div>
              <h1 className="text-xl sm:text-2xl md:text-5xl font-black tracking-tight uppercase text-zinc-100 drop-shadow-[0_10px_20px_rgba(0,0,0,0.9)] font-serif text-center px-4">
                VISION <span className="text-zinc-400 font-serif font-bold italic">&</span> PRESTIGE!
              </h1>
            </div>

            <div className="relative flex-1 w-full z-30">
              <div className="absolute top-[15%] md:top-[20%] left-2 md:left-8 w-40 sm:w-56 drop-shadow-[0_8px_16px_rgba(0,0,0,0.9)]">
                <motion.h3 
                  animate={{ scale: [1, 1.03, 1], filter: ["blur(0px)", "blur(1.5px)", "blur(0px)"] }} 
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                  className="text-zinc-300 text-lg sm:text-2xl md:text-4xl font-black font-serif leading-[1.1] tracking-tight origin-left mix-blend-screen"
                >
                  EXCLUSIVE<br/>SHOWCASE
                </motion.h3>
                <p className="text-zinc-400 text-[9px] sm:text-xs md:text-sm font-bold tracking-widest uppercase mt-2 leading-relaxed">
                  UNRIVALED BRILLIANCE
                </p>
              </div>
              <div className="absolute bottom-[10%] md:bottom-[15%] right-2 md:right-8 w-40 sm:w-56 text-right drop-shadow-[0_8px_16px_rgba(0,0,0,0.9)]">
                <motion.h3 
                  animate={{ scale: [1, 1.03, 1], filter: ["blur(0px)", "blur(1.5px)", "blur(0px)"] }} 
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                  className="text-zinc-300 text-lg sm:text-2xl mb-5 md:text-4xl font-black font-serif leading-[1.1] tracking-tight origin-right mix-blend-screen"
                >
                  HALL OF<br/>FAME
                </motion.h3>
                <p className="text-zinc-400 text-[9px] mb-38 sm:text-xs md:text-sm font-bold tracking-widest uppercase mt-2 leading-relaxed">
                  WITNESS GREATNESS
                </p>
              </div>
            </div>

            <div className="w-full flex flex-col items-center justify-end relative pb-4 md:pb-6 z-30">
              <div className="text-center drop-shadow-[0_10px_20px_rgba(0,0,0,0.9)] w-full px-4">
                <h2 className="text-lg sm:text-2xl md:text-6xl font-black font-serif tracking-tight text-zinc-100 italic leading-tight" style={{ textShadow: "2px 4px 10px rgba(0,0,0,0.9)" }}>
                  YENUVIA HALL OF <span className="text-zinc-400">FAME</span>
                </h2>
                <p className="text-zinc-400 text-[8px] sm:text-xs md:text-sm font-bold tracking-[0.2em] uppercase mt-1 md:mt-4 mb-2 md:mb-3">INSPIRE. ACHIEVE. SUCCEED!</p>
              </div>
              <div className="absolute bottom-0 right-0 md:bottom-4 md:right-4 flex flex-col items-end scale-75 md:scale-100 origin-bottom-right mix-blend-screen opacity-80">
                <div className="bg-zinc-200 p-1 md:p-1.5 flex flex-col items-center rounded-sm">
                  <div className="flex h-8 md:h-10 items-end gap-[1px] md:gap-[1.5px] px-1">
                    <div className="w-[2px] h-full bg-black"></div><div className="w-[1px] h-full bg-black"></div><div className="w-[3px] h-[85%] bg-black"></div><div className="w-[1px] h-[85%] bg-black"></div><div className="w-[4px] h-[85%] bg-black"></div><div className="w-[2px] h-[85%] bg-black"></div><div className="w-[1px] h-[85%] bg-black"></div><div className="w-[3px] h-[85%] bg-black"></div><div className="w-[2px] h-[85%] bg-black"></div><div className="w-[1px] h-[85%] bg-black"></div><div className="w-[2px] h-full bg-black"></div><div className="w-[1px] h-full bg-black"></div><div className="w-[4px] h-[85%] bg-black"></div><div className="w-[2px] h-[85%] bg-black"></div><div className="w-[1px] h-[85%] bg-black"></div><div className="w-[3px] h-[85%] bg-black"></div><div className="w-[1px] h-[85%] bg-black"></div><div className="w-[2px] h-[85%] bg-black"></div><div className="w-[1px] h-[85%] bg-black"></div><div className="w-[2px] h-full bg-black"></div>
                  </div>
                  <span className="text-[6px] md:text-[8px] font-mono font-bold text-black tracking-widest mt-0.5">6  85566 33235  5</span>
                </div>
              </div>
            </div>

            <div className="absolute bottom-0 left-0 w-full bg-white/5 h-1 z-30">
              <motion.div 
                key={`${currentIndex}-${activeSlide}`}
                initial={{ width: 0 }}
                animate={{ width: isFetchingNext ? "100%" : "100%" }}
                transition={{ duration: slideDuration, ease: "linear" }} 
                className={`h-full ${isFetchingNext ? 'bg-zinc-300' : 'bg-zinc-400'}`}
              />
            </div>
          </div>
        </div>

        {/* LAYER 4: UTILITY CONTROLS */}
        <div className="absolute top-6 right-6 z-30 flex flex-col gap-3 pointer-events-auto">
          <button 
            onClick={generateSignature} 
            disabled={isSigning || isVideoSigning} 
            title="Download Single Image/Video"
            className="bg-black/60 backdrop-blur-md border border-white/20 p-2.5 rounded-full text-white hover:text-zinc-400 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center shadow-lg"
          >
            {isSigning ? <Loader2 size={18} className="animate-spin text-zinc-400" /> : <Download size={18} />}
          </button>
          
          <button 
            onClick={generateVideoSignature} 
            disabled={isSigning || isVideoSigning} 
            title="Stitch Images into Video"
            className="bg-black/60 backdrop-blur-md border border-white/20 p-2.5 rounded-full text-white hover:text-zinc-400 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center shadow-lg"
          >
            {isVideoSigning ? <Loader2 size={18} className="animate-spin text-zinc-400" /> : <Film size={18} />}
          </button>
        </div>

        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-auto">
          {billPosts.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                if (idx === currentIndex || isFetchingNext) return;
                setIsFetchingNext(true); 
                const targetPost = billPosts[idx];
                const targetUrl = targetPost?.mediaUrls?.[0] || targetPost?.mediaUrl;
                
                backgroundPreload(targetUrl, () => {
                  setActiveSlide(0);
                  setCurrentIndex(idx);
                  setIsFetchingNext(false); 
                });
              }}
              className={`w-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? "h-8 bg-zinc-400" : "h-2 bg-white/40 hover:bg-white/70"} ${isFetchingNext && idx !== currentIndex ? 'opacity-30 cursor-not-allowed' : ''}`} 
            />
          ))}
        </div>

      </div>
    </div>
  );
};

export default React.memo(AdminBillboard);