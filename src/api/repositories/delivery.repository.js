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
  KhoHang,
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

const create = async (data, transaction = null) => {
  return await GiaoHang.create(data, { transaction });
};

const findById = async (id_giao_hang, transaction = null) => {
  return await GiaoHang.findByPk(id_giao_hang, {
    include: [
      {
        model: DonHang,
        include: deliveryOrderInclude,
      },
      { model: NhanVienGiaoHang },
      { model: KhoHang },
    ],
    transaction,
    lock: transaction ? transaction.LOCK.UPDATE : undefined,
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

const findActiveShippers = async () => {
  return await NhanVienGiaoHang.findAll({
    where: { trang_thai: "dang_lam" },
    include: [{ model: NguoiDung }],
    order: [["id_nhan_vien_giao_hang", "DESC"]],
  });
};

const findAllShippers = async () => {
  return await NhanVienGiaoHang.findAll({
    include: [{ model: NguoiDung }],
    order: [["id_nhan_vien_giao_hang", "DESC"]],
  });
};

const findDeliveryByOrderId = async (id_don_hang) => {
  return await GiaoHang.findOne({
    where: { id_don_hang },
  });
};

const updateDelivery = async (delivery, data, transaction = null) => {
  await delivery.update(data, { transaction });
  return delivery;
};

const updateOrder = async (order, data, transaction = null) => {
  await order.update(data, { transaction });
  return order;
};

const updateShipper = async (shipper, data, transaction = null) => {
  await shipper.update(data, { transaction });
  return shipper;
};

module.exports = {
  create,
  findById,
  findByShipperId,
  findAll,
  findOrderById,
  findShipperByUserId,
  findShipperById,
  findActiveShippers,
  findAllShippers,
  findDeliveryByOrderId,
  updateDelivery,
  updateOrder,
  updateShipper,
};
