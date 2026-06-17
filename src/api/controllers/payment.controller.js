const { paymentService } = require("../services");

const getMyPayments = async (req, res) => {
  try {
    const payments = await paymentService.getMyPayments(req.user.id_nguoi_dung);

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách thanh toán của tôi thành công",
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
      message: "Lấy danh sách thanh toán thành công",
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
      message: "Lấy thanh toán theo đơn hàng thành công",
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
      message: "Xác nhận thanh toán thành công",
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
      message: "Đã đánh dấu thanh toán thất bại",
      data: payment,
    });
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
};