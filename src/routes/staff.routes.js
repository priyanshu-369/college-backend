// yaha Router ko liya express se
import { Router } from "express";
import { loginStaff, logoutStaff } from "../controllers/staff.controller.js";

//yaha router ka object banaya
const router = Router()

// for logging in the user[owner] and admin
router.route("/login").post(loginStaff)

// for logging out the user
router.route("/logout").post(logoutStaff)


//getting the user and staff as well as the appointment data , blogs , review if done this are on hold for some time.

export default router