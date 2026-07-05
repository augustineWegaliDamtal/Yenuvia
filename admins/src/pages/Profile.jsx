import React, { useEffect, useState } from "react";
import {  useDispatch } from "react-redux";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { signinSuccess, signoutUserSuccess } from "../redux/user/userSlice";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { User, Mail, Lock, LogOut, Trash2, Edit3, Save, X, Camera } from "lucide-react";
import customFetch from "../utility/customFetch";

const Profile = () => {
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();

  const [profile, setProfile] = useState(!id ? currentUser : null);
  const [loading, setLoading] = useState(!!id); 
  const [editMode, setEditMode] = useState(false);
  
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const [formData, setFormData] = useState({
    username: currentUser?.username || "",
    email: currentUser?.email || "",
    password: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        let endpoint = location.pathname.startsWith("/artist") 
          ? `/api/artists/${id}` 
          : `/api/user/${id}`;

        const res = await customFetch(endpoint);
        const data = await res.json();

        if (data.success) {
          const user = data.user || data.admin;
          setProfile(user);
          setFormData({
            username: user.username,
            email: user.email,
            password: "",
          });
        }
      } catch (err) {
        console.error("Profile fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser?.token) fetchProfile();
  }, [id, currentUser, location.pathname]);

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file)); 
    }
  };

  const handleUpdate = async () => {
    try {
      const submitData = new FormData();
      submitData.append("username", formData.username);
      submitData.append("email", formData.email);
      if (formData.password) submitData.append("password", formData.password);
      
      if (avatarFile) {
        submitData.append("avatar", avatarFile);
      }

      const res = await customFetch(`/api/admin/profile/${currentUser._id}`, {
        method: "PUT",
        body: submitData, 
      });
      
      const data = await res.json();
      
      if (data.success) {
        setProfile(data.admin);
        dispatch(signinSuccess({ ...data.admin, token: currentUser.token }));
        toast.success("✅ Profile updated successfully");
        setEditMode(false);
        setAvatarFile(null); 
        setAvatarPreview(null); 
      } else {
        toast.error(data.message || "Failed to update profile");
      }
    } catch {
      toast.error("⚠️ Server error while updating profile");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete your account? This is permanent.")) return;
    try {
      const res = await customFetch(`/api/admin/profile/${currentUser._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success("✅ Account deleted successfully");
        dispatch(signoutUserSuccess());
        navigate("/");
      } else {
        toast.error(data.message || "Failed to delete account");
      }
    } catch {
      toast.error("⚠️ Server error while deleting account");
    }
  };

  const handleLogout = () => {
    dispatch(signoutUserSuccess());
    toast.info("👋 Logged out successfully");
    navigate("/");
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setAvatarPreview(null);
    setAvatarFile(null);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 md:p-10 font-sans pb-32">
      <div className="max-w-4xl mx-auto">
        
        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-slate-100">
            {id ? "Entity" : "Commander"} <span className="text-yellow-500">Profile</span>
          </h1>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">
            {id ? "Viewing external records" : "Manage your secure credentials"}
          </p>
        </div>

        {loading && (
          <div className="flex h-40 items-center justify-center">
            <p className="text-slate-400 font-bold uppercase tracking-widest animate-pulse">Decrypting Profile...</p>
          </div>
        )}

        {!loading && profile && (
          <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl backdrop-blur-md">
            
            {/* Top Profile Section */}
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-10">
              
              <div className="relative group">
                <img
                  // 🟢 THE FIX: If the avatar path starts with /uploads, point it to the backend server!
                  src={
                    avatarPreview || 
                    (profile.avatar?.startsWith("/uploads") ? `http://localhost:3000${profile.avatar}` : profile.avatar) || 
                    `https://ui-avatars.com/api/?name=${profile.username || 'User'}&background=eab308&color=000&size=256&bold=true`
                  }
                  alt={`${profile.username} profile`}
                  className={`w-32 h-32 rounded-[2rem] object-cover border-2 border-yellow-500/50 shadow-[0_0_30px_rgba(234,179,8,0.15)] transition-all ${editMode ? 'group-hover:opacity-50' : 'group-hover:scale-105'}`}
                />
                
                {editMode && (
                  <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-[2rem] opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity border-2 border-dashed border-yellow-500/50">
                    <Camera size={24} className="text-yellow-500 mb-1" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white">Upload</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageChange} 
                      className="hidden" 
                    />
                  </label>
                )}

                <div className="absolute -bottom-3 -right-3 bg-yellow-500 text-black px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg z-10">
                  {profile.role || "User"}
                </div>
              </div>

              <div className="flex-1 w-full text-center md:text-left space-y-4">
                {!editMode ? (
                  <div className="space-y-2 mt-2">
                    <h2 className="text-3xl font-black uppercase tracking-tight">{profile.username}</h2>
                    <p className="text-slate-400 font-medium flex items-center justify-center md:justify-start gap-2">
                      <Mail size={16} className="text-yellow-500"/> {profile.email}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 max-w-md w-full">
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                      <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        className="w-full bg-black/50 border border-white/10 py-3 pl-12 pr-4 rounded-xl focus:outline-none focus:border-yellow-500 transition-all font-medium text-white"
                      />
                    </div>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full bg-black/50 border border-white/10 py-3 pl-12 pr-4 rounded-xl focus:outline-none focus:border-yellow-500 transition-all font-medium text-white"
                      />
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                      <input
                        type="password"
                        name="password"
                        placeholder="New Password (optional)"
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full bg-black/50 border border-white/10 py-3 pl-12 pr-4 rounded-xl focus:outline-none focus:border-yellow-500 transition-all font-medium text-white"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {!id && (
              <div className="flex flex-wrap gap-4 border-t border-white/10 pt-8">
                {!editMode ? (
                  <>
                    <button onClick={() => setEditMode(true)} className="flex-1 md:flex-none px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                      <Edit3 size={16} /> Edit Details
                    </button>
                    <button onClick={handleLogout} className="flex-1 md:flex-none px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-black rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                      <LogOut size={16} /> Logout
                    </button>
                    <button onClick={handleDelete} className="w-full md:w-auto md:ml-auto px-6 py-3 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white border border-rose-500/20 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                      <Trash2 size={16} /> Delete Account
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={handleUpdate} className="flex-1 md:flex-none px-8 py-3 bg-yellow-500 hover:bg-yellow-400 text-black rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                      <Save size={16} /> Save Changes
                    </button>
                    <button onClick={handleCancelEdit} className="flex-1 md:flex-none px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                      <X size={16} /> Cancel
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {profile?.works?.length > 0 && (
          <div className="mt-12">
            <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-6 flex items-center gap-3">
              <span className="bg-yellow-500 w-2 h-8 rounded-full"></span>
              {id ? `${profile.username}'s Creations` : "My Uploads"}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {profile.works.map(work => (
                <div key={work._id} className="bg-white/5 border border-white/10 rounded-[2rem] p-3 overflow-hidden group">
                  <div className="w-full h-48 bg-black rounded-[1.5rem] overflow-hidden relative mb-4">
                    {work.type === "video" ? (
                      <video src={work.mediaUrls?.[0]} className="w-full h-full object-cover" />
                    ) : (
                      <img src={work.mediaUrls?.[0] || work.mediaUrl} alt={work.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    )}
                  </div>
                  <div className="px-2 pb-2">
                    <p className="font-black text-lg uppercase italic tracking-tight leading-tight truncate">{work.title}</p>
                    <p className="text-xs text-slate-400 font-medium truncate mt-1">{work.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Profile;