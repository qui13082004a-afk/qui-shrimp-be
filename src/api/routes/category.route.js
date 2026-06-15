const express = require("express");
const router = express.Router();

const { categoryController } = require("../controllers");
// Admin
router.post("/", categoryController.createCategory);
// Khách hàng
router.get("/", categoryController.getActiveCategories);
// Admin
router.get("/admin", categoryController.getAllCategories);
router.get("/:id", categoryController.getCategoryById);
router.put("/:id", categoryController.updateCategory);
// Admin
router.delete("/:id", categoryController.deleteCategory);
module.exports = router;