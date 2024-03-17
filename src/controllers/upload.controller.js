const { uploadImageFromLocalS3 } = require('../services/upload.service')
const catchAsync = require('../helpers/catch.async')
const { CREATED, OK } = require('../core/success.response')
const { BusinessLogicError } = require('../core/error.response')

class UploadController {
  uploadImageFromLocalS3 = async (req, res, next) => {
    const { file } = req
    if (!file) {
      throw new BusinessLogicError('File missing')
    }
    OK(
      res,
      'Upload success from S3Client',
      await uploadImageFromLocalS3({
        file
      })
    )
  }
}

module.exports = new UploadController()
