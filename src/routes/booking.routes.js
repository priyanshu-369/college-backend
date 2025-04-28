import express from "express";
import {
  checkSlotAvailability,
  createOrder,
  verifyAndBook
} from "../controllers/booking.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.route("/check").post(verifyJWT, checkSlotAvailability);
router.route("/order").post(verifyJWT, createOrder);
router.route("/verify").post(verifyJWT, verifyAndBook);

export default router;
