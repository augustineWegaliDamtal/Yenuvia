import React, { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react"; 
import HeroBanner from "./HeroBanner"; 
import { useSocket } from '../context/SocketContext';
import customFetch from "../util/customFetch.js";

// 🔥 THE ENGINE: Downloads media completely in the background
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

const Billboard = ({ liveUpdateTrigger }) => {
  const [billPosts, setBillPosts] = useState(() => {
    const cachedPosts = localStorage.getItem("arena_billboard_posts");
    return cachedPosts ? JSON.parse(cachedPosts) : [];
  });

  const [loading, setLoading] = useState(billPosts.length === 0);
  const [currentIndex, setCurrentIndex] = useState(0); 
  const [activeSlide, setActiveSlide] = useState(0);   
  const [slideDuration, setSlideDuration] = useState(5);
  const [isFetchingNext, setIsFetchingNext] = useState(false);
  
  const socket = useSocket();

  useEffect(() => {
    let isMounted = true;
    const syncBillboard = async () => {
      try {
       const postsRes = await customFetch(`/api/work/search?status=billboard&_t=${Date.now()}`);
        const postsData = await postsRes.json();
        if (isMounted && postsData.success) {
          const works = postsData.works || [];
          const top6 = works.slice(0, 6);
          setBillPosts(top6);
          localStorage.setItem("arena_billboard_posts", JSON.stringify(top6));

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

    if (billPosts.length === 0) {
      syncBillboard();
    } else {
      const firstUrl = billPosts[0]?.mediaUrls?.[0] || billPosts[0]?.mediaUrl;
      backgroundPreload(firstUrl, () => setLoading(false));
    }
    return () => { isMounted = false; };
  }, [billPosts.length]);

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
            localStorage.setItem("arena_billboard_posts", JSON.stringify(top6));
          }
        } catch (err) {
          console.error("Failed to refresh billboard:", err);
        }
      };
      fetchFreshBillboard();
    }
  }, [liveUpdateTrigger]);

  useEffect(() => {
    if (!socket) return;
    const handleNewBillboardItem = (data) => {
      if (data.destination === 'billboard' && data.work) {
        setBillPosts(prev => {
          if (prev.some(p => p._id === data.work._id)) return prev;
          const newPosts = [data.work, ...prev].slice(0, 6);
          localStorage.setItem("arena_billboard_posts", JSON.stringify(newPosts));
          const newUrl = data.work.mediaUrls?.[0] || data.work.mediaUrl;
          backgroundPreload(newUrl, () => {});
          return newPosts;
        });
      }
    };

    const handleRemoveItem = (data) => {
      if (data.workId) {
        setBillPosts(prev => {
          const newPosts = prev.filter(post => post._id !== data.workId);
          localStorage.setItem("arena_billboard_posts", JSON.stringify(newPosts));
          return newPosts;
        });
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

  if (loading) return (
    <div className="w-full space-y-4 pt-2 px-4 md:px-0">
      <HeroBanner liveUpdateTrigger={liveUpdateTrigger} />
      <div className="h-[70vh] md:h-[400px] flex items-center justify-center bg-zinc-950 rounded-[2.5rem] border border-white/5 shadow-2xl">
          {/* 🔥 Loader color changed to yellow */}
          <Loader2 className="animate-spin text-yellow-500" size={32} />
      </div>
    </div>
  );

  if (billPosts.length === 0) return (
    <div className="w-full space-y-4 pt-2 px-4 md:px-0">
      <HeroBanner liveUpdateTrigger={liveUpdateTrigger} />
      <div className="h-[70vh] md:h-[400px] flex items-center justify-center bg-zinc-950 rounded-[2.5rem] border border-white/5 shadow-inner">
        <p className="text-white/20 font-black uppercase tracking-widest italic text-[10px]">Yenuvia Billboard Empty</p>
      </div>
    </div>
  );

  return (
    <div className="w-full space-y-4  pt-0 px-4 py-10 select-none">
      
      <HeroBanner liveUpdateTrigger={liveUpdateTrigger} />

      {/* 🔥 INCREASED HEIGHT: 70vh on Phone, 400px on Laptop */}
      <div className="relative w-full h-[70vh] md:h-[400px] rounded-[2.5rem] mt-0 overflow-hidden bg-zinc-950 shadow-[0_30px_60px_rgba(0,0,0,0.9)] group">
        
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
                onEnded={triggerNext} 
                onLoadedData={(e) => setSlideDuration(e.target.duration || 5)} 
                className="w-full h-full object-cover brightness-95"
                style={{ backgroundColor: "transparent" }}
              />
            ) : (
              <img 
                src={slides[activeSlide]} 
                className="w-full h-full object-cover brightness-95" 
                alt="Yenuvia Billboard" 
              />
            )}
          </motion.div>
        </AnimatePresence>

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/60 pointer-events-none z-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40 pointer-events-none z-10" />

        <div className="absolute inset-0 z-20 p-4 pb-10 flex flex-col justify-between pointer-events-none text-white overflow-hidden">
          
          <div className="absolute inset-0 pointer-events-none flex justify-center items-center z-0 opacity-30 mix-blend-overlay">
            <motion.div
              animate={{ y: [-15, 15, -15], opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
              // Text size clamped to 4rem on PC so it isn't overpowering
              className="absolute top-[15%] -left-6 text-[4rem] md:text-[4rem] font-black font-serif text-zinc-300 leading-none -rotate-6 tracking-tighter"
            >
              BILLBOARD
            </motion.div>
            <motion.div
              animate={{ y: [15, -15, 15], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
              // Text size clamped to 4rem on PC
              className="absolute bottom-[25%] -right-12 -left-4 text-[4rem] md:text-[4rem] font-black font-serif text-zinc-400 leading-none rotate-3 tracking-widest"
            >
              YENUVIA
            </motion.div>
          </div>

          <div className="w-full flex flex-col items-center mt-2 space-y-1.5 z-30 relative">
            {/* Added md:scale-75 to shrink badge on PC */}
            <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full shadow-lg scale-90 md:scale-75">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
              <p className="text-zinc-100 text-[12px] font-black tracking-[0.2em] uppercase">
                LIVE YENUVIA BILLBOARD
              </p>
            </div>
            {/* 🔥 Headline text color changed to yellow */}
            <h1 className="text-xl sm:text-xl md:text-lg font-black tracking-tight uppercase text-yellow-500 drop-shadow-[0_10px_20px_rgba(0,0,0,0.9)] font-serif text-center px-4">
              VISION <span className="text-zinc-400 font-serif font-bold italic">& PRESTIGE!</span> 
            </h1>
          </div>

          <div className="relative flex-1 w-full z-30">
            {/* Adjusted widths and top position for PC scaling */}
            <div className="absolute top-[15%] md:top-[10%] left-4 w-32 sm:w-36 md:w-32 drop-shadow-[0_8px_16px_rgba(0,0,0,0.9)]">
              {/* 🔥 "EXCLUSIVE SHOWCASE" color changed to yellow */}
              <motion.h3 
                animate={{ scale: [1, 1.03, 1], filter: ["blur(0px)", "blur(1.5px)", "blur(0px)"] }} 
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="text-yellow-500 text-base sm:text-lg md:text-base font-black font-serif leading-[1.1] tracking-tight origin-left mix-blend-screen"
              >
                EXCLUSIVE<br/><span className="text-zinc-400 font-serif font-bold italic">SHOWCASE</span> 

              </motion.h3>
              <p className="text-zinc-400 text-[8px] sm:text-[9px] md:text-[8px] font-bold tracking-widest uppercase mt-2 leading-relaxed">
                UNRIVALED BRILLIANCE
              </p>
            </div>
            {/* Adjusted widths and bottom position for PC scaling */}
            <div className="absolute bottom-[10%] md:bottom-[10%] right-4 w-32 sm:w-36 md:w-32 text-right drop-shadow-[0_8px_166px_rgba(0,0,0,0.9)]">
              {/* 🔥 "HALL OF FAME" color changed to yellow */}
              <motion.h3 
                animate={{ scale: [1, 1.03, 1], filter: ["blur(0px)", "blur(1.5px)", "blur(0px)"] }} 
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                className="text-yellow-500 text-base sm:text-lg md:text-base mb-4 font-black font-serif leading-[1.1] tracking-tight origin-right mix-blend-screen"
              >
                HALL OF<br/> <span className="text-zinc-400 font-serif font-bold italic">FAME</span>
              </motion.h3>
              <p className="text-zinc-400 text-[8px] sm:text-[9px] md:text-[8px] font-bold tracking-widest uppercase leading-relaxed">
                WITNESS GREATNESS
              </p>
            </div>
          </div>

          <div className="w-full flex flex-col items-center justify-end relative pb-2 z-30">
            <div className="text-center drop-shadow-[0_10px_20px_rgba(0,0,0,0.9)] w-full px-4">
               {/* Shrunk bottom header for PC */}
               {/* 🔥 Bottom header text color changed to yellow */}
              <h2 className="text-lg sm:text-xl md:text-lg font-black font-serif tracking-tight text-yellow-500 italic leading-tight" style={{ textShadow: "2px 4px 10px rgba(0,0,0,0.9)" }}>
                YENUVIA HALL  <span className="text-zinc-400">OF FAME</span>
              </h2>
              <p className="text-zinc-400 text-[8px] sm:text-[9px] md:text-[8px] font-bold tracking-[0.2em] uppercase mt-2 mb-2">INSPIRE. ACHIEVE. SUCCEED!</p>
            </div>
            {/* Minimized barcode on PC using md:scale-50 */}
            <div className="absolute bottom-0.5 right-0.5   flex flex-col items-end scale-[0.65] md:scale-50 origin-bottom-right mix-blend-screen opacity-80">
              <div className="bg-zinc-200 p-1.5 flex flex-col items-center rounded-sm">
                <div className="flex h-8 items-end gap-[1px] px-1">
                  <div className="w-[2px] h-full bg-black"></div><div className="w-[1px] h-full bg-black"></div><div className="w-[3px] h-[85%] bg-black"></div><div className="w-[1px] h-[85%] bg-black"></div><div className="w-[4px] h-[85%] bg-black"></div><div className="w-[2px] h-[85%] bg-black"></div><div className="w-[1px] h-[85%] bg-black"></div><div className="w-[3px] h-[85%] bg-black"></div><div className="w-[2px] h-[85%] bg-black"></div><div className="w-[1px] h-[85%] bg-black"></div><div className="w-[2px] h-full bg-black"></div><div className="w-[1px] h-full bg-black"></div><div className="w-[4px] h-[85%] bg-black"></div><div className="w-[2px] h-[85%] bg-black"></div><div className="w-[1px] h-[85%] bg-black"></div><div className="w-[3px] h-[85%] bg-black"></div><div className="w-[1px] h-[85%] bg-black"></div><div className="w-[2px] h-[85%] bg-black"></div><div className="w-[1px] h-[85%] bg-black"></div><div className="w-[2px] h-full bg-black"></div>
                </div>
                <span className="text-[6px] font-mono font-bold text-black tracking-widest mt-0.5">6  85566 33235  5</span>
              </div>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 w-full bg-white/5 h-1 z-30">
            {/* 🔥 Progress bar colors changed to yellow */}
            <motion.div 
              key={`${currentIndex}-${activeSlide}`}
              initial={{ width: 0 }}
              animate={{ width: isFetchingNext ? "100%" : "100%" }}
              transition={{ duration: slideDuration, ease: "linear" }} 
              className={`h-full ${isFetchingNext ? 'bg-yellow-400' : 'bg-yellow-500'}`}
            />
          </div>
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
              // 🔥 Active dot color changed to yellow
              className={`w-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? "h-8 bg-yellow-500" : "h-2 bg-white/40 hover:bg-white/70"} ${isFetchingNext && idx !== currentIndex ? 'opacity-30 cursor-not-allowed' : ''}`} 
            />
          ))}
        </div>

      </div>
    </div>
  );
};

export default React.memo(Billboard);