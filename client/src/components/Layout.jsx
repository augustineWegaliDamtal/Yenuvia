import React, { useEffect, useState, Suspense, lazy, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";

import { useSocket } from "../context/SocketContext";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, Sparkles, X } from "lucide-react";
import { SET_LIVE_ALERT, CLEAR_LATEST_ALERT } from "../redux/users/notificationsSlice";
import { artistUpdateUserSuccess } from "../redux/users/artistSlice";

const TopNav = lazy(() => import("../components/TopNav"));
const BottomNav = lazy(() => import("../components/BottomNav"));
const ForYou = lazy(() => import("../pages/ForYou"));

const ArenaSkeleton = () => (
  <div className="p-6 space-y-6 animate-pulse bg-black h-screen">
    <div className="h-[60vh] w-full bg-zinc-900 rounded-[3rem]" />
    <div className="h-20 w-full bg-zinc-900 rounded-2xl" />
  </div>
);

const Layout = () => {
  const { currentUserArtist } = useSelector((state) => state.artist);
  const { latestAlert } = useSelector((state) => state.notifications);
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState("forYou");
  
  const location = useLocation();
  const navigate = useNavigate();
  const socket = useSocket();
  const memoizedForYou = useMemo(() => <ForYou activeTab={activeTab} />, [activeTab]);
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    
    if (params.get("verified") === "success" && currentUserArtist && !currentUserArtist.verified) {
      dispatch(artistUpdateUserSuccess({ 
        ...currentUserArtist, 
        verified: true 
      }));
      navigate(location.pathname, { replace: true });
      console.log("Arena Pro Synced! Card should now be hidden.");
    }
  }, [location.search, currentUserArtist, dispatch, navigate]);

  useEffect(() => {
    if (!currentUserArtist?._id || !socket) return;

    const handleWorkApproved = (data) => {
      dispatch(SET_LIVE_ALERT({
        type: "success",
        title: "Masterpiece Approved!",
        message: data?.message || "Your work is now live.",
      }));
    };

    const handleWorkRejected = (data) => {
      dispatch(SET_LIVE_ALERT({
        type: "error",
        title: "Arena Feedback",
        message: data?.message || "Check your transmission.",
      }));
    };

    socket.on("work_approved", handleWorkApproved);
    socket.on("work_rejected", handleWorkRejected);

    return () => {
      socket.off("work_approved", handleWorkApproved);
      socket.off("work_rejected", handleWorkRejected);
    };
  }, [currentUserArtist?._id, dispatch, socket]);

  useEffect(() => {
    if (latestAlert) {
      const timer = setTimeout(() => dispatch(CLEAR_LATEST_ALERT()), 5000);
      return () => clearTimeout(timer);
    }
  }, [latestAlert, dispatch]);

  return (
    <div className="fixed inset-0 flex flex-col bg-black overflow-hidden w-full h-[100dvh]">
      
      {/* Realtime Action Notification Banner */}
      <AnimatePresence>
        {latestAlert && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 24, opacity: 1 }}
            exit={{ y: -100, opacity: 0, transition: { duration: 0.2 } }}
            className="absolute top-0 left-4 right-4 z-[9999] p-5 rounded-[2.2rem] bg-zinc-900/95 backdrop-blur-3xl border border-white/10 shadow-2xl flex items-start gap-4"
          >
            <div className={`p-3 rounded-2xl ${latestAlert.type === 'success' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
              {latestAlert.type === "success" ? <CheckCircle className="text-green-500" size={18} /> : <XCircle className="text-red-500" size={18} />}
            </div>
            <div className="flex-1">
              <h4 className="text-white font-black italic uppercase text-[10px] tracking-widest flex items-center gap-2">
                {latestAlert.title} <Sparkles size={10} className="text-yellow-500" />
              </h4>
              <p className="text-gray-400 text-[9px] font-bold mt-1 leading-tight">{latestAlert.message}</p>
            </div>
            <button onClick={() => dispatch(CLEAR_LATEST_ALERT())} className="text-gray-600 hover:text-white p-1">
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <Suspense fallback={<ArenaSkeleton />}>
        
        {/* TOP NAV: Anchored header boundary */}
        <div className="flex-none w-full z-50 bg-black">
          <TopNav activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>
        
        {/* 
          MAIN VIEWPORT: 
          Changed 'overflow-y-auto' to 'overflow-hidden'. This strips layout scroll conflicts 
          so the inner Virtuoso feed locks smoothly onto current entries without popping backward.
        */}
        <main className="flex-1 w-full overflow-hidden relative bg-black">
          {memoizedForYou}
        </main>
        
        {/* BOTTOM NAV: Anchored footer boundary */}
        <div className="flex-none w-full z-50 bg-black">
          <BottomNav />
        </div>

      </Suspense>
    </div>
  );
};

export default Layout;