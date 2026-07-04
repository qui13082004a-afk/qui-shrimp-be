const express = require("express");
const router = express.Router();

const { cropSeasonController } = require("../controllers");

const authMiddleware = require("../middlewares/auth.middleware");

const { authorizeCustomer, authorizeAdminOrCustomer } = require("../middlewares/auth.middleware");
router.get(
  "/:id_vu_nuoi/orders-summary",
  authMiddleware,
  cropSeasonController.getSeasonOrderSummary
);
const {
  validateCreateCropSeason,
  validateUpdateCropSeason,
} = require("../middlewares/validate");

// API tạo vụ nuôi mới
router.post(
  "/", 
  authMiddleware, 
  authorizeCustomer, 
  validateCreateCropSeason, 
  cropSeasonController.createCropSeason
);

// API lấy danh sách các vụ nuôi theo ao nuôi
router.get(
  "/pond/:id_ao",
  authMiddleware,
  authorizeAdminOrCustomer, 
  cropSeasonController.getCropSeasonsByPond
);

// API lấy chi tiết một vụ nuôi qua ID
router.get(
  "/:id", 
  authMiddleware, 
  authorizeAdminOrCustomer, 
  cropSeasonController.getCropSeasonById
);

// API cập nhật thông tin vụ nuôi
router.put(
  "/:id", 
  authMiddleware, 
  authorizeCustomer, 
  validateUpdateCropSeason, 
  cropSeasonController.updateCropSeason
);

// API xóa vụ nuôi
router.delete(
  "/:id", 
  authMiddleware, 
  authorizeCustomer, 
  cropSeasonController.deleteCropSeason
);

module.exports = router;