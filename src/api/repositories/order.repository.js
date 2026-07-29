const {
  DonHang,
  ChiTietDonHang,
  SanPham,
  NguoiDung,
  ThanhToan,
  HoSoKhachHang,
  ChiTietThanhToanCongNo,
  ThanhToanCongNo,
  AoNuoi,
  DiaChiGiaoHang,
  KhoHang,
  GiaoHang,
  NhanVienGiaoHang,
} = require("../models");

const { Op } = require("sequelize");

const ORDER_ATTRIBUTES = [
  "id_don_hang",
  "id_nguoi_dung",
  "id_vu_nuoi",
  "id_ho_so",
  "tong_tien",
  "phi_van_chuyen",
  "tong_thanh_toan",
  "ty_le_phu_phi_tra_sau",
  "lai_suat_qua_han_thang",
  "hinh_thuc_thanh_toan",
  "trang_thai_don_hang",
  "dia_chi_giao_hang",
  "ghi_chu",
  "id_khu_vuc_giao_hang",
  "id_diem_xuat_phat",
  "id_kho_xuat",
  "co_chuyen_kho",
  "khoang_cach_giao_hang_km",
  "vi_do_giao_hang",
  "kinh_do_giao_hang",
  "ngay_dat",
  "ngay_duyet",
  "ngay_giao",
];

const USER_ATTRIBUTES = [
  "id_nguoi_dung",
  "ho_ten",
  "email",
  "so_dien_thoai",
  "dia_chi",
  "tinh_thanh",
];

const PRODUCT_ORDER_ATTRIBUTES = [
  "id_san_pham",
  "ten_san_pham",
  "gia",
  "don_vi_tinh",
  "hinh_anh",
  "trang_thai",
];

const ORDER_DETAIL_ATTRIBUTES = [
  "id_chi_tiet",
  "id_don_hang",
  "id_san_pham",
  "id_kho_khach_chon",
  "id_kho_xuat_thuc_te",
  "gia_ban",
  "so_luong_dat",
  "thanh_tien",
  "trang_thai_san_pham",
  "trang_thai_phan_bo",
];

const PAYMENT_ATTRIBUTES = [
  "id_thanh_toan",
  "id_don_hang",
  "so_tien",
  "phuong_thuc",
  "ma_giao_dich",
  "trang_thai",
  "ngay_thanh_toan",
];

const DELIVERY_ATTRIBUTES = [
  "id_giao_hang",
  "id_don_hang",
  "id_nhan_vien_giao",
  "id_kho_xuat",
  "trang_thai",
  "anh_bien_nhan",
  "anh_hop_dong",
  "ghi_chu",
  "thoi_gian_giao",
];

const DELIVERY_STAFF_ATTRIBUTES = [
  "id_nhan_vien_giao_hang",
  "id_nguoi_dung",
  "khu_vuc_phu_trach",
  "trang_thai",
];

const ACTIVE_POSTPAID_ORDER_STATUS = [
  "cho_xu_ly",
  "cho_thanh_toan",
  "da_thanh_toan",
  "cho_giao",
  "dang_giao",
  "hoan_tat",
];

const toNumber = (value) => Number(value || 0);

const createOrder = (data, transaction) => {
  return DonHang.create(data, { transaction });
};

const createOrderDetails = (details, transaction) => {
  return ChiTietDonHang.bulkCreate(details, { transaction });
};

const findProductById = (id_san_pham, transaction) => {
  return SanPham.findByPk(id_san_pham, {
    attributes: [
      "id_san_pham",
      "id_danh_muc",
      "ten_san_pham",
      "gia",
      "trang_thai",
    ],
    transaction,
    lock: transaction ? true : undefined,
  });
};

const findPondForOrder = (id_ao, id_nguoi_dung, transaction) => {
  return AoNuoi.findOne({
    where: { id_ao, id_nguoi_dung },
    attributes: [
      "id_ao",
      "id_nguoi_dung",
      "dia_chi_ao",
      "id_tinh_thanh",
      "id_phuong_xa",
      "vi_do",
      "kinh_do",
    ],
    transaction,
  });
};

const findDeliveryAddressForOrder = (id_dia_chi, id_nguoi_dung, transaction) => {
  return DiaChiGiaoHang.findOne({
    where: { id_dia_chi, id_nguoi_dung, dang_hoat_dong: true },
    attributes: [
      "id_dia_chi",
      "id_nguoi_dung",
      "dia_chi",
      "id_tinh_thanh",
      "id_phuong_xa",
      "vi_do",
      "kinh_do",
    ],
    transaction,
  });
};

const createPayment = (data, transaction) => {
  return ThanhToan.create(data, { transaction });
};

const findById = (id_don_hang) => {
  return DonHang.findByPk(id_don_hang, {
    attributes: ORDER_ATTRIBUTES,
    include: [
      { model: NguoiDung, attributes: USER_ATTRIBUTES },
      { model: KhoHang, required: false },
      {
        model: ChiTietDonHang,
        attributes: ORDER_DETAIL_ATTRIBUTES,
        include: [
          { model: SanPham, attributes: PRODUCT_ORDER_ATTRIBUTES },
          { model: KhoHang, as: "kho_khach_chon", required: false },
          { model: KhoHang, as: "kho_xuat_thuc_te", required: false },
        ],
      },
      { model: ThanhToan, attributes: PAYMENT_ATTRIBUTES },
      {
        model: GiaoHang,
        required: false,
        attributes: DELIVERY_ATTRIBUTES,
        include: [
          {
            model: NhanVienGiaoHang,
            required: false,
            attributes: DELIVERY_STAFF_ATTRIBUTES,
            include: [{ model: NguoiDung, required: false, attributes: USER_ATTRIBUTES }],
          },
          { model: KhoHang, required: false },
        ],
      },
      {
        model: HoSoKhachHang,
        required: false,
        attributes: [
          "id_ho_so",
          "id_vu_nuoi",
          "dinh_muc_cong_no",
          "han_thanh_toan",
          "duoc_phep_tra_sau",
          "bi_khoa_tra_sau",
          "ly_do_khoa",
          "trang_thai_ho_so",
        ],
      },
    ],
  });
};

const findByUserId = (id_nguoi_dung) => {
  return DonHang.findAll({
    where: { id_nguoi_dung },
    attributes: ORDER_ATTRIBUTES,
    include: [
      { model: KhoHang, required: false },
      {
        model: ChiTietDonHang,
        attributes: ORDER_DETAIL_ATTRIBUTES,
        include: [{ model: SanPham, attributes: PRODUCT_ORDER_ATTRIBUTES }],
      },
      { model: ThanhToan, attributes: PAYMENT_ATTRIBUTES },
      {
        model: HoSoKhachHang,
        required: false,
        attributes: ["id_ho_so", "han_thanh_toan", "dinh_muc_cong_no"],
      },
    ],
    order: [["id_don_hang", "DESC"]],
  });
};

const findAll = () => {
  return DonHang.findAll({
    attributes: ORDER_ATTRIBUTES,
    include: [
      { model: NguoiDung, attributes: USER_ATTRIBUTES },
      { model: KhoHang, required: false },
      {
        model: ChiTietDonHang,
        attributes: ORDER_DETAIL_ATTRIBUTES,
        include: [{ model: SanPham, attributes: PRODUCT_ORDER_ATTRIBUTES }],
      },
      { model: ThanhToan, attributes: PAYMENT_ATTRIBUTES },
      {
        model: HoSoKhachHang,
        required: false,
        attributes: ["id_ho_so", "han_thanh_toan", "dinh_muc_cong_no"],
      },
    ],
    order: [["id_don_hang", "DESC"]],
  });
};

const updateStatus = async (id_don_hang, trang_thai_don_hang) => {
  const data = { trang_thai_don_hang };

  if (trang_thai_don_hang === "da_thanh_toan") {
    data.ngay_duyet = new Date();
  }

  if (trang_thai_don_hang === "hoan_tat") {
    data.ngay_giao = new Date();
  }

  const [affectedRows] = await DonHang.update(data, {
    where: { id_don_hang },
  });

  if (!affectedRows) return null;

  return DonHang.findByPk(id_don_hang, { attributes: ORDER_ATTRIBUTES });
};

const updateOrder = async (order, data, transaction = null) => {
  await order.update(data, { transaction });
  return order;
};

const findOrderWithDetailsForUpdate = (id_don_hang, transaction) => {
  return DonHang.findByPk(id_don_hang, {
    attributes: ORDER_ATTRIBUTES,
    include: [
      {
        model: ChiTietDonHang,
        attributes: ORDER_DETAIL_ATTRIBUTES,
      },
      {
        model: ThanhToan,
        required: false,
        attributes: PAYMENT_ATTRIBUTES,
      },
    ],
    transaction,
    lock: transaction ? transaction.LOCK.UPDATE : undefined,
  });
};

const findApprovedPostpaidProfile = (id_nguoi_dung, id_vu_nuoi, transaction) => {
  return HoSoKhachHang.findOne({
    where: {
      id_nguoi_dung,
      id_vu_nuoi,
      duoc_phep_tra_sau: true,
      trang_thai_ho_so: "da_duyet",
    },
    attributes: [
      "id_ho_so",
      "id_nguoi_dung",
      "id_ao",
      "id_vu_nuoi",
      "id_chinh_sach",
      "dinh_muc_cong_no",
      "han_thanh_toan",
      "duoc_phep_tra_sau",
      "bi_khoa_tra_sau",
      "ly_do_khoa",
      "trang_thai_ho_so",
    ],
    transaction,
    lock: transaction ? true : undefined,
  });
};

const getPaidAmountByOrderIds = async (orderIds, transaction) => {
  if (!orderIds.length) return 0;

  const details = await ChiTietThanhToanCongNo.findAll({
    where: {
      id_don_hang: { [Op.in]: orderIds },
    },
    attributes: ["so_tien_phan_bo"],
    include: [
      {
        model: ThanhToanCongNo,
        required: true,
        attributes: [],
        where: { trang_thai: "thanh_cong" },
      },
    ],
    transaction,
  });

  return details.reduce(
    (sum, item) => sum + toNumber(item.so_tien_phan_bo),
    0
  );
};

const getUsedCreditByProfileId = async (id_ho_so, transaction) => {
  const orders = await DonHang.findAll({
    where: {
      id_ho_so,
      hinh_thuc_thanh_toan: "tra_sau",
      trang_thai_don_hang: {
        [Op.in]: ACTIVE_POSTPAID_ORDER_STATUS,
      },
    },
    attributes: ["id_don_hang", "tong_thanh_toan"],
    transaction,
  });

  const plainOrders = orders.map((order) => order.toJSON());

  const totalPostpaid = plainOrders.reduce(
    (sum, order) => sum + toNumber(order.tong_thanh_toan),
    0
  );

  const paidAmount = await getPaidAmountByOrderIds(
    plainOrders.map((order) => order.id_don_hang),
    transaction
  );

  return Math.max(totalPostpaid - paidAmount, 0);
};

const cancelMyOrder = async (userId, orderId) => {
  const order = await DonHang.findOne({
    where: {
      id_don_hang: orderId,
      id_nguoi_dung: userId,
    },
    attributes: ORDER_ATTRIBUTES,
    include: [
      {
        model: ChiTietDonHang,
        required: false,
        attributes: ORDER_DETAIL_ATTRIBUTES,
        include: [
          { model: SanPham, required: false, attributes: PRODUCT_ORDER_ATTRIBUTES },
        ],
      },
      {
        model: ThanhToan,
        required: false,
        attributes: PAYMENT_ATTRIBUTES,
      },
    ],
  });

  if (!order) {
    throw new Error("Không tìm thấy đơn hàng hoặc bạn không có quyền hủy");
  }

  const allowedStatus = ["cho_xu_ly", "cho_thanh_toan"];

  if (!allowedStatus.includes(order.trang_thai_don_hang)) {
    throw new Error("Chỉ có thể hủy đơn hàng khi đơn còn chờ xử lý hoặc chờ thanh toán");
  }

  await order.update({ trang_thai_don_hang: "da_huy" });

  return order;
};

module.exports = {
  createOrder,
  createOrderDetails,
  findProductById,
  findPondForOrder,
  findDeliveryAddressForOrder,
  createPayment,
  findById,
  findByUserId,
  findAll,
  updateStatus,
  updateOrder,
  findOrderWithDetailsForUpdate,
  findApprovedPostpaidProfile,
  getUsedCreditByProfileId,
  cancelMyOrder,
};
