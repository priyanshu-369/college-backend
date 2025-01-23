// yaha Router ko liya express se
import { Router } from "express";
import {upload} from "../middlewares/multer.middleware.js"
import { registerUser, loginUser, logoutUser } from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

//yaha router ka object banaya
const router = Router()

// agar [ /user/registerUser ] pe req aayega to hum user register karenge...!
router.route("/register").post(upload.single("avatar"), registerUser)

// for logging in the user[owner] and admin
router.route("/login").post(loginUser)


// for logging in the user
router.route("/logout").post(verifyJWT, logoutUser)





export default router