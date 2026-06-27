import express from "express";
import multer from "multer"; // 🟢 1. Import multer
import path from "path";
import {
  createAdmin,
  getAdmins,
  deleteAdmin,
  loginAdmin,
  updateAdmin,
  updateAdminProfile,
} from "../controllers/adminController.js";
import { verifySuperAdmin, verifyToken } from "../utils/verifyUser.js";

const router = express.Router();

// 🟢 2. SET UP MULTER STORAGE (Saves to your existing 'uploads' folder)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    // Creates a unique filename so images don't overwrite each other
    cb(null, Date.now() + path.extname(file.originalname)); 
  },
});
const upload = multer({ storage });


// --- 🛡️ SUPERADMIN MANAGEMENT ---
router.get("/", verifyToken, verifySuperAdmin, getAdmins);
router.post("/", verifyToken, verifySuperAdmin, createAdmin);
router.put("/update/:id", verifyToken, verifySuperAdmin, updateAdmin);
router.delete("/delete/:id", verifyToken, verifySuperAdmin, deleteAdmin);


// --- 👤 PROFILE & AUTH ---
router.post("/login", loginAdmin);

// 🟢 3. THE MAGIC MIDDLEWARE: Added upload.single('avatar') 
// This tells multer to look for a file named "avatar", save it, and attach it to req.file
router.put('/profile/:id', verifyToken, upload.single('avatar'), updateAdminProfile);

export default router;