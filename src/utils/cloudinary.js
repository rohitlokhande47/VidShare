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
        console.log("file is uploaded to cloudinary",response.url);
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath) //remove the locally saved if as the upload operation got fail
        return null
        
    }
}
export {uplaodOnCloudinary}