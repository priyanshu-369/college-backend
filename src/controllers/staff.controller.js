
import { User } from "../models/user.model.js"
import { Staff } from "../models/staff.model.js"
import ApiResponse  from "../utils/ApiResponse.js"
import ApiError  from "../utils/ApiError.js"
import { asyncHandler }  from "../utils/asyncHandler.js"
import { Appointment } from "../models/appointment.model.js"


// here generate access token and refresh token
const generateAccessAndRefreshTokens = async(staffId) =>{
    try {
        const staff = await Staff.findById(staffId)
        const accessToken = staff.generateAccessToken()
        const refreshToken = staff.generateRefreshToken()

        staff.refreshToken = refreshToken;
        await staff.save({validateBeforeSave: true})

        return {accessToken, refreshToken}

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access and refresh token")
    }
}

// login staff using the staff level access
const loginStaff = asyncHandler ( async (req, res) =>{

    const{ emailOrPhone , password } = req.body;

    if(
        [ emailOrPhone, password ].some( (field)=> field?.trim() === "")
    ){
        throw new ApiError(400,"Fill the empty fields. ")
    }

    const staffExist = await Staff.findOne({
        $or: [{email : emailOrPhone }, {phone: emailOrPhone}]
    })


    if(!staffExist){
        throw new ApiError(400, "email or phone is required")
    }

    const staffVerified = await staffExist.isPasswordCorrect(password)

    if(!staffVerified){
            throw new ApiError(400,"password incorrect. ")
        }

    const { accessToken , refreshToken} = await generateAccessAndRefreshTokens(staffExist._id)

    const loggedInStaff = await Staff.findById(staffExist._id).select( "-password -avatar -refreshToken")

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
                staff: loggedInStaff, accessToken, refreshToken
            },
            "staff loggedIn successfully!!"
        )
    )
})


// logging out the staff
const logoutStaff = asyncHandler( async(req, res) =>{
    const staffLogout = await User.findByIdAndUpdate(
        req.staff._id, 
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
        new ApiResponse(200, null, "Staff logged out!!")
    )
   
})

// getting all the completed appointments by staff
const checkTotalCompletedAppointments = asyncHandler ( async(req, res) =>{

    /* steps to fecth the appointment request
        step 1 get the staff id using the middleware
        step 2 filter all the appointments having the staff_id matching to this
        step 3 filter them that are scheduled 
        step 4.0 fetch the details to todays appointment booking 
        step 4.1 data to shown [petname] {petavatar} [petspecies] [petbreed] [username] [status of appointment]
        */ 
        const staffId = req.staff._id;

        const allCompletedAppointmentsByStaff = await Appointment.aggregate([
            {
              $match: {
                staff: staffId,
                status: "completed"
              }
            },
            {
              $sort: {
                date: -1 // Sort by date in descending order (latest first)
              }
            },
            {
              $lookup: {
                from: "users",
                localField: "user",
                foreignField: "_id",
                as: "userDetails"
              }
            },
            {
              $unwind: "$userDetails"
            },
            {
              $project: {
                _id: 1,
                userEmail: "$userDetails.email",
                userName: "$userDetails.fullName",
                appointmentDate: "$date",
                appointmentTime: "$bookedSlot",
                status: "$status"
              }
            }
          ]);
        
          
          return res
          .status(200)
          .json(new ApiResponse(200, allCompletedAppointmentsByStaff, "appointments completed by staff .."))
})


// getting all scheduled appointments for staff
const checkTotalScheduledAppointments = asyncHandler ( async(req, res) => {
    const staffId = req.staff._id;

    const allScheduledAppointmentsForStaff = await Appointment.aggregate([
        {
            $match: {
                staff: staffId,
                status: "scheduled"
            }
        },
        {
            $sort: {
                date: -1
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "user",
                foreignField: "_id",
                as: "userDetails"
            }
        },
        {
            $unwind: "$userDetails"
        },
        {
            $project: {
                userEmail : "$userDetails.email",
                userName: "$userDetails.fullName",
                appointmentDate: "$date",
                appointmentTime: "$bookedSlot"
            }
        }
    ])

    return res
    .status(200)
    .json(new ApiResponse(200, allScheduledAppointmentsForStaff, "appointments scheduled for staff.."))

})

// check todays scheduled appointments for staff
const checkTodaysAppointments = asyncHandler( async(req, res) => {
    
    const staffId = req.staff._id;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of today

    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0); // Set to start of tomorrow

    const todaysScheduledAppointmentsForStaff = await Appointment.aggregate([
        {
            $match: {
                staff: staffId,
                status: "scheduled",
                date: { $gte: today, $lt: tomorrow } // Filter for today's date
            }
        },
        {
            $sort: {
                date: 1 //  acesdding order (oldest first) mien hoga
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "user",
                foreignField: "_id",
                as: "userDetails"
            }
        },
        {
            $unwind: "$userDetails"
        },
        {
             $project: {
                _id: 1,
                userEmail: "$userDetails.email",
                userName: "$userDetails.fullName",
                appointmentDate: "$date",
                appointmentTime: "$bookedSlot",
                status: "$status"
    }
  }
]);

        return res
        .status(200)
        .json( new ApiResponse(200, todaysScheduledAppointmentsForStaff, "Todays scheduled appointments for staff.."));

})

//[ completed ]  marking the todays appointment
const updateApointmentStatus = asyncHandler( async(req, res) => {
    const staffId = req.staff._id;

        const { timeSlot , appointmentId } = req.body;
    
        // Get today's date
        const today = new Date();
        today.setHours(0, 0, 0, 0);
    
        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
    
        const result = await Appointment.updateOne(
            {  _id:appointmentId,
                staff: staffId,
                status: "scheduled",
                date: { $gte: today, $lt: tomorrow },
                bookedSlot: timeSlot
            },
            { $set: { status: "completed" } }
        );
    
        if (result.nModified === 0) {
            throw new ApiError(404, "Appointment not found or already completed");
        }
    
        return res
        .status(200)
        .json(new ApiResponse(200, result, "Appointment status updated successfully"));
    });




// >>> notes this part will be for  
// get all staff list


// delete staff 


export {
    loginStaff,
    logoutStaff,
    checkTotalCompletedAppointments,
    checkTotalScheduledAppointments,
    checkTodaysAppointments,
    updateApointmentStatus
}