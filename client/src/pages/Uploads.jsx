import React, { useState, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Plus, Sparkles, CloudUpload, Loader2, School, UserCircle, AlertTriangle, ShoppingBag, Banknote, Swords } from "lucide-react";
import { SET_LIVE_ALERT } from "../redux/users/notificationsSlice";

// 🔥 1. IMPORT THE HOOK FROM YOUR NEW CONTEXT
import { useUpload } from "../context/UploadContext";

// 🔥 EXPANDED GHANA SCHOOLS DATABASE
const GHANA_SCHOOLS = [
  // Universities
  "University of Ghana (UG)", "KNUST", "University of Cape Coast (UCC)",
  "Ashesi University", "Academic City University", "University of Education, Winneba (UEW)",
  "University for Development Studies (UDS)", "University of Mines and Technology (UMaT)",
  "UPSA", "Valley View University", "Central University", "UHAS",
  
  // High Schools (SHS)
  "Prempeh College", "Achimota School", "PRESEC Legon", "Wesley Girls' High School",
  "Mfantsipim School", "Opoku Ware School", "St. Augustine's College", "Adisadel College",
  "Holy Child School", "Aburi Girls' Senior High School", "Accra Academy",
  "Pope John Senior High", "Keta Senior High Technical School (Ketasco)", 
  "St. Peter's Boys", "Yaa Asantewaa Girls"
];

// --- 🏆 DERBY SELECTOR COMPONENT ---
const DerbySubmissionSelector = ({ selectedMatchId, setSelectedMatchId }) => {
  const [activeDirectives, setActiveDirectives] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDirectives = async () => {
      try {
        const res = await fetch("/api/matches?status=UPCOMING,LIVE");
        const data = await res.json();
        if (data.success) setActiveDirectives(data.matches || []);
      } catch (error) {
        console.error("Failed to load directives", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDirectives();
  }, []);

  if (loading) return <div className="flex items-center gap-2 text-yellow-500 text-[10px] uppercase font-black tracking-widest"><Loader2 size={14} className="animate-spin" /> Checking active directives...</div>;
  if (activeDirectives.length === 0) return null; 

  return (
    <div className="mt-8 mb-6 bg-zinc-900/50 border border-yellow-500/20 rounded-3xl p-5 shadow-inner">
      <div className="flex items-start gap-3 mb-4">
        <div className="bg-yellow-500/10 p-2.5 rounded-xl shrink-0 border border-yellow-500/20">
          <Swords size={20} className="text-yellow-500" />
        </div>
        <div>
          <h3 className="text-white text-xs font-black uppercase tracking-widest">National Derby Draft</h3>
          <p className="text-gray-400 text-[9px] font-bold uppercase tracking-wider mt-1.5 leading-relaxed">
            Is this pitch solving an active national challenge? Select the directive below to enter the live draft.
          </p>
        </div>
      </div>
      <select
        value={selectedMatchId || ""}
        onChange={(e) => setSelectedMatchId(e.target.value)}
        className="w-full bg-black border border-white/10 rounded-2xl p-4 text-white text-[11px] font-black uppercase tracking-widest outline-none focus:border-yellow-500 appearance-none cursor-pointer"
      >
        <option value="" className="text-gray-500">NO, THIS IS A STANDARD PORTFOLIO DROP</option>
        {activeDirectives.map((match) => (
          <option key={match._id} value={match._id} className="text-yellow-500">
            🔥 {match.league} LEAGUE: {match.directive}
          </option>
        ))}
      </select>
    </div>
  );
};


const Upload = () => {
  const { currentUserArtist } = useSelector((state) => state.artist || {});
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // 🔥 2. GRAB THE START FUNCTION FROM THE CONTEXT
  const { startBackgroundUpload, isUploading } = useUpload();

  // We now store ACTUAL files and LOCAL PREVIEW urls separately
  const [localFiles, setLocalFiles] = useState([]); 
  const [previews, setPreviews] = useState([]); 
  const [error, setError] = useState("");
  const [selectedMatchId, setSelectedMatchId] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "school", 
    school: currentUserArtist?.school || "", 
    customSchool: "",
    isForSale: false,
    price: 0,
    condition: "Original"
  });

  const fileRef = useRef();

  // Clean up object URLs to prevent memory leaks
  useEffect(() => {
    return () => previews.forEach(p => URL.revokeObjectURL(p.url));
  }, [previews]);

  // 🔥 3. INSTANT LOCAL PREVIEW
  const handleFileSelect = (filesArray) => {
    if (filesArray.length === 0) return;

    const validFiles = [];
    const newPreviews = [];

    for (let file of filesArray) {
      const fileSizeInMB = file.size / (1024 * 1024);
      const isVideo = file.type.includes('video') || file.name.match(/\.(mp4|webm|ogg|mov)$/i);
      const isImage = file.type.includes('image') || file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i);

      if (isVideo && fileSizeInMB > 100) {
        dispatch(SET_LIVE_ALERT({ type: 'error', title: 'File Too Large', message: 'Arena videos must be under 200MB.' }));
        continue;
      }
      if (isImage && fileSizeInMB > 5) {
        dispatch(SET_LIVE_ALERT({ type: 'error', title: 'Image Too Heavy', message: 'Please use a smaller image (under 5MB).' }));
        continue;
      }

      validFiles.push(file);
      newPreviews.push({
        url: URL.createObjectURL(file),
        type: isVideo ? "video" : "image"
      });
    }

    setLocalFiles(prev => [...prev, ...validFiles]);
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  const removeFile = (indexToRemove) => {
    setLocalFiles(prev => prev.filter((_, i) => i !== indexToRemove));
    setPreviews(prev => prev.filter((_, i) => {
      if (i === indexToRemove) URL.revokeObjectURL(prev[i].url);
      return i !== indexToRemove;
    }));
  };

  // 🔥 4. INSTANT HANDOFF WITH CLEAN DATA
  const handleSubmit = (e) => {
    e.preventDefault();
    if (isUploading) return setError("An upload is already in progress!");
    if (localFiles.length === 0) return setError("The Arena needs visuals!");
    
    let finalSchoolName = formData.school;
    
    if (formData.category === "school") {
        if (!formData.school.trim()) return setError("Please select your school!");
        
        // Handle custom school formatting
        if (formData.school === "Other (Not Listed)") {
            if (!formData.customSchool.trim()) return setError("Please type your school name.");
            
            // Format to Title Case (e.g. "accra academy" -> "Accra Academy")
            finalSchoolName = formData.customSchool
              .trim()
              .toLowerCase()
              .replace(/\b\w/g, char => char.toUpperCase());
        }
    }

    if (formData.isForSale && (formData.price <= 0)) {
        return setError("Please set a valid price for your masterpiece.");
    }

    setError("");

    // Strip out the 'customSchool' helper field before sending to the backend
    const { customSchool, ...cleanFormData } = formData;
    
    // Hand the files to the Background Engine with the sanitized school name
    startBackgroundUpload(localFiles, { ...cleanFormData, school: finalSchoolName }, selectedMatchId);

    // KICK THEM IMMEDIATELY TO THE FEED!
    navigate("/home"); 
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 pb-40">
      <div className="max-w-xl mx-auto">
        <header className="text-center mb-8 pt-4">
          <h1 className="text-5xl font-black italic uppercase tracking-tighter">New <span className="text-yellow-500">Drop</span></h1>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative bg-white/5 border-2 border-dashed border-white/10 rounded-[2.5rem] p-6 flex flex-col items-center justify-center min-h-[180px]">
            {previews.length > 0 ? (
              <div className="grid grid-cols-3 gap-3 w-full">
                {previews.map((m, i) => (
                  <div key={i} className="relative aspect-square bg-black rounded-2xl">
                    {m.type === "video" ? (
                      <video src={m.url} autoPlay muted loop playsInline className="w-full h-full rounded-2xl object-cover" />
                    ) : (
                      <img src={m.url} className="w-full h-full rounded-2xl object-cover" alt="Preview" />
                    )}
                    <button type="button" onClick={() => removeFile(i)} className="absolute -top-2 -right-2 bg-red-500 p-1.5 rounded-full z-10 hover:scale-110 active:scale-90 transition-transform shadow-lg">
                      <Trash2 size={14} className="text-white"/>
                    </button>
                  </div>
                ))}
                <button type="button" onClick={() => fileRef.current.click()} className="bg-white/10 rounded-2xl flex items-center justify-center border-2 border-dashed border-white/5 hover:bg-white/20 transition-colors aspect-square">
                  <Plus size={28} className="text-white/50" />
                </button>
              </div>
            ) : (
              <div className="text-center">
                <CloudUpload size={48} className="mx-auto mb-4 text-zinc-700" />
                <button type="button" onClick={() => fileRef.current.click()} className="bg-white text-black px-8 py-3 rounded-full font-black uppercase text-xs hover:bg-yellow-500 transition-colors">Pick Assets</button>
                <p className="text-[8px] text-zinc-500 uppercase mt-4 font-bold tracking-[0.2em]">Max 200MB per Video</p>
              </div>
            )}
          </div>
          
          <input 
            type="file" 
            multiple 
            hidden 
            ref={fileRef} 
            accept="image/*,video/*"
            onChange={(e) => {
              handleFileSelect(Array.from(e.target.files));
              e.target.value = null; 
            }} 
          />

          <div className="grid grid-cols-2 gap-4">
            <button type="button" onClick={() => setFormData({...formData, category: "school"})} className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${formData.category === "school" ? "border-yellow-500 bg-yellow-500/10 shadow-[0_0_15px_rgba(234,179,8,0.1)]" : "border-white/5 bg-white/5 opacity-50 hover:opacity-100"}`}>
              <School size={20} className={formData.category === "school" ? "text-yellow-500" : "text-white"} /> 
              <span className={`text-[10px] font-black uppercase tracking-widest ${formData.category === "school" ? "text-yellow-500" : "text-white"}`}>School Entry</span>
            </button>
            <button type="button" onClick={() => setFormData({...formData, category: "professional", school: "", customSchool: ""})} className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${formData.category === "professional" ? "border-yellow-500 bg-yellow-500/10 shadow-[0_0_15px_rgba(234,179,8,0.1)]" : "border-white/5 bg-white/5 opacity-50 hover:opacity-100"}`}>
              <UserCircle size={20} className={formData.category === "professional" ? "text-yellow-500" : "text-white"} /> 
              <span className={`text-[10px] font-black uppercase tracking-widest ${formData.category === "professional" ? "text-yellow-500" : "text-white"}`}>Professional</span>
            </button>
          </div>

          <div className="space-y-4">
            <input type="text" placeholder="TITLE" className="w-full bg-white/5 p-6 rounded-[1.5rem] border border-white/5 outline-none focus:border-yellow-500 font-black uppercase text-xl transition-colors" onChange={(e) => setFormData({...formData, title: e.target.value})} required />

            <AnimatePresence>
              {formData.category === "school" && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <select required value={formData.school} onChange={(e) => setFormData({...formData, school: e.target.value})} className="w-full bg-white/10 p-5 rounded-[1.2rem] border border-yellow-500/30 outline-none font-bold text-yellow-500 appearance-none cursor-pointer">
                      <option value="" disabled className="bg-zinc-900 text-gray-400">SELECT YOUR SCHOOL...</option>
                      <optgroup label="Universities">
                        {GHANA_SCHOOLS.filter(s => s.includes('University') || s.includes('KNUST') || s.includes('UCC') || s.includes('UEW') || s.includes('UDS') || s.includes('UMaT') || s.includes('UPSA') || s.includes('UHAS')).map(school => <option key={school} value={school} className="bg-zinc-900 text-white">{school}</option>)}
                      </optgroup>
                      <optgroup label="High Schools (SHS)">
                        {GHANA_SCHOOLS.filter(s => !s.includes('University') && !s.includes('KNUST') && !s.includes('UCC') && !s.includes('UEW') && !s.includes('UDS') && !s.includes('UMaT') && !s.includes('UPSA') && !s.includes('UHAS')).map(school => <option key={school} value={school} className="bg-zinc-900 text-white">{school}</option>)}
                      </optgroup>
                      <option value="Other (Not Listed)" className="bg-zinc-900 text-yellow-500 font-black">OTHER (TYPE MANUALLY)</option>
                    </select>

                    {formData.school === "Other (Not Listed)" && (
                      <motion.input initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} type="text" placeholder="TYPE YOUR SCHOOL NAME..." className="w-full bg-white/5 p-5 mt-4 rounded-[1.2rem] border border-white/10 outline-none focus:border-yellow-500 font-bold uppercase text-white transition-colors placeholder:text-zinc-600" onChange={(e) => setFormData({...formData, customSchool: e.target.value})} required />
                    )}
                  </motion.div>
              )}
            </AnimatePresence>

            <div className="bg-zinc-900/50 p-6 rounded-[2rem] border border-white/5 shadow-inner">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <ShoppingBag size={20} className={formData.isForSale ? "text-yellow-500" : "text-zinc-600"} />
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest">List in Showroom</p>
                            <p className="text-[8px] text-zinc-500 uppercase font-bold">Sell this physical masterpiece</p>
                        </div>
                    </div>
                    <button type="button" onClick={() => setFormData({...formData, isForSale: !formData.isForSale})} className={`w-12 h-6 rounded-full transition-all relative ${formData.isForSale ? 'bg-yellow-500' : 'bg-zinc-700'}`}>
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-md ${formData.isForSale ? 'left-7' : 'left-1'}`} />
                    </button>
                </div>

                <AnimatePresence>
                    {formData.isForSale && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-6 space-y-4 pt-6 border-t border-white/5 overflow-hidden">
                            <div className="flex items-center gap-4 bg-black p-4 rounded-2xl border border-yellow-500/20">
                                <Banknote className="text-yellow-500" size={24} />
                                <div className="flex-1">
                                    <label className="text-[8px] font-black text-zinc-500 uppercase">Asking Price (GHS)</label>
                                    <input type="number" min="1" placeholder="0.00" className="w-full bg-transparent outline-none text-xl font-black text-white placeholder:text-zinc-700" onChange={(e) => setFormData({...formData, price: Number(e.target.value)})} />
                                </div>
                            </div>
                            <select className="w-full bg-black p-4 rounded-xl border border-white/5 text-[10px] font-black uppercase tracking-widest outline-none text-white cursor-pointer" onChange={(e) => setFormData({...formData, condition: e.target.value})}>
                                <option value="Original">Original Work</option>
                                <option value="Print">High Quality Print</option>
                                <option value="Digital">Digital License</option>
                            </select>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <textarea placeholder="THE STORY BEHIND THIS ART..." className="w-full bg-white/5 p-6 rounded-[1.5rem] border border-white/5 min-h-[120px] resize-none outline-none focus:border-yellow-500 transition-colors placeholder:font-bold placeholder:text-zinc-600 text-sm" onChange={(e) => setFormData({...formData, description: e.target.value})} required />
          </div>

          <DerbySubmissionSelector selectedMatchId={selectedMatchId} setSelectedMatchId={setSelectedMatchId} />

          {error && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3">
              <AlertTriangle className="text-red-500 shrink-0" size={16} />
              <p className="text-red-500 font-bold text-[10px] uppercase leading-tight">{error}</p>
            </motion.div>
          )}

          <button 
            type="submit" 
            disabled={isUploading} 
            className="w-full bg-yellow-500 text-black p-6 rounded-[2rem] font-black uppercase tracking-[0.3em] shadow-[0_0_20px_rgba(234,179,8,0.3)] disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-3 transition-all active:scale-95 hover:bg-yellow-400"
          >
            {isUploading ? (
              <><Loader2 className="animate-spin" size={20} /> Uploading in background...</>
            ) : (
              <><Sparkles size={20}/> {selectedMatchId ? "Submit Draft" : "Deploy Masterpiece"}</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Upload;