const express = require("express");
const router = express.Router();

const { cropSeasonController } = require("../controllers");
const authMiddleware = require("../middlewares/auth.middleware");
const {
  validateCreateCropSeason,
  validateUpdateCropSeason,
} = require("../middlewares/validate");

router.post("/", authMiddleware, validateCreateCropSeason, cropSeasonController.createCropSeason);

router.get(
  "/pond/:id_ao",
  authMiddleware,
  cropSeasonController.getCropSeasonsByPond
);

router.get("/:id", authMiddleware, cropSeasonController.getCropSeasonById);

router.put("/:id", authMiddleware, validateUpdateCropSeason, cropSeasonController.updateCropSeason);

router.delete("/:id", authMiddleware, cropSeasonController.deleteCropSeason);

module.exports = router;