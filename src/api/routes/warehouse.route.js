const express = require("express");
const router = express.Router();

const warehouseController = require("../controllers/warehouse.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const { authorizeAdmin } = authMiddleware;

// Lấy danh sách kho hàng trong hệ thống.
router.get("/", warehouseController.getWarehouses);

// Admin xem tồn kho của một sản phẩm theo từng kho.
router.get(
  "/products/:productId/stocks",
  authMiddleware,
  authorizeAdmin,
  warehouseController.getProductStocks
);

// Admin xem toàn bộ tồn kho của một kho cụ thể theo id.
router.get(
  "/:warehouseId/stocks",
  authMiddleware,
  authorizeAdmin,
  warehouseController.getWarehouseStocks
);

// Admin tạo mới kho hàng.
router.post("/", authMiddleware, authorizeAdmin, warehouseController.createWarehouse);

// Admin cập nhật thông tin kho hàng theo id.
router.put("/:id", authMiddleware, authorizeAdmin, warehouseController.updateWarehouse);

// Admin thêm mới hoặc cập nhật tồn kho sản phẩm trong kho.
router.post(
  "/product-stocks",
  authMiddleware,
  authorizeAdmin,
  warehouseController.upsertProductStock
);

module.exports = router;
