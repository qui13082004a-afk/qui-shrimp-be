const express = require("express");
const router = express.Router();

const { paymentController } = require("../controllers");
const authMiddleware = require("../middlewares/auth.middleware");

// Khách hàng xem lịch sử thanh toán của chính mình
// Dùng để theo dõi số tiền, phương thức thanh toán, trạng thái thanh toán
router.get("/my", authMiddleware, paymentController.getMyPayments);

// Admin xem toàn bộ thanh toán trong hệ thống
// Dùng để đối soát doanh thu, kiểm tra thanh toán COD, chuyển khoản, trả sau
router.get("/admin", authMiddleware, paymentController.getAllPayments);

// Khách hàng hoặc admin xem thanh toán của một đơn hàng cụ thể
// Khách chỉ xem được đơn của mình, admin xem được tất cả
router.get(
  "/order/:orderId",
  authMiddleware,
  paymentController.getPaymentsByOrder
);

// Admin hoặc nhân viên giao hàng xác nhận thanh toán thành công
// COD: nhân viên giao hàng/admin xác nhận sau khi thu tiền
// Trả sau: admin xác nhận sau khi khách trả công nợ
// Chuyển khoản thủ công: admin xác nhận nếu chưa tích hợp MoMo/VNPay
router.put(
  "/:id/confirm",
  authMiddleware,
  paymentController.confirmPayment
);

// Admin đánh dấu thanh toán thất bại
// Dùng khi chuyển khoản lỗi, khách không thanh toán, hoặc COD giao thất bại
router.put("/:id/fail", authMiddleware, paymentController.failPayment);

module.exports = router;