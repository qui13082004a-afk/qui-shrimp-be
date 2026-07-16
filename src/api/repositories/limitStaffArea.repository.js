const {
  NhanVienDinhMucKhuVuc,
  NguoiDung,
  KhuVucHoTroTraSau,
} = require("../models");
const { fn, col, where } = require("sequelize");

const normalizeText = (value) => String(value || "").trim().replace(/\s+/g, " ");

const findAll = () => {
  return NhanVienDinhMucKhuVuc.findAll({
    include: [
      {
        model: NguoiDung,
        attributes: ["id_nguoi_dung", "ho_ten", "email", "so_dien_thoai", "vai_tro"],
      },
      { model: KhuVucHoTroTraSau },
    ],
    order: [["id_phan_cong", "DESC"]],
  });
};

const findByStaffAndArea = (id_nguoi_dung, id_khu_vuc, transaction = null) => {
  return NhanVienDinhMucKhuVuc.findOne({
    where: { id_nguoi_dung, id_khu_vuc },
    transaction,
  });
};

const findActiveStaffByArea = (id_khu_vuc) => {
  return NhanVienDinhMucKhuVuc.findAll({
    where: {
      id_khu_vuc,
      trang_thai: "dang_phu_trach",
    },
    include: [
      {
        model: NguoiDung,
        attributes: ["id_nguoi_dung", "ho_ten", "email", "so_dien_thoai", "vai_tro"],
        where: {
          vai_tro: "nhan_vien_dinh_muc",
          trang_thai_tai_khoan: "hoat_dong",
        },
      },
    ],
  });
};

const findActiveStaffByProvince = (tinh_thanh) => {
  const provinceName = normalizeText(tinh_thanh);

  if (!provinceName) return [];

  return NhanVienDinhMucKhuVuc.findAll({
    where: {
      trang_thai: "dang_phu_trach",
    },
    include: [
      {
        model: NguoiDung,
        attributes: ["id_nguoi_dung", "ho_ten", "email", "so_dien_thoai", "vai_tro"],
        where: {
          vai_tro: "nhan_vien_dinh_muc",
          trang_thai_tai_khoan: "hoat_dong",
        },
      },
      {
        model: KhuVucHoTroTraSau,
        where: where(
          fn("LOWER", col("KhuVucHoTroTraSau.tinh_thanh")),
          provinceName.toLowerCase()
        ),
      },
    ],
  });
};

const upsert = async (data, transaction = null) => {
  const existed = await findByStaffAndArea(
    data.id_nguoi_dung,
    data.id_khu_vuc,
    transaction
  );

  if (existed) {
    await existed.update(
      {
        trang_thai: data.trang_thai,
        ghi_chu: data.ghi_chu,
      },
      { transaction }
    );
    return existed;
  }

  return NhanVienDinhMucKhuVuc.create(data, { transaction });
};

const update = async (id_phan_cong, data, transaction = null) => {
  const assignment = await NhanVienDinhMucKhuVuc.findByPk(id_phan_cong, {
    transaction,
  });
  if (!assignment) return null;

  await assignment.update(data, { transaction });
  return assignment;
};

module.exports = {
  findAll,
  findActiveStaffByArea,
  findActiveStaffByProvince,
  upsert,
  update,
};
