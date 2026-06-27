import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="w-full bg-[#0a0a0a] border-t border-white/10 py-8 mt-12">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
        
        {/* Left Side: Brand & Legal Entity */}
        <div className="text-center md:text-left">
          <h2 className="text-white font-black italic tracking-widest text-lg uppercase">
            Yenuvia
          </h2>
          <p className="text-zinc-500 text-xs font-medium mt-1">
            © {new Date().getFullYear()} Yenuvia. A product of Yenuvia-Damtal.
          </p>
          <p className="text-zinc-600 text-[10px] mt-1">
            All uploaded artworks are the copyright of their respective creators.
          </p>
        </div>

        {/* Right Side: Links */}
        <div className="flex gap-6 text-xs font-bold uppercase tracking-widest text-zinc-400">
          <Link to="/terms" className="hover:text-blue-500 transition-colors">
            Terms & Copyright
          </Link>
          <a href="mailto:damtal@yenuvia.com" className="hover:text-blue-500 transition-colors">
            Support
          </a>
        </div>

      </div>
    </footer>
  );
};

export default Footer;