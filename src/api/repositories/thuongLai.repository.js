const { ThuongLai } = require("../models");

const create = async (data) => {
  return await ThuongLai.create(data);
};

const findAll = async () => {
  return await ThuongLai.findAll({
    order: [["id_thuong_lai", "DESC"]],
  });
};

const findActive = async () => {
  return await ThuongLai.findAll({
    where: { trang_thai: "hoat_dong" },
    order: [["ten_thuong_lai", "ASC"]],
  });
};

const findById = async (id_thuong_lai) => {
  return await ThuongLai.findByPk(id_thuong_lai);
};

const findByPhone = async (so_dien_thoai) => {
  return await ThuongLai.findOne({
    where: { so_dien_thoai },
  });
};

const update = async (id_thuong_lai, data) => {
  const merchant = await ThuongLai.findByPk(id_thuong_lai);
  if (!merchant) return null;

  await merchant.update(data);
  return merchant;
};

module.exports = {
  create,
  findAll,
  findActive,
  findById,
  findByPhone,
  update,
};