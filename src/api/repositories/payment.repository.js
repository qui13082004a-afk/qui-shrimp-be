const { ThanhToan, DonHang, NguoiDung, GiaoHang, HopDong } = require("../models");

/**
 * Lấy lịch sử giao dịch thanh toán theo ID khách hàng
 */
const findByUserId = async (id_nguoi_dung) => {
  return await ThanhToan.findAll({
    include: [
      {
        model: DonHang,
        where: { id_nguoi_dung },
      },
    ],
    order: [["id_thanh_toan", "DESC"]],
  });
};

/**
 * Admin: Lấy toàn bộ biến động số dư của tất cả khách hàng
 */
const findAll = async () => {
  return await ThanhToan.findAll({
    include: [
      {
        model: DonHang,
        include: [{ model: NguoiDung }],
      },
    ],
    order: [["id_thanh_toan", "DESC"]],
  });
};

/**
 * Lấy danh sách lịch sử giao dịch theo mã đơn hàng
 */
const findByOrderId = async (id_don_hang) => {
  return await ThanhToan.findAll({
    where: { id_don_hang },
    include: [{ model: DonHang }],
  });
};

/**
 * Tìm chi tiết một giao dịch thanh toán theo ID khóa chính
 */
const findById = async (id_thanh_toan) => {
  return await ThanhToan.findByPk(id_thanh_toan, {
    include: [{ model: DonHang }],
  });
};

/**
 * Cập nhật trạng thái giao dịch thanh toán trong Database
 */
const updatePayment = async (payment, data, transaction = null) => {
  await payment.update(data, { transaction });
  return payment;
};

/**
 * Cập nhật trạng thái hóa đơn đơn hàng
 */
const updateOrder = async (order, data, transaction = null) => {
  await order.update(data, { transaction });
  return order;
};

/**
 * Cập nhật thông tin vận chuyển (Giao hàng) liên kết trực tiếp với Đơn hàng
 * (Nếu chưa tồn tại bản ghi giao vận, hệ thống sẽ tự động khởi tạo mới an toàn)
 */
const updateDeliveryByOrderId = async (id_don_hang, data, transaction = null) => {
  let delivery = await GiaoHang.findOne({ where: { id_don_hang }, transaction });
  
  if (!delivery) {
    delivery = await GiaoHang.create({ id_don_hang, ...data }, { transaction });
  } else {
    await delivery.update(data, { transaction });
  }
  
  return delivery;
};

/**
 * Cập nhật trạng thái hồ sơ hợp đồng trả sau (Công nợ ao nuôi) liên kết với Đơn hàng
 */
const updateContractByOrderId = async (id_don_hang, data, transaction = null) => {
  let contract = await HopDong.findOne({ where: { id_don_hang }, transaction });
  
  if (!contract) {
    contract = await HopDong.create({ id_don_hang, ...data }, { transaction });
  } else {
    await contract.update(data, { transaction });
  }
  
  return contract;
};

module.exports = {
  findByUserId,
  findAll,
  findByOrderId,
  findById,
  updatePayment,
  updateOrder,
  updateDeliveryByOrderId,
  updateContractByOrderId,
};