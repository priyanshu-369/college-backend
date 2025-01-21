import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";



const connnectDB = async () => {
    try {
        // niche hum mongoose ka connection kar rahe hai database se aur iska matlab ye hai ki ye hum db se connect kar rahe hai 
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);

        

    } catch (error) {
        console.log("MongoDD connecion error: ",error);
        process.exit(1)
    }
}


export default connnectDB;