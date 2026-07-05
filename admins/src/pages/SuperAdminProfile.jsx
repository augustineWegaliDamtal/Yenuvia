import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { signinSuccess } from "../redux/user/userSlice";
import LogoutButton from "../Component.jsx/LogoutButton";
import { Camera, User, Mail, Lock, Loader2 } from "lucide-react";
import customFetch from "../utility/customFetch";

const SuperAdminProfile = () => {
  const { currentUser } = useSelector((state) => state.admin);
  const dispatch = useDispatch();

  const [form, setForm] = useState({
    username: currentUser?.username || "",
    email: currentUser?.email || "",
    password: "",
  });

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file)); 
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const submitData = new FormData();
      submitData.append("username", form.username);
      submitData.append("email", form.email);
      
      if (form.password.trim()) submitData.append("password", form.password);
      if (avatarFile) submitData.append("avatar", avatarFile); 

      // Matches your admin router setup
      const res = await customFetch(`/api/admin/profile/${currentUser._id}`, {
        method: "PUT",
        body: submitData,
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // 🔥 FIX 1: Use data.admin and keep the token so Redux doesn't log you out
        dispatch(signinSuccess({ ...data.admin, token: currentUser.token }));
        setMessage("✅ Profile Synced Successfully");
      } else {
        setMessage(`❌ ${data.message || "Update failed"}`);
      }
    } catch (err) {
      setMessage("⚠️ Connection Failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pt-10 pb-32 px-6">
      <div className="max-w-xl mx-auto bg-white/5 border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-xl">
        
        <header className="text-center mb-10">
          <h2 className="text-4xl font-black italic uppercase tracking-tighter">
            Pilot <span className="text-yellow-500">Profile</span>
          </h2>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-500 mt-2">Personal Command Settings</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="flex flex-col items-center group mb-8">
            <label className="relative cursor-pointer">
                {/* 🔥 FIX 2: Point local uploads to port 3000 so React can see them */}
                <img
                    src={
                      avatarPreview || 
                      (currentUser?.avatar?.startsWith("/uploads") ? `http://localhost:3000${currentUser.avatar}` : currentUser?.avatar) || 
                      "/default-avatar.png"
                    }
                    alt="Avatar"
                    className="w-28 h-28 rounded-full border-4 border-yellow-500/20 object-cover shadow-2xl transition-all group-hover:scale-105 group-hover:border-yellow-500"
                />
                
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera size={24} className="text-yellow-500 mb-1" />
                </div>
                
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
            </label>
            <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 group-hover:text-yellow-500 transition-colors">
              Tap to Change Avatar
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                type="text"
                name="username"
                value={form.username}
                onChange={handleChange}
                placeholder="USERNAME"
                className="w-full bg-black/40 pl-12 pr-4 py-4 rounded-2xl border border-white/5 text-sm font-bold focus:border-yellow-500 outline-none transition-all"
              />
            </div>

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="EMAIL ADDRESS"
                className="w-full bg-black/40 pl-12 pr-4 py-4 rounded-2xl border border-white/5 text-sm font-bold focus:border-yellow-500 outline-none transition-all"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="NEW PASSWORD (LEAVE BLANK TO KEEP)"
                className="w-full bg-black/40 pl-12 pr-4 py-4 rounded-2xl border border-white/5 text-sm font-bold focus:border-yellow-500 outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-500 text-black py-5 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-yellow-500/10 hover:shadow-yellow-500/20 active:scale-95 transition-all flex items-center justify-center gap-3 cursor-pointer"
          >
            {loading ? <Loader2 className="animate-spin" /> : "Sync Changes"}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-white/5 flex flex-col items-center">
            <div className="w-full hover:scale-95 transition-transform cursor-pointer">
                <LogoutButton />
            </div>
            
            {message && (
              <p className={`mt-6 text-[10px] font-black uppercase tracking-widest ${message.includes('❌') ? 'text-red-500' : 'text-yellow-500'}`}>
                {message}
              </p>
            )}
        </div>
      </div>
    </div>
  );
};

export default SuperAdminProfile;