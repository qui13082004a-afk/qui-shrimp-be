const {
  errorResponse,
  validatePositiveNumber,
  validateRequiredString,
  validateDateString,
} = require("./common");

const validateCreateCustomerProfile = (req, res, next) => {
  try {
    const { id_ao, id_vu_nuoi } = req.body;

    if (!id_ao) {
      throw new Error("Vui lòng chọn ao nuôi");
    }
    if (!id_vu_nuoi) {
      throw new Error("Vui lòng chọn vụ nuôi");
    }

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