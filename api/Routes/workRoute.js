import express from 'express';
import { verifyToken } from '../utils/verifyUser.js';
import Work from '../models/Work.js';

// 🛠️ 1. IMPORT ADMIN & USER ACTIONS (From workController)
import {
  getUserWorks,
  uploadWork,
  getWorkById,
  deleteWork,
  approveWork,
  rejectWork,
  removeWork,
  searchWorks,
  getDashboardData,
  getFeedWorks,
  deleteComment,
} from '../controllers/workController.js'; 

// 📺 2. IMPORT FEED & ENGAGEMENT ACTIONS (From artistWorkController)
import {
  getSchools,
  getSchoolLeaderboard,
  getProfessionals,
  getForYou,
  getBillboard,
  likePost,
  sharePost,
  commentPost,
} from '../controllers/artistWorkController.js'; 

const router = express.Router();

// =========================================================
// 🚀 ZONE 1: PUBLIC FEEDS (STATIC ROUTES - MUST BE FIRST)
// =========================================================
router.get('/schools/leaderboard', getSchoolLeaderboard);
router.get('/schools', getSchools);
router.get('/professionals', getProfessionals);
router.get('/foryou', getForYou);
router.get('/billboard', getBillboard);


// =========================================================
// 🔒 ZONE 2: ADMIN & PROTECTED SEARCH
// =========================================================
router.get('/search', verifyToken, searchWorks);
router.get('/dashboard', verifyToken, getDashboardData);


// =========================================================
// 🎨 ZONE 3: ARTIST & USER SPECIFIC ROUTES
// =========================================================
router.post('/create-multiple', verifyToken, uploadWork);

router.get("/user/:userId/approved", async (req, res, next) => {
  try {
    const works = await Work.find({
      artistId: req.params.userId,
      status: "approved"
    })
    .sort({ createdAt: -1 })
    .populate("artistId", "username avatar verified school");

    res.status(200).json({ success: true, works });
  } catch (error) {
    next(error);
  }
});

router.get('/user/:id', verifyToken, getUserWorks);


// =========================================================
// ⚡ ZONE 4: ENGAGEMENT (LIKES, COMMENTS, SHARES)
// =========================================================
// Note: verifyToken ensures only logged-in users can like/comment
router.put('/:id/like', verifyToken, likePost);
router.put('/:id/share', verifyToken, sharePost);
router.put('/:id/comment', verifyToken, commentPost);


// =========================================================
// 🛡️ ZONE 5: MODERATION ROUTES
// =========================================================
router.patch('/:id/approve', verifyToken, approveWork);
router.patch('/:id/reject', verifyToken, rejectWork);
router.patch('/:id/remove', verifyToken, removeWork);
router.get('/feed', getFeedWorks);

// =========================================================
// 🛑 ZONE 6: DYNAMIC CATCH-ALL (MUST BE ABSOLUTELY LAST)
// =========================================================
router.get('/:id', getWorkById);
router.delete('/:id', verifyToken, deleteWork);

router.delete('/:id/comment/:commentId', verifyToken, deleteComment)

export default router;