const express = require("express");
const router = express.Router();

const { khuVucHoTroTraSauController } = require("../controllers");
const authMiddleware = require("../middlewares/auth.middleware");

const { authorizeAdmin } = authMiddleware;

// Khach kiem tra khu vuc ao co duoc ho tro mua tra sau hay khong.
router.post(
  "/check",
  authMiddleware,
  khuVucHoTroTraSauController.checkSupportedArea
);

// Khach lay danh sach khu vuc tra sau dang hoat dong de chon khi dang ky.
router.get(
  "/active",
  authMiddleware,
  khuVucHoTroTraSauController.getActiveAreas
);

// Admin xem danh sach khu vuc.
router.get(
  "/",
  authMiddleware,
  authorizeAdmin,
  khuVucHoTroTraSauController.getAllAreas
);

// Admin xem chi tiet khu vuc.
router.get(
  "/:id",
  authMiddleware,
  authorizeAdmin,
  khuVucHoTroTraSauController.getAreaById
);

// Admin them khu vuc.
router.post(
  "/",
  authMiddleware,
  authorizeAdmin,
  khuVucHoTroTraSauController.createArea
);

// Admin cap nhat hoac bat/tat khu vuc.
router.put(
  "/:id",
  authMiddleware,
  authorizeAdmin,
  khuVucHoTroTraSauController.updateArea
);

module.exports = router;
