const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { authRepository } = require("../repositories");
const { validateRegister } = require("../../validates/auth.validate");
const sendEmail = require("../../helpers/sendEmail");

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const safeSendEmail = async (to, subject, text) => {
  try {
    await sendEmail(to, subject, text);
  } catch (error) {
    console.log("SEND EMAIL ERROR:", error.message);
  }
};

const register = async (data) => {
  validateRegister(data);

  const { ho_ten, so_dien_thoai, dia_chi, email, mat_khau, tinh_thanh } = data;

  const existedUser = await authRepository.findByEmail(
    email
  );

  if (existedUser) {
    throw new Error("Email đã tồn tại");
  }

  const hashedPassword = await bcrypt.hash(mat_khau, 10);

  const otp = generateOTP();
  const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

  const user = await authRepository.createUser({
    ho_ten,
    so_dien_thoai,
    dia_chi,
    email,
    mat_khau: hashedPassword,
    tinh_thanh,
    vai_tro: "khach_hang",
    trang_thai_tai_khoan: "chua_xac_thuc",
    otp_code: otp,
    otp_expires: otpExpires,
  });

  await safeSendEmail(
    email,
    "Mã xác thực tài khoản",
    `Mã OTP của bạn là: ${otp}. Mã có hiệu lực trong 5 phút.`
  );

  return user;
};

const verifyEmail = async (email, otp_code) => {
  const user = await authRepository.findByEmail(email);

  if (!user) {
    throw new Error("Email không tồn tại");
  }

  if (user.trang_thai_tai_khoan === "hoat_dong") {
    throw new Error("Tài khoản đã được xác thực");
  }

  if (user.trang_thai_tai_khoan === "khoa") {
    throw new Error("Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.");
  }

  if (user.otp_code !== otp_code) {
    throw new Error("Mã OTP không chính xác");
  }

  if (new Date() > user.otp_expires) {
    throw new Error("Mã OTP đã hết hạn");
  }

  user.trang_thai_tai_khoan = "hoat_dong";
  user.otp_code = null;
  user.otp_expires = null;

  await user.save();

  return user;
};

const login = async (email, mat_khau) => {
  const user = await authRepository.findByEmail(email);

  if (!user) {
    throw new Error("Email không tồn tại");
  }

  if (user.trang_thai_tai_khoan === "chua_xac_thuc") {
    throw new Error(
      "Tài khoản chưa xác thực email. Vui lòng xác thực email trước khi đăng nhập."
    );
  }

  if (user.trang_thai_tai_khoan === "khoa") {
    throw new Error("Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.");
  }

  const isMatch = await bcrypt.compare(mat_khau, user.mat_khau);

  if (!isMatch) {
    throw new Error("Mật khẩu không chính xác");
  }

  const token = jwt.sign(
    {
      id_nguoi_dung: user.id_nguoi_dung,
      vai_tro: user.vai_tro,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  user.mat_khau = undefined;
  user.otp_code = undefined;
  user.otp_expires = undefined;

  return {
    token,
    user,
  };
};

const resendOtp = async (email) => {
  const user = await authRepository.findByEmail(email);

  if (!user) {
    throw new Error("Không tìm thấy tài khoản");
  }

  if (user.trang_thai_tai_khoan === "hoat_dong") {
    throw new Error("Tài khoản đã được xác thực");
  }

  if (user.trang_thai_tai_khoan === "khoa") {
    throw new Error("Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.");
  }

  const otp = generateOTP();
  const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

  user.otp_code = otp;
  user.otp_expires = otpExpires;

  await user.save();

  await safeSendEmail(
    email,
    "Mã OTP mới",
    `Mã OTP mới của bạn là: ${otp}. Mã có hiệu lực trong 5 phút.`
  );

  return true;
};

const forgotPassword = async (email) => {
  const user = await authRepository.findByEmail(email);

  if (!user) {
    throw new Error("Email không tồn tại");
  }

  if (user.trang_thai_tai_khoan === "chua_xac_thuc") {
    throw new Error(
      "Tài khoản chưa xác thực email. Vui lòng xác thực email trước khi đặt lại mật khẩu."
    );
  }

  if (user.trang_thai_tai_khoan === "khoa") {
    throw new Error("Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.");
  }

  const otp = generateOTP();
  const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

  user.otp_code = otp;
  user.otp_expires = otpExpires;

  await user.save();

  await safeSendEmail(
    email,
    "Mã đặt lại mật khẩu",
    `Mã OTP đặt lại mật khẩu của bạn là: ${otp}. Mã có hiệu lực trong 5 phút.`
  );

  return true;
};

const resetPassword = async (email, otp_code, mat_khau_moi) => {
  const user = await authRepository.findByEmail(email);

  if (!user) {
    throw new Error("Email không tồn tại");
  }

  if (user.trang_thai_tai_khoan === "chua_xac_thuc") {
    throw new Error(
      "Tài khoản chưa xác thực email. Vui lòng xác thực email trước khi đặt lại mật khẩu."
    );
  }

  if (user.trang_thai_tai_khoan === "khoa") {
    throw new Error("Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.");
  }

  if (!mat_khau_moi || mat_khau_moi.length < 6) {
    throw new Error("Mật khẩu mới phải từ 6 ký tự trở lên");
  }

  if (user.otp_code !== otp_code) {
    throw new Error("Mã OTP không chính xác");
  }

  if (new Date() > user.otp_expires) {
    throw new Error("Mã OTP đã hết hạn");
  }

  const hashedPassword = await bcrypt.hash(mat_khau_moi, 10);

  user.mat_khau = hashedPassword;
  user.otp_code = null;
  user.otp_expires = null;

  await user.save();

  return true;
};

/**
 * CẬP NHẬT THÔNG TIN CÁ NHÂN (Dành cho ProfilePage)
 */
const updateProfile = async (userId, updateData) => {
  const user = await authRepository.findById(userId);

  if (!user) {
    throw new Error("Không tìm thấy thông tin tài khoản");
  }

  // Danh sách các trường được phép cập nhật thủ công
  const allowedFields = ["ho_ten", "so_dien_thoai", "dia_chi", "tinh_thanh", "anh_dai_dien"];
  
  allowedFields.forEach((field) => {
    if (updateData[field] !== undefined) {
      user[field] = updateData[field];
    }
  });

  await user.save();
  user.mat_khau = undefined;
  user.otp_code = undefined;
  user.otp_expires = undefined;

  return user;
};

/**
 * ĐỔI MẬT KHẨU AN TOÀN (Kiểm tra mật khẩu cũ)
 */
const changePassword = async (userId, mat_khau_cu, mat_khau_moi) => {
  const user = await authRepository.findById(userId);

  if (!user) {
    throw new Error("Không tìm thấy tài khoản");
  }

  if (!mat_khau_moi || mat_khau_moi.length < 6) {
    throw new Error("Mật khẩu mới phải từ 6 ký tự trở lên");
  }

  // Đối chiếu mật khẩu hiện tại
  const isMatch = await bcrypt.compare(mat_khau_cu, user.mat_khau);
  if (!isMatch) {
    throw new Error("Mật khẩu hiện tại không chính xác");
  }

  // Thực hiện mã hóa mật khẩu mới
  const hashedPassword = await bcrypt.hash(mat_khau_moi, 10);
  user.mat_khau = hashedPassword;
  await user.save();

  return true;
};

module.exports = {
  register,
  verifyEmail,
  login,
  resendOtp,
  forgotPassword,
  resetPassword,
  updateProfile,
  changePassword,
};