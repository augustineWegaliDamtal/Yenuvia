import { Server } from "socket.io";

let io;

export const initSocket = (server) => {
  // 1. Clean origins: Remove undefined env vars and strip any trailing slashes
  const allowedOrigins = [
    process.env.ARTIST_CLIENT_URL,
    process.env.ADMIN_CLIENT_URL,
    process.env.BUYER_CLIENT_URL,
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175"
  ]
    .filter(Boolean)
    .map((url) => url.replace(/\/$/, ""));

  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          console.warn(`🚫 Socket CORS blocked origin: ${origin}`);
          callback(new Error("Not allowed by CORS"));
        }
      },
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      credentials: true
    },
    // Production network stability adjustments
    pingTimeout: 60000, // How long to wait without ping before closing (60s is safer for mobile)
    pingInterval: 25000 // How often to ping the client
  });

  io.on("connection", (socket) => {
    // --- 🛡️ 1. AUTOMATIC ROOM JOINING ON CONNECT & RECONNECT ---
    // Extracting from auth or query ensures reconnection automatically rejoins rooms!
    const userId = socket.handshake.auth?.userId || socket.handshake.query?.userId;
    const role = socket.handshake.auth?.role || socket.handshake.query?.role;

    if (userId) {
      socket.join(userId);
      console.log(`📡 User ${userId} auto-joined private notification tunnel.`);

      const userRole = role?.toLowerCase();
      if (["admin", "superadmin"].includes(userRole)) {
        socket.join("admins_room");
        console.log(`🛡️ Admin ${userId} joined Moderation Room`);
      }
    }

    // --- 🔗 2. MANUAL JOIN BACKUP (For components that initialize late) ---
    socket.on("join", (id) => {
      if (id && !socket.rooms.has(id)) {
        socket.join(id);
        console.log(`✅ Manual Comms Tunnel Opened for: ${id}`);
      }
    });

    // --- 🏟️ 3. NATIONAL DERBY LOGIC ---
    socket.on("join_match", (matchId) => {
      if (matchId) {
        socket.join(matchId);
        console.log(`⚽ Socket joined derby match: ${matchId}`);
      }
    });

    socket.on("disconnect", (reason) => {
      // Helpful production logging to diagnose unexpected drops
      if (reason === "ping timeout" || reason === "transport close") {
        console.log(`⚠️ Socket disconnected due to network drop (${reason}): ${socket.id}`);
      }
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};