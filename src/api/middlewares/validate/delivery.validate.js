const { errorResponse, validateRequiredString } = require("./common");

const validateAssignDelivery = (req, res, next) => {
  try {
    const { id_don_hang, id_nhan_vien_giao } = req.body;

    if (!id_don_hang) {
      throw new Error("Vui lòng chọn đơn hàng");
    }
    if (!id_nhan_vien_giao) {
      throw new Error("Vui lòng chọn nhân viên giao hàng");
    }

    return next();
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

const validateSuccessDelivery = (req, res, next) => {
  try {
    const { anh_bien_nhan, anh_hop_dong, ghi_chu } = req.body;

    if (anh_bien_nhan !== undefined && typeof anh_bien_nhan !== "string") {
      throw new Error("Ảnh biên nhận không hợp lệ");
    }
    if (anh_hop_dong !== undefined && typeof anh_hop_dong !== "string") {
      throw new Error("Ảnh hợp đồng không hợp lệ");
    }
    if (ghi_chu !== undefined && typeof ghi_chu !== "string") {
      throw new Error("Ghi chú không hợp lệ");
    }

    return next();
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

const validateFailDelivery = (req, res, next) => {
  try {
    const { ly_do_that_bai, ghi_chu } = req.body;

    if (!ly_do_that_bai && !ghi_chu) {
      throw new Error("Vui lòng cung cấp lý do thất bại hoặc ghi chú");
    }

    if (ly_do_that_bai !== undefined && typeof ly_do_that_bai !== "string") {
      throw new Error("Lý do thất bại không hợp lệ");
    }

    return next();
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

module.exports = {
  validateAssignDelivery,
  validateSuccessDelivery,
  validateFailDelivery,
};