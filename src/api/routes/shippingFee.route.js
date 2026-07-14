const express = require("express");
const router = express.Router();

const { shippingFeeController } = require("../controllers");
const authMiddleware = require("../middlewares/auth.middleware");
const { authorizeAdmin } = authMiddleware;

router.get("/", authMiddleware, shippingFeeController.getAllFees);
router.get("/:id", authMiddleware, shippingFeeController.getFeeById);
router.post("/calculate", authMiddleware, shippingFeeController.calculateShippingFee);
router.post("/", authMiddleware, authorizeAdmin, shippingFeeController.createFee);
router.put("/:id", authMiddleware, authorizeAdmin, shippingFeeController.updateFee);

module.exports = router;
