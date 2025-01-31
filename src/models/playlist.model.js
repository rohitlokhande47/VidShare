import mongoose,{Schema} from "mongoose";

const playlistSchema = new Schema({

    name:{
        Type:String,
        requied:true
    },
    description:{
        Type:String,
        required:true
    },
    videos:[{
        Type:Schema.Types.ObjectId,
        ref:"Vedio"
    }],
    owner:{
         Type:Schema.Types.ObjectId,
        ref:"User"
    }


},{
    timestamps:true
})

export const Playlist = mongoose.model("Playlist",playlistSchema)