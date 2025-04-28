import Razorpay from "razorpay";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";

import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { Staff } from "../models/staff.model.js";
import { Appointment } from "../models/appointment.model.js";
import { Payment } from "../models/payment.model.js";
import { sendBookingConfirmationMail } from "../utils/mailerservice.js";

// ─── Razorpay Config ─────────────────────────────
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ─── Reusable Slot Availability Checker ──────────
const isSlotAvailable = async (staffId, date, slot) => {
  const staff = await Staff.findById(staffId);
  if (!staff) throw new ApiError(404, "Staff not found");

  const apptDate = new Date(date);
  const dayName = apptDate.toLocaleDateString("en-US", { weekday: "long" });

  const daySlot = staff.availableSlots.find(d => d.day === dayName);
  if (!daySlot) {
    return { available: false, message: `Staff not available on ${dayName}` };
  }

  if (!daySlot.timeSlots.includes(slot)) {
    return { available: false, message: `Slot ${slot} not defined on ${dayName}` };
  }

  const conflict = await Appointment.findOne({
    staff: staffId,
    date: apptDate,
    bookedSlot: slot,
    status: "scheduled"
  });
  if (conflict) {
    return { available: false, message: "This slot is already booked." };
  }

  return { available: true, message: "Slot is available." };
};

// ─── 1️⃣ Check Slot Availability ─────────────────
export const checkSlotAvailability = asyncHandler(async (req, res) => {
  const { staffId, date, slot } = req.body;
  if (!staffId || !date || !slot) {
    throw new ApiError(400, "staffId, date & slot are required");
  }

  const result = await isSlotAvailable(staffId, date, slot);
  res.json(result);
});

// ─── 2️⃣ Create Razorpay Order ───────────────────
export const createOrder = asyncHandler(async (req, res) => {
  const { staffId, date, slot, pet, amount } = req.body;
  if (!staffId || !date || !slot || !pet || !amount) {
    throw new ApiError(400, "Missing booking parameters");
  }

  const { available, message } = await isSlotAvailable(staffId, date, slot);
  if (!available) throw new ApiError(400, message);

  const order = await razorpay.orders.create({
    amount: Math.round(amount * 100),
    currency: "INR",
    receipt: `rcpt_${Date.now()}`,
    payment_capture: 1
  });

  res.status(201).json({ order });
});

// ─── 3️⃣ Verify Payment & Book ────────────────────
export const verifyAndBook = asyncHandler(async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    staffId, date, slot, pet, amount
  } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw new ApiError(400, "Payment details missing");
  }

  const expectedSig = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expectedSig !== razorpay_signature) {
    throw new ApiError(400, "Invalid signature");
  }

  const appt = await Appointment.create({
    user: req.user._id,
    staff: staffId,
    pet,
    date: new Date(date),
    bookedSlot: slot
  });

  const payment = await Payment.create({
    user: req.user._id,
    appointment: appt._id,
    paymentId: razorpay_payment_id,
    amount,
    status: "success"
  });


  const invoiceName = `invoice_${payment._id}.pdf`;
const invoiceDir = path.join("public", "invoices");
if (!fs.existsSync(invoiceDir)) {
  fs.mkdirSync(invoiceDir, { recursive: true });
}
const invoicePath = path.join(invoiceDir, invoiceName);

const doc = new PDFDocument();
doc.pipe(fs.createWriteStream(invoicePath));
doc.fontSize(20).text("Pet Care Invoice", { align: "center" }).moveDown();
doc.fontSize(12)
  .text(`Invoice ID: ${payment._id}`)
  .text(`Date: ${new Date().toLocaleDateString()}`)
  .text(`Staff: ${(await Staff.findById(staffId)).name}`)
  .text(`Slot: ${slot}`)
  .text(`Amount Paid: ₹${amount}`)
  .text(`Payment ID: ${razorpay_payment_id}`);
doc.end();


  const invoiceUrl = `${req.protocol}://${req.get("host")}/invoices/${invoiceName}`;
  await sendBookingConfirmationMail(
    req.user.email,
    req.user.fullName,
    { appointment: appt, invoiceUrl }
  );

  res.status(201).json({
    appointment: appt,
    invoiceUrl
  });
});
