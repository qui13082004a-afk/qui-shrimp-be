const express = require("express");
const router = express.Router();

const { shippingFeeController } = require("../controllers");
const authMiddleware = require("../middlewares/auth.middleware");
const { authorizeAdmin } = authMiddleware;

// Lấy danh sách toàn bộ mức phí vận chuyển đang được cấu hình.
router.get("/", authMiddleware, shippingFeeController.getAllFees);

// Lấy chi tiết một mức phí vận chuyển theo id.
router.get("/:id", authMiddleware, shippingFeeController.getFeeById);

// Tính phí vận chuyển theo tọa độ/khu vực giao hàng đầu vào.
router.post("/calculate", authMiddleware, shippingFeeController.calculateShippingFee);

// Admin tạo mới một mức phí vận chuyển.
router.post("/", authMiddleware, authorizeAdmin, shippingFeeController.createFee);

// Admin cập nhật thông tin một mức phí vận chuyển theo id.
router.put("/:id", authMiddleware, authorizeAdmin, shippingFeeController.updateFee);

module.exports = router;
