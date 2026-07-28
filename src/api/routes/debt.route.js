const express = require("express");
const debtController = require("../controllers/debt.controller");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();
const { authorizeAdmin } = authMiddleware;

// Admin xem chi tiết hồ sơ công nợ/mua trả sau của một khách hàng theo profile.
router.get(
  "/admin/profile/:profileId",
  authMiddleware,
  authorizeAdmin,
  debtController.getAdminDebtProfileDetail
);

// Admin ghi nhận một khoản thanh toán công nợ trực tiếp cho khách hàng.
router.post(
  "/admin/direct-payment",
  authMiddleware,
  authorizeAdmin,
  debtController.createAdminDirectDebtPayment
);

// Khách hàng thanh toán một phần công nợ của chính mình.
router.post(
  "/pay-partial",
  authMiddleware,
  debtController.createPartialDebtPayment
);

// Lấy danh sách các lần thanh toán công nợ của người dùng đang đăng nhập.
router.get(
  "/debt-payments",
  authMiddleware,
  debtController.getMyDebtPayments
);

// Lấy chi tiết một giao dịch thanh toán công nợ theo id.
router.get(
  "/debt-payments/:id",
  authMiddleware,
  debtController.getDebtPaymentDetail
);

// Lấy số liệu tổng quan công nợ hiện tại của người dùng đang đăng nhập.
router.get("/my-summary", authMiddleware, debtController.getMyDebtSummary);

// Lấy danh sách đơn hàng có liên quan đến công nợ của người dùng đang đăng nhập.
router.get("/my-orders", authMiddleware, debtController.getMyDebtOrders);

// Khách hàng xem chi tiết hồ sơ công nợ/mua trả sau của chính mình theo profile.
router.get(
  "/profile/:profileId",
  authMiddleware,
  debtController.getDebtProfileDetail
);

// Lấy lịch sử giao dịch công nợ của một hồ sơ mua trả sau theo profile.
router.get(
  "/profile/:profileId/transactions",
  authMiddleware,
  debtController.getDebtProfileTransactions
);

module.exports = router;
