const { Op } = require("sequelize");
const { SanPham, DanhMuc } = require("../models");

const PRODUCT_LIST_ATTRIBUTES = [
  "id_san_pham",
  "id_danh_muc",
  "ten_san_pham",
  "gia",
  "don_vi_tinh",
  "ton_kho",
  "ton_kho_toi_thieu",
  "hinh_anh",
  "han_su_dung",
  "xuat_xu",
  "trang_thai",
  "ngay_tao",
  "ngay_cap_nhat",
];

const PRODUCT_DETAIL_ATTRIBUTES = [
  "id_san_pham",
  "id_danh_muc",
  "ten_san_pham",
  "mo_ta",
  "cong_dung",
  "huong_dan_su_dung",
  "gia",
  "don_vi_tinh",
  "ton_kho",
  "ton_kho_toi_thieu",
  "hinh_anh",
  "han_su_dung",
  "xuat_xu",
  "trang_thai",
  "ngay_tao",
  "ngay_cap_nhat",
];

const CATEGORY_ATTRIBUTES = ["id_danh_muc", "ten_danh_muc", "anh_danh_muc"];

const getSafePagination = (page = 1, limit = 9) => {
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 9, 1), 50);

  return {
    page: safePage,
    limit: safeLimit,
    offset: (safePage - 1) * safeLimit,
  };
};

const buildProductWhere = ({ activeOnly = false, keyword = "", id_danh_muc, minPrice, maxPrice }) => {
  const where = {};

  if (activeOnly) {
    where.trang_thai = "dang_ban";
  }

  if (id_danh_muc) {
    where.id_danh_muc = id_danh_muc;
  }

  const cleanKeyword = String(keyword || "").trim();
  if (cleanKeyword) {
    where[Op.or] = [
      { ten_san_pham: { [Op.like]: `%${cleanKeyword}%` } },
      { cong_dung: { [Op.like]: `%${cleanKeyword}%` } },
    ];
  }

  if (minPrice || maxPrice) {
    where.gia = {};

    if (minPrice) where.gia[Op.gte] = Number(minPrice);
    if (maxPrice) where.gia[Op.lte] = Number(maxPrice);
  }

  return where;
};

const buildProductOrder = (sortBy = "newest") => {
  switch (sortBy) {
    case "priceAsc":
      return [["gia", "ASC"]];
    case "priceDesc":
      return [["gia", "DESC"]];
    case "nameAsc":
      return [["ten_san_pham", "ASC"]];
    case "nameDesc":
      return [["ten_san_pham", "DESC"]];
    case "stockDesc":
      return [["ton_kho", "DESC"]];
    case "oldest":
      return [["id_san_pham", "ASC"]];
    default:
      return [["id_san_pham", "DESC"]];
  }
};

const countByCategoryId = (id_danh_muc) => {
  return SanPham.count({ where: { id_danh_muc } });
};

const findAllActive = async (params = {}) => {
  const { limit, offset } = getSafePagination(params.page, params.limit);

  return SanPham.findAndCountAll({
    where: buildProductWhere({ ...params, activeOnly: true }),
    attributes: PRODUCT_LIST_ATTRIBUTES,
    include: [
      {
        model: DanhMuc,
        attributes: CATEGORY_ATTRIBUTES,
        required: false,
      },
    ],
    distinct: true,
    limit,
    offset,
    order: buildProductOrder(params.sortBy),
  });
};

const findAll = async (params = {}) => {
  const { limit, offset } = getSafePagination(params.page, params.limit);

  return SanPham.findAndCountAll({
    where: buildProductWhere(params),
    attributes: PRODUCT_LIST_ATTRIBUTES,
    include: [
      {
        model: DanhMuc,
        attributes: CATEGORY_ATTRIBUTES,
        required: false,
      },
    ],
    distinct: true,
    limit,
    offset,
    order: buildProductOrder(params.sortBy),
  });
};

const findById = (id) => {
  return SanPham.findByPk(id, {
    attributes: PRODUCT_DETAIL_ATTRIBUTES,
    include: [{ model: DanhMuc, attributes: CATEGORY_ATTRIBUTES }],
  });
};

const create = (data) => {
  return SanPham.create(data);
};

const update = async (id, data) => {
  const product = await SanPham.findByPk(id);
  if (!product) return null;

  return product.update(data);
};

const remove = async (id) => {
  const product = await SanPham.findByPk(id);
  if (!product) return null;

  return product.update({ trang_thai: "ngung_ban" });
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
