import React from 'react';
import { motion } from 'framer-motion';
import { Shield, BookOpen, Landmark, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';

const Terms = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-black min-h-screen pb-32 max-w-md mx-auto relative overflow-x-hidden text-zinc-300">
      
      {/* HEADER */}
      <div className="pt-10 px-6 pb-6 border-b border-white/5 bg-zinc-950 relative">
        
        {/* Back Button */}
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-6 group cursor-pointer"
        >
          <div className="p-2 bg-white/5 rounded-full group-hover:bg-white/10 transition-colors">
            <ArrowLeft size={16} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest">Back to Profile</span>
        </button>

        <div className="w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center mb-4 border border-white/5">
          <BookOpen className="text-yellow-500" size={24} />
        </div>
        <h1 className="text-2xl font-black italic text-white uppercase tracking-tighter">
          Terms & Copyright
        </h1>
        <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 mt-2">
          Effective Date: {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* CONTENT */}
      <div className="p-6 space-y-8">
        
        {/* Section 1: Standard Uploads */}
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-3">
            <Shield className="text-yellow-500" size={18} />
            <h2 className="text-sm font-black uppercase text-white tracking-widest">
              1. Yenuvia (Standard Uploads)
            </h2>
          </div>
          <div className="bg-zinc-900/50 p-5 rounded-3xl border border-white/5 space-y-3 text-xs leading-relaxed">
            <p>
              <strong className="text-white">Your Ownership:</strong> You retain 100% ownership and all moral copyrights to any artwork you upload to the Yenuvia Arena. We do not claim ownership of your creations.
            </p>
            <p className="text-zinc-400">
              <strong className="text-white">Our License:</strong> To operate the platform and showcase your work, we require certain permissions. By uploading content, you grant Yenuvia-Damtal a worldwide, non-exclusive, royalty-free license to host, display, compress, and distribute your content strictly for operating and promoting the Yenuvia platform.
            </p>
          </div>
        </motion.section>

        {/* Section 2: Museum Fixtures */}
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="flex items-center gap-3 mb-3">
            <Landmark className="text-yellow-500" size={18} />
            <h2 className="text-sm font-black uppercase text-white tracking-widest">
              2. Museum & Fixture Acquisitions
            </h2>
          </div>
          <div className="bg-zinc-900/50 p-5 rounded-3xl border border-white/5 space-y-3 text-xs leading-relaxed text-zinc-400">
            <p>
              Yenuvia hosts exclusive "Fixtures" and exhibitions. By explicitly submitting your artwork to a Yenuvia Fixture, you agree to the following investor terms:
            </p>
            <ul className="list-disc pl-4 space-y-2">
              <li>
                <strong className="text-white">Right of First Refusal:</strong> Yenuvia-Damtal reserves the first right to acquire or invest in submitted works before they are offered to outside galleries.
              </li>
              <li>
                <strong className="text-white">Prize Acquisitions:</strong> If your work wins a Fixture, the provided prize money serves as an official acquisition budget. Acceptance of the prize legally transfers the exclusive commercial reproduction and exhibition rights of that specific artwork to the Yenuvia Museum permanently.
              </li>
            </ul>
          </div>
        </motion.section>

        {/* Legal Footer */}
        <div className="pt-8 mt-8 border-t border-white/5 text-center">
          <p className="text-[9px] uppercase tracking-widest font-black text-zinc-600 italic">
            © {new Date().getFullYear()} Yenuvia. A product of Yenuvia-Damtal.
          </p>
        </div>

      </div>

      <BottomNav />
    </div>
  );
};

export default Terms;