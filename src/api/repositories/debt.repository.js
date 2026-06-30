const { Op } = require("sequelize");
const {
  DonHang,
  ThanhToan,
  VuNuoi,
  AoNuoi,
  HoSoKhachHang,
  GiaoHang,
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
          { model: AoNuoi, required: false },
          { model: HoSoKhachHang, required: false },
        ],
      },
      { model: ThanhToan, required: false },
      {
        model: GiaoHang,
        required: false,
      },
    ],
    order: [["ngay_dat", "DESC"]],
  });

  return orders.map((order) => {
    const plain = order.toJSON();

    const da_thanh_toan = (plain.ThanhToans || [])
      .filter(
        (payment) =>
          payment.trang_thai === "thanh_cong" &&
          payment.phuong_thuc === "tra_sau"
      )
      .reduce((sum, payment) => sum + Number(payment.so_tien || 0), 0);

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

      id_ho_so: hoSo?.id_ho_so || null,
      dinh_muc_cong_no: Number(hoSo?.dinh_muc_cong_no || 0),

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
    },
    include: [{ model: AoNuoi, required: false }],
  });

  const debtOrders = await getMyDebtOrders(id_nguoi_dung);

  const han_muc_theo_ho_so = profiles.map((profile) => {
    const plain = profile.toJSON();
    const dinh_muc = Number(plain.dinh_muc_cong_no || 0);

    const relatedOrders = debtOrders.filter(
      (order) => Number(order.id_ho_so) === Number(plain.id_ho_so)
    );

    const cong_no_hien_tai = relatedOrders
      .filter((order) => order.trang_thai_don_hang === "hoan_tat")
      .reduce((sum, order) => sum + Number(order.con_lai || 0), 0);

    const dang_giu_han_muc = relatedOrders
      .filter((order) =>
        ["cho_xu_ly", "cho_giao", "dang_giao"].includes(
          order.trang_thai_don_hang
        )
      )
      .reduce((sum, order) => sum + Number(order.con_lai || 0), 0);

    const da_thanh_toan_ho_so = relatedOrders.reduce(
      (sum, order) => sum + Number(order.da_thanh_toan || 0),
      0
    );

    const da_su_dung = cong_no_hien_tai + dang_giu_han_muc;
    const con_lai = Math.max(dinh_muc - da_su_dung, 0);

    return {
      id_ho_so: plain.id_ho_so,
      id_ao: plain.id_ao,
      id_vu_nuoi: plain.id_vu_nuoi,
      ten_ao: plain.AoNuoi?.ten_ao || `Ao #${plain.id_ao}`,
      dinh_muc_cong_no: dinh_muc,
      han_thanh_toan: plain.han_thanh_toan || null,

      cong_no_hien_tai,
      dang_giu_han_muc,
      da_su_dung,
      da_thanh_toan: da_thanh_toan_ho_so,
      con_lai,

      tong_cong_no: cong_no_hien_tai,
      phan_tram_su_dung:
        dinh_muc > 0 ? Math.min((da_su_dung / dinh_muc) * 100, 100) : 0,
    };
  });

  const tong_han_muc = han_muc_theo_ho_so.reduce(
    (sum, item) => sum + Number(item.dinh_muc_cong_no || 0),
    0
  );

  const tong_cong_no = han_muc_theo_ho_so.reduce(
    (sum, item) => sum + Number(item.cong_no_hien_tai || 0),
    0
  );

  const dang_giu_han_muc = han_muc_theo_ho_so.reduce(
    (sum, item) => sum + Number(item.dang_giu_han_muc || 0),
    0
  );

  const da_su_dung = tong_cong_no + dang_giu_han_muc;

  const da_thanh_toan = debtOrders.reduce(
    (sum, item) => sum + Number(item.da_thanh_toan || 0),
    0
  );

  const tong_gia_tri_mua_tra_sau = debtOrders.reduce(
    (sum, item) => sum + Number(item.tong_tien || 0),
    0
  );

  const con_lai = Math.max(tong_han_muc - da_su_dung, 0);

  const han_gan_nhat =
    debtOrders
      .filter(
        (item) =>
          item.con_lai > 0 &&
          item.trang_thai_don_hang === "hoan_tat" &&
          item.han_thanh_toan
      )
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
    cong_no_hien_tai: tong_cong_no,
    dang_giu_han_muc,
    da_su_dung,
    con_lai,
    han_gan_nhat,
    so_ho_so_duoc_duyet: profiles.length,
    so_don_tra_sau: debtOrders.length,
    han_muc_theo_ho_so,
  };
};
const getDebtProfileDetail = async (id_nguoi_dung, id_ho_so) => {
  const profile = await HoSoKhachHang.findOne({
    where: {
      id_ho_so,
      id_nguoi_dung,
      duoc_phep_tra_sau: true,
    },
    include: [
      { model: AoNuoi, required: false },
      { model: VuNuoi, required: false },
    ],
  });

  if (!profile) {
    throw new Error("Không tìm thấy hồ sơ công nợ hoặc bạn không có quyền truy cập");
  }

  const plain = profile.toJSON();
  const debtOrders = await getMyDebtOrders(id_nguoi_dung);

  const relatedOrders = debtOrders.filter(
    (order) => Number(order.id_ho_so) === Number(id_ho_so)
  );

  const cong_no_hien_tai = relatedOrders
    .filter((order) => order.trang_thai_don_hang === "hoan_tat")
    .reduce((sum, order) => sum + Number(order.con_lai || 0), 0);

  const dang_giu_han_muc = relatedOrders
    .filter((order) =>
      ["cho_xu_ly", "cho_giao", "dang_giao"].includes(order.trang_thai_don_hang)
    )
    .reduce((sum, order) => sum + Number(order.con_lai || 0), 0);

  const da_thanh_toan = relatedOrders.reduce(
    (sum, order) => sum + Number(order.da_thanh_toan || 0),
    0
  );

  const dinh_muc = Number(plain.dinh_muc_cong_no || 0);
  const da_su_dung = cong_no_hien_tai + dang_giu_han_muc;
  const con_lai = Math.max(dinh_muc - da_su_dung, 0);

  return {
    id_ho_so: plain.id_ho_so,
    id_nguoi_dung: plain.id_nguoi_dung,
    id_ao: plain.id_ao,
    id_vu_nuoi: plain.id_vu_nuoi,

    ten_ao: plain.AoNuoi?.ten_ao || `Ao #${plain.id_ao}`,
    dien_tich: plain.AoNuoi?.dien_tich || null,
    dia_chi_ao: plain.AoNuoi?.dia_chi_ao || null,
    loai_hinh_nuoi: plain.AoNuoi?.loai_hinh_nuoi || null,

    ten_vu_nuoi: plain.VuNuoi?.ten_vu_nuoi || null,
    ngay_tha_giong: plain.VuNuoi?.ngay_tha_giong || null,
    so_luong_giong: plain.VuNuoi?.so_luong_giong || null,
    ngay_thu_hoach_du_kien: plain.VuNuoi?.ngay_thu_hoach_du_kien || null,

    dinh_muc_cong_no: dinh_muc,
    cong_no_hien_tai,
    dang_giu_han_muc,
    da_su_dung,
    da_thanh_toan,
    con_lai,
    phan_tram_su_dung:
      dinh_muc > 0 ? Math.min((da_su_dung / dinh_muc) * 100, 100) : 0,

    han_thanh_toan: plain.han_thanh_toan || null,
    ngay_duyet: plain.ngay_duyet || null,
    ghi_chu: plain.ghi_chu || null,

    so_don_lien_quan: relatedOrders.length,
  };
};

const getDebtProfileTransactions = async (id_nguoi_dung, id_ho_so) => {
  const profile = await HoSoKhachHang.findOne({
    where: {
      id_ho_so,
      id_nguoi_dung,
      duoc_phep_tra_sau: true,
    },
  });

  if (!profile) {
    throw new Error("Không tìm thấy hồ sơ công nợ hoặc bạn không có quyền truy cập");
  }

  const debtOrders = await getMyDebtOrders(id_nguoi_dung);

  const relatedOrders = debtOrders.filter(
    (order) => Number(order.id_ho_so) === Number(id_ho_so)
  );

  const orderTransactions = relatedOrders.map((order) => ({
    id: `ORDER-${order.id_don_hang}`,
    ngay: order.ngay_dat,
    loai: "mua_hang",
    noi_dung: `Mua vật tư đơn #DH-${order.id_don_hang}`,
    so_tien: -Number(order.tong_tien || 0),
    trang_thai: order.trang_thai_don_hang,
    id_don_hang: order.id_don_hang,
  }));

  const paymentTransactions = [];

  relatedOrders.forEach((order) => {
    if (Number(order.da_thanh_toan || 0) > 0) {
      paymentTransactions.push({
        id: `PAY-${order.id_don_hang}`,
        ngay: order.ngay_dat,
        loai: "thanh_toan",
        noi_dung: `Thanh toán công nợ đơn #DH-${order.id_don_hang}`,
        so_tien: Number(order.da_thanh_toan || 0),
        trang_thai: "thanh_cong",
        id_don_hang: order.id_don_hang,
      });
    }
  });

  return [...orderTransactions, ...paymentTransactions].sort(
    (a, b) => new Date(b.ngay).getTime() - new Date(a.ngay).getTime()
  );
};
module.exports = {
  getMyDebtOrders,
  getMyDebtSummary,
  getDebtProfileDetail,
  getDebtProfileTransactions,
};