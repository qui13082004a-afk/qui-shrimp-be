const express = require("express");
const router = express.Router();

const {
  khuVucHoTroTraSauController,
} = require("../controllers");

const authMiddleware = require(
  "../middlewares/auth.middleware"
);

const {
  authorizeAdmin,
} = authMiddleware;

// Khách kiểm tra khu vực ao có được hỗ trợ hay không
router.post(
  "/check",
  authMiddleware,
  khuVucHoTroTraSauController.checkSupportedArea
);

// Admin xem danh sách khu vực
router.get(
  "/",
  authMiddleware,
  authorizeAdmin,
  khuVucHoTroTraSauController.getAllAreas
);

// Admin xem chi tiết
router.get(
  "/:id",
  authMiddleware,
  authorizeAdmin,
  khuVucHoTroTraSauController.getAreaById
);

// Admin thêm khu vực
router.post(
  "/",
  authMiddleware,
  authorizeAdmin,
  khuVucHoTroTraSauController.createArea
);

// Admin cập nhật hoặc bật/tắt khu vực
router.put(
  "/:id",
  authMiddleware,
  authorizeAdmin,
  khuVucHoTroTraSauController.updateArea
);

module.exports = router;