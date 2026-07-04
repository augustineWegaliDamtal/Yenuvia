import React, { useState } from "react";
import { UserPlus, User, Mail, Lock, Loader2, ArrowLeft, Shield } from "lucide-react";
import customFetch from "../utility/customFetch";

// Accept onClose as a prop from the SuperAdminDashboard overlay
const AdminSignup = ({ onClose }) => {
  // Default role is admin, but the dropdown changes it
  const [form, setForm] = useState({ username: "", email: "", password: "", role: "admin" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      // Points to your secure backend route: router.post("/", verifyToken, verifySuperAdmin, createAdmin);
      const res = await customFetch("/api/admin/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (data.success) {
        setMessage(`✅ ${form.role.toUpperCase()} created successfully!`);
        // Reset form after success so you can create another one if needed
        setTimeout(() => {
          setForm({ username: "", email: "", password: "", role: "admin" });
          setMessage("");
        }, 3000);
      } else {
        setMessage(`❌ ${data.message || "Registration failed"}`);
      }
    } catch (err) {
      setMessage("⚠️ Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-6 font-sans relative z-50">
      
      {/* Back Button - Now uses onClose to close the modal overlay */}
      <button 
        onClick={onClose}
        className="absolute top-10 left-6 md:left-10 flex items-center space-x-2 text-gray-500 hover:text-yellow-500 transition-all group cursor-pointer z-50"
      >
        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        <span className="font-medium">Close Command Center</span>
      </button>

      <div className="w-full max-w-md mt-10">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          {/* 🟡 Gold Icon Box */}
          <div className="w-16 h-16 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(234,179,8,0.1)]">
            <UserPlus size={32} className="text-yellow-500" />
          </div>
          <h2 className="text-3xl font-black tracking-tighter uppercase italic">New Admin</h2>
          <p className="text-yellow-500/70 text-sm mt-1 tracking-widest uppercase font-bold">System Registration</p>
        </div>

        {/* Form Card */}
        <div className="bg-white/5 border border-white/10 p-8 rounded-[2rem] backdrop-blur-sm shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Username Input */}
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-yellow-500 transition-colors" size={18} />
              <input
                type="text"
                name="username"
                placeholder="Admin Username"
                value={form.username}
                onChange={handleChange}
                className="w-full bg-black/50 border border-white/10 py-4 pl-12 pr-4 rounded-xl focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all placeholder:text-gray-600 font-medium text-white autofill:bg-black autofill:text-white"
                required
              />
            </div>

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

            {/* 🔥 THE NEW TOGGLE: Role Selection Dropdown */}
            <div className="relative group">
              <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-yellow-500 transition-colors" size={18} />
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="w-full bg-black/50 border border-white/10 py-4 pl-12 pr-4 rounded-xl focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all text-white font-medium appearance-none cursor-pointer"
              >
                <option value="admin" className="bg-[#121212] text-white">System Admin</option>
                <option value="superadmin" className="bg-[#121212] text-white">Superadmin (Full Access)</option>
              </select>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-yellow-500 text-black py-4 rounded-xl font-black text-lg hover:bg-yellow-400 hover:scale-[1.02] transition-all active:scale-95 flex items-center justify-center space-x-2 mt-4 shadow-lg shadow-yellow-500/20 cursor-pointer"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <span>Create Account</span>
              )}
            </button>
          </form>

          {/* Feedback Messages */}
          {message && (
            <div className={`mt-6 p-4 rounded-xl text-center text-sm font-bold border ${
              message.startsWith("✅") 
                ? "bg-green-500/10 border-green-500/40 text-green-500" 
                : "bg-red-500/10 border-red-500/40 text-red-500"
            }`}>
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSignup;