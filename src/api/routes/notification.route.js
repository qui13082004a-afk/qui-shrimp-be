const express = require("express");
const router = express.Router();

const notificationController = require("../controllers/notification.controller");
const authMiddleware = require("../middlewares/auth.middleware");

router.get("/me", authMiddleware, notificationController.getMyNotifications);
router.patch("/read-all", authMiddleware, notificationController.markAllAsRead);
router.patch("/:id/read", authMiddleware, notificationController.markAsRead);

module.exports = router;