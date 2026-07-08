const express = require("express");
const router = express.Router();

const { blogController, commentController } = require("../controllers");
const authMiddleware = require("../middlewares/auth.middleware");
const { authorizeAdmin } = authMiddleware;

// Khách hàng xem danh sách bài viết đã đăng
router.get("/", blogController.getPublic);

// Khách hàng xem bài viết của mình
router.get("/me", authMiddleware, blogController.getMine);

// Admin xem toàn bộ bài viết
router.get(
    "/admin",
    authMiddleware,
    authorizeAdmin,
    blogController.getAdmin
);

// Khách hàng xem chi tiết bài viết
router.get("/:id", blogController.getDetail);

// Khách hàng tạo bài viết gửi duyệt
router.post("/", authMiddleware, blogController.create);

// Khách hàng lưu bài viết nháp
router.post("/draft", authMiddleware, blogController.createDraft);

// Khách hàng like / unlike bài viết
router.post("/:id/like", authMiddleware, blogController.toggleLike);

// Khách hàng bình luận bài viết
router.post("/:id/comments", authMiddleware, commentController.create);

// Khách hàng cập nhật bài viết của mình
router.put("/:id", authMiddleware, blogController.updateMine);

// Admin duyệt bài viết
router.put(
    "/admin/:id/approve",
    authMiddleware,
    authorizeAdmin,
    blogController.approve
);

// Admin ẩn bài viết
router.put(
    "/admin/:id/hide",
    authMiddleware,
    authorizeAdmin,
    blogController.hide
);

// Khách hàng xóa bài viết của mình
router.delete("/:id", authMiddleware, blogController.deleteMine);

module.exports = router;