const { Op } = require("sequelize");
const {
  DonHang,
  ThanhToan,
  VuNuoi,
  AoNuoi,
  HoSoKhachHang,
} = require("../models");

const getMyDebtOrders = async (id_nguoi_dung) => {
  const orders = await DonHang.findAll({
    where: {
      id_nguoi_dung,
      hinh_thuc_thanh_toan: "tra_sau",
      trang_thai_don_hang: {
        [Op.notIn]: ["da_huy", "giao_that_bai"],
      },
    },
    include: [
      {
        model: VuNuoi,
        required: false,
        include: [
          {
            model: AoNuoi,
            required: false,
          },
          {
            model: HoSoKhachHang,
            required: false,
          },
        ],
      },
      {
        model: ThanhToan,
        required: false,
      },
    ],
    order: [["ngay_dat", "DESC"]],
  });

  return orders.map((order) => {
    const plain = order.toJSON();

    const da_thanh_toan = (plain.ThanhToans || [])
      .filter((p) => p.trang_thai === "thanh_cong")
      .reduce((sum, p) => sum + Number(p.so_tien || 0), 0);

    const tong_tien = Number(plain.tong_thanh_toan || 0);
    const con_lai = Math.max(tong_tien - da_thanh_toan, 0);

    const hoSo = plain.VuNuoi?.HoSoKhachHang || null;
    const ao = plain.VuNuoi?.AoNuoi || null;

    const han_thanh_toan = hoSo?.han_thanh_toan || null;

    let trang_thai_cong_no = "trong_han";

    if (con_lai <= 0) {
      trang_thai_cong_no = "da_thanh_toan";
    } else if (han_thanh_toan) {
      const today = new Date();
      const dueDate = new Date(han_thanh_toan);

      today.setHours(0, 0, 0, 0);
      dueDate.setHours(0, 0, 0, 0);

      const diffDays = Math.ceil(
        (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays < 0) {
        trang_thai_cong_no = "qua_han";
      } else if (diffDays <= 7) {
        trang_thai_cong_no = "gan_den_han";
      }
    }

    return {
      id_don_hang: plain.id_don_hang,
      id_vu_nuoi: plain.id_vu_nuoi,
      ten_vu_nuoi: plain.VuNuoi?.ten_vu_nuoi || null,
      id_ao: ao?.id_ao || null,
      ten_ao: ao?.ten_ao || null,

      ngay_dat: plain.ngay_dat,
      han_thanh_toan,

      tong_tien,
      da_thanh_toan,
      con_lai,

      trang_thai_don_hang: plain.trang_thai_don_hang,
      trang_thai_cong_no,
    };
  });
};

const getMyDebtSummary = async (id_nguoi_dung) => {
  const profiles = await HoSoKhachHang.findAll({
    where: {
      id_nguoi_dung,
      duoc_phep_tra_sau: true,
      trang_thai_xac_thuc: "da_xac_thuc",
    },
  });

  const debtOrders = await getMyDebtOrders(id_nguoi_dung);

  const tong_han_muc = profiles.reduce(
    (sum, item) => sum + Number(item.dinh_muc_cong_no || 0),
    0
  );

  const tong_gia_tri_mua_tra_sau = debtOrders.reduce(
    (sum, item) => sum + Number(item.tong_tien || 0),
    0
  );

  const da_thanh_toan = debtOrders.reduce(
    (sum, item) => sum + Number(item.da_thanh_toan || 0),
    0
  );

  const tong_cong_no = debtOrders.reduce(
    (sum, item) => sum + Number(item.con_lai || 0),
    0
  );

  const con_lai = Math.max(tong_han_muc - tong_cong_no, 0);

  const han_gan_nhat =
    debtOrders
      .filter((item) => item.con_lai > 0 && item.han_thanh_toan)
      .sort(
        (a, b) =>
          new Date(a.han_thanh_toan).getTime() -
          new Date(b.han_thanh_toan).getTime()
      )[0]?.han_thanh_toan || null;

  return {
    tong_han_muc,
    tong_gia_tri_mua_tra_sau,
    da_thanh_toan,
    tong_cong_no,
    con_lai,
    han_gan_nhat,
    so_ho_so_duoc_duyet: profiles.length,
    so_don_tra_sau: debtOrders.length,
  };
};

module.exports = {
  getMyDebtOrders,
  getMyDebtSummary,
};