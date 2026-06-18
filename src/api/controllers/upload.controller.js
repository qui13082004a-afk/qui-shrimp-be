const cloudinary = require("../../config/cloudinary");

/**
 * Xử lý tải một ảnh đơn lẻ lên Cloudinary (Dành cho Avatar, ảnh danh mục)
 */
const uploadSingleImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng chọn ảnh cần upload",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Upload ảnh thành công",
      data: {
        imageUrl: req.file.path, // URL an toàn (https) trả về từ Cloudinary
      },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Xử lý tải nhiều ảnh lên Cloudinary cùng lúc (Dành cho bộ ảnh sản phẩm, bài viết)
 */
const uploadMultipleImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng chọn ít nhất một ảnh",
      });
    }

    const imageUrls = req.files.map((file) => file.path);

    return res.status(200).json({
      success: true,
      message: "Upload nhiều ảnh thành công",
      data: imageUrls,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  uploadSingleImage,
  uploadMultipleImages,
};