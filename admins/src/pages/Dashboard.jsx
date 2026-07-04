import React, { useEffect, useState, useCallback, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
// ✅ GLOBAL SOCKET
import { useSocket } from "../context/SocketContext";
import { motion, AnimatePresence } from "framer-motion";
import { INCREMENT_UNREAD_ADMIN } from "../redux/user/adminNotificationsSlice";
import { 
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, 
  Title, Tooltip, Legend 
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { Bell, Zap, CheckCircle, XCircle, Trash2, Search, RefreshCw, Loader2, Tag, ShoppingBag } from "lucide-react";
import customFetch from "../utility/customFetch";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Dashboard = () => {
  const dispatch = useDispatch();
  
  const adminState = useSelector((state) => state.admin);
  const userState = useSelector((state) => state.user);
  const currentUser = adminState?.currentUser || userState?.currentUser || null;

  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [error, setError] = useState("");
  const [selectedWorks, setSelectedWorks] = useState([]);
  const [filters, setFilters] = useState({ title: "", category: "", school: "", status: "pending" });
  
  const [liveUpdateTrigger, setLiveUpdateTrigger] = useState(0);
  const lastTrigger = useRef(0); // 🛡️ Used to determine if the refresh should be silent

  // ✅ USE THE GLOBAL SOCKET
  const socket = useSocket();

  // 📥 THE FETCH ENGINE (Now supports Silent Background Refreshes)
  const fetchWorks = useCallback(async (isSilent = false) => {
    if (!currentUser?.token) {
      setLoading(false);
      return;
    }

    try {
      // Only show the big loading spinner if it's NOT a background socket refresh
      if (!isSilent) setLoading(true);
      
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const res = await customFetch(`/api/work/search?${queryParams.toString()}`, {
        headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${currentUser.token}` 
        },
      });

      const data = await res.json();
      if (data.success) {
        setWorks(data.works || []);
        setError("");
      } else {
        setError(data.message);
      }
    } catch (err) {
      console.error("💥 Yenuvia CRASH:", err);
      setError("Connection to Arena failed.");
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [filters, currentUser?.token]);

  // 🔄 THE SMART REFRESH TRIGGER
  useEffect(() => {
    // If the trigger number went up, it's a silent socket update. Otherwise, it's a manual filter change.
    const isSilentRefresh = liveUpdateTrigger > lastTrigger.current;
    lastTrigger.current = liveUpdateTrigger;
    
    fetchWorks(isSilentRefresh);
  }, [fetchWorks, liveUpdateTrigger]);

  // ⚡ THE REAL-TIME OBSERVER ROOM
  useEffect(() => {
    if (!currentUser?._id || !socket) return;

    setIsLive(socket.connected);
    const onConnect = () => setIsLive(true);
    const onDisconnect = () => setIsLive(false);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    // 🔊 Helper for Audio to prevent browser "Autoplay Blocked" errors
    const playNotification = () => {
      const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3");
      audio.play().catch(err => console.warn("🔇 Audio blocked until Admin clicks the screen."));
    };

    const handleNewPending = (data) => {
      console.log("📥 New Masterpiece in Queue!");
      setLiveUpdateTrigger(prev => prev + 1); 
      dispatch(INCREMENT_UNREAD_ADMIN());
      playNotification();
    };

    const handleSaleSuccess = (data) => {
      setLiveUpdateTrigger(prev => prev + 1); 
      dispatch(INCREMENT_UNREAD_ADMIN());
      playNotification();
    };

    const handleFundsReleased = (data) => {
       setLiveUpdateTrigger(prev => prev + 1);
       dispatch(INCREMENT_UNREAD_ADMIN());
    };

    // 🚨 THE FIX: Listen to the EXACT event name your backend emits
    socket.on("newWorkSubmitted", handleNewPending); 
    socket.on("sale_success", handleSaleSuccess);
    socket.on("funds_released", handleFundsReleased);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("newWorkSubmitted", handleNewPending);
      socket.off("sale_success", handleSaleSuccess);
      socket.off("funds_released", handleFundsReleased);
    }
  }, [currentUser, dispatch, socket]); 

  const handleAction = async (ids, action, destination = "feed") => {
    try {
      const promises = ids.map(id => 
        customFetch(`/api/work/${id}/${action}`, {
          method: "PATCH", 
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${currentUser.token}`,
          },
          body: action === "approve" 
            ? JSON.stringify({ destination }) 
            : JSON.stringify({ reason: "Batch Moderation" }),
        })
      );

      await Promise.all(promises);
      setSelectedWorks([]);
      fetchWorks(false); // Hard refresh after taking an action
    } catch (err) {
      console.error("❌ BATCH FAILED:", err);
      setError("Batch action failed.");
    }
  };

  const toggleSelect = (id) => setSelectedWorks(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  
  const categoryChartData = {
    labels: ["School", "Professional"],
    datasets: [{
      label: "Uploads",
      data: [works.filter(w => w.category === "school").length, works.filter(w => w.category === "professional").length],
      backgroundColor: ["#EAB308", "#3B82F6"],
      borderRadius: 8,
    }],
  };

  return (
    <div className="bg-slate-50 rounded-[3rem] p-4 md:p-8 mt-10 border border-slate-200 shadow-inner">
      
      {/* HEADER CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-200/60">
          <div className="flex justify-between items-center mb-6">
             <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Stream Analytics</h3>
             {/* 🟢 Live Indicator */}
             <div className="flex items-center gap-2">
               <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]' : 'bg-red-500'}`} />
               <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{isLive ? 'Socket Connected' : 'Offline'}</span>
             </div>
          </div>
          <div className="h-[250px]"><Bar data={categoryChartData} options={{ maintainAspectRatio: false }} /></div>
        </div>
        <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl text-white flex flex-col justify-center relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-6xl font-black italic tracking-tighter leading-none">{works.filter(w => w.status === 'pending').length}</h2>
            <p className="text-slate-400 font-bold text-xs mt-2 uppercase tracking-widest">In Queue</p>
          </div>
          <Bell className="absolute -right-4 -bottom-4 text-white/5" size={160} />
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-200/60 mb-6 flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input type="text" placeholder="Search Masterpieces..." className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-50 outline-none font-bold" value={filters.title} onChange={(e) => setFilters(p => ({...p, title: e.target.value}))} />
        </div>
        <select className="bg-slate-50 border-none rounded-2xl py-3 px-6 text-sm font-bold outline-none cursor-pointer" value={filters.status} onChange={(e) => setFilters(p => ({...p, status: e.target.value}))}>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="billboard">Billboard</option>
          <option value="rejected">Rejected</option>
        </select>
        <button onClick={() => fetchWorks(false)} className="p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"><RefreshCw size={18} className={loading ? "animate-spin" : ""} /></button>
      </div>

      {/* DATA TABLE */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200/60 overflow-x-auto mb-12">
        <table className="w-full text-left min-w-[900px]">
          <thead>
            <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
              <th className="p-6 w-16 text-center">Select</th>
              <th className="p-6">Masterpiece</th>
              <th className="p-6">Artist Info</th>
              <th className="p-6">Market</th>
              <th className="p-6">Category</th>
              <th className="p-6">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr>
                <td colSpan="6" className="p-20 text-center">
                  <Loader2 className="animate-spin inline text-yellow-500" size={40}/>
                </td>
              </tr>
            ) : works.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-20 text-center font-bold text-slate-300 uppercase italic">
                  No items found
                </td>
              </tr>
            ) : (
              works.map((work) => (
                <tr key={work._id} className={`hover:bg-slate-50/80 transition-colors ${selectedWorks.includes(work._id) ? 'bg-yellow-50/50' : ''}`}>
                  <td className="p-6 text-center">
                    <input type="checkbox" checked={selectedWorks.includes(work._id)} onChange={() => toggleSelect(work._id)} className="w-5 h-5 rounded-lg border-slate-300 text-yellow-500" />
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-4">
                      
                      {/* 🖼️ MEDIA PREVIEW THUMBNAIL (Hover to play video) */}
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-900 relative flex-shrink-0 border border-slate-200 group cursor-pointer shadow-sm">
                        {(() => {
                          // Check if there's an array of slides, or just a single mediaUrl
                          const slides = work.mediaUrls?.length > 0 ? work.mediaUrls : [work.mediaUrl];
                          const firstMedia = slides[0]?.url || slides[0] || ""; 
                          const isVideo = typeof firstMedia === 'string' && firstMedia.match(/\.(mp4|webm|ogg|mov)/i);

                          if (isVideo) {
                            return (
                              <video 
                                src={firstMedia} 
                                className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" 
                                muted 
                                loop 
                                onMouseEnter={(e) => e.target.play()} 
                                onMouseLeave={(e) => e.target.pause()} 
                              />
                            );
                          } else if (firstMedia) {
                            return <img src={firstMedia} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" alt="preview" />;
                          }
                          return <div className="w-full h-full flex items-center justify-center text-slate-500 text-[8px]">NO MEDIA</div>;
                        })()}

                        {/* 🔢 SLIDE COUNT BADGE (Shows if they uploaded 2+ videos/images) */}
                        {work.mediaUrls?.length > 1 && (
                          <div className="absolute top-1 right-1 bg-blue-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md shadow-md z-10">
                            {work.mediaUrls.length} SLIDES
                          </div>
                        )}
                      </div>

                      {/* 📝 TITLE & DESCRIPTION */}
                      <div className="overflow-hidden">
                        <p className="font-black text-slate-800 text-sm uppercase italic tracking-tighter leading-none flex items-center gap-2 truncate">
                          {work.title}
                          {work.isForSale && <Tag size={12} className="text-yellow-600 flex-shrink-0" />}
                        </p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 truncate max-w-[160px]">
                          {work.description || "No description provided"}
                        </p>
                      </div>

                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-3">
                      <img src={work.artistId?.avatar || "/default-avatar.png"} className="w-8 h-8 rounded-full object-cover" alt="avatar" />
                      <div>
                        <p className="text-[11px] font-black text-slate-700 uppercase leading-none">@{work.artistId?.username || "Creator"}</p>
                        <p className="text-[9px] font-bold text-blue-500 uppercase mt-1">{work.school || "Professional"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    {work.isForSale ? (
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-900 leading-none italic">GHS {work.price}</span>
                        <span className="text-[8px] font-black text-yellow-600 uppercase tracking-widest mt-1">{work.condition}</span>
                      </div>
                    ) : (
                      <span className="text-[9px] font-bold text-slate-300 uppercase italic">Social Only</span>
                    )}
                  </td>
                  <td className="p-6">
                    <span className="text-[10px] font-black uppercase px-3 py-1 bg-slate-100 rounded-full">{work.category}</span>
                  </td>
                  <td className="p-6">
                    <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full ${work.status === 'pending' ? 'bg-yellow-100 text-yellow-600' : 'bg-emerald-100 text-emerald-600'}`}>{work.status}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    <AnimatePresence>
      {selectedWorks.length > 0 && (
        <motion.div 
          initial={{ y: -100, x: '-50%' }} 
          animate={{ y: 0, x: '-50%' }} 
          exit={{ y: -100, x: '-50%' }} 
          className="fixed top-10 left-1/2 bg-slate-900 text-white px-8 py-5 rounded-[2.5rem] shadow-2xl flex items-center gap-8 z-[200] border border-white/10"
        >
          <div className="flex flex-col">
            <span className="text-yellow-500 font-black text-xl italic">{selectedWorks.length} Items</span>
          </div>
          <div className="flex gap-4">
            <button onClick={() => handleAction(selectedWorks, 'approve', 'feed')} className="bg-emerald-500 text-black px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
              <CheckCircle size={14}/> Feed
            </button>
            <button onClick={() => handleAction(selectedWorks, 'approve', 'billboard')} className="bg-indigo-500 text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
              <Zap size={14}/> Billboard
            </button>
            <button onClick={() => handleAction(selectedWorks, 'reject')} className="bg-rose-500 text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
              <XCircle size={14}/> Reject
            </button>
          </div>
          <button onClick={() => setSelectedWorks([])} className="p-3">
            <Trash2 size={18} className="text-slate-500 hover:text-white"/>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
    </div>
  );
};

export default Dashboard;