import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux'; // 🟢 Added Redux hook
import { LayoutDashboard, ShieldCheck, Zap, Users } from 'lucide-react'; 

const LandingPage = () => {
  const navigate = useNavigate();
  
  // 🟢 1. Grab the current user from your Admin Redux store
  const { currentUser } = useSelector((state) => state.admin);

  // 🟢 2. THE BOUNCER: Instantly redirect if already logged in
  useEffect(() => {
    if (currentUser) {
      // Check the role to send them to the correct dashboard
      if (currentUser.role === 'superadmin') {
        navigate('/superadmin-dashboard', { replace: true });
      } else {
        navigate('/admin-dashboard', { replace: true });
      }
    }
  }, [currentUser, navigate]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col font-sans">
      {/* --- Navigation --- */}
      <nav className="p-6 flex justify-between items-center max-w-7xl mx-auto w-full">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-600 rounded-lg flex items-center justify-center shadow-lg shadow-orange-900/20">
            <span className="text-black font-black text-xl">A</span>
          </div>
          <span className="text-xl font-bold tracking-tighter uppercase italic">Yenuvia Admin</span>
        </div>
        <div className="space-x-4">
          <button 
            onClick={() => navigate('/admin-signin')}
            className="px-6 py-2 bg-white text-black rounded-full text-sm font-bold hover:bg-yellow-400 transition-all shadow-lg"
          >
            Sign In As Admin
          </button>

        </div>
      </nav>

      {/* --- Hero Section --- */}
      <main className="flex-grow flex flex-col items-center justify-center px-4 text-center">
        <div className="inline-flex items-center space-x-2 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
          </span>
          <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">Moderation Engine v3.0</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight leading-none">
          THE ART OF <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600">
            MODERATION.
          </span>
        </h1>

        <p className="max-w-2xl text-gray-400 text-lg md:text-xl mb-10 leading-relaxed">
          The central nervous system for the Ghana Art Exhibition. Manage artists, 
          broadcast challenges, and curate Creativity in real-time.
        </p>

        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6">
          <button 
            onClick={() => navigate('/admin-signin')}
            className="px-10 py-4 bg-white text-black rounded-xl font-black text-lg hover:scale-105 transition-transform shadow-xl shadow-white/5"
          >
            Admin Access
          </button>
          <button 
            onClick={() => navigate('/superadmin-signin')}
            className="px-10 py-4 border border-white/20 rounded-xl font-bold text-lg hover:bg-white/5 transition-all flex items-center justify-center space-x-2"
          >
            <ShieldCheck size={20} />
            <span>SuperAdmin Access</span>
          </button>
        </div>
      </main>

      {/* --- Features Grid --- */}
      <section className="max-w-7xl mx-auto w-full px-6 py-20 grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-white/5">
        <FeatureCard 
          icon={<Zap className="text-yellow-500" />} 
          title="Swift Response" 
          desc="Integrated Socket.io engine for instant messaging and live submission alerts."
        />
        <FeatureCard 
          icon={<LayoutDashboard className="text-orange-500" />} 
          title="Central Control" 
          desc="Complete oversight of the exhibition schools and artist portfolios from one place."
        />
        <FeatureCard 
          icon={<Users className="text-blue-500" />} 
          title="User Sync" 
          desc="Sophisticated role-based access for Admins, SuperAdmins, and High-Valor artists."
        />
      </section>

      {/* --- Footer --- */}
      <footer className="p-10 border-t border-white/5 text-center text-gray-600 text-sm">
        © 2026 Yenuvia GHANA • DEVELOPED FOR EXCELLENCE
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc }) => (
  <div className="p-8 bg-white/5 rounded-2xl border border-white/10 hover:border-yellow-500/50 transition-colors group text-left">
    <div className="mb-4 p-3 bg-black rounded-lg w-fit group-hover:scale-110 transition-transform">{icon}</div>
    <h3 className="text-xl font-bold mb-2 uppercase italic">{title}</h3>
    <p className="text-gray-400 leading-relaxed">{desc}</p>
  </div>
);

export default LandingPage;