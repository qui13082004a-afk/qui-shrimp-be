const { Op } = require("sequelize");
const {
  HoSoKhachHang,
  NguoiDung,
  AoNuoi,
  VuNuoi,
  ChinhSachHanMuc,
} = require("../models");

const create = async (data, transaction = null) => {
  return await HoSoKhachHang.create(data, { transaction });
};

const findById = async (id_ho_so, transaction = null) => {
  return await HoSoKhachHang.findByPk(id_ho_so, {
    include: [
      { model: NguoiDung },
      { model: AoNuoi },
      { model: VuNuoi },
      { model: ChinhSachHanMuc },
    ],
    transaction,
  });
};

const findByUserId = async (id_nguoi_dung) => {
  return await HoSoKhachHang.findAll({
    where: { id_nguoi_dung },
    include: [{ model: AoNuoi }, { model: VuNuoi }, { model: ChinhSachHanMuc }],
    order: [["id_ho_so", "DESC"]],
  });
};

const findAll = async () => {
  return await HoSoKhachHang.findAll({
    include: [
      { model: NguoiDung },
      { model: AoNuoi },
      { model: VuNuoi },
      { model: ChinhSachHanMuc },
    ],
    order: [["id_ho_so", "DESC"]],
  });
};

const findByCropSeasonId = async (id_vu_nuoi, transaction = null) => {
  return await HoSoKhachHang.findOne({
    where: { id_vu_nuoi },
    transaction,
  });
};

// Đếm số hồ sơ hiện có của 1 khách hàng, có thể loại trừ một số trạng thái
// (ví dụ loại trừ "tu_choi" để hồ sơ bị từ chối không tính vào giới hạn).
const countByUserId = async (id_nguoi_dung, excludeStatuses = [], transaction = null) => {
  const where = { id_nguoi_dung };
  if (excludeStatuses.length) {
    where.trang_thai_ho_so = { [Op.notIn]: excludeStatuses };
  }
  return await HoSoKhachHang.count({ where, transaction });
};

const update = async (id_ho_so, data, transaction = null) => {
  const profile = await HoSoKhachHang.findByPk(id_ho_so, {
    transaction,
  });

  if (!profile) return null;

  await profile.update(data, {
    transaction,
  });

  return profile;
};

module.exports = {
  create,
  findById,
  findByUserId,
  findAll,
  findByCropSeasonId,
  countByUserId,
  update,
};
