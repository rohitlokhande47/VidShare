//srequire('dotenv').config({path: '.env'})
import mongoose from "mongoose";
import connectDB from "./db/db.js";
import {app} from './app.js'
import dotenv from "dotenv"

dotenv.config({
    path:'./.env'
})
connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000,() => {
        console.log(`Server is Running at : ${process.env.PORT}`)
    })
})
.catch((error) =>{
    console.log("mongodb connection failed !!", error)
})










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