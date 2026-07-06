import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { 
  CLEAR_MESSAGE_COUNT, 
  INCREMENT_MESSAGE_COUNT, 
  SET_UNREAD_BY_USER 
} from "../redux/user/adminNotificationsSlice"; 
import { Send, Paperclip, MessageSquare, X, Film } from "lucide-react"; 
import BottomNav from "../Component.jsx/BottomNav";
import { useSocket } from "../context/SocketContext";
import customFetch from "../utility/customFetch";

const Inbox = () => {
  // 🔥 BRINGING THIS BACK: We need the ID for sockets and chat bubbles, just not the token!
  const { currentUser } = useSelector((state) => state.user)|| {}; 
  const { unreadMap } = useSelector((state) => state.adminNotifications);
  const dispatch = useDispatch();
  
  const [messages, setMessages] = useState([]);
  const [recipients, setRecipients] = useState([]);
  const [formData, setFormData] = useState({ content: "" });
  const [file, setFile] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRecipient, setSelectedRecipient] = useState(null);

  const socket = useSocket();
  const chatEndRef = useRef(null);
  
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000"; 

  // 🔊 Audio Alert
  const playAlert = useCallback(() => {
    new Audio("https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3").play().catch(() => {});
  }, []);

  // 📜 Auto-Scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedRecipient]);

  // =======================================================================
  // 🛡️ 1. THE IRON-CLAD CONNECTION 
  // =======================================================================
  useEffect(() => {
    if (!socket || !currentUser?._id) return;

    const joinCommsRoom = () => {
      socket.emit("join", currentUser._id);
    };

    if (socket.connected) {
      joinCommsRoom();
    }

    socket.on("connect", joinCommsRoom);

    return () => {
      socket.off("connect", joinCommsRoom);
    };
  }, [socket, currentUser?._id]);


  // =======================================================================
  // 🛡️ 2. THE UPGRADED BULLETPROOF RECEIVER (WITH LIST BUMPING)
  // =======================================================================
  const activeIdRef = useRef(selectedRecipient?._id);
  const unreadMapRef = useRef(unreadMap);

  useEffect(() => { activeIdRef.current = selectedRecipient?._id; }, [selectedRecipient]);
  useEffect(() => { unreadMapRef.current = unreadMap; }, [unreadMap]);

  // 🔥 REMOVED THE TOKENS AND HEADERS HERE
  const fetchData = useCallback(async () => {
    try {
      const [rRes, mRes] = await Promise.all([
        customFetch("/api/messages/recipients"),
        customFetch("/api/messages")
      ]);
      const rData = await rRes.json();
      const mData = await mRes.json();
      
      if (rData.success) setRecipients(rData.users);
      if (mData.success) {
        const sorted = mData.messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        setMessages(sorted);
      }
    } catch (err) {
      console.error("Arena Link Offline");
    }
  }, []); // 🔥 Removed currentUser.token from dependency array

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (!socket || !currentUser?._id) return;

    const handleReceiveMessage = (message) => {
      console.log("🚨 [INCOMING MESSAGE CAUGHT BY ADMIN]:", message);

      const sId = String(message.sender?._id || message.sender);
      const myId = String(currentUser._id);
      const activeId = activeIdRef.current ? String(activeIdRef.current) : null;

      // 1. Add to conversation history
      setMessages((prev) => {
        if (prev.some(m => m._id === message._id)) return prev;
        return [...prev, message];
      });

      // 2. 🔥 THE FIX: AGGRESSIVELY BUMP SENDER TO THE TOP OF THE SIDEBAR
      if (sId !== myId) {
        setRecipients((prev) => {
          const filteredList = prev.filter(r => String(r._id) !== sId);
          const existingUser = prev.find(r => String(r._id) === sId);
          const userToTop = existingUser || message.sender;
          return [userToTop, ...filteredList];
        });
      }
      
      // 3. Trigger Badges & Sounds
      if (sId !== myId && sId !== activeId) {
        playAlert();
        dispatch(INCREMENT_MESSAGE_COUNT());
        
        const currentCount = unreadMapRef.current[sId] || 0;
        dispatch(SET_UNREAD_BY_USER({ 
          senderId: sId, 
          count: currentCount + 1 
        }));
      }
    };

    const handleAdminPager = (alertData) => {
      console.log("🚨 [ADMIN PAGER TRIGGERED]:", alertData);
      fetchData();
    };

    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("new_admin_message", handleAdminPager);
    
    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("new_admin_message", handleAdminPager);
    };
  }, [socket, currentUser?._id, dispatch, playAlert, fetchData]); 

  // =======================================================================

  // 📨 TRANSMIT
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!formData.content.trim() && !file) return;

    const contentToSubmit = formData.content;
    const fileToSubmit = file;
    
    setFormData({ content: "" });
    setFile(null);

    try {
      const fd = new FormData();
      fd.append("recipient", selectedRecipient._id);
      fd.append("content", contentToSubmit);
      if (fileToSubmit) fd.append("media", fileToSubmit);

      // 🔥 customFetch handles the auth invisibly now
      const res = await customFetch("/api/messages", {
        method: "POST",
        body: fd,
      });

      const data = await res.json();
      if (data.success) {
        setMessages((prev) => {
          if (prev.some(m => m._id === data.message._id)) return prev;
          return [...prev, data.message];
        });
      }
    } catch (err) {
      console.error("Signal Lost");
    }
  };

  const activeConversation = useMemo(() => {
    if (!selectedRecipient || !currentUser?._id) return [];
    const selId = String(selectedRecipient._id);
    const curId = String(currentUser._id);
    return messages.filter(m => {
      const sId = String(m.sender?._id || m.sender);
      const rId = String(m.recipient?._id || m.recipient);
      return (sId === selId && rId === curId) || (sId === curId && rId === selId);
    });
  }, [messages, selectedRecipient, currentUser?._id]);

  const sortedRecipients = useMemo(() => {
    return recipients.filter(r => r.username.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [recipients, searchTerm]);

  const isPreviewVideo = file && (file.type.includes('video') || file.name.match(/\.(mp4|webm|ogg|mov)$/i));

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-white overflow-hidden pb-32"> 
      
      {/* SIDEBAR */}
      <div className="flex w-64 md:w-80 border-r border-white/5 flex-col bg-[#0d0d0d]">
        <div className="p-6">
          <h1 className="text-2xl font-black italic uppercase tracking-tighter text-yellow-500 mb-4">Comms</h1>
          <input 
            type="text" 
            placeholder="Search Artists..." 
            className="w-full bg-black border border-white/5 rounded-2xl p-3 text-[10px] outline-none focus:border-yellow-500 transition-all font-bold uppercase tracking-widest"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto px-4 space-y-2 scrollbar-hide">
          {sortedRecipients.map(r => {
            const rId = String(r._id);
            const isSel = selectedRecipient && String(selectedRecipient._id) === rId;
            const count = unreadMap[rId] || 0;
            return (
              <button 
                key={rId} 
                onClick={() => {
                  setSelectedRecipient(r);
                  dispatch(SET_UNREAD_BY_USER({ senderId: rId, count: 0 })); 
                  dispatch(CLEAR_MESSAGE_COUNT()); 
                }} 
                className={`w-full flex items-center gap-4 p-4 rounded-[1.8rem] transition-all relative ${isSel ? "bg-yellow-500 text-black shadow-lg shadow-yellow-500/10" : "hover:bg-white/5"}`}
              >
                <div className="relative flex-shrink-0">
                  <img 
                    src={r.avatar || "/default-avatar.png"} 
                    className="w-12 h-12 aspect-square rounded-full border-2 border-white/10 object-cover bg-neutral-900" 
                    alt="avatar"
                    loading="lazy" 
                  />
                  {count > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-black animate-bounce text-white">
                      {count}
                    </span>
                  )}
                </div>
                <div className="text-left truncate">
                  <p className="font-black text-xs uppercase italic truncate leading-none">@{r.username}</p>
                  <p className={`text-[8px] font-black tracking-[0.2em] uppercase mt-1 ${isSel ? "text-black/60" : "text-yellow-500/50"}`}>
                    {r.role || 'Artist'}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* CHAT WINDOW */}
      <div className="flex-1 flex flex-col relative bg-black">
        {selectedRecipient ? (
          <>
            {/* Header */}
            <div className="p-6 border-b border-white/5 text-yellow-500 font-black italic uppercase tracking-widest bg-black/50 backdrop-blur-xl">
              @{selectedRecipient.username}
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-8 space-y-4 scrollbar-hide">
              {activeConversation.map((msg, i) => {
                const isMe = String(msg.sender?._id || msg.sender) === String(currentUser?._id);
                
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
                  <div key={msg._id || i} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] p-4 rounded-[1.5rem] text-[11px] font-bold shadow-lg ${
                      isMe ? "bg-yellow-500 text-black rounded-tr-none" : "bg-white/5 text-white rounded-tl-none border border-white/5"
                    }`}>
                      {msg.content}
                      
                      {mediaSrc && (
                        <div className="mt-2 rounded-lg overflow-hidden border border-black/10 bg-black/20 flex items-center justify-center relative min-h-[50px]">
                          {msg.mediaType === "video" ? (
                            <video 
                              src={mediaSrc} 
                              controls 
                              playsInline 
                              preload="metadata"
                              webkit-playsinline="true"
                              className="w-full max-h-[300px] bg-black" 
                              onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
                            />
                          ) : (
                            <img 
                              src={mediaSrc} 
                              className="w-full max-h-[300px] object-cover" 
                              alt="transmission-data" 
                              onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
                            />
                          )}
                          
                          <div style={{ display: 'none' }} className={`p-4 text-[9px] font-bold uppercase italic text-center ${isMe ? 'text-black/60' : 'text-white/40'}`}>
                            Media Unavailable
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            {/* Live Preview Bubble */}
            {file && (
              <div className="absolute bottom-28 left-8 right-8 bg-zinc-900 p-3 rounded-2xl border border-yellow-500/50 flex items-center gap-4 shadow-2xl z-30 backdrop-blur-lg w-max max-w-sm">
                <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-black border border-white/10 shrink-0 flex items-center justify-center">
                  {isPreviewVideo ? (
                    <>
                      <video src={URL.createObjectURL(file)} className="w-full h-full object-cover opacity-60" />
                      <Film size={14} className="absolute text-white" />
                    </>
                  ) : (
                    <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" alt="preview" />
                  )}
                  <button onClick={() => setFile(null)} className="absolute -top-1 -right-1 bg-red-600 text-white p-1 rounded-full shadow-lg"><X size={10} /></button>
                </div>
                <div className="flex-1 overflow-hidden pr-4">
                  <p className="text-[9px] font-black uppercase text-yellow-500 italic tracking-widest truncate">Ready</p>
                  <p className="text-[8px] text-zinc-400 font-bold uppercase truncate">{file.name}</p>
                </div>
              </div>
            )}

            {/* Transmission Form */}
            <form onSubmit={handleSendMessage} className="p-8 bg-black border-t border-white/5 relative z-20">
              <div className="max-w-3xl mx-auto flex items-center gap-4 bg-white/5 border border-white/5 rounded-[2rem] p-3 pl-8 focus-within:border-yellow-500/50 transition-all">
                <input 
                  type="text" 
                  value={formData.content} 
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })} 
                  placeholder="Draft transmission..." 
                  className="flex-1 bg-transparent border-none outline-none text-xs font-bold" 
                />
                
                <input 
                  type="file" 
                  id="msgFile" 
                  hidden 
                  accept="image/*,video/*"
                  onChange={(e) => {
                    setFile(e.target.files[0]);
                    e.target.value = null; 
                  }} 
                />
                <label htmlFor="msgFile" className={`p-3 rounded-full cursor-pointer transition-all ${file ? 'text-yellow-500' : 'text-gray-500 hover:text-white'}`}>
                  <Paperclip size={20} />
                </label>

                <button type="submit" className="bg-yellow-500 text-black p-4 rounded-full hover:scale-110 active:scale-95 transition-all shadow-lg shadow-yellow-500/20">
                  <Send size={20} />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center opacity-10">
            <MessageSquare size={40} />
            <h2 className="text-xl font-black italic uppercase tracking-tighter mt-4">Select Connection</h2>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
};

export default Inbox;