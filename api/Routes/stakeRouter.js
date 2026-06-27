import express from "express";
import { getMyLedger, placePledge } from "../controllers/stakeController.js";
import { verifyToken } from "../utils/verifyUser.js"; // Adjust this path to wherever your auth middleware is

const router = express.Router();

// Fetch the user's personal ledger
router.get("/my-ledger", verifyToken, getMyLedger);
router.post("/pledge", verifyToken, placePledge);

export default router;