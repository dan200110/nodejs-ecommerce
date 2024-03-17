'use strict'

// upload file use S3Client

const {
  s3,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand
} = require('../configs/config.s3')
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner')
const urlImagePublic = 'https://d1tnhw0nh9rwvv.cloudfront.net'
const uploadImageFromLocalS3 = async ({ file }) => {
  try {
    const imageName = file.originalname
    const command = new PutObjectCommand({
      Bucket: process.env.BUCKET,
      Key: imageName || 'unknow',
      Body: file.buffer,
      ContentType: 'image/jpeg'
    })
    console.log('file is', file);
    console.log('command is', command);

    const result = await s3.send(command)
    // export url
    const signedUrl = new GetObjectCommand({
      Bucket: process.env.BUCKET,
      Key: imageName
    })
    const url = await getSignedUrl(s3, signedUrl, { expiresIn: 3600 })
    console.log('url is', url)
    console.log('result is', result)


    return {
      url: `${urlImagePublic}/${imageName}`,
      result
    }
  } catch (error) {
    console.error('Error uploading image from S3 Client:', error)
  }
}

module.exports = {
  uploadImageFromLocalS3
}
