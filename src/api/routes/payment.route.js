const express = require("express");
const router = express.Router();

const { paymentController } = require("../controllers");
const authMiddleware = require("../middlewares/auth.middleware");
const { authorizeAdmin, authorizeAdminOrDeliveryStaff } = authMiddleware;
const { validateConfirmPayment, validateFailPayment } = require("../middlewares/validate");

// API nhận Webhook báo biến động số dư tự động từ VietQR / PayOS
router.post(
  "/webhook", 
  paymentController.processWebhook
);

// API nhận Webhook IPN thông báo trạng thái giao dịch tự động từ ví MoMo
router.post(
  "/momo-callback",
  paymentController.handleMomoCallback
);

// Khách hàng tự tra cứu danh sách lịch sử thanh toán của cá nhân
router.get(
  "/my", 
  authMiddleware, 
  paymentController.getMyPayments
);

// Khách hàng hoặc Admin xem chi tiết lịch sử thanh toán của một đơn hàng cụ thể
router.get(
  "/order/:orderId",
  authMiddleware,
  paymentController.getPaymentsByOrder
);

// Khách hàng gửi yêu cầu tạo link thanh toán ví MoMo dựa trên mã hóa đơn (ID thanh toán)
router.post(
  "/:id/momo",
  authMiddleware,
  paymentController.createMomoPayment
);

// Admin xem danh sách biến động số dư toàn bộ hệ thống
router.get(
  "/admin",
  authMiddleware,
  authorizeAdmin,
  paymentController.getAllPayments
);

// Admin hoặc nhân viên giao hàng xác nhận thu tiền thành công thủ công (COD hoặc ký nợ trả sau)
router.put(
  "/:id/confirm",
  authMiddleware,
  authorizeAdminOrDeliveryStaff,
  validateConfirmPayment,
  paymentController.confirmPayment
);

// Admin chủ động đánh dấu giao dịch thanh toán bị thất bại
router.put(
  "/:id/fail",
  authMiddleware,
  authorizeAdmin,
  validateFailPayment,
  paymentController.failPayment
);

module.exports = router;