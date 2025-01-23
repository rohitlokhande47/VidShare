//require('dotenv').config({path: '.env'})
import mongoose from "mongoose";
import connectDB from "./db/db.js";
import dotenv from "dotenv"


dotenv.config({
    path:'./env'
})
connectDB()


/*
import express from "express"
const app = express()

;( async ()=>{
    try{
       await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
       app.on("error",()=>{
        console.log("Error",error);
        throw error
       })
       app.listen(process.env.env.PORT,()=>{
        console.log(`App is listening on port ${process.env.PORT}`)
       })
    }catch(error){
        console.error("error",error)
        throw err
    }
})()*/