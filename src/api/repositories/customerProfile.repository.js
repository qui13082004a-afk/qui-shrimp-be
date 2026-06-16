const { HoSoKhachHang, NguoiDung, AoNuoi, VuNuoi } = require("../models");

const create = async (data) => {
  return await HoSoKhachHang.create(data);
};

const findById = async (id_ho_so) => {
  return await HoSoKhachHang.findByPk(id_ho_so, {
    include: [
      { model: NguoiDung },
      { model: AoNuoi },
      { model: VuNuoi },
    ],
  });
};

const findByUserId = async (id_nguoi_dung) => {
  return await HoSoKhachHang.findAll({
    where: { id_nguoi_dung },
    include: [
      { model: AoNuoi },
      { model: VuNuoi },
    ],
    order: [["id_ho_so", "DESC"]],
  });
};

const findAll = async () => {
  return await HoSoKhachHang.findAll({
    include: [
      { model: NguoiDung },
      { model: AoNuoi },
      { model: VuNuoi },
    ],
    order: [["id_ho_so", "DESC"]],
  });
};

const findByCropSeasonId = async (id_vu_nuoi) => {
  return await HoSoKhachHang.findOne({
    where: { id_vu_nuoi },
  });
};

const update = async (id_ho_so, data) => {
  const profile = await HoSoKhachHang.findByPk(id_ho_so);
  if (!profile) return null;

  await profile.update(data);
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