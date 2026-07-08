const { Op, fn, col, literal } = require("sequelize");
const { BaiViet, BinhLuan, NguoiDung } = require("../models");

const authorAttributes = [
  "id_nguoi_dung",
  "ho_ten",
  "email",
  "anh_dai_dien",
  "vai_tro",
];

const blogInclude = [
  {
    model: NguoiDung,
    attributes: authorAttributes,
  },
];

const countLiterals = {
  tong_binh_luan: literal(`(
    SELECT COUNT(*)
    FROM binh_luan AS bl
    WHERE bl.id_bai_viet = BaiViet.id_bai_viet
      AND bl.trang_thai = 'hien'
  )`),
};

const create = (data) => BaiViet.create(data);

const findPublic = ({ keyword, page, limit, sort }) => {
  const offset = (page - 1) * limit;
  const where = { trang_thai: "da_dang" };

  if (keyword) {
    where[Op.or] = [
      { tieu_de: { [Op.like]: `%${keyword}%` } },
      { tom_tat: { [Op.like]: `%${keyword}%` } },
      { noi_dung: { [Op.like]: `%${keyword}%` } },
    ];
  }
  return BaiViet.findAndCountAll({
    where,
    include: blogInclude,
    attributes: {
      include: [
        [countLiterals.tong_binh_luan, "tong_binh_luan"],
      ],
    },
    limit,
    offset,
    distinct: true,
  });
};

const findById = (id_bai_viet) =>
  BaiViet.findByPk(id_bai_viet, {
    include: blogInclude,
    attributes: {
      include: [
        [countLiterals.tong_binh_luan, "tong_binh_luan"],
      ],
    },
  });

const findByIdWithOwner = (id_bai_viet, id_nguoi_dung) =>
  BaiViet.findOne({ where: { id_bai_viet, id_nguoi_dung } });

const findMine = ({ id_nguoi_dung, trang_thai, page, limit }) => {
  const offset = (page - 1) * limit;
  const where = { id_nguoi_dung };

  if (trang_thai && trang_thai !== "tat_ca") {
    where.trang_thai = trang_thai;
  }

  return BaiViet.findAndCountAll({
    where,
    attributes: {
      include: [
        [countLiterals.tong_binh_luan, "tong_binh_luan"],
      ],
    },
    order: [["ngay_dang", "DESC"]],
    limit,
    offset,
  });
};

const findAdmin = ({ trang_thai, keyword, page, limit }) => {
  const offset = (page - 1) * limit;
  const where = {};

  if (trang_thai && trang_thai !== "tat_ca") {
    where.trang_thai = trang_thai;
  }

  if (keyword) {
    where[Op.or] = [
      { tieu_de: { [Op.like]: `%${keyword}%` } },
      { noi_dung: { [Op.like]: `%${keyword}%` } },
    ];
  }

  return BaiViet.findAndCountAll({
    where,
    include: blogInclude,
    attributes: {
      include: [
        [countLiterals.tong_binh_luan, "tong_binh_luan"],
      ],
    },
    order: [["ngay_dang", "DESC"]],
    limit,
    offset,
    distinct: true,
  });
};

const update = (blog, data) => blog.update(data);
const remove = (blog) => blog.destroy();

module.exports = {
  create,
  findPublic,
  findById,
  findByIdWithOwner,
  findMine,
  findAdmin,
  update,
  remove,
};
