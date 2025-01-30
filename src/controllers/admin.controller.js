import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"

import { asyncHandler }  from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"


// register or create doctor only by admin
const registerStaff = asyncHandler( async(req, res) => {

    res.send("running the register function. ")
})










export {
    registerStaff
}