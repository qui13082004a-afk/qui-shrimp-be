const { Op } = require("sequelize");
const { SanPham, DanhMuc } = require("../models");

const findAllActive = async ({
  page = 1,
  limit = 9,
  keyword = "",
  id_danh_muc,
  minPrice,
  maxPrice,
  sortBy = "newest",
}) => {
  const offset = (page - 1) * limit;

  const where = {
    trang_thai: "dang_ban",
  };

  if (id_danh_muc) {
    where.id_danh_muc = id_danh_muc;
  }

  if (keyword) {
    where[Op.or] = [
      {
        ten_san_pham: {
          [Op.like]: `%${keyword}%`,
        },
      },
      {
        cong_dung: {
          [Op.like]: `%${keyword}%`,
        },
      },
    ];
  }

  if (minPrice || maxPrice) {
    where.gia = {};

    if (minPrice) {
      where.gia[Op.gte] = minPrice;
    }

    if (maxPrice) {
      where.gia[Op.lte] = maxPrice;
    }
  }

  let order = [["id_san_pham", "DESC"]];

  switch (sortBy) {
    case "priceAsc":
      order = [["gia", "ASC"]];
      break;

    case "priceDesc":
      order = [["gia", "DESC"]];
      break;

    case "nameAsc":
      order = [["ten_san_pham", "ASC"]];
      break;

    case "nameDesc":
      order = [["ten_san_pham", "DESC"]];
      break;

    case "stockDesc":
      order = [["ton_kho", "DESC"]];
      break;

    case "oldest":
      order = [["id_san_pham", "ASC"]];
      break;

    default:
      order = [["id_san_pham", "DESC"]];
  }

  return await SanPham.findAndCountAll({
    where,
    include: [{ model: DanhMuc }],
    limit,
    offset,
    order,
  });
};

const findAll = async ({
  page = 1,
  limit = 9,
  keyword = "",
  id_danh_muc,
  minPrice,
  maxPrice,
  sortBy = "newest",
}) => {
  const offset = (page - 1) * limit;

  const where = {};

  if (id_danh_muc) {
    where.id_danh_muc = id_danh_muc;
  }

  if (keyword) {
    where[Op.or] = [
      {
        ten_san_pham: {
          [Op.like]: `%${keyword}%`,
        },
      },
      {
        cong_dung: {
          [Op.like]: `%${keyword}%`,
        },
      },
    ];
  }

  if (minPrice || maxPrice) {
    where.gia = {};

    if (minPrice) {
      where.gia[Op.gte] = minPrice;
    }

    if (maxPrice) {
      where.gia[Op.lte] = maxPrice;
    }
  }

  let order = [["id_san_pham", "DESC"]];

  switch (sortBy) {
    case "priceAsc":
      order = [["gia", "ASC"]];
      break;

    case "priceDesc":
      order = [["gia", "DESC"]];
      break;

    case "nameAsc":
      order = [["ten_san_pham", "ASC"]];
      break;

    case "nameDesc":
      order = [["ten_san_pham", "DESC"]];
      break;

    case "stockDesc":
      order = [["ton_kho", "DESC"]];
      break;

    case "oldest":
      order = [["id_san_pham", "ASC"]];
      break;

    default:
      order = [["id_san_pham", "DESC"]];
  }

  return await SanPham.findAndCountAll({
    where,
    include: [{ model: DanhMuc }],
    limit,
    offset,
    order,
  });
};