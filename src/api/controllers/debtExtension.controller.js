const { debtExtensionService } = require("../services");

const createDebtExtension = async (req, res) => {
  try {
    const extension = await debtExtensionService.createDebtExtension(
      req.user,
      req.body
    );

    return res.status(201).json({
      success: true,
      message: "Gửi đơn xin gia hạn thành công",
      data: extension,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getMyDebtExtensions = async (req, res) => {
  try {
    const extensions = await debtExtensionService.getMyDebtExtensions(req.user);

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách đơn gia hạn của tôi thành công",
      data: extensions,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getAllDebtExtensions = async (req, res) => {
  try {
    const extensions = await debtExtensionService.getAllDebtExtensions();

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách đơn gia hạn thành công",
      data: extensions,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getDebtExtensionById = async (req, res) => {
  try {
    const extension = await debtExtensionService.getDebtExtensionById(
      req.user,
      req.params.id
    );

    return res.status(200).json({
      success: true,
      message: "Lấy chi tiết đơn gia hạn thành công",
      data: extension,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

const approveDebtExtension = async (req, res) => {
  try {
    const extension = await debtExtensionService.approveDebtExtension(
      req.user,
      req.params.id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Duyệt đơn gia hạn thành công",
      data: extension,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const rejectDebtExtension = async (req, res) => {
  try {
    const extension = await debtExtensionService.rejectDebtExtension(
      req.user,
      req.params.id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Từ chối đơn gia hạn thành công",
      data: extension,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createDebtExtension,
  getMyDebtExtensions,
  getAllDebtExtensions,
  getDebtExtensionById,
  approveDebtExtension,
  rejectDebtExtension,
};