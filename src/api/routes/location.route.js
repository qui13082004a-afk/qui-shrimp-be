const express = require("express");
const router = express.Router();

const { locationController } = require("../controllers");
const authMiddleware = require("../middlewares/auth.middleware");
const { authorizeAdmin } = authMiddleware;

// Lấy danh sách toàn bộ tỉnh/thành để phục vụ chọn địa chỉ hoặc cấu hình khu vực.
router.get("/provinces", locationController.getAllProvinces);

// Lấy danh sách phường/xã theo tỉnh/thành đã chọn.
router.get(
  "/provinces/:id_tinh_thanh/wards",  authMiddleware,
  locationController.getWardsByProvinceId
);

// Admin import dữ liệu đơn vị hành chính vào hệ thống.
router.post(
  "/import-wards",
  authMiddleware,
  authorizeAdmin,
  locationController.importAdministrativeUnits
);

// Phân giải tọa độ thành thông tin vị trí hành chính hoặc địa chỉ tương ứng.
router.post(
  "/resolve-coordinate",
  authMiddleware,
  locationController.resolveCoordinate
);

module.exports = router;
