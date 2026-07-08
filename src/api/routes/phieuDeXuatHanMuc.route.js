const express = require("express");
const router = express.Router();

const phieuDeXuatHanMucController = require("../controllers/phieuDeXuatHanMuc.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const { authorizeAdmin } = authMiddleware;

// Nhân viên định mức hoặc Admin lập phiếu đề xuất
router.post(
  "/",
  authMiddleware,
  phieuDeXuatHanMucController.createProposal
);

// Admin / nhân viên định mức xem toàn bộ phiếu
router.get(
  "/",
  authMiddleware,
  phieuDeXuatHanMucController.getAllProposals
);

// Xem phiếu theo hồ sơ
router.get(
  "/profile/:profileId",
  authMiddleware,
  phieuDeXuatHanMucController.getProposalsByProfileId
);

// Admin duyệt phiếu
router.put(
  "/:id/approve",
  authMiddleware,
  authorizeAdmin,
  phieuDeXuatHanMucController.approveProposal
);

// Admin từ chối phiếu
router.put(
  "/:id/reject",
  authMiddleware,
  authorizeAdmin,
  phieuDeXuatHanMucController.rejectProposal
);

// Xem chi tiết phiếu
router.get(
  "/:id",
  authMiddleware,
  phieuDeXuatHanMucController.getProposalById
);

module.exports = router;