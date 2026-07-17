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
const getDebtProfileDetail = async (req, res) => {
  try {
    const data = await debtService.getDebtProfileDetail(
      req.user.id_nguoi_dung,
      req.params.profileId
    );

    return res.status(200).json({
      success: true,
      message: "Lấy chi tiết hồ sơ công nợ thành công",
      data,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

const getAdminDebtProfileDetail = async (req, res) => {
  try {
    const data = await debtService.getAdminDebtProfileDetail(
      req.user,
      req.params.profileId
    );

    return res.status(200).json({
      success: true,
      message: "Lay chi tiet cong no khach hang thanh cong",
      data,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

const getDebtProfileTransactions = async (req, res) => {
  try {
    const data = await debtService.getDebtProfileTransactions(
      req.user.id_nguoi_dung,
      req.params.profileId
    );

    return res.status(200).json({
      success: true,
      message: "Lấy lịch sử phát sinh công nợ thành công",
      data,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};
const createPartialDebtPayment = async (req, res) => {
  try {
    const data = await debtService.createPartialDebtPayment(
      req.user.id_nguoi_dung,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Tạo thanh toán công nợ thành công",
      data,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const createAdminDirectDebtPayment = async (req, res) => {
  try {
    const data = await debtService.createAdminDirectDebtPayment(
      req.user,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Ghi nhan thanh toan cong no truc tiep thanh cong",
      data,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getMyDebtPayments = async (req, res) => {
  try {
    const data = await debtService.getMyDebtPayments(req.user.id_nguoi_dung);

    return res.status(200).json({
      success: true,
      message: "Lấy lịch sử thanh toán công nợ thành công",
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getDebtPaymentDetail = async (req, res) => {
  try {
    const data = await debtService.getDebtPaymentDetail(
      req.user.id_nguoi_dung,
      req.params.id
    );

    return res.status(200).json({
      success: true,
      message: "Lấy chi tiết thanh toán công nợ thành công",
      data,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};
module.exports = {
  getMyDebtSummary,
  getMyDebtOrders,
  getDebtProfileDetail,
  getAdminDebtProfileDetail,
  getDebtProfileTransactions,
  createPartialDebtPayment,
createAdminDirectDebtPayment,
getMyDebtPayments,
getDebtPaymentDetail,
};
