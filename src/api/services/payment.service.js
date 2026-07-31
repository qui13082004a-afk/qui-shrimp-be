const { sequelize } = require("../../config/database");
const payOS = require("../../config/payos");
const { paymentRepository, orderRepository } = require("../repositories");
const debtPaymentRepository = require("../repositories/debtPayment.repository");
const notificationService = require("./notification.service");
const inventoryService = require("./inventory.service");

// Lấy lịch sử thanh toán của người dùng
const getMyPayments = async (userId) => {
  return await paymentRepository.findByUserId(userId);
};

// Lấy tất cả giao dịch thanh toán
const getAllPayments = async (user) => {
  // Chỉ admin được xem toàn bộ giao dịch
  if (user.vai_tro !== "admin") {
    throw new Error(
      "Bạn không có quyền truy cập dữ liệu thanh toán toàn hệ thống"
    );
  }

  return await paymentRepository.findAll();
};

// Lấy giao dịch thanh toán theo đơn hàng
const getPaymentsByOrder = async (user, orderId) => {
  const payments = await paymentRepository.findByOrderId(orderId);

  // Kiểm tra đơn hàng có giao dịch thanh toán không
  if (!payments || payments.length === 0) {
    throw new Error(
      "Không tìm thấy thông tin giao dịch thanh toán cho đơn hàng này"
    );
  }

  const order = payments[0].DonHang;

  // Admin được xem mọi đơn, khách hàng chỉ được xem đơn của mình
  if (
    user.vai_tro !== "admin" &&
    Number(order.id_nguoi_dung) !== Number(user.id_nguoi_dung)
  ) {
    throw new Error(
      "Bạn không có quyền truy cập dữ liệu thanh toán của đơn hàng này"
    );
  }

  return payments;
};

// Xác nhận giao dịch thanh toán thành công
const confirmPayment = async (user, paymentId, data) => {
  // Transaction giúp hoàn tác dữ liệu nếu xảy ra lỗi
  const transaction = await sequelize.transaction();

  try {
    // Chỉ admin và nhân viên giao hàng được xác nhận
    if (
      user.vai_tro !== "admin" &&
      user.vai_tro !== "nhan_vien_giao_hang"
    ) {
      throw new Error(
        "Bạn không có quyền thực hiện xác nhận giao dịch thanh toán này"
      );
    }

    const payment = await paymentRepository.findById(paymentId);

    // Kiểm tra giao dịch có tồn tại không
    if (!payment) {
      throw new Error(
        "Không tìm thấy thông tin giao dịch thanh toán yêu cầu"
      );
    }

    // Không xác nhận lại giao dịch đã thành công
    if (payment.trang_thai === "thanh_cong") {
      throw new Error(
        "Giao dịch thanh toán này đã được xác nhận thành công trước đó"
      );
    }

    // Nhân viên giao hàng không được xác nhận chuyển khoản
    if (
      user.vai_tro === "nhan_vien_giao_hang" &&
      payment.phuong_thuc === "chuyen_khoan"
    ) {
      throw new Error(
        "Nhân viên giao hàng không có thẩm quyền duyệt xác nhận thanh toán chuyển khoản"
      );
    }

    const order = payment.DonHang;

    // Kiểm tra đơn hàng liên kết
    if (!order) {
      throw new Error(
        "Không tìm thấy thông tin đơn hàng liên kết với thanh toán này"
      );
    }

    // Lấy chi tiết đơn và khóa dữ liệu để tránh cập nhật trùng
    const orderWithDetails =
      await orderRepository.findOrderWithDetailsForUpdate(
        order.id_don_hang,
        transaction
      );

    // Đơn COD phải có ảnh biên nhận
    if (payment.phuong_thuc === "cod" && !data.anh_bien_nhan) {
      throw new Error(
        "Giao hàng COD thành công bắt buộc phải tải ảnh biên nhận"
      );
    }

    // Đơn trả sau phải có ảnh hợp đồng đã ký
    if (payment.phuong_thuc === "tra_sau" && !data.anh_hop_dong) {
      throw new Error(
        "Giao hàng trả sau bắt buộc phải tải ảnh hợp đồng đã ký"
      );
    }

    // Cập nhật giao dịch thành công
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
    let notificationTitle = "Thanh toán thành công";
    let notificationContent =
      `Đơn hàng #${order.id_don_hang} đã được xác nhận thanh toán thành công.`;

    // Xử lý đơn COD
    if (payment.phuong_thuc === "cod") {
      newOrderStatus = "hoan_tat";
      notificationContent =
        `Đơn hàng #${order.id_don_hang} đã giao thành công và thu đủ tiền COD.`;

      // Xác nhận hàng đã xuất khỏi kho
      if (order.trang_thai_don_hang !== "hoan_tat") {
        await inventoryService.confirmInventory({
          order: orderWithDetails,
          transaction,
        });
      }

      // Cập nhật thông tin giao hàng
      await paymentRepository.updateDeliveryByOrderId(
        order.id_don_hang,
        {
          trang_thai: "giao_thanh_cong",
          id_kho_xuat: order.id_kho_xuat || null,
          anh_bien_nhan: data.anh_bien_nhan,
          ghi_chu:
            data.ghi_chu ||
            "Đã giao hàng thành công và thu đủ tiền COD",
          thoi_gian_giao: new Date(),
        },
        transaction
      );
    }

    // Chuyển khoản thành công thì chuyển sang chờ giao
    if (payment.phuong_thuc === "chuyen_khoan") {
      newOrderStatus = "cho_giao";
      notificationContent =
        `Đơn hàng #${order.id_don_hang} đã thanh toán thành công và đang chờ giao hàng.`;
    }

    // Xử lý đơn mua trả sau
    if (payment.phuong_thuc === "tra_sau") {
      newOrderStatus = "hoan_tat";
      notificationTitle = "Hoàn tất đơn trả sau";
      notificationContent =
        `Đơn hàng #${order.id_don_hang} đã giao thành công và hợp đồng đã được ký.`;

      // Xác nhận hàng đã xuất khỏi kho
      if (order.trang_thai_don_hang !== "hoan_tat") {
        await inventoryService.confirmInventory({
          order: orderWithDetails,
          transaction,
        });
      }

      // Cập nhật thông tin giao hàng
      await paymentRepository.updateDeliveryByOrderId(
        order.id_don_hang,
        {
          trang_thai: "giao_thanh_cong",
          id_kho_xuat: order.id_kho_xuat || null,
          anh_hop_dong: data.anh_hop_dong,
          ghi_chu:
            data.ghi_chu ||
            "Đã giao hàng thành công và khách đã ký hợp đồng",
          thoi_gian_giao: new Date(),
        },
        transaction
      );

      // Cập nhật hợp đồng thành đã ký
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

    // Cập nhật trạng thái đơn hàng
    await paymentRepository.updateOrder(
      order,
      {
        trang_thai_don_hang: newOrderStatus,
        ngay_giao:
          newOrderStatus === "hoan_tat"
            ? new Date()
            : order.ngay_giao,
      },
      transaction
    );

    // Gửi thông báo cho khách hàng
    await notificationService.createNotification({
      id_nguoi_dung: order.id_nguoi_dung,
      tieu_de: notificationTitle,
      noi_dung: notificationContent,
      loai: "thanh_toan",
      lien_ket: `/profile/orders/${order.id_don_hang}`,
      transaction,
    });

    // Lưu toàn bộ thay đổi
    await transaction.commit();

    return await paymentRepository.findById(paymentId);
  } catch (error) {
    // Có lỗi thì hoàn tác toàn bộ thay đổi
    await transaction.rollback();
    throw error;
  }
};

// Tạo đường dẫn thanh toán payOS
const createPayOSPayment = async (user, paymentId) => {
  const payment = await paymentRepository.findById(paymentId);

  // Kiểm tra giao dịch
  if (!payment) {
    throw new Error("Không tìm thấy thông tin giao dịch thanh toán");
  }

  if (payment.trang_thai === "thanh_cong") {
    throw new Error("Giao dịch thanh toán này đã hoàn tất từ trước");
  }

  // Chỉ chuyển khoản mới thanh toán bằng payOS
  if (payment.phuong_thuc !== "chuyen_khoan") {
    throw new Error(
      "Chỉ giao dịch chuyển khoản mới được thanh toán bằng payOS"
    );
  }

  const order = payment.DonHang;

  if (!order) {
    throw new Error(
      "Không tìm thấy đơn hàng liên kết với thanh toán này"
    );
  }

  // Khách chỉ được thanh toán đơn hàng của mình
  if (
    Number(order.id_nguoi_dung) !== Number(user.id_nguoi_dung)
  ) {
    throw new Error("Bạn không có quyền thanh toán đơn hàng này");
  }

  // Kiểm tra tài khoản còn hoạt động
  if (
    !order.NguoiDung ||
    order.NguoiDung.trang_thai_tai_khoan !== "hoat_dong"
  ) {
    throw new Error(
      "Tài khoản đặt hàng đã bị khóa hoặc chưa được xác thực"
    );
  }

  // Lấy số tiền cần thanh toán
  const amount = Math.round(Number(payment.so_tien));

  if (!amount || amount <= 0) {
    throw new Error("Số tiền thanh toán không hợp lệ");
  }

  // Tạo mã giao dịch riêng
  const orderCode = Number(
    `${paymentId}${Date.now().toString().slice(-6)}`
  );

  // Chuẩn bị dữ liệu gửi sang payOS
  const paymentData = {
    orderCode,
    amount,
    description: `DH${order.id_don_hang}`,
    returnUrl:
      `${process.env.FRONTEND_URL}/payment-success` +
      `?paymentId=${paymentId}&orderId=${order.id_don_hang}`,
    cancelUrl:
      `${process.env.FRONTEND_URL}/payment-cancel` +
      `?paymentId=${paymentId}&orderId=${order.id_don_hang}`,
  };

  // Tạo trang thanh toán payOS
  const result = await payOS.paymentRequests.create(paymentData);

  // Lưu mã giao dịch
  await paymentRepository.updatePayment(payment, {
    ma_giao_dich: String(orderCode),
  });

  return {
    checkoutUrl: result.checkoutUrl,
    orderCode,
  };
};

// Kiểm tra kết quả khi khách quay về từ payOS
const confirmPayOSReturn = async (user, rawOrderCode) => {
  const orderCode = Number(rawOrderCode);

  // Kiểm tra mã giao dịch
  if (!Number.isSafeInteger(orderCode) || orderCode <= 0) {
    throw new Error("Ma giao dich PayOS khong hop le");
  }

  // Tìm giao dịch công nợ hoặc giao dịch đơn hàng
  const debtPayment =
    await debtPaymentRepository.findDebtPaymentByOrderCode(
      orderCode
    );

  const orderPayment = debtPayment
    ? null
    : await paymentRepository.findByTransactionCode(orderCode);

  if (!debtPayment && !orderPayment) {
    throw new Error(
      "Khong tim thay giao dich PayOS trong he thong"
    );
  }

  // Lấy ID chủ giao dịch
  const ownerId = debtPayment
    ? debtPayment.id_nguoi_dung
    : orderPayment?.DonHang?.id_nguoi_dung;

  // Chỉ admin hoặc chủ giao dịch được xác nhận
  if (
    user.vai_tro !== "admin" &&
    Number(ownerId) !== Number(user.id_nguoi_dung)
  ) {
    throw new Error("Ban khong co quyen xac nhan giao dich nay");
  }

  const expectedAmount = Math.round(
    Number(debtPayment?.so_tien || orderPayment?.so_tien || 0)
  );

  // Lấy trạng thái thật từ payOS
  const paymentLink =
    await payOS.paymentRequests.get(orderCode);

  const payOSStatus =
    String(paymentLink.status || "").toUpperCase();

  // Nếu chưa thanh toán thì trả về trạng thái hiện tại
  if (payOSStatus !== "PAID") {
    return {
      confirmed: false,
      terminal: [
        "CANCELLED",
        "EXPIRED",
        "FAILED",
        "UNDERPAID",
      ].includes(payOSStatus),
      status: payOSStatus || "PENDING",
      message: "PayOS chua xac nhan giao dich thanh cong.",
    };
  }

  // Kiểm tra số tiền payOS trả về
  if (
    Math.round(Number(paymentLink.amount)) !== expectedAmount ||
    Math.round(Number(paymentLink.amountPaid)) !== expectedAmount
  ) {
    throw new Error(
      "So tien PayOS xac nhan khong khop voi giao dich"
    );
  }

  // Xử lý thanh toán công nợ
  if (debtPayment) {
    const alreadyProcessed =
      debtPayment.trang_thai === "thanh_cong";

    const completedDebtPayment =
      await debtPaymentRepository.allocateDebtPayment(
        debtPayment,
        expectedAmount,
        { onlyCompleted: true }
      );

    // Chỉ thông báo nếu giao dịch chưa được xử lý
    if (!alreadyProcessed) {
      await notificationService.createNotification({
        id_nguoi_dung:
          completedDebtPayment.id_nguoi_dung,
        tieu_de: "Thanh toan cong no thanh cong",
        noi_dung:
          `Ban da thanh toan cong no thanh cong voi so tien ` +
          `${expectedAmount.toLocaleString("vi-VN")}d.`,
        loai: "thanh_toan",
        lien_ket: "/debt",
      });
    }

    return {
      confirmed: true,
      type: "debt",
      alreadyProcessed,
      status: payOSStatus,
    };
  }

  // Xử lý thanh toán đơn hàng
  const transaction = await sequelize.transaction();

  try {
    // Khóa giao dịch để tránh xử lý hai lần
    const payment =
      await paymentRepository.findByTransactionCode(
        orderCode,
        {
          transaction,
          lock: transaction.LOCK.UPDATE,
        }
      );

    if (!payment || !payment.DonHang) {
      throw new Error(
        "Khong tim thay don hang lien ket voi giao dich PayOS"
      );
    }

    const alreadyProcessed =
      payment.trang_thai === "thanh_cong";

    // Chỉ cập nhật nếu chưa xử lý
    if (!alreadyProcessed) {
      await paymentRepository.updatePayment(
        payment,
        {
          trang_thai: "thanh_cong",
          ma_giao_dich: String(orderCode),
          ngay_thanh_toan: new Date(),
        },
        transaction
      );

      // Chuyển đơn sang chờ giao
      await paymentRepository.updateOrder(
        payment.DonHang,
        { trang_thai_don_hang: "cho_giao" },
        transaction
      );

      // Thông báo cho khách hàng
      await notificationService.createNotification({
        id_nguoi_dung:
          payment.DonHang.id_nguoi_dung,
        tieu_de: "Thanh toan thanh cong",
        noi_dung:
          `Don hang #${payment.DonHang.id_don_hang} ` +
          "da thanh toan thanh cong va dang cho giao hang.",
        loai: "thanh_toan",
        lien_ket:
          `/profile/orders/${payment.DonHang.id_don_hang}`,
        transaction,
      });
    }

    await transaction.commit();

    return {
      confirmed: true,
      type: "order",
      alreadyProcessed,
      status: payOSStatus,
      orderId: payment.DonHang.id_don_hang,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

// Nhận kết quả thanh toán tự động từ payOS
const handlePayOSWebhook = async (webhookBody) => {
  let verifiedData;

  try {
    // Kiểm tra dữ liệu có đúng do payOS gửi không
    verifiedData = payOS.webhooks.verify(webhookBody);
  } catch (error) {
    console.error("PAYOS VERIFY ERROR:", error.message);

    return {
      success: true,
      message: "Webhook URL hoạt động",
    };
  }

  // Lấy dữ liệu giao dịch
  const paymentData =
    webhookBody.data || verifiedData.data || verifiedData;

  const orderCode = paymentData.orderCode;
  const amount = Number(paymentData.amount);
  const code = paymentData.code;

  console.log("PAYOS DATA:", paymentData);

  // Mã khác 00 nghĩa là thanh toán không thành công
  if (code !== "00") {
    return {
      success: true,
      message: "Thanh toán payOS không thành công",
    };
  }

  // Kiểm tra giao dịch công nợ
  const debtPayment =
    await debtPaymentRepository
      .findPendingDebtPaymentByOrderCode(orderCode);

  if (debtPayment) {
    // Phân bổ tiền vào các khoản nợ
    await debtPaymentRepository.allocateDebtPayment(
      debtPayment,
      amount,
      { onlyCompleted: true }
    );

    // Thông báo thanh toán công nợ
    await notificationService.createNotification({
      id_nguoi_dung: debtPayment.id_nguoi_dung,
      tieu_de: "Thanh toán công nợ thành công",
      noi_dung:
        `Bạn đã thanh toán công nợ thành công với số tiền ` +
        `${Number(amount).toLocaleString()}đ.`,
      loai: "thanh_toan",
      lien_ket: "/debt",
    });

    return {
      success: true,
      message: "Thanh toán công nợ thành công",
    };
  }

  // Xử lý giao dịch đơn hàng
  const transaction = await sequelize.transaction();

  try {
    const allPayments =
      await paymentRepository.findAll();

    // Tìm giao dịch theo mã payOS
    const payment = allPayments.find(
      (item) =>
        String(item.ma_giao_dich) === String(orderCode)
    );

    // Không tìm thấy giao dịch
    if (!payment) {
      await transaction.rollback();

      return {
        success: true,
        message:
          "Không tìm thấy giao dịch thanh toán payOS",
      };
    }

    // Không xử lý lại giao dịch đã thành công
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

    // Kiểm tra số tiền payOS gửi về
    if (Math.round(Number(payment.so_tien)) !== amount) {
      throw new Error(
        "Số tiền payOS gửi về không khớp với đơn hàng"
      );
    }

    // Cập nhật thanh toán thành công
    await paymentRepository.updatePayment(
      payment,
      {
        trang_thai: "thanh_cong",
        ma_giao_dich: String(orderCode),
        ngay_thanh_toan: new Date(),
      },
      transaction
    );

    // Chuyển đơn hàng sang chờ giao
    await paymentRepository.updateOrder(
      order,
      {
        trang_thai_don_hang: "cho_giao",
      },
      transaction
    );

    // Thông báo cho khách hàng
    await notificationService.createNotification({
      id_nguoi_dung: order.id_nguoi_dung,
      tieu_de: "Thanh toán thành công",
      noi_dung:
        `Đơn hàng #${order.id_don_hang} đã thanh toán ` +
        "thành công và đang chờ giao hàng.",
      loai: "thanh_toan",
      lien_ket: `/profile/orders/${order.id_don_hang}`,
      transaction,
    });

    await transaction.commit();

    return {
      success: true,
      message:
        "Thanh toán payOS thành công, đơn hàng chuyển sang chờ giao",
    };
  } catch (error) {
    // Có lỗi thì hoàn tác dữ liệu
    await transaction.rollback();
    console.error("PAYOS WEBHOOK ERROR:", error.message);
    throw error;
  }
};

// Admin đánh dấu giao dịch thanh toán thất bại
const failPayment = async (user, paymentId, data) => {
  // Chỉ admin được thực hiện
  if (user.vai_tro !== "admin") {
    throw new Error(
      "Chỉ quản trị viên mới có quyền đánh dấu giao dịch thất bại"
    );
  }

  const transaction = await sequelize.transaction();

  try {
    const payment =
      await paymentRepository.findById(paymentId);

    // Kiểm tra giao dịch
    if (!payment) {
      throw new Error(
        "Không tìm thấy thông tin giao dịch thanh toán"
      );
    }

    // Giao dịch thành công không thể đổi thành thất bại
    if (payment.trang_thai === "thanh_cong") {
      throw new Error(
        "Giao dịch này đã thanh toán thành công, không thể đánh dấu thất bại"
      );
    }

    // Cập nhật trạng thái thất bại
    await paymentRepository.updatePayment(
      payment,
      {
        trang_thai: "that_bai",
        ma_giao_dich:
          data.ma_giao_dich || payment.ma_giao_dich,
      },
      transaction
    );

    const order = payment.DonHang;

    if (!order) {
      throw new Error(
        "Không tìm thấy đơn hàng liên kết với thanh toán này"
      );
    }

    const orderWithDetails =
      await orderRepository.findOrderWithDetailsForUpdate(
        order.id_don_hang,
        transaction
      );

    // Hoàn lại số lượng hàng đã giữ
    if (
      !["da_huy", "hoan_tat"].includes(
        order.trang_thai_don_hang
      )
    ) {
      await inventoryService.releaseInventory({
        order: orderWithDetails,
        transaction,
      });
    }

    // Chuyển khoản thất bại thì hủy đơn
    if (payment.phuong_thuc === "chuyen_khoan") {
      await paymentRepository.updateOrder(
        order,
        {
          trang_thai_don_hang: "da_huy",
        },
        transaction
      );
    }

    // COD thất bại thì đánh dấu giao hàng thất bại
    if (payment.phuong_thuc === "cod") {
      await paymentRepository.updateOrder(
        order,
        {
          trang_thai_don_hang: "giao_that_bai",
        },
        transaction
      );
    }

    // Thông báo cho khách hàng
    await notificationService.createNotification({
      id_nguoi_dung: order.id_nguoi_dung,
      tieu_de: "Thanh toán thất bại",
      noi_dung:
        `Thanh toán cho đơn hàng #${order.id_don_hang} ` +
        "thất bại. Vui lòng kiểm tra lại.",
      loai: "thanh_toan",
      lien_ket: `/profile/orders/${order.id_don_hang}`,
      transaction,
    });

    await transaction.commit();

    return await paymentRepository.findById(paymentId);
  } catch (error) {
    // Có lỗi thì hoàn tác dữ liệu
    await transaction.rollback();
    throw error;
  }
};

// Xuất các hàm để controller sử dụng
module.exports = {
  getMyPayments,
  getAllPayments,
  getPaymentsByOrder,
  confirmPayment,
  createPayOSPayment,
  confirmPayOSReturn,
  handlePayOSWebhook,
  failPayment,
};