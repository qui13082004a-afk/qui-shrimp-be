const debtRepository = require("../repositories/debt.repository");

const getMyDebtSummary = async (userId) => {
  return await debtRepository.getMyDebtSummary(userId);
};

const getMyDebtOrders = async (userId) => {
  return await debtRepository.getMyDebtOrders(userId);
};

module.exports = {
  getMyDebtSummary,
  getMyDebtOrders,
};