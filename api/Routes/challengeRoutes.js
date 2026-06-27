import express from "express";

import { getActiveChallenge, setWeeklyChallenge } from "../controllers/challengeController.js";
import { verifyToken } from "../utils/verifyUser.js";


const router = express.Router();

router.post("/set-weekly", verifyToken, setWeeklyChallenge);
router.get("/active", getActiveChallenge);

export default router;
