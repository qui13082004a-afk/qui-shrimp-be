const { GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { s3Client } = require("../config/aws");
//kiểm tra xem value đã là URL đầy đủ như https://... hoặc http://... chưa.
const isRemoteUrl = (value) => /^https?:\/\//i.test(String(value || ""));

const getS3SignedUrl = async (key, expiresIn = 60 * 10) => {
  if (!key || isRemoteUrl(key)) return key || null;

  try {
    //GetObjectCommand là lệnh của AWS SDK dùng để lấy một object/file từ S3.
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
    });
//dùng để tạo và trả về một signed URL cho file trên S3.
    return await getSignedUrl(s3Client, command, { expiresIn });
  } catch (error) {
    console.error("Khong the tao S3 signed URL:", error.message);
    return key;
  }
};

module.exports = {
  getS3SignedUrl,
};
