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
  const id_ho_so = data.id_ho_so ? Number(data.id_ho_so) : null;

  if (!amount || amount <= 0) {
    throw new Error("Số tiền thanh toán không hợp lệ");
  }

  const summary = await debtRepository.getMyDebtSummary(id_nguoi_dung);

  let maxDebt = Number(summary.cong_no_hien_tai || 0) + Number(summary.dang_giu_han_muc || 0);

  if (id_ho_so) {
    const selectedProfile = summary.han_muc_theo_ho_so.find(
      (item) => Number(item.id_ho_so) === Number(id_ho_so)
    );

    if (!selectedProfile) {
      throw new Error("Không tìm thấy hồ sơ công nợ");
    }

    maxDebt =
      Number(selectedProfile.cong_no_hien_tai || 0) +
      Number(selectedProfile.dang_giu_han_muc || 0);
  }

  if (maxDebt <= 0) {
    throw new Error("Không có công nợ cần thanh toán");
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

const allocateDebtPayment = async (debtPayment, amount) => {
  const transaction = await sequelize.transaction();

  try {
    const whereOrder = {
      id_nguoi_dung: debtPayment.id_nguoi_dung,
      hinh_thuc_thanh_toan: "tra_sau",
      trang_thai_don_hang: {
        [Op.notIn]: ["da_huy", "giao_that_bai"],
      },
    };

    const includeVuNuoi = {
      model: VuNuoi,
      required: true,
      include: [
        {
          model: HoSoKhachHang,
          required: true,
          where: debtPayment.id_ho_so
            ? { id_ho_so: debtPayment.id_ho_so }
            : undefined,
        },
      ],
    };

    const orders = await DonHang.findAll({
      where: whereOrder,
      include: [includeVuNuoi],
      order: [["ngay_dat", "ASC"]],
      transaction,
    });

    let remaining = Number(amount);

    for (const order of orders) {
      if (remaining <= 0) break;

      const paidDetails = await ChiTietThanhToanCongNo.findAll({
        where: {
          id_don_hang: order.id_don_hang,
        },
        include: [
          {
            model: ThanhToanCongNo,
            required: true,
            where: {
              trang_thai: "thanh_cong",
            },
          },
        ],
        transaction,
      });

      const daThanhToan = paidDetails.reduce(
        (sum, item) => sum + Number(item.so_tien_phan_bo || 0),
        0
      );

      const tongTien = Number(order.tong_thanh_toan || 0);
      const conLai = Math.max(tongTien - daThanhToan, 0);

      if (conLai <= 0) continue;

      const allocateAmount = Math.min(remaining, conLai);

      await ChiTietThanhToanCongNo.create(
        {
          id_thanh_toan_cong_no: debtPayment.id_thanh_toan_cong_no,
          id_don_hang: order.id_don_hang,
          so_tien_phan_bo: allocateAmount,
          ngay_phan_bo: new Date(),
        },
        { transaction }
      );

      remaining -= allocateAmount;
    }

    await debtPayment.update(
      {
        trang_thai: "thanh_cong",
        ngay_thanh_toan: new Date(),
      },
      { transaction }
    );

    await transaction.commit();

    return debtPayment;
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