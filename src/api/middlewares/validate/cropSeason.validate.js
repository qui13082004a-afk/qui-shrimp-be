const {
  errorResponse,
  validateRequiredString,
  validatePositiveNumber,
  validateDateString,
} = require("./common");

const validateCreateCropSeason = (req, res, next) => {
  try {
    const { id_ao, ten_vu_nuoi, so_luong_giong, ngay_tha_giong } = req.body;

    if (!id_ao) {
      throw new Error("Vui lòng chọn ao nuôi");
    }

    validateRequiredString(ten_vu_nuoi, "Tên vụ nuôi");
    validatePositiveNumber(so_luong_giong, "Số lượng giống");
    validateDateString(ngay_tha_giong, "Ngày thả giống");

    return next();
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

const validateUpdateCropSeason = (req, res, next) => {
  try {
    const { ten_vu_nuoi, so_luong_giong, ngay_tha_giong, trang_thai } = req.body;

    if (ten_vu_nuoi !== undefined) {
      validateRequiredString(ten_vu_nuoi, "Tên vụ nuôi");
    }
    if (so_luong_giong !== undefined) {
      validatePositiveNumber(so_luong_giong, "Số lượng giống");
    }
    if (ngay_tha_giong !== undefined) {
      validateDateString(ngay_tha_giong, "Ngày thả giống");
    }
    if (trang_thai !== undefined) {
      const validStatuses = ["dang_nuoi", "da_thu_hoach", "huy"];
      if (!validStatuses.includes(trang_thai)) {
        throw new Error("Trạng thái vụ nuôi không hợp lệ");
      }
    }

    return next();
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

module.exports = {
  validateCreateCropSeason,
  validateUpdateCropSeason,
};