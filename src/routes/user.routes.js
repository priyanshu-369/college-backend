// yaha Router ko liya express se
import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"


//yaha router ka object banaya
const router = Router()

// agar [ /user/registerUser ] pe req aayega to hum user register karenge...!
router.route("/register").post(upload.single("avatar"), registerUser)








export default router