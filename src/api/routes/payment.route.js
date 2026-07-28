const express = require("express");
const router = express.Router();

const { paymentController } = require("../controllers");
const authMiddleware = require("../middlewares/auth.middleware");
const { authorizeAdmin, authorizeAdminOrDeliveryStaff } = authMiddleware;
const {
  validateConfirmPayment,
  validateFailPayment,
} = require("../middlewares/validate");

// Tạo giao dịch thanh toán payOS cho một đơn hàng theo id.
router.post(
  "/:id/payos",
  authMiddleware,
  paymentController.createPayOSPayment
);

// Xác nhận kết quả quay về từ payOS sau khi người dùng hoàn tất hoặc hủy thanh toán.
router.post(
  "/payos/confirm-return",
  authMiddleware,
  paymentController.confirmPayOSReturn
);

// Nhận webhook từ payOS để cập nhật trạng thái thanh toán từ phía cổng thanh toán.
router.post(
  "/payos-webhook",
  paymentController.handlePayOSWebhook
);

// Lấy danh sách giao dịch thanh toán của người dùng đang đăng nhập.
router.get(
  "/my",
  authMiddleware,
  paymentController.getMyPayments
);

// Lấy danh sách thanh toán theo một đơn hàng cụ thể.
router.get(
  "/order/:orderId",
  authMiddleware,
  paymentController.getPaymentsByOrder
);

// Admin lấy toàn bộ danh sách giao dịch thanh toán trong hệ thống.
router.get(
  "/admin",
  authMiddleware,
  authorizeAdmin,
  paymentController.getAllPayments
);

// Admin hoặc nhân viên giao hàng xác nhận đã thanh toán cho một giao dịch.
router.put(
  "/:id/confirm",
  authMiddleware,
  authorizeAdminOrDeliveryStaff,
  validateConfirmPayment,
  paymentController.confirmPayment
);

// Admin đánh dấu một giao dịch thanh toán thất bại theo id.
router.put(
  "/:id/fail",
  authMiddleware,
  authorizeAdmin,
  validateFailPayment,
  paymentController.failPayment
);

module.exports = router;
