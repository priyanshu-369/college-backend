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
    viewAllAppointments,
    listUsers,
    deleteAppointment,
    getAdminOverview,
    deleteStaffNon,
    getAppointmentsByUser
 } from "../controllers/admin.controller.js";

//yaha router ka object banaya
const router = Router()

// for logging in the user[owner] and admin


router.route("overview").get(verifyAdminJWT, getAdminOverview)

// for logging out the user
router.route("/logout").post(verifyJWT, logoutUser)

// below registering the staff
router.route("/register-staff").post(verifyAdminJWT, upload.single("avatar"), registerStaff)


router.route("/register").post(upload.single("avatar"), registerStaff)

// router.route("/register").post(upload.single("avatar"), registerUser)


//update staff data
router.route("/update-staff").patch(verifyAdminJWT, updateStaffData)

router.route("/update").patch(upload.single("avatar"), updateStaffData)


// delete staff data
router.route("/delete-staff").delete(verifyAdminJWT, deleteStaff)

router.route("/deleteStaff").delete(deleteStaffNon)



//delete user data
router.route("/delete-user").delete(verifyAdminJWT, deleteUser)

router.route("/user/delete/:id").delete(deleteUser)
router.route("/staff/delete/:id").delete(deleteStaff);


// get all user 
router.route("/view-user").get(verifyAdminJWT, viewAllUser)

router.route("/view").get(listUsers)


// get all the appointments
router.route("/view-appointments").get(verifyAdminJWT, viewAllAppointments)

router.route("/appointment/all").get(viewAllAppointments)

router.route("/appointment/user/:id").get(getAppointmentsByUser)

router.route("appointment/:id").delete(deleteAppointment)

//getting the user and staff as well as the appointment data , blogs , review if done this are on hold for some time.

export default router