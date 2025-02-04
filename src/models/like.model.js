import mongoose,{Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";


const likeSchema = new Schema({

    video:{
        type:mongoose.Types.ObjectId,
        ref:"Video"
    },
    comment:{
        type:mongoose.Types.ObjectId,
        ref:"Comment"
    },
    tweet:{
        type:mongoose.Types.ObjectId,
        ref:"Tweet"
    },
    likedBy:{
        type:mongoose.Types.ObjectId,
        ref:"User"
    }

},{
    timestamps:true
}
)
likeSchema.plugin(mongooseAggregatePaginate)
export const Like = mongoose.model("Like",likeSchema)