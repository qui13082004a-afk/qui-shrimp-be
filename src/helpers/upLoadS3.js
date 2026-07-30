const { PutObjectCommand } = require("@aws-sdk/client-s3");
const { s3Client } = require("../config/aws");

const uploadToS3 = async (file, folder = "uploads") => {
  // lấy đuôifile
  const ext = file.originalname.split(".").pop();
// tạo tên file
  const fileName = `${folder}/${Date.now()}-${Math.round(
    Math.random() * 1e9
  )}.${ext}`;
//gửi request đến AWS S3.
  await s3Client.send(
    //lệnh để tạo/upload một object mới lên S3.
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