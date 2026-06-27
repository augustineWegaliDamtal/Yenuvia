import express from 'express';
import { verifyToken } from '../utils/verifyUser.js';
import { deleteUser, followUser, getArtistStats, getUserById, getUsers, getWalletData, updateUser,
     verifyGhanaCard } from '../controllers/userController.js';

const router = express.Router();

router.get("/", verifyToken, getUsers);
router.get("/wallet", verifyToken, getWalletData);
router.get("/:id", getUserById)
// Use PUT for updates (REST convention)
router.put('/update/:id', verifyToken, updateUser);

// Use DELETE for account deletion
router.delete('/delete/:id', verifyToken, deleteUser);
router.put('/follow/:id', verifyToken, followUser);
router.get('/stats/:id', getArtistStats);
router.post('/verify-ghana-card', verifyToken, verifyGhanaCard);

export default router;
