// backend/models/Payment.js
import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Appointment",
    required: true
  },
  paymentId: {        // Razorpay payment ID (or any gateway ID)
    type: String,
    required: true
  },
  amount: {           // in rupees
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: "INR"
  },
  status: {           // “success” or “failed”
    type: String,
    enum: ["success", "failed"],
    default: "success"
  }
}, { timestamps: true });

export const Payment = mongoose.model("Payment", paymentSchema);
