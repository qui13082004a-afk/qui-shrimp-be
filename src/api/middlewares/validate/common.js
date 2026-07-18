const validator = require("validator");

const errorResponse = (res, message, errors = null) => {
  const payload = {
    success: false,
    message,
  };

  if (errors) {
    payload.errors = errors;
  }

  return res.status(400).json(payload);
};

const validateRequiredString = (value, fieldName) => {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${fieldName} không được để trống`);
  }

  return value.trim();
};

const validateEmail = (value) => {
  if (typeof value !== "string" || !validator.isEmail(value.trim())) {
    throw new Error("Email không đúng định dạng");
  }

  return value.trim().toLowerCase();
};

const validatePhone = (value) => {
  if (typeof value !== "string" || !/^0\d{9}$/.test(value.trim())) {
    throw new Error("Số điện thoại không hợp lệ");
  }

  return value.trim();
};

const validatePassword = (value, minLength = 6) => {
  if (typeof value !== "string" || value.length < minLength) {
    throw new Error(`Mật khẩu phải từ ${minLength} ký tự trở lên`);
  }

  return value;
};

const validateOTP = (value) => {
  if (typeof value !== "string" || !/^\d{6}$/.test(value.trim())) {
    throw new Error("Mã OTP phải gồm 6 chữ số");
  }

  return value.trim();
};

const validatePositiveNumber = (value, fieldName) => {
  const number = Number(value);

  if (!Number.isFinite(number) || number <= 0) {
    throw new Error(`${fieldName} phải lớn hơn 0`);
  }

  return number;
};

const validateNonNegativeNumber = (value, fieldName) => {
  const number = Number(value);

  if (!Number.isFinite(number) || number < 0) {
    throw new Error(`${fieldName} không hợp lệ`);
  }

  return number;
};

const validateDateString = (value, fieldName) => {
  if (value === undefined || value === null || value === "") {
    return value;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`${fieldName} không hợp lệ`);
  }

  return value;
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
