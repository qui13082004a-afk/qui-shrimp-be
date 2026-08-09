const jwt = require("jsonwebtoken");
const { NguoiDung } = require("../models");

const ROLES = {
  ADMIN: "admin",
  CUSTOMER: "khach_hang",
  DELIVERY_STAFF: "nhan_vien_giao_hang",
  LIMIT_STAFF: "nhan_vien_dinh_muc",
};

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Vui lòng đăng nhập",
      });
    }

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Token không hợp lệ",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.token_type && decoded.token_type !== "access") {
      return res.status(401).json({
        success: false,
        code: "INVALID_TOKEN_TYPE",
        message: "Token không hợp lệ",
      });
    }

    const user = await NguoiDung.findByPk(decoded.id_nguoi_dung, {
      attributes: [
        "id_nguoi_dung",
        "vai_tro",
        "trang_thai_tai_khoan",
      ],
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        code: "ACCOUNT_NOT_FOUND",
        message: "Tài khoản không tồn tại",
      });
    }

    if (user.trang_thai_tai_khoan !== "hoat_dong") {
      return res.status(403).json({
        success: false,
        code: "ACCOUNT_LOCKED",
        message: "Tài khoản đã bị khóa hoặc chưa được xác thực",
      });
    }

    req.user = {
      ...decoded,
      id_nguoi_dung: user.id_nguoi_dung,
      vai_tro: user.vai_tro,
      trang_thai_tai_khoan: user.trang_thai_tai_khoan,
    };

    next();
  } catch (error) {
    const isExpired = error.name === "TokenExpiredError";

    return res.status(401).json({
      success: false,
      code: isExpired ? "TOKEN_EXPIRED" : "INVALID_TOKEN",
      message: isExpired
        ? "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại"
        : "Token không hợp lệ hoặc đã hết hạn",
    });
  }
};

/**
 * Middleware kiểm tra quyền
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Vui lòng đăng nhập",
        });
      }

      if (!allowedRoles.includes(req.user.vai_tro)) {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền truy cập tài nguyên này",
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Lỗi khi kiểm tra quyền",
      });
    }
  };
};

// Các middleware phân quyền
const authorizeAdmin = authorize(ROLES.ADMIN);
const authorizeCustomer = authorize(ROLES.CUSTOMER);
const authorizeDeliveryStaff = authorize(ROLES.DELIVERY_STAFF);
const authorizeLimitStaff = authorize(ROLES.LIMIT_STAFF);

const authorizeAdminOrCustomer = authorize(
  ROLES.ADMIN,
  ROLES.CUSTOMER
);

const authorizeAdminOrDeliveryStaff = authorize(
  ROLES.ADMIN,
  ROLES.DELIVERY_STAFF
);

const authorizeAdminOrLimitStaff = authorize(
  ROLES.ADMIN,
  ROLES.LIMIT_STAFF
);

/**
 * Export
 */
module.exports = authMiddleware;

module.exports.authorize = authorize;

module.exports.authorizeAdmin = authorizeAdmin;
module.exports.authorizeCustomer = authorizeCustomer;
module.exports.authorizeDeliveryStaff = authorizeDeliveryStaff;
module.exports.authorizeLimitStaff = authorizeLimitStaff;

module.exports.authorizeAdminOrCustomer =
  authorizeAdminOrCustomer;

module.exports.authorizeAdminOrDeliveryStaff =
  authorizeAdminOrDeliveryStaff;

module.exports.authorizeAdminOrLimitStaff =
  authorizeAdminOrLimitStaff;

module.exports.ROLES = ROLES;
