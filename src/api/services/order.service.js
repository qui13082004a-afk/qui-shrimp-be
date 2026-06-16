const { sequelize } = require("../../config/database");
const { orderRepository } = require("../repositories");

const createOrder = async (user, data) => {
  const transaction = await sequelize.transaction();

  try {
    const userId = user.id_nguoi_dung;

    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      throw new Error("Đơn hàng phải có ít nhất một sản phẩm");
    }

    if (!data.hinh_thuc_thanh_toan) {
      throw new Error("Vui lòng chọn hình thức thanh toán");
    }

    if (!["cod", "chuyen_khoan", "tra_sau"].includes(data.hinh_thuc_thanh_toan)) {
      throw new Error("Hình thức thanh toán không hợp lệ");
    }

    if (!data.dia_chi_giao_hang) {
      throw new Error("Vui lòng nhập địa chỉ giao hàng");
    }

    let tong_tien = 0;
    const orderDetails = [];

    for (const item of data.items) {
      const product = await orderRepository.findProductById(
        item.id_san_pham,
        transaction
      );

      if (!product) {
        throw new Error(`Không tìm thấy sản phẩm ID ${item.id_san_pham}`);
      }

      if (product.trang_thai !== "dang_ban") {
        throw new Error(`Sản phẩm ${product.ten_san_pham} không còn bán`);
      }

      if (!item.so_luong_dat || Number(item.so_luong_dat) <= 0) {
        throw new Error("Số lượng đặt phải lớn hơn 0");
      }

      if (Number(product.ton_kho) < Number(item.so_luong_dat)) {
        throw new Error(`Sản phẩm ${product.ten_san_pham} không đủ tồn kho`);
      }

      const gia_ban = Number(product.gia);
      const so_luong_dat = Number(item.so_luong_dat);
      const thanh_tien = gia_ban * so_luong_dat;

      tong_tien += thanh_tien;

      orderDetails.push({
        id_san_pham: product.id_san_pham,
        gia_ban,
        so_luong_dat,
        thanh_tien,
        trang_thai_san_pham: product.trang_thai,
      });

      const newStock = Number(product.ton_kho) - so_luong_dat;
      await orderRepository.updateProductStock(product, newStock, transaction);
    }

    const phi_van_chuyen = Number(data.phi_van_chuyen || 0);
    const tong_thanh_toan = tong_tien + phi_van_chuyen;

    let trang_thai_don_hang = "cho_xu_ly";

    if (data.hinh_thuc_thanh_toan === "cod") {
      trang_thai_don_hang = "cho_giao";
    }

    if (data.hinh_thuc_thanh_toan === "chuyen_khoan") {
      trang_thai_don_hang = "cho_thanh_toan";
    }

    if (data.hinh_thuc_thanh_toan === "tra_sau") {
      if (!data.id_vu_nuoi) {
        throw new Error("Đơn trả sau phải chọn vụ nuôi");
      }

      const profile = await orderRepository.findApprovedPostpaidProfile(
        userId,
        data.id_vu_nuoi
      );

      if (!profile) {
        throw new Error("Khách hàng chưa được duyệt trả sau cho vụ nuôi này");
      }

      const currentDebt = await orderRepository.getCurrentDebt(userId);
      const creditLimit = Number(profile.dinh_muc_cong_no);

      if (currentDebt + tong_thanh_toan > creditLimit) {
        throw new Error("Đơn hàng vượt định mức công nợ được duyệt");
      }

      trang_thai_don_hang = "cho_xu_ly";
    }

    const order = await orderRepository.createOrder(
      {
        id_nguoi_dung: userId,
        id_vu_nuoi: data.id_vu_nuoi || null,
        tong_tien,
        phi_van_chuyen,
        tong_thanh_toan,
        hinh_thuc_thanh_toan: data.hinh_thuc_thanh_toan,
        trang_thai_don_hang,
        dia_chi_giao_hang: data.dia_chi_giao_hang,
        ghi_chu: data.ghi_chu,
      },
      transaction
    );

    const detailsWithOrderId = orderDetails.map((detail) => ({
      ...detail,
      id_don_hang: order.id_don_hang,
    }));

    await orderRepository.createOrderDetails(detailsWithOrderId, transaction);

    await orderRepository.createPayment(
      {
        id_don_hang: order.id_don_hang,
        so_tien: tong_thanh_toan,
        phuong_thuc: data.hinh_thuc_thanh_toan,
        trang_thai:
          data.hinh_thuc_thanh_toan === "chuyen_khoan"
            ? "cho_thanh_toan"
            : "cho_thanh_toan",
      },
      transaction
    );

    await transaction.commit();

    return await orderRepository.findById(order.id_don_hang);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const getMyOrders = async (userId) => {
  return await orderRepository.findByUserId(userId);
};

const getAllOrders = async (user) => {
  if (user.vai_tro !== "admin") {
    throw new Error("Chỉ admin mới có quyền xem tất cả đơn hàng");
  }

  return await orderRepository.findAll();
};

const getOrderById = async (user, id_don_hang) => {
  const order = await orderRepository.findById(id_don_hang);

  if (!order) {
    throw new Error("Không tìm thấy đơn hàng");
  }

  if (
    user.vai_tro !== "admin" &&
    Number(order.id_nguoi_dung) !== Number(user.id_nguoi_dung)
  ) {
    throw new Error("Bạn không có quyền xem đơn hàng này");
  }

  return order;
};

const updateOrderStatus = async (user, id_don_hang, data) => {
  if (user.vai_tro !== "admin" && user.vai_tro !== "nhan_vien_giao_hang") {
    throw new Error("Bạn không có quyền cập nhật trạng thái đơn hàng");
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

  if (!data.trang_thai_don_hang) {
    throw new Error("Vui lòng nhập trạng thái đơn hàng");
  }

  if (!validStatuses.includes(data.trang_thai_don_hang)) {
    throw new Error("Trạng thái đơn hàng không hợp lệ");
  }

  const order = await orderRepository.findById(id_don_hang);

  if (!order) {
    throw new Error("Không tìm thấy đơn hàng");
  }

  const updatedOrder = await orderRepository.updateStatus(
    id_don_hang,
    data.trang_thai_don_hang
  );

  return updatedOrder;
};

module.exports = {
  createOrder,
  getMyOrders,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
};