const {
  errorResponse,
  validateRequiredString,
  validatePositiveNumber,
} = require("./common");

const validateCreatePond = (req, res, next) => {
  try {
    const { ten_ao, dien_tich, dia_chi_ao } = req.body;

    validateRequiredString(ten_ao, "Tên ao");
    validatePositiveNumber(dien_tich, "Diện tích ao");
    validateRequiredString(dia_chi_ao, "Địa chỉ ao");

    return next();
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

const validateUpdatePond = (req, res, next) => {
  try {
    const { ten_ao, dien_tich, dia_chi_ao } = req.body;

    if (ten_ao !== undefined) {
      validateRequiredString(ten_ao, "Tên ao");
    }
    if (dien_tich !== undefined) {
      validatePositiveNumber(dien_tich, "Diện tích ao");
    }
    if (dia_chi_ao !== undefined) {
      validateRequiredString(dia_chi_ao, "Địa chỉ ao");
    }

    return next();
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

module.exports = {
  validateCreatePond,
  validateUpdatePond,
};