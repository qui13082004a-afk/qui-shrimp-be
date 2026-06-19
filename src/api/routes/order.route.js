const express = require("express");
const router = express.Router();

const { orderController } = require("../controllers");
const authMiddleware = require("../middlewares/auth.middleware");
const { validateCreateOrder, validateUpdateOrderStatus } = require("../middlewares/validate");

// Khách hàng tạo đơn hàng mới
// Hệ thống kiểm tra tồn kho, tính tổng tiền, tạo đơn hàng, tạo chi tiết đơn hàng và tạo thanh toán
router.post("/", authMiddleware, validateCreateOrder, orderController.createOrder);

// Khách hàng xem danh sách đơn hàng của chính mình
// Dùng để theo dõi trạng thái đơn hàng, tổng tiền, hình thức thanh toán
router.get("/my", authMiddleware, orderController.getMyOrders);

// Admin xem toàn bộ đơn hàng trong hệ thống
// Dùng để quản lý, duyệt đơn, theo dõi đơn chờ xử lý, chờ thanh toán, đang giao, hoàn tất
router.get("/admin", authMiddleware, orderController.getAllOrders);

// Khách hàng hoặc admin xem chi tiết một đơn hàng
// Khách chỉ xem được đơn của mình, admin xem được tất cả đơn hàng
router.get("/:id", authMiddleware, orderController.getOrderById);

// Admin hoặc nhân viên giao hàng cập nhật trạng thái đơn hàng
// Ví dụ: cho_xu_ly -> cho_giao -> dang_giao -> hoan_tat hoặc giao_that_bai
router.put("/:id/status", authMiddleware, orderController.updateOrderStatus);

module.exports = router;