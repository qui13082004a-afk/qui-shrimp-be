const { ChinhSachHanMuc, NguoiDung } = require("../models");

const create = async (data) => {
  return await ChinhSachHanMuc.create(data);
};

const findAll = async () => {
  return await ChinhSachHanMuc.findAll({
    include: [
      {
        model: NguoiDung,
        as: "admin_cap_nhat",
        attributes: ["id_nguoi_dung", "ho_ten", "email"],
      },
    ],
    order: [["ngay_tao", "DESC"]],
  });
};

const findActive = async () => {
  return await ChinhSachHanMuc.findAll({
    where: { trang_thai: "hoat_dong" },
    order: [
      ["tu_ngay", "ASC"],
      ["den_ngay", "ASC"],
    ],
  });
};

const findById = async (id_chinh_sach) => {
  return await ChinhSachHanMuc.findByPk(id_chinh_sach, {
    include: [
      {
        model: NguoiDung,
        as: "admin_cap_nhat",
        attributes: ["id_nguoi_dung", "ho_ten", "email"],
      },
    ],
  });
};

const update = async (id_chinh_sach, data) => {
  const policy = await ChinhSachHanMuc.findByPk(id_chinh_sach);
  if (!policy) return null;

  await policy.update(data);
  return policy;
};

const findByStage = async (giai_doan) => {
  return await ChinhSachHanMuc.findOne({
    where: {
      giai_doan,
      trang_thai: "hoat_dong",
    },
  });
};

module.exports = {
  create,
  findAll,
  findActive,
  findById,
  update,
  findByStage,
};