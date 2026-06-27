import crypto from 'crypto';
import mongoose from 'mongoose';
import Order from '../models/orderModel.js';
import User from '../models/userModel.js';
import Work from '../models/Work.js';
import { errorHandler } from '../utils/error.js';
import * as paystackService from '../services/paystackService.js';
// 🟢 1. IMPORT NOTIFICATION MODEL
import Notification from '../models/notificationModel.js';

const UserModel = mongoose.model('User');
const WorkModel = mongoose.model('Work');

export const createCheckoutSession = async (req, res, next) => {
  try {
    if (!req.user) {
       return next(errorHandler(401, "Please log in to acquire this masterpiece."));
    }
    const { workId, deliveryDetails } = req.body;
    const buyerId = req.user._id;

    const work = await Work.findById(workId);
    if (!work || !work.isForSale || work.isSold) {
      return next(errorHandler(404, "This masterpiece is no longer available."));
    }

    const artist = await User.findById(work.artistId);
    
    // 🟢 ESCROW FIX 1: Ensure they have MoMo details, NOT a subaccount code
    if (!artist || !artist.momoNumber || !artist.momoNetwork) {
      return next(errorHandler(400, "This artist hasn't set up their MoMo payout profile yet."));
    }

    const amountInPesewas = Math.round(work.price * 100);

    // 🟢 ESCROW FIX 2: Initialize transaction WITHOUT the subaccount field
    const payment = await paystackService.initializeTransaction({
      email: req.user.email,
      amount: amountInPesewas,
      
      // subaccount: artist.paystackSubaccountCode, <-- REMOVED! 100% goes to Yenuvia's main balance now.
      
      callback_url: `${process.env.BUYER_CLIENT_URL}/order/verify`,
      
      metadata: {
        workId,
        buyerId,
        artistId: work.artistId,
        deliveryDetails,
        totalPaidGHS: work.price
      }
    });

    if (payment && payment.body && payment.body.status) {
      res.status(200).json({ success: true, url: payment.body.data.authorization_url });
    } else {
      return next(errorHandler(500, "Payment Gateway is busy. Please try again."));
    }
  } catch (error) {
    next(error);
  }
};

/**
 * 🛡️ PHASE 2: Paystack Webhook (Success Handler)
 */
export const paystackWebhook = async (req, res) => {
  try {
    const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
                       .update(JSON.stringify(req.body))
                       .digest('hex');
    
    if (hash !== req.headers['x-paystack-signature']) {
      return res.status(400).send('Invalid Signature');
    }

    const event = req.body;

    if (event.event === 'charge.success') {
      const { metadata, reference } = event.data;
      const { workId, buyerId, artistId, deliveryDetails, totalPaidGHS } = metadata;

      const newOrder = new Order({
        buyerId, artistId, workId, deliveryDetails, totalPaidGHS,
        arenaCommission: totalPaidGHS * 0.10, 
        artistEarnings: totalPaidGHS * 0.90,  
        paymentReference: reference,
        status: 'paid'
      });
      await newOrder.save();

      await Work.findByIdAndUpdate(workId, { isSold: true });

      // 🟢 3. NEW NOTIFICATION: Alert the Artist of the sale!
      const notifMessage = `Masterpiece Sold! GHS ${totalPaidGHS} has been secured. Check your dashboard for delivery details.`;
      
      await Notification.create({
        recipient: artistId,
        sender: buyerId,
        type: "order",
        message: notifMessage,
        relatedOrder: newOrder._id,
        relatedWork: workId
      });

      if (req.io) {
        req.io.to(artistId.toString()).emit("newNotification", {
          type: "order",
          message: notifMessage,
          relatedOrder: { _id: newOrder._id }
        });
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error("Arena Webhook Error:", error);
    res.status(500).send('Internal Error');
  }
};

/**
 * 👑 ADMIN & ARTIST: Order Management
 */
export const getAllOrders = async (req, res, next) => {
  try {
    if (!['admin', 'superadmin'].includes(req.user.role)) {
      return next(errorHandler(403, "Access Denied: Financial Records Restricted."));
    }
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .populate('buyerId', 'username email')
      .populate('artistId', 'username school momoNumber')
      .populate('workId', 'title mediaUrls');

    res.status(200).json({ success: true, count: orders.length, orders });
  } catch (error) {
    next(error);
  }
};

// Update Shipping/Delivery Status
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const order = await Order.findById(orderId).populate('workId', 'title');
    if (!order) return next(errorHandler(404, "Order not found."));

    const isOwner = order.artistId.toString() === req.user._id.toString();
    const isAdmin = ['admin', 'superadmin'].includes(req.user.role);

    if (!isOwner && !isAdmin) {
      return next(errorHandler(403, "Unauthorized to manage this order."));
    }

    order.status = status;
    if (status === 'shipped' && !order.shippedAt) {
       order.shippedAt = new Date(); 
    }
    await order.save();

    // 🟢 4. NEW NOTIFICATION: Tell the buyer their item is shipped/delivered!
    const notifMessage = `Your order for "${order.workId?.title || 'a masterpiece'}" has been marked as ${status}!`;
    
    await Notification.create({
      recipient: order.buyerId,
      sender: req.user._id,
      type: "delivery",
      message: notifMessage,
      relatedOrder: order._id
    });

    if (req.io) {
      req.io.to(order.buyerId.toString()).emit("newNotification", {
        type: "delivery",
        message: notifMessage,
        relatedOrder: { _id: order._id }
      });
    }

    res.status(200).json({ success: true, message: `Order marked as ${status}`, order });
  } catch (error) {
    next(error);
  }
};

export const getOrderDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id)
      .populate({ path: 'buyerId', select: 'username email', model: 'User' })
      .populate({ path: 'artistId', select: 'username avatar momoName momoNumber momoNetwork', model: 'User' })
      .populate({ path: 'workId', select: 'title mediaUrls price', model: 'Work' });

    if (!order) return next(errorHandler(404, "Receipt not found in the Arena database."));

    const isBuyer = order.buyerId?._id.toString() === req.user._id.toString();
    const isArtist = order.artistId?._id.toString() === req.user._id.toString();
    const isAdmin = ['admin', 'superadmin'].includes(req.user.role);

    if (!isBuyer && !isArtist && !isAdmin) {
      return next(errorHandler(403, "Access Denied: You are not authorized to view this transaction."));
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    console.error("🚨 GET ORDER DETAILS ERROR:", error.message);
    next(error);
  }
};

export const verifyPayment = async (req, res, next) => {
  try {
    const { reference } = req.query;
    const response = await paystackService.verifyTransaction(reference);

    if (response && response.body?.status && response.body.data.status === 'success') {
      let order = await Order.findOne({ paymentReference: reference });

      if (!order) {
        console.log("🛠️ Webhook missed. Manually creating order from Paystack data...");
        const { metadata } = response.body.data;
        
        order = new Order({
          buyerId: metadata.buyerId, artistId: metadata.artistId, workId: metadata.workId,
          deliveryDetails: metadata.deliveryDetails, totalPaidGHS: metadata.totalPaidGHS,
          arenaCommission: metadata.totalPaidGHS * 0.10, artistEarnings: metadata.totalPaidGHS * 0.90,
          paymentReference: reference, status: 'paid'
        });
        await order.save();
        await Work.findByIdAndUpdate(metadata.workId, { isSold: true });

        // 🟢 5. FALLBACK NOTIFICATION: Just in case the webhook missed it
        await Notification.create({
          recipient: metadata.artistId,
          sender: metadata.buyerId,
          type: "order",
          message: `Masterpiece Sold! GHS ${metadata.totalPaidGHS} secured.`,
          relatedOrder: order._id,
          relatedWork: metadata.workId
        });
        
        if (req.io) {
          req.io.to(metadata.artistId.toString()).emit("newNotification", {
            type: "order", message: `Masterpiece Sold! GHS ${metadata.totalPaidGHS} secured.`
          });
        }
      }
      res.status(200).json({ success: true, amount: order.totalPaidGHS });
    } else {
      return next(errorHandler(400, "Paystack could not verify this transaction."));
    }
  } catch (error) {
    console.error("Verification Crash:", error);
    next(error);
  }
};

export const confirmDeliveryAndReleaseFunds = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate({
      path: 'artistId', model: 'User'
    });
    
    if (!order) return next(errorHandler(404, "Order not found."));
    if (order.buyerId.toString() !== req.user._id.toString()) {
      return next(errorHandler(403, "Only the buyer can release the funds."));
    }
    if (order.escrowStatus === 'released') {
      return next(errorHandler(400, "Funds have already been released."));
    }

    const artist = order.artistId;

    if (!artist.momoNumber || !artist.momoNetwork) {
        return next(errorHandler(400, "Artist has not completed their payout profile."));
    }

    const recipientData = await paystackService.createTransferRecipient(
      artist.momoName || artist.username || "Arena Artist",
      artist.momoNumber, artist.momoNetwork
    );

    if (!recipientData.status) {
      return next(errorHandler(500, `Paystack refused MoMo registration: ${recipientData.message}`));
    }

    const transferData = await paystackService.releaseFunds(
      order.artistEarnings, recipientData.data.recipient_code, order._id
    );

    if (transferData.status) {
      order.escrowStatus = 'released';
      order.status = 'delivered';
      await order.save();

      // 🟢 6. NEW NOTIFICATION: Tell the artist they got paid!
      const notifMessage = `GHS ${order.artistEarnings} has been sent to your MoMo!`;
      
      await Notification.create({
        recipient: artist._id,
        sender: req.user._id, // Buyer
        type: "system", // Or 'delivery'
        message: notifMessage,
        relatedOrder: order._id
      });

      if (req.io) {
         req.io.to(artist._id.toString()).emit("newNotification", {
           type: "system",
           message: notifMessage
         });
      }

      res.status(200).json({ success: true, message: "Delivery confirmed and funds released!" });
    } else {
      return next(errorHandler(500, `Transfer failed. Reason: ${transferData.message}`));
    }
  } catch (error) {
    next(error);
  }
};

export const getMyOrders = async (req, res, next) => {
  try {
    if (!req.user) return next(errorHandler(401, "Unauthorized"));

    const orders = await Order.find({ buyerId: req.user._id })
      .sort({ createdAt: -1 })
      .populate({ path: 'workId', select: 'title mediaUrls price', model: 'Work' })
      .populate({ path: 'artistId', select: 'username avatar', model: 'User' });

    res.status(200).json({ success: true, count: orders.length, orders });
  } catch (error) {
    console.error("🚨 VAULT FETCH ERROR:", error.message);
    next(error);
  }
};

export const disputeOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return next(errorHandler(404, "Order not found."));
    
    // Only the buyer can freeze the funds
    if (order.buyerId.toString() !== req.user._id.toString()) {
      return next(errorHandler(403, "Only the buyer can open a dispute."));
    }
    
    // You can't dispute funds that are already gone
    if (order.escrowStatus === 'released') {
      return next(errorHandler(400, "Funds have already been released to the artist."));
    }

    order.escrowStatus = 'disputed';
    await order.save();

    // 🟢 NOTIFY THE ARTIST & ADMINS
    const notifMessage = `⚠️ The buyer has reported an issue with their order. Escrow funds are temporarily frozen.`;
    
    await Notification.create({
      recipient: order.artistId,
      sender: req.user._id,
      type: "system",
      message: notifMessage,
      relatedOrder: order._id
    });

    if (req.io) {
      req.io.to(order.artistId.toString()).emit("newNotification", {
        type: "system", message: notifMessage
      });
    }

    res.status(200).json({ success: true, message: "Dispute opened. Funds are frozen while an admin reviews." });
  } catch (error) {
    next(error);
  }
};


export const resolveDispute = async (req, res, next) => {
  try {
    // Ensure only admins can do this
    if (!['admin', 'superadmin'].includes(req.user.role)) {
      return next(errorHandler(403, "Only admins can resolve disputes."));
    }

    const { decision } = req.body; // Expects 'release_to_artist' or 'refund_buyer'
    const order = await Order.findById(req.params.id).populate({
      path: 'artistId', model: 'User'
    });
    
    if (!order || order.escrowStatus !== 'disputed') {
      return next(errorHandler(400, "Invalid order or no active dispute found."));
    }

    // SCENARIO A: Admin rules for Artist (Release Funds)
    if (decision === 'release_to_artist') {
      const artist = order.artistId;
      const recipientData = await paystackService.createTransferRecipient(
        artist.momoName || artist.username || "Yenuvia Artist", 
        artist.momoNumber, 
        artist.momoNetwork
      );
      
      const transferData = await paystackService.releaseFunds(
        order.artistEarnings, recipientData.data.recipient_code, order._id
      );

      if (transferData.status) {
        order.escrowStatus = 'released';
        order.status = 'delivered';
        await order.save();
        return res.status(200).json({ success: true, message: "Dispute resolved: Funds released to artist." });
      } else {
        return next(errorHandler(500, "Paystack transfer failed."));
      }
    }

    // SCENARIO B: Admin rules for Buyer (Refund)
    if (decision === 'refund_buyer') {
      const refundData = await paystackService.refundTransaction(order.paymentReference);
      
      if (refundData.status) {
        order.escrowStatus = 'refunded';
        order.status = 'cancelled';
        await order.save();
        return res.status(200).json({ success: true, message: "Dispute resolved: Buyer has been refunded." });
      } else {
         return next(errorHandler(500, `Refund failed: ${refundData.message}`));
      }
    }

    return next(errorHandler(400, "Invalid decision provided."));
  } catch (error) {
    next(error);
  }
};