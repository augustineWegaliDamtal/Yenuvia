import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Flame, Trophy, Sparkles, 
  HeartHandshake, ShoppingBag, ShieldCheck, 
  ArrowRight, Globe, Layers
} from 'lucide-react';

const About = () => {
  const navigate = useNavigate();

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="bg-[#050505] h-screen overflow-y-auto overflow-x-hidden text-white font-sans pb-20 selection:bg-yellow-500 selection:text-black [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-[#050505] [&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-yellow-500/50"
    >
      {/* STICKY HEADER */}
      <div className="sticky top-0 z-50 bg-[#050505]/90 backdrop-blur-xl border-b border-white/5 py-4 px-4 max-w-3xl mx-auto flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)}
          className="bg-white/5 hover:bg-white/10 text-white p-2.5 rounded-full transition-all border border-white/10 active:scale-95 cursor-pointer"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-2">
          <Flame size={18} className="text-yellow-500" />
          <span className="font-black italic uppercase text-lg tracking-tighter text-white">YENVUIA</span>
        </div>
        <div className="w-9" /> {/* Spacer for symmetry */}
      </div>

      <div className="max-w-3xl mx-auto px-4 pt-8">
        
        {/* HERO SECTION */}
        <div className="text-center mb-12 relative">
          <div className="absolute inset-0 bg-yellow-500/10 blur-3xl rounded-full pointer-events-none -z-10" />
          <span className="text-yellow-500 text-[10px] font-black uppercase tracking-[0.2em] bg-yellow-500/10 border border-yellow-500/20 px-3 py-1.5 rounded-full">
            Our Vision & Ecosystem
          </span>
          <h1 className="text-white font-black italic text-3xl sm:text-5xl uppercase tracking-tighter mt-5 mb-4">
            Empowering Talent.<br />Funding Directives.
          </h1>
          <p className="text-zinc-400 text-xs sm:text-sm font-medium max-w-xl mx-auto leading-relaxed">
            Yenuvia is Ghana’s premier socio-cultural short-video discovery feed and community crowdfunding platform built to elevate student innovators, creators, and institutions nationwide.
          </p>
        </div>

        {/* MISSION STATEMENT */}
        <div className="bg-[#0a0a0a] border border-white/10 rounded-[2rem] p-6 mb-12 relative overflow-hidden">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-yellow-500/10 text-yellow-500 p-2.5 rounded-xl">
              <Globe size={22} />
            </div>
            <div>
              <h3 className="text-white font-black text-base uppercase italic leading-none">The Yenuvia Mission</h3>
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-1">Socio-Cultural Growth</p>
            </div>
          </div>
          <p className="text-zinc-400 text-xs leading-relaxed">
            We bridge the gap between creative execution and project capital. By turning raw talent, craft, and campus rivalry into direct community support, Yenuvia ensures that high-potential Ghanaian youth get the visibility and funding required to take their projects from idea to reality.
          </p>
        </div>

        {/* CORE PLATFORM PILLARS */}
        <div className="mb-12">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] mb-4 text-zinc-500 flex items-center gap-2">
            <Layers size={14} className="text-yellow-500" /> Platform Pillars
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Pillar 1 */}
            <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-5 hover:border-yellow-500/30 transition-all">
              <div className="bg-yellow-500/10 text-yellow-500 w-10 h-10 rounded-xl flex items-center justify-center mb-3">
                <Flame size={20} />
              </div>
              <h3 className="text-white font-black text-sm uppercase italic mb-1">1. Short-Video Feed</h3>
              <p className="text-zinc-400 text-xs leading-relaxed">
                A immersive vertical video feed spotlighting authentic Ghanaian talent, innovative prototypes, craftsmanship, and culture.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-5 hover:border-yellow-500/30 transition-all">
              <div className="bg-red-500/10 text-red-500 w-10 h-10 rounded-xl flex items-center justify-center mb-3">
                <Trophy size={20} />
              </div>
              <h3 className="text-white font-black text-sm uppercase italic mb-1">2. National Derby</h3>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Head-to-head bracket directives between Universities (UNI), SHS schools, and Tech Hubs to crowd-fund real institutional projects.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-5 hover:border-yellow-500/30 transition-all">
              <div className="bg-green-500/10 text-green-500 w-10 h-10 rounded-xl flex items-center justify-center mb-3">
                <HeartHandshake size={20} />
              </div>
              <h3 className="text-white font-black text-sm uppercase italic mb-1">3. Creator Gifting</h3>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Direct fan-to-creator tipping that enables supporters to back individual creators, artisans, and student builders instantly.
              </p>
            </div>

            {/* Pillar 4 */}
            <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-5 hover:border-yellow-500/30 transition-all">
              <div className="bg-blue-500/10 text-blue-500 w-10 h-10 rounded-xl flex items-center justify-center mb-3">
                <ShoppingBag size={20} />
              </div>
              <h3 className="text-white font-black text-sm uppercase italic mb-1">4. Artifact Marketplace</h3>
              <p className="text-zinc-400 text-xs leading-relaxed">
                A verified store where creators can list and sell authentic physical crafts, physical artworks, and cultural products.
              </p>
            </div>

          </div>
        </div>

        {/* SECURITY & PAYMENT PARTNER */}
        <div className="bg-[#0a0a0a] border border-white/10 rounded-[2rem] p-6 mb-12">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-green-500/10 text-green-500 p-2.5 rounded-xl">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h3 className="text-white font-black text-base uppercase italic leading-none">Secure Payment Processing</h3>
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-1">PCI-DSS Compliant Infrastructure</p>
            </div>
          </div>
          <p className="text-zinc-400 text-xs leading-relaxed">
            All monetary contributions, derby backing funds, and artifact transactions on Yenuvia are powered securely by <strong className="text-white">Paystack</strong>, supporting Mobile Money (MTN, Telecel, AT) and major debit/credit cards across Ghana.
          </p>
        </div>

        {/* QUICK NAVIGATION BACK TO FOOTER LINKS */}
        <div className="border-t border-white/5 pt-8 text-center">
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-4">
            Looking for Legal Policies or Help?
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link 
              to="/terms" 
              className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black text-[10px] uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all flex items-center gap-2"
            >
              <span>Terms of Service</span>
              <ArrowRight size={12} className="text-yellow-500" />
            </Link>
            <a href="mailto:damtal@yenuvia.com" className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black text-[10px] uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all flex items-center gap-2"
>
            Support
          </a>
          </div>
        </div>

        {/* COPYRIGHT */}
        <div className="text-center mt-12 text-zinc-600 font-black uppercase text-[9px] tracking-widest">
          <p>© 2026 Yenuvia Platform. All rights reserved.</p>
          <p className="mt-1 text-zinc-700">Accra, Greater Accra Region, Ghana</p>
        </div>

      </div>
    </motion.div>
  );
};

export default About;