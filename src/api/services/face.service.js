const {
  CompareFacesCommand,
  DetectFacesCommand,
} = require("@aws-sdk/client-rekognition");

const { rekognitionClient } = require("../../config/aws");

const uploadToS3 = require("../../helpers/upLoadS3");
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

/*
 * Kiểm tra ảnh chỉ có đúng 1 khuôn mặt
 * Nếu không có hoặc có nhiều hơn 1 sẽ báo lỗi
 */
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

/*
 * Đăng ký ảnh CCCD
 */
const registerFace = async ({ id_ho_so, cccdFrontFile, cccdBackFile }) => {

  // Tìm hồ sơ khách hàng
  const hoSo = await HoSoKhachHang.findByPk(id_ho_so);

  if (!hoSo) {
    throw new Error("Không tìm thấy hồ sơ khách hàng");
  }
  // Upload CCCD mặt trước lên S3
  const cccdFrontKey = await uploadToS3(
    cccdFrontFile,
    `face-verification/${id_ho_so}/cccd-front`
  );

  // Kiểm tra CCCD mặt trước có đúng 1 khuôn mặt
  await validateOneFace(cccdFrontKey, "CCCD mặt trước");

  // Upload CCCD mặt sau
  const cccdBackKey = await uploadToS3(
    cccdBackFile,
    `face-verification/${id_ho_so}/cccd-back`
  );

  // Cập nhật thông tin vào hồ sơ
  await hoSo.update({
    anh_cccd_mat_truoc: cccdFrontKey,
    anh_cccd_mat_sau: cccdBackKey,

    // Chưa selfie nên trạng thái vẫn chưa xác thực
    trang_thai_xac_thuc: "chua_xac_thuc",

    anh_selfie: null,
    do_tuong_dong: null,
    ly_do_xac_thuc_that_bai: null,
    ngay_xac_thuc: null,
  });

  // Trả kết quả
  return {
    id_ho_so: hoSo.id_ho_so,
    anh_cccd_mat_truoc: cccdFrontKey,
    anh_cccd_mat_sau: cccdBackKey,
    trang_thai_xac_thuc: "chua_xac_thuc",
  };
};

/*
 * Xác thực khuôn mặt bằng ảnh selfie
 */
const verifyFace = async ({ id_ho_so, selfieFile }) => {

  // Lấy hồ sơ khách hàng
  const hoSo = await HoSoKhachHang.findByPk(id_ho_so);

  if (!hoSo) {
    throw new Error("Không tìm thấy hồ sơ khách hàng");
  }

  // Phải đăng ký CCCD trước mới được xác thực
  if (!hoSo.anh_cccd_mat_truoc) {
    throw new Error("Hồ sơ chưa có ảnh CCCD mặt trước");
  }

  // Upload ảnh selfie
  const selfieKey = await uploadToS3(
    selfieFile,
    `face-verification/${id_ho_so}/selfie`
  );

  // Kiểm tra selfie chỉ có đúng 1 khuôn mặt
  await validateOneFace(selfieKey, "Ảnh selfie");

  // AWS so sánh CCCD với selfie
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

      // Chỉ lấy kết quả từ 85% trở lên
      SimilarityThreshold: 85,
    })
  );

  // Lấy kết quả so sánh đầu tiên
  const match = result.FaceMatches?.[0];

  // % giống nhau
  const similarity = match ? Number(match.Similarity.toFixed(2)) : 0;

  // Đạt nếu >= 85%
  const verified = similarity >= 85;

  // Cập nhật kết quả xác thực
  await hoSo.update({
    anh_selfie: selfieKey,
    do_tuong_dong: similarity,
    trang_thai_xac_thuc: verified ? "da_xac_thuc" : "that_bai",

    ly_do_xac_thuc_that_bai: verified
      ? null
      : "Độ tương đồng khuôn mặt dưới 85%",

    ngay_xac_thuc: new Date(),
  });

  // Trả kết quả cho controller
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