const { DiaChiGiaoHang, TinhThanh, PhuongXa } = require("../models");

const ADDRESS_ATTRIBUTES = [
  "id_dia_chi",
  "id_nguoi_dung",
  "ten_nguoi_nhan",
  "so_dien_thoai",
  "dia_chi",
  "id_tinh_thanh",
  "id_phuong_xa",
  "vi_do",
  "kinh_do",
  "la_mac_dinh",
  "dang_hoat_dong",
  "ghi_chu",
  "ngay_tao",
  "ngay_cap_nhat",
];

const ADDRESS_INCLUDE = [
  {
    model: TinhThanh,
    attributes: ["id_tinh_thanh", "ma_tinh", "ten_tinh"],
    required: false,
  },
  {
    model: PhuongXa,
    attributes: ["id_phuong_xa", "ma_xa", "ten_xa", "cap_xa"],
    required: false,
  },
];

const findByUserId = (id_nguoi_dung) => {
  return DiaChiGiaoHang.findAll({
    where: { id_nguoi_dung, dang_hoat_dong: true },
    attributes: ADDRESS_ATTRIBUTES,
    include: ADDRESS_INCLUDE,
    order: [
      ["la_mac_dinh", "DESC"],
      ["id_dia_chi", "DESC"],
    ],
  });
};

const findByIdForUser = (id_dia_chi, id_nguoi_dung, transaction) => {
  return DiaChiGiaoHang.findOne({
    where: { id_dia_chi, id_nguoi_dung, dang_hoat_dong: true },
    attributes: ADDRESS_ATTRIBUTES,
    include: ADDRESS_INCLUDE,
    transaction,
    lock: transaction ? true : undefined,
  });
};

const countActiveByUser = (id_nguoi_dung, transaction) => {
  return DiaChiGiaoHang.count({
    where: { id_nguoi_dung, dang_hoat_dong: true },
    transaction,
  });
};

const unsetDefaultByUser = (id_nguoi_dung, transaction) => {
  return DiaChiGiaoHang.update(
    { la_mac_dinh: false },
    {
      where: { id_nguoi_dung, dang_hoat_dong: true },
      transaction,
    }
  );
};

const create = (data, transaction) => {
  return DiaChiGiaoHang.create(data, { transaction });
};

const update = async (address, data, transaction) => {
  return address.update(data, { transaction });
};

const softDelete = async (address, transaction) => {
  return address.update(
    { dang_hoat_dong: false, la_mac_dinh: false },
    { transaction }
  );
};

module.exports = {
  findByUserId,
  findByIdForUser,
  countActiveByUser,
  unsetDefaultByUser,
  create,
  update,
  softDelete,
};
