// yaha Router ko liya express se
import { Router } from "express";
import {upload} from "../middlewares/multer.middleware.js"
import { loginUser, logoutUser} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {verifyAdminJWT } from "../middlewares/checkRights.middleware.js"

import { registerStaff } from "../controllers/admin.controller.js";

//yaha router ka object banaya
const router = Router()

// for logging in the user[owner] and admin
router.route("/login").post(loginUser)

// for logging out the user
router.route("/logout").post(verifyJWT, logoutUser)

// below registering the staff
router.route("/register-staff").post(verifyAdminJWT, registerStaff)

//update staff data
router.route("/update-staff").patch(verifyAdminJWT, updateStaff)

//getting the user and staff as well as the appointment data , blogs , review if done this are on hold for some time.

export default router