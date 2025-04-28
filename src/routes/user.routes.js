// yaha Router ko liya express se
import { Router } from "express";
import {upload} from "../middlewares/multer.middleware.js"
import { registerUser, loginUser, logoutUser, updateUserData, updatePassword, verifyUserSendOtp, verifyOtp, resetPassword, registerPet, updatePetData, getPetData, getAllAppointments, getPetsByOwnerId  } from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
// import { verify } from "jsonwebtoken";
import { getUserPayments } from "../controllers/user.controller.js";


//yaha router ka object banaya
const router = Router()

// agar [ /user/registerUser ] pe req aayega to hum user register karenge...!
router.route("/register").post(upload.single("avatar"), registerUser)

// for logging in the user[owner] and admin
router.route("/login").post(loginUser)


// for logging  [out]  the user
router.route("/logout").post(verifyJWT, logoutUser)

//for updating user data
router.route("/update-user").patch(verifyJWT, upload.single("avatar"), updateUserData)

// for updating the user password 
router.route("/update-password").patch(verifyJWT, updatePassword)


// >>>>>> forgot password start <<<<<<<<

// for sending otp
router.route("/sendOtp").post(verifyUserSendOtp)

// for verify otp on mail
router.route("/verifyOtp").post(verifyOtp)

// to reset password
router.route("/resetPassword").patch(resetPassword)

// >>>>>>> forgot password ends <<<<<<<<

// for registering the pet
router.route("/register-pet").post(verifyJWT, upload.single("avatar"), registerPet)

// for getting the pet data
router.route("/pets").get(verifyJWT, getPetData)

router.route("/owner/:id").get(getPetsByOwnerId)

// for updating the pet data
router.route("/update-pet").patch(verifyJWT, upload.single("avatar"), updatePetData)


// payment part 

router.route("/payments").get(verifyJWT, getUserPayments)

// to get all the appointements to the user side
router.route("/appointments").get(getAllAppointments)
export default router