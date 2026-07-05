import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Search, Trash2, Tag, LayoutDashboard, ChevronLeft, ChevronRight } from "lucide-react";

// 🔌 1. IMPORT THE GLOBAL SOCKET
import { useSocket } from "../context/SocketContext";
import customFetch from "../utility/customFetch";

// 🚀 Lightweight Image Slider Component (Untouched)
const MediaCarousel = ({ urls, type, title }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!urls || urls.length === 0) return <div className="w-full h-full bg-slate-200" />;

  if (type === "video") {
    return (
      <video key={urls[0]} controls preload="metadata" className="w-full h-full object-cover bg-black">
        <source src={urls[0]} />
        Your browser does not support the video tag.
      </video>
    );
  }

  const nextSlide = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % urls.length);
  };

  const prevSlide = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + urls.length) % urls.length);
  };

  return (
    <div className="relative w-full h-full group/carousel">
      <img 
        src={urls[currentIndex]} 
        alt={`${title} - ${currentIndex + 1}`} 
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
      />
      
      {urls.length > 1 && (
        <>
          <button onClick={prevSlide} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/80 text-white p-1.5 rounded-full opacity-0 group-hover/carousel:opacity-100 transition-all backdrop-blur-sm">
            <ChevronLeft size={16} />
          </button>
          <button onClick={nextSlide} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/80 text-white p-1.5 rounded-full opacity-0 group-hover/carousel:opacity-100 transition-all backdrop-blur-sm">
            <ChevronRight size={16} />
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {urls.map((_, idx) => (
              <div key={idx} className={`w-1.5 h-1.5 rounded-full shadow-sm transition-all ${idx === currentIndex ? 'bg-white scale-125' : 'bg-white/50'}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// 👑 MAIN COMPONENT
const SuperAdminContent = () => {
  const { currentUser } = useSelector((state) => state.admin);
  const [billboards, setBillboards] = useState([]);
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // 🔌 2. INITIALIZE SOCKET
  const socket = useSocket();

  const fetchContent = async (query = "") => {
    try {
      const [billboardRes, worksRes] = await Promise.all([
        customFetch(`/api/work/search?status=billboard&title=${query}`),
        customFetch(`/api/work/search?status=approved&title=${query}`)
      ]);
      const billboardData = await billboardRes.json();
      const worksData = await worksRes.json();

      if (billboardData.success) setBillboards(billboardData.works);
      if (worksData.success) setWorks(worksData.works);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching content:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, [currentUser]);

  // =======================================================================
  // 🔌 3. REAL-TIME CONTENT ENGINE (The Socket Magic)
  // =======================================================================
  useEffect(() => {
    if (!socket) return;

    // Triggered when a work is approved, promoted to billboard, or edited
    const handleWorkUpdated = (updatedWork) => {
      console.log("⚡ Real-Time Update Received:", updatedWork.title);

      // 1. Handle Billboard Status
      if (updatedWork.status === "billboard") {
        setBillboards(prev => {
          const exists = prev.find(w => w._id === updatedWork._id);
          return exists ? prev.map(w => w._id === updatedWork._id ? updatedWork : w) : [updatedWork, ...prev];
        });
        setWorks(prev => prev.filter(w => w._id !== updatedWork._id)); // Remove from showroom if it moved up
      } 
      // 2. Handle Approved Status (Showroom)
      else if (updatedWork.status === "approved") {
        setWorks(prev => {
          const exists = prev.find(w => w._id === updatedWork._id);
          return exists ? prev.map(w => w._id === updatedWork._id ? updatedWork : w) : [updatedWork, ...prev];
        });
        setBillboards(prev => prev.filter(w => w._id !== updatedWork._id)); // Remove from billboard if demoted
      } 
      // 3. Handle Demotions (e.g., moved back to pending or rejected)
      else {
        setWorks(prev => prev.filter(w => w._id !== updatedWork._id));
        setBillboards(prev => prev.filter(w => w._id !== updatedWork._id));
      }
    };

    // Triggered when a work is totally deleted
    const handleWorkDeleted = (deletedId) => {
      setWorks(prev => prev.filter(w => w._id !== deletedId));
      setBillboards(prev => prev.filter(b => b._id !== deletedId));
    };

    socket.on("work_updated", handleWorkUpdated);
    socket.on("work_deleted", handleWorkDeleted);

    return () => {
      socket.off("work_updated", handleWorkUpdated);
      socket.off("work_deleted", handleWorkDeleted);
    };
  }, [socket]);
  // =======================================================================

  const handleSearch = (e) => {
    e.preventDefault();
    fetchContent(searchTerm);
  };

  const handleDeleteWork = async (id) => {
    if (!window.confirm("Take down this work? This action cannot be undone.")) return;
    try {
      const res = await customFetch(`/api/work/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${currentUser.token}` }
      });
      const data = await res.json();
      if (data.success) {
        // We still keep local state updates so it feels instant for the person clicking the button
        setWorks(prev => prev.filter(w => w._id !== id));
        setBillboards(prev => prev.filter(b => b._id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return (
    <div className="flex h-[50vh] items-center justify-center">
        <p className="text-slate-400 font-bold uppercase tracking-widest animate-pulse">Loading Yenuvia Content...</p>
    </div>
  );

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto pb-32">
      
      {/* HEADER & SEARCH */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
          <div>
              <h1 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900">
                  Content <span className="text-yellow-500">Engine</span>
              </h1>
              <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">
                  Manage Live Masterpieces & Billboards
              </p>
          </div>
          
          <form onSubmit={handleSearch} className="w-full md:w-96 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search masterpieces..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border-2 border-slate-100 pl-12 pr-4 py-4 rounded-2xl font-bold text-slate-800 outline-none focus:border-yellow-400 transition-colors shadow-sm"
            />
          </form>
      </div>

      {/* BILLBOARDS SECTION */}
      {billboards.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-6">
                <div className="bg-indigo-500 p-2 rounded-xl text-white"><LayoutDashboard size={20} /></div>
                <h2 className="text-2xl font-black uppercase italic tracking-tight text-slate-800">Active Billboards</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {billboards.map(b => (
                <div key={b._id} className="bg-white rounded-[2.5rem] border-2 border-indigo-50 p-3 relative flex flex-col shadow-sm hover:shadow-xl transition-shadow group">
                  <div className="relative w-full h-64 rounded-[2rem] overflow-hidden bg-slate-100 mb-4">
                      
                      <MediaCarousel urls={b.mediaUrls} type={b.type} title={b.title} />
                      
                      <div className="absolute top-4 right-4 bg-indigo-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-md z-20">
                          Billboard
                      </div>
                  </div>
                  
                  <div className="px-3 pb-2 flex-1 flex flex-col">
                      <h3 className="text-xl font-black italic uppercase text-slate-900 tracking-tight leading-none mb-2">{b.title}</h3>
                      <p className="text-xs font-bold text-slate-500 line-clamp-2 mb-4">{b.description}</p>
                      
                      <button
                        onClick={() => handleDeleteWork(b._id)}
                        className="mt-auto w-full bg-rose-50 hover:bg-rose-500 text-rose-600 hover:text-white py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                      >
                        <Trash2 size={16} /> Force Takedown
                      </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
      )}

      {/* APPROVED WORKS SECTION */}
      <div>
        <div className="flex items-center gap-3 mb-6">
            <div className="bg-yellow-500 p-2 rounded-xl text-black"><Tag size={20} /></div>
            <h2 className="text-2xl font-black uppercase italic tracking-tight text-slate-800">Showroom Works</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {works.map(w => (
            <div key={w._id} className="bg-white rounded-[2.5rem] border-2 border-yellow-100/60 p-3 relative flex flex-col shadow-sm hover:shadow-xl transition-shadow group">
              <div className="relative w-full h-64 rounded-[2rem] overflow-hidden bg-slate-100 mb-4">
                  
                  <MediaCarousel urls={w.mediaUrls} type={w.type} title={w.title} />

                  <div className="absolute top-4 right-4 bg-yellow-400 text-black px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-md flex items-center gap-1 z-20">
                      <Tag size={12} /> Showroom
                  </div>
              </div>
              
              <div className="px-3 pb-2 flex-1 flex flex-col">
                  <h3 className="text-xl font-black italic uppercase text-slate-900 tracking-tight leading-none mb-2">{w.title}</h3>
                  <p className="text-xs font-bold text-slate-500 line-clamp-2 mb-4">{w.description}</p>
                  
                  <button
                    onClick={() => handleDeleteWork(w._id)}
                    className="mt-auto w-full bg-rose-50 hover:bg-rose-500 text-rose-600 hover:text-white py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 size={16} /> Force Takedown
                  </button>
              </div>
            </div>
          ))}
          
          {works.length === 0 && !loading && (
             <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-200 rounded-[3rem]">
                <p className="text-slate-400 font-bold uppercase tracking-widest">No works currently in the showroom</p>
             </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default SuperAdminContent;