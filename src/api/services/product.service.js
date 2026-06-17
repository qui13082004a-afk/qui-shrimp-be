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

const getActiveProducts = async (query = {}) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 9;

  // Lọc sạch các chuỗi rỗng gửi từ URL của Front-end
  const keyword = query.keyword && query.keyword.trim() !== "" ? query.keyword.trim() : "";
  
  // Chuyển sang undefined nếu rỗng để Sequelize tự động bỏ qua
  const id_danh_muc = query.id_danh_muc && query.id_danh_muc !== "" ? Number(query.id_danh_muc) : undefined;

  // Ép kiểu số an toàn cho khoảng giá để tránh lỗi Mismatch Data Type
  const minPrice = query.minPrice && query.minPrice !== "" ? Number(query.minPrice) : undefined;
  const maxPrice = query.maxPrice && query.maxPrice !== "" ? Number(query.maxPrice) : undefined;

  // Đảm bảo sortBy luôn có dữ liệu hợp lệ trước khi gửi xuống Repository
  const sortBy = query.sortBy && query.sortBy.trim() !== "" ? query.sortBy.trim() : "newest";

  // SỬA TẠI ĐÂY: Đổi từ findAllActive sang findAll để sửa lỗi "is not a function"
  const result = await productRepository.findAll({
    page,
    limit,
    keyword,
    id_danh_muc,
    minPrice,
    maxPrice,
    sortBy,
  });

  return {
    products: result.rows,
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

  // Lọc sạch các chuỗi rỗng gửi từ URL của Front-end
  const keyword = query.keyword && query.keyword.trim() !== "" ? query.keyword.trim() : "";
  
  // Chuyển sang undefined nếu rỗng để Sequelize tự động bỏ qua
  const id_danh_muc = query.id_danh_muc && query.id_danh_muc !== "" ? Number(query.id_danh_muc) : undefined;

  // Ép kiểu số an toàn cho khoảng giá để tránh lỗi Mismatch Data Type
  const minPrice = query.minPrice && query.minPrice !== "" ? Number(query.minPrice) : undefined;
  const maxPrice = query.maxPrice && query.maxPrice !== "" ? Number(query.maxPrice) : undefined;

  // Đảm bảo sortBy luôn có dữ liệu hợp lệ trước khi gửi xuống Repository
  const sortBy = query.sortBy && query.sortBy.trim() !== "" ? query.sortBy.trim() : "newest";

  const result = await productRepository.findAll({
    page,
    limit,
    keyword,
    id_danh_muc,
    minPrice,
    maxPrice,
    sortBy,
  });

  return {
    products: result.rows,
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