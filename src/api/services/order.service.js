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
        throw new Error(
          `Sản phẩm (ID: ${item.id_san_pham}) không tồn tại trong hệ thống`
        );
      }

      if (product.trang_thai !== "dang_ban") {
        throw new Error(
          `Sản phẩm "${product.ten_san_pham}" hiện đã ngừng kinh doanh hoặc tạm hết hàng`
        );
      }

      if (Number(product.ton_kho) < Number(item.so_luong_dat)) {
        throw new Error(
          `Sản phẩm "${product.ten_san_pham}" không đủ số lượng cung ứng (Yêu cầu: ${item.so_luong_dat}, Tồn kho: ${product.ton_kho})`
        );
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
      trang_thai_don_hang = "cho_xu_ly";
    } else if (data.hinh_thuc_thanh_toan === "chuyen_khoan") {
      trang_thai_don_hang = "cho_thanh_toan";
    } else if (data.hinh_thuc_thanh_toan === "tra_sau") {
      if (!data.id_vu_nuoi) {
        throw new Error("Vui lòng chọn vụ nuôi khi mua trả sau");
      }

      const profile = await orderRepository.findApprovedPostpaidProfile(
        userId,
        data.id_vu_nuoi
      );

      if (!profile) {
        throw new Error(
          "Vụ nuôi này chưa được xét duyệt hoặc kích hoạt hạn mức tín dụng mua trả sau"
        );
      }

      const currentDebt = await orderRepository.getCurrentDebt(userId);
      const reservedDebt = await orderRepository.getReservedDebt(userId);
      const creditLimit = Number(profile.dinh_muc_cong_no);

      if (currentDebt + reservedDebt + tong_thanh_toan > creditLimit) {
        throw new Error(
          `Vượt định mức công nợ! Công nợ hiện tại: ${currentDebt.toLocaleString()}đ, đơn đang giữ hạn mức: ${reservedDebt.toLocaleString()}đ, đơn mới: ${tong_thanh_toan.toLocaleString()}đ, hạn mức: ${creditLimit.toLocaleString()}đ`
        );
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
    throw new Error(
      "Thao tác bị từ chối: Bạn không có quyền truy cập toàn bộ đơn hàng"
    );
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
    throw new Error("Bạn không có quyền truy cập thông tin đơn hàng này");
  }

  return order;
};

const updateOrderStatus = async (user, id_don_hang, data) => {
  const targetStatus = data.trang_thai_don_hang;

  if (user.vai_tro !== "admin" && user.vai_tro !== "nhan_vien_giao_hang") {
    throw new Error("Bạn không có quyền chỉnh sửa trạng thái đơn hàng này");
  }

  const order = await orderRepository.findById(id_don_hang);

  if (!order) {
    throw new Error("Không tìm thấy thông tin đơn hàng cần cập nhật");
  }

  const currentStatus = order.trang_thai_don_hang;

  if (["da_huy", "hoan_tat"].includes(currentStatus)) {
    throw new Error(
      `Đơn hàng hiện đã ở trạng thái "${currentStatus.toUpperCase()}", không thể thay đổi trạng thái nữa`
    );
  }

  if (user.vai_tro === "nhan_vien_giao_hang") {
    const allowedDeliveryStatuses = ["dang_giao", "hoan_tat", "giao_that_bai"];

    if (!allowedDeliveryStatuses.includes(targetStatus)) {
      throw new Error(
        "Nhân viên giao hàng chỉ được phép cập nhật trạng thái vận chuyển"
      );
    }

    if (currentStatus !== "cho_giao" && targetStatus === "dang_giao") {
      throw new Error(
        "Đơn hàng chưa ở trạng thái chuẩn bị giao. Vui lòng liên hệ Admin để duyệt đơn trước"
      );
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