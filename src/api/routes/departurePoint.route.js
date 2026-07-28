const express = require("express");
const router = express.Router();

const { departurePointController } = require("../controllers");
const authMiddleware = require("../middlewares/auth.middleware");
const { authorizeAdmin } = authMiddleware;

// Lấy danh sách tất cả điểm xuất phát/kho phục vụ tính khoảng cách và giao hàng.
router.get("/", authMiddleware, departurePointController.getAllDeparturePoints);

// Lấy điểm xuất phát mặc định đang được hệ thống sử dụng.
router.get("/default", authMiddleware, departurePointController.getDefaultDeparturePoint);

// Admin tạo mới một điểm xuất phát/kho.
router.post("/", authMiddleware, authorizeAdmin, departurePointController.createDeparturePoint);

// Admin cập nhật thông tin một điểm xuất phát/kho theo id.
router.put("/:id", authMiddleware, authorizeAdmin, departurePointController.updateDeparturePoint);

module.exports = router;
