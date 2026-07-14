const express = require("express");
const router = express.Router();

const notificationController = require("../controllers/notification.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const { authorizeAdmin } = authMiddleware;

router.get("/me", authMiddleware, notificationController.getMyNotifications);
router.post("/admin", authMiddleware, authorizeAdmin, notificationController.sendAdminNotification);
router.patch("/read-all", authMiddleware, notificationController.markAllAsRead);
router.patch("/:id/read", authMiddleware, notificationController.markAsRead);

module.exports = router;
