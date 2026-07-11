const { Op, fn, col, where } = require("sequelize");
const { KhuVucHoTroTraSau } = require("../models");

const normalizeText = (value) => {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ");
};

const create = async (data, transaction = null) => {
  return await KhuVucHoTroTraSau.create(data, {
    transaction,
  });
};

const findAll = async () => {
  return await KhuVucHoTroTraSau.findAll({
    order: [
      ["trang_thai", "ASC"],
      ["tinh_thanh", "ASC"],
      ["quan_huyen", "ASC"],
      ["phuong_xa", "ASC"],
    ],
  });
};

const findById = async (
  id_khu_vuc,
  transaction = null
) => {
  return await KhuVucHoTroTraSau.findByPk(
    id_khu_vuc,
    {
      transaction,
    }
  );
};

/**
 * Tìm chính xác một khu vực, dùng khi Admin thêm mới
 * để tránh tạo dữ liệu trùng.
 */
const findExactArea = async ({
  tinh_thanh,
  quan_huyen,
  phuong_xa,
}) => {
  const tinhThanh = normalizeText(tinh_thanh);
  const quanHuyen = normalizeText(quan_huyen);
  const phuongXa = normalizeText(phuong_xa);

  if (!tinhThanh || !quanHuyen) {
    return null;
  }

  const conditions = [
    where(
      fn("LOWER", col("tinh_thanh")),
      tinhThanh.toLowerCase()
    ),

    where(
      fn("LOWER", col("quan_huyen")),
      quanHuyen.toLowerCase()
    ),
  ];

  if (phuongXa) {
    conditions.push(
      where(
        fn("LOWER", col("phuong_xa")),
        phuongXa.toLowerCase()
      )
    );
  } else {
    conditions.push({
      [Op.or]: [
        { phuong_xa: null },
        { phuong_xa: "" },
      ],
    });
  }

  return await KhuVucHoTroTraSau.findOne({
    where: {
      [Op.and]: conditions,
    },
  });
};

/**
 * Kiểm tra địa chỉ ao có nằm trong vùng hỗ trợ hay không.
 *
 * Được hỗ trợ khi:
 * - Tỉnh/thành khớp
 * - Quận/huyện khớp
 * - Khu vực đang hoạt động
 * - Xã khớp, hoặc phuong_xa = NULL để hỗ trợ toàn huyện
 */
const findSupportedArea = async ({
  tinh_thanh,
  quan_huyen,
  phuong_xa,
}) => {
  const tinhThanh = normalizeText(tinh_thanh);
  const quanHuyen = normalizeText(quan_huyen);
  const phuongXa = normalizeText(phuong_xa);

  if (!tinhThanh || !quanHuyen) {
    return null;
  }

  const conditions = [
    {
      trang_thai: "hoat_dong",
    },

    where(
      fn("LOWER", col("tinh_thanh")),
      tinhThanh.toLowerCase()
    ),

    where(
      fn("LOWER", col("quan_huyen")),
      quanHuyen.toLowerCase()
    ),
  ];

  if (phuongXa) {
    conditions.push({
      [Op.or]: [
        { phuong_xa: null },
        { phuong_xa: "" },

        where(
          fn("LOWER", col("phuong_xa")),
          phuongXa.toLowerCase()
        ),
      ],
    });
  } else {
    conditions.push({
      [Op.or]: [
        { phuong_xa: null },
        { phuong_xa: "" },
      ],
    });
  }

  return await KhuVucHoTroTraSau.findOne({
    where: {
      [Op.and]: conditions,
    },

    // Ưu tiên khu vực theo xã trước khu vực toàn huyện
    order: [
      [
        KhuVucHoTroTraSau.sequelize.literal(`
          CASE
            WHEN phuong_xa IS NULL OR phuong_xa = ''
            THEN 1
            ELSE 0
          END
        `),
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
  const area = await KhuVucHoTroTraSau.findByPk(
    id_khu_vuc,
    {
      transaction,
    }
  );

  if (!area) {
    return null;
  }

  await area.update(data, {
    transaction,
  });

  return area;
};

const remove = async (
  id_khu_vuc,
  transaction = null
) => {
  const area = await KhuVucHoTroTraSau.findByPk(
    id_khu_vuc,
    {
      transaction,
    }
  );

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
  findAll,
  findById,
  findExactArea,
  findSupportedArea,
  update,
  remove,
};