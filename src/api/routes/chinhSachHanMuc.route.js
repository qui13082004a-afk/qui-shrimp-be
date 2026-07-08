const express = require("express");
const router = express.Router();

const chinhSachHanMucController = require("../controllers/chinhSachHanMuc.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const { authorizeAdmin } = authMiddleware;

// Admin tạo chính sách hạn mức
router.post(
  "/",
  authMiddleware,
  authorizeAdmin,
  chinhSachHanMucController.createPolicy
);

// Admin xem toàn bộ chính sách
router.get(
  "/admin",
  authMiddleware,
  authorizeAdmin,
  chinhSachHanMucController.getAllPolicies
);

// Người dùng đăng nhập xem chính sách đang hoạt động
router.get(
  "/active",
  authMiddleware,
  chinhSachHanMucController.getActivePolicies
);

// Xem chi tiết chính sách
router.get(
  "/:id",
  authMiddleware,
  chinhSachHanMucController.getPolicyById
);

// Admin cập nhật chính sách
router.put(
  "/:id",
  authMiddleware,
  authorizeAdmin,
  chinhSachHanMucController.updatePolicy
);

// Admin bật / tạm dừng chính sách
router.patch(
  "/:id/status",
  authMiddleware,
  authorizeAdmin,
  chinhSachHanMucController.togglePolicyStatus
);

module.exports = router;