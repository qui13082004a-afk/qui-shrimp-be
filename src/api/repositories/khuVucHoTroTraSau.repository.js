const { Op } = require("sequelize");
const { KhuVucHoTroTraSau } = require("../models");

const normalizeAddress = (value) => {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ");
};

const create = async (data, transaction = null) => {
  return await KhuVucHoTroTraSau.create(data, {
    transaction,
  });
};

const findById = async (id_khu_vuc, transaction = null) => {
  return await KhuVucHoTroTraSau.findByPk(id_khu_vuc, {
    transaction,
  });
};

const findAll = async () => {
  return await KhuVucHoTroTraSau.findAll({
    order: [
      ["tinh_thanh", "ASC"],
      ["quan_huyen", "ASC"],
      ["phuong_xa", "ASC"],
    ],
  });
};

const findActiveByAddress = async ({
  tinh_thanh,
  quan_huyen,
  phuong_xa,
}) => {
  const tinh = normalizeAddress(tinh_thanh);
  const huyen = normalizeAddress(quan_huyen);
  const xa = normalizeAddress(phuong_xa);

  if (!tinh || !huyen) {
    return null;
  }

  return await KhuVucHoTroTraSau.findOne({
    where: {
      trang_thai: "hoat_dong",

      tinh_thanh: {
        [Op.like]: tinh,
      },

      quan_huyen: {
        [Op.like]: huyen,
      },

      [Op.or]: [
        {
          phuong_xa: null,
        },
        {
          phuong_xa: "",
        },
        {
          phuong_xa: {
            [Op.like]: xa,
          },
        },
      ],
    },
    order: [
      [
        KhuVucHoTroTraSau.sequelize.literal(
          "CASE WHEN phuong_xa IS NULL OR phuong_xa = '' THEN 1 ELSE 0 END"
        ),
        "ASC",
      ],
    ],
  });
};

const update = async (
  id_khu_vuc,
  data,
  transaction = null
) => {
  const area = await KhuVucHoTroTraSau.findByPk(id_khu_vuc, {
    transaction,
  });

  if (!area) {
    return null;
  }

  await area.update(data, {
    transaction,
  });

  return area;
};

const remove = async (id_khu_vuc, transaction = null) => {
  const area = await KhuVucHoTroTraSau.findByPk(id_khu_vuc, {
    transaction,
  });

  if (!area) {
    return false;
  }

  await area.destroy({
    transaction,
  });

  return true;
};

module.exports = {
  create,
  findById,
  findAll,
  findActiveByAddress,
  update,
  remove,
};