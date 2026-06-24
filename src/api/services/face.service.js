const {
  CompareFacesCommand,
  DetectFacesCommand,
} = require("@aws-sdk/client-rekognition");

const { rekognitionClient } = require("../../config/aws");
const uploadToS3 = require("../../helpers/uploadS3");
const HoSoKhachHang = require("../models/HoSoKhachHang");

const detectFacesFromS3 = async (imageKey) => {
  const result = await rekognitionClient.send(
    new DetectFacesCommand({
      Image: {
        S3Object: {
          Bucket: process.env.AWS_S3_BUCKET,
          Name: imageKey,
        },
      },
      Attributes: ["DEFAULT"],
    })
  );

  return result.FaceDetails || [];
};

const validateOneFace = async (imageKey, imageName) => {
  const faces = await detectFacesFromS3(imageKey);

  if (faces.length === 0) {
    throw new Error(`${imageName} không phát hiện khuôn mặt`);
  }

  if (faces.length > 1) {
    throw new Error(`${imageName} chỉ được chứa 1 khuôn mặt`);
  }

  return true;
};

const registerFace = async ({ id_ho_so, cccdFrontFile, cccdBackFile }) => {
  const hoSo = await HoSoKhachHang.findByPk(id_ho_so);

  if (!hoSo) {
    throw new Error("Không tìm thấy hồ sơ khách hàng");
  }

  const cccdFrontKey = await uploadToS3(
    cccdFrontFile,
    `face-verification/${id_ho_so}/cccd-front`
  );

  await validateOneFace(cccdFrontKey, "CCCD mặt trước");

  const cccdBackKey = await uploadToS3(
    cccdBackFile,
    `face-verification/${id_ho_so}/cccd-back`
  );

  await hoSo.update({
    anh_cccd_mat_truoc: cccdFrontKey,
    anh_cccd_mat_sau: cccdBackKey,
    trang_thai_xac_thuc: "chua_xac_thuc",
    anh_selfie: null,
    do_tuong_dong: null,
    ly_do_xac_thuc_that_bai: null,
    ngay_xac_thuc: null,
  });

  return {
    id_ho_so: hoSo.id_ho_so,
    anh_cccd_mat_truoc: cccdFrontKey,
    anh_cccd_mat_sau: cccdBackKey,
    trang_thai_xac_thuc: "chua_xac_thuc",
  };
};

const verifyFace = async ({ id_ho_so, selfieFile }) => {
  const hoSo = await HoSoKhachHang.findByPk(id_ho_so);

  if (!hoSo) {
    throw new Error("Không tìm thấy hồ sơ khách hàng");
  }

  if (!hoSo.anh_cccd_mat_truoc) {
    throw new Error("Hồ sơ chưa có ảnh CCCD mặt trước");
  }

  const selfieKey = await uploadToS3(
    selfieFile,
    `face-verification/${id_ho_so}/selfie`
  );

  await validateOneFace(selfieKey, "Ảnh selfie");

  const result = await rekognitionClient.send(
    new CompareFacesCommand({
      SourceImage: {
        S3Object: {
          Bucket: process.env.AWS_S3_BUCKET,
          Name: hoSo.anh_cccd_mat_truoc,
        },
      },
      TargetImage: {
        S3Object: {
          Bucket: process.env.AWS_S3_BUCKET,
          Name: selfieKey,
        },
      },
      SimilarityThreshold: 90,
    })
  );

  const match = result.FaceMatches?.[0];
  const similarity = match ? Number(match.Similarity.toFixed(2)) : 0;
  const verified = similarity >= 90;

  await hoSo.update({
    anh_selfie: selfieKey,
    do_tuong_dong: similarity,
    trang_thai_xac_thuc: verified ? "da_xac_thuc" : "that_bai",
    ly_do_xac_thuc_that_bai: verified
      ? null
      : "Độ tương đồng khuôn mặt dưới 90%",
    ngay_xac_thuc: new Date(),
  });

  return {
    id_ho_so: hoSo.id_ho_so,
    verified,
    similarity,
    trang_thai_xac_thuc: verified ? "da_xac_thuc" : "that_bai",
    anh_selfie: selfieKey,
  };
};

module.exports = {
  registerFace,
  verifyFace,
};