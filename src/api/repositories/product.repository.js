const { Op } = require("sequelize");
const { SanPham, DanhMuc, TonKhoSanPham, KhoHang } = require("../models");

/**
 * Các trường dùng khi hiển thị danh sách sản phẩm.
 */
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

/**
 * Các trường dùng khi xem chi tiết sản phẩm.
 */
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

/**
 * Chỉ lấy các trường cần thiết của danh mục
 */
const CATEGORY_ATTRIBUTES = [
  "id_danh_muc",
  "ten_danh_muc",
  "anh_danh_muc",
];

const STOCK_INCLUDE = {
  model: TonKhoSanPham,
  required: false,
  include: [
    {
      model: KhoHang,
      attributes: [
        "id_kho_hang",
        "ten_kho",
        "dia_chi",
        "vi_do",
        "kinh_do",
        "ghi_chu",
        "trang_thai",
        "ngay_tao",
        "ngay_cap_nhat",
      ],
    },
  ],
};

/**
 * Chuẩn hóa page và limit.
 * - Giới hạn limit tối đa 50 để tránh query quá lớn.
 */
const getSafePagination = (page = 1, limit = 9) => {
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 9, 1), 50);

  return {
    page: safePage,
    limit: safeLimit,
    offset: (safePage - 1) * safeLimit,
  };
};

/**
 * Tạo điều kiện WHERE động dựa trên
 */
const buildProductWhere = ({
  activeOnly = false,
  keyword = "",
  id_danh_muc,
  trang_thai,
  minPrice,
  maxPrice,
}) => {
  const where = {};

  // Chỉ lấy sản phẩm đang bán
  if (activeOnly) {
    where.trang_thai = "dang_ban";
  }

  // Lọc theo danh mục
  if (id_danh_muc) {
    where.id_danh_muc = id_danh_muc;
  }

  if (!activeOnly && trang_thai) {
    where.trang_thai = trang_thai;
  }

  // Tìm kiếm theo tên hoặc công dụng
  const cleanKeyword = String(keyword || "").trim();

  if (cleanKeyword) {
    where[Op.or] = [
      {
        ten_san_pham: {
          [Op.like]: `%${cleanKeyword}%`,
        },
      },
      {
        cong_dung: {
          [Op.like]: `%${cleanKeyword}%`,
        },
      },
    ];
  }

  // Lọc theo khoảng giá
  if (minPrice || maxPrice) {
    where.gia = {};

    if (minPrice) where.gia[Op.gte] = Number(minPrice);
    if (maxPrice) where.gia[Op.lte] = Number(maxPrice);
  }

  return where;
};

/**
 * Xây dựng ORDER BY tương ứng với lựa chọn sắp xếp.
 */
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

/**
 * Đếm số sản phẩm thuộc một danh mục.
 */
const countByCategoryId = (id_danh_muc) => {
  return SanPham.count({
    where: {
      id_danh_muc,
    },
  });
};

/**
 * Lấy danh sách sản phẩm đang bán.
 * Có hỗ trợ:
 * - phân trang
 * - tìm kiếm
 * - lọc
 * - sắp xếp
 */
const findAllActive = async (params = {}) => {
  const { limit, offset } = getSafePagination(params.page, params.limit);
  const stockInclude = {
    ...STOCK_INCLUDE,
    required: Boolean(params.id_kho_hang),
    where: params.id_kho_hang ? { id_kho_hang: params.id_kho_hang } : undefined,
  };

  return SanPham.findAndCountAll({
    where: buildProductWhere({
      ...params,
      activeOnly: true,
    }),
    attributes: PRODUCT_LIST_ATTRIBUTES,
    include: [
      {
        model: DanhMuc,
        attributes: CATEGORY_ATTRIBUTES,
        required: false,
      },
      stockInclude,
    ],
    distinct: true,
    limit,
    offset,
    order: buildProductOrder(params.sortBy),
  });
};

/**
 * Admin:
 * Lấy toàn bộ sản phẩm (bao gồm cả ngừng bán).
 */
const findAll = async (params = {}) => {
  const { limit, offset } = getSafePagination(params.page, params.limit);
  const stockInclude = {
    ...STOCK_INCLUDE,
    required: Boolean(params.id_kho_hang),
    where: params.id_kho_hang ? { id_kho_hang: params.id_kho_hang } : undefined,
  };

  return SanPham.findAndCountAll({
    where: buildProductWhere(params),
    attributes: PRODUCT_LIST_ATTRIBUTES,
    include: [
      {
        model: DanhMuc,
        attributes: CATEGORY_ATTRIBUTES,
        required: false,
      },
      stockInclude,
    ],
    distinct: true,
    limit,
    offset,
    order: buildProductOrder(params.sortBy),
  });
};

/**
 * Lấy chi tiết một sản phẩm theo ID.
 */
const findById = (id) => {
  return SanPham.findByPk(id, {
    attributes: PRODUCT_DETAIL_ATTRIBUTES,
    include: [
      {
        model: DanhMuc,
        attributes: CATEGORY_ATTRIBUTES,
      },
      STOCK_INCLUDE,
    ],
  });
};

/**
 * Tạo sản phẩm mới.
 */
const create = (data) => {
  return SanPham.create(data);
};

/**
 * Cập nhật thông tin sản phẩm.
 */
const update = async (id, data) => {
  const product = await SanPham.findByPk(id);

  if (!product) return null;

  return product.update(data);
};

/**
 * Soft Delete:
 * Không xóa dữ liệu khỏi database,
 * chỉ chuyển trạng thái thành "ngừng bán".
 */
const remove = async (id) => {
  const product = await SanPham.findByPk(id);

  if (!product) return null;

  return product.update({
    trang_thai: "ngung_ban",
  });
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
