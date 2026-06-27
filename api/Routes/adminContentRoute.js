// routes/adminContent.js
import express from "express";
import Billboard from "../models/Billboard.js";
import Work from "../models/Work.js";

const router = express.Router();

// Get all billboards + approved works
router.get("/content", async (req, res, next) => {
  try {
    const billboards = await Billboard.find().sort({ createdAt: -1 });
    const works = await Work.find({ status: "approved" }).sort({ createdAt: -1 });

    res.status(200).json({ success: true, billboards, works });
  } catch (error) {
    next(error);
  }
});

// Delete billboard
router.delete("/billboard/:id", async (req, res, next) => {
  try {
    await Billboard.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Billboard deleted" });
  } catch (error) {
    next(error);
  }
});

// Delete work
router.delete("/work/:id", async (req, res, next) => {
  try {
    await Work.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Work deleted" });
  } catch (error) {
    next(error);
  }
});

export default router;
