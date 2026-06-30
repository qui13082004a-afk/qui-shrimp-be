const { sequelize } = require("../../config/database");
const payOS = require("../../config/payos");
const { paymentRepository } = require("../repositories");

const getMyPayments = async (userId) => {
  return await paymentRepository.findByUserId(userId);
};

const getAllPayments = async (user) => {
  if (user.vai_tro !== "admin") {
    throw new Error("Bạn không có quyền truy cập dữ liệu thanh toán toàn hệ thống");
  }

  return await paymentRepository.findAll();
};

const getPaymentsByOrder = async (user, orderId) => {
  const payments = await paymentRepository.findByOrderId(orderId);

  if (!payments || payments.length === 0) {
    throw new Error("Không tìm thấy thông tin giao dịch thanh toán cho đơn hàng này");
  }

  const order = payments[0].DonHang;

  if (
    user.vai_tro !== "admin" &&
    Number(order.id_nguoi_dung) !== Number(user.id_nguoi_dung)
  ) {
    throw new Error("Bạn không có quyền truy cập dữ liệu thanh toán của đơn hàng này");
  }

  return payments;
};

const confirmPayment = async (user, paymentId, data) => {
  const transaction = await sequelize.transaction();

  try {
    if (user.vai_tro !== "admin" && user.vai_tro !== "nhan_vien_giao_hang") {
      throw new Error("Bạn không có quyền thực hiện xác nhận giao dịch thanh toán này");
    }

    const payment = await paymentRepository.findById(paymentId);

    if (!payment) {
      throw new Error("Không tìm thấy thông tin giao dịch thanh toán yêu cầu");
    }

    if (payment.trang_thai === "thanh_cong") {
      throw new Error("Giao dịch thanh toán này đã được xác nhận thành công trước đó");
    }

    if (
      user.vai_tro === "nhan_vien_giao_hang" &&
      payment.phuong_thuc === "chuyen_khoan"
    ) {
      throw new Error("Nhân viên giao hàng không có thẩm quyền duyệt xác nhận thanh toán chuyển khoản");
    }

    const order = payment.DonHang;

    if (!order) {
      throw new Error("Không tìm thấy thông tin đơn hàng liên kết với thanh toán này");
    }

    if (payment.phuong_thuc === "cod" && !data.anh_bien_nhan) {
      throw new Error("Giao hàng COD thành công bắt buộc phải tải ảnh biên nhận");
    }

    if (payment.phuong_thuc === "tra_sau" && !data.anh_hop_dong) {
      throw new Error("Giao hàng trả sau bắt buộc phải tải ảnh hợp đồng đã ký");
    }

    await paymentRepository.updatePayment(
      payment,
      {
        trang_thai: "thanh_cong",
        ma_giao_dich: data.ma_giao_dich || payment.ma_giao_dich,
        ngay_thanh_toan: new Date(),
      },
      transaction
    );

    let newOrderStatus = order.trang_thai_don_hang;

    if (payment.phuong_thuc === "cod") {
      newOrderStatus = "hoan_tat";

      await paymentRepository.updateDeliveryByOrderId(
        order.id_don_hang,
        {
          trang_thai: "giao_thanh_cong",
          anh_bien_nhan: data.anh_bien_nhan,
          ghi_chu: data.ghi_chu || "Đã giao hàng thành công và thu đủ tiền COD",
          thoi_gian_giao: new Date(),
        },
        transaction
      );
    }

    if (payment.phuong_thuc === "chuyen_khoan") {
      newOrderStatus = "cho_giao";
    }

    if (payment.phuong_thuc === "tra_sau") {
      newOrderStatus = "hoan_tat";

      await paymentRepository.updateDeliveryByOrderId(
        order.id_don_hang,
        {
          trang_thai: "giao_thanh_cong",
          anh_hop_dong: data.anh_hop_dong,
          ghi_chu: data.ghi_chu || "Đã giao hàng thành công và khách đã ký hợp đồng",
          thoi_gian_giao: new Date(),
        },
        transaction
      );

      await paymentRepository.updateContractByOrderId(
        order.id_don_hang,
        {
          trang_thai: "da_ky",
          file_hop_dong: data.anh_hop_dong,
          ngay_ky: new Date(),
        },
        transaction
      );
    }

    await paymentRepository.updateOrder(
      order,
      {
        trang_thai_don_hang: newOrderStatus,
        ngay_giao: newOrderStatus === "hoan_tat" ? new Date() : order.ngay_giao,
      },
      transaction
    );

    await transaction.commit();

    return await paymentRepository.findById(paymentId);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const createPayOSPayment = async (user, paymentId) => {
  const payment = await paymentRepository.findById(paymentId);

  if (!payment) {
    throw new Error("Không tìm thấy thông tin giao dịch thanh toán");
  }

  if (payment.trang_thai === "thanh_cong") {
    throw new Error("Giao dịch thanh toán này đã hoàn tất từ trước");
  }

  if (payment.phuong_thuc !== "chuyen_khoan") {
    throw new Error("Chỉ giao dịch chuyển khoản mới được thanh toán bằng payOS");
  }

  const order = payment.DonHang;

  if (!order) {
    throw new Error("Không tìm thấy đơn hàng liên kết với thanh toán này");
  }

  if (Number(order.id_nguoi_dung) !== Number(user.id_nguoi_dung)) {
    throw new Error("Bạn không có quyền thanh toán đơn hàng này");
  }

  if (!order.NguoiDung || order.NguoiDung.trang_thai_tai_khoan !== "hoat_dong") {
    throw new Error("Tài khoản đặt hàng đã bị khóa hoặc chưa được xác thực");
  }

  const amount = Math.round(Number(payment.so_tien));

  if (!amount || amount <= 0) {
    throw new Error("Số tiền thanh toán không hợp lệ");
  }

  const orderCode = Number(`${paymentId}${Date.now().toString().slice(-6)}`);

  const paymentData = {
    orderCode,
    amount,
    description: `DH${order.id_don_hang}`,
    returnUrl: `${process.env.FRONTEND_URL}/payment-success?paymentId=${paymentId}&orderId=${order.id_don_hang}`,
    cancelUrl: `${process.env.FRONTEND_URL}/payment-cancel?paymentId=${paymentId}&orderId=${order.id_don_hang}`,
  };

 const result = await payOS.paymentRequests.create(paymentData);
  await paymentRepository.updatePayment(payment, {
    ma_giao_dich: String(orderCode),
  });

  return {
    checkoutUrl: result.checkoutUrl,
    orderCode,
  };
};

const handlePayOSWebhook = async (webhookBody) => {
  let verifiedData;

  try {
    verifiedData = payOS.webhooks.verify(webhookBody);
  } catch (error) {
    console.error("PAYOS VERIFY ERROR:", error.message);
    return {
      success: true,
      message: "Webhook URL hoạt động",
    };
  }

  const paymentData = verifiedData.data || verifiedData;

  const orderCode = paymentData.orderCode;
  const amount = Number(paymentData.amount);
  const code = paymentData.code;

  console.log("PAYOS DATA:", paymentData);

  const transaction = await sequelize.transaction();

  try {
    const allPayments = await paymentRepository.findAll();

    const payment = allPayments.find(
      (item) => String(item.ma_giao_dich) === String(orderCode)
    );

    if (!payment) {
      await transaction.rollback();
      console.log("Không tìm thấy payment với orderCode:", orderCode);

      return {
        success: true,
        message: "Không tìm thấy giao dịch thanh toán payOS",
      };
    }

    if (payment.trang_thai === "thanh_cong") {
      await transaction.rollback();

      return {
        success: true,
        message: "Giao dịch đã được xử lý trước đó",
      };
    }

    const order = payment.DonHang;

    if (!order) {
      throw new Error("Không tìm thấy đơn hàng liên kết");
    }

    if (code !== "00") {
      await paymentRepository.updatePayment(
        payment,
        { trang_thai: "that_bai" },
        transaction
      );

      await paymentRepository.updateOrder(
        order,
        { trang_thai_don_hang: "cho_thanh_toan" },
        transaction
      );

      await transaction.commit();

      return {
        success: true,
        message: "Thanh toán payOS thất bại",
      };
    }

    if (Math.round(Number(payment.so_tien)) !== amount) {
      throw new Error("Số tiền payOS gửi về không khớp với đơn hàng");
    }

    await paymentRepository.updatePayment(
      payment,
      {
        trang_thai: "thanh_cong",
        ma_giao_dich: String(orderCode),
        ngay_thanh_toan: new Date(),
      },
      transaction
    );

    await paymentRepository.updateOrder(
      order,
      {
        trang_thai_don_hang: "cho_giao",
      },
      transaction
    );

    await transaction.commit();

    return {
      success: true,
      message: "Thanh toán payOS thành công, đơn hàng chuyển sang chờ giao",
    };
  } catch (error) {
    await transaction.rollback();
    console.error("PAYOS WEBHOOK ERROR:", error.message);
    throw error;
  }
};
const failPayment = async (user, paymentId, data) => {
  if (user.vai_tro !== "admin") {
    throw new Error("Chỉ quản trị viên mới có quyền đánh dấu giao dịch thất bại");
  }

  const transaction = await sequelize.transaction();

  try {
    const payment = await paymentRepository.findById(paymentId);

    if (!payment) {
      throw new Error("Không tìm thấy thông tin giao dịch thanh toán");
    }

    if (payment.trang_thai === "thanh_cong") {
      throw new Error("Giao dịch này đã thanh toán thành công, không thể đánh dấu thất bại");
    }

    await paymentRepository.updatePayment(
      payment,
      {
        trang_thai: "that_bai",
        ma_giao_dich: data.ma_giao_dich || payment.ma_giao_dich,
      },
      transaction
    );

    const order = payment.DonHang;

    if (payment.phuong_thuc === "chuyen_khoan") {
      await paymentRepository.updateOrder(
        order,
        {
          trang_thai_don_hang: "cho_thanh_toan",
        },
        transaction
      );
    }

    if (payment.phuong_thuc === "cod") {
      await paymentRepository.updateOrder(
        order,
        {
          trang_thai_don_hang: "giao_that_bai",
        },
        transaction
      );
    }

    await transaction.commit();

    return await paymentRepository.findById(paymentId);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

module.exports = {
  getMyPayments,
  getAllPayments,
  getPaymentsByOrder,
  confirmPayment,
  createPayOSPayment,
  handlePayOSWebhook,
  failPayment,
};