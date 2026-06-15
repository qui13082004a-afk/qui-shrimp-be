const { SanPham, DanhMuc } = require("../models");

const create = async (data) => {
  return await SanPham.create(data);
};

const findAllActive = async () => {
  return await SanPham.findAll({
    where: {
      trang_thai: "hoat_dong",
    },
    include: [
      {
        model: DanhMuc,
        attributes: ["id_danh_muc", "ten_danh_muc"],
      },
    ],
  });
};

const findAll = async () => {
  return await SanPham.findAll({
    include: [
      {
        model: DanhMuc,
        attributes: ["id_danh_muc", "ten_danh_muc"],
      },
    ],
  });
};

const findById = async (id) => {
  return await SanPham.findByPk(id, {
    include: [
      {
        model: DanhMuc,
        attributes: ["id_danh_muc", "ten_danh_muc"],
      },
    ],
  });
};

const update = async (id, data) => {
  const sanPham = await SanPham.findByPk(id);

  if (!sanPham) {
    return null;
  }

  await sanPham.update(data);

  return sanPham;
};

const remove = async (id) => {
  const sanPham = await SanPham.findByPk(id);

  if (!sanPham) {
    return null;
  }

  await sanPham.update({
    trang_thai: "an",
  });

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