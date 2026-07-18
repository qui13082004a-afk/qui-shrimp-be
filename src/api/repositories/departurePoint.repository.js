const { CauHinhDiemXuatPhat } = require("../models");

const findAll = async () => {
  return await CauHinhDiemXuatPhat.findAll({
    order: [
      ["la_mac_dinh", "DESC"],
      ["id_diem_xuat_phat", "DESC"],
    ],
  });
};

const findById = async (id_diem_xuat_phat, transaction = null) => {
  return await CauHinhDiemXuatPhat.findByPk(id_diem_xuat_phat, {
    transaction,
  });
};

const findDefaultActive = async () => {
  return await CauHinhDiemXuatPhat.findOne({
    where: {
      la_mac_dinh: true,
      dang_hoat_dong: true,
    },
    order: [["id_diem_xuat_phat", "DESC"]],
  });
};

const clearDefault = async (transaction = null) => {
  return await CauHinhDiemXuatPhat.update(
    { la_mac_dinh: false },
    { where: { la_mac_dinh: true }, transaction }
  );
};

const create = async (data, transaction = null) => {
  return await CauHinhDiemXuatPhat.create(data, { transaction });
};

const update = async (id_diem_xuat_phat, data, transaction = null) => {
  const point = await findById(id_diem_xuat_phat, transaction);
  if (!point) return null;
  await point.update(data, { transaction });
  return point;
};

module.exports = {
  findAll,
  findById,
  findDefaultActive,
  clearDefault,
  create,
  update,
};
