const chinhSachHanMucService = require("../services/chinhSachHanMuc.service");

const createPolicy = async (req, res) => {
  try {
    const data = await chinhSachHanMucService.createPolicy(req.user, req.body);

    return res.status(201).json({
      success: true,
      message: "Tạo chính sách hạn mức thành công",
      data,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getAllPolicies = async (req, res) => {
  try {
    const data = await chinhSachHanMucService.getAllPolicies();

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách chính sách hạn mức thành công",
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getActivePolicies = async (req, res) => {
  try {
    const data = await chinhSachHanMucService.getActivePolicies();

    return res.status(200).json({
      success: true,
      message: "Lấy chính sách hạn mức đang hoạt động thành công",
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getPolicyById = async (req, res) => {
  try {
    const data = await chinhSachHanMucService.getPolicyById(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Lấy chi tiết chính sách hạn mức thành công",
      data,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

const updatePolicy = async (req, res) => {
  try {
    const data = await chinhSachHanMucService.updatePolicy(
      req.user,
      req.params.id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Cập nhật chính sách hạn mức thành công",
      data,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const togglePolicyStatus = async (req, res) => {
  try {
    const data = await chinhSachHanMucService.togglePolicyStatus(
      req.user,
      req.params.id,
      req.body.trang_thai
    );

    return res.status(200).json({
      success: true,
      message: "Cập nhật trạng thái chính sách hạn mức thành công",
      data,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createPolicy,
  getAllPolicies,
  getActivePolicies,
  getPolicyById,
  updatePolicy,
  togglePolicyStatus,
};