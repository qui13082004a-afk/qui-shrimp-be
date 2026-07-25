const express = require("express");
const router = express.Router();

const warehouseController = require("../controllers/warehouse.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const { authorizeAdmin } = authMiddleware;

router.get("/", warehouseController.getWarehouses);
router.get(
  "/products/:productId/stocks",
  authMiddleware,
  authorizeAdmin,
  warehouseController.getProductStocks
);
router.get(
  "/:warehouseId/stocks",
  authMiddleware,
  authorizeAdmin,
  warehouseController.getWarehouseStocks
);
router.post("/", authMiddleware, authorizeAdmin, warehouseController.createWarehouse);
router.put("/:id", authMiddleware, authorizeAdmin, warehouseController.updateWarehouse);
router.post(
  "/product-stocks",
  authMiddleware,
  authorizeAdmin,
  warehouseController.upsertProductStock
);

module.exports = router;
