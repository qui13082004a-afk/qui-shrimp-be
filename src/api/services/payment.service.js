const { sequelize } = require("../../config/database");
const { paymentRepository } = require("../repositories");
const crypto = require("crypto"); // Dùng để xác thực chữ ký bảo mật Webhook (Tránh giả mạo dữ liệu giao dịch)

/**
 * LẤY LỊCH SỬ THANH TOÁN CỦA TÔI (Dành cho Khách hàng)
 */
const getMyPayments = async (userId) => {
  return await paymentRepository.findByUserId(userId);
};

/**
 * LẤY TOÀN BỘ DANH SÁCH THANH TOÁN (Chỉ dành cho Admin)
 */
const getAllPayments = async (user) => {
  if (user.vai_tro !== "admin") {
    throw new Error("Thao tác bị từ chối: Bạn không có quyền truy cập dữ liệu thanh toán toàn hệ thống");
  }

  return await paymentRepository.findAll();
};

/**
 * LẤY DANH SÁCH THANH TOÁN THEO ĐƠN HÀNG (Bảo vệ IDOR tuyệt đối)
 */
const getPaymentsByOrder = async (user, orderId) => {
  const payments = await paymentRepository.findByOrderId(orderId);

  if (!payments || payments.length === 0) {
    throw new Error("Không tìm thấy thông tin giao dịch thanh toán cho đơn hàng này");
  }

  // Lấy thông tin đơn hàng liên kết từ bản ghi thanh toán đầu tiên để kiểm tra quyền sở hữu
  const order = payments[0].DonHang;

  // Bảo mật: Chỉ Admin hoặc chính khách hàng đặt đơn hàng đó mới có quyền xem thông tin thanh toán này
  if (user.vai_tro !== "admin" && Number(order.id_nguoi_dung) !== Number(user.id_nguoi_dung)) {
    throw new Error("Bạn không có quyền truy cập dữ liệu thanh toán của đơn hàng này");
  }

  return payments;
};

/**
 * XÁC NHẬN THANH TOÁN THỦ CÔNG (Dành cho Admin duyệt Chuyển khoản/Kế toán, hoặc Shipper thu COD/Trả sau)
 */
const confirmPayment = async (user, paymentId, data) => {
  const transaction = await sequelize.transaction();

  try {
    // 1. KIỂM TRA PHÂN QUYỀN VAI TRÒ
    if (user.vai_tro !== "admin" && user.vai_tro !== "nhan_vien_giao_hang") {
      throw new Error("Bạn không có quyền thực hiện xác nhận giao dịch thanh toán này");
    }

    const payment = await paymentRepository.findById(paymentId);
    if (!payment) {
      throw new Error("Không tìm thấy thông tin giao dịch thanh toán yêu cầu");
    }

    // 2. PHÒNG NGỪA GHI ĐÈ TRẠNG THÁI (Idempotency Check)
    if (payment.trang_thai === "thanh_cong") {
      throw new Error("Giao dịch thanh toán này đã được xác nhận thành công trước đó");
    }

    // 3. LOGIC NGHIỆP VỤ THỰC TẾ ĐẤT TÔM:
    // Nhân viên giao hàng (Shipper) chỉ được quyền xác nhận thanh toán COD hoặc Trả sau khi đi giao thực tế.
    // Shipper tuyệt đối không được tự ý duyệt thanh toán Chuyển khoản ngân hàng (vì đây là việc của kế toán/admin kiểm tra tài khoản).
    if (user.vai_tro === "nhan_vien_giao_hang" && payment.phuong_thuc === "chuyen_khoan") {
      throw new Error("Nhân viên giao hàng không có thẩm quyền duyệt xác nhận thanh toán Chuyển khoản");
    }

    const order = payment.DonHang;
    if (!order) {
      throw new Error("Không tìm thấy thông tin đơn hàng liên kết với thanh toán này");
    }

    // BẮT BUỘC KIỂM TRA TÀI LIỆU MINH CHỨNG KHI GIAO HÀNG THÀNH CÔNG:
    if (payment.phuong_thuc === "cod") {
      if (!data.anh_bien_nhan) {
        throw new Error("Giao hàng COD thành công bắt buộc phải chụp ảnh tải lên biên nhận thu tiền mặt");
      }
    }

    if (payment.phuong_thuc === "tra_sau") {
      if (!data.anh_hop_dong) {
        throw new Error("Giao hàng mua Trả sau bắt buộc phải chụp ảnh tải lên bản Hợp đồng giấy đã ký nhận nợ");
      }
    }

    // 4. Cập nhật trạng thái giao dịch thanh toán thành công
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

    // 5. Tính toán trạng thái mới cho Đơn hàng & Cập nhật các bảng liên quan (GiaoHang, HopDong)
    if (payment.phuong_thuc === "cod") {
      newOrderStatus = "hoan_tat"; // Shipper thu tiền COD thành công -> Đơn hàng hoàn tất

      // Cập nhật thông tin vận chuyển của đơn hàng sang trạng thái "giao_thanh_cong" kèm ảnh biên nhận
      await paymentRepository.updateDeliveryByOrderId(
        order.id_don_hang,
        { 
          trang_thai: "giao_thanh_cong",
          anh_bien_nhan: data.anh_bien_nhan,
          ghi_chu: data.ghi_chu || "Đã giao hàng thành công và thu đủ tiền mặt COD",
          thoi_gian_giao: new Date(),
        },
        transaction
      );

    } else if (payment.phuong_thuc === "chuyen_khoan") {
      newOrderStatus = "cho_giao"; // Khách chuyển khoản thành công -> Đơn hàng chuyển sang chờ giao

    } else if (payment.phuong_thuc === "tra_sau") {
      newOrderStatus = "hoan_tat"; // Khách ký nhận nợ thành công -> Hoàn tất quy trình mua trả sau

      // Cập nhật thông tin vận chuyển của đơn hàng sang trạng thái "giao_thanh_cong" kèm ảnh hợp đồng
      await paymentRepository.updateDeliveryByOrderId(
        order.id_don_hang,
        {
          trang_thai: "giao_thanh_cong",
          anh_hop_dong: data.anh_hop_dong,
          ghi_chu: data.ghi_chu || "Đã giao hàng thành công và đối tác đã ký hợp đồng mua trả sau",
          thoi_gian_giao: new Date(),
        },
        transaction
      );

      // Cập nhật thông tin bảng HopDong liên kết với đơn hàng thành "da_ky"
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

    // 6. Đồng bộ trạng thái đơn hàng
    await paymentRepository.updateOrder(
      order,
      {
        trang_thai_don_hang: newOrderStatus,
        ngay_giao: newOrderStatus === "hoan_tat" ? new Date() : order.ngay_giao,
      },
      transaction
    );

    // Xác nhận toàn bộ thay đổi thành công và an toàn
    await transaction.commit();

    return await paymentRepository.findById(paymentId);
  } catch (error) {
    // Hoàn tác mọi thay đổi nếu xảy ra lỗi ghi chép dữ liệu
    await transaction.rollback();
    throw error;
  }
};

/**
 * XỬ LÝ THANH TOÁN TỰ ĐỘNG QUA WEBHOOK (Không cần Admin duyệt, ngân hàng báo tiền về tự khớp đơn hàng)
 * Áp dụng mô hình kết nối cổng VietQR / PayOS / Casso / SePay
 * Đối tượng webhookBody chứa: { orderCode, amount, reference, signature }
 */
const processAutomaticWebhookPayment = async (webhookBody, webhookSignatureHeader) => {
  const transaction = await sequelize.transaction();

  try {
    const webhookToken = process.env.PAYMENT_WEBHOOK_SECRET || "DATTOM_SECRET_KEY";
    const computedSignature = crypto
      .createHmac("sha256", webhookToken)
      .update(JSON.stringify(webhookBody.data || webhookBody))
      .digest("hex");
    if (process.env.NODE_ENV === "production" && webhookSignatureHeader !== computedSignature) {
      throw new Error("Cảnh báo an ninh: Chữ ký Webhook thanh toán tự động không hợp lệ!");
    }

 
    const paymentData = webhookBody.data || webhookBody;
    const id_don_hang = paymentData.orderCode; 
    const so_tien_chuyen = Number(paymentData.amount);
    const ma_giao_dich_ngan_hang = paymentData.reference;

    // Tìm giao dịch thanh toán ở trạng thái "cho_thanh_toan" của đơn hàng này
    const payments = await paymentRepository.findByOrderId(id_don_hang);
    if (!payments || payments.length === 0) {
      throw new Error(`Không tìm thấy thông tin thanh toán cho đơn hàng số: ${id_don_hang}`);
    }

    const payment = payments.find(p => p.trang_thai === "cho_thanh_toan");
    if (!payment) {
      // Đã được xác nhận hoặc hủy trước đó rồi (Chống trùng lặp xử lý - Idempotency)
      return { success: true, message: "Thanh toán cho đơn hàng này đã được xử lý từ trước" };
    }

    const order = payment.DonHang;
    if (!order) {
      throw new Error("Không tìm thấy thông tin đơn hàng liên kết");
    }

    // 4. KIỂM TRA SAI LỆCH SỐ TIỀN (Khớp tiền thực tế)
    const so_tien_can_thanh_toan = Number(payment.so_tien);
    if (so_tien_chuyen < so_tien_can_thanh_toan) {
      throw new Error(`Số tiền chuyển khoản (${so_tien_chuyen}đ) nhỏ hơn tổng số tiền của đơn hàng (${so_tien_can_thanh_toan}đ)`);
    }

    // 5. CẬP NHẬT TRẠNG THÁI THANH TOÁN (THÀNH CÔNG)
    await paymentRepository.updatePayment(
      payment,
      {
        trang_thai: "thanh_cong",
        ma_giao_dich: ma_giao_dich_ngan_hang,
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

    // Xác nhận giao dịch thành công mỹ mãn
    await transaction.commit();

    return {
      success: true,
      message: `Hệ thống tự động khớp đơn hàng #${id_don_hang} thành công!`,
      id_don_hang,
      so_tien_chuyen
    };

  } catch (error) {
    // Hoàn tác dữ liệu nếu xảy ra bất kỳ lỗi hệ thống nào
    await transaction.rollback();
    console.error("WEBHOOK ERROR:", error.message);
    throw error;
  }
};

/**
 * ĐÁNH DẤU GIAO DỊCH THANH TOÁN THẤT BẠI (Chỉ dành cho Admin, bảo vệ bằng Transaction)
 */
const failPayment = async (user, paymentId, data) => {
  // 1. KIỂM TRA PHÂN QUYỀN
  if (user.vai_tro !== "admin") {
    throw new Error("Thao tác bị từ chối: Chỉ quản trị viên mới có quyền đánh dấu giao dịch thất bại");
  }

  const transaction = await sequelize.transaction();

  try {
    const payment = await paymentRepository.findById(paymentId);
    if (!payment) {
      throw new Error("Không tìm thấy thông tin giao dịch thanh toán");
    }

    // Không cho phép đánh dấu thất bại một giao dịch đã được kế toán xác nhận thành công từ trước
    if (payment.trang_thai === "thanh_cong") {
      throw new Error("Giao dịch này đã thanh toán thành công, không thể đánh dấu thất bại!");
    }

    // 2. Cập nhật trạng thái giao dịch thanh toán thất bại
    await paymentRepository.updatePayment(
      payment,
      {
        trang_thai: "that_bai",
        ma_giao_dich: data.ma_giao_dich || payment.ma_giao_dich,
      },
      transaction
    );

    const order = payment.DonHang;

    // 3. Khôi phục trạng thái đơn hàng tương ứng để khách hàng tiến hành xử lý lại
    if (payment.phuong_thuc === "chuyen_khoan") {
      // Nếu chuyển khoản lỗi -> Đơn hàng trả về trạng thái chờ thanh toán
      await paymentRepository.updateOrder(
        order,
        { trang_thai_don_hang: "cho_thanh_toan" },
        transaction
      );
    } else if (payment.phuong_thuc === "cod") {
      // Nếu giao COD thất bại -> Đơn hàng chuyển sang trạng thái giao thất bại
      await paymentRepository.updateOrder(
        order,
        { trang_thai_don_hang: "giao_that_bai" },
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
  processAutomaticWebhookPayment, 
  failPayment,
};