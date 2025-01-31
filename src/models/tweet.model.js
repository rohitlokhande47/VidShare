import mongoose,{Schema} from "mongoose";


const tweetsSchema = new Schema({

    content:{
        Type:String,
        requied:true
    }
    owner:[{
        Type:Schema.Types.ObjectId,
        ref:"User"
    }],
    owner:{
         Type:Schema.Types.ObjectId,
        ref:"User"
    }


},{
    timestamps:true
})

export const Tweets = mongoose.model("Tweets",tweetsSchema)