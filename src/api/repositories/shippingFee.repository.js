const { Op } = require("sequelize");
const { MucPhiVanChuyen, KhuVucKinhDoanh, TinhThanh } = require("../models");

const includeArea = [{ model: KhuVucKinhDoanh, include: [{ model: TinhThanh }] }];

const findAll = async (filters = {}) => {
  const where = {};
  if (filters.id_khu_vuc) where.id_khu_vuc = filters.id_khu_vuc;
  if (filters.dang_hoat_dong !== undefined) {
    where.dang_hoat_dong = filters.dang_hoat_dong;
  }

  return await MucPhiVanChuyen.findAll({
    where,
    include: includeArea,
    order: [
      ["id_khu_vuc", "ASC"],
      ["tu_km", "ASC"],
    ],
  });
};

const findById = async (id_muc_phi, transaction = null) => {
  return await MucPhiVanChuyen.findByPk(id_muc_phi, {
    include: includeArea,
    transaction,
  });
};

const findMatchedFee = async (id_khu_vuc, distanceKm) => {
  return await MucPhiVanChuyen.findOne({
    where: {
      id_khu_vuc,
      dang_hoat_dong: true,
      tu_km: { [Op.lte]: distanceKm },
      [Op.or]: [
        { den_km: null },
        { den_km: { [Op.gte]: distanceKm } },
      ],
    },
    order: [["tu_km", "DESC"]],
  });
};

const create = async (data, transaction = null) => {
  return await MucPhiVanChuyen.create(data, { transaction });
};

const update = async (id_muc_phi, data, transaction = null) => {
  const fee = await MucPhiVanChuyen.findByPk(id_muc_phi, { transaction });
  if (!fee) return null;
  await fee.update(data, { transaction });
  return await findById(id_muc_phi, transaction);
};

module.exports = {
  findAll,
  findById,
  findMatchedFee,
  create,
  update,
};
