const express = require("express");
const router = express.Router();

const { cropSeasonController } = require("../controllers");
const authMiddleware = require("../middlewares/auth.middleware");

router.post("/", authMiddleware, cropSeasonController.createCropSeason);

router.get(
  "/pond/:id_ao",
  authMiddleware,
  cropSeasonController.getCropSeasonsByPond
);

router.get("/:id", authMiddleware, cropSeasonController.getCropSeasonById);

router.put("/:id", authMiddleware, cropSeasonController.updateCropSeason);

router.delete("/:id", authMiddleware, cropSeasonController.deleteCropSeason);

module.exports = router;