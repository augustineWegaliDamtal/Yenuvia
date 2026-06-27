import mongoose from "mongoose";

const SchoolSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true, 
    index: true 
  },
  logo: { 
    type: String, 
    default: "https://placehold.co/400x400?text=School+Logo" 
  },
  
  // 🏆 THE LEADERBOARD ENGINE
  totalPoints: { 
    type: Number, 
    default: 0, 
    index: true // Optimized for DESC sorting
  },
  
  // 📈 RANKING METRICS
  previousRank: { type: Number, default: 0 },
  currentRank: { type: Number, default: 0 },
  
  // 🌍 GEOGRAPHY (Essential for Accra vs Kumasi battles)
  location: { 
    type: String, 
    enum: ["Greater Accra", "Ashanti", "Central", "Western", "Eastern", "Northern", "Volta", "Upper East", "Upper West", "Bono", "Bono East", "Ahafo", "Savannah", "North East", "Oti", "Western North"],
    required: true 
  },

  // 👥 MEMBERSHIP & STATS
  studentCount: { type: Number, default: 0 },
  topContributor: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User" 
  }, // The student with the most points for this school

  // 🎖️ ARENA STATUS
  tier: { 
    type: String, 
    enum: ["Elite", "Rising", "Newcomer"], 
    default: "Newcomer" 
  },
  verified: { type: Boolean, default: false }, // Official school partnership

}, { timestamps: true });

// --- ⚡ PERFORMANCE INDEXES ---
// Combined index for regional leaderboards (e.g., "Top Schools in Kumasi")
SchoolSchema.index({ location: 1, totalPoints: -1 });

// --- 🛠️ MIDDLEWARE: AUTO-TIER LOGIC ---
// Automatically upgrades a school's tier based on points
SchoolSchema.pre('save', function(next) {
  if (this.totalPoints >= 1000) {
    this.tier = "Elite";
  } else if (this.totalPoints >= 200) {
    this.tier = "Rising";
  } else {
    this.tier = "Newcomer";
  }
  next();
});

export default mongoose.model("School", SchoolSchema);