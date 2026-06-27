import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";
import cors from "cors";
import { createServer } from "http";


// Route Imports
import authRouter from "./Routes/authRoute.js";
import userRouter from "./Routes/userRoute.js";
import workRouter from "./Routes/workRoute.js";
import adminRouter from "./Routes/adminRouter.js";
import systemLogRoutes from "./Routes/systemLogRoutes.js";
import messagesRouter from "./Routes/messageRouter.js"; 
import settingsRoutes from "./Routes/settingsRoutes.js";
import challengeRouter from "./Routes/challengeRoutes.js";
import artistRoute from "./Routes/artistRoute.js";
import paymentRoutes from "./Routes/paymentRoutes.js";
import orderRoutes from "./Routes/orderRoutes.js";
import viralRoutes from "./Routes/viral.route.js";
import notificationRouter from "./Routes/notificationRoute.js";
import matchRoutes from "./Routes/matchRoutes.js";
import payoutRoutes from "./Routes/payoutRoutes.js";
import stakeRoutes from "./Routes/stakeRouter.js";
import { getIO, initSocket } from "./socket/socketManager.js";
import { startSubscriptionCron } from "./services/subscriptionCron.js";
import { v2 as cloudinary } from "cloudinary";
import { startCronJobs } from "./utils/cronJobs.js";
 
dotenv.config();


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});
console.log("Cloudinary API Key loaded:", process.env.CLOUDINARY_API_KEY ? "YES" : "NO");

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);

// 🔌 1. INITIALIZE SOCKETS FIRST
initSocket(server);

app.use(cors({
  // 🚀 PRODUCTION READY
  origin: [
    process.env.ARTIST_CLIENT_URL, 
    process.env.ADMIN_CLIENT_URL,
    process.env.BUYER_CLIENT_URL,
    "http://localhost:5173", 
    "http://localhost:5174", 
    "http://localhost:5175"
  ], 
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"] 
}));

app.use(cookieParser());
app.use(express.json());

// 📂 2. STATIC FILES
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use("/uploads", express.static(uploadDir));

// 🛠 3. DATABASE
mongoose
  .connect(process.env.MONGO_DB)
  .then(() => console.log("✅ ARENA DB: Connected"))
  .catch((err) => console.error("❌ ARENA DB ERROR:", err.message));

  startCronJobs();

// 🛡️ 4. ATTACH IO TO REQ (Preserves your Admin Moderation Alerts!)
app.use((req, res, next) => {
  req.io = getIO(); 
  next();
});

// 🚪 5. API ROUTES
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/work", workRouter); 
app.use("/api/admin", adminRouter);
app.use("/api/messages", messagesRouter); 
app.use("/api/system-logs", systemLogRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/challenge", challengeRouter);
app.use("/api/artists", artistRoute);
app.use("/api/payments", paymentRoutes);
app.use('/api/order', orderRoutes);
app.use('/api/viral', viralRoutes);
app.use("/api/notifications", notificationRouter);
app.use("/api/matches", matchRoutes);
app.use("/api/payouts", payoutRoutes);
app.use("/api/stakes", stakeRoutes);

// ⚠️ 6. GLOBAL ERROR HANDLER
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Arena Internal Error";
  
  console.error(`🚨 [ERROR ${statusCode}]: ${message}`);
  if (statusCode === 500) console.error(err.stack);

  return res.status(statusCode).json({ success: false, statusCode, message });
});
startSubscriptionCron();
// ⚡ 7. START SERVER
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 ARENA CORE: Running on port ${PORT} with Global Sockets`)); 