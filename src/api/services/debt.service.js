const debtRepository = require("../repositories/debt.repository");

const getMyDebtSummary = async (userId) => {
  return await debtRepository.getMyDebtSummary(userId);
};

const getMyDebtOrders = async (userId) => {
  return await debtRepository.getMyDebtOrders(userId);
};
const getDebtProfileDetail = async (userId, profileId) => {
  return await debtRepository.getDebtProfileDetail(userId, profileId);
};

const getDebtProfileTransactions = async (userId, profileId) => {
  return await debtRepository.getDebtProfileTransactions(userId, profileId);
};
module.exports = {
  getMyDebtSummary,
  getMyDebtOrders,
  getDebtProfileDetail,
  getDebtProfileTransactions,
};