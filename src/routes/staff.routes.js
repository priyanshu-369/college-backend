// yaha Router ko liya express se
import { Router } from "express";
import { verifyStaffJWT } from "../middlewares/checkRights.middleware.js";
import { getAllStaff,
         loginStaff, 
         logoutStaff,
         checkTotalCompletedAppointments,
         checkTotalScheduledAppointments,
         checkTodaysAppointments,
         updateApointmentStatus,
         getStaffById
 } from "../controllers/staff.controller.js";


//yaha router ka object banaya
const router = Router()

router.route("/").get(getAllStaff)

router.route("/:id").get(getStaffById)

// for logging in the user[owner] and admin
router.route("/login").post(loginStaff)

// for logging out the user
router.route("/logout").post(verifyStaffJWT, logoutStaff)

// for getting all the completed appointments by specific staff
router.route("/appointment/completed").get(verifyStaffJWT, checkTotalCompletedAppointments)

// for getting all the Scheduled appointments for specific staff
router.route("/appointment/scheduled").get(verifyStaffJWT, checkTotalScheduledAppointments)

// for getting all todays appointments for specific staff
router.route("/appointment/today").get(verifyStaffJWT, checkTodaysAppointments)

// update the status of the appointment
router.route("/appointment/update").patch(verifyStaffJWT, updateApointmentStatus)


//getting the user and staff as well as the appointment data , blogs , review if done this are on hold for some time.

export default router