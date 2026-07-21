const { paymentService } = require("../services");

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

const createPayOSPayment = async (req, res) => {
  try {
    const paymentId = req.params.id;

    const result = await paymentService.createPayOSPayment(
      req.user,
      paymentId
    );

    return res.status(200).json({
      success: true,
      message: "Tạo link thanh toán payOS thành công",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const confirmPayOSReturn = async (req, res) => {
  try {
    const result = await paymentService.confirmPayOSReturn(
      req.user,
      req.body.orderCode
    );

    return res.status(200).json({
      success: true,
      message: result.confirmed
        ? "Da xac minh giao dich voi PayOS"
        : result.message,
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const handlePayOSWebhook = async (req, res) => {
  try {
    const result = await paymentService.handlePayOSWebhook(req.body);

    return res.status(200).json(result);
  } catch (error) {
    console.error("PAYOS WEBHOOK ERROR:", error);
    console.error("BODY:", JSON.stringify(req.body, null, 2));

    return res.status(200).json({
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
  createPayOSPayment,
  confirmPayOSReturn,
  handlePayOSWebhook,
};
