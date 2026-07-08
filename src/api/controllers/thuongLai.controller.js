const thuongLaiService = require("../services/thuongLai.service");

const createMerchant = async (req, res) => {
  try {
    const data = await thuongLaiService.createMerchant(req.user, req.body);

    return res.status(201).json({
      success: true,
      message: "Tạo thương lái thành công",
      data,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const getAllMerchants = async (req, res) => {
  try {
    const data = await thuongLaiService.getAllMerchants(req.user);

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách thương lái thành công",
      data,
    });
  } catch (error) {
    return res.status(403).json({ success: false, message: error.message });
  }
};

const getActiveMerchants = async (req, res) => {
  try {
    const data = await thuongLaiService.getActiveMerchants();

    return res.status(200).json({
      success: true,
      message: "Lấy thương lái đang hoạt động thành công",
      data,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getMerchantById = async (req, res) => {
  try {
    const data = await thuongLaiService.getMerchantById(req.user, req.params.id);

    return res.status(200).json({
      success: true,
      message: "Lấy chi tiết thương lái thành công",
      data,
    });
  } catch (error) {
    return res.status(404).json({ success: false, message: error.message });
  }
};

const updateMerchant = async (req, res) => {
  try {
    const data = await thuongLaiService.updateMerchant(
      req.user,
      req.params.id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Cập nhật thương lái thành công",
      data,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const updateMerchantStatus = async (req, res) => {
  try {
    const data = await thuongLaiService.updateMerchantStatus(
      req.user,
      req.params.id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Cập nhật trạng thái thương lái thành công",
      data,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const increaseViolation = async (req, res) => {
  try {
    const data = await thuongLaiService.increaseViolation(
      req.user,
      req.params.id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Ghi nhận vi phạm thương lái thành công",
      data,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  createMerchant,
  getAllMerchants,
  getActiveMerchants,
  getMerchantById,
  updateMerchant,
  updateMerchantStatus,
  increaseViolation,
};