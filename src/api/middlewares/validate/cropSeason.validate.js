const {
  errorResponse,
  validateRequiredString,
  validatePositiveNumber,
  validateDateString,
} = require("./common");

const DAY_MS = 24 * 60 * 60 * 1000;

const parseDateOnly = (value, fieldName) => {
  validateDateString(value, fieldName);

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`${fieldName} không hợp lệ`);
  }

  return date;
};

const diffDays = (fromDate, toDate) => {
  return Math.round((toDate.getTime() - fromDate.getTime()) / DAY_MS);
};

const validateCropSeasonDates = ({
  ngay_tha_giong,
  ngay_thu_hoach_du_kien,
  requireSeedDate = false,
}) => {
  let seedDate = null;
  let harvestDate = null;

  if (requireSeedDate || ngay_tha_giong !== undefined) {
    seedDate = parseDateOnly(ngay_tha_giong, "Ngày thả giống");
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const daysFromSeedToToday = diffDays(seedDate, today);

    if (daysFromSeedToToday < 0) {
      throw new Error("Ngày thả giống thực tế không được lớn hơn ngày hiện tại");
    }

    if (daysFromSeedToToday > 90) {
      throw new Error("Ngày thả giống thực tế không được cách thời điểm hiện tại quá 90 ngày");
    }
  }

  if (ngay_thu_hoach_du_kien !== undefined && ngay_thu_hoach_du_kien !== "") {
    harvestDate = parseDateOnly(ngay_thu_hoach_du_kien, "Ngày thu hoạch dự kiến");
  }

  if (seedDate && harvestDate) {
    const daysFromSeedToHarvest = diffDays(seedDate, harvestDate);

    if (daysFromSeedToHarvest < 0) {
      throw new Error("Ngày thu hoạch dự kiến không được nhỏ hơn ngày thả giống");
    }

    if (daysFromSeedToHarvest > 120) {
      throw new Error("Ngày thu hoạch dự kiến không được cách ngày thả giống quá 120 ngày");
    }
  }
};

const validateCreateCropSeason = (req, res, next) => {
  try {
    const {
      id_ao,
      ten_vu_nuoi,
      so_luong_giong,
      ngay_tha_giong,
      ngay_thu_hoach_du_kien,
    } = req.body;

    if (!id_ao) {
      throw new Error("Vui lòng chọn ao nuôi");
    }

    validateRequiredString(ten_vu_nuoi, "Tên vụ nuôi");
    validatePositiveNumber(so_luong_giong, "Số lượng giống");
    validateCropSeasonDates({
      ngay_tha_giong,
      ngay_thu_hoach_du_kien,
      requireSeedDate: true,
    });

    return next();
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

const validateUpdateCropSeason = (req, res, next) => {
  try {
    const {
      ten_vu_nuoi,
      so_luong_giong,
      ngay_tha_giong,
      ngay_thu_hoach_du_kien,
      trang_thai,
    } = req.body;

    if (ten_vu_nuoi !== undefined) {
      validateRequiredString(ten_vu_nuoi, "Tên vụ nuôi");
    }
    if (so_luong_giong !== undefined) {
      validatePositiveNumber(so_luong_giong, "Số lượng giống");
    }

    validateCropSeasonDates({ ngay_tha_giong, ngay_thu_hoach_du_kien });

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
