import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { signinFailure, signinStart, signinSuccess } from "../redux/user/userSlice";
import { useNavigate } from "react-router-dom";
import { saveToken } from "../../../api/utils/tokenManager";
import { ShieldAlert, KeyRound, Mail, Loader2, ArrowLeft } from "lucide-react";
import customFetch from "../utility/customFetch";

const SuperAdminSignin = () => {
  const [form, setForm] = useState({ email: "", password: "", role: "superadmin" });
  const [message, setMessage] = useState("");
  const { loading } = useSelector((state) => state.admin); // Use global loading state from Redux
  
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(signinStart());
    setMessage("");

    try {
      const res = await customFetch("/api/auth/superadmin-signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (data.success) {
        if (data.user.role === "superadmin") {
          saveToken("access_token", data.token);
          dispatch(signinSuccess({ ...data.user, token: data.token }));
          setMessage("✅ Superadmin Access Granted");
          setTimeout(() => navigate("/superadmin"), 1000);
        } else {
          dispatch(signinFailure("Access denied"));
          setMessage("❌ Unauthorized Role detected.");
        }
      } else {
        dispatch(signinFailure(data.message));
        setMessage(`❌ ${data.message || "Authentication failed"}`);
      }
    } catch (err) {
      dispatch(signinFailure("Server error"));
      setMessage("⚠️ Terminal Error. Check connection.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-6 font-sans">
      {/* Back Button */}
      <button 
        onClick={() => navigate('/')}
        className="absolute top-10 left-10 flex items-center space-x-2 text-gray-500 hover:text-white transition-colors"
      >
        <ArrowLeft size={20} />
        <span>Back to Landing</span>
      </button>

      <div className="w-full max-w-md">
        {/* Header Icon */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-red-600/10 border border-red-500/50 rounded-2xl flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(220,38,38,0.2)]">
            <ShieldAlert size={40} className="text-red-500" />
          </div>
          <h2 className="text-3xl font-black tracking-tighter uppercase italic">Secure Terminal</h2>
          <p className="text-gray-500 text-sm font-medium mt-2">SUPERADMIN AUTHORIZATION REQUIRED</p>
        </div>

        {/* Form Container */}
        <div className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-xl shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-yellow-500 transition-colors" size={20} />
              <input
                type="email"
                name="email"
                placeholder="Superadmin Identity"
                value={form.email}
                onChange={handleChange}
                className="w-full bg-black/40 border border-white/10 py-4 pl-12 pr-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all placeholder:text-gray-600 font-medium"
                required
              />
            </div>

            <div className="relative group">
              <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-yellow-500 transition-colors" size={20} />
              <input
                type="password"
                name="password"
                placeholder="Access Key"
                value={form.password}
                onChange={handleChange}
                className="w-full bg-black/40 border border-white/10 py-4 pl-12 pr-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all placeholder:text-gray-600 font-medium"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black py-4 rounded-xl font-black text-lg hover:bg-red-600 hover:text-white transition-all active:scale-95 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={22} />
                  <span>AUTHORIZING...</span>
                </>
              ) : (
                <span>INITIALIZE LOGIN</span>
              )}
            </button>
          </form>

          {/* Feedback Message */}
          {message && (
            <div className={`mt-6 p-4 rounded-xl text-center text-sm font-bold border ${
              message.startsWith("✅") 
                ? "bg-green-500/10 border-green-500/50 text-green-500" 
                : "bg-red-500/10 border-red-500/50 text-red-500"
            }`}>
              {message}
            </div>
          )}
        </div>

        {/* System ID */}
        <p className="mt-8 text-center text-gray-600 text-xs font-mono tracking-widest uppercase">
          Arena.Core.Systems // Root_Access.v3
        </p>
      </div>
    </div>
  );
};

export default SuperAdminSignin;