const { HoSoKhachHang, NguoiDung, AoNuoi, VuNuoi } = require("../models");

const create = async (data, transaction = null) => {
  return await HoSoKhachHang.create(data, { transaction });
};

const findById = async (id_ho_so, transaction = null) => {
  return await HoSoKhachHang.findByPk(id_ho_so, {
    include: [{ model: NguoiDung }, { model: AoNuoi }, { model: VuNuoi }],
    transaction,
  });
};

const findByUserId = async (id_nguoi_dung) => {
  return await HoSoKhachHang.findAll({
    where: { id_nguoi_dung },
    include: [{ model: AoNuoi }, { model: VuNuoi }],
    order: [["id_ho_so", "DESC"]],
  });
};

const findAll = async () => {
  return await HoSoKhachHang.findAll({
    include: [{ model: NguoiDung }, { model: AoNuoi }, { model: VuNuoi }],
    order: [["id_ho_so", "DESC"]],
  });
};

const findByCropSeasonId = async (id_vu_nuoi, transaction = null) => {
  return await HoSoKhachHang.findOne({
    where: { id_vu_nuoi },
    transaction,
  });
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
  update,
};