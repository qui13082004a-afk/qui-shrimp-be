const validator = require("validator");

const errorResponse = (res, message) => {
  return res.status(400).json({
    success: false,
    message,
  });
};

const validateRequiredString = (value, fieldName) => {
  if (!value || !value.toString().trim()) {
    throw new Error(`${fieldName} không được để trống`);
  }
};

const validateEmail = (value) => {
  if (!value || !validator.isEmail(value)) {
    throw new Error("Email không đúng định dạng");
  }
};

const validatePhone = (value) => {
  if (!value || !/^0\d{9}$/.test(value)) {
    throw new Error("Số điện thoại không hợp lệ");
  }
};

const validatePassword = (value, minLength = 6) => {
  if (!value || typeof value !== "string" || value.length < minLength) {
    throw new Error(`Mật khẩu phải từ ${minLength} ký tự trở lên`);
  }
};

const validateOTP = (value) => {
  if (!value || !/^\d{6}$/.test(value)) {
    throw new Error("Mã OTP phải gồm 6 chữ số");
  }
};

const validatePositiveNumber = (value, fieldName) => {
  if (value === undefined || value === null || isNaN(Number(value)) || Number(value) <= 0) {
    throw new Error(`${fieldName} phải lớn hơn 0`);
  }
};

const validateNonNegativeNumber = (value, fieldName) => {
  if (value === undefined || value === null || isNaN(Number(value)) || Number(value) < 0) {
    throw new Error(`${fieldName} không hợp lệ`);
  }
};

const validateDateString = (value, fieldName) => {
  if (value !== undefined && value !== null && value !== "") {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new Error(`${fieldName} không hợp lệ`);
    }
  }
};

module.exports = {
  errorResponse,
  validateRequiredString,
  validateEmail,
  validatePhone,
  validatePassword,
  validateOTP,
  validatePositiveNumber,
  validateNonNegativeNumber,
  validateDateString,
};