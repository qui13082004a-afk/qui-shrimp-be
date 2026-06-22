const { sequelize } = require("../../config/database");
const { paymentRepository } = require("../repositories");
const crypto = require("crypto");
const https = require("https");

const getMomoConfig = () => ({
  partnerCode: process.env.MOMO_PARTNER_CODE || "MOMO",
  accessKey: process.env.MOMO_ACCESS_KEY || "F8BBA842ECF85",
  secretKey: process.env.MOMO_SECRET_KEY || "K951B6PE1waDMi640xX08PD3vg6EkVlz",
});

const createHmacSha256 = (data, secretKey) => {
  return crypto.createHmac("sha256", secretKey).update(data).digest("hex");
};

const timingSafeEqualText = (left, right) => {
  if (!left || !right || left.length !== right.length) return false;
  return crypto.timingSafeEqual(Buffer.from(left), Buffer.from(right));
};

const getRequiredUrl = (value, name) => {
  if (!value) {
    throw new Error(`${name} chua duoc cau hinh`);
  }

  try {
    return new URL(value).origin;
  } catch {
    throw new Error(`${name} khong phai URL hop le`);
  }
};

const verifyMomoCallbackSignature = (callbackData) => {
  const { accessKey, secretKey } = getMomoConfig();
  const {
    amount,
    extraData,
    message,
    orderId,
    orderInfo,
    orderType,
    partnerCode,
    payType,
    requestId,
    responseTime,
    resultCode,
    transId,
    signature,
  } = callbackData;

  const rawSignature =
    `accessKey=${accessKey}&amount=${amount}&extraData=${extraData || ""}` +
    `&message=${message || ""}&orderId=${orderId}&orderInfo=${orderInfo || ""}` +
    `&orderType=${orderType || ""}&partnerCode=${partnerCode || ""}` +
    `&payType=${payType || ""}&requestId=${requestId || ""}` +
    `&responseTime=${responseTime || ""}&resultCode=${resultCode}&transId=${transId || ""}`;

  const computedSignature = createHmacSha256(rawSignature, secretKey);
  return timingSafeEqualText(computedSignature, signature);
};

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

  const order = payments[0].DonHang;

  if (user.vai_tro !== "admin" && Number(order.id_nguoi_dung) !== Number(user.id_nguoi_dung)) {
    throw new Error("Bạn không có quyền truy cập dữ liệu thanh toán của đơn hàng này");
  }

  return payments;
};

/**
 * XÁC NHẬN THANH TOÁN THỦ CÔNG (Dành cho Admin duyệt Chuyển khoản, hoặc Shipper thu COD/Trả sau)
 */
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

    if (user.vai_tro === "nhan_vien_giao_hang" && payment.phuong_thuc === "chuyen_khoan") {
      throw new Error("Nhân viên giao hàng không có thẩm quyền duyệt xác nhận thanh toán Chuyển khoản");
    }

    const order = payment.DonHang;
    if (!order) {
      throw new Error("Không tìm thấy thông tin đơn hàng liên kết với thanh toán này");
    }

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
          ghi_chu: data.ghi_chu || "Đã giao hàng thành công và thu đủ tiền mặt COD",
          thoi_gian_giao: new Date(),
        },
        transaction
      );

    } else if (payment.phuong_thuc === "chuyen_khoan") {
      newOrderStatus = "cho_giao";

    } else if (payment.phuong_thuc === "tra_sau") {
      newOrderStatus = "hoan_tat";

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

/**
 *  KHỞI TẠO ĐƠN THANH TOÁN MOMO CHO ĐƠN HÀNG THỰC TẾ
 * Khách hàng gọi API này để lấy đường dẫn thanh toán (payUrl) quét mã MoMo
 */
const createMomoPayment = async (user, paymentId, clientRedirectUrl) => {
  try {
    const userId = user.id_nguoi_dung;

    // 1. Tìm thông tin bản ghi thanh toán của đơn hàng trong Đất Tôm
    const payment = await paymentRepository.findById(paymentId);
    if (!payment) {
      throw new Error("Không tìm thấy thông tin giao dịch thanh toán");
    }

    if (payment.trang_thai === "thanh_cong") {
      throw new Error("Giao dịch thanh toán này đã hoàn tất từ trước");
    }

    if (payment.phuong_thuc !== "chuyen_khoan") {
      throw new Error("Chi giao dich chuyen khoan moi duoc khoi tao thanh toan MoMo");
    }

    // Bảo mật IDOR: Chỉ chính chủ đơn hàng mới có quyền thanh toán
    const order = payment.DonHang;
    if (Number(order.id_nguoi_dung) !== Number(userId)) {
      throw new Error("Bạn không có quyền thực hiện thanh toán cho đơn hàng này");
    }

    if (!order.NguoiDung || order.NguoiDung.trang_thai_tai_khoan !== "hoat_dong") {
      throw new Error("Tai khoan dat hang da bi khoa hoac chua duoc xac thuc");
    }

    // 2. Cấu hình giá trị chuyển MoMo thực tế dựa trên số tiền đơn hàng
    const amount = Math.round(Number(payment.so_tien)); // MoMo yêu cầu số nguyên làm tròn
    const order_id = "DATTOM_MOMO_" + paymentId + "_" + Date.now(); // Tránh trùng lặp mã đơn của MoMo test

    // 3. Thông số môi trường kết nối Sandbox MoMo (Được tùy biến từ file .env của bạn)
    const { partnerCode, accessKey, secretKey } = getMomoConfig();
    const requestId = order_id;
    const orderInfo = `Thanh toán vật tư Đất Tôm cho đơn hàng #${order.id_don_hang}`;
    
    // Đường dẫn Callback (IPN) do server của chúng ta hứng dữ liệu ngầm từ MoMo
    const backendUrl = getRequiredUrl(process.env.BACKEND_URL, "BACKEND_URL");
    const ipnUrl = `${backendUrl}/api/payments/momo-callback`;
    const redirectUrl = clientRedirectUrl || "http://localhost:5173/payment-result";

    // Truyền dữ liệu bổ sung sang MoMo để khi quay về chúng ta có thể nhận diện đơn hàng
    const extraData = JSON.stringify({ userId, paymentId, id_don_hang: order.id_don_hang });

    // 4. Xây dựng chuỗi ký tự thô để tạo chữ ký bảo mật theo tiêu chuẩn MoMo
    const rawSignature =
      `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}` +
      `&ipnUrl=${ipnUrl}&orderId=${order_id}&orderInfo=${orderInfo}` +
      `&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}` +
      `&requestId=${requestId}&requestType=payWithMethod`;

    const signature = crypto
      .createHmac("sha256", secretKey)
      .update(rawSignature)
      .digest("hex");

    const requestBody = JSON.stringify({
      partnerCode,
      requestId,
      amount,
      orderId: order_id,
      orderInfo,
      redirectUrl,
      ipnUrl,
      requestType: "payWithMethod",
      lang: "vi",
      extraData,
      signature
    });

    // 5. Gọi API sang cổng thanh toán MoMo để lấy link thanh toán
    return new Promise((resolve, reject) => {
      const options = {
        hostname: "test-payment.momo.vn",
        port: 443,
        path: "/v2/gateway/api/create",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(requestBody)
        }
      };

      const momoReq = https.request(options, (momoRes) => {
        let data = "";
        momoRes.on("data", (chunk) => (data += chunk));
        momoRes.on("end", async () => {
          try {
            const response = JSON.parse(data);
            if (response.resultCode !== 0) {
              return reject(new Error(response.message || "Lỗi khởi tạo cổng MoMo"));
            }

            // Lưu trữ mã tham chiếu tạm thời vào DB để quản lý đối soát dòng tiền
            await paymentRepository.updatePayment(payment, {
              ma_giao_dich: order_id
            });

            resolve({
              success: true,
              message: "Khởi tạo liên kết MoMo thành công",
              payUrl: response.payUrl, // Khách hàng sẽ truy cập đường link này để quét mã
              orderId: order_id
            });
          } catch (err) {
            reject(err);
          }
        });
      });

      momoReq.on("error", (e) => reject(e));
      momoReq.write(requestBody);
      momoReq.end();
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Tự động xác thực chữ ký bảo mật MoMo và nâng cấp trạng thái đơn hàng ngay khi tiền về
 */
const handleMomoCallback = async (callbackData) => {
  const transaction = await sequelize.transaction();

  try {
    console.log("MOMO CALLBACK DATA:", callbackData);
    console.log("RESULT CODE:", callbackData?.resultCode);

    const {
      resultCode,
      orderId,
      extraData,
      message,
      amount,
      transId,
      signature,
    } = callbackData;

    if (!signature || !verifyMomoCallbackSignature(callbackData)) {
      throw new Error("Chữ ký MoMo callback không hợp lệ");
    }

    let info = {};
    try {
      info = extraData ? JSON.parse(extraData) : {};
    } catch {
      throw new Error("Không thể phân tích dữ liệu bổ sung của giao dịch");
    }

    const paymentId = info.paymentId;

    if (!paymentId) {
      throw new Error("Thiếu paymentId trong extraData");
    }

    const payment = await paymentRepository.findById(paymentId);

    if (!payment) {
      throw new Error(`Không tìm thấy hồ sơ thanh toán khớp với mã: ${paymentId}`);
    }

    if (payment.phuong_thuc !== "chuyen_khoan") {
      throw new Error("Giao dịch này không phải thanh toán MoMo");
    }

    if (payment.ma_giao_dich !== orderId) {
      throw new Error("Mã đơn hàng MoMo không khớp với giao dịch đã khởi tạo");
    }

    const order = payment.DonHang;

    if (!order) {
      throw new Error("Không tìm thấy đơn hàng liên kết với giao dịch MoMo");
    }

    if (!order.NguoiDung || order.NguoiDung.trang_thai_tai_khoan !== "hoat_dong") {
      throw new Error("Tài khoản đặt hàng đã bị khóa hoặc chưa được xác thực");
    }

    // Nếu giao dịch đã thành công trước đó thì không xử lý lại
    if (payment.trang_thai === "thanh_cong") {
      await transaction.rollback();

      return {
        success: true,
        status: "success",
        message: "Giao dịch đã được ghi nhận thành công từ trước",
      };
    }

    // MoMo trả resultCode khác 0 => thanh toán thất bại
    if (String(resultCode) !== "0") {
      await paymentRepository.updatePayment(
        payment,
        {
          trang_thai: "that_bai",
          ma_giao_dich: orderId,
          ngay_thanh_toan: null,
        },
        transaction
      );

      await paymentRepository.updateOrder(
        order,
        {
          trang_thai_don_hang: "cho_thanh_toan",
        },
        transaction
      );

      await transaction.commit();

      return {
        success: false,
        status: "failed",
        message: message || "Giao dịch MoMo thất bại",
      };
    }

    // MoMo thành công thì kiểm tra số tiền
    if (Math.round(Number(payment.so_tien)) !== Number(amount)) {
      throw new Error(
        "Số tiền thanh toán MoMo gửi về không khớp với giá trị đơn hàng cần thanh toán"
      );
    }

    // Cập nhật thanh toán thành công
    // Lưu ý: giữ ma_giao_dich = orderId để callback lần sau vẫn đối chiếu được
    await paymentRepository.updatePayment(
      payment,
      {
        trang_thai: "thanh_cong",
        ma_giao_dich: orderId,
        ngay_thanh_toan: new Date(),

        // Nếu bảng bạn có cột trans_id thì mở dòng này:
        // trans_id: transId,
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
      status: "success",
      message:
        "Đơn hàng của bạn đã được thanh toán và chuyển sang trạng thái chờ giao!",
    };
  } catch (error) {
    await transaction.rollback();
    console.error("MOMO CALLBACK PROCESS ERROR:", error.message);
    throw error;
  }
};

/**
 * XỬ LÝ THANH TOÁN TỰ ĐỘNG QUA WEBHOOK VIETQR / PAYOS
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

    const payments = await paymentRepository.findByOrderId(id_don_hang);
    if (!payments || payments.length === 0) {
      throw new Error(`Không tìm thấy thông tin thanh toán cho đơn hàng số: ${id_don_hang}`);
    }

    const payment = payments.find(p => p.trang_thai === "cho_thanh_toan");
    if (!payment) {
      return { success: true, message: "Thanh toán cho đơn hàng này đã được xử lý từ trước" };
    }

    const order = payment.DonHang;
    if (!order) {
      throw new Error("Không tìm thấy thông tin đơn hàng liên kết");
    }

    const so_tien_can_thanh_toan = Number(payment.so_tien);
    if (so_tien_chuyen < so_tien_can_thanh_toan) {
      throw new Error(`Số tiền chuyển khoản (${so_tien_chuyen}đ) nhỏ hơn tổng số tiền của đơn hàng (${so_tien_can_thanh_toan}đ)`);
    }

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

    await transaction.commit();

    return {
      success: true,
      message: `Hệ thống tự động khớp đơn hàng #${id_don_hang} thành công!`,
      id_don_hang,
      so_tien_chuyen
    };

  } catch (error) {
    await transaction.rollback();
    console.error("WEBHOOK ERROR:", error.message);
    throw error;
  }
};

/**
 * ĐÁNH DẤU GIAO DỊCH THANH TOÁN THẤT BẠI
 */
const failPayment = async (user, paymentId, data) => {
  if (user.vai_tro !== "admin") {
    throw new Error("Thao tác bị từ chối: Chỉ quản trị viên mới có quyền đánh dấu giao dịch thất bại");
  }

  const transaction = await sequelize.transaction();

  try {
    const payment = await paymentRepository.findById(paymentId);
    if (!payment) {
      throw new Error("Không tìm thấy thông tin giao dịch thanh toán");
    }

    if (payment.trang_thai === "thanh_cong") {
      throw new Error("Giao dịch này đã thanh toán thành công, không thể đánh dấu thất bại!");
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
        { trang_thai_don_hang: "cho_thanh_toan" },
        transaction
      );
    } else if (payment.phuong_thuc === "cod") {
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
  createMomoPayment,         // Xuất bản hàm khởi tạo thanh toán MoMo
  handleMomoCallback,        // Xuất bản hàm tiếp nhận kết quả phản hồi từ MoMo
  processAutomaticWebhookPayment, 
  failPayment,
};
