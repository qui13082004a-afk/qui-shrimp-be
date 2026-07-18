const express = require("express");
const router = express.Router();

const limitStaffAreaController = require("../controllers/limitStaffArea.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const { authorizeAdmin } = authMiddleware;

router.get("/", authMiddleware, authorizeAdmin, limitStaffAreaController.getAssignments);
router.post("/", authMiddleware, authorizeAdmin, limitStaffAreaController.assignStaffToArea);
router.put("/:id", authMiddleware, authorizeAdmin, limitStaffAreaController.updateAssignment);

module.exports = router;
