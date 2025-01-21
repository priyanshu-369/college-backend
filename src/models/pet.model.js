import mongoose from "mongoose";



const petSchema = new mongoose.Schema(
    {
        petName: {
            type: String,
            required: true
        },

        species: {
            type:String,
            required: true,   
        },
        
        breed: {
            type: String,
        },

        age: {
            type: String
        },

        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },

        medicalHistory:{
            type:[String]
        }

   
    },{timestamps: true})

   
    export const Pet = mongoose.model("Pet", petSchema)
