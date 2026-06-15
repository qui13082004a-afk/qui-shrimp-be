const jwt = require("jsonwebtoken"); 
// Import thư viện jsonwebtoken để xác thực và giải mã JWT

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

// Export middleware để sử dụng ở route
module.exports = authMiddleware;