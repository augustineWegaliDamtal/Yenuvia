import express from "express";
import {
  createLog,
  getLogs,
  deleteLog,
} from "../controllers/systemLogController.js";
import { verifyToken } from "../utils/verifyUser.js";


const router = express.Router();

// Get all logs (superadmin/admin only)
router.get("/", verifyToken, getLogs);

// Create a log entry (called internally or by system actions)
router.post("/", verifyToken, createLog);

// Delete a log (optional cleanup, superadmin only)
router.delete("/:id", verifyToken, deleteLog);

export default router;
