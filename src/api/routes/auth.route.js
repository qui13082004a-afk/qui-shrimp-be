const express = require("express");
const router = express.Router();

const { authController } = require("../controllers");
const authMiddleware = require("../middlewares/auth.middleware");
router.post("/register", authController.register);
router.post("/verify-email", authController.verifyEmail);
router.post("/login", authController.login);
router.post("/resend-otp", authController.resendOtp);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);
router.get("/me", authMiddleware, authController.getMe);
module.exports = router;