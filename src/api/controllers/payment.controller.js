const { paymentService } = require("../services");

/**
 * Khách hàng lấy danh sách lịch sử thanh toán của bản thân
 */
const getMyPayments = async (req, res) => {
  try {
    const payments = await paymentService.getMyPayments(req.user.id_nguoi_dung);

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách thanh toán của bạn thành công",
      data: payments,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Admin xem toàn bộ danh sách giao dịch thanh toán của hệ thống
 */
const getAllPayments = async (req, res) => {
  try {
    const payments = await paymentService.getAllPayments(req.user);

    return res.status(200).json({
      success: true,
      message: "Lấy toàn bộ danh sách thanh toán hệ thống thành công",
      data: payments,
    });
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Khách hàng hoặc Admin xem lịch sử thanh toán của đơn hàng cụ thể
 */
const getPaymentsByOrder = async (req, res) => {
  try {
    const payments = await paymentService.getPaymentsByOrder(
      req.user,
      req.params.orderId
    );

    return res.status(200).json({
      success: true,
      message: "Lấy thông tin thanh toán theo mã đơn hàng thành công",
      data: payments,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Duyệt thanh toán thủ công (Nhân viên vận đơn COD / Admin duyệt trả sau)
 */
const confirmPayment = async (req, res) => {
  try {
    const payment = await paymentService.confirmPayment(
      req.user,
      req.params.id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Xác nhận giao dịch thanh toán thành công",
      data: payment,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Đánh dấu giao dịch thanh toán thất bại (Chỉ dành cho Admin hệ thống)
 */
const failPayment = async (req, res) => {
  try {
    const payment = await paymentService.failPayment(
      req.user,
      req.params.id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Đã đánh dấu giao dịch thanh toán thất bại thành công",
      data: payment,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * API Khởi tạo link thanh toán MoMo dựa trên hóa đơn của khách
 */
const createMomoPayment = async (req, res) => {
  try {
    const { clientRedirectUrl } = req.body;
    const paymentId = req.params.id; // Lấy ID thanh toán từ URL

    const result = await paymentService.createMomoPayment(
      req.user,
      paymentId,
      clientRedirectUrl
    );

    return res.status(200).json({
      success: true,
      message: "Khởi tạo cổng thanh toán điện tử MoMo thành công",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Webhook (IPN) tiếp nhận kết quả phản hồi tự động bảo mật từ ví MoMo
 */
const handleMomoCallback = async (req, res) => {
  try {
    console.log("===== MOMO IPN CALLBACK RECEIVED =====");
    console.log("BODY:", req.body);
    console.log("RESULT CODE:", req.body?.resultCode);
    console.log("MESSAGE:", req.body?.message);
    const result = await paymentService.handleMomoCallback(req.body);

    // Trả về kết quả JSON hoặc mã HTTP 204 để báo hiệu cho MoMo ngừng gửi IPN lặp lại
    return res.status(200).json({
      success: true,
      message: "Nhận kết quả giao dịch MoMo thành công",
      data: result
    });
  } catch (error) {
    console.error("MOMO IPN CONTROLLER ERROR:", error.message);
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Webhook tiếp nhận kết quả biến động số dư tự động từ VietQR / PayOS
 */
const processWebhook = async (req, res) => {
  try {
    const signature = req.headers["x-signature"];
    const result = await paymentService.processAutomaticWebhookPayment(req.body, signature);

    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getMyPayments,
  getAllPayments,
  getPaymentsByOrder,
  confirmPayment,
  failPayment,
  createMomoPayment,
  handleMomoCallback,
  processWebhook,
};