const express = require("express");
const router = express.Router();

const hopDongController = require("../controllers/hopDong.controller");

const authMiddleware = require("../middlewares/auth.middleware");
const { authorizeAdmin } = authMiddleware;

const uploadFile = require("../middlewares/uploadFile.middleware");
const privateFileUpload = require("../middlewares/privateFileUpload.middleware");

// Admin upload file hợp đồng mẫu để sử dụng khi tạo hợp đồng trả sau.
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

// Admin tạo mới hợp đồng trả sau cho hồ sơ/đơn hàng đủ điều kiện.
router.post(
  "/",
  authMiddleware,
  authorizeAdmin,
  hopDongController.createContract
);

// Admin lấy toàn bộ danh sách hợp đồng trong hệ thống.
router.get(
  "/admin",
  authMiddleware,
  authorizeAdmin,
  hopDongController.getAllContracts
);

// Nhân viên lấy danh sách hợp đồng được phân công hoặc được phép theo dõi.
router.get(
  "/staff",
  authMiddleware,
  hopDongController.getStaffContracts
);

// Khách hàng lấy danh sách hợp đồng của chính mình.
router.get(
  "/my",
  authMiddleware,
  hopDongController.getMyContracts
);

// Lấy hợp đồng theo hồ sơ mua trả sau cụ thể.
router.get(
  "/profile/:profileId",
  authMiddleware,
  hopDongController.getContractByProfileId
);

// Tải file hợp đồng mẫu của hợp đồng theo id.
router.get(
  "/:id/download-template",
  authMiddleware,
  hopDongController.downloadTemplate
);

// Upload file PDF hợp đồng đã ký lên hệ thống.
router.put(
  "/:id/upload-pdf",
  authMiddleware,
  privateFileUpload.single("file_hop_dong_da_ky"),
  hopDongController.uploadSignedPdf
);

// Lấy chi tiết một hợp đồng theo id.
router.get(
  "/:id",
  authMiddleware,
  hopDongController.getContractById
);


// Upload ảnh chụp hợp đồng đã ký lên hệ thống.
router.put(
  "/:id/upload-image",
  authMiddleware,
  privateFileUpload.single("anh_hop_dong_da_ky"),
  hopDongController.uploadSignedImage
);

// Admin xác nhận hợp đồng hợp lệ sau khi đối chiếu.
router.put(
  "/:id/confirm",
  authMiddleware,
  authorizeAdmin,
  hopDongController.confirmContract
);

// Admin hủy hợp đồng theo id.
router.put(
  "/:id/cancel",
  authMiddleware,
  authorizeAdmin,
  hopDongController.cancelContract
);

// Admin khôi phục lại hợp đồng đã hủy.
router.put(
  "/:id/restore",
  authMiddleware,
  authorizeAdmin,
  hopDongController.restoreContract
);
module.exports = router;
