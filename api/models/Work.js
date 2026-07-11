import mongoose from "mongoose";

const WorkSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    
    // 🖼️ MULTI-FILE SUPPORT (Slide Bundles)
    mediaUrls: [{ type: String, required: true }], 
    type: { 
      type: String, 
      enum: ["image", "video", "carousel"], 
      default: "image" 
    },

    category: {
      type: String,
      enum: ["school", "professional"],
      required: true,
    },
    
    school: { 
      type: String, 
      trim: true,
      index: true, 
      required: function() { return this.category === "school"; },
      // 🔥 Automatically unifies strings to protect leaderboard integrity
      set: function(val) {
        if (!val) return val;
        const cleaned = val.trim();
        
        // If they typed a well-known abbreviation lowercase, force it uppercase
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
    condition: { 
      type: String, 
      enum: ["Original", "Print", "Digital"], 
      default: "Original" 
    },

    // 🏆 NEW: THE DERBY ENGINE
    matchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Match",
      default: null,
      index: true 
    },

    // 🛡️ MODERATION STATUS
    status: {
      type: String,
      enum: ["pending", "approved", "billboard", "rejected", "removed"],
      default: "pending",
      index: true 
    },

    // 📊 ENGAGEMENT METRICS
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

    // 👤 IDENTITY
    artistName: { type: String, required: true, trim: true },
    artistId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // ⚖️ ADMIN AUDIT LOG
    moderatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    moderatedAt: { type: Date },
    rejectionReason: { type: String },

    billboardEligible: { type: Boolean, default: false },
    feedEligible: { type: Boolean, default: true },

    // 🏆 TRENDING LOGIC
    challengeTopic: { type: String, default: null },
    trendingScore: { type: Number, default: 0 },
    lastScoredAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// --- ⚡ PERFORMANCE INDEXES ---
WorkSchema.index({ category: 1, status: 1, createdAt: -1 }); 
WorkSchema.index({ status: 1, createdAt: -1 }); 
WorkSchema.index({ trendingScore: -1 }); 
WorkSchema.index({ isForSale: 1, status: 1 }); 

// --- 🏆 AUTOMATIC SCHOOL POINT LOGIC ---
WorkSchema.post('save', async function(doc) {
    if (doc.category === 'school' && doc.school) {
        try {
            await mongoose.model("School").findOneAndUpdate(
              { name: doc.school.trim() }, 
              { 
                $inc: { totalPoints: 5 },
                $addToSet: { members: doc.artistId } 
              }, 
              { upsert: true }
            );
        } catch (err) {
            console.error("🏫 School point update failed:", err.message);
        }
    }
});

export default mongoose.model("Work", WorkSchema);