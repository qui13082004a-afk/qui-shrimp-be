const validator = require("validator");

const validateRegister = (data) => {
  const {
    ho_ten,
    email,
    so_dien_thoai,
    mat_khau,
  } = data;

  if (!ho_ten?.trim()) {
    throw new Error("Họ tên không được để trống");
  }

  if (!validator.isEmail(email)) {
    throw new Error("Email không đúng định dạng");
  }

  if (!/^0\d{9}$/.test(so_dien_thoai)) {
    throw new Error("Số điện thoại không hợp lệ");
  }

  if (mat_khau.length < 6) {
    throw new Error("Mật khẩu phải từ 6 ký tự trở lên");
  }

  return true;
};

module.exports = {
  validateRegister,
};