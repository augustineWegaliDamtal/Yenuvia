// routes/paymentRoutes.js
import express from "express";
import { verifySuperAdmin, verifyToken } from "../utils/verifyUser.js";
import { awardVerification, handlePaymentCallback, initiateVerificationPayment, unverifyVerification }
 from "../controllers/verificationController.js";
import {  getArtistDonations, getArtistDonationTotal, getDonorDonations
    , handleDonationCallback, handlePaystackWebhook, initiateDonationPayment } from "../controllers/paymentController.js";


const router = express.Router();

router.post("/verify/initiate", verifyToken, initiateVerificationPayment);
router.get("/callback", handlePaymentCallback);
router.put("/verify/:id",verifyToken,verifySuperAdmin, awardVerification);
router.put("/unverify/:id", verifyToken, verifySuperAdmin, unverifyVerification);

// -------------------- PAYMENT FLOW --------------------
// Start a donation (donor clicks donate button)
router.post("/donate/:id", verifyToken, initiateDonationPayment);

// Handle Paystack callback after payment
router.get("/donation-callback", handleDonationCallback);

// Get all donations for a specific artist
router.get("/artist/:id", getArtistDonations);

// Get all donations made by a specific donor
router.get("/donor/:id", getDonorDonations);

// Get total donations for an artist
router.get("/artist/:id/total", getArtistDonationTotal)

router.post("/webhook", handlePaystackWebhook);

export default router;
