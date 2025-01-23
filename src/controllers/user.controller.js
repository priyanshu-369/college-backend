
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"

import { User } from "../models/user.model.js"
import { asyncHandler }  from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { sendRegistrationMail, sendOtpMail } from "../utils/mailerservice.js"


// method to generate the accesstoken and the refresh token
const generateAccessAndRefreshTokens = async(userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave: true})

        return {accessToken, refreshToken}

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access and refresh token")
    }
}





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
    const {fullName, email, phone, password} = req.body

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
                                phone
                            }) 

    
    
      /* below meinne ek unwanted db call mara jo jaaruri nahi isse karne ka tarika dusra hai 
        const userCreated = await User.findById(user._id).select(
        "-password -refreshToken -appointmentHistory"
     ) */

    const userCreated = {
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        role: user.role
    }
    
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


// user login logic
const loginUser = asyncHandler ( async (req, res) =>{

    const{ emailOrPhone , password } = req.body;

    if(
        [ emailOrPhone, password ].some( (field)=> field?.trim() === "")
    ){
        throw new ApiError(400,"Fill the empty fields. ")
    }

    const userExist = await User.findOne({
        $or: [{email : emailOrPhone }, {phone: emailOrPhone}]
    })

    if(!userExist){
        throw new ApiError(400, "email or phone is required")
    }

    const userVerified = await userExist.isPasswordCorrect(password)

    if(!userVerified){
            throw new ApiError(400,"password incorrect. ")
        }

    const { accessToken , refreshToken} = await generateAccessAndRefreshTokens(userExist._id)

    const loggedInUser = await User.findById(userExist._id).select( "-password -avatar -refreshToken -appointmentHistory -role")

    const options = {
        httpOnly: true,
        secure: true,
    }

    return res
    .status(200)
    .cookie("accessToken",accessToken, options)
    .cookie("refreshToken",refreshToken, options)
    .json(
        new ApiResponse(
            200,
            { 
                user: loggedInUser, accessToken, refreshToken
            },
            "user loggedIn successfully!!"
        )
    )
})

// user logout logic
const logoutUser = asyncHandler( async(req, res) =>{
    // yaha middleware lagana hoga anane se pehle

    const userLogout = await User.findByIdAndUpdate(
        req.user._id, 
    {
        $set: {
            refreshToken: undefined
        }
    })  

    const options = {
        httpOnly: true,
        secure: true,
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse(200, null, "user logged out!!")
    )
   

})







export  {
    registerUser,
    loginUser,
    logoutUser
}