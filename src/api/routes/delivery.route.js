const express = require("express");
const router = express.Router();

const { deliveryController } = require("../controllers");
const authMiddleware = require("../middlewares/auth.middleware");
const { authorizeAdmin, authorizeDeliveryStaff, ROLES } = authMiddleware;
const {
  validateAssignDelivery,
  validateSuccessDelivery,
  validateFailDelivery,
} = require("../middlewares/validate");

// Nhân viên giao hàng xem các đơn được phân công cho mình
router.get("/my", authMiddleware, deliveryController.getMyDeliveries);

// Admin xem toàn bộ danh sách giao hàng trong hệ thống
router.get(
  "/admin",
  authMiddleware,
  authorizeAdmin,
  deliveryController.getAllDeliveries
);

// Admin hoặc nhân viên giao hàng xem chi tiết một phiếu giao hàng
router.get("/:id", authMiddleware, deliveryController.getDeliveryById);

// Admin phân công đơn hàng cho nhân viên giao hàng
router.post(
  "/assign",
  authMiddleware,
  authorizeAdmin,
  validateAssignDelivery,
  deliveryController.assignDelivery
);

// Nhân viên giao hàng bắt đầu giao đơn
router.put(
  "/:id/start",
  authMiddleware,
  authorizeDeliveryStaff,
  deliveryController.startDelivery
);

// Nhân viên giao hàng xác nhận giao thành công
router.put(
  "/:id/success",
  authMiddleware,
  authorizeDeliveryStaff,
  validateSuccessDelivery,
  deliveryController.successDelivery
);

// Nhân viên giao hàng xác nhận giao thất bại
router.put(
  "/:id/fail",
  authMiddleware,
  authorizeDeliveryStaff,
  validateFailDelivery,
  deliveryController.failDelivery
);

module.exports = router;