const express = require("express");
const router = express.Router();

const { pondController } = require("../controllers");
const authMiddleware = require("../middlewares/auth.middleware");
const { validateCreatePond, validateUpdatePond } = require("../middlewares/validate");

// API tạo ao nuôi mới
router.post("/", authMiddleware, validateCreatePond, pondController.createPond);

// API lấy danh sách ao nuôi của tôi
router.get("/my", authMiddleware, pondController.getMyPonds);

// API lấy chi tiết một ao nuôi qua ID
router.get("/:id", authMiddleware, pondController.getPondById);

// API cập nhật thông tin ao nuôi
router.put("/:id", authMiddleware, validateUpdatePond, pondController.updatePond);

// API xóa ao nuôi
router.delete("/:id", authMiddleware, pondController.deletePond);

module.exports = router;