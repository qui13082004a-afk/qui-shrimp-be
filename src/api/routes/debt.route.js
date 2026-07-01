const express = require("express");
const debtController = require("../controllers/debt.controller");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();
router.post(
  "/pay-partial",
  authMiddleware,
  debtController.createPartialDebtPayment
);

router.get(
  "/debt-payments",
  authMiddleware,
  debtController.getMyDebtPayments
);

router.get(
  "/debt-payments/:id",
  authMiddleware,
  debtController.getDebtPaymentDetail
);
router.get("/my-summary", authMiddleware, debtController.getMyDebtSummary);
router.get("/my-orders", authMiddleware, debtController.getMyDebtOrders);

router.get(
  "/profile/:profileId",
  authMiddleware,
  debtController.getDebtProfileDetail
);

router.get(
  "/profile/:profileId/transactions",
  authMiddleware,
  debtController.getDebtProfileTransactions
);

module.exports = router;