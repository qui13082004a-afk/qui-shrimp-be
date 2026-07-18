const express = require("express");
const router = express.Router();

const { authController } = require("../controllers");
const authMiddleware = require("../middlewares/auth.middleware");
const { authorizeAdmin } = authMiddleware;

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

const upload = require("../middlewares/upload.middleware");

router.post("/register", validateRegister, authController.register);
router.post("/verify-email", validateVerifyEmail, authController.verifyEmail);
router.post("/login", validateLogin, authController.login);
router.post("/resend-otp", validateResendOtp, authController.resendOtp);
router.post("/forgot-password", validateForgotPassword, authController.forgotPassword);
router.post("/reset-password", validateResetPassword, authController.resetPassword);

router.get("/me", authMiddleware, authController.getMe);

router.put(
  "/update-profile",
  authMiddleware,
  upload.single("anh_dai_dien"),
  validateUpdateProfile,
  authController.updateProfile
);

router.put(
  "/change-password",
  authMiddleware,
  validateChangePassword,
  authController.changePassword
);

router.get(
  "/users",
  authMiddleware,
  authorizeAdmin,
  authController.getAllUsers
);

router.get(
  "/users/:id",
  authMiddleware,
  authorizeAdmin,
  authController.getUserById
);

router.patch(
  "/users/:id/role",
  authMiddleware,
  authorizeAdmin,
  authController.updateUserRole
);

router.patch(
  "/users/:id/status",
  authMiddleware,
  authorizeAdmin,
  authController.updateUserStatus
);

module.exports = router;
