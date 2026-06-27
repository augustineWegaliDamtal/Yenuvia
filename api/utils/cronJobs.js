import cron from 'node-cron';
import mongoose from 'mongoose';
import Order from '../models/orderModel.js';
import * as paystackService from '../services/paystackService.js';

// This function runs automatically every night at Midnight (00:00)
export const startCronJobs = () => {
  cron.schedule('0 0 * * *', async () => {
    console.log('⏳ Running Daily Escrow Auto-Release Check...');
    
    try {
      // Find orders shipped more than 7 days ago, where funds are still held
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const pendingOrders = await Order.find({
        status: 'shipped',
        escrowStatus: 'held',
        shippedAt: { $lte: sevenDaysAgo } // Shipped on or before 7 days ago
      }).populate('artistId');

      if (pendingOrders.length === 0) {
        console.log('✅ No pending escrows need auto-releasing today.');
        return;
      }

      // Loop through and release funds for each one
      for (const order of pendingOrders) {
        try {
          const artist = order.artistId;
          const recipientData = await paystackService.createTransferRecipient(
            artist.momoName || artist.username, artist.momoNumber, artist.momoNetwork
          );
          
          if (recipientData.status) {
             const transferData = await paystackService.releaseFunds(
                order.artistEarnings, recipientData.data.recipient_code, order._id
             );

             if (transferData.status) {
                order.escrowStatus = 'released';
                order.status = 'delivered'; // Auto-completed
                await order.save();
                console.log(`💰 Auto-Released Escrow for Order: ${order._id}`);
             }
          }
        } catch (err) {
           console.error(`🚨 Failed to auto-release order ${order._id}:`, err.message);
        }
      }
    } catch (error) {
      console.error('Cron Job Error:', error);
    }
  });
};