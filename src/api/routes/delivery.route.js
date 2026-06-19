const express = require("express");
const router = express.Router();

const { deliveryController } = require("../controllers");
const authMiddleware = require("../middlewares/auth.middleware");
const {
  validateAssignDelivery,
  validateSuccessDelivery,
  validateFailDelivery,
} = require("../middlewares/validate");

// Nhân viên giao hàng xem các đơn được phân công cho mình
// Dùng để xem địa chỉ, thông tin khách hàng và trạng thái giao hàng
router.get("/my", authMiddleware, deliveryController.getMyDeliveries);

// Admin xem toàn bộ danh sách giao hàng trong hệ thống
// Dùng để theo dõi đơn chờ giao, đang giao, giao thành công hoặc giao thất bại
router.get("/admin", authMiddleware, deliveryController.getAllDeliveries);

// Admin hoặc nhân viên giao hàng xem chi tiết một phiếu giao hàng
// Admin xem được tất cả, nhân viên chỉ xem đơn được phân công cho mình
router.get("/:id", authMiddleware, deliveryController.getDeliveryById);

// Admin phân công đơn hàng cho nhân viên giao hàng
// Tạo bản ghi giao hàng từ đơn hàng đã sẵn sàng giao
router.post(
  "/assign",
  authMiddleware,
  validateAssignDelivery,
  deliveryController.assignDelivery
);

// Nhân viên giao hàng bắt đầu giao đơn
// Chuyển trạng thái giao hàng và đơn hàng sang đang giao
router.put("/:id/start", authMiddleware, deliveryController.startDelivery);

// Nhân viên giao hàng xác nhận giao thành công
// Có thể lưu ảnh biên nhận COD và ảnh hợp đồng đối với đơn trả sau
router.put(
  "/:id/success",
  authMiddleware,
  validateSuccessDelivery,
  deliveryController.successDelivery
);

// Nhân viên giao hàng xác nhận giao thất bại
// Lưu lý do thất bại và chuyển đơn hàng sang giao thất bại
router.put(
  "/:id/fail",
  authMiddleware,
  validateFailDelivery,
  deliveryController.failDelivery
);

module.exports = router;