const { AoNuoi, VuNuoi } = require("../models");

const create = (data) => {
  return AoNuoi.create(data);
};

const findByUserId = async (id_nguoi_dung) => {
  const ponds = await AoNuoi.findAll({
    where: { id_nguoi_dung },
    include: [
      {
        model: VuNuoi,
        required: false,
        attributes: ["id_vu_nuoi", "trang_thai"],
        where: { trang_thai: "dang_nuoi" },
      },
    ],
    order: [["id_ao", "DESC"]],
  });

  return ponds.map((pond) => {
    const plain = pond.toJSON();

    return {
      ...plain,
      VuNuois: undefined,
      co_vu_dang_nuoi: Array.isArray(plain.VuNuois) && plain.VuNuois.length > 0,
    };
  });
};

const findById = (id_ao) => {
  return AoNuoi.findByPk(id_ao);
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
