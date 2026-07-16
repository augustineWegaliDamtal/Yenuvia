import mongoose from "mongoose";

const WorkSchema = new mongoose.Schema(
  {
    title: { 
      type: String, 
      trim: true,
      default: "Untitled Submission" // 👈 Fallback prevents crash if missing
    },
    description: { type: String, trim: true, default: "" },
    
    // 🖼️ MULTI-FILE SUPPORT (Handles arrays or single string inputs dynamically)
    mediaUrls: {
      type: [String],
      set: (val) => (Array.isArray(val) ? val : val ? [val] : []), // 👈 Autoconverts single string to array
      default: []
    },
    
    type: { 
      type: String, 
      enum: ["image", "video", "carousel"], 
      default: "video" 
    },

    category: {
      type: String,
      default: "school", // 👈 Default prevents validation crash
    },
    
    school: { 
      type: String, 
      trim: true,
      index: true, 
      set: function(val) {
        if (!val) return val;
        const cleaned = val.trim();
        const upperCheck = cleaned.toUpperCase();
        if (["KNUST", "UG", "UCC", "UEW", "UDS", "UMAT", "UPSA", "UHAS", "PRESEC"].includes(upperCheck)) {
          return upperCheck;
        }
        return cleaned;
      }
    },

    isForSale: { type: Boolean, default: false, index: true },
    price: { type: Number, default: 0 },
    isSold: { type: Boolean, default: false },
    condition: { type: String, default: "Original" },

    // 🏆 THE DERBY ENGINE (Dynamic Link)
    matchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Match",
      default: null,
      index: true,
      alias: "match" // 👈 MAGIC FIX: Frontend can send 'match' OR 'matchId'!
    },

    // 🛡️ MODERATION STATUS
    status: {
      type: String,
      default: "pending",
      index: true 
    },

    // 👤 IDENTITY
    artistName: { 
      type: String, 
      trim: true, 
      default: "Anonymous Creator" // 👈 Fallback guarantees payload success
    },
    artistId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    // 🔮 FUTURE-PROOFING: Flexible Bucket for any custom data
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },

    // Metrics & Audit
    likes: { type: Number, default: 0 },
    likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    shares: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    commentsList: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
      }
    ],
    moderatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    moderatedAt: { type: Date },
    rejectionReason: { type: String },
    billboardEligible: { type: Boolean, default: false },
    feedEligible: { type: Boolean, default: true },
    challengeTopic: { type: String, default: null },
    trendingScore: { type: Number, default: 0 },
    lastScoredAt: { type: Date, default: Date.now },
  },
  { 
    timestamps: true,
    strict: false // 👈 FUTURE-PROOF: Accepts any new unexpected fields without throwing errors
  }
);

// --- ⚡ PERFORMANCE INDEXES ---
WorkSchema.index({ category: 1, status: 1, createdAt: -1 }); 
WorkSchema.index({ status: 1, createdAt: -1 }); 

export default mongoose.model("Work", WorkSchema);