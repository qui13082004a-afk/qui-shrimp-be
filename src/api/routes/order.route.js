const express = require("express");
const router = express.Router();

const { customerProfileController } = require("../controllers");
const authMiddleware = require("../middlewares/auth.middleware");
const { authorizeAdmin } = authMiddleware;
const {
  validateCreateCustomerProfile,
  validateUpdateCustomerProfile,
} = require("../middlewares/validate");

// Khách hàng tạo hồ sơ đăng ký mua trả sau
router.post(
  "/",
  authMiddleware,
  validateCreateCustomerProfile,
  customerProfileController.createCustomerProfile
);

// Khách hàng xem hồ sơ của mình
router.get(
  "/my",
  authMiddleware,
  customerProfileController.getMyCustomerProfiles
);

// Admin xem toàn bộ hồ sơ
router.get(
  "/admin",
  authMiddleware,
  authorizeAdmin,
  customerProfileController.getAllCustomerProfiles
);

// Khách hàng / Admin / Nhân viên định mức xem chi tiết hồ sơ
router.get(
  "/:id",
  authMiddleware,
  customerProfileController.getCustomerProfileById
);

// Cập nhật hồ sơ:
// - Khách hàng: ghi chú
// - Nhân viên định mức: trạng thái kiểm tra / khảo sát
// - Admin: khóa / mở quyền trả sau, ghi chú xử lý
router.put(
  "/:id",
  authMiddleware,
  validateUpdateCustomerProfile,
  customerProfileController.updateCustomerProfile
);

module.exports = router;