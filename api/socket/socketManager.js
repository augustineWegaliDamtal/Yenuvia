import { Server } from "socket.io";

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      // 🚀 Combined your local testing ports with your production env variables
      origin: [
        process.env.ARTIST_CLIENT_URL, 
        process.env.ADMIN_CLIENT_URL,
        process.env.BUYER_CLIENT_URL,
        "http://localhost:5173", 
        "http://localhost:5174", 
        "http://localhost:5175"
      ],
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      credentials: true
    }
  });

  io.on("connection", (socket) => {
    // --- 🛡️ 1. ADMIN & MODERATION LOGIC (From your original code) ---
    const { userId, role } = socket.handshake.query;

    if (userId) {  
      socket.join(userId);
      const userRole = role?.toLowerCase();
      if (["admin", "superadmin"].includes(userRole)) {
        socket.join("admins_room");
        console.log(`🛡️ Admin ${userId} joined Moderation Room`);
      }
    }

    // =================================================================
    // 🔴 THE FIX: Listen for the Frontend "join" command
    // =================================================================
    socket.on("join", (id) => {
      socket.join(id);
      console.log(`✅ Private Comms Tunnel Opened for: ${id}`);
    });
    // =================================================================

    // --- 🏟️ 2. NATIONAL DERBY LOGIC (The new addition) ---
    socket.on("join_match", (matchId) => {
      socket.join(matchId);
    });

    socket.on("disconnect", () => {
      // User left
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