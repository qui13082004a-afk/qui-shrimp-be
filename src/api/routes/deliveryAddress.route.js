const express = require("express");
const router = express.Router();

const deliveryAddressController = require("../controllers/deliveryAddress.controller");
const authMiddleware = require("../middlewares/auth.middleware");

router.get("/my", authMiddleware, deliveryAddressController.getMyAddresses);
router.post("/my", authMiddleware, deliveryAddressController.createMyAddress);
router.put("/my/:id", authMiddleware, deliveryAddressController.updateMyAddress);
router.put(
  "/my/:id/default",
  authMiddleware,
  deliveryAddressController.setDefaultAddress
);
router.delete("/my/:id", authMiddleware, deliveryAddressController.deleteMyAddress);

module.exports = router;
