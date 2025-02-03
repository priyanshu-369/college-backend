import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"

import { asyncHandler }  from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"

import { Staff } from "../models/staff.model.js"




// register or create doctor only by admin
const registerStaff = asyncHandler( async(req, res) => {

    const {name, email, phone, password, profession, specialist, experience, availableSlots} = req.body
    
        if(
            [name, email, phone, password, profession, specialist, experience, availableSlots  ].some((field) => field?.trim() === "")
        ){
            throw new ApiError(400,"All fields are required");
        }
    
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if(!emailRegex.test(email)){
            throw new ApiError(400,"Invalid email format. ")
        }
    
        if(password.length < 8){
            throw new ApiError(400,"To short password, At least 8 character required. ")
        }
    
        // checking before that the staff with same email not exist, so to create new
        const staffExist = await Staff.findOne({email})
            
        if(staffExist){
            throw new ApiError(409, "User with same email or phone already exist. ")
        }
    
        const staffAvatarLocalPath = req.file?.path
        if(!staffAvatarLocalPath){
            throw new ApiError(400, "Avatar file is required. ")
        }
    
        // upload on cloudinary 
        const staffAvatar = await uploadOnCloudinary(staffAvatarLocalPath)
    
        if(!staffAvatar){
            throw new ApiError(400, "Avatar file is required for clodinary. ")
        }
    
        const staff = await Staff.create({
                                    name,
                                    email,
                                    avatar: staffAvatar.url,
                                    password,
                                    phone,
                                    profession,
                                    specialist,
                                    experience,
                                    availableSlots
                                    
                                }) 
    
        
       
    
        const staffCreated = {
            name: staff.name,
            email: staff.email,
            phone: staff.phone,
            avatar: staff.avatar,
            profession: staff.profession,
            specialist: staff.specialist,
            availableSlots: staff.availableSlots
        }
        
        if(!staffCreated){
            throw new ApiError(500,"Something unexpected happened while registering the user.")
        }
    
    
        return res.status(201).json(
            new ApiResponse(200, staffCreated ,"User registered successfully. ")
        )
})


  










export {
    registerStaff
}