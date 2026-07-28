const express = require("express");
const router = express.Router();

const limitStaffAreaController = require("../controllers/limitStaffArea.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const { authorizeAdmin } = authMiddleware;

// Admin lấy danh sách phân công khu vực phụ trách cho nhân viên định mức.
router.get("/", authMiddleware, authorizeAdmin, limitStaffAreaController.getAssignments);

// Admin tạo mới phân công nhân viên định mức phụ trách một khu vực.
router.post("/", authMiddleware, authorizeAdmin, limitStaffAreaController.assignStaffToArea);

// Admin cập nhật thông tin phân công khu vực phụ trách theo id.
router.put("/:id", authMiddleware, authorizeAdmin, limitStaffAreaController.updateAssignment);

module.exports = router;
