const { errorResponse, validateRequiredString } = require("./common");

const validateCreateOrder = (req, res, next) => {
  try {
    const { items, hinh_thuc_thanh_toan, dia_chi_giao_hang, id_vu_nuoi } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error("Đơn hàng phải có ít nhất một sản phẩm");
    }

    items.forEach((item, index) => {
      if (!item.id_san_pham) {
        throw new Error(`Sản phẩm tại vị trí ${index + 1} không hợp lệ`);
      }
      if (!item.so_luong_dat || Number(item.so_luong_dat) <= 0) {
        throw new Error(`Số lượng đặt của sản phẩm thứ ${index + 1} phải lớn hơn 0`);
      }
    });

    const validMethods = ["cod", "chuyen_khoan", "tra_sau"];
    if (!hinh_thuc_thanh_toan || !validMethods.includes(hinh_thuc_thanh_toan)) {
      throw new Error("Hình thức thanh toán không hợp lệ");
    }

    validateRequiredString(dia_chi_giao_hang, "Địa chỉ giao hàng");

    if (hinh_thuc_thanh_toan === "tra_sau" && !id_vu_nuoi) {
      throw new Error("Đơn trả sau phải chọn vụ nuôi");
    }

    return next();
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

const validateUpdateOrderStatus = (req, res, next) => {
  try {
    const { trang_thai_don_hang } = req.body;
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

    validateRequiredString(trang_thai_don_hang, "Trạng thái đơn hàng");

    if (!validStatuses.includes(trang_thai_don_hang)) {
      throw new Error("Trạng thái đơn hàng không hợp lệ");
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