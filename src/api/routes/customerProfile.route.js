const express = require("express");
const router = express.Router();

const { customerProfileController } = require("../controllers");
const authMiddleware = require("../middlewares/auth.middleware");
const { authorizeAdmin, authorizeAdminOrLimitStaff } = authMiddleware;

const {
  validateCreateCustomerProfile,
  validateUpdateCustomerProfile,
  validateApprovePostpaid,
} = require("../middlewares/validate");

// Khách hàng tạo hồ sơ xét duyệt trả sau cho ao/vụ nuôi
router.post(
  "/",
  authMiddleware,
  validateCreateCustomerProfile,
  customerProfileController.createCustomerProfile
);

// Khách hàng xem danh sách hồ sơ của chính mình
router.get(
  "/my",
  authMiddleware,
  customerProfileController.getMyCustomerProfiles
);

// Admin và nhân viên định mức xem toàn bộ hồ sơ khách hàng
router.get(
  "/admin",
  authMiddleware,
  authorizeAdminOrLimitStaff,
  customerProfileController.getAllCustomerProfiles
);

// Khách hàng, Admin hoặc nhân viên định mức xem chi tiết một hồ sơ
router.get(
  "/:id",
  authMiddleware,
  customerProfileController.getCustomerProfileById
);

// Admin duyệt quyền trả sau, định mức công nợ và hạn thanh toán
router.put(
  "/:id/approve-postpaid",
  authMiddleware,
  authorizeAdmin,
  validateApprovePostpaid,
  customerProfileController.approvePostpaid
);

// Cập nhật hồ sơ khách hàng
router.put(
  "/:id",
  authMiddleware,
  validateUpdateCustomerProfile,
  customerProfileController.updateCustomerProfile
);

module.exports = router;