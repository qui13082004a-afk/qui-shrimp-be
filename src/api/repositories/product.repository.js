const { Op } = require("sequelize");
const { SanPham, DanhMuc } = require("../models");
const countByCategoryId = async (id_danh_muc) => {
  return await SanPham.count({
    where: {
      id_danh_muc: id_danh_muc,
    },
  });
};
// 1. Hàm lấy danh sách sản phẩm đang bán (Dành cho khách hàng / Store)
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

// 2. Hàm lấy TẤT CẢ sản phẩm (Kể cả hàng đã ẩn - Dành cho Admin)
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

// 3. Hàm tìm sản phẩm theo ID (Xem chi tiết) - BỔ SUNG
const findById = async (id) => {
  return await SanPham.findByPk(id, {
    include: [{ model: DanhMuc }],
  });
};

// 4. Hàm tạo mới sản phẩm - BỔ SUNG
const create = async (data) => {
  return await SanPham.create(data);
};

// 5. Hàm cập nhật thông tin sản phẩm - BỔ SUNG
const update = async (id, data) => {
  const product = await SanPham.findByPk(id);
  if (!product) return null;
  
  return await product.update(data);
};

// 6. Hàm xóa sản phẩm (hoặc chuyển trạng thái thành ngung_ban) - BỔ SUNG
const remove = async (id) => {
  const product = await SanPham.findByPk(id);
  if (!product) return null;

  // Nếu dự án của bạn muốn XÓA HẲN khỏi DB, hãy dùng: return await product.destroy();
  // Còn code dưới đây tuân theo logic Soft Delete (Ẩn đi) bằng cách đổi trạng thái:
  return await product.update({ trang_thai: "ngung_ban" });
};

module.exports = {
  findAllActive,
  findAll,
  findById,
  create,
  update,
  remove,
  countByCategoryId,
};