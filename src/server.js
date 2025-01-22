import connnectDB from "./db/db.js"
import 'dotenv/config' 

// console.log(process.env.PORT) check kiya that the environment variable is loaded in process.env

import { app } from "./app.js"



// connecting to database by calling the connectDB() method bhai!! 
connnectDB()
.then( () => {
    app.on("error", (error) => {
        console.log("ERROR: ",error)
        throw error
    })

    app.listen(process.env.PORT || 8000, () =>{
        console.log(`| Server is running on port: ${process.env.PORT} | captian!!`)
    });
})
.catch( (error) => {
    console.log("MongoDB connection failed: ",error)
})
