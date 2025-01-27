import {asyncHandler} from "../utils/AsyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uplaodOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";



const registerUser = asyncHandler(async (req,res) =>{
   //get user details from frontend
    const {fullname,email,username,password} = req.body
    console.log("email",email)

   //validate-not empty
   if([fullname,email,username,password].some((field) => field?.trim() === "")){
    throw new ApiError(400,"All fields are required")
   }
   //check if user already exists:username and email
  const existedUser = User.findOne({$or:[{username},{email}]})
  console.log(existedUser)

  if(existedUser){
    throw new ApiError(409,"username with similar username or email already exits")
  }
   //check for image check for avatar
   const avatarLocalpath = req.file?.avatar[0]?.path;
   const converImageLocalpath = req.file?.coverImage[0].path;

   if(!avatarLocalpath){
    throw new ApiError(400,"Avatar file is required")
   }
   //upload to cloudinary
    const avatar = await uplaodOnCloudinary(avatarLocalpath)
    const coverImage = await uplaodOnCloudinary(converImageLocalpath)

    if(!avatar){
        throw new ApiError(400,"Avatar file not found")
    }

   //create user object-create entry in dbc
  const user = await User.create({
    fullname,
    avatar:avatar.url,
    coverImage:coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase()

   })

  

  
   //remove password and refresh token field from respones
   const createdUser= await User.findById(user._id).select(
    "-password -refreshToken"
  )
   //check for user creation
   if(!createdUser){
    throw new ApiError(500,"Something went wrong while registering the user")
  }
   //return res
   return res.status(201).json(
    new ApiResponse(200,createdUser,"User registered successfully")
   )
})

export {registerUser}