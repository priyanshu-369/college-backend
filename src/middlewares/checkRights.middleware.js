import jwt from "jsonwebtoken"
import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { Staff } from "../models/staff.model.js"

export const verifyAdminJWT = asyncHandler ( async(req, res, next) =>{
try {
       const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
    
       if(!token){
        throw new ApiError(401, "Unauthorized request. Access token is missing. ")
       }
    
    //   niche user ke Access token ko decode karke ussme se _id nikalenge
       const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
       const user = await User.findById(decodedToken?._id).select(
        "-password -avatar -refreshToken -appointmentHistory"
        )
    
        if(!user){
            throw new ApiError(404, "User not found. Invalid access token.")
        }

        if(user.role !== "admin"){
            throw new ApiError(403, "Forbidden. Invalid Access for Admin Resource. ")
        }
    
        req.user = user;
        next()
} catch (error) {
      if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
         throw new ApiError(401, "Invalid or expired access token.");
      }
   throw new ApiError(500, error?.message || "Internal Server Error.")
}

})


// middleware to verify or authenticate the staff
export const verifyStaffJWT = asyncHandler( async(req, res, next) =>{
   try {
     const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
     
        if(!token){
         throw new ApiError(401, "Unauthorized request. Access token is missing. ")
        }
     
     //   niche staff ke Access token ko decode karke ussme se _id nikalenge
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
     
        const staff = await Staff.findById(decodedToken?._id)
        if(!staff){
         throw new ApiError(404, "Staff not found. Invalid Access token")
        }

         req.staff = staff;
         next()
   } catch (error) {
      if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
         throw new ApiError(401, "Invalid or expired access token.");
     }
     throw new ApiError(500, error?.message || "Internal Server Error.")
   }
})