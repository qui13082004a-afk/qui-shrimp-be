const express = require("express");
const router = express.Router();

const { orderController } = require("../controllers");
const authMiddleware = require("../middlewares/auth.middleware");
const { authorizeAdmin, authorizeAdminOrDeliveryStaff } = authMiddleware;
const {
  validateCreateOrder,
  validateUpdateOrderStatus,
} = require("../middlewares/validate");

// Xem trước thông tin đơn hàng trước khi xác nhận đặt hàng.
router.post(
  "/preview",
  authMiddleware,
  validateCreateOrder,
  orderController.previewOrder
);

// Tạo mới đơn hàng từ dữ liệu đặt hàng hợp lệ.
router.post("/", authMiddleware, validateCreateOrder, orderController.createOrder);

// Lấy danh sách đơn hàng của người dùng đang đăng nhập.
router.get("/my", authMiddleware, orderController.getMyOrders);

// Admin lấy toàn bộ danh sách đơn hàng trong hệ thống.
router.get(
  "/admin",
  authMiddleware,
  authorizeAdmin,
  orderController.getAllOrders
);

// Người dùng hủy đơn hàng của chính mình theo id.
router.put("/:id/cancel", authMiddleware, orderController.cancelMyOrder);

// Admin hoặc nhân viên giao hàng cập nhật trạng thái đơn hàng.
router.put(
  "/:id/status",
  authMiddleware,
  authorizeAdminOrDeliveryStaff,
  validateUpdateOrderStatus,
  orderController.updateOrderStatus
);

// Lấy chi tiết một đơn hàng theo id.
router.get("/:id", authMiddleware, orderController.getOrderById);

module.exports = router;
