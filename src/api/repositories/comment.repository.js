const { BinhLuan, NguoiDung, BaiViet } = require("../models");

const userInclude = {
  model: NguoiDung,
  attributes: ["id_nguoi_dung", "ho_ten", "anh_dai_dien", "vai_tro"],
};

const create = (data) => BinhLuan.create(data);

const findVisibleByBlog = (id_bai_viet) =>
  BinhLuan.findAll({
    where: {
      id_bai_viet,
      trang_thai: "hien",
    },
    include: [userInclude],
    order: [["ngay_binh_luan", "ASC"]],
  });

const findById = (id_binh_luan) =>
  BinhLuan.findByPk(id_binh_luan, {
    include: [userInclude, { model: BaiViet }],
  });

const update = (comment, data) => comment.update(data);
const remove = (comment) => comment.update({ trang_thai: "an" });

module.exports = {
  create,
  findVisibleByBlog,
  findById,
  update,
  remove,
};
