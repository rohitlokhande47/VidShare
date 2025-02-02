import mongoose, {isValidObjectId, mongo} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uplaodOnCloudinary,deleteFromCloudinary} from "../utils/cloudinary.js"

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy = "createdAt", sortType = "desc", userId } = req.query
    //TODO: get all videos based on query, sort, pagination

    //convert page and limit to numbers
    const pageNumber = parseInt(page)
    const videosPerPage = parseInt(limit)

    //build pipline stages
    const pipeline = []

    //Match stage - filter by userId if Provided
    if(userId){
        pipeline.push({
            $match:{
            owner: new mongoose.Types.ObjectId(userId)
            }
        })
    }

    //search stage -  if query parameter exists
    if(query){
        pipeline.push({
            $match:{
                $or:[
                    {title:{$regex:query, $options:"i"}},
                    {description:{$regex:query,$options:"i"}}
                ]
            }
        })
    }

    //Look stage - get owner details
    pipeline.push({
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
    })

    // Add sorting stage
    pipeline.push({
        $sort:{
            [sortBy]: sortType === "desc" ? -1:1
        }
    })

    //get total count before pagination

    const totalVedios = await Video.aggregate([...pipeline,{$count:"total"}])

//Add pagination stages
    pipeline.push(
    {$skip:(pageNumber - 1)* videosPerPage},
    {$limit:videosPerPage}
    )

    //Execute pipline
    const videos = await Video.aggregate(pipeline)

    //return formatted respone
    return res.status(200).json(
        new ApiResponse(200,{
            videos,
            currentPage:pageNumber,
            totalPages:Math.ceil(totalVedios[0]?.total / videosPerPage) || 0,
            totalVedios:totalVedios[0]?.total || 0
        },"Videos fetched successfully")
    )
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video

    if(!title || !description){
        throw new ApiError(400,"Title and description are required")
    }

    //give localpath 
    const videoLocalPath = req.files?.videoFile?.[0]?.path
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path

    if(!videoLocalPath){
        throw new ApiError(400,"vedio file required ")
    }

    if(!thumbnailLocalPath){
        throw new ApiError(400,"thumbnail file required ")
    }

    const video = await uplaodOnCloudinary(videoLocalPath)
    const thumbnail = await uplaodOnCloudinary(thumbnailLocalPath)

    if(!video){
        throw new ApiError(400,"video file not found")
    }
    if(!thumbnail){
        throw new ApiError(400,"Error uploading thumbnail")
    }

    //create video document
    const videoDoc = await Video.create({
        videoFile:video.url,
        thumbnail:thumbnail.url,
        title,
        description,
        duration:video.duration,
        owner:req.user._id,
        views:0
    
    })

    return res.status(201).json(
        new ApiResponse(201,videoDoc,"Video publised successfully")
    )

})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    
    //validate videoId
    if(!mongoose.isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid video id")
    }
    console.log("Vedio Id from params :",videoId)

    //get video with owner details using aggreation 
    const video = await Video.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(videoId)
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
                owner:{ $first:"$owner"}
            }
        }
    ])
    if(!video?.length){
        throw new ApiError(404,"Vedio not found")
    }

    return res.status(200).json(
        new ApiResponse(200,video[0],"Video fetched successfully")
    )

})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const {title,description} = req.body
    //TODO: update video details like title, description, thumbnail

    // Validate videoId
    if(!mongoose.isValidObjectId(videoId)){
    throw new ApiError(400," vedio Id invalid")
}

    // Find video and check ownership

const video = await Video.findById(videoId)

if(!video){
    throw new ApiError(404,"vedio not found")
}

if(video.owner.toString() != req.user?._id.toString()){
    throw new ApiError(403,"unauthorized- Not video owner")
}
    // Handle thumbnail update if provided

let thumbnailUrl
if(req.file?.path){
    const thumbnail = await uplaodOnCloudinary(req.file.path)
    if(!thumbnail?.url){
        throw new ApiError(400,"Error uploading the thumbnail")
    }
    thumbnailUrl= thumbnail.url
}

//Update video details
const updateVideo = await Video.findByIdAndUpdate(
    videoId,
    {
        $set:{
            title:title || video.titlem,
            description:description || video.description,
            thumbnail: thumbnailUrl || video.thumbnail
        }
    },
    {new:true}
).select("-password")

return res.status(200)
.json(new ApiResponse(200,updateVideo,"Video updated successfully"))
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const {title,description} = req.body
    //TODO: delete video
    //validate videoId 
    if(!mongoose.isValidObjectId(videoId)){
        throw  new ApiError(400,"Invalid video id")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    //find video and verfiy ownership 
    if(video.owner.toString() !== req.user?._id.toString()){
        throw new ApiError(403,"unathorized - Not video owner")
    }

    //delete video and thumbnail from cloudinary
    //note: add proper error handling for cloudinary operation
    if(video.videoFile){
        await deleteFromCloudinary(video.videoFile)
    }
    if(video.thumbnail){
        await deleteFromCloudinary(video.thumbnail)
    }

    await Video.findByIdAndDelete(videoId)

    return res.status(200)
    .json(new ApiResponse(
        200,
        {},
        "video deleted successfully"
    ))

})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    //validate videoid
    if(!mongooose.isValidObjectId(videoId)){
        throw new ApiError(400,"invalid video id")
    }

        const video = await Video.findById(videoId)

        if(!video){
            throw new ApiError(404,"Video not found")
        }

        if(video.owner.toString() !== req.user?._id.toString()){
            throw new ApiError("unauthorized - not video owner")
        }

        const updateVideo = await Video.findByIdAndUpdate(
            videoId,
            {
                $set:{
                    isPublished: !video.isPublished
                }
            },
            {new:true}
        )

        return res.status(200)
        .json(new ApiResponse(
            200,
            updateVideo,
            "Video published status toggled successfully"
        ))

})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}