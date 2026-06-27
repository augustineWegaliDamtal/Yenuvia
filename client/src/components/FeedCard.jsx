import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom"; 
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, Share2, Volume2, VolumeX, Loader2, ShoppingBag, User, Download, Gift, Play } from "lucide-react";
import { SET_LIVE_ALERT } from "../redux/users/notificationsSlice"; 
import VerifiedBadge from "./VerifiedBadge";
import CommentPanel from "./CommentPanel";
import { toggleGlobalMute } from "../redux/users/settingsSlice";
import GhanaCardModal from "./GhanaCardModal"; 

const FeedCard = ({ post, handleLike, handleShare, leaderboard }) => {
  const [showComments, setShowComments] = useState(false);
  const [donationAmount, setDonationAmount] = useState("");
  const [isVideoBuffering, setIsVideoBuffering] = useState(true);
  
  const [isInView, setIsInView] = useState(false);
  const cardRef = useRef(null);
  
  const { isGlobalMuted } = useSelector((state) => state.ui);
  const [showHeart, setShowHeart] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const [isPlaying, setIsPlaying] = useState(false); 
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [showIdModal, setShowIdModal] = useState(false);

  const videoRefs = useRef([]); 
  const lastTap = useRef(0);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const activeUser = useSelector((state) => state.user?.currentUser || state.artist?.currentUserArtist);

  // 🔥 FIX: Replaced static variables with Optimistic UI Local State
  const [localIsLiked, setLocalIsLiked] = useState(post.likedBy?.includes(activeUser?._id));
  const [localLikeCount, setLocalLikeCount] = useState(post.likes || 0);
  const [localShareCount, setLocalShareCount] = useState(post.shares || 0);
  const [commentCount, setCommentCount] = useState(post.commentsList?.length || 0);

  // 🔥 FIX: Keep local state synced if the server updates the parent post object
  useEffect(() => {
    setLocalIsLiked(post.likedBy?.includes(activeUser?._id));
    setLocalLikeCount(post.likes || 0);
    setLocalShareCount(post.shares || 0);
    if (post.commentsList?.length !== undefined) {
      setCommentCount(post.commentsList.length);
    }
  }, [post.likedBy, post.likes, post.shares, post.commentsList, activeUser]);

  // Cloudinary Optimization Engine
  const slides = useMemo(() => {
    const rawSlides = post.mediaUrls?.length > 0 
      ? post.mediaUrls 
      : [{ url: post.mediaUrl, type: post.type }];

    return rawSlides.map(item => {
      const urlString = typeof item === 'string' ? item : item.url || item.mediaUrl;
      const isVideo = urlString?.match(/\.(mp4|webm|ogg|mov)/i); 
      let finalUrl = urlString;

      if (isVideo && finalUrl.includes('cloudinary.com') && !finalUrl.includes('q_auto')) {
        finalUrl = finalUrl.replace(/\/upload\/v\d+/, '/upload');
        finalUrl = finalUrl.replace(/\/upload\//, '/upload/f_mp4,q_auto:good,w_1080,vc_h264/');
      }

      return { url: finalUrl, type: isVideo ? "video" : "image" };
    });
  }, [post.mediaUrls, post.mediaUrl, post.type]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold: 0.65 }
    );
    if (cardRef.current) observer.observe(cardRef.current);
    return () => { if (cardRef.current) observer.unobserve(cardRef.current); };
  }, []);

  useEffect(() => {
    const activeVideo = videoRefs.current[activeSlide];
    if (!activeVideo) return;

    if (isInView) {
      const playPromise = activeVideo.play();
      if (playPromise !== undefined) {
        playPromise.then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      }
    } else {
      activeVideo.pause();
      activeVideo.currentTime = 0; 
      setIsPlaying(false);
      setIsVideoBuffering(true); 
    }
  }, [isInView, activeSlide]);

  const rivalryData = useMemo(() => {
    if (!leaderboard || leaderboard.length === 0 || !post.artistId?.school || post.category !== "school") return null;
    const schoolName = post.artistId.school;
    const mySchool = leaderboard.find(s => s.school === schoolName);
    const numberOneSchool = leaderboard[0];
    if (mySchool && mySchool.school === numberOneSchool.school) return { status: "dominating", message: "🏆 CURRENTLY #1 SCHOOL" };
    if (mySchool && numberOneSchool) return { status: "chasing", message: `⚔️ ${(numberOneSchool.totalEngagement - mySchool.totalEngagement).toLocaleString()} PTS BEHIND ${numberOneSchool.school.toUpperCase()}` };
    return null;
  }, [leaderboard, post.artistId?.school, post.category]);

  const handlePaystack = (e) => {
    e?.preventDefault(); 
    e?.stopPropagation(); 
    if (!donationAmount || donationAmount <= 0) return dispatch(SET_LIVE_ALERT({ type: "error", title: "Amount Missing", message: "Please enter GHS amount." }));
    
    const subaccountCode = post.artistId?.paystackSubaccountCode;
    if (!subaccountCode) return dispatch(SET_LIVE_ALERT({ type: "error", title: "Unavailable", message: "This artist hasn't set up their MoMo payout account yet." }));

    const paystackKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
    const handler = window.PaystackPop.setup({
      key: paystackKey, 
      email: activeUser?.email || "arena-guest@nkonkonsa.com", 
      amount: Math.round(parseFloat(donationAmount) * 100), 
      currency: 'GHS',
      subaccount: subaccountCode, 
      transaction_charge: 0,      
      callback: (response) => {
        dispatch(SET_LIVE_ALERT({ type: "success", title: "Gift Transmitted!", message: `Reference: ${response.reference}` }));
        setDonationAmount("");
      },
    });
    handler.openIframe();
  };

  const handleDownload = async (e) => {
    e?.preventDefault(); 
    e?.stopPropagation(); 
    const currentMedia = slides[activeSlide];
    if (isDownloading || !currentMedia?.url) return;
    
    setIsDownloading(true);
    dispatch(SET_LIVE_ALERT({ type: "success", title: "Downloading...", message: "Fetching media..." }));

    try {
      const response = await fetch(currentMedia.url);
      if (!response.ok) throw new Error("Failed to fetch file");
      
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      
      const extension = currentMedia.type === 'video' ? 'mp4' : 'jpg';
      const cleanName = (post.artistName || post.artistId?.username || 'Artwork').replace(/\s+/g, '-');
      link.download = `Arena-${cleanName}.${extension}`; 
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      dispatch(SET_LIVE_ALERT({ type: "success", title: "Saved!", message: "Artwork downloaded." }));
    } catch (error) {
      dispatch(SET_LIVE_ALERT({ type: "error", title: "Download Failed", message: "Check connection." }));
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSecureBuy = (e) => {
    e?.preventDefault(); 
    e?.stopPropagation();
    if (!activeUser) return navigate("/signin");
    if (!activeUser.ghanaCardVerified) setShowIdModal(true);
    else navigate(`/work/${post._id}`);
  };

  const togglePlay = (e) => {
    if (e.target.closest("button") || e.target.closest("input") || e.target.closest("a")) return;
    const activeVideo = videoRefs.current[activeSlide];
    if (!activeVideo) return;
    
    if (isPlaying) {
      activeVideo.pause();
      setIsPlaying(false);
    } else {
      activeVideo.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  useEffect(() => {
    videoRefs.current.forEach((video) => { if (video) video.muted = isGlobalMuted; });
  }, [isGlobalMuted]);

  const handleScroll = (e) => {
    const width = e.target.offsetWidth;
    const index = Math.round(e.target.scrollLeft / width);
    if (index !== activeSlide) setActiveSlide(index);
  };

  const handleLikeClick = (e) => {
    e?.preventDefault(); 
    e?.stopPropagation();
    if (!activeUser) return;

    // 🔥 FIX: Instant visual update (Optimistic UI)
    setLocalIsLiked(!localIsLiked);
    setLocalLikeCount((prev) => (localIsLiked ? prev - 1 : prev + 1));

    handleLike(post._id);
  };
  
  const handleShareClick = (e) => {
    e?.preventDefault(); 
    e?.stopPropagation();

    // 🔥 FIX: Instant visual update
    setLocalShareCount((prev) => prev + 1);

    if (handleShare) handleShare(post); 
    fetch(`/api/work/${post._id}/share`, { method: "PUT" }).catch(() => {}); 
  };

  // 🔥 NEW: Profile click handler protecting guests from visiting profile pages
  const handleProfileClick = (e) => {
    e?.preventDefault(); 
    e?.stopPropagation(); // Stops the video from pausing
    if (!activeUser) return navigate("/signin");
    navigate(`/artist/${post.artistId?._id || post.artistId}`);
  };

  const onDoubleTap = useCallback((e) => {
    if (e.target.closest("button") || e.target.closest("input") || e.target.closest("a") || e.target.closest(".profile-trigger")) return;
    
    e.stopPropagation(); 
    const now = Date.now();
    
    if (now - lastTap.current < 400) { 
      if (!localIsLiked) handleLikeClick(e); 
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 800);
      if (window.navigator.vibrate) window.navigator.vibrate(50);
      
      const activeVideo = videoRefs.current[activeSlide];
      if (activeVideo) activeVideo.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      togglePlay(e);
    }
    lastTap.current = now;
  }, [localIsLiked, isPlaying, activeSlide]); 

  return (
    <li ref={cardRef} className="relative bg-black h-[100dvh] w-full snap-start shrink-0 overflow-hidden flex flex-col justify-between pb-[env(safe-area-inset-bottom)]">
      
      <div className="absolute inset-0 z-0 bg-black cursor-pointer" onClick={onDoubleTap}>
        <div onScroll={handleScroll} className="flex h-full w-full overflow-x-auto snap-x snap-mandatory scrollbar-hide pointer-events-auto">
          {slides.map((file, index) => (
            <div key={index} className="w-full flex-shrink-0 h-full snap-center snap-always relative">
              {file.type === "video" ? (
                <div className="relative w-full h-full">
                  {isVideoBuffering && index === activeSlide && isInView && (
                    <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                      <Loader2 className="text-white/50 animate-spin" size={28} />
                    </div>
                  )}
                  
                  <video 
                    ref={el => videoRefs.current[index] = el} 
                    src={`${file.url}?bypass=${post._id}`} 
                    crossOrigin="anonymous"
                    disableRemotePlayback 
                    preload={isInView ? "auto" : "none"} 
                    loop 
                    playsInline 
                    webkit-playsinline="true" 
                    muted={isGlobalMuted}
                    onLoadedData={() => setIsVideoBuffering(false)}
                    onCanPlay={() => setIsVideoBuffering(false)}
                    onWaiting={() => setIsVideoBuffering(true)}
                    onPlaying={() => setIsVideoBuffering(false)}
                    className="w-full h-full object-contain object-top bg-black pointer-events-none " 
                    style={{ transform: "translateZ(0)", willChange: "transform" }}
                  />
                </div>
              ) : (
                <img 
                  src={file.url} 
                  loading="lazy" 
                  draggable="false" 
                  className="w-full h-full object-contain object-top bg-black pointer-events-auto" 
                  alt="Art" 
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {!isPlaying && slides[activeSlide]?.type === "video" && isInView && (
          <motion.div
            initial={{ opacity: 0, scale: 1.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
          >
            <div className="bg-zinc-900/40 p-4 rounded-full backdrop-blur-md border border-white/10 shadow-2xl">
              <Play size={20} className="text-white translate-x-0.5" fill="currentColor" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showHeart && (
          <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1.2, opacity: 1 }} exit={{ scale: 1.5, opacity: 0 }} className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
            <Heart size={100} fill="white" className="text-white drop-shadow-2xl" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute inset-x-0 bottom-0 h-[40vh] bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none z-10" />
      <div className="absolute inset-x-0 top-0 h-[15vh] bg-gradient-to-b from-black/50 to-transparent pointer-events-none z-10" />

      {!post.isForSale && (
        <div className="absolute top-[env(safe-area-inset-top,20px)] right-4 z-40 mt-20 pointer-events-auto">
          <button type="button" onClick={handleDownload} disabled={isDownloading} className="p-2 rounded-full bg-black/20 backdrop-blur-sm text-white active:scale-95 transition-all border border-white/10">
            {isDownloading ? <Loader2 size={18} className="animate-spin text-yellow-500" /> : <Download size={18} className="drop-shadow-md" />}
          </button>
        </div>
      )}

      {slides.length > 1 && (
        <div className="absolute top-[env(safe-area-inset-top,20px)] left-1/2 -translate-x-1/2 flex items-center gap-1 z-40 mt-5 pointer-events-none">
          {slides.map((_, idx) => (
            <div key={idx} className={`h-1 rounded-full transition-all duration-300 shadow-md ${idx === activeSlide ? "w-4 bg-white" : "w-1.5 bg-white/40"}`} />
          ))}
        </div>
      )}

      <div className="absolute top-[env(safe-area-inset-top,20px)] left-4 z-40 mt-5 pointer-events-auto profile-trigger">
        {/* 🔥 FIX: Replaced Link with protected div */}
        <div onClick={handleProfileClick} className="block active:scale-90 transition-transform relative cursor-pointer">
          <div className="w-11 h-11 rounded-full border border-white/40 p-[2px] bg-black/40 backdrop-blur-sm shadow-xl overflow-hidden">
            {post.artistId?.avatar ? (
              <img src={post.artistId.avatar} className="w-full h-full object-cover rounded-full" alt="avatar" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-400"><User size={20}/></div>
            )}
          </div>
          {post.artistId?.verified && (
            <div className="absolute -bottom-1 -right-1 z-50 bg-black rounded-full p-[2px] shadow-lg">
              <VerifiedBadge size={14} color="gold" />
            </div>
          )}
        </div>
      </div>

      <div className="absolute right-3 bottom-[110px] z-40 flex flex-col gap-5 items-center pointer-events-auto pb-4">
        <div className="flex flex-col items-center gap-1">
          <button type="button" onClick={handleLikeClick} className="p-1 active:scale-90 transition-transform drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
            <Heart size={30} fill={localIsLiked ? "#ef4444" : "white"} strokeWidth={localIsLiked ? 0 : 2} className={localIsLiked ? "text-red-500" : "text-white"} />
          </button>
          <span className="text-white text-[11px] font-bold drop-shadow-md">{localLikeCount || "0"}</span>
        </div>
        
        <div className="flex flex-col items-center gap-1">
          <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowComments(true); }} className="p-1 active:scale-90 transition-transform drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
            <MessageCircle size={30} fill="white" className="text-white" />
          </button>
          <span className="text-white text-[11px] font-bold drop-shadow-md">{commentCount || "0"}</span>
        </div>
        
        <div className="flex flex-col items-center gap-1">
          <button type="button" onClick={handleShareClick} className="p-1 active:scale-90 transition-transform drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
            <Share2 size={28} className="text-white" />
          </button>
          <span className="text-white text-[11px] font-bold drop-shadow-md">{localShareCount || "Share"}</span>
        </div>

        {post.isForSale && (
          <div className="flex flex-col items-center gap-1 mt-2">
            <button type="button" onClick={handleSecureBuy} className={`p-2 rounded-full backdrop-blur-md active:scale-90 transition-transform drop-shadow-lg ${post.isSold ? "bg-black/40 text-white/50" : "bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.3)]"}`}>
              <ShoppingBag size={22} />
            </button>
          </div>
        )}

        {slides[activeSlide]?.type === "video" && (
          <div className="flex flex-col items-center gap-1 mt-2">
            <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); dispatch(toggleGlobalMute()); }} className="p-2 bg-black/20 backdrop-blur-md rounded-full active:scale-90 transition-transform border border-white/10 shadow-lg">
              {isGlobalMuted ? <VolumeX size={18} className="text-white/60" /> : <Volume2 size={18} className="text-white" />}
            </button>
          </div>
        )}
      </div>

      <div className="absolute bottom-[110px] left-4 right-16 z-40 pointer-events-auto pb-4 profile-trigger">
        {rivalryData && (
          <div className={`mb-2 inline-block px-2.5 py-1 rounded-sm backdrop-blur-md text-[9px] font-black uppercase tracking-widest drop-shadow-md ${rivalryData.status === "dominating" ? "bg-yellow-500/90 text-black" : "bg-black/60 text-yellow-500"}`}>
            {rivalryData.message}
          </div>
        )}
        
        {/* 🔥 FIX: Replaced Link with protected div */}
        <div onClick={handleProfileClick} className="block mb-1 cursor-pointer">
          <h3 className="text-white font-bold text-[15px] drop-shadow-md flex items-center gap-1 flex-nowrap">
            {post.artistName || post.artistId?.username}
            
            {post.artistId?.verified && (
              <VerifiedBadge size={14} color="#3b82f6" verified={true} />
            )}
          </h3>
        </div>

        <div className="mb-3 bg-black/40 backdrop-blur-sm p-2.5 rounded-xl border border-white/10 shadow-lg inline-block w-full">
          <p 
            onClick={() => setIsDescExpanded(!isDescExpanded)} 
            className={`text-white font-medium text-[13px] leading-snug drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] cursor-pointer ${isDescExpanded ? "" : "line-clamp-2"}`}
          >
            {post.description}
          </p>
          
          {post.description?.length > 80 && !isDescExpanded && (
            <button 
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsDescExpanded(true); }} 
              className="text-white font-black text-[12px] drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] mt-1.5"
            >
              See more
            </button>
          )}
        </div>

        <div className="flex items-center  bg-black/30 backdrop-blur-md border border-white/10 rounded-lg p-1 w-[200px] shadow-lg focus-within:border-white/30 transition-colors">
          <Gift size={14} className="text-yellow-500 ml-2 shrink-0" />
          <input 
            type="number" 
            placeholder="Send Gift (GHS)" 
            value={donationAmount} 
            onChange={(e) => setDonationAmount(e.target.value)}
            className="bg-transparent flex-1 text-white text-[12px] font-medium outline-none px-2 placeholder:text-white/50 w-full" 
          />
          <button 
            type="button"
            onClick={handlePaystack} 
            className="bg-yellow-500 text-black font-bold text-[11px] px-3 py-1.5 rounded-md active:scale-95 transition-transform shrink-0"
          >
            Send
          </button>
        </div>
      </div>

      {showComments && <CommentPanel post={post} onClose={() => setShowComments(false)} onCommentUpdate={(newCount) => setCommentCount(newCount)} />}
      {showIdModal && <GhanaCardModal onClose={() => setShowIdModal(false)} onSuccess={() => navigate(`/work/${post._id}`)} />}
    </li>
  );
};

export default React.memo(FeedCard, (prevProps, nextProps) => {
  return (
    prevProps.post._id === nextProps.post._id &&
    prevProps.post.likes === nextProps.post.likes &&
    prevProps.post.commentsList?.length === nextProps.post.commentsList?.length &&
    prevProps.post.shares === nextProps.post.shares
  );
});