const { authService } = require("../services");

const register = async (req, res) => {
  try {
    await authService.register(req.body);

    res.status(201).json({
      success: true,
      message: "Đăng ký thành công. Vui lòng kiểm tra email để lấy mã OTP.",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { email, otp_code } = req.body;

    await authService.verifyEmail(email, otp_code);

    res.status(200).json({
      success: true,
      message: "Xác thực email thành công",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, mat_khau } = req.body;

    const data = await authService.login(email, mat_khau);

    res.status(200).json({
      success: true,
      message: "Đăng nhập thành công",
      data,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    await authService.resendOtp(email);

    res.status(200).json({
      success: true,
      message: "Đã gửi lại mã OTP. Vui lòng kiểm tra email.",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    await authService.forgotPassword(email);

    res.status(200).json({
      success: true,
      message: "Đã gửi mã OTP đặt lại mật khẩu. Vui lòng kiểm tra email.",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, otp_code, mat_khau_moi } = req.body;

    await authService.resetPassword(email, otp_code, mat_khau_moi);

    res.status(200).json({
      success: true,
      message: "Đặt lại mật khẩu thành công",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
const getMe = async (req, res) => {
  try {
    // req.user đã được authMiddleware lấy sẵn từ database sau khi check token hợp lệ
    return res.status(200).json({
      success: true,
      message: "Lấy thông tin tài khoản thành công",
      data: req.user
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
module.exports = {
  register,
  verifyEmail,
  login,
  resendOtp,
  forgotPassword,
  resetPassword,
  getMe, 
};