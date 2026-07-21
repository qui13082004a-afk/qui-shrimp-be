const { KhuVucKinhDoanh, TinhThanh } = require("../models");
const { Op } = require("sequelize");

const findAll = async () => {
  return await KhuVucKinhDoanh.findAll({
    include: [{ model: TinhThanh }],
    order: [[TinhThanh, "ten_tinh", "ASC"]],
  });
};

const findById = async (id_khu_vuc, transaction = null) => {
  return await KhuVucKinhDoanh.findByPk(id_khu_vuc, {
    include: [{ model: TinhThanh }],
    transaction,
  });
};

const findByProvinceId = async (id_tinh_thanh, transaction = null) => {
  return await KhuVucKinhDoanh.findOne({
    where: { id_tinh_thanh },
    include: [{ model: TinhThanh }],
    transaction,
  });
};

const findByProvinceCode = async (ma_tinh, transaction = null) => {
  const normalizedCode = String(ma_tinh || "").replace(/^0+/, "") || "0";
  const provinceCodes = [
    String(ma_tinh),
    normalizedCode,
    normalizedCode.padStart(2, "0"),
    normalizedCode.padStart(3, "0"),
  ];

  const province = await TinhThanh.findOne({
    where: { ma_tinh: { [Op.in]: provinceCodes } },
    transaction,
  });

  const provinceIds = [
    province?.id_tinh_thanh,
    Number(normalizedCode),
  ].filter((value) => Number.isFinite(Number(value)));

  if (provinceIds.length === 0) return null;

  return await KhuVucKinhDoanh.findOne({
    where: { id_tinh_thanh: { [Op.in]: provinceIds } },
    include: [{ model: TinhThanh, required: false }],
    transaction,
  });
};

const findByProvinceName = async (ten_tinh, transaction = null) => {
  const provinceName = String(ten_tinh || "").trim();
  if (!provinceName) return null;

  const provinces = await TinhThanh.findAll({
    where: {
      ten_tinh: {
        [Op.like]: `%${provinceName}%`,
      },
    },
    transaction,
  });

  const provinceIds = provinces
    .map((province) => province.id_tinh_thanh)
    .filter((value) => Number.isFinite(Number(value)));

  if (provinceIds.length === 0) return null;

  return await KhuVucKinhDoanh.findOne({
    where: { id_tinh_thanh: { [Op.in]: provinceIds } },
    include: [{ model: TinhThanh, required: false }],
    transaction,
  });
};

const create = async (data, transaction = null) => {
  return await KhuVucKinhDoanh.create(data, { transaction });
};

const update = async (id_khu_vuc, data, transaction = null) => {
  const area = await KhuVucKinhDoanh.findByPk(id_khu_vuc, { transaction });
  if (!area) return null;
  await area.update(data, { transaction });
  return await findById(id_khu_vuc, transaction);
};

module.exports = {
  findAll,
  findById,
  findByProvinceId,
  findByProvinceCode,
  findByProvinceName,
  create,
  update,
};
