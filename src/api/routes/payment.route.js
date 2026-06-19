const express = require("express");
const router = express.Router();

const { paymentController } = require("../controllers");
const authMiddleware = require("../middlewares/auth.middleware");
const { authorizeAdmin, authorizeAdminOrDeliveryStaff } = authMiddleware;
const { validateConfirmPayment, validateFailPayment } = require("../middlewares/validate");

// API nhận Webhook báo có tiền từ ngân hàng (PayOS, VietQR) để tự động khớp và duyệt đơn hàng
// router.post(
//   "/webhook", 
//   paymentController.processWebhook
// );

// Khách hàng xem lịch sử thanh toán của chính mình
router.get(
  "/my", 
  authMiddleware, 
  paymentController.getMyPayments
);

// Khách hàng hoặc admin xem chi tiết thanh toán của một đơn hàng cụ thể
router.get(
  "/order/:orderId",
  authMiddleware,
  paymentController.getPaymentsByOrder
);

// Admin xem toàn bộ danh sách giao dịch thanh toán trong hệ thống
router.get(
  "/admin",
  authMiddleware,
  authorizeAdmin,
  paymentController.getAllPayments
);

// Admin hoặc nhân viên giao hàng xác nhận giao dịch thành công (COD hoặc Trả sau)
router.put(
  "/:id/confirm",
  authMiddleware,
  authorizeAdminOrDeliveryStaff,
  validateConfirmPayment,
  paymentController.confirmPayment
);

// Admin đánh dấu giao dịch thanh toán bị thất bại (Chuyển khoản lỗi, COD hoàn trả)
router.put(
  "/:id/fail",
  authMiddleware,
  authorizeAdmin,
  validateFailPayment,
  paymentController.failPayment
);

module.exports = router;