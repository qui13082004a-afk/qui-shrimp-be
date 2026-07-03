const { Op } = require("sequelize");
const {
  DonHang,
  ThanhToanCongNo,
  VuNuoi,
  ChiTietThanhToanCongNo,
  AoNuoi,
  HoSoKhachHang,
} = require("../models");

const EXCLUDED_ORDER_STATUS = ["da_huy", "giao_that_bai"];
const RESERVED_STATUS = [
  "cho_xu_ly",
  "cho_giao",
  "dang_giao",
  "cho_thanh_toan",
  "da_thanh_toan",
];

const toNumber = (value) => Number(value || 0);

const buildPaidMap = (paymentDetails) => {
  const paidMap = new Map();

  for (const item of paymentDetails) {
    const plain = item.toJSON ? item.toJSON() : item;
    const id = Number(plain.id_don_hang);
    paidMap.set(id, (paidMap.get(id) || 0) + toNumber(plain.so_tien_phan_bo));
  }

  return paidMap;
};

const getPaidDetailsByOrderIds = async (orderIds) => {
  if (!orderIds.length) return [];

  return ChiTietThanhToanCongNo.findAll({
    where: { id_don_hang: { [Op.in]: orderIds } },
    attributes: ["id_don_hang", "so_tien_phan_bo"],
    include: [
      {
        model: ThanhToanCongNo,
        required: true,
        attributes: [],
        where: { trang_thai: "thanh_cong" },
      },
    ],
  });
};

const getMyDebtOrders = async (id_nguoi_dung) => {
  const [debtOrders, debtPayments] = await Promise.all([
    DonHang.findAll({
      where: {
        id_nguoi_dung,
        hinh_thuc_thanh_toan: "tra_sau",
        trang_thai_don_hang: { [Op.notIn]: EXCLUDED_ORDER_STATUS },
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
          attributes: ["id_vu_nuoi", "ten_vu_nuoi"],
          include: [{ model: AoNuoi, required: false, attributes: ["id_ao", "ten_ao"] }],
        },
      ],
    }),
    ThanhToanCongNo.findAll({
      where: { id_nguoi_dung, trang_thai: "thanh_cong" },
      attributes: [
        "id_thanh_toan_cong_no",
        "id_ho_so",
        "so_tien",
        "ma_giao_dich",
        "ngay_thanh_toan",
        "trang_thai",
      ],
      include: [
        {
          model: HoSoKhachHang,
          required: false,
          attributes: ["id_ho_so", "id_ao", "id_vu_nuoi"],
          include: [
            { model: VuNuoi, required: false, attributes: ["id_vu_nuoi", "ten_vu_nuoi"] },
            { model: AoNuoi, required: false, attributes: ["id_ao", "ten_ao"] },
          ],
        },
      ],
    }),
  ]);

  const history = [];

  for (const order of debtOrders) {
    const plain = order.toJSON();
    history.push({
      loai: "phat_sinh",
      ngay_giao_dich: plain.ngay_dat,
      noi_dung: `Mua vật tư đơn #${plain.id_don_hang}`,
      vu_nuoi: plain.VuNuoi?.ten_vu_nuoi || null,
      ao_nuoi: plain.VuNuoi?.AoNuoi?.ten_ao || null,
      so_tien: toNumber(plain.tong_thanh_toan),
      trang_thai: plain.trang_thai_don_hang,
    });
  }

  for (const payment of debtPayments) {
    const plain = payment.toJSON();
    history.push({
      loai: "thanh_toan",
      ngay_giao_dich: plain.ngay_thanh_toan,
      noi_dung: "Thanh toán công nợ",
      vu_nuoi: plain.HoSoKhachHang?.VuNuoi?.ten_vu_nuoi || null,
      ao_nuoi: plain.HoSoKhachHang?.AoNuoi?.ten_ao || null,
      so_tien: toNumber(plain.so_tien),
      trang_thai: plain.trang_thai,
      ma_giao_dich: plain.ma_giao_dich || null,
    });
  }

  return history.sort(
    (a, b) => new Date(b.ngay_giao_dich || 0).getTime() - new Date(a.ngay_giao_dich || 0).getTime()
  );
};

const getMyDebtSummary = async (id_nguoi_dung) => {
  const [profiles, debtOrders] = await Promise.all([
    HoSoKhachHang.findAll({
      where: { id_nguoi_dung, duoc_phep_tra_sau: true },
      attributes: [
        "id_ho_so",
        "id_nguoi_dung",
        "id_ao",
        "id_vu_nuoi",
        "dinh_muc_cong_no",
        "han_thanh_toan",
      ],
      include: [{ model: AoNuoi, required: false, attributes: ["id_ao", "ten_ao"] }],
    }),
    DonHang.findAll({
      where: {
        id_nguoi_dung,
        hinh_thuc_thanh_toan: "tra_sau",
        trang_thai_don_hang: { [Op.notIn]: EXCLUDED_ORDER_STATUS },
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
          attributes: ["id_vu_nuoi", "id_ao", "ten_vu_nuoi"],
          include: [
            {
              model: HoSoKhachHang,
              required: false,
              attributes: ["id_ho_so", "han_thanh_toan"],
            },
          ],
        },
      ],
    }),
  ]);

  const plainOrders = debtOrders.map((order) => order.toJSON());
  const orderIds = plainOrders.map((order) => order.id_don_hang);
  const paidMap = buildPaidMap(await getPaidDetailsByOrderIds(orderIds));

  const profileStats = new Map();
  const hanMucTheoHoSo = [];

  let tong_han_muc = 0;
  let tong_gia_tri_mua_tra_sau = 0;
  let da_thanh_toan = 0;
  let han_gan_nhat = null;

  for (const profile of profiles) {
    const plain = profile.toJSON();
    const dinh_muc = toNumber(plain.dinh_muc_cong_no);
    tong_han_muc += dinh_muc;

    const stat = {
      id_ho_so: plain.id_ho_so,
      id_ao: plain.id_ao,
      id_vu_nuoi: plain.id_vu_nuoi,
      ten_ao: plain.AoNuoi?.ten_ao || `Ao #${plain.id_ao}`,
      dinh_muc_cong_no: dinh_muc,
      han_thanh_toan: plain.han_thanh_toan || null,
      cong_no_hien_tai: 0,
      dang_giu_han_muc: 0,
      da_thanh_toan: 0,
    };

    profileStats.set(Number(plain.id_ho_so), stat);
    hanMucTheoHoSo.push(stat);
  }

  let so_don_tra_sau = 0;

  for (const order of plainOrders) {
    so_don_tra_sau += 1;

    const tong_tien = toNumber(order.tong_thanh_toan);
    const daThanhToanDon = toNumber(paidMap.get(Number(order.id_don_hang)));
    const con_lai_don = Math.max(tong_tien - daThanhToanDon, 0);
    const hoSo = order.VuNuoi?.HoSoKhachHang || null;
    const idHoSo = hoSo?.id_ho_so ? Number(hoSo.id_ho_so) : null;
    const stat = idHoSo ? profileStats.get(idHoSo) : null;

    tong_gia_tri_mua_tra_sau += tong_tien;
    da_thanh_toan += daThanhToanDon;

    if (!stat) continue;

    stat.da_thanh_toan += daThanhToanDon;

    if (order.trang_thai_don_hang === "hoan_tat") {
      stat.cong_no_hien_tai += con_lai_don;

      if (con_lai_don > 0 && hoSo?.han_thanh_toan) {
        const current = new Date(hoSo.han_thanh_toan).getTime();
        const old = han_gan_nhat ? new Date(han_gan_nhat).getTime() : Infinity;
        if (current < old) han_gan_nhat = hoSo.han_thanh_toan;
      }
    } else if (RESERVED_STATUS.includes(order.trang_thai_don_hang)) {
      stat.dang_giu_han_muc += con_lai_don;
    }
  }

  let tong_cong_no = 0;
  let dang_giu_han_muc = 0;

  const han_muc_theo_ho_so = hanMucTheoHoSo.map((item) => {
    const da_su_dung = item.cong_no_hien_tai + item.dang_giu_han_muc;
    const con_lai = Math.max(item.dinh_muc_cong_no - da_su_dung, 0);

    tong_cong_no += item.cong_no_hien_tai;
    dang_giu_han_muc += item.dang_giu_han_muc;

    return {
      ...item,
      da_su_dung,
      con_lai,
      tong_cong_no: item.cong_no_hien_tai,
      phan_tram_su_dung:
        item.dinh_muc_cong_no > 0
          ? Math.min((da_su_dung / item.dinh_muc_cong_no) * 100, 100)
          : 0,
    };
  });

  const da_su_dung = tong_cong_no + dang_giu_han_muc;
  const con_lai = Math.max(tong_han_muc - da_su_dung, 0);

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
    so_don_tra_sau,
    han_muc_theo_ho_so,
  };
};

const getDebtProfileDetail = async (id_nguoi_dung, id_ho_so) => {
  const profile = await HoSoKhachHang.findOne({
    where: { id_ho_so, id_nguoi_dung, duoc_phep_tra_sau: true },
    attributes: [
      "id_ho_so",
      "id_nguoi_dung",
      "id_ao",
      "id_vu_nuoi",
      "dinh_muc_cong_no",
      "han_thanh_toan",
      "ngay_duyet",
      "ghi_chu",
    ],
    include: [
      {
        model: AoNuoi,
        required: false,
        attributes: ["id_ao", "ten_ao", "dien_tich", "dia_chi_ao", "loai_hinh_nuoi"],
      },
      {
        model: VuNuoi,
        required: false,
        attributes: [
          "id_vu_nuoi",
          "ten_vu_nuoi",
          "ngay_tha_giong",
          "so_luong_giong",
          "ngay_thu_hoach_du_kien",
        ],
      },
    ],
  });

  if (!profile) {
    throw new Error("Không tìm thấy hồ sơ công nợ hoặc bạn không có quyền truy cập");
  }

  const plain = profile.toJSON();

  const orders = await DonHang.findAll({
    where: {
      id_nguoi_dung,
      id_vu_nuoi: plain.id_vu_nuoi,
      hinh_thuc_thanh_toan: "tra_sau",
      trang_thai_don_hang: { [Op.notIn]: EXCLUDED_ORDER_STATUS },
    },
    attributes: ["id_don_hang", "tong_thanh_toan", "trang_thai_don_hang"],
  });

  const plainOrders = orders.map((order) => order.toJSON());
  const paidMap = buildPaidMap(await getPaidDetailsByOrderIds(plainOrders.map((order) => order.id_don_hang)));

  let cong_no_hien_tai = 0;
  let dang_giu_han_muc = 0;
  let da_thanh_toan = 0;

  for (const order of plainOrders) {
    const tong_tien = toNumber(order.tong_thanh_toan);
    const daThanhToanDon = toNumber(paidMap.get(Number(order.id_don_hang)));
    const conLaiDon = Math.max(tong_tien - daThanhToanDon, 0);

    da_thanh_toan += daThanhToanDon;

    if (order.trang_thai_don_hang === "hoan_tat") {
      cong_no_hien_tai += conLaiDon;
    } else if (RESERVED_STATUS.includes(order.trang_thai_don_hang)) {
      dang_giu_han_muc += conLaiDon;
    }
  }

  const dinh_muc = toNumber(plain.dinh_muc_cong_no);
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
    phan_tram_su_dung: dinh_muc > 0 ? Math.min((da_su_dung / dinh_muc) * 100, 100) : 0,
    han_thanh_toan: plain.han_thanh_toan || null,
    ngay_duyet: plain.ngay_duyet || null,
    ghi_chu: plain.ghi_chu || null,
    so_don_lien_quan: plainOrders.length,
  };
};

const getDebtProfileTransactions = async (id_nguoi_dung, id_ho_so) => {
  const profile = await HoSoKhachHang.findOne({
    where: { id_ho_so, id_nguoi_dung, duoc_phep_tra_sau: true },
    attributes: ["id_ho_so", "id_vu_nuoi"],
  });

  if (!profile) {
    throw new Error("Không tìm thấy hồ sơ công nợ hoặc bạn không có quyền truy cập");
  }

  const orders = await DonHang.findAll({
    where: {
      id_nguoi_dung,
      id_vu_nuoi: profile.id_vu_nuoi,
      hinh_thuc_thanh_toan: "tra_sau",
      trang_thai_don_hang: { [Op.notIn]: EXCLUDED_ORDER_STATUS },
    },
    attributes: ["id_don_hang", "tong_thanh_toan", "ngay_dat", "trang_thai_don_hang"],
    order: [["ngay_dat", "DESC"]],
  });

  const plainOrders = orders.map((order) => order.toJSON());
  const orderIds = plainOrders.map((order) => order.id_don_hang);

  const paymentDetails = orderIds.length
    ? await ChiTietThanhToanCongNo.findAll({
        where: { id_don_hang: { [Op.in]: orderIds } },
        attributes: [
          "id_chi_tiet_thanh_toan_cong_no",
          "id_don_hang",
          "so_tien_phan_bo",
          "ngay_phan_bo",
        ],
        include: [
          {
            model: ThanhToanCongNo,
            required: true,
            attributes: [
              "id_thanh_toan_cong_no",
              "ma_giao_dich",
              "trang_thai",
              "ngay_thanh_toan",
            ],
            where: { trang_thai: "thanh_cong" },
          },
        ],
      })
    : [];

  const transactions = [];

  for (const order of plainOrders) {
    transactions.push({
      id: `ORDER-${order.id_don_hang}`,
      ngay: order.ngay_dat,
      loai: "mua_hang",
      noi_dung: `Mua vật tư đơn #DH-${order.id_don_hang}`,
      so_tien: -toNumber(order.tong_thanh_toan),
      trang_thai: order.trang_thai_don_hang,
      id_don_hang: order.id_don_hang,
    });
  }

  for (const item of paymentDetails) {
    const plain = item.toJSON();

    transactions.push({
      id: `PAY-${plain.id_chi_tiet_thanh_toan_cong_no}`,
      ngay: plain.ThanhToanCongNo?.ngay_thanh_toan || plain.ngay_phan_bo,
      loai: "thanh_toan",
      noi_dung: `Thanh toán công nợ đơn #DH-${plain.id_don_hang}`,
      so_tien: toNumber(plain.so_tien_phan_bo),
      trang_thai: plain.ThanhToanCongNo?.trang_thai || "thanh_cong",
      id_don_hang: plain.id_don_hang,
      ma_giao_dich: plain.ThanhToanCongNo?.ma_giao_dich || null,
    });
  }

  return transactions.sort((a, b) => new Date(b.ngay || 0).getTime() - new Date(a.ngay || 0).getTime());
};

module.exports = {
  getMyDebtOrders,
  getMyDebtSummary,
  getDebtProfileDetail,
  getDebtProfileTransactions,
};
