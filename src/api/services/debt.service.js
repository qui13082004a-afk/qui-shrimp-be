const debtRepository = require("../repositories/debt.repository");
const debtPaymentRepository = require("../repositories/debtPayment.repository");

const getMyDebtSummary = async (userId) => {
  return await debtRepository.getMyDebtSummary(userId);
};

const getMyDebtOrders = async (userId) => {
  return await debtRepository.getMyDebtOrders(userId);
};

const getDebtProfileDetail = async (userId, profileId) => {
  return await debtRepository.getDebtProfileDetail(userId, profileId);
};

const getAdminDebtProfileDetail = async (user, profileId) => {
  if (!user || user.vai_tro !== "admin") {
    throw new Error("Chi Admin moi co quyen xem cong no khach hang");
  }

  return await debtRepository.getAdminDebtProfileDetail(profileId);
};

const getDebtProfileTransactions = async (userId, profileId) => {
  return await debtRepository.getDebtProfileTransactions(userId, profileId);
};

const createPartialDebtPayment = async (userId, data) => {
  return await debtPaymentRepository.createPartialDebtPayment(userId, data);
};

const createAdminDirectDebtPayment = async (user, data) => {
  if (!user || user.vai_tro !== "admin") {
    throw new Error("Chi Admin moi co quyen ghi nhan thanh toan cong no");
  }

  return await debtPaymentRepository.createAdminDirectDebtPayment(data);
};

const getMyDebtPayments = async (userId) => {
  return await debtPaymentRepository.getMyDebtPayments(userId);
};

const getDebtPaymentDetail = async (userId, id) => {
  return await debtPaymentRepository.getDebtPaymentDetail(userId, id);
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
