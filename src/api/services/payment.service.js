const { paymentRepository } = require("../repositories");

const getMyPayments = async (userId) => {
  return await paymentRepository.findByUserId(userId);
};

const getAllPayments = async (user) => {
  if (user.vai_tro !== "admin") {
    throw new Error("Chỉ admin mới có quyền xem tất cả thanh toán");
  }

  return await paymentRepository.findAll();
};

const getPaymentsByOrder = async (user, orderId) => {
  const payments = await paymentRepository.findByOrderId(orderId);

  if (!payments || payments.length === 0) {
    throw new Error("Không tìm thấy thanh toán của đơn hàng này");
  }

  const order = payments[0].DonHang;

  if (
    user.vai_tro !== "admin" &&
    Number(order.id_nguoi_dung) !== Number(user.id_nguoi_dung)
  ) {
    throw new Error("Bạn không có quyền xem thanh toán này");
  }

  return payments;
};

const confirmPayment = async (user, paymentId, data) => {
  if (user.vai_tro !== "admin" && user.vai_tro !== "nhan_vien_giao_hang") {
    throw new Error("Bạn không có quyền xác nhận thanh toán");
  }

  const payment = await paymentRepository.findById(paymentId);

  if (!payment) {
    throw new Error("Không tìm thấy thanh toán");
  }

  if (payment.trang_thai === "thanh_cong") {
    throw new Error("Thanh toán này đã được xác nhận thành công");
  }

  await paymentRepository.updatePayment(payment, {
    trang_thai: "thanh_cong",
    ma_giao_dich: data.ma_giao_dich || payment.ma_giao_dich,
    ngay_thanh_toan: new Date(),
  });

  const order = payment.DonHang;

  let newOrderStatus = order.trang_thai_don_hang;

  if (payment.phuong_thuc === "cod") {
    newOrderStatus = "hoan_tat";
  }

  if (payment.phuong_thuc === "chuyen_khoan") {
    newOrderStatus = "cho_giao";
  }

  if (payment.phuong_thuc === "tra_sau") {
    newOrderStatus = "hoan_tat";
  }

  await paymentRepository.updateOrder(order, {
    trang_thai_don_hang: newOrderStatus,
    ngay_giao: newOrderStatus === "hoan_tat" ? new Date() : order.ngay_giao,
  });

  return await paymentRepository.findById(paymentId);
};

const failPayment = async (user, paymentId, data) => {
  if (user.vai_tro !== "admin") {
    throw new Error("Chỉ admin mới có quyền đánh dấu thanh toán thất bại");
  }

  const payment = await paymentRepository.findById(paymentId);

  if (!payment) {
    throw new Error("Không tìm thấy thanh toán");
  }

  if (payment.trang_thai === "thanh_cong") {
    throw new Error("Không thể đánh dấu thất bại vì thanh toán đã thành công");
  }

  await paymentRepository.updatePayment(payment, {
    trang_thai: "that_bai",
    ma_giao_dich: data.ma_giao_dich || payment.ma_giao_dich,
  });

  const order = payment.DonHang;

  if (payment.phuong_thuc === "chuyen_khoan") {
    await paymentRepository.updateOrder(order, {
      trang_thai_don_hang: "cho_thanh_toan",
    });
  }

  if (payment.phuong_thuc === "cod") {
    await paymentRepository.updateOrder(order, {
      trang_thai_don_hang: "giao_that_bai",
    });
  }

  return await paymentRepository.findById(paymentId);
};

module.exports = {
  getMyPayments,
  getAllPayments,
  getPaymentsByOrder,
  confirmPayment,
  failPayment,
};