const {
  PhieuDeXuatHanMuc,
  HoSoKhachHang,
  NguoiDung,
  AoNuoi,
  VuNuoi,
  ChinhSachHanMuc,
} = require("../models");

const create = async (data, transaction = null) => {
  return await PhieuDeXuatHanMuc.create(data, { transaction });
};

const findById = async (id_phieu_de_xuat, transaction = null) => {
  return await PhieuDeXuatHanMuc.findByPk(id_phieu_de_xuat, {
    include: [
      {
        model: HoSoKhachHang,
        include: [
          { model: NguoiDung },
          { model: AoNuoi },
          { model: VuNuoi },
          { model: ChinhSachHanMuc },
        ],
      },
      {
        model: NguoiDung,
        as: "nhan_vien_de_xuat",
        attributes: ["id_nguoi_dung", "ho_ten", "email"],
      },
      {
        model: NguoiDung,
        as: "admin_duyet",
        attributes: ["id_nguoi_dung", "ho_ten", "email"],
      },
    ],
    transaction,
  });
};

const findAll = async () => {
  return await PhieuDeXuatHanMuc.findAll({
    include: [
      {
        model: HoSoKhachHang,
        include: [
          { model: NguoiDung },
          { model: AoNuoi },
          { model: VuNuoi },
          { model: ChinhSachHanMuc },
        ],
      },
      { model: ChinhSachHanMuc },
      {
        model: NguoiDung,
        as: "nhan_vien_de_xuat",
        attributes: ["id_nguoi_dung", "ho_ten", "email"],
      },
      {
        model: NguoiDung,
        as: "admin_duyet",
        attributes: ["id_nguoi_dung", "ho_ten", "email"],
      },
    ],
    order: [["ngay_de_xuat", "DESC"]],
  });
};

const findByProfileId = async (id_ho_so) => {
  return await PhieuDeXuatHanMuc.findAll({
    where: { id_ho_so },
    include: [
      {
        model: HoSoKhachHang,
        include: [
          { model: NguoiDung },
          { model: AoNuoi },
          { model: VuNuoi },
          { model: ChinhSachHanMuc },
        ],
      },
      { model: ChinhSachHanMuc },
      {
        model: NguoiDung,
        as: "nhan_vien_de_xuat",
        attributes: ["id_nguoi_dung", "ho_ten", "email"],
      },
      {
        model: NguoiDung,
        as: "admin_duyet",
        attributes: ["id_nguoi_dung", "ho_ten", "email"],
      },
    ],
    order: [["ngay_de_xuat", "DESC"]],
  });
};

const findPendingByProfileId = async (id_ho_so, transaction = null) => {
  return await PhieuDeXuatHanMuc.findOne({
    where: {
      id_ho_so,
      trang_thai: "cho_duyet",
    },
    transaction,
  });
};

const update = async (id_phieu_de_xuat, data, transaction = null) => {
  const proposal = await PhieuDeXuatHanMuc.findByPk(id_phieu_de_xuat, {
    transaction,
  });

  if (!proposal) return null;

  await proposal.update(data, {
    transaction,
  });

  return proposal;
};

module.exports = {
  create,
  findById,
  findAll,
  findByProfileId,
  findPendingByProfileId,
  update,
};
