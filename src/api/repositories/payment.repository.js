const { ThanhToan, DonHang, NguoiDung } = require("../models");

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

const findByOrderId = async (id_don_hang) => {
  return await ThanhToan.findAll({
    where: { id_don_hang },
    include: [{ model: DonHang }],
  });
};

const findById = async (id_thanh_toan) => {
  return await ThanhToan.findByPk(id_thanh_toan, {
    include: [{ model: DonHang }],
  });
};

const updatePayment = async (payment, data) => {
  await payment.update(data);
  return payment;
};

const updateOrder = async (order, data) => {
  await order.update(data);
  return order;
};

module.exports = {
  findByUserId,
  findAll,
  findByOrderId,
  findById,
  updatePayment,
  updateOrder,
};