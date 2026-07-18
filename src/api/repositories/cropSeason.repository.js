const {
  VuNuoi,
  AoNuoi,
  DonHang,
  ChiTietDonHang,
  SanPham,
} = require("../models");
const { Op } = require("sequelize");
const create = async (data) => {
  return await VuNuoi.create(data);
};

const findById = async (id_vu_nuoi) => {
  return await VuNuoi.findByPk(id_vu_nuoi, {
    include: [{ model: AoNuoi }],
  });
};

const findByPondId = async (id_ao, transaction = null) => {
  return await VuNuoi.findAll({
    where: { id_ao },
    transaction,
    order: [["id_vu_nuoi", "DESC"]],
  });
};

const countOrdersByPondId = async (id_ao, transaction = null) => {
  const cropSeasons = await findByPondId(id_ao, transaction);
  const cropSeasonIds = cropSeasons.map((season) => season.id_vu_nuoi);

  if (!cropSeasonIds.length) return 0;

  return await DonHang.count({
    where: {
      id_vu_nuoi: {
        [Op.in]: cropSeasonIds,
      },
    },
    transaction,
  });
};

const removeByPondId = async (id_ao, transaction = null) => {
  return await VuNuoi.destroy({
    where: { id_ao },
    transaction,
  });
};

const findActiveByPondId = async (id_ao) => {
  return await VuNuoi.findOne({
    where: {
      id_ao,
      trang_thai: "dang_nuoi",
    },
  });
};

const update = async (id_vu_nuoi, data) => {
  const cropSeason = await VuNuoi.findByPk(id_vu_nuoi);
  if (!cropSeason) return null;

  await cropSeason.update(data);
  return cropSeason;
};

const remove = async (id_vu_nuoi) => {
  const cropSeason = await VuNuoi.findByPk(id_vu_nuoi);
  if (!cropSeason) return null;

  await cropSeason.destroy();
  return cropSeason;
};

const getSeasonOrderSummary = async (id_nguoi_dung, id_vu_nuoi) => {
  const season = await VuNuoi.findOne({
    where: { id_vu_nuoi },
    include: [
      {
        model: AoNuoi,
        required: true,
        where: { id_nguoi_dung },
        attributes: ["id_ao", "ten_ao", "dien_tich", "dia_chi_ao"],
      },
      {
        model: DonHang,
        required: false,
        where: { id_nguoi_dung },
        attributes: [
          "id_don_hang",
          "tong_tien",
          "phi_van_chuyen",
          "tong_thanh_toan",
          "hinh_thuc_thanh_toan",
          "trang_thai_don_hang",
          "ngay_dat",
          "ghi_chu",
        ],
        include: [
          {
            model: ChiTietDonHang,
            required: false,
            attributes: [
              "id_chi_tiet",
              "id_san_pham",
              "gia_ban",
              "so_luong_dat",
              "thanh_tien",
              "trang_thai_san_pham",
            ],
            include: [
              {
                model: SanPham,
                required: false,
                attributes: ["id_san_pham", "ten_san_pham", "hinh_anh", "don_vi_tinh"],
              },
            ],
          },
        ],
      },
    ],
    order: [[DonHang, "ngay_dat", "DESC"]],
  });

  return season;
};

module.exports = {
  create,
  findById,
  findByPondId,
  countOrdersByPondId,
  removeByPondId,
  findActiveByPondId,
  update,
  remove,
  getSeasonOrderSummary,
};
