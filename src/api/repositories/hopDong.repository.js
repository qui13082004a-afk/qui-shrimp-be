const {
  HopDong,
  HoSoKhachHang,
  NguoiDung,
  AoNuoi,
  VuNuoi,
  ChinhSachHanMuc,
} = require("../models");

const create = async (data, transaction = null) => {
  return await HopDong.create(data, { transaction });
};

const findById = async (id_hop_dong) => {
  return await HopDong.findByPk(id_hop_dong, {
    include: [
      {
        model: HoSoKhachHang,
        include: [
          { model: NguoiDung, attributes: ["id_nguoi_dung", "ho_ten", "email", "so_dien_thoai"] },
          { model: AoNuoi },
          { model: VuNuoi },
          { model: ChinhSachHanMuc },
        ],
      },
    ],
  });
};

const findByProfileId = async (id_ho_so) => {
  return await HopDong.findOne({
    where: { id_ho_so },
    include: [
      {
        model: HoSoKhachHang,
        include: [
          { model: NguoiDung, attributes: ["id_nguoi_dung", "ho_ten", "email", "so_dien_thoai"] },
          { model: AoNuoi },
          { model: VuNuoi },
          { model: ChinhSachHanMuc },
        ],
      },
    ],
  });
};

const findAll = async () => {
  return await HopDong.findAll({
    include: [
      {
        model: HoSoKhachHang,
        include: [
          { model: NguoiDung, attributes: ["id_nguoi_dung", "ho_ten", "email", "so_dien_thoai"] },
          { model: AoNuoi },
          { model: VuNuoi },
          { model: ChinhSachHanMuc },
        ],
      },
    ],
    order: [["ngay_tao", "DESC"]],
  });
};

const findByUserId = async (id_nguoi_dung) => {
  return await HopDong.findAll({
    include: [
      {
        model: HoSoKhachHang,
        where: { id_nguoi_dung },
        include: [{ model: AoNuoi }, { model: VuNuoi }, { model: ChinhSachHanMuc }],
      },
    ],
    order: [["ngay_tao", "DESC"]],
  });
};

const update = async (id_hop_dong, data, transaction = null) => {
  const contract = await HopDong.findByPk(id_hop_dong, { transaction });
  if (!contract) return null;

  await contract.update(data, { transaction });
  return contract;
};

module.exports = {
  create,
  findById,
  findByProfileId,
  findAll,
  findByUserId,
  update,
};
