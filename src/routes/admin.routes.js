// yaha Router ko liya express se
import { Router } from "express";
import {upload} from "../middlewares/multer.middleware.js"
import { loginUser, logoutUser} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {verifyAdminJWT } from "../middlewares/checkRights.middleware.js"

import { 
    registerStaff,
    updateStaffData,
    deleteStaff,
    deleteUser,
    viewAllUser,
    viewAllStaff,
    viewAllAppointments
 } from "../controllers/admin.controller.js";

//yaha router ka object banaya
const router = Router()

// for logging in the user[owner] and admin
router.route("/login").post(loginUser)

// for logging out the user
router.route("/logout").post(verifyJWT, logoutUser)

// below registering the staff
router.route("/register-staff").post(verifyAdminJWT, registerStaff)

//update staff data
router.route("/update-staff").patch(verifyAdminJWT, updateStaffData)

// delete staff data
router.route("/delete-staff").delete(verifyAdminJWT, deleteStaff)

//delete user data
router.route("/delete-user").delete(verifyAdminJWT, deleteUser)

// get all user 
router.route("/view-user").get(verifyAdminJWT, viewAllUser)

// get all the staff
router.route("/view-staff").get(verifyAdminJWT, viewAllStaff)

// get all the appointments
router.route("/view-appointments").get(verifyAdminJWT, viewAllAppointments)

//getting the user and staff as well as the appointment data , blogs , review if done this are on hold for some time.

export default router