const { VuNuoi, AoNuoi } = require("../models");

const create = async (data) => {
  return await VuNuoi.create(data);
};

const findById = async (id_vu_nuoi) => {
  return await VuNuoi.findByPk(id_vu_nuoi, {
    include: [{ model: AoNuoi }],
  });
};

const findByPondId = async (id_ao) => {
  return await VuNuoi.findAll({
    where: { id_ao },
    order: [["id_vu_nuoi", "DESC"]],
  });
};

const findActiveByPondId = async (id_ao) => {
  return await VuNuoi.findOne({
    where: {
      id_ao,
      trang_thai: "dang_nuoi",
    },
  });
};

const update = async (id_vu_nuoi, data) => {
  const cropSeason = await VuNuoi.findByPk(id_vu_nuoi);
  if (!cropSeason) return null;

  await cropSeason.update(data);
  return cropSeason;
};

const remove = async (id_vu_nuoi) => {
  const cropSeason = await VuNuoi.findByPk(id_vu_nuoi);
  if (!cropSeason) return null;

  await cropSeason.destroy();
  return cropSeason;
};

module.exports = {
  create,
  findById,
  findByPondId,
  findActiveByPondId,
  update,
  remove,
};