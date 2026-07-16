const { productRepository, categoryRepository } = require("../repositories");

const toPlainProduct = (product) => {
  const plain = product?.toJSON ? product.toJSON() : product;
  if (!plain) return plain;

  const stocks = Array.isArray(plain.TonKhoSanPhams)
    ? plain.TonKhoSanPhams
    : [];

  const totalStock = stocks.reduce(
    (sum, stock) => sum + Number(stock.so_luong || 0),
    0
  );
  const totalMinimumStock = stocks.reduce(
    (sum, stock) => sum + Number(stock.ton_kho_toi_thieu || 0),
    0
  );

  return {
    ...plain,
    ton_kho: totalStock,
    ton_kho_toi_thieu: totalMinimumStock,
  };
};

const normalizeProductPayload = (data = {}) => {
  const {
    ton_kho,
    ton_kho_toi_thieu,
    id_kho_hang,
    so_luong_kho,
    ...productData
  } = data;

  return productData;
};

const createProduct = async (data) => {
  const {
    id_danh_muc,
    ten_san_pham,
    gia,
    hinh_anh,
    mo_ta,
    cong_dung,
    huong_dan_su_dung,
    don_vi_tinh,
    han_su_dung,
    xuat_xu,
  } = data;

  if (!id_danh_muc) {
    throw new Error("Vui lòng chọn danh mục");
  }

  if (!ten_san_pham) {
    throw new Error("Tên sản phẩm không được để trống");
  }

  if (!gia || Number(gia) <= 0) {
    throw new Error("Giá bán phải lớn hơn 0");
  }

  const danhMuc = await categoryRepository.findById(id_danh_muc);

  if (!danhMuc) {
    throw new Error("Danh mục không tồn tại");
  }

  const product = await productRepository.create({
    id_danh_muc,
    ten_san_pham,
    gia,
    hinh_anh,
    mo_ta,
    cong_dung,
    huong_dan_su_dung,
    don_vi_tinh,
    han_su_dung,
    xuat_xu,
    trang_thai: "dang_ban",
  });

  return toPlainProduct(product);
};

const getActiveProducts = async (query = {}) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 9;
  const keyword =
    query.keyword && query.keyword.trim() !== "" ? query.keyword.trim() : "";
  const id_danh_muc =
    query.id_danh_muc && query.id_danh_muc !== ""
      ? Number(query.id_danh_muc)
      : undefined;
  const id_kho_hang =
    query.id_kho_hang && query.id_kho_hang !== ""
      ? Number(query.id_kho_hang)
      : undefined;
  const minPrice =
    query.minPrice && query.minPrice !== "" ? Number(query.minPrice) : undefined;
  const maxPrice =
    query.maxPrice && query.maxPrice !== "" ? Number(query.maxPrice) : undefined;
  const sortBy =
    query.sortBy && query.sortBy.trim() !== "" ? query.sortBy.trim() : "newest";

  const result = await productRepository.findAllActive({
    page,
    limit,
    keyword,
    id_danh_muc,
    id_kho_hang,
    minPrice,
    maxPrice,
    sortBy,
  });

  return {
    products: result.rows.map(toPlainProduct),
    pagination: {
      page,
      limit,
      totalItems: result.count,
      totalPages: Math.ceil(result.count / limit),
    },
  };
};

const getAllProducts = async (query = {}) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 9;
  const keyword =
    query.keyword && query.keyword.trim() !== "" ? query.keyword.trim() : "";
  const id_danh_muc =
    query.id_danh_muc && query.id_danh_muc !== ""
      ? Number(query.id_danh_muc)
      : undefined;
  const id_kho_hang =
    query.id_kho_hang && query.id_kho_hang !== ""
      ? Number(query.id_kho_hang)
      : undefined;
  const trang_thai =
    query.trang_thai && query.trang_thai !== "tat_ca" && query.trang_thai !== ""
      ? query.trang_thai
      : undefined;
  const minPrice =
    query.minPrice && query.minPrice !== "" ? Number(query.minPrice) : undefined;
  const maxPrice =
    query.maxPrice && query.maxPrice !== "" ? Number(query.maxPrice) : undefined;
  const sortBy =
    query.sortBy && query.sortBy.trim() !== "" ? query.sortBy.trim() : "newest";

  const result = await productRepository.findAll({
    page,
    limit,
    keyword,
    id_danh_muc,
    id_kho_hang,
    trang_thai,
    minPrice,
    maxPrice,
    sortBy,
  });

  return {
    products: result.rows.map(toPlainProduct),
    pagination: {
      page,
      limit,
      totalItems: result.count,
      totalPages: Math.ceil(result.count / limit),
    },
  };
};

const getProductById = async (id) => {
  const product = await productRepository.findById(id);

  if (!product) {
    throw new Error("Không tìm thấy sản phẩm");
  }

  return toPlainProduct(product);
};

const updateProduct = async (id, data) => {
  const product = await productRepository.update(id, normalizeProductPayload(data));

  if (!product) {
    throw new Error("Không tìm thấy sản phẩm");
  }

  return getProductById(id);
};

const deleteProduct = async (id) => {
  const result = await productRepository.remove(id);

  if (!result) {
    throw new Error("Không tìm thấy sản phẩm");
  }

  return true;
};

module.exports = {
  createProduct,
  getActiveProducts,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};
