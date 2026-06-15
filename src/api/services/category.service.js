const { categoryRepository } = require("../repositories");

const createCategory = async (data) => {
  const { ten_danh_muc, mo_ta } = data;

  if (!ten_danh_muc) {
    throw new Error("Tên danh mục không được để trống");
  }

  const category = await categoryRepository.create({
    ten_danh_muc,
    mo_ta,
    trang_thai: "hoat_dong",
  });

  return category;
};

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
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};