const express = require("express");
const router = express.Router();

const { productController } = require("../controllers");
const authMiddleware = require("../middlewares/auth.middleware");
const { authorizeAdmin } = authMiddleware;
const upload = require("../middlewares/upload.middleware");
const { validateCreateProduct, validateUpdateProduct } = require("../middlewares/validate");

// API tạo sản phẩm mới (chỉ Admin, hỗ trợ tải lên tối đa 5 hình ảnh)
router.post(
  "/",
  authMiddleware,
  authorizeAdmin,
  upload.array("images", 5),
  validateCreateProduct,
  productController.createProduct
);

// API lấy danh sách sản phẩm đang hoạt động (dành cho khách hàng mua sắm)
router.get("/", productController.getActiveProducts);

// API lấy toàn bộ danh sách sản phẩm bao gồm cả sản phẩm ẩn (chỉ Admin)
router.get(
  "/admin",
  authMiddleware,
  authorizeAdmin,
  productController.getAllProducts
);

// API lấy thông tin chi tiết một sản phẩm qua ID
router.get("/:id", productController.getProductById);

// API cập nhật thông tin sản phẩm (chỉ Admin, hỗ trợ cập nhật tối đa 5 hình ảnh)
router.put(
  "/:id",
  authMiddleware,
  authorizeAdmin,
  upload.array("images", 5),
  validateUpdateProduct,
  productController.updateProduct
);

// API xóa sản phẩm khỏi hệ thống (chỉ Admin)
router.delete(
  "/:id",
  authMiddleware,
  authorizeAdmin,
  productController.deleteProduct
);

module.exports = router;