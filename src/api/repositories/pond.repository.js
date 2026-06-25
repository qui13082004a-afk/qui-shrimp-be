const { AoNuoi,VuNuoi } = require("../models");

const create = async (data) => {
  return await AoNuoi.create(data);
};

const findByUserId = async (id_nguoi_dung) => {
  const ponds = await AoNuoi.findAll({
    where: { id_nguoi_dung },
    order: [["id_ao", "DESC"]],
  });

  const result = await Promise.all(
    ponds.map(async (pond) => {
      const activeCrop = await VuNuoi.findOne({
        where: {
          id_ao: pond.id_ao,
          trang_thai: "dang_nuoi",
        },
      });

      return {
        ...pond.toJSON(),
        co_vu_dang_nuoi: !!activeCrop,
      };
    })
  );

  return result;
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