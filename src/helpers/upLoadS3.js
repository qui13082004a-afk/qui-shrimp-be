const { PutObjectCommand } = require("@aws-sdk/client-s3");
const { s3Client } = require("../config/aws");

const uploadToS3 = async (file, folder = "uploads") => {
  const ext = file.originalname.split(".").pop();
  const fileName = `${folder}/${Date.now()}-${Math.round(
    Math.random() * 1e9
  )}.${ext}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
    })
  );

  return fileName;
};

module.exports = uploadToS3;