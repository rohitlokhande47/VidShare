import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"

const getVideoComments = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    console.log("Fetching comments for videoId:", videoId); // Debug log

    if(!mongoose.isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid video id")
    }

    // Check if video exists
    const video = await Video.findById(videoId)
    if(!video) {
        throw new ApiError(404, "Video not found")
    }

    // Log raw comments before aggregation
    const rawComments = await Comment.find({ video: videoId });
    console.log("Raw comments:", rawComments);

    const comments = await Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner"
            }
        },
        {
            $addFields: {
                owner: { $first: "$owner" }
            }
        }
    ])

    console.log("Aggregated comments:", comments) // Debug log

    const totalComments = await Comment.countDocuments({
        video: videoId
    })

    return res.status(200)
    .json(new ApiResponse(
        200,
        {
            comments,
            totalComments,
            currentPage: Number(page),
            totalPages: Math.ceil(totalComments/Number(limit))
        },
        "Comments fetched successfully"
    ))
})

  const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const { videoId } = req.params;
    const { content } = req.body;
    const user = req.user;
    if (!videoId) throw new ApiError(400, "Cant read videoid");
    const comment = await Comment.create({
      content,
      video: videoId,
      owner: user._id,
    });
    if (!comment) throw new ApiError(400, "Error in adding comment");
    return res
      .status(200)
      .json(new ApiResponse(200, { comment }, "Comment added successfully"));
  });
  
const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const {content} =req.body;
    const {commentId} =req.params;

       if(!mongoose.isValidObjectId(commentId)){
        throw new ApiError(400," vedio Id invalid")}

        if (!content?.trim()) {
            throw new ApiError(400, "Content is required")
        }

        const comment = await Comment.findById(commentId)

        if(!comment){
            throw new ApiError(404,"vedio not found")
        }

        if (comment.owner.toString() !== req.user?._id.toString()) {
            throw new ApiError(403, "Unauthorized - Not comment owner")
        }

        const updateComment = await Comment.findByIdAndUpdate(commentId,
            {
                $set:{
                    content
                }
            },
            {new:true}
        )
    return res.status(200)
    .json(new ApiResponse(
        200,
        updateComment,
        "Comment updated successfully"
    ))

})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const {commentId} = req.params;

    if(!mongoose.isValidObjectId(commentId)){
        throw new ApiError(400," comment Id invalid")}

        const comment = await Comment.findById(commentId)
        if (!comment) {
            throw new ApiError(404, "Comment not found")
        }
    
        if (comment.owner.toString() !== req.user?._id.toString()) {
            throw new ApiError(403, "Unauthorized - Not comment owner")
        }

    await Comment.findByIdAndDelete(commentId)
    return res.status(200)
    .json(new ApiResponse(
        200,
        {},
        "Comment deleted successfully"
    ))

})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }