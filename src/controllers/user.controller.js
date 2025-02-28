
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"

import { Pet } from "../models/pet.model.js"
import { User } from "../models/user.model.js"
import { Appointment } from "../models/appointment.model.js" 
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

// capitalize first letter of fname & last name
function capitalizeFullName(fullName) {
    return fullName
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

// >>>>>>user part starts <<<<<<<

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
        throw new ApiError(400,"To short password, At least 8 character required. ")
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
                                phone,
                                
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

// update user data but only when user is valid..
const updateUserData = asyncHandler(async (req, res) => {
    const { fullName, phone } = req.body;
    const avatarLocalPath = req.file?.path;

    if (!fullName && !phone && !avatarLocalPath) {
        throw new ApiError(400, "At least one field is required to update");
    }

    const updateFields = {};
    if(fullName){
        updateFields.fullName = fullName;
    } 
        
    if(phone){
        updateFields.phone = phone;
    }

    if(avatarLocalPath) {
        const avatar = await uploadOnCloudinary(avatarLocalPath);
        
        if (!avatar) {
            throw new ApiError(400, "Avatar file upload failed");
        }
        updateFields.avatar = avatar.url;
    }

    const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        { $set: updateFields },
        { new: true }
    ).select("-password -refreshToken");

    return res
    .status(200)
    .json(
        new ApiResponse(200, updatedUser, "User data updated successfully")
    );
});

// updatePassword only if logged in
const updatePassword = asyncHandler( async(req, res) => {
    const {oldPassword, newPassword } = req.body;
    const userId = req.user._id;

    if(!oldPassword && !newPassword){
        new ApiError(400," Both fields are empty.")
    }

    if(!oldPassword || !newPassword){
        new ApiError(400," Fill both fields to procced.")
    }

    if(oldPassword === newPassword){
        throw new ApiError(401, "Given old password in new password field. ")
    }

    const isMatch = userId.isPasswordCorrect(oldPassword)
    if(!isMatch){
        throw new ApiError("Old password is incorrect. ")
    }

    userId.password = newPassword;
    await userId.save({ validateBeforeSave: false });

    return res.status(200).json(
        new ApiResponse(200, null, "Password updated successfully.")
    );
    
})

// forgot password and user logout , wantt to reset the password
const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString(); 
  };


const verifyUserSendOtp = asyncHandler( async(req, res) => {
    const { emailOrPhone } = req.body

    if(!emailOrPhone){
        throw new ApiError(400, "Email or phone not specified. ")
    }

    const user = await User.findOne({
        $or: [
            {
                email: emailOrPhone
            },
            {
                phone: emailOrPhone
            }
        ]
    })

    if(!user){
        throw new ApiError(404," User not found. ")
    }


    const otp = generateOtp();
    req.session.otp = otp;
    req.session.emailOrPhone = emailOrPhone;
  
    // Set session expiry to 5 minutes
    req.session.cookie.maxAge = 5 * 60 * 1000;
  
    const userEmail = user.email
    const userName = capitalizeFullName(user.fullName)

    await sendOtpMail(userEmail, userName, otp)
    // await sendMail(email, subject, userData);
    res.status(200).json(new ApiResponse(200, {}, 'Email verified and OTP sent.'));
  });


const verifyOtp = asyncHandler( async(req, res) => {
        const { emailOrPhone, userOtp } = req.body;
        
        const storedOtp = req.session.otp;
        const storedEmailOrPhone = req.session.emailOrPhone;
        
        if (!storedOtp || !storedEmailOrPhone) {
          throw new ApiError(400, 'OTP has expired or is not valid.');
        }
      
        // Clear OTP and email from session after use
        delete req.session.otp;
        delete req.session.emailOrPhone;
        
        if (userOtp !== storedOtp || emailOrPhone !== storedEmailOrPhone) {
          throw new ApiError(400, 'Invalid OTP or email.');
        }
      
        res.status(200).json(new ApiResponse(200, {}, 'OTP validated.'));
});

const resetPassword = asyncHandler(async (req, res, next) => {
    const { emailOrPhone, newPassword } = req.body;
  
    const user = await User.findOne({
        $or:[
            { email: emailOrPhone}, { phone: emailOrPhone}
        ]
     });

    if (!user) {
      throw new ApiError(400, 'Invalid email. Please retry with the correct email.');
    }
  
    user.password = newPassword;
    await user.save({ validateBeforeSave: false });
  
    res.status(200).json(new ApiResponse(200, {}, 'Password changed successfully.'));
  });
  
  

// >>>>>>>>>> user part ends <<<<<<<<<<<<<<<

// >>>>>>>>>> pet part starts <<<<<<<<<<<<<<
// now the pet data creation (if authorized user)
const registerPet = asyncHandler( async(req, res) => {
    const {petName, species, breed, age } = req.body;

    const ownerId = req.user._id

    if(
        [petName, species, breed, age].some((field) => field?.trim() === "")
    ){
        throw new ApiError(400,"All filed are required. ")
    }

    // image handling
    const petAvatarLocalPath = req.file?.path;
    // if(!petImageLocalPath){
    //     throw new ApiError(400, "Avatar file is required. ")
    // }

    // upload on cloudinary 
    const petAvatarImage = await uploadOnCloudinary(petAvatarLocalPath)

    const pet = await Pet.create({
        petName,
        breed,
        species,
        age,
        petAvatar: petAvatarImage.url || "https://www.shutterstock.com/blog/wp-content/uploads/sites/5/2018/12/Vectorize-Your-Pets-Featured-Image-01.jpg",
        owner:ownerId
    })
    
    if(!petCreated){
        throw new ApiError(500,"Something went wrong while registering the pet. ")
    }

    const petInfo = {
        petName: pet.petName,
        species: pet.species,
        breed: pet.breed,
        age: pet.age
    } 

    return res
    .status(201)
    .json(
        new ApiResponse(
            200,
            petInfo,
            "your pet register successfully horray!!!"
        )
    )

})


// now update pet data
const updatePetData = asyncHandler( async(req, res) => {

    const {petName, species, breed, age } = req.body;

    const ownerId = req.user._id
    const pet = await Pet.findById(ownerId)

    if(!pet){
        throw new ApiError(404,"pet infomation not found . ")
    }


    const petAvatarLocalPath = req.file?.path;

    if(!petName && !species && !breed && !age && !petAvatarLocalPath){
        throw new ApiError(400,"provide with fields to update")
    }

    if(petAvatarLocalPath){
        const petAvatarImage = await uploadOnCloudinary(petAvatarLocalPath)
    }
    
})

// >>>>>>>>>> pet part ends <<<<<<<<<<<<<<<


// >>>>> booking part starts  <<<<<<

const bookAppointment = asyncHandler(async (req, res) => {
    const { userId, petId, staffId, date, bookedSlot } = req.body;

    // Validate input data
    if (!userId && !petId && !staffId && !date && !bookedSlot) {
        throw new ApiError(400, "All fields are required.");
    }

    // Check if the user exists
    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Check if the pet exists and belongs to the user
    const pet = await Pet.findOne({ _id: petId, owner: userId });
    if (!pet) {
        throw new ApiError(404, "Pet not found or does not belong to the user");
    }

    // Check if the staff exists
    const staff = await Staff.findById(staffId);
    if (!staff) {
        throw new ApiError(404, "Staff not found");
    }

    // Convert the date to a day (e.g., "Monday")
    const appointmentDate = new Date(date);
    const dayOfWeek = appointmentDate.toLocaleString("en-US", { weekday: "long" }); // e.g., "Monday"

    // Check if the staff is available on the requested day
    const staffAvailability = staff.availableSlots.find(slot => slot.day === dayOfWeek);
    if (!staffAvailability) {
        throw new ApiError(400, `Staff is not available on ${dayOfWeek}`);
    }

    // Check if the requested time slot is available
    if (!staffAvailability.timeSlots.includes(bookedSlot)) {
        throw new ApiError(400, `Staff is not available at the requested time slot: ${bookedSlot}`);
    }

    // Check if the staff is already booked at the requested date and time slot
    const existingAppointment = await Appointment.findOne({
        staff: staffId,
        date: date,
        bookedSlot: bookedSlot,
        status: { $in: ["scheduled"] }, // Only check for scheduled appointments
    });

    if (existingAppointment) {
        throw new ApiError(400, "Staff is already booked at the requested time slot");
    }

    // Create the appointment
    const appointment = await Appointment.create({
        user: userId,
        staff: staffId,
        pet: petId,
        date: date,
        bookedSlot: bookedSlot,
        status: "scheduled", // Default status
    });

    if (!appointment) {
        throw new ApiError(500, "Failed to book appointment");
    }

    // Return the created appointment
    return res
        .status(201)
        .json(new ApiResponse(201, appointment, "Appointment booked successfully"));
});

const updateBookingStatus  = asyncHandler( async(req, res)=>{
    const userId = req.user._id;
    const appointmentId = req.body.appointmentId; // Assuming appointmentId is passed as a route parameter

    try {
        const appointment = await Appointment.findOne({
            _id: appointmentId,
            user: userId,
        });

        if (!appointment) {
            throw new ApiError(404, "Appointment not found or not authorized.");
        }

        if (appointment.bookingStatus === 'cancelled') {
            throw new ApiError(400, "Appointment is already cancelled.");
        }

        appointment.bookingStatus = 'cancelled';
        await appointment.save();

        res.status(200).json({
            success: true,
            message: "Appointment cancelled successfully.",
            data: appointment,
        });
    } catch (error) {
        if (error instanceof ApiError) {
            res.status(error.statusCode).json({
                success: false,
                message: error.message,
            });
        } else {
            // Handle other errors (e.g., database errors)
            console.error("Error cancelling appointment:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error.",
            });
        }
    }
});




export  {
    registerUser,
    loginUser,
    logoutUser,
    updateUserData,
    updatePassword,
    verifyUserSendOtp,
    verifyOtp,
    resetPassword,
    registerPet,
    updatePetData,
    bookAppointment
}