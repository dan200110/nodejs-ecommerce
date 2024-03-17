const express = require('express')
const router = express.Router()
const uploadController = require('../../controllers/upload.controller')
const {authenticationV2} = require("../../auth/authUtils");
const { uploadMemory, uploadDisk } = require('../../configs/config.multer');


router.post('/product/bucket', uploadMemory.single('file'), uploadController.uploadImageFromLocalS3)

// router
module.exports = router
