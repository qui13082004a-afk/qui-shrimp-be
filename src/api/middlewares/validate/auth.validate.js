const {
  errorResponse,
  validateRequiredString,
  validateEmail,
  validatePhone,
  validatePassword,
  validateOTP,
} = require("./common");

const validateRegister = (req, res, next) => {
  try {
    const { ho_ten, email, so_dien_thoai, mat_khau, dia_chi, tinh_thanh } = req.body;

    validateRequiredString(ho_ten, "Họ tên");
    validateEmail(email);
    validatePhone(so_dien_thoai);
    validatePassword(mat_khau, 6);
    validateRequiredString(dia_chi, "Địa chỉ");
    validateRequiredString(tinh_thanh, "Tỉnh thành");

    return next();
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

const validateLogin = (req, res, next) => {
  try {
    const { email, mat_khau } = req.body;

    validateEmail(email);
    validatePassword(mat_khau, 6);

    return next();
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

const validateVerifyEmail = (req, res, next) => {
  try {
    const { email, otp_code } = req.body;

    validateEmail(email);
    validateOTP(otp_code);

    return next();
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

const validateResendOtp = (req, res, next) => {
  try {
    validateEmail(req.body.email);
    return next();
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

const validateForgotPassword = (req, res, next) => {
  try {
    validateEmail(req.body.email);
    return next();
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

const validateResetPassword = (req, res, next) => {
  try {
    const { email, otp_code, mat_khau_moi } = req.body;

    validateEmail(email);
    validateOTP(otp_code);
    validatePassword(mat_khau_moi, 6);

    return next();
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

const validateChangePassword = (req, res, next) => {
  try {
    const { mat_khau_cu, mat_khau_moi } = req.body;

    validatePassword(mat_khau_cu, 6);
    validatePassword(mat_khau_moi, 6);

    return next();
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

const validateUpdateProfile = (req, res, next) => {
  try {
    const { ho_ten, so_dien_thoai, dia_chi, tinh_thanh, anh_dai_dien } = req.body;

    if (ho_ten !== undefined) validateRequiredString(ho_ten, "Họ tên");
    if (so_dien_thoai !== undefined) validatePhone(so_dien_thoai);
    if (dia_chi !== undefined) validateRequiredString(dia_chi, "Địa chỉ");
    if (tinh_thanh !== undefined) validateRequiredString(tinh_thanh, "Tỉnh thành");
    if (anh_dai_dien !== undefined && typeof anh_dai_dien !== "string") {
      throw new Error("Ảnh đại diện không hợp lệ");
    }

    return next();
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

module.exports = {
  validateRegister,
  validateLogin,
  validateVerifyEmail,
  validateResendOtp,
  validateForgotPassword,
  validateResetPassword,
  validateChangePassword,
  validateUpdateProfile,
};