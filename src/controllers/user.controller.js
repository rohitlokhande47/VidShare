import {asyncHandler} from "../utils/AsyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uplaodOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import mongoose from "mongoose";

//generateAccessandRefereshTokens
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

//registeruser
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

    if(!username && !email){
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

//logout
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

const refershAccessToken = asyncHandler(async(req,res) => {
    req.cookie.refershToken || req.body.refershToken

    if(!incomingRefreshToken){
        throw new ApiError(401,"unauthorized request")
    }

   try {
    const decodedToken = jwt.verify(
         incomingRefreshToken,
         process.env.REFRESH_TOKEN_EXPIRY
     )
 
     const user = await User.findById(decodedToken?._id)
 
     if(!user){
         throw new ApiError(401,"Invalid refresh token")
     }
 
     if(incomingRefreshToken !== user?.refershToken){
         throw new ApiError(401,"Refresh token is used or expired")
     }
 
     const options = {
         httpOnly:true,
         secure:true
     }
 
     const {accessToken,newRefershToken} = await generateAccessandRefereshTokens(user._id)
 
     return res
     .status(200)
     .cookie("accessToken",accessToken,options)
     .cookie("RefreshToken",newRefershToken,options)
     .json(
         new ApiResponse(
             200,
             {accessToken, refershToken:newRefershToken},
             "Access token refreshed"
         )
     )
   } catch (error) {
    throw new ApiError(401,error?.message || "Invalid refresh token")
   }
})

const changeCurrentUserPassword =asyncHandler(async(req,res) =>{
    const{oldpassword,newpassword}=req.body
    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await User.isPasswordCorrect(oldpassword)
    if(!isPasswordCorrect){
        throw ApiError(400,"invalid old password")
    }

    user.password = newpassword
    await user.save({validateBeforeSave:false})

    return res.status(200).json(new ApiResponse(200,{},"password changed successfully"))
})

const getCurrentuser = asyncHandler(async(req,res) =>{
    return res.
    status(200).
    json(ApiResponse (200,req.user,"current user fetched successfully")) 
})

const updateAccountDetails = asyncHandler((req,res)=>{

    const {fullname,email} = res.body
    if(!fullname && !email){
        throw ApiError(400,"all fields are required")
    }
   const user =  User.findByIdAndUpdate(
        req.user?._id,
    {
        $set:{
            fullname,
            email:email,

        }
    },
        {new:true}
).select("-password")

return res.status(200)
.json(new ApiResponse(200,user,"Account detail updated successfully"))
})

const updateAvatar = asyncHandler(async(req,res) => {

    const avatarlocalpath = req.file?.path

    if(!avatarlocalpath){
        throw ApiError(400,"avatar file not found")
    }

    uplaodOnCloudinary(avatarlocalpath)

    if(!avatar.url){
        throw ApiError(400,"error while updating avatar")
    }

    const user = await user.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
            avatar: avatar.url
            }
        },
        {new:true}
    ).select("-password")

    return res.status(200).
    json(
        new ApiResponse(200,user,"Avatar updated successfully")
    )

})

const updateCoverImage = asyncHandler(async(req,res) => {

    const avatarlocalpath = req.file?.path

    if(!updateCoverImagelocalpath){
        throw ApiError(400," Cover Image file not found")
    }

    uplaodOnCloudinary(updateCoverImagelocalpath)

    if(!coverImage.url){
        throw ApiError(400,"error while updating avatar")
    }

   const user = await user.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
            coverImage: coverImage.url
            }
        },
        {new:true}
    ).select("-password")

    return res.status(200).
    json(
        new ApiResponse(200,user,"Cover Image updated successfully")
    )

})

const getUserchannelProfile = asyncHandler(async (res,req) =>{

    const {username} = req.params

    if(!username?.trim){
        throw ApiError(400,"username not found ")
    }

    const channel = await User.aggregate([{
        $match:{
            username: username?.toLowerCase()
            
        }
    },{
        $lookup:{
            from:"subscription",
            localField:"_id",
            foreignField:"channel",
            as:"subcsribers"
        }
    },{
        $lookup:{
            from:"subscription",
            localField:"_Id",
            foreignField:"subscriber",
            as:"subscribedTo"
        }
    },{
        $addFields:{
            subsribersCount:{
                $size:"$subcsribers"
            },
            channelsSubscribedToCount:{
                $size:"$subscribedTo"
            },
            isSubscriber:{
                $cond:{
                    if:{$in:[req.user?._id,"$subcsribers.subscribe"]},
                    then:true,
                    else:false
                }
            }
        } 
    },
    {
        $project:{
            fullname:1,
            username:1,
            subscriberCount:1,
            channelsSubscribedToCount:1,
            isSubscriber:1,
            avatar:1,
            coverImage:1,
            email:1

        }
    }
    ]
)
if(!channel?.length){
    throw new ApiError(404,"channel does not exists")
}
return res.status(200)
.json(
    new ApiResponse(200,channel[0],"user channel fetched")
)
})

const getWatchHistory = asyncHandler(async (req,res) =>{
    const user = await User.aggregate([
        {
            $match:{
            _id:mongoose.Types.ObjectId(req.user._id)
        }
        },
        {
            $lookup:{
                from:"videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullname:1,
                                        username:1,
                                        avatar:1
                        
                                    }
                                },
                                {
                                    $addFields:{
                                        owner:{
                                            $first:"owner"
                                        }
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        }
    ])

    return res.status(200).
    json(
        new ApiResponse(
            200,
            user[0].watchHistory,
            "watched history fetched"
        )
    )
})

export {registerUser,
    loginUser,
    logoutUser,
    refershAccessToken,
    getCurrentuser,
    changeCurrentUserPassword,
    updateAccountDetails,
    updateAvatar,
    updateCoverImage,
    getUserchannelProfile,
    getWatchHistory


}