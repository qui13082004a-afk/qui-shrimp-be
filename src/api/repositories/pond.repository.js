const { AoNuoi } = require("../models");

const create = async (data) => {
  return await AoNuoi.create(data);
};

const findByUserId = async (id_nguoi_dung) => {
  return await AoNuoi.findAll({
    where: { id_nguoi_dung },
    order: [["id_ao", "DESC"]],
  });
};

const findById = async (id_ao) => {
  return await AoNuoi.findByPk(id_ao);
};

const update = async (id_ao, data) => {
  const pond = await AoNuoi.findByPk(id_ao);
  if (!pond) return null;

  await pond.update(data);
  return pond;
};

const remove = async (id_ao) => {
  const pond = await AoNuoi.findByPk(id_ao);
  if (!pond) return null;

  await pond.destroy();
  return pond;
};

module.exports = {
  create,
  findByUserId,
  findById,
  update,
  remove,
};