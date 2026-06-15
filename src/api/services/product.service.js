const { productRepository, categoryRepository } = require("../repositories");

const createProduct = async (data) => {
  const {
    id_danh_muc,
    ten_san_pham,
    gia,
    ton_kho,
    ton_kho_toi_thieu,
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

  if (ton_kho === undefined || Number(ton_kho) < 0) {
    throw new Error("Tồn kho không hợp lệ");
  }

  const danhMuc = await categoryRepository.findById(id_danh_muc);

  if (!danhMuc) {
    throw new Error("Danh mục không tồn tại");
  }

  const product = await productRepository.create({
    id_danh_muc,
    ten_san_pham,
    gia,
    ton_kho,
    ton_kho_toi_thieu: ton_kho_toi_thieu || 0,
    hinh_anh,
    mo_ta,
    cong_dung,
    huong_dan_su_dung,
    don_vi_tinh,
    han_su_dung,
    xuat_xu,
    trang_thai: "dang_ban",
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