import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"

import { asyncHandler }  from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"

import { Staff } from "../models/staff.model.js"
import { User } from "../models/user.model.js"
import { Appointment } from "../models/appointment.model.js"





// register or create doctor only by admin
// const registerStaff = asyncHandler( async(req, res) => {

//     const {name, email, phone, password, profession, specialist,description , availableSlots} = req.body
    
//         if(
//             [name, email, phone, password, profession, specialist,description , availableSlots  ].some((field) => field?.trim() === "")
//         ){
//             throw new ApiError(400,"All fields are required");
//         }
    
//         const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//         if(!emailRegex.test(email)){
//             throw new ApiError(400,"Invalid email format. ")
//         }
    
//         if(password.length < 8){
//             throw new ApiError(400,"To short password, At least 8 character required. ")
//         }
    
//         // checking before that the staff with same email not exist, so to create new
//         const staffExist = await Staff.findOne({email})
            
//         if(staffExist){
//             throw new ApiError(409, "User with same email already exist. ")
//         }
    
//         const staffAvatarLocalPath = req.file?.path
//         if(!staffAvatarLocalPath){
//             throw new ApiError(400, "Avatar file is required. ")
//         }
    
//         // upload on cloudinary 
//         const staffAvatar = await uploadOnCloudinary(staffAvatarLocalPath)
    
//         if(!staffAvatar){
//             throw new ApiError(400, "Avatar file is required for clodinary. ")
//         }
    
//         const staff = await Staff.create({
//                                     name,
//                                     email,
//                                     avatar: staffAvatar.url,
//                                     password,
//                                     phone,
//                                     profession,
//                                     specialist,
//                                     description,
//                                     availableSlots
                                    
//                                 }) 
    
        
       
    
//         const staffCreated = {
//             name: staff.name,
//             email: staff.email,
//             phone: staff.phone,
//             avatar: staff.avatar,
//             profession: staff.profession,
//             specialist: staff.specialist,
//             availableSlots: staff.availableSlots
//         }
        
//         if(!staffCreated){
//             throw new ApiError(500,"Something unexpected happened while registering the user.")
//         }
    
    
//         return res.status(201).json(
//             new ApiResponse(200, staffCreated ,"User registered successfully. ")
//         )
// })

 const getAdminOverview = asyncHandler(async (req, res) => {
    const user = req.user;
  
    res.status(200).json({
      success: true,
      message: "Admin overview fetched successfully",
      data: {
        fullName: user.fullName,
        email: user.email,
        contactNumber: user.contactNumber,
        role: user.role,
      },
    });
  });
  

const registerStaff = asyncHandler(async (req, res) => {
    const { name, email, phone, password, profession, specialization, description, fee} = req.body;

    // Try parsing `availableSlots` to ensure it is an array
    let availableSlots;
    try {
        availableSlots = JSON.parse(req.body.availableSlots);
        
        // Check if it's an array
        if (!Array.isArray(availableSlots)) {
            throw new Error();
        }

        // Validate each slot entry
        availableSlots.forEach(slot => {
            if (!slot.day || !Array.isArray(slot.timeSlots) || slot.timeSlots.length === 0) {
                throw new Error();
            }
        });
    } catch (error) {
        return res.status(400).json({ message: "Invalid availableSlots format. Must be an array with day and timeSlots." });
    }

    // Ensure all fields are present
    if ([name, email, phone, password, profession, specialization, description].some(field => field?.trim() === "") || !availableSlots.length) {
        throw new ApiError(400, "All fields are required, including availableSlots.");
    }

    // Validate Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new ApiError(400, "Invalid email format.");
    }

    // Validate Password Length
    if (password.length < 8) {
        throw new ApiError(400, "Password must be at least 8 characters.");
    }

    // Check for existing staff by email
    const staffExist = await Staff.findOne({ email });
    if (staffExist) {
        throw new ApiError(409, "User with the same email already exists.");
    }

    const feeNum = parseFloat(fee);
    if (isNaN(feeNum) || feeNum < 0) {
      throw new ApiError(400, "Fee is required and must be a positive number");
    }

    // Handle Avatar Upload with Multer
    const staffAvatarLocalPath = req.file?.path;
    if (!staffAvatarLocalPath) {
        throw new ApiError(400, "Avatar file is required.");
    }

    const staffAvatar = await uploadOnCloudinary(staffAvatarLocalPath);
    if (!staffAvatar) {
        throw new ApiError(400, "Error uploading avatar to Cloudinary.");
    }

    // Create Staff Entry
    const staff = await Staff.create({
        name,
        email,
        avatar: staffAvatar.url,
        password,
        phone,
        profession,
        specialization,
        description,
        availableSlots, // Already parsed and validated
        fee: feeNum
    });

    const staffCreated = {
        name: staff.name,
        email: staff.email,
        phone: staff.phone,
        avatar: staff.avatar,
        profession: staff.profession,
        specialization: staff.specialization,
        fee: staff.fee,
        availableSlots: staff.availableSlots
    };

    if (!staffCreated) {
        throw new ApiError(500, "Something unexpected happened while registering the user.");
    }

    return res.status(201).json(new ApiResponse(200, staffCreated, "User registered successfully."));
});


// update the staff data only by admin
const updateStaffData = asyncHandler(async (req, res) => {
    const { staffId, name, phone, password, profession, specialization, availableSlots, fee } = req.body;
    const avatarLocalPath = req.file?.path;

    if (!staffId) {
        throw new ApiError(400, "Staff ID is required for update");
    }

    if (!name && !phone && !avatarLocalPath && !profession && !specialization && !availableSlots && !password && typeof fee === "undefined") {
        throw new ApiError(400, "At least one field is required to update");
    }

    const updateFields = {};
    if (name) updateFields.name = name;
    if (password) updateFields.password = password;
    if (phone) updateFields.phone = phone;
    if (profession) updateFields.profession = profession;
    if (specialization) updateFields.specialization = specialization;
   
    let parsedSlots = [];

if (availableSlots) {
  try {
    parsedSlots = JSON.parse(availableSlots);
    updateFields.availableSlots = parsedSlots;
  } catch (err) {
    throw new ApiError(400, "Invalid format for availableSlots");
  }
}

    if (typeof fee !== "undefined") {
        const feeNum = parseFloat(fee);
        if (isNaN(feeNum) || feeNum < 0) {
            throw new ApiError(400, "Fee must be a positive number");
        }
        updateFields.fee = feeNum;
    }

    if (avatarLocalPath) {
        const avatar = await uploadOnCloudinary(avatarLocalPath);
        if (!avatar) {
            throw new ApiError(400, "Avatar file upload failed");
        }
        updateFields.avatar = avatar.url;
    }

    const updatedStaff = await Staff.findByIdAndUpdate(
        staffId,
        { $set: updateFields },
        { new: true }
    ).select("-password -refreshToken");

    return res
        .status(200)
        .json(new ApiResponse(200, updatedStaff, "Staff data updated successfully"));
});


// delete the staff data only by admin
const deleteStaffNon = asyncHandler(async (req, res) => {
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

const deleteStaff = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    throw new ApiError(400, "Staff ID is required.");
  }

  const staff = await Staff.findByIdAndDelete(id);

  if (!staff) {
    throw new ApiError(404, "Staff not found.");
  }

  return res.status(200).json(
    new ApiResponse(200, null, "Staff deleted successfully.")
  );
});


// delete the user data only by admin

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

const listUsers = async (req, res) => {
    try {
      const { name } = req.query;
  
      let query = {};
  
      // If name is provided, use regex to search similar names (case-insensitive)
      if (name) {
        query.name = { $regex: name, $options: "i" };
      }
  
      const users = await User.find(query).sort({ createdAt: -1 }); // Most recent first
  
      if (users.length === 0) {
        return res.status(404).json({ message: "No matching users found." });
      }
  
    //   res.status(200).json({ users }); parsing error may oocur bhai
      res.status(200).json({ data: users });

    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Server error while fetching users." });
    }
  };
  
  /**
   * DELETE /admin/user/:id
   * Delete a user by ID.
   */
  const deleteUser = asyncHandler(async (req, res) => {
    
    const { id } = req.params;
    

    const user = await User.findByIdAndDelete(id);
  
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
  
    return res
      .status(200)
      .json(new ApiResponse(200, null, 'User deleted successfully'));
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
        qualification: staff.qualification,
        fee: staff.fee
    }));

    return res
        .status(200)
        .json(new ApiResponse(200, staffData, "Staff members fetched successfully"));
});


// get all the appointments
const viewAllAppointments = asyncHandler(async (req, res) => {
    // Fetch & populate
    const appts = await Appointment.find()
      .populate("user", "fullName email")
      .populate("staff", "name specialization")
      .populate("pet", "petName species")
      .sort({ date: -1 }); // newest first
  
    // If none, return empty array
    if (!appts.length) {
      return res
        .status(200)
        .json(new ApiResponse(200, [], "No appointments found"));
    }
  
    // Format for frontend
    const data = appts.map(a => ({
      _id: a._id,
      date: a.date,
      slot: a.bookedSlot,
      status: a.status,
      userName: a.user.fullName,
      userEmail: a.user.email,
      staffName: a.staff.name,
      staffSpec: a.staff.specialization,
      petName: a.pet.petName,
      petSpecies: a.pet.species
    }));
  
    return res
      .status(200)
      .json(new ApiResponse(200, data, "All appointments fetched successfully"));
  });

// Controller: getAppointmentsByUser
const getAppointmentsByUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  console.log(id)
  const appts = await Appointment.find({ user: id })
    .populate("user", "fullName email")
    .populate("staff", "name specialization")
    .populate("pet", "petName species")
    .sort({ date: -1 });

  if (!appts.length) {
    return res
      .status(200)
      .json(new ApiResponse(200, [], "No appointments found for this user."));
  }

  const data = appts.map(a => ({
    _id: a._id,
    date: a.date,
    slot: a.bookedSlot,
    status: a.status,
    userName: a.user.fullName,
    userEmail: a.user.email,
    staffName: a.staff.name,
    staffSpec: a.staff.specialization,
    petName: a.pet.petName,
    petSpecies: a.pet.species
  }));

  return res
    .status(200)
    .json(new ApiResponse(200, data, "User appointments fetched successfully"));
});



  const deleteAppointment = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const appt = await Appointment.findByIdAndDelete(id);
    if (!appt) {
      throw new ApiError(404, "Appointment not found");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, null, "Appointment deleted successfully"));
  });

export {
    registerStaff,
    updateStaffData,
    deleteStaff,
    deleteUser,
    deleteStaffNon,
    viewAllUser,
    viewAllStaff,
    viewAllAppointments,
    listUsers,
    deleteAppointment,
    getAdminOverview,
    getAppointmentsByUser
    
}