const express = require("express");
const router = express.Router();

const { locationController } = require("../controllers");
const authMiddleware = require("../middlewares/auth.middleware");
const { authorizeAdmin } = authMiddleware;

router.get("/provinces", authMiddleware, locationController.getAllProvinces);

router.get(
  "/provinces/:id_tinh_thanh/wards",
  locationController.getWardsByProvinceId
);

router.post(
  "/import-wards",
  authMiddleware,
  authorizeAdmin,
  locationController.importAdministrativeUnits
);

router.post(
  "/resolve-coordinate",
  authMiddleware,
  locationController.resolveCoordinate
);

module.exports = router;
