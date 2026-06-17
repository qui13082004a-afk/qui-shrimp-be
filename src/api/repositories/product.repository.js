const { SanPham, DanhMuc } = require("../models");

const create = async (data) => {
  return await SanPham.create(data);
};
const findAllActive = async ({ page = 1, limit = 9, keyword = "", id_danh_muc }) => {
  const offset = (page - 1) * limit;

  const where = {
    trang_thai: "dang_ban",
  };

  if (id_danh_muc) {
    where.id_danh_muc = id_danh_muc;
  }

  if (keyword) {
    where.ten_san_pham = {
      [require("sequelize").Op.like]: `%${keyword}%`,
    };
  }

  return await SanPham.findAndCountAll({
    where,
    include: [{ model: DanhMuc }],
    limit,
    offset,
    order: [["id_san_pham", "DESC"]],
  });
};


const findAll = async ({ page = 1, limit = 9, keyword = "", id_danh_muc }) => {
  const offset = (page - 1) * limit;

  const where = {};

  if (id_danh_muc) {
    where.id_danh_muc = id_danh_muc;
  }

  if (keyword) {
    where.ten_san_pham = {
      [require("sequelize").Op.like]: `%${keyword}%`,
    };
  }

  return await SanPham.findAndCountAll({
    where,
    include: [{ model: DanhMuc }],
    limit,
    offset,
    order: [["id_san_pham", "DESC"]],
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
    trang_thai: "ngung_ban",
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