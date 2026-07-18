const express = require("express");
const router = express.Router();

const hopDongController = require("../controllers/hopDong.controller");

const authMiddleware = require("../middlewares/auth.middleware");
const { authorizeAdmin } = authMiddleware;

const uploadFile = require("../middlewares/uploadFile.middleware");
const privateFileUpload = require("../middlewares/privateFileUpload.middleware");

router.post(
  "/upload-file-mau",
  authMiddleware,
  authorizeAdmin,
  uploadFile.single("file"),
  (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng chọn file hợp đồng mẫu",
        });
      }

      const fileUrl =
        req.file.path ||
        req.file.secure_url ||
        req.file.url ||
        req.file.location ||
        null;

      if (!fileUrl) {
        return res.status(400).json({
          success: false,
          message: "Không lấy được đường dẫn file hợp đồng mẫu",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Upload file hợp đồng mẫu thành công",
        data: {
          url: fileUrl,
          original_name: req.file.originalname || "hop-dong-mau.pdf",
          mimetype: req.file.mimetype || "application/pdf",
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);
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
  "/:id/download-template",
  authMiddleware,
  hopDongController.downloadTemplate
);
router.put(
  "/:id/upload-pdf",
  authMiddleware,
  privateFileUpload.single("file_hop_dong_da_ky"),
  hopDongController.uploadSignedPdf
);

router.get(
  "/:id",
  authMiddleware,
  hopDongController.getContractById
);


router.put(
  "/:id/upload-image",
  authMiddleware,
  privateFileUpload.single("anh_hop_dong_da_ky"),
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
