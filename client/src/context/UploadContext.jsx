// src/context/UploadContext.jsx
import React, { createContext, useContext, useState } from "react";
import { useDispatch } from "react-redux";
import { SET_LIVE_ALERT } from "../redux/users/notificationsSlice";
import { motion, AnimatePresence } from "framer-motion";
import { CloudUpload } from "lucide-react";
import customFetch from "../util/customFetch";

const UploadContext = createContext();

export const useUpload = () => useContext(UploadContext);

export const UploadProvider = ({ children }) => {
  const dispatch = useDispatch();
  const [uploadState, setUploadState] = useState({
    isUploading: false,
    progress: 0,
    title: "",
  });

  const startBackgroundUpload = async (filesArray, formData, selectedMatchId) => {
    // 1. Trigger the floating UI to appear globally
    setUploadState({ isUploading: true, progress: 0, title: formData.title });
    const promises = [];

    filesArray.forEach((file) => {
      promises.push(
        new Promise(async (resolve, reject) => {
          try {
            const isVideo = file.type.includes('video') || file.name.match(/\.(mp4|webm|ogg|mov)$/i);
            const resourceType = isVideo ? "video" : "image";
            
            // 🛠️ THE FIX: Dynamically pull your new active account from the frontend .env
            const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
            const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
            
            const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`;

            // 🔥 THE CHUNKING MAGIC: Slice massive videos into 20MB bursts
            const CHUNK_SIZE = 20 * 1024 * 1024; // 20MB
            const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
            const uniqueUploadId = `arena_${Date.now()}_${Math.random().toString(36).substring(2)}`;
            
            let lastResponse = null;

            // Loop through the file and upload chunk by chunk
            for (let i = 0; i < totalChunks; i++) {
              const start = i * CHUNK_SIZE;
              const end = Math.min(start + CHUNK_SIZE, file.size);
              const chunk = file.slice(start, end);

              const uploadData = new FormData();
              uploadData.append("file", chunk);
              
              // 🛠️ THE FIX: Apply the dynamic variables here
              uploadData.append("upload_preset", UPLOAD_PRESET);
              uploadData.append("cloud_name", CLOUD_NAME);

              const headers = {
                "X-Unique-Upload-Id": uniqueUploadId,
                "Content-Range": `bytes ${start}-${end - 1}/${file.size}`,
              };

              // Fetch is more stable for mobile chunking than XMLHttpRequest
              const res = await fetch(cloudinaryUrl, {
                method: "POST",
                headers: headers,
                body: uploadData,
              });

              if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error?.message || "Chunk upload failed");
              }

              lastResponse = await res.json();

              // Smoothly update the global yellow progress bar
              const currentProgress = Math.round((end / file.size) * 100);
              setUploadState(prev => ({ ...prev, progress: currentProgress }));
            }

            // Optimize the final URL 
            const optimizedUrl = lastResponse.secure_url.replace("/upload/", "/upload/q_auto/");
            resolve({ mediaUrl: optimizedUrl, type: resourceType });

          } catch (error) {
            reject(error);
          }
        })
      );
    });

    try {
      // Wait for all Cloudinary chunks to finish
      const uploadedMedia = await Promise.all(promises);

      // 2. Automatically hit your backend to save it to MongoDB
      const res = await customFetch("/api/work/create-multiple", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          mediaFiles: uploadedMedia,
          matchId: selectedMatchId || null
        }),
      });

      const data = await res.json();
      if (data.success) {
        dispatch(SET_LIVE_ALERT({ 
          type: "success", 
          title: "Deployed!", 
          message: `${formData.title} is now in the Yenuvia Arena.` 
        }));
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      console.error("Background Upload Failed:", err);
      dispatch(SET_LIVE_ALERT({ 
        type: "error", 
        title: "Upload Failed", 
        message: "Your masterpiece failed to sync. Ensure a stable connection." 
      }));
    } finally {
      // 3. Hide the floating UI
      setUploadState({ isUploading: false, progress: 0, title: "" });
    }
  };

  return (
    <UploadContext.Provider value={{ startBackgroundUpload, isUploading: uploadState.isUploading }}>
      {children}
      
      {/* 🚀 THE FLOATING BACKGROUND UPLOAD INDICATOR */}
      <AnimatePresence>
        {uploadState.isUploading && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 right-4 bg-zinc-900 border border-white/10 p-4 rounded-2xl shadow-2xl z-[9999] flex items-center gap-4 w-64"
          >
            <div className="bg-yellow-500/20 p-2 rounded-full shrink-0">
              <CloudUpload size={18} className="text-yellow-500 animate-pulse" />
            </div>
            <div className="flex-1 w-full">
              <p className="text-[10px] text-white font-black uppercase tracking-widest truncate">
                {uploadState.title || "Uploading..."}
              </p>
              <div className="w-full bg-white/10 h-1.5 rounded-full mt-2 overflow-hidden">
                <div 
                  className="bg-yellow-500 h-full transition-all duration-300 shadow-[0_0_10px_rgba(234,179,8,0.5)]" 
                  style={{ width: `${uploadState.progress}%` }} 
                />
              </div>
            </div>
            <p className="text-[9px] text-zinc-400 font-bold">{uploadState.progress}%</p>
          </motion.div>
        )}
      </AnimatePresence>
    </UploadContext.Provider>
  );
};