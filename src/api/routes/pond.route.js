const express = require("express");
const router = express.Router();

const { pondController } = require("../controllers");
const authMiddleware = require("../middlewares/auth.middleware");
const { validateCreatePond, validateUpdatePond } = require("../middlewares/validate");

router.post("/", authMiddleware, validateCreatePond, pondController.createPond);

router.get("/my", authMiddleware, pondController.getMyPonds);

router.get("/:id", authMiddleware, pondController.getPondById);

router.put("/:id", authMiddleware, validateUpdatePond, pondController.updatePond);

router.delete("/:id", authMiddleware, pondController.deletePond);

module.exports = router;