const express = require("express");
const router = express.Router();

const notificationController = require("../controllers/notification.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const { authorizeAdmin } = authMiddleware;

// Lấy danh sách thông báo của người dùng đang đăng nhập.
router.get("/me", authMiddleware, notificationController.getMyNotifications);

// Admin gửi thông báo chủ động đến người dùng hoặc nhóm người dùng.
router.post("/admin", authMiddleware, authorizeAdmin, notificationController.sendAdminNotification);

// Đánh dấu toàn bộ thông báo của người dùng hiện tại là đã đọc.
router.patch("/read-all", authMiddleware, notificationController.markAllAsRead);

// Đánh dấu một thông báo cụ thể là đã đọc theo id.
router.patch("/:id/read", authMiddleware, notificationController.markAsRead);

module.exports = router;
