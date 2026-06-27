import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    // 🔗 LINKING THE TRIANGLE
    buyerId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', // The fan buying the art
      required: true 
    },
    artistId: { 
      type: mongoose.Schema.Types.ObjectId, 

      ref: 'User', 
      required: true 
    },
    workId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Work', // The specific masterpiece
      required: true 
    },

    // 📍 GHANA DELIVERY ENGINE
    deliveryDetails: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true }, // Crucial for MoMo/Calls
      ghanaPostGps: { type: String, required: true }, // The digital address
      landmark: { type: String, required: true }, // e.g. "Opposite the Total Station"
      city: { type: String, required: true },
      region: { type: String, required: true }
    },

    // 💸 THE MONEY BREAKDOWN
    totalPaidGHS: { type: Number, required: true }, 
    arenaCommission: { type: Number, required: true }, // Your fee (e.g. 5%)
    artistEarnings: { type: Number, required: true }, // What you eventually MoMo them
    
    // 🚦 THE LIFECYCLE
    status: {
      type: String,
      enum: ['paid', 'shipped', 'delivered', 'cancelled', 'disputed'],
      default: 'paid'
    },

    // ⏱️ THE AUTO-RELEASE TRACKER (NEW)
    shippedAt: {
      type: Date,
      default: null // Stays null until the artist marks the order as "shipped"
    },

    // 🧾 AUDIT TRAIL
    paymentReference: { 
      type: String, 
      required: true, 
      unique: true // The reference from Paystack
    },
  
    escrowStatus: {
      type: String,

      enum: ['held', 'released', 'disputed', 'refunded'], 
      default: 'held'
    },
  },
  { timestamps: true }
);

const Order = mongoose.model('Order', orderSchema);
export default Order;