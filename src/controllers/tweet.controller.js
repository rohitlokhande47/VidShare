import mongoose from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const {content} = req.body

    if (!content?.trim()) {
        throw new ApiError(400, "Content is required")
    }

      const tweet = await Tweet.create(
       { content,
        owner:req.user._id}
      )

      if (!Tweet){ throw new ApiError(400, "Error in adding tweet");}
      return res
        .status(201)
        .json(new ApiResponse(201, tweet, "tweet added successfully"));
  
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const {userId} = req.params
    const {page = 1, limit = 10 } = req.query

    if(!mongoose.isValidObjectId(userId)){
        throw new ApiError(400,"Invalid user Id")
    }

    const tweetsAggregate = await Tweet.aggregate([
        {
            $match:{
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"owner",
                pipeline:[
                    {
                        $project:{
                            username:1,
                            fullname:1,
                            avatar:1
                        }
                    }
                ]
            }
        },
        {
            $addFields:{
                owner:{$first:"$owner"}
            }
        },
        {
            $sort:{createAt:-1}
        },
       {
        $skip:(Number(page)-1) * Number(limit)
       },
       {
        $limit:Number(limit)
       } 
    ])

    const totalTweets = await Tweet.countDocuments({
        owner: userId
    })
    return res.status(200)
    .json(new ApiResponse(
        200,
        {
            tweets:tweetsAggregate,
            totalTweets,
            currentPage:Number(page),
            totalPages:Math.ceil(totalTweets/Number(limit))
        
        },
        "User tweets fetched successfully"
    ))
    
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const {content} = req.body
    const {tweetId} = req.params

    if(!mongoose.isValidObjectId(tweetId)){
        throw new ApiError(400,"tweet Id invalid")
    }

    if(!content?.trim()){
        throw new ApiError(404,"tweets required")
    }

    const tweet = await Tweet.findById(tweetId)

    if(!tweet){
        throw new ApiError(404,"tweet not found")
    }
    
    if(tweet.owner.toString() !== req.user?._id.toString()){
        throw new ApiError(403, "Unauthorized - Not tweet owner")

    }

    const updatetweet = await Tweet.findByIdAndUpdate(tweetId,
        {
            $set:{
                content
            }
        },{new:true}
    )

    res.status(200).
    json(new ApiResponse(200,updatetweet,"tweet success fully updated"))
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const {tweetId} = req.params

    if(!mongoose.isValidObjectId(tweetId)){
        throw new ApiError(400,"invalid tweet id")
    }

    const tweet = await Tweet.findById(tweetId)

    if (tweet.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "Unauthorized - Not tweet owner")
    }

    if(!tweet){
        throw new ApiError(404,"tweets not found")
    }

    await Tweet.findOneAndDelete(tweetId)

    res.status(200).json(new ApiResponse(
        200,
        {},
        "tweet deleted successfully"
    ))

})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}