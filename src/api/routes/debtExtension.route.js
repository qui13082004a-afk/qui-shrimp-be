const express = require("express");
const router = express.Router();

const { debtExtensionController } = require("../controllers");
const authMiddleware = require("../middlewares/auth.middleware");
const { authorizeAdmin } = authMiddleware;

const upload = require("../middlewares/upload.middleware");

router.post(
  "/",
  authMiddleware,
  upload.array("images", 5),
  debtExtensionController.createDebtExtension
);

router.get(
  "/my",
  authMiddleware,
  debtExtensionController.getMyDebtExtensions
);

router.get(
  "/admin",
  authMiddleware,
  authorizeAdmin,
  debtExtensionController.getAllDebtExtensions
);
router.get(
  "/profile/:profileId",
  authMiddleware,
  debtExtensionController.getDebtExtensionsByProfileId
);
router.get(
  "/:id",
  authMiddleware,
  debtExtensionController.getDebtExtensionById
);

router.put(
  "/:id/approve",
  authMiddleware,
  authorizeAdmin,
  debtExtensionController.approveDebtExtension
);

router.put(
  "/:id/reject",
  authMiddleware,
  authorizeAdmin,
  debtExtensionController.rejectDebtExtension
);

module.exports = router;