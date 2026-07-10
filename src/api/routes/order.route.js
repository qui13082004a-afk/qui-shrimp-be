const express = require("express");
const router = express.Router();

const { orderController } = require("../controllers");
const authMiddleware = require("../middlewares/auth.middleware");
const { authorizeAdmin, authorizeAdminOrDeliveryStaff } = authMiddleware;
const {
  validateCreateOrder,
  validateUpdateOrderStatus,
} = require("../middlewares/validate");

router.post("/", authMiddleware, validateCreateOrder, orderController.createOrder);

router.get("/my", authMiddleware, orderController.getMyOrders);

router.get(
  "/admin",
  authMiddleware,
  authorizeAdmin,
  orderController.getAllOrders
);

// Đặt route cụ thể TRƯỚC /:id
router.put("/:id/cancel", authMiddleware, orderController.cancelMyOrder);

router.put(
  "/:id/status",
  authMiddleware,
  authorizeAdminOrDeliveryStaff,
  validateUpdateOrderStatus,
  orderController.updateOrderStatus
);

router.get("/:id", authMiddleware, orderController.getOrderById);

module.exports = router;