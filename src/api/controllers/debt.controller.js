const debtService = require("../services/debt.service");

const getMyDebtSummary = async (req, res) => {
  try {
    const data = await debtService.getMyDebtSummary(req.user.id_nguoi_dung);

    return res.status(200).json({
      success: true,
      message: "Lấy tổng quan công nợ thành công",
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getMyDebtOrders = async (req, res) => {
  try {
    const data = await debtService.getMyDebtOrders(req.user.id_nguoi_dung);

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách công nợ thành công",
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getMyDebtSummary,
  getMyDebtOrders,
};