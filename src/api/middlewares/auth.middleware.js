const jwt = require("jsonwebtoken"); 
// Import thư viện jsonwebtoken để xác thực và giải mã JWT

const ROLES = {
  ADMIN: "admin",
  CUSTOMER: "khach_hang",
  DELIVERY_STAFF: "nhan_vien_giao_hang",
};

const authMiddleware = (req, res, next) => {
  try {
    // Lấy Authorization Header từ request
    const authHeader = req.headers.authorization;
    // Nếu không có token => chưa đăng nhập
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Vui lòng đăng nhập",
      });
    }
    // Tách token khỏi chuỗi "Bearer token"
    // ["Bearer", "eyJhbGciOiJIUzI1Ni..."]
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Token không hợp lệ",
      });
    }
    const token = authHeader.split(" ")[1];
    // Kiểm tra token có hợp lệ hay không
    // Nếu token sai hoặc hết hạn sẽ tự động nhảy vào catch
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // Lưu thông tin đã giải mã vào request
    // req.user.id_nguoi_dung
    // req.user.vai_tro
    req.user = decoded;

    // Cho phép request đi tiếp tới controller
    next();

  } catch (error) {
    // Token sai hoặc hết hạn
    return res.status(401).json({
      success: false,
      message: "Token không hợp lệ hoặc đã hết hạn",
    });
  }
};

/**
 * Middleware factory để check xem user có role được phép không
 * @param  {...string} allowedRoles - các role được phép
 * @returns middleware function
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      // Kiểm tra xem user đã được authenticate chưa
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Vui lòng đăng nhập",
        });
      }

      // Kiểm tra xem user có vai trò phù hợp không
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

// Các middleware tiện dụng
const authorizeAdmin = authorize(ROLES.ADMIN);
const authorizeCustomer = authorize(ROLES.CUSTOMER);
const authorizeDeliveryStaff = authorize(ROLES.DELIVERY_STAFF);
const authorizeAdminOrCustomer = authorize(ROLES.ADMIN, ROLES.CUSTOMER);
const authorizeAdminOrDeliveryStaff = authorize(ROLES.ADMIN, ROLES.DELIVERY_STAFF);

// Export middleware để sử dụng ở route
module.exports = authMiddleware;
module.exports.authorize = authorize;
module.exports.authorizeAdmin = authorizeAdmin;
module.exports.authorizeCustomer = authorizeCustomer;
module.exports.authorizeDeliveryStaff = authorizeDeliveryStaff;
module.exports.authorizeAdminOrCustomer = authorizeAdminOrCustomer;
module.exports.authorizeAdminOrDeliveryStaff = authorizeAdminOrDeliveryStaff;
module.exports.ROLES = ROLES;