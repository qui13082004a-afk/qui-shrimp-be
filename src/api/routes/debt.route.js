const express = require("express");
const debtController = require("../controllers/debt.controller");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

router.get("/my-summary", authMiddleware, debtController.getMyDebtSummary);
router.get("/my-orders", authMiddleware, debtController.getMyDebtOrders);

module.exports = router;