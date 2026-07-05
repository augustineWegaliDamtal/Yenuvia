import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { signinFailure, signinStart, signinSuccess } from "../redux/user/userSlice";
import { useNavigate } from "react-router-dom";
import { saveToken } from "../../../api/utils/tokenManager";
import { UserCheck, Lock, Mail, Loader2, ArrowLeft, User, ShieldAlert } from "lucide-react";
import customFetch from "../utility/customFetch";

const AdminSignin = () => {
  const [form, setForm] = useState({ username: "", email: "", password: "", role: "superadmin" });
  const [message, setMessage] = useState("");
  const [isLogin, setIsLogin] = useState(true); 
  
  const { loading } = useSelector((state) => state.admin);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    // --- REGISTRATION FLOW ---
    if (!isLogin) {
      try {
        const res = await customFetch("/api/auth/admin-signup", {
          method: "POST",
          body: JSON.stringify(form),
        });

        const data = await res.json();
        if (data.success) {
          setMessage("✅ Super Admin registered successfully! You can now sign in.");
          setIsLogin(true); 
          setForm({ ...form, password: "" }); 
        } else {
          setMessage(`❌ ${data.message || "Registration failed"}`);
        }
      } catch (err) {
        setMessage("⚠️ Server connection lost. Please try again.");
      }
      return;
    }

    // --- SIGN IN FLOW ---
    dispatch(signinStart());
    try {
      const res = await customFetch("/api/auth/admin-signin", {
        method: "POST",
        body: JSON.stringify({ email: form.email, password: form.password }), 
      });

      const data = await res.json();
      if (data.success) {
        if (data.user.role === "admin" || data.user.role === "superadmin") {
          saveToken("adminUser", data.token);
          dispatch(signinSuccess({ ...data.user, token: data.token }));
          setMessage("✅ Success! Entering the Arena...");
          
          setTimeout(() => navigate("/home"), 1000); 
        } else {
          dispatch(signinFailure("Access denied"));
          setMessage("❌ Unauthorized role. Admin access only.");
        }
      } else {
        dispatch(signinFailure(data.message));
        setMessage(`❌ ${data.message || "Signin failed"}`);
      }
    } catch (err) {
      dispatch(signinFailure("Server error"));
      setMessage("⚠️ Server connection lost. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-6 font-sans relative z-50">
      
      {/* Back Button */}
      <button 
        onClick={() => navigate('/')}
        className="absolute top-10 left-6 md:left-10 flex items-center space-x-2 text-gray-500 hover:text-yellow-500 transition-all group"
      >
        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        <span className="font-medium">Back to Main Hub</span>
      </button>

      <div className="w-full max-w-md mt-10">
        
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(234,179,8,0.1)]">
            {isLogin ? <UserCheck size={32} className="text-yellow-500" /> : <ShieldAlert size={32} className="text-yellow-500" />}
          </div>
          <h2 className="text-3xl font-black tracking-tighter uppercase italic">
            {isLogin ? "Admin Portal" : "New Commander"}
          </h2>
          <p className="text-yellow-500/70 text-sm mt-1 tracking-widest uppercase font-bold">
            {isLogin ? "Management Access" : "Register Super Admin"}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white/5 mb-20  border border-white/10 p-8 rounded-[2rem] backdrop-blur-sm shadow-2xl transition-all">
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* 🟢 CONDITIONAL USERNAME FIELD (Only shows on Register) */}
            {!isLogin && (
              <div className="relative group animate-in fade-in slide-in-from-top-2 duration-300">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-yellow-500 transition-colors" size={18} />
                <input
                  type="text"
                  name="username"
                  placeholder="Admin Username"
                  value={form.username}
                  onChange={handleChange}
                  className="w-full bg-black/50 border border-white/10 py-4 pl-12 pr-4 rounded-xl focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all placeholder:text-gray-600 font-medium text-white autofill:bg-black autofill:text-white"
                  required={!isLogin}
                />
              </div>
            )}

            {/* Email Input */}
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-yellow-500 transition-colors" size={18} />
              <input
                type="email"
                name="email"
                placeholder="Admin Email"
                value={form.email}
                onChange={handleChange}
                className="w-full bg-black/50 border border-white/10 py-4 pl-12 pr-4 rounded-xl focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all placeholder:text-gray-600 font-medium text-white autofill:bg-black autofill:text-white"
                required
              />
            </div>

            {/* Password Input */}
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-yellow-500 transition-colors" size={18} />
              <input
                type="password"
                name="password"
                placeholder="Access Password"
                value={form.password}
                onChange={handleChange}
                className="w-full bg-black/50 border border-white/10 py-4 pl-12 pr-4 rounded-xl focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all placeholder:text-gray-600 font-medium text-white autofill:bg-black autofill:text-white"
                required
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-yellow-500 text-black py-4 rounded-xl font-black text-lg hover:bg-yellow-400 hover:scale-[1.02] transition-all active:scale-95 flex items-center justify-center space-x-2 mt-4 shadow-lg shadow-yellow-500/20"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>SYNCHRONIZING...</span>
                </>
              ) : (
                <span>{isLogin ? "SIGN IN" : "REGISTER ADMIN"}</span>
              )}
            </button>
          </form>


          {/* Feedback Messages */}
          {message && (
            <div className={`mt-6 p-4 rounded-xl text-center text-sm font-bold animate-in fade-in slide-in-from-bottom-2 duration-300 border ${
              message.startsWith("✅") 
                ? "bg-green-500/10 border-green-500/40 text-green-500" 
                : "bg-red-500/10 border-red-500/40 text-red-500"
            }`}>
              {message}
            </div>
          )}
        </div>

        <p className="mt-8 text-center text-gray-600 text-[10px] font-mono tracking-widest uppercase">
          Arena Moderation Module // Secure Session
        </p>
      </div>
    </div>
  );
};

export default AdminSignin;