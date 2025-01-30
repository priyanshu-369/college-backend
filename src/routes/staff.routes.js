// yaha Router ko liya express se
import { Router } from "express";

//yaha router ka object banaya
const router = Router()

// for logging in the user[owner] and admin
router.route("/login").post(loginUser)

// for logging out the user
router.route("/logout").post(logoutUser)


//getting the user and staff as well as the appointment data , blogs , review if done this are on hold for some time.

export default router