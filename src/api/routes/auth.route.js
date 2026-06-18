const express = require("express");
const router = express.Router();

const { authController } = require("../controllers");
const authMiddleware = require("../middlewares/auth.middleware");

// Các route xác thực không yêu cầu Token đăng nhập
router.post("/register", authController.register);
router.post("/verify-email", authController.verifyEmail);
router.post("/login", authController.login);
router.post("/resend-otp", authController.resendOtp);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);

// Các route thông tin cá nhân và bảo mật yêu cầu xác thực JWT (authMiddleware)
router.get("/me", authMiddleware, authController.getMe);
router.put("/update-profile", authMiddleware, authController.updateProfile);
router.put("/change-password", authMiddleware, authController.changePassword);

module.exports = router;