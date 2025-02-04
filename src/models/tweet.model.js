import mongoose, { Schema } from "mongoose"

const tweetSchema = new Schema({
    content: {
        type: String,     // Fixed: Type -> type
        required: true    // Fixed: requied -> required
    },
    owner: {
        type: Schema.Types.ObjectId,  // Fixed: Type -> type
        ref: "User",
        required: true
    }
}, 
{ 
    timestamps: true 
})

export const Tweet = mongoose.model("Tweet", tweetSchema)