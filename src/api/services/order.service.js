const { sequelize } = require("../../config/database");
const { orderRepository } = require("../repositories");
const notificationService = require("./notification.service");

const getOrderStatusText = (status) => {
  const map = {
    cho_xu_ly: "chờ xử lý",
    cho_thanh_toan: "chờ thanh toán",
    da_thanh_toan: "đã thanh toán",
    cho_giao: "chờ giao hàng",
    dang_giao: "đang giao",
    hoan_tat: "hoàn tất",
    giao_that_bai: "giao thất bại",
    da_huy: "đã hủy",
  };

  return map[status] || status;
};

const createOrder = async (user, data) => {
  const transaction = await sequelize.transaction();

  try {
    const userId = user.id_nguoi_dung;
    let tong_tien = 0;
    const orderDetails = [];

    for (const item of data.items) {
      const product = await orderRepository.findProductById(
        item.id_san_pham,
        transaction
      );

      if (!product) {
        throw new Error(`Sản phẩm (ID: ${item.id_san_pham}) không tồn tại`);
      }

      if (product.trang_thai !== "dang_ban") {
        throw new Error(`Sản phẩm "${product.ten_san_pham}" hiện không bán`);
      }

      const so_luong_dat = Number(item.so_luong_dat);

      if (!so_luong_dat || so_luong_dat <= 0) {
        throw new Error("Số lượng đặt phải lớn hơn 0");
      }

      if (Number(product.ton_kho) < so_luong_dat) {
        throw new Error(`Sản phẩm "${product.ten_san_pham}" không đủ tồn kho`);
      }

      const gia_ban = Number(product.gia);
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
    let id_ho_so = null;

    if (data.hinh_thuc_thanh_toan === "chuyen_khoan") {
      trang_thai_don_hang = "cho_thanh_toan";
    }

    if (data.hinh_thuc_thanh_toan === "tra_sau") {
      if (!data.id_vu_nuoi) {
        throw new Error("Vui lòng chọn vụ nuôi khi mua trả sau");
      }

      const profile = await orderRepository.findApprovedPostpaidProfile(
        userId,
        data.id_vu_nuoi,
        transaction
      );

      if (!profile) {
        throw new Error("Vụ nuôi này chưa được Admin duyệt mua trả sau");
      }

      if (profile.bi_khoa_tra_sau) {
        throw new Error(profile.ly_do_khoa || "Hồ sơ đang bị khóa quyền trả sau");
      }

      if (!profile.han_thanh_toan) {
        throw new Error("Hồ sơ chưa có hạn thanh toán");
      }

      const creditLimit = Number(profile.dinh_muc_cong_no || 0);

      if (creditLimit <= 0) {
        throw new Error("Hồ sơ chưa được cấp hạn mức hợp lệ");
      }

      const usedCredit = await orderRepository.getUsedCreditByProfileId(
        profile.id_ho_so,
        transaction
      );

      const remainingCredit = Math.max(creditLimit - usedCredit, 0);

      if (tong_thanh_toan > remainingCredit) {
        throw new Error(
          `Vượt hạn mức trả sau. Hạn mức được cấp: ${creditLimit.toLocaleString()}đ, đã sử dụng: ${usedCredit.toLocaleString()}đ, còn lại: ${remainingCredit.toLocaleString()}đ, đơn mới: ${tong_thanh_toan.toLocaleString()}đ`
        );
      }

      id_ho_so = profile.id_ho_so;
      trang_thai_don_hang = "cho_xu_ly";
    }

    const order = await orderRepository.createOrder(
      {
        id_nguoi_dung: userId,
        id_vu_nuoi: data.id_vu_nuoi || null,
        id_ho_so,
        tong_tien,
        phi_van_chuyen,
        tong_thanh_toan,
        hinh_thuc_thanh_toan: data.hinh_thuc_thanh_toan,
        trang_thai_don_hang,
        dia_chi_giao_hang: data.dia_chi_giao_hang,
        ghi_chu: data.ghi_chu || null,
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
        trang_thai: "cho_thanh_toan",
      },
      transaction
    );

    await notificationService.createNotification({
      id_nguoi_dung: userId,
      tieu_de: "Đặt hàng thành công",
      noi_dung: `Đơn hàng #${order.id_don_hang} đã được tạo thành công.`,
      loai: "don_hang",
      lien_ket: `/profile/orders/${order.id_don_hang}`,
      transaction,
    });

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
    throw new Error("Bạn không có quyền truy cập toàn bộ đơn hàng");
  }

  return await orderRepository.findAll();
};

const getOrderById = async (user, id_don_hang) => {
  const order = await orderRepository.findById(id_don_hang);

  if (!order) {
    throw new Error("Không tìm thấy thông tin đơn hàng yêu cầu");
  }

  if (
    user.vai_tro !== "admin" &&
    Number(order.id_nguoi_dung) !== Number(user.id_nguoi_dung)
  ) {
    throw new Error("Bạn không có quyền truy cập đơn hàng này");
  }

  return order;
};

const updateOrderStatus = async (user, id_don_hang, data) => {
  const targetStatus = data.trang_thai_don_hang;

  if (user.vai_tro !== "admin" && user.vai_tro !== "nhan_vien_giao_hang") {
    throw new Error("Bạn không có quyền chỉnh sửa trạng thái đơn hàng");
  }

  const order = await orderRepository.findById(id_don_hang);

  if (!order) {
    throw new Error("Không tìm thấy thông tin đơn hàng cần cập nhật");
  }

  const currentStatus = order.trang_thai_don_hang;

  if (["da_huy", "hoan_tat"].includes(currentStatus)) {
    throw new Error("Đơn hàng đã kết thúc, không thể cập nhật");
  }

  if (user.vai_tro === "nhan_vien_giao_hang") {
    const allowedDeliveryStatuses = ["dang_giao", "hoan_tat", "giao_that_bai"];

    if (!allowedDeliveryStatuses.includes(targetStatus)) {
      throw new Error("Nhân viên giao hàng chỉ được cập nhật trạng thái giao hàng");
    }

    if (currentStatus !== "cho_giao" && targetStatus === "dang_giao") {
      throw new Error("Đơn hàng chưa ở trạng thái chờ giao");
    }
  }

  const updatedOrder = await orderRepository.updateStatus(
    id_don_hang,
    targetStatus
  );

  await notificationService.createNotification({
    id_nguoi_dung: order.id_nguoi_dung,
    tieu_de: "Cập nhật đơn hàng",
    noi_dung: `Đơn hàng #${order.id_don_hang} đã chuyển sang trạng thái ${getOrderStatusText(
      targetStatus
    )}.`,
    loai: "don_hang",
    lien_ket: `/profile/orders/${order.id_don_hang}`,
  });

  return updatedOrder;
};

const cancelMyOrder = async (userId, orderId) => {
  const order = await orderRepository.cancelMyOrder(userId, orderId);

  await notificationService.createNotification({
    id_nguoi_dung: userId,
    tieu_de: "Đơn hàng đã hủy",
    noi_dung: `Đơn hàng #${order.id_don_hang} đã được hủy thành công.`,
    loai: "don_hang",
    lien_ket: `/profile/orders/${order.id_don_hang}`,
  });

  return order;
};

module.exports = {
  createOrder,
  getMyOrders,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  cancelMyOrder,
};