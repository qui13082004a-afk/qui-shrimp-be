const { Op } = require("sequelize");
const {
  DonHang,
  ThanhToanCongNo,
  ChiTietThanhToanCongNo,
  AoNuoi,
  VuNuoi,
  HoSoKhachHang,
} = require("../models");

const EXCLUDED_ORDER_STATUS = ["da_huy", "giao_that_bai"];
const DEFAULT_POSTPAID_OVERDUE_INTEREST_RATE_MONTHLY = 1.2;

const ACTIVE_POSTPAID_ORDER_STATUS = [
  "cho_xu_ly",
  "cho_thanh_toan",
  "da_thanh_toan",
  "cho_giao",
  "dang_giao",
  "hoan_tat",
];

const RESERVED_STATUS = [
  "cho_xu_ly",
  "cho_thanh_toan",
  "da_thanh_toan",
  "cho_giao",
  "dang_giao",
];

const toNumber = (value) => Number(value || 0);

const calculateOverdueInterest = ({
  dueDate,
  remainingPrincipal,
  monthlyRate,
}) => {
  const principal = toNumber(remainingPrincipal);
  const rate =
    toNumber(monthlyRate) > 0
      ? toNumber(monthlyRate)
      : DEFAULT_POSTPAID_OVERDUE_INTEREST_RATE_MONTHLY;

  if (!dueDate || principal <= 0 || rate <= 0) {
    return {
      so_ngay_qua_han: 0,
      so_thang_tinh_lai: 0,
      tien_lai_qua_han: 0,
    };
  }

  const due = new Date(dueDate);
  if (Number.isNaN(due.getTime())) {
    return {
      so_ngay_qua_han: 0,
      so_thang_tinh_lai: 0,
      tien_lai_qua_han: 0,
    };
  }

  const diffDays = Math.floor(
    (Date.now() - due.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays <= 0) {
    return {
      so_ngay_qua_han: 0,
      so_thang_tinh_lai: 0,
      tien_lai_qua_han: 0,
    };
  }

  const overdueMonths = Math.max(
  1,
  (today.getFullYear() - dueDate.getFullYear()) * 12 +
    (today.getMonth() - dueDate.getMonth())
);

  return {
    so_ngay_qua_han: diffDays,
    so_thang_tinh_lai: overdueMonths,
    tien_lai_qua_han: Math.round(principal * (rate / 100) * overdueMonths),
  };
};

const buildPaidMap = (paymentDetails) => {
  const paidMap = new Map();

  for (const item of paymentDetails) {
    const plain = item.toJSON ? item.toJSON() : item;
    const id = Number(plain.id_don_hang);

    paidMap.set(
      id,
      (paidMap.get(id) || 0) + toNumber(plain.so_tien_phan_bo)
    );
  }

  return paidMap;
};

const getPaidDetailsByOrderIds = async (orderIds) => {
  if (!orderIds.length) return [];

  return await ChiTietThanhToanCongNo.findAll({
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
};

const getMyDebtOrders = async (id_nguoi_dung) => {
  const [debtOrders, debtPayments] = await Promise.all([
    DonHang.findAll({
      where: {
        id_nguoi_dung,
        hinh_thuc_thanh_toan: "tra_sau",
        trang_thai_don_hang: {
          [Op.notIn]: EXCLUDED_ORDER_STATUS,
        },
      },
      attributes: [
        "id_don_hang",
        "id_ho_so",
        "id_vu_nuoi",
        "tong_thanh_toan",
        "ngay_dat",
        "trang_thai_don_hang",
      ],
      include: [
        {
          model: HoSoKhachHang,
          required: false,
          attributes: ["id_ho_so", "id_ao", "id_vu_nuoi", "han_thanh_toan"],
          include: [
            {
              model: AoNuoi,
              required: false,
              attributes: ["id_ao", "ten_ao"],
            },
            {
              model: VuNuoi,
              required: false,
              attributes: ["id_vu_nuoi", "ten_vu_nuoi"],
            },
          ],
        },
      ],
    }),

    ThanhToanCongNo.findAll({
      where: {
        id_nguoi_dung,
        trang_thai: "thanh_cong",
      },
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
          attributes: ["id_ho_so", "id_ao", "id_vu_nuoi", "han_thanh_toan"],
          include: [
            {
              model: AoNuoi,
              required: false,
              attributes: ["id_ao", "ten_ao"],
            },
            {
              model: VuNuoi,
              required: false,
              attributes: ["id_vu_nuoi", "ten_vu_nuoi"],
            },
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
      id_ho_so: plain.id_ho_so || null,
      id_don_hang: plain.id_don_hang,
      vu_nuoi: plain.HoSoKhachHang?.VuNuoi?.ten_vu_nuoi || null,
      ao_nuoi: plain.HoSoKhachHang?.AoNuoi?.ten_ao || null,
      han_thanh_toan: plain.HoSoKhachHang?.han_thanh_toan || null,
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
      id_ho_so: plain.id_ho_so || null,
      vu_nuoi: plain.HoSoKhachHang?.VuNuoi?.ten_vu_nuoi || null,
      ao_nuoi: plain.HoSoKhachHang?.AoNuoi?.ten_ao || null,
      han_thanh_toan: plain.HoSoKhachHang?.han_thanh_toan || null,
      so_tien: toNumber(plain.so_tien),
      trang_thai: plain.trang_thai,
      ma_giao_dich: plain.ma_giao_dich || null,
    });
  }

  return history.sort(
    (a, b) =>
      new Date(b.ngay_giao_dich || 0).getTime() -
      new Date(a.ngay_giao_dich || 0).getTime()
  );
};

const getMyDebtSummary = async (id_nguoi_dung) => {
  const [profiles, debtOrders] = await Promise.all([
    HoSoKhachHang.findAll({
      where: {
        id_nguoi_dung,
        duoc_phep_tra_sau: true,
      },
      attributes: [
        "id_ho_so",
        "id_nguoi_dung",
        "id_ao",
        "id_vu_nuoi",
        "dinh_muc_cong_no",
        "han_thanh_toan",
        "trang_thai_ho_so",
        "bi_khoa_tra_sau",
      ],
      include: [
        {
          model: AoNuoi,
          required: false,
          attributes: ["id_ao", "ten_ao"],
        },
        {
          model: VuNuoi,
          required: false,
          attributes: ["id_vu_nuoi", "ten_vu_nuoi"],
        },
      ],
    }),

    DonHang.findAll({
      where: {
        id_nguoi_dung,
        hinh_thuc_thanh_toan: "tra_sau",
        trang_thai_don_hang: {
          [Op.notIn]: EXCLUDED_ORDER_STATUS,
        },
      },
      attributes: [
        "id_don_hang",
        "id_ho_so",
        "tong_thanh_toan",
        "lai_suat_qua_han_thang",
        "ngay_dat",
        "trang_thai_don_hang",
      ],
    }),
  ]);

  const plainProfiles = profiles.map((profile) => profile.toJSON());
  const plainOrders = debtOrders.map((order) => order.toJSON());

  const orderIds = plainOrders.map((order) => order.id_don_hang);
  const paidMap = buildPaidMap(await getPaidDetailsByOrderIds(orderIds));

  const profileStats = new Map();
  const hanMucTheoHoSo = [];

  let tong_han_muc = 0;
  let tong_gia_tri_mua_tra_sau = 0;
  let da_thanh_toan = 0;
  let tong_cong_no = 0;
  let tong_lai_qua_han = 0;
  let dang_giu_han_muc = 0;
  let han_gan_nhat = null;
  let so_don_tra_sau = 0;

  for (const profile of plainProfiles) {
    const dinh_muc = toNumber(profile.dinh_muc_cong_no);
    tong_han_muc += dinh_muc;

    const stat = {
      id_ho_so: profile.id_ho_so,
      id_ao: profile.id_ao,
      id_vu_nuoi: profile.id_vu_nuoi,
      ten_ao: profile.AoNuoi?.ten_ao || `Ao #${profile.id_ao}`,
      ten_vu_nuoi: profile.VuNuoi?.ten_vu_nuoi || null,
      dinh_muc_cong_no: dinh_muc,
      han_thanh_toan: profile.han_thanh_toan || null,
      trang_thai_ho_so: profile.trang_thai_ho_so,
      bi_khoa_tra_sau: profile.bi_khoa_tra_sau,

      cong_no_hien_tai: 0,
      dang_giu_han_muc: 0,
      da_thanh_toan: 0,
      tien_lai_qua_han: 0,
      tong_phai_thanh_toan: 0,
      da_su_dung: 0,
      con_lai: dinh_muc,
      phan_tram_su_dung: 0,
      so_don_lien_quan: 0,
    };

    profileStats.set(Number(profile.id_ho_so), stat);
    hanMucTheoHoSo.push(stat);
  }

  for (const order of plainOrders) {
    const idHoSo = order.id_ho_so ? Number(order.id_ho_so) : null;
    const stat = idHoSo ? profileStats.get(idHoSo) : null;

    if (!stat) continue;

    so_don_tra_sau += 1;

    const tongTienDon = toNumber(order.tong_thanh_toan);
    const daThanhToanDon = toNumber(
      paidMap.get(Number(order.id_don_hang))
    );
    const conLaiDon = Math.max(tongTienDon - daThanhToanDon, 0);

    tong_gia_tri_mua_tra_sau += tongTienDon;
    da_thanh_toan += daThanhToanDon;

    stat.da_thanh_toan += daThanhToanDon;
    stat.so_don_lien_quan += 1;

    if (order.trang_thai_don_hang === "hoan_tat") {
      stat.cong_no_hien_tai += conLaiDon;
      tong_cong_no += conLaiDon;

      const interest = calculateOverdueInterest({
        dueDate: stat.han_thanh_toan,
        remainingPrincipal: conLaiDon,
        monthlyRate: order.lai_suat_qua_han_thang,
      });

      stat.tien_lai_qua_han += interest.tien_lai_qua_han;
      tong_lai_qua_han += interest.tien_lai_qua_han;
    } else if (RESERVED_STATUS.includes(order.trang_thai_don_hang)) {
      stat.dang_giu_han_muc += conLaiDon;
      dang_giu_han_muc += conLaiDon;
    }

    if (conLaiDon > 0 && stat.han_thanh_toan) {
      const current = new Date(stat.han_thanh_toan).getTime();
      const old = han_gan_nhat
        ? new Date(han_gan_nhat).getTime()
        : Infinity;

      if (current < old) {
        han_gan_nhat = stat.han_thanh_toan;
      }
    }
  }

  const han_muc_theo_ho_so = hanMucTheoHoSo.map((item) => {
    const da_su_dung = item.cong_no_hien_tai + item.dang_giu_han_muc;
    const con_lai = Math.max(item.dinh_muc_cong_no - da_su_dung, 0);
    const tong_phai_thanh_toan =
      item.cong_no_hien_tai + item.tien_lai_qua_han;

    return {
      ...item,
      da_su_dung,
      con_lai,
      tong_cong_no: item.cong_no_hien_tai,
      tong_phai_thanh_toan,
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
    tong_lai_qua_han,
    tong_phai_thanh_toan: tong_cong_no + tong_lai_qua_han,
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
    where: {
      id_ho_so,
      id_nguoi_dung,
      duoc_phep_tra_sau: true,
    },
    attributes: [
      "id_ho_so",
      "id_nguoi_dung",
      "id_ao",
      "id_vu_nuoi",
      "dinh_muc_cong_no",
      "han_thanh_toan",
      "ngay_duyet",
      "ghi_chu",
      "trang_thai_ho_so",
      "bi_khoa_tra_sau",
      "ly_do_khoa",
    ],
    include: [
      {
        model: AoNuoi,
        required: false,
        attributes: [
          "id_ao",
          "ten_ao",
          "dien_tich",
          "dia_chi_ao",
          "loai_hinh_nuoi",
        ],
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
      id_ho_so,
      id_nguoi_dung,
      hinh_thuc_thanh_toan: "tra_sau",
      trang_thai_don_hang: {
        [Op.notIn]: EXCLUDED_ORDER_STATUS,
      },
    },
    attributes: [
      "id_don_hang",
      "tong_thanh_toan",
      "lai_suat_qua_han_thang",
      "ngay_dat",
      "trang_thai_don_hang",
    ],
    order: [["ngay_dat", "DESC"]],
  });

  const plainOrders = orders.map((order) => order.toJSON());
  const paidMap = buildPaidMap(
    await getPaidDetailsByOrderIds(
      plainOrders.map((order) => order.id_don_hang)
    )
  );

  let cong_no_hien_tai = 0;
  let dang_giu_han_muc = 0;
  let da_thanh_toan = 0;
  let tong_gia_tri_mua_tra_sau = 0;
  let tong_lai_qua_han = 0;

  const don_hang = plainOrders.map((order) => {
    const tongTienDon = toNumber(order.tong_thanh_toan);
    const daThanhToanDon = toNumber(
      paidMap.get(Number(order.id_don_hang))
    );
    const conLaiDon = Math.max(tongTienDon - daThanhToanDon, 0);

    tong_gia_tri_mua_tra_sau += tongTienDon;
    da_thanh_toan += daThanhToanDon;

    if (order.trang_thai_don_hang === "hoan_tat") {
      cong_no_hien_tai += conLaiDon;
    } else if (RESERVED_STATUS.includes(order.trang_thai_don_hang)) {
      dang_giu_han_muc += conLaiDon;
    }

    const interest =
      order.trang_thai_don_hang === "hoan_tat"
        ? calculateOverdueInterest({
            dueDate: plain.han_thanh_toan,
            remainingPrincipal: conLaiDon,
            monthlyRate: order.lai_suat_qua_han_thang,
          })
        : {
            so_ngay_qua_han: 0,
            so_thang_tinh_lai: 0,
            tien_lai_qua_han: 0,
          };

    tong_lai_qua_han += interest.tien_lai_qua_han;

    return {
      id_don_hang: order.id_don_hang,
      ngay_dat: order.ngay_dat,
      tong_thanh_toan: tongTienDon,
      lai_suat_qua_han_thang: toNumber(order.lai_suat_qua_han_thang),
      da_thanh_toan: daThanhToanDon,
      con_lai: conLaiDon,
      ...interest,
      tong_phai_thanh_toan: conLaiDon + interest.tien_lai_qua_han,
      trang_thai_don_hang: order.trang_thai_don_hang,
    };
  });

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
    tong_gia_tri_mua_tra_sau,
    cong_no_hien_tai,
    tong_lai_qua_han,
    tong_phai_thanh_toan: cong_no_hien_tai + tong_lai_qua_han,
    dang_giu_han_muc,
    da_su_dung,
    da_thanh_toan,
    con_lai,
    phan_tram_su_dung:
      dinh_muc > 0 ? Math.min((da_su_dung / dinh_muc) * 100, 100) : 0,

    han_thanh_toan: plain.han_thanh_toan || null,
    ngay_duyet: plain.ngay_duyet || null,
    trang_thai_ho_so: plain.trang_thai_ho_so,
    bi_khoa_tra_sau: plain.bi_khoa_tra_sau,
    ly_do_khoa: plain.ly_do_khoa || null,
    ghi_chu: plain.ghi_chu || null,

    so_don_lien_quan: plainOrders.length,
    don_hang,
  };
};

const getAdminDebtProfileDetail = async (id_ho_so) => {
  const profile = await HoSoKhachHang.findOne({
    where: {
      id_ho_so,
      duoc_phep_tra_sau: true,
    },
    attributes: ["id_ho_so", "id_nguoi_dung"],
  });

  if (!profile) {
    throw new Error("Khong tim thay ho so cong no");
  }

  return getDebtProfileDetail(profile.id_nguoi_dung, id_ho_so);
};

const getDebtProfileTransactions = async (id_nguoi_dung, id_ho_so) => {
  const profile = await HoSoKhachHang.findOne({
    where: {
      id_ho_so,
      id_nguoi_dung,
      duoc_phep_tra_sau: true,
    },
    attributes: ["id_ho_so"],
  });

  if (!profile) {
    throw new Error("Không tìm thấy hồ sơ công nợ hoặc bạn không có quyền truy cập");
  }

  const orders = await DonHang.findAll({
    where: {
      id_ho_so,
      id_nguoi_dung,
      hinh_thuc_thanh_toan: "tra_sau",
      trang_thai_don_hang: {
        [Op.notIn]: EXCLUDED_ORDER_STATUS,
      },
    },
    attributes: [
      "id_don_hang",
      "tong_thanh_toan",
      "ngay_dat",
      "trang_thai_don_hang",
    ],
    order: [["ngay_dat", "DESC"]],
  });

  const plainOrders = orders.map((order) => order.toJSON());
  const orderIds = plainOrders.map((order) => order.id_don_hang);

  const paymentDetails = orderIds.length
    ? await ChiTietThanhToanCongNo.findAll({
        where: {
          id_don_hang: {
            [Op.in]: orderIds,
          },
        },
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
              "so_tien",
              "ma_giao_dich",
              "trang_thai",
              "ngay_thanh_toan",
            ],
            where: {
              trang_thai: "thanh_cong",
            },
          },
        ],
      })
    : [];

  const transactions = [];
  const paidByPayment = new Map();

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
    const paymentId = plain.ThanhToanCongNo?.id_thanh_toan_cong_no;
    const allocatedAmount = toNumber(plain.so_tien_phan_bo);

    if (paymentId) {
      const current = paidByPayment.get(paymentId) || {
        total: toNumber(plain.ThanhToanCongNo?.so_tien),
        allocated: 0,
        ngay: plain.ThanhToanCongNo?.ngay_thanh_toan || plain.ngay_phan_bo,
        trang_thai: plain.ThanhToanCongNo?.trang_thai || "thanh_cong",
        ma_giao_dich: plain.ThanhToanCongNo?.ma_giao_dich || null,
      };

      current.allocated += allocatedAmount;
      paidByPayment.set(paymentId, current);
    }

    transactions.push({
      id: `PAY-${plain.id_chi_tiet_thanh_toan_cong_no}`,
      ngay: plain.ThanhToanCongNo?.ngay_thanh_toan || plain.ngay_phan_bo,
      loai: "thanh_toan",
      noi_dung: `Thanh toán công nợ đơn #DH-${plain.id_don_hang}`,
      so_tien: allocatedAmount,
      trang_thai: plain.ThanhToanCongNo?.trang_thai || "thanh_cong",
      id_don_hang: plain.id_don_hang,
      ma_giao_dich: plain.ThanhToanCongNo?.ma_giao_dich || null,
    });
  }

  for (const [paymentId, payment] of paidByPayment) {
    const interestAmount = Math.round(payment.total - payment.allocated);

    if (interestAmount <= 0) continue;

    transactions.push({
      id: `PAY-INTEREST-${paymentId}`,
      ngay: payment.ngay,
      loai: "thanh_toan",
      noi_dung: "Thanh toan lai/phi qua han",
      so_tien: interestAmount,
      trang_thai: payment.trang_thai,
      id_don_hang: null,
      ma_giao_dich: payment.ma_giao_dich,
    });
  }

  return transactions.sort(
    (a, b) =>
      new Date(b.ngay || 0).getTime() -
      new Date(a.ngay || 0).getTime()
  );
};

module.exports = {
  getMyDebtOrders,
  getMyDebtSummary,
  getDebtProfileDetail,
  getAdminDebtProfileDetail,
  getDebtProfileTransactions,
};
