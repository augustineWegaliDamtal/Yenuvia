import React, { useState, useRef } from "react";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Trash2, Loader2, MessageCircle, AlertCircle, Reply } from "lucide-react";
import { Link } from "react-router-dom";
import customFetch from "../util/customFetch.js";

const CommentPanel = ({ post, onClose, onCommentUpdate }) => {
  const regularUser = useSelector((state) => state.user?.currentUser);
  const artistUser = useSelector((state) => state.artist?.currentUserArtist);
  const activeUser = regularUser || artistUser; 

  const [comments, setComments] = useState(post.commentsList || []);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 🚀 NEW: Ref to target the input field when replying
  const inputRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting || !activeUser) return;

    setIsSubmitting(true);
    try {
      const res = await customFetch(`/api/work/${post._id}/comment`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${activeUser.token}`,
        },
        body: JSON.stringify({ comment: newComment }),
      });

      const data = await res.json();
      if (data.success) {
        setComments(data.data.commentsList);
        setNewComment(""); 
        if (onCommentUpdate) onCommentUpdate(data.data.commentsList);
      }
    } catch (err) {
      console.error("Comment failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId) => {
    try {
      const res = await customFetch(`/api/work/${post._id}/comment/${commentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${activeUser?.token}` },
      });
      const data = await res.json();
      if (data.success) {
        setComments((prev) => {
          const newComments = prev.filter((c) => c._id !== commentId);
          if (onCommentUpdate) onCommentUpdate(newComments);
          return newComments;
        });
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  // 🚀 NEW: Handle clicking the Reply button
  const handleReplyClick = (username) => {
    setNewComment(`@${username} `);
    // Add a tiny delay to ensure React updates the state before focusing
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 50);
  };

  const stopPropagation = (e) => e.stopPropagation();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end justify-center"
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          onClick={stopPropagation}
          className="w-full max-w-md bg-zinc-950 border-t border-white/10 rounded-t-[2.5rem] shadow-[0_-20px_50px_rgba(0,0,0,0.8)] h-[80vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-white/5 bg-zinc-950 shrink-0">
            <h3 className="font-black italic text-white uppercase tracking-widest text-sm flex items-center gap-2">
              <MessageCircle size={16} className="text-yellow-500" />
              Comments <span className="text-gray-500 text-xs">({comments.length})</span>
            </h3>
            <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors">
              <X size={16} />
            </button>
          </div>

          {/* Scrollable Comments List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
            {comments.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                <MessageCircle size={40} className="text-gray-600 mb-4" />
                <p className="text-white text-sm font-bold uppercase tracking-widest">No comments yet</p>
                <p className="text-[10px] text-yellow-500 font-black uppercase mt-2">Be the first to spark the rivalry</p>
              </div>
            ) : (
              comments.map((comment, index) => {
                const commenter = comment.user || comment.userId || comment.author || {};
                const commenterId = commenter._id;
                const commenterName = commenter.username || "YenuviaGuest";
                const commenterAvatar = commenter.avatar || commenter.profilePicture || "/default-avatar.png";

                return (
                  <motion.div 
                    key={comment._id || index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex gap-4 group"
                  >
                    <Link to={commenterId ? `/profile/${commenterId}` : "#"} className="shrink-0">
                      <img 
                        src={commenterAvatar} 
                        alt="avatar" 
                        className="w-8 h-8 rounded-full object-cover border border-white/10 hover:border-yellow-500 transition-colors" 
                      />
                    </Link>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <Link to={commenterId ? `/profile/${commenterId}` : "#"}>
                          <span className="text-white font-bold text-xs hover:text-yellow-500 hover:underline transition-colors">
                            @{commenterName}
                          </span>
                        </Link>

                        {/* 🚀 NEW: Reply Action Bar */}
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {activeUser && (
                            <button 
                              onClick={() => handleReplyClick(commenterName)}
                              className="text-gray-500 hover:text-yellow-500 transition-colors flex items-center gap-1 text-[9px] font-bold uppercase"
                            >
                              <Reply size={10} /> Reply
                            </button>
                          )}

                          {activeUser && commenterId === activeUser._id && (
                            <button 
                              onClick={() => handleDelete(comment._id)} 
                              className="text-gray-600 hover:text-red-500 transition-colors ml-2"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {/* 🚀 NEW: Stylized Mentions in the text body */}
                      <p className="text-gray-300 text-sm mt-1 leading-snug">
                        {comment.text.split(' ').map((word, i) => 
                          word.startsWith('@') ? (
                            <span key={i} className="text-yellow-500 font-semibold">{word} </span>
                          ) : (
                            word + ' '
                          )
                        )}
                      </p>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 pb-6 mb-[env(safe-area-inset-bottom)] bg-zinc-950 border-t border-white/5 shrink-0">
            {activeUser ? (
              <form 
                onSubmit={handleSubmit} 
                className="flex items-center gap-2 bg-zinc-900 border border-white/10 rounded-full p-2 pl-4 shadow-xl"
              >
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Add to the rivalry..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="bg-transparent flex-1 text-white text-sm outline-none placeholder:text-gray-600 font-medium"
                />
                <button 
                  type="submit" 
                  disabled={isSubmitting || !newComment.trim()}
                  className="w-10 h-10 rounded-full bg-yellow-500 text-black flex items-center justify-center disabled:opacity-30 disabled:bg-white/10 disabled:text-white transition-colors shrink-0"
                >
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} className="ml-1" />}
                </button>
              </form>
            ) : (
              <div className="flex items-center justify-between bg-zinc-900/50 border border-white/5 rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <AlertCircle size={18} className="text-yellow-500" />
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Sign in to comment</p>
                </div>
                <Link 
                  to="/sign-in" 
                  onClick={onClose}
                  className="bg-white/10 hover:bg-yellow-500 hover:text-black text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors"
                >
                  Join Yenuvia
                </Link>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CommentPanel;