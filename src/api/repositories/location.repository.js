const { Op } = require("sequelize");
const { TinhThanh, PhuongXa } = require("../models");

const findAllProvinces = async () => {
  return await TinhThanh.findAll({
    order: [["ten_tinh", "ASC"]],
  });
};

const findProvinceById = async (id_tinh_thanh, transaction = null) => {
  return await TinhThanh.findByPk(id_tinh_thanh, { transaction });
};

const findProvinceByCode = async (ma_tinh, transaction = null) => {
  return await TinhThanh.findOne({
    where: { ma_tinh },
    transaction,
  });
};

const findProvincesByCodes = async (provinceCodes) => {
  return await TinhThanh.findAll({
    where: {
      ma_tinh: {
        [Op.in]: provinceCodes,
      },
    },
  });
};

const upsertProvince = async (data, transaction = null) => {
  const existed = await findProvinceByCode(data.ma_tinh, transaction);
  if (existed) {
    await existed.update(data, { transaction });
    return existed;
  }
  return await TinhThanh.create(data, { transaction });
};

const bulkUpsertProvinces = async (items) => {
  return await TinhThanh.bulkCreate(items, {
    updateOnDuplicate: ["ten_tinh", "ngay_cap_nhat"],
  });
};

const findWardsByProvinceId = async (id_tinh_thanh) => {
  return await PhuongXa.findAll({
    where: { id_tinh_thanh },
    order: [["ten_xa", "ASC"]],
  });
};

const findWardByCode = async (ma_xa, transaction = null) => {
  return await PhuongXa.findOne({
    where: { ma_xa },
    transaction,
  });
};

const countWardsByCodes = async (wardCodes) => {
  return await PhuongXa.count({
    where: {
      ma_xa: {
        [Op.in]: wardCodes,
      },
    },
  });
};

const upsertWard = async (data, transaction = null) => {
  const existed = await findWardByCode(data.ma_xa, transaction);
  if (existed) {
    await existed.update(data, { transaction });
    return existed;
  }
  return await PhuongXa.create(data, { transaction });
};

const bulkUpsertWards = async (items) => {
  return await PhuongXa.bulkCreate(items, {
    updateOnDuplicate: [
      "ten_xa",
      "cap_xa",
      "id_tinh_thanh",
      "vi_do_trung_tam",
      "kinh_do_trung_tam",
      "ngay_cap_nhat",
    ],
  });
};

module.exports = {
  findAllProvinces,
  findProvinceById,
  findProvinceByCode,
  findProvincesByCodes,
  upsertProvince,
  bulkUpsertProvinces,
  findWardsByProvinceId,
  findWardByCode,
  countWardsByCodes,
  upsertWard,
  bulkUpsertWards,
};
