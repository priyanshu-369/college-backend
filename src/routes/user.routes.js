// yaha Router ko liya express se
import { Router } from "express";
import {upload} from "../middlewares/multer.middleware.js"
import { registerUser, loginUser, logoutUser, updateUserData, updatePassword, verifyUserSendOtp, verifyOtp, resetPassword, registerPet, updatePetData  } from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
// import { verify } from "jsonwebtoken";

//yaha router ka object banaya
const router = Router()

// agar [ /user/registerUser ] pe req aayega to hum user register karenge...!
router.route("/register").post(upload.single("avatar"), registerUser)

// for logging in the user[owner] and admin
router.route("/login").post(loginUser)


// for logging  [out]  the user
router.route("/logout").post(verifyJWT, logoutUser)

//for updating user data
router.route("/update-data").patch(upload.single("avatar"), verifyJWT, updateUserData)

// for updating the user password 
router.route("/update-password").patch(verifyJWT, updatePassword)


// >>>>>> forgot password start <<<<<<<<

// for sending otp
router.route("/sendOtp").post(verifyUserSendOtp)

// for verify otp on mail
router.route("/verifyOtp").post(verifyOtp)

// to reset password
router.route("/resetPwd").patch(resetPassword)

// >>>>>>> forgot password ends <<<<<<<<

// for registering the pet
router.route("/register-pet").post(verifyJWT, upload.single("avatar"), registerPet)

// for updating the pet data
router.route("/update-pet").patch(verifyJWT, upload.single("avatar"), updatePetData)


export default router