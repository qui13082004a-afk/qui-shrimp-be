const express = require("express");
const router = express.Router();

const thuongLaiController = require("../controllers/thuongLai.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const { authorizeAdmin } = authMiddleware;

router.post(
  "/",
  authMiddleware,
  thuongLaiController.createMerchant
);

router.get(
  "/",
  authMiddleware,
  thuongLaiController.getAllMerchants
);

router.get(
  "/active",
  authMiddleware,
  thuongLaiController.getActiveMerchants
);

router.get(
  "/:id",
  authMiddleware,
  thuongLaiController.getMerchantById
);

router.put(
  "/:id",
  authMiddleware,
  authorizeAdmin,
  thuongLaiController.updateMerchant
);

router.patch(
  "/:id/status",
  authMiddleware,
  authorizeAdmin,
  thuongLaiController.updateMerchantStatus
);

router.patch(
  "/:id/violation",
  authMiddleware,
  authorizeAdmin,
  thuongLaiController.increaseViolation
);

module.exports = router;