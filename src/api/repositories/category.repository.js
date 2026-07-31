const { DanhMuc, SanPham } = require("../models");
/**
 * Tạo mới danh mục vật tư
 */
const create = async (data) => {
  return await DanhMuc.create(data);
};

/**
 * Khách hàng: Lấy danh sách danh mục đang hoạt động
 */
const findAllActive = async () => {
  const danhMuc = await DanhMuc.findAll({
    where: {
      trang_thai: "hoat_dong",
    },
  });
const danhMucCoSoLuong = await Promise.all(
    danhMuc.map(async (item) => {
      const so_luong_san_pham = await SanPham.count({
        where: {
          id_danh_muc: item.id_danh_muc,
        },
      });

      return {
        ...item.toJSON(),
        so_luong_san_pham,
      };
    })
  );
  return danhMucCoSoLuong;
};

/**
 * Admin: Lấy toàn bộ danh mục hệ thống
 */
const findAll = async () => {
  return await DanhMuc.findAll();
};

/**
 * Tìm kiếm danh mục theo ID khóa chính
 */
const findById = async (id) => {
  const danhMuc = await DanhMuc.findByPk(id);

  if (!danhMuc) {
    return null;
  }

  const so_luong_san_pham = await SanPham.count({
    where: {
      id_danh_muc: id,
    },
  });

  return {
    ...danhMuc.toJSON(),
    so_luong_san_pham,
  };
};

const findByName = async (ten_danh_muc) => {
  return await DanhMuc.findOne({
    where: {
      ten_danh_muc: ten_danh_muc,
    },
  });
};

/**
 * Cập nhật thông tin danh mục vật tư
 */
const update = async (id, data) => {
  const danhMuc = await DanhMuc.findByPk(id);

  if (!danhMuc) {
    return null;
  }

  await danhMuc.update(data);

  return danhMuc;
};

/**
 * Xóa danh mục ra khỏi hệ thống
 */
const remove = async (id) => {
  const danhMuc = await DanhMuc.findByPk(id);

  if (!danhMuc) {
    return null;
  }

  await danhMuc.destroy();

  return true;
};

module.exports = {
  
  create,
  findAllActive,
  findAll,
  findById,
  findByName, 
  update,
  remove,
};