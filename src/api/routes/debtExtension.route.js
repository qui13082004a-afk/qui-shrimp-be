const express = require("express");
const router = express.Router();

const { debtExtensionController } = require("../controllers");
const authMiddleware = require("../middlewares/auth.middleware");
const { authorizeAdmin } = authMiddleware;

const upload = require("../middlewares/upload.middleware");

// Khách hàng gửi yêu cầu gia hạn công nợ, có thể đính kèm tối đa 5 hình ảnh minh chứng.
router.post(
  "/",
  authMiddleware,
  upload.array("images", 5),
  debtExtensionController.createDebtExtension
);

// Lấy danh sách yêu cầu gia hạn công nợ của người dùng đang đăng nhập.
router.get(
  "/my",
  authMiddleware,
  debtExtensionController.getMyDebtExtensions
);

// Admin lấy toàn bộ danh sách yêu cầu gia hạn công nợ trong hệ thống.
router.get(
  "/admin",
  authMiddleware,
  authorizeAdmin,
  debtExtensionController.getAllDebtExtensions
);

// Lấy danh sách yêu cầu gia hạn công nợ theo một hồ sơ mua trả sau cụ thể.
router.get(
  "/profile/:profileId",
  authMiddleware,
  debtExtensionController.getDebtExtensionsByProfileId
);

// Lấy chi tiết một yêu cầu gia hạn công nợ theo id.
router.get(
  "/:id",
  authMiddleware,
  debtExtensionController.getDebtExtensionById
);

// Admin duyệt yêu cầu gia hạn công nợ.
router.put(
  "/:id/approve",
  authMiddleware,
  authorizeAdmin,
  debtExtensionController.approveDebtExtension
);

// Admin từ chối yêu cầu gia hạn công nợ.
router.put(
  "/:id/reject",
  authMiddleware,
  authorizeAdmin,
  debtExtensionController.rejectDebtExtension
);

module.exports = router;
