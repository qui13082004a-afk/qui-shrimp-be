const {
  DonHang,
  ChiTietDonHang,
  SanPham,
  NguoiDung,
  ThanhToan,
  HoSoKhachHang,
} = require("../models");
const { Op } = require("sequelize");

const ORDER_ATTRIBUTES = [
  "id_don_hang",
  "id_nguoi_dung",
  "id_vu_nuoi",
  "tong_tien",
  "phi_van_chuyen",
  "tong_thanh_toan",
  "hinh_thuc_thanh_toan",
  "trang_thai_don_hang",
  "dia_chi_giao_hang",
  "ghi_chu",
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

const PAYMENT_ATTRIBUTES = [
  "id_thanh_toan",
  "id_don_hang",
  "so_tien",
  "phuong_thuc",
  "ma_giao_dich",
  "trang_thai",
  "ngay_thanh_toan",
];

const getSafePagination = (page, limit) => {
  if (!page && !limit) return {};

  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);

  return {
    limit: safeLimit,
    offset: (safePage - 1) * safeLimit,
  };
};

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
      "ton_kho",
      "trang_thai",
    ],
    transaction,
  });
};

const updateProductStock = async (product, newStock, transaction) => {
  product.ton_kho = newStock;

  if (newStock <= 0) {
    product.trang_thai = "het_hang";
  }

  return product.save({ transaction });
};

const createPayment = (data, transaction) => {
  return ThanhToan.create(data, { transaction });
};

const findById = (id_don_hang) => {
  return DonHang.findByPk(id_don_hang, {
    attributes: ORDER_ATTRIBUTES,
    include: [
      { model: NguoiDung, attributes: USER_ATTRIBUTES },
      {
        model: ChiTietDonHang,
        attributes: [
          "id_chi_tiet",
          "id_don_hang",
          "id_san_pham",
          "gia_ban",
          "so_luong_dat",
          "thanh_tien",
          "trang_thai_san_pham",
        ],
        include: [{ model: SanPham, attributes: PRODUCT_ORDER_ATTRIBUTES }],
      },
      { model: ThanhToan, attributes: PAYMENT_ATTRIBUTES },
    ],
  });
};

const findByUserId = (id_nguoi_dung, options = {}) => {
  return DonHang.findAll({
    where: { id_nguoi_dung },
    attributes: ORDER_ATTRIBUTES,
    include: [
      {
        model: ChiTietDonHang,
        attributes: [
          "id_chi_tiet",
          "id_don_hang",
          "id_san_pham",
          "gia_ban",
          "so_luong_dat",
          "thanh_tien",
          "trang_thai_san_pham",
        ],
        include: [{ model: SanPham, attributes: PRODUCT_ORDER_ATTRIBUTES }],
      },
      { model: ThanhToan, attributes: PAYMENT_ATTRIBUTES },
    ],
    order: [["id_don_hang", "DESC"]],
    ...getSafePagination(options.page, options.limit),
  });
};

const findAll = (options = {}) => {
  return DonHang.findAll({
    attributes: ORDER_ATTRIBUTES,
    include: [
      { model: NguoiDung, attributes: USER_ATTRIBUTES },
      {
        model: ChiTietDonHang,
        attributes: [
          "id_chi_tiet",
          "id_don_hang",
          "id_san_pham",
          "gia_ban",
          "so_luong_dat",
          "thanh_tien",
          "trang_thai_san_pham",
        ],
        include: [{ model: SanPham, attributes: PRODUCT_ORDER_ATTRIBUTES }],
      },
      { model: ThanhToan, attributes: PAYMENT_ATTRIBUTES },
    ],
    order: [["id_don_hang", "DESC"]],
    ...getSafePagination(options.page, options.limit),
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

const findApprovedPostpaidProfile = (id_nguoi_dung, id_vu_nuoi) => {
  return HoSoKhachHang.findOne({
    where: {
      id_nguoi_dung,
      id_vu_nuoi,
      duoc_phep_tra_sau: true,
    },
    attributes: [
      "id_ho_so",
      "id_nguoi_dung",
      "id_ao",
      "id_vu_nuoi",
      "dinh_muc_cong_no",
      "han_thanh_toan",
    ],
  });
};

const getCurrentDebt = async (id_nguoi_dung) => {
  const result = await DonHang.sum("tong_thanh_toan", {
    where: {
      id_nguoi_dung,
      hinh_thuc_thanh_toan: "tra_sau",
      trang_thai_don_hang: "hoan_tat",
    },
  });

  return Number(result || 0);
};

const getReservedDebt = async (id_nguoi_dung) => {
  const result = await DonHang.sum("tong_thanh_toan", {
    where: {
      id_nguoi_dung,
      hinh_thuc_thanh_toan: "tra_sau",
      trang_thai_don_hang: {
        [Op.in]: ["cho_xu_ly", "cho_giao", "dang_giao"],
      },
    },
  });

  return Number(result || 0);
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
        attributes: [
          "id_chi_tiet",
          "id_don_hang",
          "id_san_pham",
          "gia_ban",
          "so_luong_dat",
          "thanh_tien",
        ],
        include: [{ model: SanPham, required: false, attributes: PRODUCT_ORDER_ATTRIBUTES }],
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
  updateProductStock,
  createPayment,
  findById,
  findByUserId,
  findAll,
  updateStatus,
  findApprovedPostpaidProfile,
  getCurrentDebt,
  getReservedDebt,
  cancelMyOrder,
};
