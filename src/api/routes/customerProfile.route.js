const express = require("express");
const router = express.Router();

const { customerProfileController } = require("../controllers");
const authMiddleware = require("../middlewares/auth.middleware");
const upload = require("../middlewares/upload.middleware");

const {
  authorizeAdmin,
  authorizeAdminOrLimitStaff,
} = authMiddleware;

const {
  validateUpdateCustomerProfile,
  validateApprovePostpaid,
} = require("../middlewares/validate");

// Khách hàng tạo hồ sơ mua trả sau
router.post(
  "/",
  authMiddleware,
  upload.fields([
    {
      name: "anh_cccd_mat_truoc",
      maxCount: 1,
    },
    {
      name: "anh_cccd_mat_sau",
      maxCount: 1,
    },
    {
      name: "anh_selfie",
      maxCount: 1,
    },
    {
      name: "anh_bien_lai_tha_giong",
      maxCount: 1,
    },
    {
      name: "anh_ao_nuoi",
      maxCount: 5,
    },
  ]),
  customerProfileController.createCustomerProfile
);

// Khách hàng xem hồ sơ của mình
router.get(
  "/my",
  authMiddleware,
  customerProfileController.getMyCustomerProfiles
);

// Admin và nhân viên định mức xem toàn bộ hồ sơ
router.get(
  "/admin",
  authMiddleware,
  authorizeAdminOrLimitStaff,
  customerProfileController.getAllCustomerProfiles
);

// Xem chi tiết hồ sơ
router.get(
  "/:id",
  authMiddleware,
  customerProfileController.getCustomerProfileById
);

// Admin duyệt trả sau
router.put(
  "/:id/approve-postpaid",
  authMiddleware,
  authorizeAdmin,
  validateApprovePostpaid,
  customerProfileController.approvePostpaid
);

// Cập nhật hồ sơ
router.put(
  "/:id",
  authMiddleware,
  validateUpdateCustomerProfile,
  customerProfileController.updateCustomerProfile
);

module.exports = router;