import {Router} from "express";

import {upload} from "../middlewares/multer.middleware.js"

import { changeCurrentUserPassword,
     getCurrentuser, 
     getUserchannelProfile, 
     getWatchHistory, 
     refershAccessToken, 
     updateAccountDetails,
      updateAvatar, 
      updateCoverImage}
       from "../controllers/user.controller.js";
import {loginUser, logoutUser, registerUser} from "../controllers/user.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/register").post(upload.fields([
    {
        name:"avatar",
        maxCount:1
    },{
        name:"coverImage",
        maxCount:1
    }
]),registerUser)

router.route("/login").post(loginUser)

//secured routes
router.route("/logout").post(verifyJWT,logoutUser)

router.route("/refresh-token").post(refershAccessToken)

router.route("/change-password").post(verifyJWT,changeCurrentUserPassword)

router.route("/current-user").get(verifyJWT,getCurrentuser)

router.route("/update-account").patch(verifyJWT,updateAccountDetails)

router.route("/update-Avatar").patch(verifyJWT,upload.single("avatar"),updateAvatar)

router.route("/update-coverImage").patch(verifyJWT,upload.single("coverImage"),updateCoverImage)

router.route("/c/:username").get(verifyJWT,getUserchannelProfile)

router.route("/watchHistory").get(verifyJWT,getWatchHistory)

export default router 