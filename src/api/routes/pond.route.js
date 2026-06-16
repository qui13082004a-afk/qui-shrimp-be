const express = require("express");
const router = express.Router();

const { pondController } = require("../controllers");
const authMiddleware = require("../middlewares/auth.middleware");

router.post("/", authMiddleware, pondController.createPond);

router.get("/my", authMiddleware, pondController.getMyPonds);

router.get("/:id", authMiddleware, pondController.getPondById);

router.put("/:id", authMiddleware, pondController.updatePond);

router.delete("/:id", authMiddleware, pondController.deletePond);

module.exports = router;