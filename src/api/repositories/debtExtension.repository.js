const {
  GiaHanThanhToan,
  HoSoKhachHang,
  NguoiDung,
  AoNuoi,
  VuNuoi,
} = require("../models");

const create = async (data, options = {}) => {
  return await GiaHanThanhToan.create(data, options);
};

const findById = async (id_gia_han, options = {}) => {
  const { transaction = null, lock = null } = options;

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
    transaction,
    lock,
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

const update = async (id_gia_han, data, options = {}) => {
  const { transaction = null, lock = null } = options;
  const extension = await GiaHanThanhToan.findByPk(id_gia_han, {
    transaction,
    lock,
  });

  if (!extension) return null;

  await extension.update(data, {
    transaction,
  });
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

const findFirstApprovedByProfileId = async (id_ho_so) => {
  return await GiaHanThanhToan.findOne({
    where: {
      id_ho_so,
      trang_thai: "da_duyet",
    },
    order: [["ngay_duyet", "ASC"]],
  });
};

const findByProfileId = async (id_ho_so) => {
  return await GiaHanThanhToan.findAll({
    where: { id_ho_so },
    include: [
      {
        model: NguoiDung,
        as: "nguoi_gui",
        attributes: ["id_nguoi_dung", "ho_ten", "email"],
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
const countApprovedByProfileId = async (id_ho_so) => {
  return await GiaHanThanhToan.count({
    where: {
      id_ho_so,
      trang_thai: "da_duyet",
    },
  });
};
module.exports = {
  create,
  findById,
  findAll,
  findByUserId,
  findPendingByProfileId,
  update,
  findLatestApprovedByProfileId,
  findFirstApprovedByProfileId,
  findByProfileId,
  countApprovedByProfileId
};
