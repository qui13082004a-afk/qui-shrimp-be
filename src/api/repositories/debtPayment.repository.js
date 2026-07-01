const { sequelize } = require("../../config/database");
const payOS = require("../../config/payos");

const {
  DonHang,
  ThanhToan,
  ThanhToanCongNo,
  ChiTietThanhToanCongNo,
} = require("../models");

const debtRepository = require("./debt.repository");

const createPartialDebtPayment = async (id_nguoi_dung, data) => {
  const amount = Math.round(Number(data.so_tien || 0));

  if (!amount || amount <= 0) {
    throw new Error("Số tiền thanh toán không hợp lệ");
  }

  const summary = await debtRepository.getMyDebtSummary(id_nguoi_dung);
  const currentDebt = Number(summary.cong_no_hien_tai || 0);

  if (currentDebt <= 0) {
    throw new Error("Bạn hiện không có công nợ cần thanh toán");
  }

  if (amount > currentDebt) {
    throw new Error("Số tiền thanh toán vượt quá công nợ hiện tại");
  }

  const debtPayment = await ThanhToanCongNo.create({
    id_nguoi_dung,
    so_tien: amount,
    trang_thai: "cho_thanh_toan",
  });

  const orderCode = Number(
    `${debtPayment.id_thanh_toan_cong_no}${Date.now()
      .toString()
      .slice(-6)}`
  );

  const paymentData = {
    orderCode,
    amount,
    description: `CN${id_nguoi_dung}`,
    returnUrl: `${process.env.FRONTEND_URL}/debt/payment-success?orderCode=${orderCode}`,
    cancelUrl: `${process.env.FRONTEND_URL}/debt/payment-cancel?orderCode=${orderCode}`,
  };

  const result = await payOS.paymentRequests.create(paymentData);

  await debtPayment.update({
    ma_giao_dich: String(orderCode),
  });

  return {
    checkoutUrl: result.checkoutUrl,
    orderCode,
    amount,
  };
};

const getMyDebtPayments = async (id_nguoi_dung) => {
  return await ThanhToanCongNo.findAll({
    where: { id_nguoi_dung },
    include: [
      {
        model: ChiTietThanhToanCongNo,
        required: false,
        include: [{ model: DonHang }],
      },
    ],
    order: [["ngay_tao", "DESC"]],
  });
};

const getDebtPaymentDetail = async (id_nguoi_dung, id_thanh_toan_cong_no) => {
  const data = await ThanhToanCongNo.findOne({
    where: {
      id_thanh_toan_cong_no,
      id_nguoi_dung,
    },
    include: [
      {
        model: ChiTietThanhToanCongNo,
        required: false,
        include: [{ model: DonHang }],
      },
    ],
  });

  if (!data) {
    throw new Error("Không tìm thấy giao dịch thanh toán công nợ");
  }

  return data;
};

const findPendingDebtPaymentByOrderCode = async (orderCode) => {
  return await ThanhToanCongNo.findOne({
    where: {
      ma_giao_dich: String(orderCode),
      trang_thai: "cho_thanh_toan",
    },
  });
};

const allocateDebtPayment = async (debtPayment, paidAmount) => {
  const transaction = await sequelize.transaction();

  try {
    let remainingAmount = Number(paidAmount);

    const debtOrders = await DonHang.findAll({
      where: {
        id_nguoi_dung: debtPayment.id_nguoi_dung,
        hinh_thuc_thanh_toan: "tra_sau",
        trang_thai_don_hang: "hoan_tat",
      },
      include: [{ model: ThanhToan }],
      order: [["ngay_dat", "ASC"]],
      transaction,
    });

    for (const order of debtOrders) {
      if (remainingAmount <= 0) break;

      const totalPaid = (order.ThanhToans || [])
        .filter(
          (payment) =>
            payment.trang_thai === "thanh_cong" &&
            payment.phuong_thuc === "tra_sau"
        )
        .reduce((sum, payment) => sum + Number(payment.so_tien || 0), 0);

      const orderTotal = Number(order.tong_thanh_toan || 0);
      const orderDebt = Math.max(orderTotal - totalPaid, 0);

      if (orderDebt <= 0) continue;

      const allocatedAmount = Math.min(orderDebt, remainingAmount);

      await ThanhToan.create(
        {
          id_don_hang: order.id_don_hang,
          so_tien: allocatedAmount,
          phuong_thuc: "tra_sau",
          trang_thai: "thanh_cong",
          ma_giao_dich: debtPayment.ma_giao_dich,
          ngay_thanh_toan: new Date(),
        },
        { transaction }
      );

      await ChiTietThanhToanCongNo.create(
        {
          id_thanh_toan_cong_no: debtPayment.id_thanh_toan_cong_no,
          id_don_hang: order.id_don_hang,
          so_tien_phan_bo: allocatedAmount,
          ngay_phan_bo: new Date(),
        },
        { transaction }
      );

      remainingAmount -= allocatedAmount;
    }

    await debtPayment.update(
      {
        trang_thai: "thanh_cong",
        ngay_thanh_toan: new Date(),
      },
      { transaction }
    );

    await transaction.commit();

    return {
      success: true,
      remainingAmount,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

module.exports = {
  createPartialDebtPayment,
  getMyDebtPayments,
  getDebtPaymentDetail,
  findPendingDebtPaymentByOrderCode,
  allocateDebtPayment,
};