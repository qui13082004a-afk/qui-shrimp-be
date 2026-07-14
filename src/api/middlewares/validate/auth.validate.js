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
    const { ho_ten, email, so_dien_thoai, mat_khau, dia_chi, tinh_thanh } =
      req.body;

    req.body.ho_ten = validateRequiredString(ho_ten, "Họ tên");
    req.body.email = validateEmail(email);
    req.body.so_dien_thoai = validatePhone(so_dien_thoai);
    req.body.mat_khau = validatePassword(mat_khau, 6);
    req.body.dia_chi = validateRequiredString(dia_chi, "Địa chỉ");
    req.body.tinh_thanh = validateRequiredString(tinh_thanh, "Tỉnh thành");

    return next();
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

const validateLogin = (req, res, next) => {
  try {
    const { email, mat_khau } = req.body;

    req.body.email = validateEmail(email);
    req.body.mat_khau = validatePassword(mat_khau, 6);

    return next();
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

const validateVerifyEmail = (req, res, next) => {
  try {
    const { email, otp_code } = req.body;

    req.body.email = validateEmail(email);
    req.body.otp_code = validateOTP(otp_code);

    return next();
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

const validateResendOtp = (req, res, next) => {
  try {
    req.body.email = validateEmail(req.body.email);

    return next();
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

const validateForgotPassword = (req, res, next) => {
  try {
    req.body.email = validateEmail(req.body.email);

    return next();
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

const validateResetPassword = (req, res, next) => {
  try {
    const { email, otp_code, mat_khau_moi } = req.body;

    req.body.email = validateEmail(email);
    req.body.otp_code = validateOTP(otp_code);
    req.body.mat_khau_moi = validatePassword(mat_khau_moi, 6);

    return next();
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

const validateChangePassword = (req, res, next) => {
  try {
    const { mat_khau_cu, mat_khau_moi } = req.body;

    req.body.mat_khau_cu = validatePassword(mat_khau_cu, 6);
    req.body.mat_khau_moi = validatePassword(mat_khau_moi, 6);

    return next();
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

const validateUpdateProfile = (req, res, next) => {
  try {
    const { ho_ten, so_dien_thoai, dia_chi, tinh_thanh, anh_dai_dien } =
      req.body;

    if (ho_ten !== undefined) {
      req.body.ho_ten = validateRequiredString(ho_ten, "Họ tên");
    }

    if (so_dien_thoai !== undefined) {
      req.body.so_dien_thoai = validatePhone(so_dien_thoai);
    }

    if (dia_chi !== undefined) {
      req.body.dia_chi = validateRequiredString(dia_chi, "Địa chỉ");
    }

    if (tinh_thanh !== undefined) {
      req.body.tinh_thanh = validateRequiredString(tinh_thanh, "Tỉnh thành");
    }

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
