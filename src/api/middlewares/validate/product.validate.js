const {
  errorResponse,
  validateRequiredString,
  validatePositiveNumber,
  validateNonNegativeNumber,
} = require("./common");

const validateCreateProduct = (req, res, next) => {
  try {
    const {
      id_danh_muc,
      ten_san_pham,
      gia,
      ton_kho,
    } = req.body;

    if (!id_danh_muc) {
      throw new Error("Vui lòng chọn danh mục");
    }

    validateRequiredString(ten_san_pham, "Tên sản phẩm");
    validatePositiveNumber(gia, "Giá bán");
    validateNonNegativeNumber(ton_kho, "Tồn kho");

    return next();
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

const validateUpdateProduct = (req, res, next) => {
  try {
    const {
      id_danh_muc,
      ten_san_pham,
      gia,
      ton_kho,
    } = req.body;

    if (id_danh_muc !== undefined && !id_danh_muc) {
      throw new Error("Vui lòng chọn danh mục");
    }

    if (ten_san_pham !== undefined) {
      validateRequiredString(ten_san_pham, "Tên sản phẩm");
    }

    if (gia !== undefined) {
      validatePositiveNumber(gia, "Giá bán");
    }

    if (ton_kho !== undefined) {
      validateNonNegativeNumber(ton_kho, "Tồn kho");
    }

    return next();
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

module.exports = {
  validateCreateProduct,
  validateUpdateProduct,
};