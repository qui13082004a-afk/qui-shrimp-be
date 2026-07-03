const { Op } = require("sequelize");
const {
  DonHang,
  ThanhToan,
    ThanhToanCongNo,
  VuNuoi,
  ChiTietThanhToanCongNo,
  AoNuoi,
  HoSoKhachHang,
  GiaoHang,
} = require("../models");

const getMyDebtOrders = async (id_nguoi_dung) => {
  const debtOrders = await DonHang.findAll({
    where: {
      id_nguoi_dung,
      hinh_thuc_thanh_toan: "tra_sau",
      trang_thai_don_hang: {
        [Op.notIn]: ["da_huy", "giao_that_bai"],
      },
    },
    attributes: [
      "id_don_hang",
      "id_vu_nuoi",
      "tong_thanh_toan",
      "ngay_dat",
      "trang_thai_don_hang",
    ],
    include: [
      {
        model: VuNuoi,
        required: false,
        attributes: ["ten_vu_nuoi"],
        include: [
          {
            model: AoNuoi,
            required: false,
            attributes: ["ten_ao"],
          },
        ],
      },
    ],
  });

  const debtPayments = await ThanhToanCongNo.findAll({
    where: {
      id_nguoi_dung,
      trang_thai: "thanh_cong",
    },
    attributes: [
      "id_thanh_toan_cong_no",
      "so_tien",
      "ma_giao_dich",
      "ngay_thanh_toan",
      "trang_thai",
    ],
  });

  const orderHistory = debtOrders.map((order) => {
    const plain = order.toJSON();

    return {
      loai: "phat_sinh",
      ngay_giao_dich: plain.ngay_dat,
      noi_dung: `Mua vật tư đơn #${plain.id_don_hang}`,
      vu_nuoi: plain.VuNuoi?.ten_vu_nuoi || null,
      ao_nuoi: plain.VuNuoi?.AoNuoi?.ten_ao || null,
      so_tien: Number(plain.tong_thanh_toan || 0),
      trang_thai: plain.trang_thai_don_hang,
    };
  });

  const paymentHistory = debtPayments.map((payment) => {
    const plain = payment.toJSON();

    return {
      loai: "thanh_toan",
      ngay_giao_dich: plain.ngay_thanh_toan,
      noi_dung: "Thanh toán công nợ",
      vu_nuoi: null,
      ao_nuoi: null,
      so_tien: Number(plain.so_tien || 0),
      trang_thai: plain.trang_thai,
      ma_giao_dich: plain.ma_giao_dich || null,
    };
  });

  const history = [...orderHistory, ...paymentHistory];

  history.sort(
    (a, b) =>
      new Date(b.ngay_giao_dich || 0).getTime() -
      new Date(a.ngay_giao_dich || 0).getTime()
  );

  return history;
};
const getMyDebtSummary = async (id_nguoi_dung) => {
  const profiles = await HoSoKhachHang.findAll({
    where: {
      id_nguoi_dung,
      duoc_phep_tra_sau: true,
    },
    include: [{ model: AoNuoi, required: false }],
  });

  const debtOrders = await DonHang.findAll({
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
          { model: HoSoKhachHang, required: false },
          { model: AoNuoi, required: false },
        ],
      },
    ],
  });

  const plainOrders = debtOrders.map((order) => order.toJSON());
  const orderIds = plainOrders.map((order) => order.id_don_hang);

  let paymentDetails = [];

  if (orderIds.length > 0) {
    paymentDetails = await ChiTietThanhToanCongNo.findAll({
      where: {
        id_don_hang: {
          [Op.in]: orderIds,
        },
      },
      attributes: ["id_don_hang", "so_tien_phan_bo"],
      include: [
        {
          model: ThanhToanCongNo,
          required: true,
          attributes: [],
          where: {
            trang_thai: "thanh_cong",
          },
        },
      ],
    });
  }

  const paidMap = {};

  paymentDetails.forEach((item) => {
    const plain = item.toJSON();
    const id = plain.id_don_hang;

    paidMap[id] = (paidMap[id] || 0) + Number(plain.so_tien_phan_bo || 0);
  });

  const ordersWithDebt = plainOrders.map((order) => {
    const tong_tien = Number(order.tong_thanh_toan || 0);
    const da_thanh_toan = Number(paidMap[order.id_don_hang] || 0);
    const con_lai = Math.max(tong_tien - da_thanh_toan, 0);
    const hoSo = order.VuNuoi?.HoSoKhachHang || null;

    return {
      ...order,
      id_ho_so: hoSo?.id_ho_so || null,
      han_thanh_toan: hoSo?.han_thanh_toan || null,
      tong_tien,
      da_thanh_toan,
      con_lai,
    };
  });

  const han_muc_theo_ho_so = profiles.map((profile) => {
    const plain = profile.toJSON();
    const dinh_muc = Number(plain.dinh_muc_cong_no || 0);

    const relatedOrders = ordersWithDebt.filter(
      (order) => Number(order.id_ho_so) === Number(plain.id_ho_so)
    );

    const cong_no_hien_tai = relatedOrders
      .filter((order) => order.trang_thai_don_hang === "hoan_tat")
      .reduce((sum, order) => sum + Number(order.con_lai || 0), 0);

    const dang_giu_han_muc = relatedOrders
      .filter((order) =>
        ["cho_xu_ly", "cho_giao", "dang_giao", "cho_thanh_toan", "da_thanh_toan"].includes(
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

  const da_thanh_toan = ordersWithDebt.reduce(
    (sum, item) => sum + Number(item.da_thanh_toan || 0),
    0
  );

  const tong_gia_tri_mua_tra_sau = ordersWithDebt.reduce(
    (sum, item) => sum + Number(item.tong_tien || 0),
    0
  );

  const con_lai = Math.max(tong_han_muc - da_su_dung, 0);

  const han_gan_nhat =
    ordersWithDebt
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
    so_don_tra_sau: ordersWithDebt.length,
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