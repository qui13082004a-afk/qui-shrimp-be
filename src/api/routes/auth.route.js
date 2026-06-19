const express = require("express");
const router = express.Router();

const { authController } = require("../controllers");
const authMiddleware = require("../middlewares/auth.middleware");
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

// Các route xác thực không yêu cầu Token đăng nhập
router.post("/register", validateRegister, authController.register);
router.post("/verify-email", validateVerifyEmail, authController.verifyEmail);
router.post("/login", validateLogin, authController.login);
router.post("/resend-otp", validateResendOtp, authController.resendOtp);
router.post("/forgot-password", validateForgotPassword, authController.forgotPassword);
router.post("/reset-password", validateResetPassword, authController.resetPassword);

// Các route thông tin cá nhân và bảo mật yêu cầu xác thực JWT (authMiddleware)
router.get("/me", authMiddleware, authController.getMe);
router.put("/update-profile", authMiddleware, validateUpdateProfile, authController.updateProfile);
router.put("/change-password", authMiddleware, validateChangePassword, authController.changePassword);

module.exports = router;