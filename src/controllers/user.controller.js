
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"

import { User } from "../models/user.model.js"
import { asyncHandler }  from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { sendRegistrationMail, sendOtpMail } from "../utils/mailerservice.js"

// below the register user logic
const registerUser = asyncHandler ( async(req, res) => {

    /*  step 1. get user details
        step 2. get the validations check
        step 3. check if user already exist : email and phone
        step 4. check for images, check for avatar
        step 5. upload to cloudinary, avatar
        step 6. create user object - create entry in the DB
        step 7. remove password and refreshtoken field
        step 8.return resopnse using res
    */
    const {fullName, email, phone, password, role } = req.body

    if(
        [fullName, email, phone, password ].some((field) => field?.trim() === "")
    ){
        throw new ApiError(400,"All fields are required");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if(!emailRegex.test(email)){
        throw new ApiError(400,"Invalid email format. ")
    }

    if(password.length < 8){
        throw new ApiError(400,"Password is incorrect. ")
    }

    // checking before that the user with same email not exist, so to create new
    const userExist = await User.findOne(
        {$or:[{email}, {phone}]
    })
        
    if(userExist){
        throw new ApiError(409, "User with same email or phone already exist. ")
    }
    console.log(req.file)
    const avatarLocalPath = req.file?.path;
   
    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required. ")
    }

    // upload on cloudinary 
    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar){
        throw new ApiError(400, "Avatar file is required for clodinary. ")
    }

    const user = await User.create({
                                fullName,
                                email,
                                avatar: avatar.url,
                                password,
                                phone,
                                role
                            }) 

    const userCreated = await User.findById(user._id).select(
        "-password -refreshToken -appointmentHistory"
    )
    
    if(!userCreated){
        throw new ApiError(500,"Something unexpected happened while registering the user.")
    }

    function capitalizeFullName(fullName) {
        return fullName
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }
    
    const username = capitalizeFullName(userCreated.fullName);
    const mailToUser = userCreated.email
    sendRegistrationMail(mailToUser, username)


    return res.status(201).json(
        new ApiResponse(200, userCreated ,"User registered successfully. ")
    )
})


const loginUser = asyncHandler ( async (req, res))







export  {
    registerUser
}