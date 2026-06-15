const express = require("express");
const router = express.Router();

const { productController } = require("../controllers");
const upload = require("../middlewares/upload.middleware");

router.post(
  "/",
  upload.array("images", 5),
  productController.createProduct
);

router.get("/", productController.getActiveProducts);

router.get("/admin", productController.getAllProducts);

router.get("/:id", productController.getProductById);

router.put(
  "/:id",
  upload.array("images", 5),
  productController.updateProduct
);

router.delete("/:id", productController.deleteProduct);

module.exports = router;