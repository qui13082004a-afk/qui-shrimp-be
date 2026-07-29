const { Op } = require("sequelize");
const { sequelize } = require("../../config/database");
const payOS = require("../../config/payos");

const {
  DonHang,
  ThanhToanCongNo,
  ChiTietThanhToanCongNo,
  VuNuoi,
  AoNuoi,
  HoSoKhachHang,
} = require("../models");

const debtRepository = require("./debt.repository");

const createPartialDebtPayment = async (id_nguoi_dung, data) => {
  const amount = Math.round(Number(data.so_tien || 0));
  const id_ho_so = data.id_ho_so ? Number(data.id_ho_so) : null;

  if (!amount || amount <= 0) {
    throw new Error("Số tiền thanh toán không hợp lệ");
  }

  const summary = await debtRepository.getMyDebtSummary(id_nguoi_dung);

  let maxDebt = Number(
    summary.tong_phai_thanh_toan || summary.cong_no_hien_tai || 0
  );

  if (id_ho_so) {
    const selectedProfile = summary.han_muc_theo_ho_so.find(
      (item) => Number(item.id_ho_so) === Number(id_ho_so)
    );

    if (!selectedProfile) {
      throw new Error("Không tìm thấy hồ sơ công nợ");
    }

    maxDebt = Number(
      selectedProfile.tong_phai_thanh_toan ||
        selectedProfile.cong_no_hien_tai ||
        0
    );
  }

  if (maxDebt <= 0) {
    throw new Error("Không có công nợ hiện tại cần thanh toán");
  }

  if (amount > maxDebt) {
    throw new Error("Số tiền thanh toán vượt quá công nợ hiện tại");
  }

  const debtPayment = await ThanhToanCongNo.create({
    id_nguoi_dung,
    id_ho_so,
    so_tien: amount,
    trang_thai: "cho_thanh_toan",
  });

  const orderCode = Number(
    `${debtPayment.id_thanh_toan_cong_no}${Date.now().toString().slice(-6)}`
  );

  const result = await payOS.paymentRequests.create({
    orderCode,
    amount,
    description: `CN${id_nguoi_dung}`,
    returnUrl: `${process.env.FRONTEND_URL}/debt/payment-success?orderCode=${orderCode}`,
    cancelUrl: `${process.env.FRONTEND_URL}/debt/payment-cancel?orderCode=${orderCode}`,
  });

  await debtPayment.update({ ma_giao_dich: String(orderCode) });

  return {
    checkoutUrl: result.checkoutUrl,
    orderCode,
    amount,
  };
};

const getMyDebtPayments = (id_nguoi_dung) => {
  return ThanhToanCongNo.findAll({
    where: { id_nguoi_dung },
    attributes: [
      "id_thanh_toan_cong_no",
      "id_nguoi_dung",
      "id_ho_so",
      "so_tien",
      "ma_giao_dich",
      "trang_thai",
      "ngay_tao",
      "ngay_thanh_toan",
    ],
    include: [
      {
        model: HoSoKhachHang,
        required: false,
        attributes: ["id_ho_so", "id_ao", "id_vu_nuoi", "han_thanh_toan"],
        include: [
          { model: AoNuoi, required: false, attributes: ["id_ao", "ten_ao"] },
          { model: VuNuoi, required: false, attributes: ["id_vu_nuoi", "ten_vu_nuoi"] },
        ],
      },
      {
        model: ChiTietThanhToanCongNo,
        required: false,
        attributes: [
          "id_chi_tiet_thanh_toan_cong_no",
          "id_thanh_toan_cong_no",
          "id_don_hang",
          "so_tien_phan_bo",
          "ngay_phan_bo",
        ],
        include: [
          {
            model: DonHang,
            required: false,
            attributes: ["id_don_hang", "id_vu_nuoi", "tong_thanh_toan", "ngay_dat"],
            include: [
              {
                model: VuNuoi,
                required: false,
                attributes: ["id_vu_nuoi", "ten_vu_nuoi"],
                include: [{ model: AoNuoi, required: false, attributes: ["id_ao", "ten_ao"] }],
              },
            ],
          },
        ],
      },
    ],
    order: [["ngay_tao", "DESC"]],
  });
};

const getDebtPaymentDetail = async (id_nguoi_dung, id_thanh_toan_cong_no) => {
  const data = await ThanhToanCongNo.findOne({
    where: { id_thanh_toan_cong_no, id_nguoi_dung },
    include: [
      {
        model: ChiTietThanhToanCongNo,
        required: false,
        include: [
          {
            model: DonHang,
            attributes: ["id_don_hang", "tong_thanh_toan", "ngay_dat", "trang_thai_don_hang"],
          },
        ],
      },
    ],
  });

  if (!data) {
    throw new Error("Không tìm thấy giao dịch thanh toán công nợ");
  }

  return data;
};

const findPendingDebtPaymentByOrderCode = (orderCode) => {
  return ThanhToanCongNo.findOne({
    where: {
      ma_giao_dich: String(orderCode),
      trang_thai: "cho_thanh_toan",
    },
  });
};

const findDebtPaymentByOrderCode = (orderCode) => {
  return ThanhToanCongNo.findOne({
    where: { ma_giao_dich: String(orderCode) },
  });
};

const allocateDebtPayment = async (debtPayment, amount, options = {}) => {
  const transaction = await sequelize.transaction();

  try {
    if (!debtPayment) {
      throw new Error("Không tìm thấy giao dịch công nợ cần phân bổ");
    }

    const lockedDebtPayment = await ThanhToanCongNo.findByPk(
      debtPayment.id_thanh_toan_cong_no,
      {
        transaction,
        lock: transaction.LOCK.UPDATE,
      }
    );

    if (!lockedDebtPayment) {
      throw new Error("Khong tim thay giao dich cong no can phan bo");
    }

    if (lockedDebtPayment.trang_thai === "thanh_cong") {
      await transaction.commit();
      return lockedDebtPayment;
    }

    const paidAmount = Math.round(Number(amount || 0));
    const expectedAmount = Math.round(Number(lockedDebtPayment.so_tien || 0));

    if (paidAmount !== expectedAmount) {
      throw new Error("Số tiền PayOS gửi về không khớp với phiếu công nợ");
    }

    const profileWhere = lockedDebtPayment.id_ho_so
      ? { id_ho_so: lockedDebtPayment.id_ho_so }
      : undefined;

    const orders = await DonHang.findAll({
      where: {
        id_nguoi_dung: lockedDebtPayment.id_nguoi_dung,
        hinh_thuc_thanh_toan: "tra_sau",
        trang_thai_don_hang: options.onlyCompleted
          ? "hoan_tat"
          : { [Op.notIn]: ["da_huy", "giao_that_bai"] },
      },
      attributes: ["id_don_hang", "tong_thanh_toan", "ngay_dat"],
      include: [
        {
          model: VuNuoi,
          required: true,
          attributes: ["id_vu_nuoi"],
          include: [
            {
              model: HoSoKhachHang,
              required: true,
              attributes: ["id_ho_so"],
              where: profileWhere,
            },
          ],
        },
      ],
      order: [["ngay_dat", "ASC"]],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    const orderIds = orders.map((order) => order.id_don_hang);

    if (orderIds.length === 0) {
      throw new Error("Không có đơn công nợ để phân bổ");
    }

    const paidDetails = await ChiTietThanhToanCongNo.findAll({
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
      transaction,
    });

    const paidMap = new Map();

    for (const item of paidDetails) {
      const id = Number(item.id_don_hang);
      paidMap.set(id, (paidMap.get(id) || 0) + Number(item.so_tien_phan_bo || 0));
    }

    let remaining = paidAmount;
    const allocationRows = [];

    for (const order of orders) {
      if (remaining <= 0) break;

      const daThanhToan = paidMap.get(Number(order.id_don_hang)) || 0;
      const tongTien = Number(order.tong_thanh_toan || 0);
      const conLai = Math.max(tongTien - daThanhToan, 0);

      if (conLai <= 0) continue;

      const allocateAmount = Math.min(remaining, conLai);

      allocationRows.push({
        id_thanh_toan_cong_no: lockedDebtPayment.id_thanh_toan_cong_no,
        id_don_hang: order.id_don_hang,
        so_tien_phan_bo: allocateAmount,
        ngay_phan_bo: new Date(),
      });

      remaining -= allocateAmount;
    }

    // Phan remaining neu con sau khi phan bo het no goc duoc xem la tien lai qua han da thu.

    await ChiTietThanhToanCongNo.bulkCreate(allocationRows, { transaction });

    await lockedDebtPayment.update(
      {
        trang_thai: "thanh_cong",
        ngay_thanh_toan: new Date(),
      },
      { transaction }
    );

    await transaction.commit();

    return lockedDebtPayment;
  } catch (error) {
    await transaction.rollback();
    console.error("ALLOCATE DEBT PAYMENT ERROR:", error.message);
    throw error;
  }
};

const createAdminDirectDebtPayment = async (data) => {
  const id_ho_so = Number(data.id_ho_so || 0);
  const amount = Math.round(Number(data.so_tien || 0));

  if (!id_ho_so) {
    throw new Error("Vui long chon ho so cong no");
  }
  if (!amount || amount <= 0) {
    throw new Error("So tien thanh toan khong hop le");
  }

  const detail = await debtRepository.getAdminDebtProfileDetail(id_ho_so);
  const maxDebt = Number(
    detail.tong_phai_thanh_toan || detail.cong_no_hien_tai || 0
  );

  if (maxDebt <= 0) {
    throw new Error("Khach hang khong co cong no hien tai can thanh toan");
  }
  if (amount > maxDebt) {
    throw new Error("So tien thanh toan vuot qua cong no hien tai");
  }

  const debtPayment = await ThanhToanCongNo.create({
    id_nguoi_dung: detail.id_nguoi_dung,
    id_ho_so,
    so_tien: amount,
    ma_giao_dich: `ADMIN-DIRECT-${Date.now()}`,
    trang_thai: "cho_thanh_toan",
  });

  await allocateDebtPayment(debtPayment, amount, { onlyCompleted: true });

  return getDebtPaymentDetail(
    detail.id_nguoi_dung,
    debtPayment.id_thanh_toan_cong_no
  );
};

module.exports = {
  createPartialDebtPayment,
  getMyDebtPayments,
  getDebtPaymentDetail,
  findPendingDebtPaymentByOrderCode,
  findDebtPaymentByOrderCode,
  allocateDebtPayment,
  createAdminDirectDebtPayment,
};
