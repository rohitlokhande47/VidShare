import {v2 as cloudinary} from "cloudinary"
import fs from "fs"

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
});

const uplaodOnCloudinary= async(localFilePath) =>{
    try {
        if(!localFilePath) return null
        //uplaod to cloudinay
       const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto"
        })
        //file have being uploaded success fully
       // console.log("file is uploaded to cloudinary",response.url);
       fs.unlinkSync(localFilePath)
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath) //remove the locally saved if as the upload operation got fail
        return null
        
    }
}

const deleteFromCloudinary = async(url,resourceType = "image") =>{
    try {
        if(!url) return null;

        //extract public_id from url
        if (!["image", "video", "raw"].includes(resourceType)) {
            throw new Error("Invalid resource type")
        }

        const publicId = url.split('/').pop().split('.')[0];
        const result = await cloudinary.uploader.destroy(publicId,{resource_type:resourceType});
        return result;


    } catch (error) {
        console.log("cloudinary delete error: ", error);
        throw new Error("Error deleteing from cloudinary")
    }
}
export {uplaodOnCloudinary,deleteFromCloudinary}