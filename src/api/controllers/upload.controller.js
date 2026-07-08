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
        imageUrl: req.file.path,
      },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

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

const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng chọn file cần upload",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Upload file thành công",
      data: {
        fileUrl: req.file.path,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
      },
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
  uploadFile,
};