import express from "express";
import { getAllArtists, getArtistById } from "../controllers/artistController.js";


const router = express.Router();

// GET /api/artists/:id
router.get("/:id", getArtistById);
// routes/artistRoutes.js
router.get("/", getAllArtists);

export default router;
