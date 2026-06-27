import mongoose from "mongoose";

const systemLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  action: { type: String, required: true }, // e.g. "CREATE_ADMIN", "DELETE_ADMIN"
  details: { type: String }, // optional description
  timestamp: { type: Date, default: Date.now },
});

export default mongoose.model("SystemLog", systemLogSchema);
