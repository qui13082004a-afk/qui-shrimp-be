const express = require("express");
const router = express.Router();

const deliveryAddressController = require("../controllers/deliveryAddress.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// Lấy danh sách địa chỉ giao hàng của người dùng đang đăng nhập.
router.get("/my", authMiddleware, deliveryAddressController.getMyAddresses);

// Tạo mới một địa chỉ giao hàng cho người dùng đang đăng nhập.
router.post("/my", authMiddleware, deliveryAddressController.createMyAddress);

// Cập nhật thông tin một địa chỉ giao hàng của người dùng đang đăng nhập theo id.
router.put("/my/:id", authMiddleware, deliveryAddressController.updateMyAddress);

// Đặt một địa chỉ giao hàng làm địa chỉ mặc định.
router.put(
  "/my/:id/default",
  authMiddleware,
  deliveryAddressController.setDefaultAddress
);

// Xóa một địa chỉ giao hàng của người dùng đang đăng nhập theo id.
router.delete("/my/:id", authMiddleware, deliveryAddressController.deleteMyAddress);

module.exports = router;
