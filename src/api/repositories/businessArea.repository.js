const { KhuVucKinhDoanh, TinhThanh } = require("../models");

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
  return await KhuVucKinhDoanh.findOne({
    include: [
      {
        model: TinhThanh,
        where: { ma_tinh: String(ma_tinh) },
      },
    ],
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
  create,
  update,
};
