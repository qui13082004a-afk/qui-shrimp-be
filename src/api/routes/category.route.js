const express = require("express");
const router = express.Router();

const { categoryController } = require("../controllers");
const authMiddleware = require("../middlewares/auth.middleware");
const { authorizeAdmin } = authMiddleware;
const { validateCreateCategory, validateUpdateCategory } = require("../middlewares/validate");

// Admin tạo danh mục
router.post(
  "/",
  authMiddleware,
  authorizeAdmin,
  validateCreateCategory,
  categoryController.createCategory
);

// Khách hàng xem danh mục công khai
router.get("/", categoryController.getActiveCategories);

// Admin xem toàn bộ danh mục
router.get(
  "/admin",
  authMiddleware,
  authorizeAdmin,
  categoryController.getAllCategories
);

router.get("/:id", categoryController.getCategoryById);

// Admin cập nhật danh mục
router.put(
  "/:id",
  authMiddleware,
  authorizeAdmin,
  validateUpdateCategory,
  categoryController.updateCategory
);

// Admin xóa danh mục
router.delete(
  "/:id",
  authMiddleware,
  authorizeAdmin,
  categoryController.deleteCategory
);

module.exports = router;