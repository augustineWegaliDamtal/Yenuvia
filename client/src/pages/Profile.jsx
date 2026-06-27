import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getDownloadURL, getStorage, ref, uploadBytesResumable } from 'firebase/storage';
import { app } from '../firebase';
import {
  artistDeleteUserFailure,
  artistDeleteUserStart,
  artistDeleteUserSuccess,
  artistSignoutUserFailure,
  artistSignoutUserStart,
  artistSignoutUserSuccess,
  artistUpdateUserFailure,
  artistUpdateUserStart,
  artistUpdateUserSuccess,
} from '../redux/users/artistSlice';
import { useNavigate, useParams, useLocation, Link } from 'react-router-dom';
import WorkShow from '../components/WorkShow';
import BottomNav from '../components/BottomNav';
import VerifyAccountButton from '../components/VerifyAccountButton';
import VerifiedBadge from "../components/VerifiedBadge";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Settings, Camera, LogOut, Trash2, UserPlus, 
  UserCheck, LayoutGrid, ShoppingBag, Wallet, Archive, ChevronLeft 
} from "lucide-react";

const Profile = () => {
  const { currentUserArtist } = useSelector((state) => state.artist);
  const { id } = useParams();
  const location = useLocation();
  const isOwner = !id || id === currentUserArtist?._id;

  const [file, setFile] = useState(null);
  const fileRef = useRef();
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    avatar: '',
    school: '',
    bio: '',
    momoName: '',
    momoNetwork: '',
    momoNumber: '',
    password: ''
  });
  
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("gallery"); 
  const [userData, setUserData] = useState(null);
  const [stats, setStats] = useState({ hypes: 0, rank: '...', followers: 0, following: 0 });
  const [isFollowing, setIsFollowing] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false); 
  const [purchases, setPurchases] = useState([]);
  const [loadingPurchases, setLoadingPurchases] = useState(false);
  
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfileData = async () => {
      const targetId = id || currentUserArtist?._id;
      if (!targetId) return;

      try {
        const userRes = await fetch(`/api/user/${targetId}`);
        const userData = await userRes.json();
        
        const statsRes = await fetch(`/api/user/stats/${targetId}`);
        const statsData = await statsRes.json();

        if (userData.success) {
          setUserData(userData.user);
          setFormData({
            username: userData.user.username,
            email: userData.user.email,
            avatar: userData.user.avatar,
            school: userData.user.school || '',
            bio: userData.user.bio || '',
            momoName: userData.user.momoName || '',
            momoNetwork: userData.user.momoNetwork || '',
            momoNumber: userData.user.momoNumber || '',
            password: ''
          });
          setIsFollowing(userData.user.followers?.includes(currentUserArtist?._id));
        }

        if (statsData.success) {
          setStats(statsData.stats);
        }
      } catch (err) {
        console.error("Profile Load Error:", err);
      }
    };

    fetchProfileData();
    setEditing(false);
  }, [id, currentUserArtist, location.pathname]);

  useEffect(() => {
    if (file) {
      const handleFileUpload = async () => {
        setUploadingAvatar(true);
        const storage = getStorage(app);
        const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
        const storageRef = ref(storage, `avatars/${fileName}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on(
          'state_changed',
          (snapshot) => {}, 
          (error) => {
            console.error("Avatar Upload Failed", error);
            setUploadingAvatar(false);
          },
          () => {
            getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
              setFormData((prev) => ({ ...prev, avatar: downloadURL }));
              setUploadingAvatar(false);
            });
          }
        );
      };
      handleFileUpload();
    }
  }, [file]);

  useEffect(() => {
    if (activeTab === 'vault' && isOwner) {
      const fetchPurchases = async () => {
        setLoadingPurchases(true);
        try {
          const res = await fetch('/api/order/my-orders', {
            headers: { Authorization: `Bearer ${currentUserArtist?.token}` }
          });
          const data = await res.json();
          if (data.success) {
            setPurchases(data.orders);
          }
        } catch (err) {
          console.error("Failed to fetch purchases", err);
        } finally {
          setLoadingPurchases(false);
        }
      };
      fetchPurchases();
    }
  }, [activeTab, isOwner, currentUserArtist]);

  const handleFollowToggle = async () => {
    if (!currentUserArtist) return navigate('/signin');
    try {
      const res = await fetch(`/api/user/follow/${userData._id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${currentUserArtist.token}` }
      });
      const data = await res.json();
      if (data.success) {
        setIsFollowing(data.isFollowing);
        setStats(prev => ({
          ...prev,
          followers: data.isFollowing ? prev.followers + 1 : prev.followers - 1
        }));
      }
    } catch (err) { console.error(err); }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      dispatch(artistUpdateUserStart());

      const safePayload = { ...formData };
      if (!safePayload.password || safePayload.password.trim() === "") {
        delete safePayload.password; 
      }

      const res = await fetch(`/api/user/update/${currentUserArtist._id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUserArtist.token}` 
        },
        body: JSON.stringify(safePayload), 
      });
      const data = await res.json();
      
      if (!data.success) return dispatch(artistUpdateUserFailure(data.message));
      
      dispatch(artistUpdateUserSuccess(data.user));
      setUserData(data.user); 
      setEditing(false);
    } catch (error) { 
      dispatch(artistUpdateUserFailure(error.message)); 
    }
  };

  if (!userData) return (
    <div className="h-screen bg-black flex flex-col items-center justify-center">
      <div className="w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-white font-black italic uppercase tracking-[0.2em] text-[10px]">Yenuvia Loading...</p>
    </div>
  );

  const handleSignOut = async () => {
    try {
      dispatch(artistSignoutUserStart());
      const res = await fetch('/api/auth/signout', { method: 'POST' });
      const data = await res.json();

      if (data.success === false) {
        dispatch(artistSignoutUserFailure(data.message));
        return;
      }
      dispatch(artistSignoutUserSuccess());
      navigate('/signin'); 
    } catch (error) {
      dispatch(artistSignoutUserFailure(error.message));
    }
  };

  return (
    // 🔥 Added overflow-y-auto so the entire page can scroll naturally
    <div className="bg-zinc-950 min-h-screen pb-32 max-w-md mx-auto relative overflow-x-hidden overflow-y-auto text-white">
      
      {/* 🌌 HERO HEADER */}
      <div className="h-52 bg-gradient-to-b from-indigo-900/40 to-zinc-950 w-full relative">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
        
        {/* 🔙 TOP LEFT CONTROLS: Navigation & Wallet properly aligned */}
        <div className="absolute top-10 left-6 flex items-center gap-3 z-30">
          <button 
            onClick={() => navigate(-1)}
            className="p-2.5 bg-black/40 backdrop-blur-md rounded-[1rem] text-white border border-white/10 hover:bg-white/10 active:scale-95 transition-all shadow-lg"
          >
            <ChevronLeft size={20} />
          </button>
          
          {isOwner && (
            <button 
              onClick={() => navigate('/vault')}
              className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 px-4 py-2.5 rounded-[1rem] flex items-center gap-2 font-black text-[12px] uppercase tracking-widest hover:bg-yellow-500/20 transition-all shadow-[0_0_15px_rgba(234,179,8,0.15)] cursor-pointer backdrop-blur-md active:scale-95"
            >
              <Wallet size={16} />
              <span>GHS {(currentUserArtist?.walletBalance || 0).toFixed(2)}</span>
            </button>
          )}
        </div>

        {isOwner && (
          <button 
            onClick={() => setEditing(!editing)}
            className="absolute top-10 right-6 p-3 bg-white/5 backdrop-blur-2xl rounded-2xl text-white border border-white/10 active:scale-90 transition-all z-20"
          >
            <Settings size={20} />
          </button>
        )}
      </div>

      {/* 👤 PROFILE CARD */}
      <div className="px-6 -mt-24 relative z-10">
        <div className="flex flex-col items-center">
            <div className="relative">
              <img
                className={`rounded-[3rem] w-40 h-40 border-[6px] border-zinc-950 object-cover shadow-2xl bg-zinc-900 transition-opacity ${uploadingAvatar ? 'opacity-50' : 'opacity-100'}`}
                src={formData.avatar || '/default-avatar.png'}
                alt="Profile"
              />
              
              {uploadingAvatar && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {isOwner && editing && !uploadingAvatar && (
                <div onClick={() => fileRef.current.click()} className="absolute inset-0 bg-black/60 rounded-[3rem] flex items-center justify-center cursor-pointer text-yellow-500 hover:bg-black/40 transition-all">
                  <Camera size={32} />
                </div>
              )}
              <input type="file" hidden accept="image/*" onChange={(e) => setFile(e.target.files[0])} ref={fileRef} />
            </div>

            <div className="text-center mt-4">
                <h1 className="text-3xl font-black italic flex items-center justify-center gap-2 uppercase tracking-tighter">
                  {userData.username}
                  <VerifiedBadge verified={userData.verified} />
                </h1>
                <p className="text-yellow-500 font-black text-[10px] uppercase tracking-[0.3em] mt-1">
                  {userData.school || "Freelance Artist"}
                </p>
                <p className="mt-4 text-zinc-400 text-sm font-medium leading-relaxed italic px-4">
                  "{userData.bio || "Crafting masterpieces for the Yenuvia."}"
                </p>
            </div>
        </div>

        {/* 🏆 TROPHY STATS BAR */}
        <div className="grid grid-cols-3 gap-2 mt-8 bg-white/5 p-4 rounded-[2.5rem] border border-white/5 backdrop-blur-sm">
            <div className="text-center py-2 border-r border-white/5">
                <p className="text-lg font-black text-white">{stats.hypes}</p>
                <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Hypes</p>
            </div>
            <div className="text-center py-2 border-r border-white/5">
                <p className="text-lg font-black text-yellow-500">{stats.rank}</p>
                <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Yenuvia Rank</p>
            </div>
            <div className="text-center py-2">
                <p className="text-lg font-black text-white">{stats.followers}</p>
                <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Fans</p>
            </div>
        </div>

        {/* ⚡ ACTION BAR */}
        <div className="flex gap-3 mt-6">
            {!isOwner ? (
                <>
                  <button 
                    onClick={handleFollowToggle}
                    className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg ${
                      isFollowing ? "bg-zinc-800 text-zinc-400" : "bg-white text-black"
                    }`}
                  >
                    {isFollowing ? <><UserCheck size={16}/> Following</> : <><UserPlus size={16}/> Follow Artist</>}
                  </button>
                  <button className="bg-yellow-500 p-4 rounded-2xl text-black shadow-lg active:scale-95 transition-all">
                      <Wallet size={20} />
                  </button>
                </>
            ) : (
                <button 
                    onClick={() => navigate('/uploads')}
                    className="w-full bg-white text-black py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all"
                >
                    Deploy New Work
                </button>
            )}
        </div>
      </div>

 {/* 📑 TAB NAVIGATION */}
      <div className="mt-10 px-6">
        <div className="flex bg-zinc-900/50 p-1 rounded-2xl border border-white/5">
            <button 
                onClick={() => setActiveTab("gallery")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'gallery' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500'}`}
            >
                <LayoutGrid size={14} /> Portfolio
            </button>
            <button 
                onClick={() => setActiveTab("shop")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'shop' ? 'bg-zinc-800 text-yellow-500 shadow-lg' : 'text-zinc-500'}`}
            >
                <ShoppingBag size={14} /> Showroom
            </button>
            {isOwner && (
              <button 
                  onClick={() => setActiveTab("vault")}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'vault' ? 'bg-zinc-800 text-green-500 shadow-lg' : 'text-zinc-500'}`}
              >
                  <Archive size={14} /> Collection
              </button>
            )}
        </div>
      </div>

      {/* CONTENT AREA */}
      <div className="p-6">
      <AnimatePresence mode="wait">
          {isOwner && editing ? (
            <motion.form 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              onSubmit={handleUpdate} className="space-y-4 bg-zinc-900/50 p-6 rounded-[2.5rem] border border-white/5 shadow-2xl"
            >
              <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] mb-2 px-2">Brand Management</h3>
              
              <div className="space-y-1">
                <label className="text-[9px] font-black text-zinc-600 ml-2 uppercase">Username</label>
                <input type="text" value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} className="w-full bg-zinc-950 rounded-2xl p-4 outline-none text-sm font-bold border border-white/5 focus:border-yellow-500/50" />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-zinc-600 ml-2 uppercase">Artist Bio</label>
                <textarea value={formData.bio} onChange={(e) => setFormData({...formData, bio: e.target.value})} className="w-full bg-zinc-950 rounded-2xl p-4 outline-none text-sm font-bold border border-white/5 h-24 resize-none focus:border-yellow-500/50" />
              </div>

              {/* ✅ MONETIZATION SECTION */}
              <div className="pt-4 mt-4 border-t border-white/5">
                <h3 className="text-[10px] font-black uppercase text-yellow-500 tracking-[0.2em] mb-4 px-2 flex items-center gap-2">
                  <Wallet size={14} /> Payout Settings
                </h3>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-zinc-600 ml-2 uppercase">Registered MoMo Name</label>
                    <input 
                      type="text" 
                      value={formData.momoName} 
                      onChange={(e) => setFormData({...formData, momoName: e.target.value})} 
                      className="w-full bg-zinc-950 rounded-2xl p-4 outline-none text-sm font-bold border border-white/5 focus:border-yellow-500/50" 
                      placeholder="e.g. Frank Numlan" 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-zinc-600 ml-2 uppercase">Network</label>
                      <select 
                        value={formData.momoNetwork} 
                        onChange={(e) => setFormData({...formData, momoNetwork: e.target.value})}
                        className="w-full bg-zinc-950 rounded-2xl p-4 outline-none text-sm font-bold border border-white/5 focus:border-yellow-500/50 appearance-none text-yellow-500"
                      >
                        <option value="">Select...</option>
                        <option value="MTN">MTN</option>
                        <option value="VOD">Telecel/Vodafone</option>
                        <option value="ATL">AirtelTigo</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-zinc-600 ml-2 uppercase">MoMo Number</label>
                      <input 
                        type="tel" 
                        value={formData.momoNumber} 
                        onChange={(e) => setFormData({...formData, momoNumber: e.target.value})} 
                        className="w-full bg-zinc-950 rounded-2xl p-4 outline-none text-sm font-bold border border-white/5 focus:border-yellow-500/50 text-yellow-500" 
                        placeholder="024xxxxxxx" 
                      />
                    </div>
                  </div>
                </div>
              </div>
              {/* --- END MONETIZATION SECTION --- */}

              <button 
                disabled={uploadingAvatar} 
                className="w-full bg-yellow-500 text-black font-black py-5 rounded-2xl uppercase tracking-[0.2em] text-[10px] shadow-xl active:scale-95 transition-all mt-4 disabled:opacity-50"
              >
                {uploadingAvatar ? "Uploading Avatar..." : "Save Artist Identity"}
              </button>

              <div className="flex justify-between pt-6 border-t border-white/5 mt-4">
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 p-5 rounded-[2rem] bg-red-500/5 border border-red-500/10 hover:bg-red-500/10 transition-all group"
                >
                  <div className="w-2 h-2 rounded-full bg-red-500 group-hover:scale-125 transition-transform" />
                  <span className="text-red-500 font-black uppercase text-[10px] tracking-[0.3em]">
                    Sign Out of Yenuvia
                  </span>
                </button>
              </div>
            </motion.form>

          ) : activeTab === 'vault' && isOwner ? (
            
            /* 🚀 THE COLLECTION UI */
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] mb-4 px-2">Acquired Masterpieces</h3>
              
              {loadingPurchases ? (
                <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" /></div>
              ) : purchases.length === 0 ? (
                <div className="text-center py-10 bg-zinc-900/50 rounded-[2.5rem] border border-white/5">
                  <Archive size={32} className="mx-auto mb-3 text-zinc-600" />
                  <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">Your collection is empty.</p>
                </div>
              ) : (
                purchases.map(order => (
                  <Link to={`/order/${order._id}`} key={order._id} className="block bg-zinc-900/50 border border-white/5 p-5 rounded-3xl shadow-xl active:scale-95 transition-all">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[9px] text-zinc-500 font-black uppercase tracking-widest">{new Date(order.createdAt).toLocaleDateString()}</span>
                      <span className={`text-[8px] font-black uppercase px-2.5 py-1 rounded-md ${order.escrowStatus === 'released' ? 'bg-green-500/20 text-green-500' : 'bg-blue-500/20 text-blue-500'}`}>
                        {order.escrowStatus === 'released' ? 'Delivered' : 'In Transit'}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-white truncate">{order.workId?.title || "Unknown Work"}</h3>
                    <p className="text-zinc-400 text-[10px] mt-1 uppercase font-bold tracking-wider">Artist: @{order.artistId?.username}</p>
                    <div className="mt-3 pt-3 border-t border-white/5 flex justify-between items-center">
                      <p className="text-yellow-500 font-black italic text-sm">GHS {order.totalPaidGHS}</p>
                      <p className="text-[8px] text-zinc-500 font-black uppercase tracking-widest bg-white/5 px-2 py-1 rounded-md">View Receipt</p>
                    </div>
                  </Link>
                ))
              )}
            </motion.div>

          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <WorkShow 
                userId={id || currentUserArtist?._id} 
                isOwner={isOwner} 
                activeTab={activeTab} 
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
              
      <div className="mt-8 mx-6 pt-8 pb-10 border-t border-white/5 text-center">
        <div className="flex justify-center gap-6 text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-4">
          <Link to="/terms" className="hover:text-white transition-colors">
            Terms & Copyright
          </Link>
          <a href="mailto:damtal@yenuvia.com" className="hover:text-white transition-colors">
            Support
          </a>
        </div>
        <p className="text-zinc-600 text-[9px] uppercase tracking-widest font-black italic">
          © {new Date().getFullYear()} Yenuvia
        </p>
      </div>
      <BottomNav />
    </div>
  );
};

export default Profile;