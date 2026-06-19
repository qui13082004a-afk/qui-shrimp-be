const { categoryRepository, productRepository } = require("../repositories");

/**
 * TẠO MỚI DANH MỤC
 */
const createCategory = async (data) => {
  const { ten_danh_muc, mo_ta, anh_danh_muc } = data;
  const existedCategory = await categoryRepository.findByName(ten_danh_muc);
  if (existedCategory) {
    throw new Error(`Danh mục "${ten_danh_muc}" đã tồn tại trên hệ thống`);
  }
  const category = await categoryRepository.create({
    ten_danh_muc,
    mo_ta,
    anh_danh_muc,
    trang_thai: "hoat_dong",
  });

  return category;
};

const getActiveCategories = async () => {
  return await categoryRepository.findAllActive();
};

/**
 * LẤY TOÀN BỘ DANH SÁCH DANH MỤC (Dành cho Admin quản lý)
 */
const getAllCategories = async () => {
  return await categoryRepository.findAll();
};

/**
 * LẤY CHI TIẾT DANH MỤC QUA ID
 */
const getCategoryById = async (id) => {
  const category = await categoryRepository.findById(id);

  if (!category) {
    throw new Error("Không tìm thấy danh mục yêu cầu");
  }

  return category;
};

/**
 * CẬP NHẬT DANH MỤC
 */
const updateCategory = async (id, data) => {
  // 1. NGHIỆP VỤ: Kiểm tra xem danh mục cần cập nhật có tồn tại hay không
  const category = await categoryRepository.findById(id);
  if (!category) {
    throw new Error("Không tìm thấy danh mục cần cập nhật");
  }

  if (data.ten_danh_muc && data.ten_danh_muc !== category.ten_danh_muc) {
    const existedCategory = await categoryRepository.findByName(data.ten_danh_muc);
    if (existedCategory) {
      throw new Error(`Tên danh mục "${data.ten_danh_muc}" đã được sử dụng bởi danh mục khác`);
    }
  }

  // 3. Tiến hành cập nhật
  return await categoryRepository.update(id, data);
};

/**
 * XÓA DANH MỤC
 */
const deleteCategory = async (id) => {

  const category = await categoryRepository.findById(id);
  if (!category) {
    throw new Error("Không tìm thấy danh mục cần xóa");
  }
  const productCount = await productRepository.countByCategoryId(id);
  if (productCount > 0) {
    throw new Error("Không thể xóa danh mục này vì vẫn còn sản phẩm thuộc danh mục này trên hệ thống");
  }

  const result = await categoryRepository.remove(id);
  if (!result) {
    throw new Error("Xóa danh mục không thành công");
  }

  return true;
};

module.exports = {
  createCategory,
  getActiveCategories,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};