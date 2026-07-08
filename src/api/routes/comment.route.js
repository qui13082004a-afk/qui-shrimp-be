const express = require("express");
const router = express.Router();

const { commentController } = require("../controllers");
const authMiddleware = require("../middlewares/auth.middleware");

// Khách hàng trả lời bình luận
router.post("/:id/reply", authMiddleware, commentController.reply);

// Khách hàng cập nhật bình luận của mình
router.put("/:id", authMiddleware, commentController.update);

// Khách hàng xóa bình luận của mình
router.delete("/:id", authMiddleware, commentController.remove);

module.exports = router;