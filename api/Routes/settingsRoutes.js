import express from "express";
import { verifyToken } from "../utils/verifyUser.js";
import {
  getBillboardSettings,
  updateBillboardSettings,
} from "../controllers/settingsController.js";

const router = express.Router();

router.get("/billboard", getBillboardSettings);
router.put("/billboard", verifyToken, updateBillboardSettings);

export default router;
