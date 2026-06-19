const express = require("express");
const router = express.Router();

const { orderController } = require("../controllers");
const authMiddleware = require("../middlewares/auth.middleware");
const { authorizeAdmin, authorizeAdminOrDeliveryStaff } = authMiddleware;
const { validateCreateOrder, validateUpdateOrderStatus } = require("../middlewares/validate");

// Khách hàng tạo đơn hàng mới
router.post("/", authMiddleware, validateCreateOrder, orderController.createOrder);

// Khách hàng xem danh sách đơn hàng của chính mình
router.get("/my", authMiddleware, orderController.getMyOrders);

// Admin xem toàn bộ đơn hàng trong hệ thống
router.get(
  "/admin",
  authMiddleware,
  authorizeAdmin,
  orderController.getAllOrders
);

// Khách hàng hoặc admin xem chi tiết một đơn hàng
router.get("/:id", authMiddleware, orderController.getOrderById);

// Admin hoặc nhân viên giao hàng cập nhật trạng thái đơn hàng
router.put(
  "/:id/status",
  authMiddleware,
  authorizeAdminOrDeliveryStaff,
  validateUpdateOrderStatus,
  orderController.updateOrderStatus
);

module.exports = router;