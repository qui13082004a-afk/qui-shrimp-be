const { errorResponse, validateRequiredString } = require("./common");

const validateConfirmPayment = (req, res, next) => {
  try {
    const { ma_giao_dich } = req.body;

    if (ma_giao_dich !== undefined && typeof ma_giao_dich !== "string") {
      throw new Error("Mã giao dịch không hợp lệ");
    }

    return next();
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

const validateFailPayment = (req, res, next) => {
  try {
    const { ma_giao_dich, ly_do_that_bai, ghi_chu } = req.body;

    if (ma_giao_dich !== undefined && typeof ma_giao_dich !== "string") {
      throw new Error("Mã giao dịch không hợp lệ");
    }

    if (!ly_do_that_bai && !ghi_chu) {
      throw new Error("Vui lòng cung cấp lý do thất bại hoặc ghi chú");
    }

    return next();
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

module.exports = {
  validateConfirmPayment,
  validateFailPayment,
};