const express = require("express");
const router = express.Router();

const { departurePointController } = require("../controllers");
const authMiddleware = require("../middlewares/auth.middleware");
const { authorizeAdmin } = authMiddleware;

router.get("/", authMiddleware, departurePointController.getAllDeparturePoints);
router.get("/default", authMiddleware, departurePointController.getDefaultDeparturePoint);
router.post("/", authMiddleware, authorizeAdmin, departurePointController.createDeparturePoint);
router.put("/:id", authMiddleware, authorizeAdmin, departurePointController.updateDeparturePoint);

module.exports = router;
