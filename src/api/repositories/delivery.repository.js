const {
  GiaoHang,
  DonHang,
  NguoiDung,
  NhanVienGiaoHang,
  ThanhToan,
  ChiTietDonHang,
  SanPham,
  AoNuoi,
  VuNuoi,
} = require("../models");

const deliveryOrderInclude = [
  { model: NguoiDung },
  { model: ThanhToan },
  {
    model: VuNuoi,
    include: [{ model: AoNuoi }],
  },
  {
    model: ChiTietDonHang,
    include: [{ model: SanPham }],
  },
];

const create = async (data) => {
  return await GiaoHang.create(data);
};

const findById = async (id_giao_hang) => {
  return await GiaoHang.findByPk(id_giao_hang, {
    include: [
      {
        model: DonHang,
        include: deliveryOrderInclude,
      },
      { model: NhanVienGiaoHang },
    ],
  });
};

const findByShipperId = async (id_nhan_vien_giao) => {
  return await GiaoHang.findAll({
    where: { id_nhan_vien_giao },
    include: [
      {
        model: DonHang,
        include: deliveryOrderInclude,
      },
    ],
    order: [["id_giao_hang", "DESC"]],
  });
};

const findAll = async () => {
  return await GiaoHang.findAll({
    include: [
      {
        model: DonHang,
        include: deliveryOrderInclude,
      },
      { model: NhanVienGiaoHang },
    ],
    order: [["id_giao_hang", "DESC"]],
  });
};

const findOrderById = async (id_don_hang) => {
  return await DonHang.findByPk(id_don_hang);
};

const findShipperByUserId = async (id_nguoi_dung) => {
  return await NhanVienGiaoHang.findOne({
    where: { id_nguoi_dung },
  });
};

const findShipperById = async (id_nhan_vien_giao_hang) => {
  return await NhanVienGiaoHang.findByPk(id_nhan_vien_giao_hang);
};

const findDeliveryByOrderId = async (id_don_hang) => {
  return await GiaoHang.findOne({
    where: { id_don_hang },
  });
};

const updateDelivery = async (delivery, data) => {
  await delivery.update(data);
  return delivery;
};

const updateOrder = async (order, data) => {
  await order.update(data);
  return order;
};

module.exports = {
  create,
  findById,
  findByShipperId,
  findAll,
  findOrderById,
  findShipperByUserId,
  findShipperById,
  findDeliveryByOrderId,
  updateDelivery,
  updateOrder,
};
