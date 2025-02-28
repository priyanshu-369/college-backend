
import cors from "cors"
import cookieParser from "cookie-parser";


import express from "express";
const app = express();

// hum app.use()  mostly middleware aur configuration ke liye use karte hai
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

// niche hum configure kiya hai ki express sirf json ka data limit 16kb hai 
app.use(express.json({limit:"16kb"}));

app.use(express.urlencoded({extended: true, limit: "16kb"}))

// ye hum koi file ko locally apne server pe store karte waqt use karenge 
app.use(express.static("public"))
app.use(cookieParser())


//all routes imported here 

import userRouter from "./routes/user.routes.js"
import adminRouter from "./routes/admin.routes.js"
import staffRouter from "./routes/staff.routes.js"

// routes declaration

// lets say koi request aaya  /user route pe to ye pass karega -> userRouter pe jo handle karega /user route pe aaye hue request ko. 
app.use("/paws-care/v1/users", userRouter)

// admin routes yaha hai
app.use("/paws-care/v1/admin", adminRouter)

// staff route is found below 
app.use("/paws-care/v1/staff", staffRouter)



export { app }