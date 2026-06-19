const express = require("express");
const router = express.Router();

const { authController } = require("../controllers");
const authMiddleware = require("../middlewares/auth.middleware");
const {
  authorizeAdmin,
  authorizeCustomer,
  authorizeDeliveryStaff
} = require("../middlewares/auth.middleware");

const {
  validateRegister,
  validateLogin,
  validateVerifyEmail,
  validateResendOtp,
  validateForgotPassword,
  validateResetPassword,
  validateChangePassword,
  validateUpdateProfile,
} = require("../middlewares/validate");

router.post("/register", validateRegister, authController.register);
router.post("/verify-email", validateVerifyEmail, authController.verifyEmail);
router.post("/login", validateLogin, authController.login);
router.post("/resend-otp", validateResendOtp, authController.resendOtp);
router.post("/forgot-password", validateForgotPassword, authController.forgotPassword);
router.post("/reset-password", validateResetPassword, authController.resetPassword);

// Lấy thông tin cá nhân của người đang đăng nhập (Ai đăng nhập cũng xem được chính mình)
router.get("/me", authMiddleware, authController.getMe);

// Cập nhật profile cá nhân
router.put("/update-profile", authMiddleware, validateUpdateProfile, authController.updateProfile);

// Đổi mật khẩu cá nhân
router.put("/change-password", authMiddleware, validateChangePassword, authController.changePassword);

module.exports = router;