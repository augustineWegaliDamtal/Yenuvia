import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Link as LinkIcon, MessageCircle, Sparkles } from "lucide-react"; 

// ✅ BULLETPROOF FACEBOOK ICON 
const FacebookIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
  </svg>
);

// ✅ BULLETPROOF TWITTER (X) ICON
const TwitterIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
  </svg>
);

const SharePopup = ({ post, onClose }) => {
  const [copied, setCopied] = useState(false);
  const shareUrl = `${window.location.origin}/post/${post._id}`;

  // 🧠 THE VIRAL PAYLOAD ENGINE
  const schoolName = post.artistId?.school || "The Arena";
  const artistName = post.artistName || post.artistId?.username || "an Arena Creator";
  
  const viralText = `🔥 ${schoolName.toUpperCase()} is taking over the Arena! Check out this masterpiece by @${artistName}. Tap the link to vote and secure points! 👇`;

  // ✅ SAFE MEDIA CHECK (Firebase compatible)
  const mainMediaUrl = post.mediaUrls?.[0] || post.mediaUrl || "/default-placeholder.png";
  const isVideo = mainMediaUrl?.match(/\.(mp4|webm|ogg|mov)/i);

  // 📱 NATIVE SHARE SHEET (iOS / Android)
  useEffect(() => {
    const triggerNativeShare = async () => {
      if (navigator.share && /Mobi|Android/i.test(navigator.userAgent)) {
        try {
          await navigator.share({
            title: `Arena: ${post.title}`,
            text: viralText,
            url: shareUrl,
          });
          onClose(); 
        } catch (error) {
          console.log("Native share cancelled or failed", error);
        }
      }
    };
  }, []);

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Arena: ${post.title}`,
          text: viralText,
          url: shareUrl,
        });
        onClose();
      } catch (error) {
        console.log("Native share failed");
      }
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`${viralText}\n\n${shareUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const stopPropagation = (e) => e.stopPropagation();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 z-[100] flex items-end sm:items-center justify-center"
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          onClick={stopPropagation}
          className="w-full sm:w-96 bg-zinc-950 border border-white/10 rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]"
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-black italic text-white uppercase tracking-widest text-lg">
              Summon <span className="text-yellow-500">Support</span>
            </h3>
            <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* 🖼️ The Share Preview Card */}
          <div className="bg-zinc-900 border border-white/5 rounded-2xl p-4 mb-6 flex gap-4 items-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 blur-3xl rounded-full pointer-events-none" />
            
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-black flex-shrink-0 border border-white/10 relative">
               {/* ✅ Dynamic Rendering for Video vs Image thumbnail */}
               {isVideo ? (
                 <video 
                   src={mainMediaUrl} 
                   autoPlay 
                   loop 
                   muted 
                   playsInline
                   className="w-full h-full object-cover" 
                 />
               ) : (
                 <img 
                   src={mainMediaUrl} 
                   className="w-full h-full object-cover" 
                   alt="Preview" 
                 />
               )}
            </div>
            
            <div>
               <h4 className="text-white font-black uppercase text-sm truncate">{post.title}</h4>
               <p className="text-yellow-500 text-[10px] font-black tracking-widest mt-1">@{artistName}</p>
            </div>
          </div>

          {/* 📱 NATIVE SHARE BUTTON */}
          {navigator.share && (
            <button 
              onClick={handleNativeShare}
              className="w-full mb-4 bg-gradient-to-r from-yellow-600 to-yellow-500 text-black font-black uppercase tracking-widest py-4 rounded-2xl shadow-[0_0_20px_rgba(234,179,8,0.3)] flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <Sparkles size={16} /> Open Native Share
            </button>
          )}

          {/* 🚀 QUICK LINKS GRID */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(viralText + "\n\n" + shareUrl)}`}
              target="_blank" rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 group"
            >
              <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-500 group-hover:bg-green-500 group-hover:text-black transition-colors">
                <MessageCircle size={20} />
              </div>
              <span className="text-[9px] font-bold text-gray-400 uppercase">WhatsApp</span>
            </a>

            <a
              href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(`🔥 ${schoolName} is dominating the Arena! Check this out from @${artistName}`)}`}
              target="_blank" rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 group"
            >
              <div className="w-12 h-12 rounded-full bg-blue-400/10 border border-blue-400/20 flex items-center justify-center text-blue-400 group-hover:bg-blue-400 group-hover:text-black transition-colors">
                <TwitterIcon />
              </div>
              <span className="text-[9px] font-bold text-gray-400 uppercase">X</span>
            </a>

            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
              target="_blank" rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 group"
            >
              <div className="w-12 h-12 rounded-full bg-blue-600/10 border border-blue-600/20 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <FacebookIcon />
              </div>
              <span className="text-[9px] font-bold text-gray-400 uppercase">Facebook</span>
            </a>

            <button
              onClick={handleCopy}
              className="flex flex-col items-center gap-2 group"
            >
              <div className={`w-12 h-12 rounded-full border flex items-center justify-center transition-colors ${copied ? 'bg-green-500 text-black border-green-500' : 'bg-white/5 border-white/10 text-white group-hover:bg-white/20'}`}>
                <LinkIcon size={20} />
              </div>
              <span className="text-[9px] font-bold text-gray-400 uppercase">{copied ? "Copied!" : "Copy"}</span>
            </button>
          </div>

          <button onClick={onClose} className="w-full py-4 text-gray-500 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors">
            Cancel
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SharePopup;