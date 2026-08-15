import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Virtuoso } from "react-virtuoso";
import { Loader2, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion"; // 🔥 ADDED

import Billboard from "../components/Billboard";
import FeedCard from "../components/FeedCard";
import DerbySnapshotCard from "../components/DerbySnapshotCard";
import SharePopup from "../components/SharePopup";
import Schools from "./Schools";
import Professional from "./Professional";

import { 
  SET_FEED_POSTS, 
  APPEND_FEED_POSTS, 
  UPDATE_SINGLE_POST, 
  SET_FEED_LOADING 
} from "../redux/users/artistworkSlice"; 
import { useSocket } from "../context/SocketContext";
import customFetch from "../util/customFetch";
import { updateVerificationStatus } from "../redux/users/artistSlice";

const EMPTY_LEADERBOARD = [];

// 🔥 PULL-TO-REFRESH CONSTANTS
const PULL_THRESHOLD = 80;
const DAMPING = 0.4;

// 🏢 STATIC COMPONENTS
const CustomScroller = React.forwardRef((props, ref) => (
  <div
    {...props}
    ref={ref}
    className="h-full w-full overflow-y-auto scrollbar-hide snap-y snap-mandatory touch-pan-y"
    style={{ 
      ...props.style, 
      overflowX: "hidden", 
      height: "100dvh", 
    }}
  />
));

const CustomFooter = ({ context }) => {
  if (context?.loading && context?.feedPostsLength === 0) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-black">
        <Loader2 className="text-yellow-500 animate-spin" size={32} />
      </div>
    );
  }
  return null;
};

const VIRTUOSO_COMPONENTS = {
  Scroller: CustomScroller,
  Footer: CustomFooter
};

const ForYou = ({ activeTab }) => {
  const dispatch = useDispatch();
  const socket = useSocket();

  // Global App State
  const { feedPosts, loading } = useSelector((state) => state.artistwork);
  const regularUser = useSelector((state) => state.user?.currentUser);
  const artistUser = useSelector((state) => state.artist?.currentUserArtist);
  const activeUser = regularUser || artistUser;

  const leaderboard = useSelector((state) => state.ghanaSchools?.schools || state.ghanaSchools?.leaderboard || EMPTY_LEADERBOARD);
  
  // Pagination & Display Controls
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [sharingPost, setSharingPost] = useState(null);
  const [liveUpdateTrigger, setLiveUpdateTrigger] = useState(0);
  
  // 🔥 PULL-TO-REFRESH STATE
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const scrollContainerRef = useRef(null);
  const isFetchingRef = useRef(false);
  const feedPostsRef = useRef(feedPosts);
  const touchStartRef = useRef(0);

  useEffect(() => {
    feedPostsRef.current = feedPosts;
  }, [feedPosts]);

  // Cloudinary Optimization Engine
  const optimizeCloudinaryUrl = useCallback((url) => {
    if (!url) return url;
    if (url.includes("res.cloudinary.com") && !url.includes("q_auto")) {
      return url.replace("/upload/", "/upload/f_mp4,q_auto:eco,w_720,vc_h264/");
    }
    return url;
  }, []);

  // Centralized Feed API Fetcher
  const fetchPosts = useCallback(async (pageNum = 1, isRefresh = false) => {
    if (isFetchingRef.current && !isRefresh) return;
    isFetchingRef.current = true;
    dispatch(SET_FEED_LOADING(true));

    try {
      const cacheBuster = Date.now();
      const res = await customFetch(
        `/api/work/feed?status=approved&page=${pageNum}&limit=10&sort=trending&_t=${cacheBuster}`,
        { headers: activeUser?.token ? { Authorization: `Bearer ${activeUser.token}` } : {} }
      );
      if (!res.ok) throw new Error(`Server Error: ${res.status}`);
      const data = await res.json();

      if (data.success) {
        const fetchedWorks = (data.works || data.posts || [])
          .filter((post) => post && post._id)
          .map((post) => ({
            ...post,
            mediaUrls: post.mediaUrls ? post.mediaUrls.map((url) => optimizeCloudinaryUrl(url)) : [],
          }));

        setHasMore(fetchedWorks.length === 10);

        if (isRefresh || pageNum === 1) {
          dispatch(SET_FEED_POSTS(fetchedWorks));
          setPage(1);
        } else {
          const currentPosts = feedPostsRef.current;
          const uniqueNewWorks = fetchedWorks.filter(
            (newPost) => !currentPosts.some((existing) => existing._id === newPost._id)
          );
          dispatch(APPEND_FEED_POSTS(uniqueNewWorks));
        }
      }
    } catch (err) {
      console.error("Feed Sync Interrupted:", err.message);
    } finally {
      dispatch(SET_FEED_LOADING(false));
      isFetchingRef.current = false;
    }
  }, [dispatch, activeUser?.token, optimizeCloudinaryUrl]);

  // Real-time Background Content Refresh
  useEffect(() => {
    if (liveUpdateTrigger > 0 && activeTab === "forYou") {
      fetchPosts(1, true);
    }
  }, [liveUpdateTrigger, fetchPosts, activeTab]);

  useEffect(() => {
    if (activeTab === "forYou" && feedPosts.length === 0) {
      fetchPosts(1, true);
    }
  }, [activeTab, fetchPosts, feedPosts.length]);

  // WebSocket Event Listeners
  useEffect(() => {
    if (!socket) return;

    const handleItemRemoved = (data) => {
      const idToRemove = String(data?.workId || data?._id || data?.id || data);
      const currentPosts = feedPostsRef.current;
      dispatch(SET_FEED_POSTS(currentPosts.filter((p) => String(p._id) !== idToRemove)));
    };

    const handleItemUpdated = (data) => {
      const updatedPost = data?.work || data?.post || data;
      if (!updatedPost || !updatedPost._id) return;
      
      const processedPost = {
        ...updatedPost,
        mediaUrls: updatedPost.mediaUrls ? updatedPost.mediaUrls.map((url) => optimizeCloudinaryUrl(url)) : [],
      };

      const currentPosts = feedPostsRef.current;
      const exists = currentPosts.some((p) => String(p._id) === String(processedPost._id));

      if (exists) {
        dispatch(UPDATE_SINGLE_POST(processedPost));
      } else if (processedPost.status === "approved") {
        dispatch(SET_FEED_POSTS([processedPost, ...currentPosts]));
      }
    };

    const handleArtistVerificationUpdated = ({ artistId, verified }) => {
      const targetId = String(artistId);

      if (activeUser && String(activeUser._id) === targetId) {
        dispatch(updateVerificationStatus(verified));
      }

      const currentPosts = feedPostsRef.current;
      const updatedPosts = currentPosts.map((post) => {
        const postArtistId = String(
          post.artistId?._id || post.artistId || post.user?._id || post.user || ""
        );

        if (postArtistId === targetId) {
          return {
            ...post,
            artistId: typeof post.artistId === "object" && post.artistId !== null
              ? { ...post.artistId, verified }
              : { _id: post.artistId, verified },
          };
        }
        return post;
      });

      dispatch(SET_FEED_POSTS(updatedPosts));
    };

    socket.on("work_removed_from_feed", handleItemRemoved);
    socket.on("work_deleted", handleItemRemoved);
    socket.on("work_verified", handleItemUpdated);
    socket.on("work_updated", handleItemUpdated);
    socket.on("artist_verification_updated", handleArtistVerificationUpdated);

    return () => {
      socket.off("work_removed_from_feed", handleItemRemoved);
      socket.off("work_deleted", handleItemRemoved);
      socket.off("work_verified", handleItemUpdated);
      socket.off("work_updated", handleItemUpdated);
      socket.off("artist_verification_updated", handleArtistVerificationUpdated);
    };
  }, [socket, dispatch, optimizeCloudinaryUrl, activeUser]);

  const handleLike = useCallback(async (postId) => {
    if (!activeUser) return;
    const targetPost = feedPostsRef.current.find((p) => p._id === postId);
    if (!targetPost) return;

    const isLiked = targetPost.likedBy?.includes(activeUser._id);
    const optimisticData = {
      ...targetPost,
      likedBy: isLiked
        ? targetPost.likedBy.filter((id) => id !== activeUser._id)
        : [...(targetPost.likedBy || []), activeUser._id],
      likes: isLiked ? Math.max(0, (targetPost.likes || 1) - 1) : (targetPost.likes || 0) + 1,
    };

    dispatch(UPDATE_SINGLE_POST(optimisticData));

    try {
      await customFetch(`/api/work/${postId}/like`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json", 
          Authorization: `Bearer ${activeUser.token}` 
        },
      });
    } catch (err) {
      console.error("Like sync failed", err);
      fetchPosts(1, true);
    }
  }, [activeUser, dispatch, fetchPosts]);

  const handleCommentGlobalUpdate = useCallback((postId, updatedCommentsArray) => {
    const targetPost = feedPostsRef.current.find((p) => p._id === postId);
    if (!targetPost) return;

    dispatch(UPDATE_SINGLE_POST({
      ...targetPost,
      commentsList: updatedCommentsArray
    }));
  }, [dispatch]);

  // 🔥 ADVANCED PULL-TO-REFRESH PHYSICS
  const handleTouchStart = (e) => {
    const container = scrollContainerRef.current;
    const isAtTop = container ? container.scrollTop <= 0 : true;
    
    if (isAtTop && !isRefreshing) {
      touchStartRef.current = e.touches[0].clientY;
    } else {
      touchStartRef.current = 0;
    }
  };

  const handleTouchMove = (e) => {
    if (touchStartRef.current === 0 || isRefreshing) return;
    
    const container = scrollContainerRef.current;
    const isAtTop = container ? container.scrollTop <= 0 : true;
    if (!isAtTop) return;

    const currentY = e.touches[0].clientY;
    const deltaY = currentY - touchStartRef.current;

    if (deltaY > 0) {
      // Apply physical friction to the drag distance
      const damped = Math.min(deltaY * DAMPING, 120);
      setPullDistance(damped);
    }
  };

  const handleTouchEnd = async () => {
    if (touchStartRef.current === 0 || isRefreshing) return;

    if (pullDistance >= PULL_THRESHOLD) {
      setIsRefreshing(true);
      setPullDistance(65); // Snap loader in place

      try {
        await fetchPosts(1, true);
      } catch (error) {
        console.error("Pull-to-refresh failed:", error);
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0); // Snap back to top if not pulled far enough
    }
    
    touchStartRef.current = 0;
  };

  const virtualItems = useMemo(() => {
    if (activeTab !== "forYou") return [];
    
    const items = [];
    
    if (activeUser) {
      items.push({ _virtualId: "billboard-card", type: "billboard" });
    }

    feedPosts.forEach((post, index) => {
      if (post && post._id) {
        items.push({ ...post, type: "post", _virtualId: post._id });
        
        if (index === 2) {
          items.push({ _virtualId: "derby-card", type: "derby" });
        }
      }
    });
    
    return items;
  }, [feedPosts, activeTab, activeUser]); 

  return (
    <div 
      className="w-full h-[100dvh] bg-black relative select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 🔥 THE TIKTOK PULL INDICATOR */}
      <div 
        className="absolute top-0 inset-x-0 z-50 flex items-center justify-center pointer-events-none"
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: isRefreshing ? "transform 0.2s ease-out" : "none"
        }}
      >
        <AnimatePresence>
          {(pullDistance > 10 || isRefreshing) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="mt-4 bg-zinc-900/90 border border-white/20 text-yellow-500 p-3 rounded-full shadow-2xl backdrop-blur-md flex items-center justify-center"
            >
              {isRefreshing ? (
                <Loader2 size={22} className="animate-spin text-yellow-500" />
              ) : (
                <RefreshCw 
                  size={20} 
                  style={{
                    transform: `rotate(${Math.min(pullDistance * 3, 360)}deg)`,
                    transition: "transform 0.1s linear"
                  }}
                  className={pullDistance >= PULL_THRESHOLD ? "text-yellow-400 scale-110" : "text-white/70"}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {activeTab === "forYou" ? (
        // 🔥 WRAPPED VIRTUOSO IN A DIV THAT PULLS DOWN VISUALLY
        <div 
          className="w-full h-full"
          style={{
            transform: `translateY(${pullDistance * 0.5}px)`, // Parallax pull effect
            transition: isRefreshing ? "transform 0.2s ease-out" : "none"
          }}
        >
          <Virtuoso
            style={{ height: "100%", width: "100%" }} 
            data={virtualItems}
            computeItemKey={(index, item) => item._virtualId}
            scrollerRef={(ref) => { scrollContainerRef.current = ref; }}
            overscan={1000} 
            defaultItemHeight={typeof window !== "undefined" ? window.innerHeight : 800}
            increaseViewportBy={{ 
              top: typeof window !== "undefined" ? window.innerHeight : 800, 
              bottom: typeof window !== "undefined" ? window.innerHeight : 800 
            }}
            endReached={() => {
              if (hasMore && !isFetchingRef.current) {
                const nextPage = page + 1;
                setPage(nextPage);
                fetchPosts(nextPage);
              }
            }}
            components={VIRTUOSO_COMPONENTS}
            context={{ loading, feedPostsLength: feedPosts.length }}
            itemContent={(index, item) => {
              if (item.type === "billboard") {
                return (
                  <div className="snap-start snap-always h-[100dvh] w-full flex-none flex flex-col justify-center bg-black relative overflow-hidden">
                    <Billboard liveUpdateTrigger={liveUpdateTrigger} />
                    <div className="absolute bottom-40 left-1/2 -translate-x-1/2 animate-bounce z-50">
                      <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.3em]">Swipe Up</p>
                    </div>
                  </div>
                );
              }

              if (item.type === "derby") {
                return (
                  <div className="feed-card-wrapper snap-start snap-always h-screen w-full flex-none flex flex-col justify-center items-center bg-black relative overflow-hidden">
                    <DerbySnapshotCard liveUpdateTrigger={liveUpdateTrigger} />
                  </div>
                );
              }

              return (
                <div className="feed-card-wrapper snap-start snap-always h-[100dvh] w-full flex-none flex flex-col justify-center items-center bg-black relative overflow-hidden">
                  <FeedCard
                    post={item}
                    leaderboard={leaderboard} 
                    handleLike={handleLike}
                    handleShare={(postToShare) => setSharingPost(postToShare)} 
                    onCommentGlobalUpdate={handleCommentGlobalUpdate}
                  />
                </div>
              );
            }}
          />
        </div>
      ) : activeTab === "schools" ? (
        <div className="h-full w-full overflow-y-auto scrollbar-hide bg-black">
          <Schools />
        </div>
      ) : (
        <div className="h-full w-full overflow-y-auto scrollbar-hide bg-black">
          <Professional />
        </div>
      )}
      
      {sharingPost && (
        <SharePopup post={sharingPost} onClose={() => setSharingPost(null)} />
      )}
    </div>
  );
};

export default ForYou;