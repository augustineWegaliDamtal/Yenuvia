import React, { useEffect, useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useSocket } from "../context/SocketContext"; 
import BottomNav from "../components/BottomNav";
import { CLEAR_UNREAD_MESSAGES } from "../redux/users/notificationsSlice";
import { Send, Paperclip, Loader2, X, Film } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import customFetch from "../util/customFetch.js";

const Inbox = () => {
  const { currentUserArtist } = useSelector((state) => state.artist);
  const [messages, setMessages] = useState([]);
  const [formData, setFormData] = useState({ content: "" });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedThreadKey, setSelectedThreadKey] = useState(null);

  const dispatch = useDispatch();
  const bottomRef = useRef(null);
  
  const socket = useSocket();

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

  // 🔌 1. ESTABLISH THE SECURE CONNECTION
  useEffect(() => {
    if (socket && currentUserArtist?._id) {
      console.log(`🔌 Artist Connected to Comms: ${currentUserArtist._id}`);
      socket.emit("join", currentUserArtist._id); 
    }
  }, [socket, currentUserArtist?._id]);

  // 📩 2. HISTORY FETCH
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await customFetch("/api/messages", {
          headers: { Authorization: `Bearer ${currentUserArtist?.token}` },
        });
        const data = await res.json();
        if (data.success) {
          const sorted = data.messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
          setMessages(sorted);
        }
      } catch (err) { console.error("Inbox offline"); }
    };
    
    if (currentUserArtist?.token) {
      fetchMessages();
    }
  }, [currentUserArtist, dispatch]);

  // 🔄 3. AUTO-SCROLL
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ⚡ 4. FIXED: Listen for incoming messages & Patch the "Invisible Echo"
  useEffect(() => {
    if (!socket) return;

    const handleAdminReply = (newMsg) => {
      console.log("🚨 Live transmission received:", newMsg);

      setMessages((prev) => {
        // 1. If the message ID already exists, ignore it (HTTP fallback)
        if (prev.some((m) => m._id === newMsg._id)) return prev;

        const senderId = String(newMsg.sender?._id || newMsg.sender);
        const myId = String(currentUserArtist?._id);

        // 2. If YOU sent this message, ignore the socket bounce! 
        if (senderId === myId) {
          return prev;
        }

        // 🔥 THE FIX: Patch the message so the thread bundler doesn't drop it.
        // If it's an incoming message, the recipient is definitively ME (the artist).
        const patchedMsg = {
          ...newMsg,
          recipient: newMsg.recipient || myId,
          sender: newMsg.sender || senderId
        };

        return [...prev, patchedMsg];
      });
    };

    socket.on("receiveMessage", handleAdminReply);
    return () => socket.off("receiveMessage", handleAdminReply);
  }, [socket, currentUserArtist?._id]);

  // 📝 5. THREAD BUNDLING
  const groupedThreads = messages.reduce((acc, msg) => {
    const sId = String(msg.sender?._id || msg.sender);
    const rId = String(msg.recipient?._id || msg.recipient);
    
    // If our socket patch wasn't there, incoming messages would die right here
    if (!sId || !rId) return acc; 
    
    const key = [sId, rId].sort().join("-");
    if (!acc[key]) acc[key] = [];
    acc[key].push(msg);
    return acc;
  }, {});

  useEffect(() => {
    const keys = Object.keys(groupedThreads);
    if (keys.length > 0 && !selectedThreadKey) {
      setSelectedThreadKey(keys[keys.length - 1]); 
    }
  }, [groupedThreads, selectedThreadKey]);

  // 🚀 6. SWIFT SEND ACTION
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!formData.content.trim() && !file) return;

    const currentThread = groupedThreads[selectedThreadKey];
    if (!currentThread) return; 

    const firstMsg = currentThread[0];
    const partnerId = String(firstMsg.sender?._id || firstMsg.sender) === String(currentUserArtist._id) 
      ? String(firstMsg.recipient?._id || firstMsg.recipient) 
      : String(firstMsg.sender?._id || firstMsg.sender);

    let optimMediaType = null;
    if (file) {
      const isVideo = file.type.includes('video') || file.name.match(/\.(mp4|webm|ogg|mov)$/i);
      optimMediaType = isVideo ? "video" : "image";
    }

    // ⚡ CREATE OPTIMISTIC GHOST MESSAGE
    const optimisticId = `temp-${Date.now()}`;
    const optimisticMsg = {
      _id: optimisticId,
      sender: currentUserArtist,
      recipient: partnerId,
      content: formData.content,
      mediaUrl: file ? URL.createObjectURL(file) : null,
      mediaType: optimMediaType,
      createdAt: new Date().toISOString(),
      isOptimistic: true 
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    
    const contentToSubmit = formData.content;
    const fileToSubmit = file;
    
    setFormData({ content: "" });
    setFile(null);
    setLoading(true);

    try {
      const fd = new FormData();
      fd.append("recipient", partnerId);
      fd.append("content", contentToSubmit);
      if (fileToSubmit) fd.append("media", fileToSubmit);

      const res = await customFetch("/api/messages", {
        method: "POST",
        headers: { Authorization: `Bearer ${currentUserArtist.token}` },
        body: fd,
      });

      const data = await res.json();
      if (data.success) {
        setMessages((prev) => 
          prev.map(m => {
            if (m._id === optimisticId) {
              return {
                ...data.message,
                sender: data.message.sender || currentUserArtist,
                recipient: data.message.recipient || partnerId
              };
            }
            return m;
          })
        );
      }
    } catch (err) {
      setMessages((prev) => prev.filter(m => m._id !== optimisticId));
      alert("Transmission failed.");
    } finally {
      setLoading(false);
    }
  };

  const isPreviewVideo = file && (file.type.includes('video') || file.name.match(/\.(mp4|webm|ogg|mov)$/i));

  return (
    <div className="flex flex-col h-screen w-full max-w-md mx-auto bg-black text-white relative">
      {/* HEADER */}
      <div className="p-6 border-b border-white/10 flex items-center justify-between bg-black sticky top-0 z-10">
        <h2 className="text-sm font-black uppercase italic tracking-widest text-yellow-500">Yenuvia Messenger</h2>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[8px] font-black uppercase text-gray-500">Live Sync</span>
        </div>
      </div>

      {/* CHAT FEED */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0a0a0a] pb-44 no-scrollbar">
        {selectedThreadKey && groupedThreads[selectedThreadKey].map((msg) => {
          const isMe = String(msg.sender?._id || msg.sender) === String(currentUserArtist._id);
          
          let mediaSrc = null;
          if (msg.mediaUrl) {
            let cleanUrl = msg.mediaUrl.replace(/\\/g, '/');
            
            if (cleanUrl.startsWith('blob:') || cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
              mediaSrc = cleanUrl;
            } else {
              mediaSrc = `${BACKEND_URL}${cleanUrl.startsWith('/') ? '' : '/'}${cleanUrl}`;
            }
          }

          return (
            <div key={msg._id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div className={`p-4 rounded-3xl max-w-[85%] shadow-xl transition-all duration-300 ${
                msg.isOptimistic ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
              } ${
                isMe ? "bg-white text-black rounded-tr-none" : "bg-zinc-800 text-white rounded-tl-none border border-white/5"
              }`}>
                
                {msg.content && <p className="text-[11px] font-medium leading-relaxed">{msg.content}</p>}
                
                {/* 🔥 MEDIA RENDERER */}
                {mediaSrc && (
                  <div className="mt-2 rounded-2xl overflow-hidden border border-black/10 bg-black/20 min-h-[50px] flex items-center justify-center relative">
                    {msg.mediaType === "image" ? (
                      <img 
                        src={mediaSrc} 
                        className="w-full object-contain max-h-[300px]" 
                        alt="Arena media" 
                        onError={(e) => { 
                          e.target.style.display = 'none'; 
                          e.target.nextSibling.style.display = 'block'; 
                        }} 
                      />
                    ) : msg.mediaType === "video" ? (
                      <video 
                        src={mediaSrc} 
                        controls 
                        playsInline 
                        preload="metadata"
                        webkit-playsinline="true"
                        className="w-full max-h-[300px] bg-black" 
                        onError={(e) => { 
                          e.target.style.display = 'none'; 
                          e.target.nextSibling.style.display = 'block'; 
                        }}
                      />
                    ) : (
                      <div className="p-4 text-[9px] text-zinc-500 font-bold uppercase italic">Unsupported File</div>
                    )}
                    
                    {/* Fallback hidden text */}
                    <div style={{ display: 'none' }} className="p-4 text-[9px] text-zinc-500 font-bold uppercase italic text-center">
                      Media Unavailable
                    </div>
                    
                    {msg.isOptimistic && (
                      <div className="absolute inset-0 bg-white/20 flex items-center justify-center backdrop-blur-sm">
                        <Loader2 className="animate-spin text-black" size={24} />
                      </div>
                    )}
                  </div>
                )}
                
                <span className={`text-[7px] block mt-2 font-black uppercase ${isMe ? "text-black/40" : "text-white/40"}`}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* 🖼️ LIVE PREVIEW BUBBLE */}
      <AnimatePresence>
        {file && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-36 left-4 right-4 bg-zinc-900 p-3 rounded-2xl border border-yellow-500/50 flex items-center gap-4 shadow-2xl z-30 backdrop-blur-lg">
            
            <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-black border border-white/10 shrink-0 flex items-center justify-center">
              {isPreviewVideo ? (
                <>
                  <video src={URL.createObjectURL(file)} className="w-full h-full object-cover opacity-60" />
                  <Film size={16} className="absolute text-white" />
                </>
              ) : (
                <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" alt="preview" />
              )}
              <button onClick={() => setFile(null)} className="absolute -top-1 -right-1 bg-red-600 text-white p-1 rounded-full shadow-lg"><X size={12} /></button>
            </div>

            <div className="flex-1 overflow-hidden">
              <p className="text-[9px] font-black uppercase text-yellow-500 italic tracking-widest truncate">Transmission Ready</p>
              <p className="text-[8px] text-zinc-400 font-bold uppercase truncate">{file.name}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TRANSMISSION INPUT */}
      <div className="absolute bottom-16 left-0 right-0 p-4 bg-black/80 backdrop-blur-xl border-t border-white/5 z-20">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2 bg-zinc-900 rounded-[1.5rem] p-2 pl-4 border border-white/5 shadow-2xl">
          <input type="text" value={formData.content} onChange={(e) => setFormData({ content: e.target.value })}
            placeholder="Yenuvia Transmission..." className="bg-transparent text-[11px] font-bold flex-1 outline-none border-none placeholder:text-zinc-600" />
          
          <input 
            type="file" 
            id="artistFile" 
            hidden 
            accept="image/*,video/*"
            onChange={(e) => {
              setFile(e.target.files[0]);
              e.target.value = null; 
            }} 
          />
          <label htmlFor="artistFile" className={`cursor-pointer transition-colors ${file ? 'text-yellow-500' : 'text-zinc-500 hover:text-white'}`}>
            <Paperclip size={18} />
          </label>
          <button type="submit" disabled={loading} className="bg-white text-black p-3 rounded-2xl active:scale-95 transition-all flex items-center justify-center min-w-[45px] disabled:opacity-50">
            {loading ? <Loader2 size={16} className="animate-spin text-black" /> : <Send size={16} />}
          </button>
        </form>
      </div>
      <BottomNav />
    </div>
  );
};

export default Inbox;