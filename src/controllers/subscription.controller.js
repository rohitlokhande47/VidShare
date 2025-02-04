import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subcription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription
    if (!mongoose.isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel id")
    }
    const channel = await User.findById(channelId)
    if (!channel) {
        throw new ApiError(404, "Channel not found")
    }

    if (channel._id.toString() === req.user?._id.toString()) {
        throw new ApiError(400, "Cannot subscribe to your own channel")
    }

    const existingSubscription = await Subscription.findOne({
        subscriber: req.user?._id,
        channel: channelId
    })


    let subscription;
    if (existingSubscription) {
        // Unsubscribe
        await Subscription.findByIdAndDelete(existingSubscription._id)
        subscription = null
    } else {
        // Subscribe
        subscription = await Subscription.create({
            subscriber: req.user?._id,
            channel: channelId
        })
    }
    return res.status(200)
        .json(new ApiResponse(
            200,
            { subscribed: !existingSubscription },
            `Channel ${existingSubscription ? "unsubscribed" : "subscribed"} successfully`
        ))
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    const { page = 1, limit = 10 } = req.query

    if (!mongoose.isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel id")
    }


    const channel = await User.findById(channelId)
    if (!channel) {
        throw new ApiError(404, "Channel not found")
    }

    const subscribers = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriber",
                pipeline: [{
                    $project: {
                        username: 1,
                        fullname: 1,
                        avatar: 1
                    }
                }]
            }
        },
        {
            $addFields: {
                subscriber: { $first: "$subscriber" }
            }
        },
        {
            $skip: (Number(page) - 1) * Number(limit)
        },
        {
            $limit: Number(limit)
        }
    ])
    const totalSubscribers = await Subscription.countDocuments({
        channel: channelId
    })

    return res.status(200)
        .json(new ApiResponse(
            200,
            {
                subscribers,
                totalSubscribers,
                currentPage: Number(page),
                totalPages: Math.ceil(totalSubscribers/Number(limit))
            },
            "Subscribers fetched successfully"
        ))
})
// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const subscriberId = req.user?._id
    const { page = 1, limit = 10 } = req.query

    const subscribedChannels = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channel",
                pipeline: [{
                    $project: {
                        username: 1,
                        fullname: 1,
                        avatar: 1,
                        coverImage: 1
                    }
                }]
            }
        },
        {
            $addFields: {
                channel: { $first: "$channel" }
            }
        },
        {
            $skip: (Number(page) - 1) * Number(limit)
        },
        {
            $limit: Number(limit)
        }
    ])

    const totalSubscribedChannels = await Subscription.countDocuments({
        subscriber: subscriberId
    })

    return res.status(200)
        .json(new ApiResponse(
            200,
            {
                channels: subscribedChannels,
                totalSubscribedChannels,
                currentPage: Number(page),
                totalPages: Math.ceil(totalSubscribedChannels/Number(limit))
            },
            "Subscribed channels fetched successfully"
        ))
})
export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}