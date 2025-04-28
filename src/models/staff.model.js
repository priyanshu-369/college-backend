import mongoose from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

const staffSchema = new mongoose.Schema(
    {
        name: { 
            type: String, 
            required: true 
        },
        email: { 
            type: String, 
            required: true, 
            unique: true 
        },
        phone: { 
            type: String, 
            required: true 
        },
        avatar:{
            type: String,
            required: true
        },
        password: {
            type: String,
            required: true
        },
        profession: { 
            type: String, 
            enum: ["veterinary", "groomer", "trainer", "dietitian"], 
            default: "veterinary",
            required: true, 
        },
        specialization: { 
            type: String //"dermatologist", "surgeon", "cat specialist"
        }, 
        description: {
            type: String
        },
        fee:{ type: Number,
        required: true,
        min: [0, "Fee must be a positive number"]
        },
        availableSlots:[{ 
            day: { 
                type: String, // lets say monday
                required: true 
            }, 
            timeSlots: [{ type: String }]  // ["10:00 AM", "11:00 AM", "2:00 PM"]
        }],
        appointments: [
            { 
                type: mongoose.Schema.Types.ObjectId, 
                ref: "Appointment" 
            }
        ], 
        refreshToken:{
            type: String
        }
}, { timestamps: true });

staffSchema.pre("save", async function (next){
    if(!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10)
    next()
})

staffSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password)    
}


staffSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

staffSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id: this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}



export const Staff = mongoose.model("Staff", staffSchema);

