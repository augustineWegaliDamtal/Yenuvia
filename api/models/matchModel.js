import mongoose from "mongoose";

const matchSchema = new mongoose.Schema(
  {
    directive: {
      type: String,
      required: true,
      trim: true,
    },
    league: {
      type: String,
      enum: ["UNI", "SHS", "TECH_HUB", "NATIONAL"],
      required: true,
    },
    status: {
      type: String,
      enum: ["UPCOMING", "LIVE", "COMPLETED", "CANCELLED"],
      default: "UPCOMING",
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    totalPool: {
      type: Number,
      default: 0, 
    },
    
    // The Contenders (The schools battling in this specific fixture)
    contenders: [
      {
        school: { type: String, required: true }, 
        artistId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        workId: { type: mongoose.Schema.Types.ObjectId, ref: "Work" }, 
        totalStaked: { type: Number, default: 0 }, 
        isWinner: { type: Boolean, default: false },
        logoUrl: { type: String, default: "" },
      }
    ],

    // 🔥 THE TOURNAMENT ENGINE LINKS 🔥
    // 1. Links a spawned Derby back to its original Directive Hub
    parentMatchId: { type: mongoose.Schema.Types.ObjectId, ref: "Match", default: null },
    
    // 2. Stores the overall winner to display on the Frontend Victory Cards
    winner: { type: mongoose.Schema.Types.ObjectId, default: null }
  },
  { timestamps: true }
);

export const Match = mongoose.model("Match", matchSchema);