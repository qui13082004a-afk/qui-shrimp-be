const { ThongBao, NguoiDung } = require("../models");

const create = (data, options = {}) => {
  return ThongBao.create(data, options);
};

const findByUserId = (id_nguoi_dung) => {
  return ThongBao.findAll({
    where: { id_nguoi_dung },
    order: [["ngay_tao", "DESC"]],
    limit: 20,
  });
};

const countUnread = (id_nguoi_dung) => {
  return ThongBao.count({
    where: {
      id_nguoi_dung,
      da_doc: false,
    },
  });
};

const markAsRead = (id_thong_bao, id_nguoi_dung) => {
  return ThongBao.update(
    { da_doc: true },
    {
      where: {
        id_thong_bao,
        id_nguoi_dung,
      },
    }
  );
};

const markAllAsRead = (id_nguoi_dung) => {
  return ThongBao.update(
    { da_doc: true },
    {
      where: {
        id_nguoi_dung,
        da_doc: false,
      },
    }
  );
};

const findUsersByRole = (vai_tro) => {
  return NguoiDung.findAll({
    where: {
      vai_tro,
      trang_thai_tai_khoan: "hoat_dong",
    },
    attributes: ["id_nguoi_dung", "ho_ten", "email", "vai_tro"],
  });
};

module.exports = {
  create,
  findByUserId,
  countUnread,
  markAsRead,
  markAllAsRead,
  findUsersByRole,
};
