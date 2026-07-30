const {
  errorResponse,
  validateRequiredString,
  validatePositiveNumber,
  validateDateString,
} = require("./common");

const DAY_MS = 24 * 60 * 60 * 1000;

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

    validateDateString(ngay_tha_giong, "Ngày thả giống");
    const seedDate = new Date(`${ngay_tha_giong}T00:00:00`);
    if (Number.isNaN(seedDate.getTime())) {
      throw new Error("Ngày thả giống không hợp lệ");
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysFromSeedToToday = Math.round((today.getTime() - seedDate.getTime()) / DAY_MS);
    if (daysFromSeedToToday > 90) {
      throw new Error("Ngày thả giống thực tế không được cách thời điểm hiện tại quá 90 ngày");
    }

    if (ngay_thu_hoach_du_kien !== undefined && ngay_thu_hoach_du_kien !== "") {
      validateDateString(ngay_thu_hoach_du_kien, "Ngày thu hoạch dự kiến");
      const harvestDate = new Date(`${ngay_thu_hoach_du_kien}T00:00:00`);
      if (Number.isNaN(harvestDate.getTime())) {// ko phải số
        throw new Error("Ngày thu hoạch dự kiến không hợp lệ");
      }
      const daysFromSeedToHarvest = Math.round((harvestDate.getTime() - seedDate.getTime()) / DAY_MS);
      if (daysFromSeedToHarvest < 0) {
        throw new Error("Ngày thu hoạch dự kiến không được nhỏ hơn ngày thả giống");
      }
      const maxDate = new Date(seedDate);
      maxDate.setMonth(maxDate.getMonth() + 5);
      if (harvestDate.getTime() > maxDate.getTime()) {
        throw new Error("Khoảng thời gian giữa ngày thả giống và ngày thu hoạch dự kiến không được vượt quá 5 tháng");
      }
    }

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

    let seedDate = null;
    let harvestDate = null;

    if (ngay_tha_giong !== undefined) {
      validateDateString(ngay_tha_giong, "Ngày thả giống");
      seedDate = new Date(`${ngay_tha_giong}T00:00:00`);
      if (Number.isNaN(seedDate.getTime())) {
        throw new Error("Ngày thả giống không hợp lệ");
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const daysFromSeedToToday = Math.round((today.getTime() - seedDate.getTime()) / DAY_MS);
      if (daysFromSeedToToday > 90) {
        throw new Error("Ngày thả giống thực tế không được cách thời điểm hiện tại quá 90 ngày");
      }
    }

    if (ngay_thu_hoach_du_kien !== undefined && ngay_thu_hoach_du_kien !== "") {
      validateDateString(ngay_thu_hoach_du_kien, "Ngày thu hoạch dự kiến");
      harvestDate = new Date(`${ngay_thu_hoach_du_kien}T00:00:00`);
      if (Number.isNaN(harvestDate.getTime())) {
        throw new Error("Ngày thu hoạch dự kiến không hợp lệ");
      }
    }

    if (seedDate && harvestDate) {
      const daysFromSeedToHarvest = Math.round((harvestDate.getTime() - seedDate.getTime()) / DAY_MS);
      if (daysFromSeedToHarvest < 0) {
        throw new Error("Ngày thu hoạch dự kiến không được nhỏ hơn ngày thả giống");
      }

      if (daysFromSeedToHarvest > 150) {
        throw new Error("Ngày thu hoạch dự kiến không được cách ngày thả giống quá 150 ngày");
      }
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
