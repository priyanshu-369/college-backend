
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"
import { Staff } from "../models/staff.model.js"
import { Pet } from "../models/pet.model.js"
import { User } from "../models/user.model.js"
import { Appointment } from "../models/appointment.model.js" 
import { asyncHandler }  from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { sendRegistrationMail, sendOtpMail } from "../utils/mailerservice.js"
import  redis  from "../db/redisdb.js"
import { Payment } from "../models/payment.model.js"



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
    // const userExistMail = await User.findOne(
    //     {$or:[{email}, {phone}]
    // })

    const userExistMail = await User.findOne({email})

        
    if(userExistMail){
        throw new ApiError(409, "User with same email already exist. ")
    }

    const userExistPhone = await User.findOne({phone})
    if(userExistPhone){
        throw new ApiError(409, "User with same phone no. already exist. ")
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
const loginUser = asyncHandler(async (req, res) => {
    const { emailOrPhone, password } = req.body;

    console.log("inside login");
    if (!emailOrPhone?.trim() || !password?.trim()) {
        throw new ApiError(400, "Email/Phone and Password required");
    }

    console.log("Login Attempt:", emailOrPhone, password);

    const userExist = await User.findOne({
        $or: [{ email: emailOrPhone }, { phone: emailOrPhone }]
    });

    if (!userExist) {
        throw new ApiError(404, "User with Email or Phone not Found.");
    }

    const userVerified = await userExist.isPasswordCorrect(password);

    if (!userVerified) {
        throw new ApiError(400, "Password incorrect.");
    }

    console.log("User Verified!");

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(userExist._id);

    const loggedInUser = await User.findById(userExist._id).select("-password -refreshToken -appointmentHistory -role");

    const options = {
        httpOnly: true,
        secure: true,
        sameSite: "None",
        path: "/"
    };

    res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200, { user: loggedInUser, accessToken, refreshToken }, "User logged in successfully!!"));

    console.log("Cookies Set Successfully!");
});


// user logout logic
const logoutUser = asyncHandler(async (req, res) => {
    if (!req.user?._id) {
        return res.status(401).json(new ApiResponse(401, null, "Unauthorized request!"));
    }

   
    // await User.findByIdAndUpdate(req.user._id, {
    //     $set: { refreshToken: undefined }
    // });

    const loggedoutUser = await User.findByIdAndUpdate(req.user._id, {
        $unset: { refreshToken: "" } // ✅ Proper way to remove a field
    });

    if(!loggedoutUser){
        console.log('not dleted')
    }

    
    const options = {
        httpOnly: true,
        sameSite: "None",
        path: "/",
        secure: process.env.NODE_ENV === "production", // ✅ Secure only in production
    };

    res
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .status(200)
        .json(new ApiResponse(200, null, "User logged out successfully!"));

    console.log("User logged out, cookies cleared!");
});


// update user data but only when user is valid..
const updateUserData = asyncHandler(async (req, res) => {
    const { fullName, phone } = req.body;
    console.log(req.body)
    const avatarLocalPath = req.file?.path;

    if (!fullName && !phone && !avatarLocalPath) {
        throw new ApiError(400, "At least one field is required to update");
    }

    const updateFields = {};
    
    if (fullName) {
        updateFields.fullName = fullName;
    } 

    if (phone) {
        const userExistPhone = await User.findOne({ phone });

        if (userExistPhone && userExistPhone._id.toString() !== req.user._id.toString()) {
            throw new ApiError(409, "User with the same phone number already exists.");
        }

        updateFields.phone = phone;  // ✅ Moved outside the if block
    }

    if (avatarLocalPath) {
        const avatar = await uploadOnCloudinary(avatarLocalPath);
        
        if (!avatar) {
            throw new ApiError(400, "Avatar file upload failed");
        }
        
        updateFields.avatar = avatar.url;
    }

    // Ensure the user ID is available
    if (!req.user || !req.user._id) {
        throw new ApiError(401, "Unauthorized access, please log in again.");
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
const updatePassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user._id;
  
    // Find the user by their ID
    const user = await User.findById(userId);
  
    // Validate input fields (throwing errors if conditions are not met)
    if (!oldPassword && !newPassword) {
      throw new ApiError(400, "Both fields are empty.");
    }
    if (!oldPassword || !newPassword) {
      throw new ApiError(400, "Fill both fields to proceed.");
    }
    if (oldPassword === newPassword) {
      throw new ApiError(401, "New password cannot be the same as the old password.");
    }
  
    // Verify the old password is correct
    const isMatch = user.isPasswordCorrect(oldPassword);
    if (!isMatch) {
      throw new ApiError(401, "Old password is incorrect.");
    }
  
    // Set the new password on the user instance (not on userId)
    user.password = newPassword;
    await user.save({ validateBeforeSave: false });
  
    return res.status(200).json(
      new ApiResponse(200, null, "Password updated successfully.")
    );
  });
  

  // Function to generate OTP using date-time randomness
  const generateOtp = () => {
    const now = new Date();
    const dateTimeString =
      now.getFullYear().toString().slice(-2) +
      String(now.getMonth() + 1).padStart(2, "0") +
      String(now.getDate()).padStart(2, "0") +
      String(now.getHours()).padStart(2, "0") +
      String(now.getMinutes()).padStart(2, "0");
  
    let otp = "";
    for (let i = 0; i < 5; i++) {
      const randomIndex = Math.floor(Math.random() * dateTimeString.length);
      const randomDigit = Math.floor(Math.random() * 10);
      otp += Math.random() < 0.5 ? dateTimeString[randomIndex] : randomDigit;
    }
    return otp;
  };
  
  // Send OTP and store in Redis
  const verifyUserSendOtp = asyncHandler(async (req, res) => {
    const { contact } = req.body;
  
    if (!contact) {
      throw new ApiError(400, "Email or phone not specified.");
    }
  
    const user = await User.findOne({
      $or: [{ email: contact }, { phone: contact }],
    });
  
    if (!user) {
      throw new ApiError(404, "User not found.");
    }
  
    const otp = generateOtp();
    const expiresIn = 3000; 
  
    // Store OTP in Redis with expiration time
    await redis.setex(`otp:${contact}`, expiresIn, otp);
  
    const userEmail = user.email;
    const userName = user.fullName; // Assuming fullName exists
  
    await sendOtpMail(userEmail, userName, otp);
  
    res.status(200).json(
      new ApiResponse(200, {}, "OTP sent successfully. Please check your inbox.")
    );
  });
  
  // Verify OTP using Redis
const verifyOtp = asyncHandler(async (req, res) => {
    const { contact, userOtp } = req.body;
  
    if (!contact || !userOtp) {
      throw new ApiError(400, "Contact and OTP are required.");
    }
  
    // Retrieve OTP from Redis
    const storedOtp = await redis.get(`otp:${contact}`);
  
    if (!storedOtp) {
      throw new ApiError(400, "OTP has expired or is not valid.");
    }
  
    if (userOtp !== storedOtp) {
      throw new ApiError(400, "Invalid OTP.");
    }
  
    // Delete OTP from Redis after successful verification
    await redis.del(`otp:${contact}`);
  
    res.status(200).json(new ApiResponse(200, {}, "OTP validated."));
  });
  
  // Reset password after OTP verification
const resetPassword = asyncHandler(async (req, res) => {
    const { contact, newPassword } = req.body;
  
    if (!contact || !newPassword) {
      throw new ApiError(400, "Contact and new password are required.");
    }
  
    const user = await User.findOne({
      $or: [{ email: contact }, { phone: contact }],
    });
  
    if (!user) {
      throw new ApiError(
        400,
        "Invalid email or phone. Please retry with the correct details."
      );
    }
  
    // Update password (assuming password hashing is handled in the model)
    user.password = newPassword;
    await user.save({ validateBeforeSave: false });
  
    res.status(200).json(new ApiResponse(200, {}, "Password changed successfully."));
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
    
    if(!pet){
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

// get the pet data
const getPetData = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const pets = await Pet.find({ owner: userId }).populate('owner', 'name email');

  if (!pets || pets.length === 0) {
    throw new ApiError(404, "No pets found for this user.");
  }

  const petInfo = pets.map(pet => ({
    _id: pet._id, // Needed by frontend to use as option value
    petName: pet.petName,
    species: pet.species,
    breed: pet.breed,
    age: pet.age,
    petAvatar: pet.petAvatar,
    owner: pet.owner,
  }));

  return res.status(200).json(
    new ApiResponse(200, petInfo, "Pet details retrieved successfully.")
  );
});



const updatePetData = asyncHandler(async (req, res) => {
    const { petName, species, breed, age } = req.body;
    const ownerId = req.user._id;
  
    // Use findOne to locate a single pet associated with the ownerId.
    const pet = await Pet.findOne({ owner: ownerId });
  
    if (!pet) {
      throw new ApiError(404, "Pet information not found.");
    }
  
    // Get the local file path for the pet avatar, if uploaded
    const petAvatarLocalPath = req.file?.path;
  
    // Validate that at least one update field is provided.
    if (!petName && !species && !breed && !age && !petAvatarLocalPath) {
      throw new ApiError(400, "Provide at least one field to update.");
    }
  
    // If there's a new pet avatar, upload it and update pet.petAvatar.
    if (petAvatarLocalPath) {
      const petAvatarImage = await uploadOnCloudinary(petAvatarLocalPath);
      pet.petAvatar = petAvatarImage?.url || pet.petAvatar;
    }
  
    // Update the pet details if provided.
    if (petName) pet.petName = petName;
    if (species) pet.species = species;
    if (breed) pet.breed = breed;
    if (age) pet.age = age;
  
    // Save the updated pet details to the database.
    const updatedPet = await pet.save();
  
    // Return the updated pet data with a success response.
    res.status(200).json(
      new ApiResponse(200, updatedPet, "Pet data updated successfully.")
    );
  });
  

  const getPetsByOwnerId = asyncHandler(async (req, res) => {
    const { id } = req.params;
    console.log(id+"hello")
    const ownerId  = id;

    
    const pets = await Pet.find({ owner: ownerId }).populate("owner", "fullName email phone");
  
    if (!pets.length) {
      return res.status(404).json(new ApiResponse(404, [], "No pets found for this owner"));
    }
  
    const formatted = pets.map(pet => ({
      _id: pet._id,
      petName: pet.petName,
      age: pet.age,
      breed: pet.breed,
      species: pet.species,
      image: pet.petAvatar,
      ownerName: pet.owner?.fullName || "N/A",
      ownerEmail: pet.owner?.email || "N/A",
      ownerPhone: pet.owner?.phone || "N/A"
    }));
  
    return res.status(200).json(new ApiResponse(200, formatted, "Pets fetched successfully"));
  });
  
// >>>>>>>>>> pet part ends <<<<<<<<<<<<<<<


// >>>>> booking part starts  <<<<<<



const getUserPayments = asyncHandler(async (req, res) => {
  const payments = await Payment
    .find({ user: req.user._id })
    .populate({
      path: "appointment",
      populate: { path: "staff", select: "name profession specialization" }
    })
    .sort({ createdAt: -1 });

  res.status(200).json(new ApiResponse(200, payments, "Payments fetched."));
});

const getAllAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate("user", "fullName")
      .populate("staff", "fullName")
      .populate("pet", "name")
      .sort({ date: -1 }); // latest first

    res.status(200).json(appointments);
  } catch (error) {
    console.error("Error fetching appointments:", error);
    res.status(500).json({ message: "Failed to fetch appointments" });
  }
};


export  {
    registerUser,
    loginUser,
    logoutUser,
    updateUserData,
    updatePassword,
    verifyUserSendOtp,
    verifyOtp,
    getPetData,
    resetPassword,
    registerPet,
    updatePetData,
    getUserPayments,
    getAllAppointments,
    getPetsByOwnerId
}