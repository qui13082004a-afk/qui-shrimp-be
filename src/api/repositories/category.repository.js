const { DanhMuc } = require("../models");

const create = async (data) => {
  return await DanhMuc.create(data);
};

// Khách hàng
const findAllActive = async () => {
  return await DanhMuc.findAll({
    where: {
      trang_thai: "hoat_dong",
    },
  });
};

// Admin
const findAll = async () => {
  return await DanhMuc.findAll();
};

const findById = async (id) => {
  return await DanhMuc.findByPk(id);
};

const update = async (id, data) => {
  const danhMuc = await DanhMuc.findByPk(id);

  if (!danhMuc) {
    return null;
  }

  await danhMuc.update(data);

  return danhMuc;
};

const remove = async (id) => {
  const danhMuc = await DanhMuc.findByPk(id);

  if (!danhMuc) {
    return null;
  }

  await danhMuc.destroy();

  return true;
};

module.exports = {
  create,
  findAllActive,
  findAll,
  findById,
  update,
  remove,
};