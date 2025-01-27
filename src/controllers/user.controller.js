import {asyncHandler} from "../utils/AsyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uplaodOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessandRefereshTokens = async(userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refershToken =  user.generateRefreshToken()

        user.refershToken - refershToken
        await user.save({validateBeforeSave:false})

        return {accessToken,refershToken}
    } catch (error) {
        throw ApiError(500,"something went wrong while generating access and referesh token")
    }
}

const registerUser = asyncHandler(async (req,res) =>{
   //get user details from frontend
    const {fullname,email,username,password} = req.body
    console.log("email",email)

   //validate-not empty
   if([fullname,email,username,password].some((field) => field?.trim() === "")){
    throw new ApiError(400,"All fields are required")
   }
   //check if user already exists:username and email
  const existedUser = await User.findOne({$or:[{username},{email}]})
  console.log(existedUser)

  if(existedUser){
    throw new ApiError(409,"username with similar username or email already exits")
  }
   //check for image check for avatar
   const avatarLocalPath = req.files?.avatar[0]?.path;
   const coverImageLocalPath = req.files?.coverImage[0]?.path;

   if(!avatarLocalPath){
     throw new ApiError(400,"Avatar file is required")
   }
   //upload to cloudinary
    const avatar = await uplaodOnCloudinary(avatarLocalPath)
    const coverImage = await uplaodOnCloudinary(coverImageLocalPath)

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

//login

const loginUser = asyncHandler(async (req,res) => {
    //req body -> data
    //username && password
    //find the user
    //password check 
    //access and refresh token
    //send cookie

    const{email,username,password} = req.body

    if(!username || !email){
        throw new ApiError(400,"username or email is required")
    }
    
  const user =await User.findOne({
        $or:[{username},{email}]
    })

    if(!user){
        throw new ApiError(404,"User does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)
    if(!isPasswordValid){
        throw new ApiError(401,"invalid user credentials")
    }
    
    const {refershToken,accessToken} = await 
    generateAccessandRefereshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-passord -refreshToken")
   
    const option = {
        httpOnly:true,
        secure:true
    }

    return res.status(200)
    .cookie("accessToken",accessToken,option)
    .cookie("refreshToken",refershToken,option)
    .json(
        new ApiResponse(
            200,
            {
                user:loggedInUser,accessToken,refershToken
            },
            "user logged in Successfully"
        )
    )
})

const logoutUser = asyncHandler(async(req,res) =>{
   await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refershToken:undefined
            }
        },
       { 
        new: true
    }
    )        
    const options = {
        httpOnly:true,
        secure:true
    }
    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"User logged out"))

})

export {registerUser,loginUser,logoutUser}