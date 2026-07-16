const { GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { s3Client } = require("../config/aws");

const isRemoteUrl = (value) => /^https?:\/\//i.test(String(value || ""));

const getS3SignedUrl = async (key, expiresIn = 60 * 10) => {
  if (!key || isRemoteUrl(key)) return key || null;

  try {
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
    });

    return await getSignedUrl(s3Client, command, { expiresIn });
  } catch (error) {
    console.error("Khong the tao S3 signed URL:", error.message);
    return key;
  }
};

module.exports = {
  getS3SignedUrl,
};
