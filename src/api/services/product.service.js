const { productRepository, categoryRepository } = require("../repositories");

const createProduct = async (data) => {
  const {
    id_danh_muc,
    ten_san_pham,
    gia_ban,
    so_luong_ton,
    ton_kho_toi_thieu,
    hinh_anh,
    mo_ta,
    cong_dung,
    huong_dan_su_dung,
  } = data;

  if (!id_danh_muc) {
    throw new Error("Vui lòng chọn danh mục");
  }

  if (!ten_san_pham) {
    throw new Error("Tên sản phẩm không được để trống");
  }

  if (!gia_ban || gia_ban <= 0) {
    throw new Error("Giá bán phải lớn hơn 0");
  }

  if (so_luong_ton === undefined || so_luong_ton < 0) {
    throw new Error("Số lượng tồn không hợp lệ");
  }

  const danhMuc = await categoryRepository.findById(id_danh_muc);

  if (!danhMuc) {
    throw new Error("Danh mục không tồn tại");
  }

  const product = await productRepository.create({
    id_danh_muc,
    ten_san_pham,
    gia_ban,
    so_luong_ton,
    ton_kho_toi_thieu: ton_kho_toi_thieu || 0,
    hinh_anh,
    mo_ta,
    cong_dung,
    huong_dan_su_dung,
    trang_thai: "hoat_dong",
  });

  return product;
};

const getActiveProducts = async () => {
  return await productRepository.findAllActive();
};

const getAllProducts = async () => {
  return await productRepository.findAll();
};

const getProductById = async (id) => {
  const product = await productRepository.findById(id);

  if (!product) {
    throw new Error("Không tìm thấy sản phẩm");
  }

  return product;
};

const updateProduct = async (id, data) => {
  const product = await productRepository.update(id, data);

  if (!product) {
    throw new Error("Không tìm thấy sản phẩm");
  }

  return product;
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