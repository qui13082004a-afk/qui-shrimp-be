const { errorResponse, validateRequiredString } = require("./common");

/**
 * Validator khi khách hàng tiến hành đặt hàng
 */
const validateCreateOrder = (req, res, next) => {
  try {
    const { items, hinh_thuc_thanh_toan, dia_chi_giao_hang, id_vu_nuoi } = req.body;

    // Kiểm tra giỏ hàng danh sách sản phẩm đặt
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error("Đơn hàng phải có ít nhất một mặt hàng trong giỏ");
    }

    // Kiểm tra cấu trúc từng sản phẩm trong giỏ
    items.forEach((item, index) => {
      if (!item.id_san_pham) {
        throw new Error(`Sản phẩm tại dòng thứ ${index + 1} thiếu mã ID`);
      }
      if (item.so_luong_dat === undefined || Number(item.so_luong_dat) <= 0) {
        throw new Error(`Số lượng đặt của sản phẩm thứ ${index + 1} phải lớn hơn 0`);
      }
    });

    // 2. Kiểm tra hình thức thanh toán hợp lệ
    if (!hinh_thuc_thanh_toan) {
      throw new Error("Vui lòng lựa chọn hình thức thanh toán");
    }
    const validPayments = ["cod", "chuyen_khoan", "tra_sau"];
    if (!validPayments.includes(hinh_thuc_thanh_toan)) {
      throw new Error("Hình thức thanh toán yêu cầu không hợp lệ");
    }

    // 3. Nếu là mua trả sau (Cấp tín dụng theo vụ nuôi Đất Tôm), bắt buộc phải có vụ nuôi
    if (hinh_thuc_thanh_toan === "tra_sau" && !id_vu_nuoi) {
      throw new Error("Hình thức mua trả sau bắt buộc phải chọn vụ nuôi đang hoạt động để liên kết công nợ");
    }

    // 4. Kiểm tra địa chỉ giao hàng
    validateRequiredString(dia_chi_giao_hang, "Địa chỉ giao hàng");

    return next();
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

/**
 * Validator khi Admin/Shipper cập nhật trạng thái đơn hàng
 */
const validateUpdateOrderStatus = (req, res, next) => {
  try {
    const { trang_thai_don_hang } = req.body;

    if (!trang_thai_don_hang) {
      throw new Error("Vui lòng cung cấp trạng thái đơn hàng cần cập nhật");
    }

    const validStatuses = [
      "cho_xu_ly",
      "cho_thanh_toan",
      "da_thanh_toan",
      "cho_giao",
      "dang_giao",
      "hoan_tat",
      "giao_that_bai",
      "da_huy",
    ];

    if (!validStatuses.includes(trang_thai_don_hang)) {
      throw new Error("Trạng thái đơn hàng cập nhật không hợp lệ");
    }

    return next();
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

module.exports = {
  validateCreateOrder,
  validateUpdateOrderStatus,
};