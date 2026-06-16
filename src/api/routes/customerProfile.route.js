const express = require("express");
const router = express.Router();

const { customerProfileController } = require("../controllers");
const authMiddleware = require("../middlewares/auth.middleware");

// Khách hàng tạo hồ sơ xét duyệt trả sau cho ao/vụ nuôi
router.post(
  "/",
  authMiddleware,
  customerProfileController.createCustomerProfile
);

// Khách hàng xem danh sách hồ sơ của chính mình
router.get(
  "/my",
  authMiddleware,
  customerProfileController.getMyCustomerProfiles
);

// Admin xem toàn bộ hồ sơ khách hàng để xét duyệt trả sau
router.get(
  "/admin",
  authMiddleware,
  customerProfileController.getAllCustomerProfiles
);

// Khách hàng hoặc admin xem chi tiết một hồ sơ
// Khách chỉ xem hồ sơ của mình, admin xem được tất cả
router.get(
  "/:id",
  authMiddleware,
  customerProfileController.getCustomerProfileById
);

// Admin duyệt quyền trả sau, định mức công nợ và hạn thanh toán
router.put(
  "/:id/approve-postpaid",
  authMiddleware,
  customerProfileController.approvePostpaid
);

// Cập nhật hồ sơ khách hàng
// Khách chỉ cập nhật ghi chú, admin có thể cập nhật hạn mức/trạng thái trả sau
router.put(
  "/:id",
  authMiddleware,
  customerProfileController.updateCustomerProfile
);

module.exports = router;