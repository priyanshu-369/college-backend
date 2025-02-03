import mongoose from "mongoose";


const appointmentSchema  = new mongoose.Schema(
    {
        user: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: "User", required: true 
        },
        staff: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: "Staff", required: true 
        },
        pet:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Pet", required: true
        },
        date: { 
            type: Date, 
            required: true 
        },
        bookedSlot: { 
            type: String,
            required: true 
        }, 
        status: { 
            type: String, 
            enum: [ "scheduled", "completed", "cancelled"], 
            default: "scheduled" 
        }
        
    },
    {
        timestamps: true
    })


export const Appointment = mongoose.model("Appointment",appointmentSchema);