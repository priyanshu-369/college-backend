import mongoose from "mongoose";


const appointmentSchema  = new mongoose.Schema(
    {

    },
    {
        timestamps: true
    })




export const Appointment = mongoose.model("Appointment","appointmentSchema");