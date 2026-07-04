import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import OAuth from '../components/OAuth';
import { useDispatch } from "react-redux";
import { saveToken } from '../../../api/utils/tokenManager';
import { artistSigninSuccess } from '../redux/users/artistSlice';
import { motion, AnimatePresence } from "framer-motion";
import { User, Mail, Lock, Eye, EyeOff, Sparkles, AlertTriangle, ArrowRight, Loader2 } from "lucide-react";
import customFetch from '../util/customFetch.js';

const Signup = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "artist"
  });
  
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleFormData = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // ✅ FIX: Points explicitly to your backend server URL hosted on Render
      const res = await customFetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.message || "Signup failed");
        setLoading(false);
        return;
      }

      saveToken("artistUser", data.token);
      dispatch(artistSigninSuccess(data.user));

      setError(null);
      setLoading(false);
      navigate('/home'); 
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    // 🔥 THE FIX: The outer div locks to the exact height of the screen and enables scrolling
    <div className="h-[100dvh] w-full bg-black overflow-y-auto text-white relative">
      
      {/* 🌌 VOLUMETRIC BACKGROUND LIGHTING */}
      <div className="fixed top-[-15%] left-[-15%] w-[120vw] h-[120vh] bg-[radial-gradient(circle_at_center,rgba(234,179,8,0.05)_0%,rgba(17,24,39,0)_70%)] pointer-events-none z-0" />

      {/* 🔥 THE FIX: The inner div ensures content is centered, but stretches to scroll if needed */}
      <div className="min-h-full flex flex-col items-center justify-center p-6 py-12 relative z-10">
        
        {/* 🛡️ THE ARENA IDENTIFICATION PORTAL */}
        <motion.div 
          initial={{ opacity: 0, y: 40, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-sm bg-zinc-950/70 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-white/5 shadow-[0_25px_80px_-15px_rgba(0,0,0,1)] relative z-10"
        >
          {/* Cinematic light edge */}
          <div className="absolute inset-0 border-[2px] border-white/5 rounded-[2.5rem] pointer-events-none z-20" />

          <div className="text-center mb-8 relative z-30">
            <Sparkles className="text-yellow-500/20 mx-auto mb-3" size={32} strokeWidth={1} />
            <h1 className="text-4xl font-black italic uppercase tracking-tight leading-none">
              Create <span className="text-yellow-500">Identity</span>
            </h1>
            <p className="text-zinc-600 text-[9px] font-black uppercase tracking-[0.3em] mt-2 leading-tight">Create your path in to the Arena</p>
          </div>

          <form onSubmit={handleFormSubmit} className="flex flex-col gap-6 relative z-30">
            
            {/* USERNAME */}
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-yellow-500 transition-colors">
                <User size={18} />
              </div>
              <input
                type="text"
                id="username"
                placeholder="Username"
                value={formData.username}
                onChange={handleFormData}
                required
                className="w-full bg-zinc-900 rounded-[1.2rem] border border-white/5 p-5 pl-12 outline-none text-white font-bold text-sm focus:border-yellow-500/50 transition-colors placeholder:text-zinc-700 placeholder:font-bold"
              />
            </div>

            {/* EMAIL */}
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-yellow-500 transition-colors">
                <Mail size={18} />
              </div>
              <input
                type="type"
                id="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleFormData}
                required
                className="w-full bg-zinc-900 rounded-[1.2rem] border border-white/5 p-5 pl-12 outline-none text-white font-bold text-sm focus:border-yellow-500/50 transition-colors placeholder:text-zinc-700 placeholder:font-bold"
              />
            </div>

            {/* PASSWORD */}
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-yellow-500 transition-colors">
                <Lock size={18} />
              </div>
              <input
                type={showPassword ? "text" : "password"} 
                id="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleFormData}
                required
                className="w-full bg-zinc-900 rounded-[1.2rem] border border-white/5 p-5 pl-12 pr-12 outline-none text-white font-bold text-sm focus:border-yellow-500/50 transition-colors placeholder:text-zinc-700 placeholder:font-bold tracking-widest focus:tracking-wider transition-all"
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
              </button>
            </div>

            {/* ERROR ALERT */}
            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                  className="bg-red-500/10 border border-red-500/20 p-4 rounded-[1.2rem] flex items-center gap-3 overflow-hidden"
                >
                  <AlertTriangle className="text-red-500 shrink-0" size={16} />
                  <span className="text-red-500 font-bold text-[10px] uppercase leading-tight">{String(error)}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* SUBMIT BUTTON */}
            <button
              disabled={loading}
              className="w-full bg-yellow-500 text-black p-5 rounded-[1.2rem] font-black uppercase tracking-[0.2em] shadow-[0_15px_30px_rgba(234,179,8,0.2)] disabled:opacity-50 flex items-center justify-center gap-3 transition-all active:scale-95 hover:bg-yellow-400 mt-2 text-xs"
            >
              {loading ? (
                <><Loader2 className="animate-spin" size={18} /> Connect...</>
              ) : (
                <>SignUp <ArrowRight size={18} /></>
              )}
            </button>

            {/* DIVIDER */}
            <div className="flex items-center gap-4 my-1 opacity-50">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-700">Or integrate with</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* GOOGLE OAUTH */}
            <div className="w-full mt-2 relative z-30">
              <OAuth />
            </div>

          </form>
        </motion.div>

        {/* FOOTER LINK */}
        <div className="mt-8 relative z-10 text-center">
          <p className="text-zinc-700 font-bold text-[11px] uppercase tracking-widest">
            Already  Signedup ?
          </p>
          <Link to="/signin" className="inline-block mt-2">
            <span className="text-white font-black uppercase tracking-[0.2em] text-xs hover:text-yellow-500 transition-colors border-b border-yellow-500/20 pb-1">
              Sign In Here
            </span>
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Signup;