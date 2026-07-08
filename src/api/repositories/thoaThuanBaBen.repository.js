const {
  ThoaThuanBaBen,
  HoSoKhachHang,
  ThuongLai,
  NguoiDung,
  AoNuoi,
  VuNuoi,
} = require("../models");

const includeFull = [
  {
    model: HoSoKhachHang,
    include: [
      { model: NguoiDung },
      { model: AoNuoi },
      { model: VuNuoi },
    ],
  },
  { model: ThuongLai, required: false },
  {
    model: NguoiDung,
    as: "admin_yeu_cau_thoa_thuan",
    attributes: ["id_nguoi_dung", "ho_ten", "email"],
  },
  {
    model: NguoiDung,
    as: "nhan_vien_phu_trach_thoa_thuan",
    attributes: ["id_nguoi_dung", "ho_ten", "email"],
  },
  {
    model: NguoiDung,
    as: "nhan_vien_upload_thoa_thuan",
    attributes: ["id_nguoi_dung", "ho_ten", "email"],
  },
  {
    model: NguoiDung,
    as: "admin_xac_nhan_thoa_thuan",
    attributes: ["id_nguoi_dung", "ho_ten", "email"],
  },
];

const create = async (data, transaction = null) => {
  return await ThoaThuanBaBen.create(data, { transaction });
};

const findById = async (id_thoa_thuan, transaction = null) => {
  return await ThoaThuanBaBen.findByPk(id_thoa_thuan, {
    include: includeFull,
    transaction,
  });
};

const findAll = async () => {
  return await ThoaThuanBaBen.findAll({
    include: includeFull,
    order: [["ngay_yeu_cau", "DESC"]],
  });
};

const findByProfileId = async (id_ho_so) => {
  return await ThoaThuanBaBen.findAll({
    where: { id_ho_so },
    include: includeFull,
    order: [["ngay_yeu_cau", "DESC"]],
  });
};

const findByStaffId = async (id_nhan_vien_phu_trach) => {
  return await ThoaThuanBaBen.findAll({
    where: { id_nhan_vien_phu_trach },
    include: includeFull,
    order: [["ngay_yeu_cau", "DESC"]],
  });
};

const findActiveByProfileId = async (id_ho_so) => {
  return await ThoaThuanBaBen.findOne({
    where: {
      id_ho_so,
      trang_thai: "da_hieu_luc",
    },
  });
};

const update = async (id_thoa_thuan, data, transaction = null) => {
  const agreement = await ThoaThuanBaBen.findByPk(id_thoa_thuan, {
    transaction,
  });

  if (!agreement) return null;

  await agreement.update(data, { transaction });
  return agreement;
};

module.exports = {
  create,
  findById,
  findAll,
  findByProfileId,
  findByStaffId,
  findActiveByProfileId,
  update,
};