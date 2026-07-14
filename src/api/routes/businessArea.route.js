const express = require("express");
const router = express.Router();

const { businessAreaController } = require("../controllers");
const authMiddleware = require("../middlewares/auth.middleware");
const { authorizeAdmin } = authMiddleware;

router.get("/", authMiddleware, businessAreaController.getAllAreas);
router.get("/:id", authMiddleware, businessAreaController.getAreaById);
router.post("/", authMiddleware, authorizeAdmin, businessAreaController.createArea);
router.put("/:id", authMiddleware, authorizeAdmin, businessAreaController.updateArea);

module.exports = router;
