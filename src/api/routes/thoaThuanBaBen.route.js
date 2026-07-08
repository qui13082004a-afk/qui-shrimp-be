const express = require("express");
const router = express.Router();

const thoaThuanBaBenController = require("../controllers/thoaThuanBaBen.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const { authorizeAdmin } = authMiddleware;

router.post(
  "/request",
  authMiddleware,
  authorizeAdmin,
  thoaThuanBaBenController.requestAgreement
);

router.get(
  "/",
  authMiddleware,
  thoaThuanBaBenController.getAllAgreements
);

router.get(
  "/my",
  authMiddleware,
  thoaThuanBaBenController.getMyAgreements
);

router.get(
  "/profile/:profileId",
  authMiddleware,
  thoaThuanBaBenController.getAgreementsByProfileId
);

router.put(
  "/:id/prepare",
  authMiddleware,
  thoaThuanBaBenController.prepareAgreement
);

router.put(
  "/:id/upload",
  authMiddleware,
  thoaThuanBaBenController.uploadSignedAgreement
);

router.put(
  "/:id/confirm",
  authMiddleware,
  authorizeAdmin,
  thoaThuanBaBenController.confirmAgreement
);

router.put(
  "/:id/cancel",
  authMiddleware,
  authorizeAdmin,
  thoaThuanBaBenController.cancelAgreement
);

router.get(
  "/:id",
  authMiddleware,
  thoaThuanBaBenController.getAgreementById
);

module.exports = router;