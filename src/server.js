import connnectDB from "./db/db.js"
import 'dotenv/config' 

// console.log(process.env.PORT) check kiya that the environment variable is loaded in process.env
import express from "express"
const app = express()



// connecting to database by calling the connectDB() method bhai!! 
connnectDB()
