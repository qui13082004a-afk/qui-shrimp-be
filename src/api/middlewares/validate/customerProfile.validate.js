const {
  errorResponse,
  validatePositiveNumber,
  validateRequiredString,
  validateDateString,
} = require("./common");

const parseDateOnly = (value, fieldName) => {
  validateDateString(value, fieldName);

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`${fieldName} không hợp lệ`);
  }

  return date;
};

const addYears = (date, years) => {
  const next = new Date(date);
  next.setFullYear(next.getFullYear() + years);
  return next;
};

const validateBirthDateAge = (value) => {
  const birthDate = parseDateOnly(value, "Ngày sinh");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (birthDate > today) {
    throw new Error("Ngày sinh không được lớn hơn ngày hiện tại");
  }

  if (addYears(birthDate, 18) > today) {
    throw new Error("Khách hàng phải từ 18 tuổi trở lên");
  }

  if (addYears(birthDate, 100) < today) {
    throw new Error("Tuổi khách hàng không được quá 100 tuổi");
  }
};

const validateCreateCustomerProfile = (req, res, next) => {
  try {
    const { id_ao, id_vu_nuoi, ngay_sinh } = req.body;

    if (!id_ao) {
      throw new Error("Vui lòng chọn ao nuôi");
    }
    if (!id_vu_nuoi) {
      throw new Error("Vui lòng chọn vụ nuôi");
    }

    validateBirthDateAge(ngay_sinh);

    return next();
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

const validateUpdateCustomerProfile = (req, res, next) => {
  try {
    const { dinh_muc_cong_no, duoc_phep_tra_sau, han_thanh_toan } = req.body;

    if (dinh_muc_cong_no !== undefined) {
      validatePositiveNumber(dinh_muc_cong_no, "Định mức công nợ");
    }
    if (duoc_phep_tra_sau !== undefined && typeof duoc_phep_tra_sau !== "boolean") {
      throw new Error("duoc_phep_tra_sau phải là boolean");
    }
    if (han_thanh_toan !== undefined) {
      validateDateString(han_thanh_toan, "Hạn thanh toán");
    }

    return next();
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

const validateApprovePostpaid = (req, res, next) => {
  try {
    const { dinh_muc_cong_no, han_thanh_toan } = req.body;

    validatePositiveNumber(dinh_muc_cong_no, "Định mức công nợ");
    validateRequiredString(han_thanh_toan, "Hạn thanh toán");
    validateDateString(han_thanh_toan, "Hạn thanh toán");

    return next();
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

module.exports = {
  validateCreateCustomerProfile,
  validateUpdateCustomerProfile,
  validateApprovePostpaid,
};
