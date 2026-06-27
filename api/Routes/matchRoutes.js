import express from "express";
import multer from "multer"; // 🔥 1. NEW IMPORT

import { 
  createMatch, 
  getActiveMatches,  
  getMatchDrafts,  
  pushMatchLive, 
  getHeroBannerData,
  deleteMatch,
  verifyAndProcessSupport,
  settleMatch,
  getRoundWinners,
  spawnDerby
} from "../controllers/matchController.js";
import { verifyToken } from "../utils/verifyUser.js";

const router = express.Router();

// 🔥 2. CONFIGURE MULTER (Temp storage for incoming images)
const upload = multer({ dest: "uploads/" });

router.get("/", getActiveMatches);
router.get("/hero-banner", getHeroBannerData);
router.post("/", verifyToken, createMatch);

router.post("/:id/support", verifyToken, verifyAndProcessSupport);

// 🔥 3. THE NEW SPAWN ROUTE WITH FILE UPLOAD MIDDLEWARE
router.post(
  "/:id/spawn", 
  verifyToken, 
  upload.fields([
    { name: "crestA", maxCount: 1 }, 
    { name: "crestB", maxCount: 1 }
  ]), 
  spawnDerby
);

router.get("/:id/drafts", getMatchDrafts);
router.put("/:id/live", pushMatchLive);
router.put("/:id/settle", verifyToken, settleMatch);
router.delete("/:id", verifyToken, deleteMatch);
router.get("/:id/winners", getRoundWinners);            

export default router;