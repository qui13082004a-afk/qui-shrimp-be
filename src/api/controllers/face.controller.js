const faceService = require("../services/face.service");

const registerFace = async (req, res) => {
  try {
    const { id_ho_so } = req.params;

    const cccdFrontFile = req.files?.cccd_front?.[0];
    const cccdBackFile = req.files?.cccd_back?.[0];

    if (!cccdFrontFile || !cccdBackFile) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng upload đủ CCCD mặt trước và mặt sau",
      });
    }

    const result = await faceService.registerFace({
      id_ho_so,
      cccdFrontFile,
      cccdBackFile,
    });

    return res.json({
      success: true,
      message: "Đăng ký ảnh CCCD thành công",
      data: result,
    });
  } catch (error) {
    console.log("REGISTER FACE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Lỗi đăng ký ảnh CCCD",
      error: error.message,
    });
  }
};

const verifyFace = async (req, res) => {
  try {
    const { id_ho_so } = req.params;
    const selfieFile = req.file;

    if (!selfieFile) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng upload ảnh selfie",
      });
    }

    const result = await faceService.verifyFace({
      id_ho_so,
      selfieFile,
    });

    return res.json({
      success: true,
      message: result.verified
        ? "Xác thực khuôn mặt thành công"
        : "Xác thực khuôn mặt thất bại",
      data: result,
    });
  } catch (error) {
    console.log("VERIFY FACE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Lỗi xác thực khuôn mặt",
      error: error.message,
    });
  }
};

module.exports = {
  registerFace,
  verifyFace,
};