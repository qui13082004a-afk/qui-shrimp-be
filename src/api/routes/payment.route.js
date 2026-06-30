const express = require("express");
const router = express.Router();

const { paymentController } = require("../controllers");
const authMiddleware = require("../middlewares/auth.middleware");
const { authorizeAdmin, authorizeAdminOrDeliveryStaff } = authMiddleware;
const {
  validateConfirmPayment,
  validateFailPayment,
} = require("../middlewares/validate");

router.post(
  "/:id/payos",
  authMiddleware,
  paymentController.createPayOSPayment
);

router.post(
  "/payos-webhook",
  paymentController.handlePayOSWebhook
);

router.get(
  "/my",
  authMiddleware,
  paymentController.getMyPayments
);

router.get(
  "/order/:orderId",
  authMiddleware,
  paymentController.getPaymentsByOrder
);

router.get(
  "/admin",
  authMiddleware,
  authorizeAdmin,
  paymentController.getAllPayments
);

router.put(
  "/:id/confirm",
  authMiddleware,
  authorizeAdminOrDeliveryStaff,
  validateConfirmPayment,
  paymentController.confirmPayment
);

router.put(
  "/:id/fail",
  authMiddleware,
  authorizeAdmin,
  validateFailPayment,
  paymentController.failPayment
);

module.exports = router;