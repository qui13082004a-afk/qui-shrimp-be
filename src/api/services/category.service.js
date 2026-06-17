const { categoryRepository } = require("../repositories");

const createCategory = async (data) => {
  const { ten_danh_muc, mo_ta, anh_danh_muc } = data;

  if (!ten_danh_muc) {
    throw new Error("Tên danh mục không được để trống");
  }
  const category = await categoryRepository.create({
    ten_danh_muc,
    mo_ta,
    anh_danh_muc,
    trang_thai: "hoat_dong",
  });

  return category;
};

// Dành cho khách hàng: chỉ lấy danh mục đang hoạt động
const getActiveCategories= async () => {
  return await categoryRepository.findAllActive();
};

// Dành cho admin: lấy tất cả danh mục
const getAllCategories = async () => {
  return await categoryRepository.findAll();
};

const getCategoryById = async (id) => {
  const category = await categoryRepository.findById(id);

  if (!category) {
    throw new Error("Không tìm thấy danh mục");
  }

  return category;
};

const updateCategory = async (id, data) => {
  const category = await categoryRepository.update(id, data);

  if (!category) {
    throw new Error("Không tìm thấy danh mục");
  }

  return category;
};

const deleteCategory = async (id) => {
  const result = await categoryRepository.remove(id);

  if (!result) {
    throw new Error("Không tìm thấy danh mục");
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