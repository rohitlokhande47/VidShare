import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"
import { Comment } from "../models/comment.model.js"
import {Tweet} from "../models/tweet.model.js"


const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video


    // Validate videoId
    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id")
    }

    // Check if video exists
    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(404, "Video not found")
    }
  

    const existingLike = await Like.findOne({
        video:videoId,
        likedBy:req.user?._id
    })

    let like;
    if(existingLike){
        //remove like if exists
        await Like.findByIdAndDelete(existingLike._id)
        like = null
    }else{
        //create new like 
        like = await Like.create({
            video:videoId,
            likedBy:req.user._id
        })
    }

    return res.status(200).
    json(new ApiResponse(
        200,
        {liked:!existingLike},
        `Video ${existingLike ? "unliked" : "liked"} successfully`
    ))

})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment

    // Validate 
    if (!mongoose.isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment id")
    }

    // Check if exists
    const comment = await Comment.findById(commentId)

    if(!comment){
        throw new ApiError(404, "comment not found")
    }
  

    const existingLike = await Like.findOne({
        comment:commentId,
        likedBy:req.user?._id
    })

    let like;
    if(existingLike){
        //remove like if exists
        await Like.findByIdAndDelete(existingLike._id)
        like = null
    }else{
        //create new like 
        like = await Like.create({
            comment:commentId,
            likedBy:req.user._id
        })
    }

    return res.status(200).
    json(new ApiResponse(
        200,
        {liked:!existingLike},
        `Comment ${existingLike ? "unliked" : "liked"} successfully`
    ))

})


const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet

    // Validate 
    if (!mongoose.isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid comment id")
    }

    // Check if exists
    const tweet = await Tweet.findById(tweetId)

    if(!tweet){
        throw new ApiError(404, "tweet not found")
    }
  

    const existingLike = await Like.findOne({
        tweet:tweetId,
        likedBy:req.user?._id
    })

    let like;
    if(existingLike){
        //remove like if exists
        await Like.findByIdAndDelete(existingLike._id)
        like = null
    }else{
        //create new like 
        like = await Like.create({
            tweet:tweetId,
            likedBy:req.user._id
        })
    }

    return res.status(200).
    json(new ApiResponse(
        200,
        {liked:!existingLike},
        `Tweet ${existingLike ? "unliked" : "liked"} successfully`
    ))

}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const { page = 1, limit = 10 } = req.query
    const userId = req.user?._id

    const likes = await Like.aggregate([
        {
            $match:{
                likedBy: new mongoose.Types.ObjectId(userId),
                video:{$exists:true} //get only vedio liked
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"video",
                foreignField:"_id",
                as:"video",
                pipeline:[
                    {
                        $project:{
                            title:1,
                            description: 1,
                            videoFile: 1,
                            thumbnail: 1,
                            duration: 1,
                            views: 1
                        }
                    }
                ]
                
            }
        },
        {
            $addFields:{
                video:{$first:"$video"}
            }
        },        {
            $lookup: {
                from: "users",
                localField: "video.owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [{
                    $project: {
                        username: 1,
                        fullname: 1,
                        avatar: 1
                    }
                }]
            }
        }
        ,
        {
            $addFields: {
                owner: { $first: "$owner" }
            }
        },
        {
            $skip: (Number(page) - 1) * Number(limit)
        },
        {
            $limit: Number(limit)
        }
    ])

    const totalLikedVideos = await Like.countDocuments({
        likedBy: userId,
        video: { $exists: true }
    })

    return res.status(200)
        .json(new ApiResponse(
            200,
            {
                likes,
                totalLikedVideos,
                currentPage: Number(page),
                totalPages: Math.ceil(totalLikedVideos/Number(limit))
            },
            "Liked videos fetched successfully"
        ))
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}

