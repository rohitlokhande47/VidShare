import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    if(!mongoose.isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid video id")
    }

    const pageNumber = parseInt(page)
    const commentsPerPage = parseInt(limit)

    const comments = await Comment.aggregate([
        {$match:{
            video:new mongoose.Types.ObjectId(videoId)
        }
    },
    {
        $lookup:{
            from:"users",
            localField:"owner",
            foreignField:"_id",
            as:"owner",
            pipeline:[{
                $project:{
                    username:1,
                    fullname:1,
                    avatar:1
                }
            }]
        }
    },
    {
        $addFields:{
            owner:{$first:"$owner"}
        }
    },
    {
        $skip:(pageNumber-1)* commentsPerPage
    },
    {
        $limit:commentsPerPage
    }
    ])

    const totalComments = await Comment.countDocuments({
        video:videoId
    })

    return res.status(200)
    .json(new ApiResponse(200,
       { comments,
        totalComments,
        currentPage:pageNumber,
        totalPages:Math.ceil(totalComments/commentsPerPage)},
        "Comments fetched successfully"
    ))

})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }