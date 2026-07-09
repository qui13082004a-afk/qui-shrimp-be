const express = require("express");
const router = express.Router();

const hopDongController = require("../controllers/hopDong.controller");

const authMiddleware = require("../middlewares/auth.middleware");
const { authorizeAdmin } = authMiddleware;

const upload = require("../middlewares/upload.middleware");
const uploadFile = require("../middlewares/uploadFile.middleware");

router.post(
  "/",
  authMiddleware,
  authorizeAdmin,
  hopDongController.createContract
);

router.get(
  "/admin",
  authMiddleware,
  authorizeAdmin,
  hopDongController.getAllContracts
);

router.get(
  "/staff",
  authMiddleware,
  hopDongController.getStaffContracts
);

router.get(
  "/my",
  authMiddleware,
  hopDongController.getMyContracts
);

router.get(
  "/profile/:profileId",
  authMiddleware,
  hopDongController.getContractByProfileId
);

router.get(
  "/:id",
  authMiddleware,
  hopDongController.getContractById
);

router.put(
  "/:id/upload-pdf",
  authMiddleware,
  uploadFile.single("file_hop_dong_da_ky"),
  hopDongController.uploadSignedPdf
);

router.put(
  "/:id/upload-image",
  authMiddleware,
  upload.single("anh_hop_dong_da_ky"),
  hopDongController.uploadSignedImage
);

router.put(
  "/:id/confirm",
  authMiddleware,
  authorizeAdmin,
  hopDongController.confirmContract
);

router.put(
  "/:id/cancel",
  authMiddleware,
  authorizeAdmin,
  hopDongController.cancelContract
);

router.put(
  "/:id/restore",
  authMiddleware,
  authorizeAdmin,
  hopDongController.restoreContract
);

module.exports = router;