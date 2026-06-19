const { errorResponse, validateRequiredString } = require("./common");

const validateCreateCategory = (req, res, next) => {
  try {
    validateRequiredString(req.body.ten_danh_muc, "Tên danh mục");
    return next();
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

const validateUpdateCategory = (req, res, next) => {
  try {
    if (req.body.ten_danh_muc !== undefined) {
      validateRequiredString(req.body.ten_danh_muc, "Tên danh mục");
    }
    return next();
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

module.exports = {
  validateCreateCategory,
  validateUpdateCategory,
};