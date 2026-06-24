const { S3Client } = require("@aws-sdk/client-s3");
const { RekognitionClient } = require("@aws-sdk/client-rekognition");

const credentials = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
};

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials,
});

const rekognitionClient = new RekognitionClient({
  region: process.env.AWS_REGION,
  credentials,
});

module.exports = {
  s3Client,
  rekognitionClient,
};