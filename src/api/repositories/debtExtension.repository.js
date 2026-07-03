const {
  GiaHanThanhToan,
  HoSoKhachHang,
  NguoiDung,
  AoNuoi,
  VuNuoi,
} = require("../models");

const create = async (data) => {
  return await GiaHanThanhToan.create(data);
};

const findById = async (id_gia_han) => {
  return await GiaHanThanhToan.findByPk(id_gia_han, {
    include: [
      {
        model: HoSoKhachHang,
        include: [
          { model: NguoiDung },
          { model: AoNuoi },
          { model: VuNuoi },
        ],
      },
      {
        model: NguoiDung,
        as: "nguoi_gui",
        attributes: ["id_nguoi_dung", "ho_ten", "email", "so_dien_thoai"],
      },
      {
        model: NguoiDung,
        as: "nguoi_duyet",
        attributes: ["id_nguoi_dung", "ho_ten", "email"],
      },
    ],
  });
};

const findAll = async () => {
  return await GiaHanThanhToan.findAll({
    include: [
      {
        model: HoSoKhachHang,
        include: [
          { model: NguoiDung },
          { model: AoNuoi },
          { model: VuNuoi },
        ],
      },
      {
        model: NguoiDung,
        as: "nguoi_gui",
        attributes: ["id_nguoi_dung", "ho_ten", "email", "so_dien_thoai"],
      },
      {
        model: NguoiDung,
        as: "nguoi_duyet",
        attributes: ["id_nguoi_dung", "ho_ten", "email"],
      },
    ],
    order: [["ngay_gui", "DESC"]],
  });
};

const findByUserId = async (id_nguoi_gui) => {
  return await GiaHanThanhToan.findAll({
    where: { id_nguoi_gui },
    include: [
      {
        model: HoSoKhachHang,
        include: [{ model: AoNuoi }, { model: VuNuoi }],
      },
      {
        model: NguoiDung,
        as: "nguoi_duyet",
        attributes: ["id_nguoi_dung", "ho_ten", "email"],
      },
    ],
    order: [["ngay_gui", "DESC"]],
  });
};

const findPendingByProfileId = async (id_ho_so) => {
  return await GiaHanThanhToan.findOne({
    where: {
      id_ho_so,
      trang_thai: "cho_duyet",
    },
  });
};

const update = async (id_gia_han, data) => {
  const extension = await GiaHanThanhToan.findByPk(id_gia_han);

  if (!extension) return null;

  await extension.update(data);
  return extension;
};
const findLatestApprovedByProfileId = async (id_ho_so) => {
  return await GiaHanThanhToan.findOne({
    where: {
      id_ho_so,
      trang_thai: "da_duyet",
    },
    order: [["ngay_duyet", "DESC"]],
  });
};
module.exports = {
  create,
  findById,
  findAll,
  findByUserId,
  findPendingByProfileId,
  update,
  findLatestApprovedByProfileId
};