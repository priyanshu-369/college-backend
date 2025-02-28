import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"

import { asyncHandler }  from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"

import { Staff } from "../models/staff.model.js"
import { User } from "../models/user.model.js"




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

// update the staff data only by admin
const updateStaffData = asyncHandler(async (req, res) => {
    const { name, phone, password, profession, specialization, availableSlots } = req.body;
    const avatarLocalPath = req.file?.path;

    if (!name && !phone && !avatarLocalPath && !profession && !specialization  && !availableSlots && !password) {
        throw new ApiError(400, "At least one field is required to update");
    }

    const updateFields = {};
    if (name) {
        updateFields.name = name;
    }

    if(password){
        updateFields.password = password;
    }

    if (phone) {
        updateFields.phone = phone;
    }
    if (profession) {
        updateFields.profession = profession;
    }
    if (specialization) {
        updateFields.specialization = specialization;
    }
    if (experience) {
        updateFields.experience = experience;
    }
    if (availableSlots) {
        updateFields.availableSlots = availableSlots;
    }

    if (avatarLocalPath) {
        const avatar = await uploadOnCloudinary(avatarLocalPath);
        
        if (!avatar) {
            throw new ApiError(400, "Avatar file upload failed");
        }
        updateFields.avatar = avatar.url;
    }

    const updatedStaff = await Staff.findByIdAndUpdate(
        req.staff._id,
        { $set: updateFields },
        { new: true }
    ).select("-password -refreshToken");

    return res
    .status(200)
    .json(
        new ApiResponse(200, updatedStaff, "Staff data updated successfully")
    );
});

// delete the staff data only by admin
const deleteStaff = asyncHandler(async (req, res) => {
    const { staffId } = req.body;

    if (!staffId) {
        throw new ApiError(400, "Staff ID is required. ");
    }

    const staffDeleted = await Staff.findByIdAndDelete(staffId);

    if (!staffDeleted) {
        throw new ApiError(404, "Staff not found. ");
    }

    res
    .status(200)
    .json(
        new ApiResponse(200, staffDeleted, "Deleted Staff Successfully. ")
    );
})

// delete the user data only by admin
const deleteUser = asyncHandler(async (req, res) =>{
    const userId = req.body;

    if(!userId){
        throw new ApiError(400,"User Id is required.")
    }

    const userDeleted = await User.findByIdAndDelete(userId)

    if(!userDeleted){
        throw new ApiError(404, "User Not Found .")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, userDeleted, "User Deleted Successfully. ")
    )

})

// get all the user 
const viewAllUser = asyncHandler(async (req, res) => {

    const users = await User.find().select("-password -refreshToken"); 

    if (!users || users.length === 0) {
        throw new ApiError(404, "No users found.");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, users, "Users fetched successfully"));
});



// get all the staff
const viewAllStaff = asyncHandler(async (req, res) => {

    const staffMembers = await Staff.find().select("-password -refreshToken"); 

    if (!staffMembers || staffMembers.length === 0) {
        throw new ApiError(404, "No staff members found.");
    }

    const staffData = staffMembers.map(staff => ({
        fullName: staff.name,
        email: staff.email,
        phone: staff.phone,
        avatar: staff.avatar,
        profession: staff.profession,
        specialization: staff.specialization,
        qualification: staff.qualification
    }));

    return res
        .status(200)
        .json(new ApiResponse(200, staffData, "Staff members fetched successfully"));
});


// get all the appointments
const viewAllAppointments = asyncHandler( async(req, res) => {

})




export {
    registerStaff,
    updateStaffData,
    deleteStaff,
    deleteUser,
    viewAllUser,
    viewAllStaff,
    viewAllAppointments
}