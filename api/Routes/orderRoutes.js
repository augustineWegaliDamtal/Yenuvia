import express from 'express';
import { 
  createCheckoutSession, 
  paystackWebhook, 
  getOrderDetails,
  getAllOrders, // For Admins
  updateOrderStatus, // For Admins/Artists
  verifyPayment,
  confirmDeliveryAndReleaseFunds,
  getMyOrders,
  disputeOrder,
  resolveDispute
} from '../controllers/orderController.js';
import { verifyToken } from '../utils/verifyUser.js';

const router = express.Router();

// --- 🛒 BUYER ROUTES ---
// Starts the MoMo process
router.post('/checkout', verifyToken, createCheckoutSession);
// View their own receipt


// --- 🛡️ THE WEBHOOK (EXTERNAL) ---
// IMPORTANT: No verifyToken here. Paystack calls this directly.
router.post('/webhook', paystackWebhook);

// --- 👑 ADMIN & SUPERADMIN ROUTES ---
// View every sale happening in the Arena
router.get('/all', verifyToken, getAllOrders); 
// Mark as 'shipped' or 'delivered' to trigger payouts
router.put('/status/:orderId', verifyToken, updateOrderStatus);
router.get('/verify', verifyToken, verifyPayment)
// 📦 ESCROW: Buyer confirms delivery and releases funds to artist
router.put('/:id/confirm-delivery', verifyToken, confirmDeliveryAndReleaseFunds);
router.get('/my-orders', verifyToken, getMyOrders)
router.get('/:id', verifyToken, getOrderDetails);
router.post('/:id/dispute', verifyToken, disputeOrder)
router.post('/:id/resolve', verifyToken, resolveDispute)


export default router;