const { DonHang, ChiTietDonHang, SanPham, NguoiDung, ThanhToan, HoSoKhachHang } = require("../models");
const { Op } = require("sequelize");

const createOrder = async (data, transaction) => {
  return await DonHang.create(data, { transaction });
};

const createOrderDetails = async (details, transaction) => {
  return await ChiTietDonHang.bulkCreate(details, { transaction });
};

const findProductById = async (id_san_pham, transaction) => {
  return await SanPham.findByPk(id_san_pham, { transaction });
};

const updateProductStock = async (product, newStock, transaction) => {
  product.ton_kho = newStock;

  if (newStock <= 0) {
    product.trang_thai = "het_hang";
  }

  return await product.save({ transaction });
};

const createPayment = async (data, transaction) => {
  return await ThanhToan.create(data, { transaction });
};

const findById = async (id_don_hang) => {
  return await DonHang.findByPk(id_don_hang, {
    include: [
      { model: NguoiDung },
      {
        model: ChiTietDonHang,
        include: [{ model: SanPham }],
      },
      { model: ThanhToan },
    ],
  });
};

const findByUserId = async (id_nguoi_dung) => {
  return await DonHang.findAll({
    where: { id_nguoi_dung },
    include: [
      {
        model: ChiTietDonHang,
        include: [{ model: SanPham }],
      },
      { model: ThanhToan },
    ],
    order: [["id_don_hang", "DESC"]],
  });
};

const findAll = async () => {
  return await DonHang.findAll({
    include: [
      { model: NguoiDung },
      {
        model: ChiTietDonHang,
        include: [{ model: SanPham }],
      },
      { model: ThanhToan },
    ],
    order: [["id_don_hang", "DESC"]],
  });
};

const updateStatus = async (id_don_hang, trang_thai_don_hang) => {
  const order = await DonHang.findByPk(id_don_hang);
  if (!order) return null;

  order.trang_thai_don_hang = trang_thai_don_hang;

  if (trang_thai_don_hang === "da_thanh_toan") {
    order.ngay_duyet = new Date();
  }

  if (trang_thai_don_hang === "hoan_tat") {
    order.ngay_giao = new Date();
  }

  await order.save();
  return order;
};

const findApprovedPostpaidProfile = async (id_nguoi_dung, id_vu_nuoi) => {
  return await HoSoKhachHang.findOne({
    where: {
      id_nguoi_dung,
      id_vu_nuoi,
      duoc_phep_tra_sau: true,
    },
  });
};

const getCurrentDebt = async (id_nguoi_dung) => {
  const result = await DonHang.sum("tong_thanh_toan", {
    where: {
      id_nguoi_dung,
      hinh_thuc_thanh_toan: "tra_sau",
      trang_thai_don_hang: {
        [Op.notIn]: ["hoan_tat", "da_huy", "giao_that_bai"],
      },
    },
  });

  return Number(result || 0);
};

module.exports = {
  createOrder,
  createOrderDetails,
  findProductById,
  updateProductStock,
  createPayment,
  findById,
  findByUserId,
  findAll,
  updateStatus,
  findApprovedPostpaidProfile,
  getCurrentDebt,
};