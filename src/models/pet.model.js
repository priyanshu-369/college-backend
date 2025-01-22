import mongoose from "mongoose";



const petSchema = new mongoose.Schema(
    {
        petName: {
            type: String,
            required: true
        },

        petAvatar:{
            type: String,
            default: "https://www.shutterstock.com/blog/wp-content/uploads/sites/5/2018/12/Vectorize-Your-Pets-Featured-Image-01.jpg"
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
