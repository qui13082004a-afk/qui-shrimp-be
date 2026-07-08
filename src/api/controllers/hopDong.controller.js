const hopDongService = require("../services/hopDong.service");

const createContract = async (req, res) => {
  try {
    const data = await hopDongService.createContract(req.user, req.body);
    return res.status(201).json({
      success: true,
      message: "Tạo hợp đồng thành công",
      data,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const getAllContracts = async (req, res) => {
  try {
    const data = await hopDongService.getAllContracts(req.user);
    return res.status(200).json({
      success: true,
      message: "Lấy danh sách hợp đồng thành công",
      data,
    });
  } catch (error) {
    return res.status(403).json({ success: false, message: error.message });
  }
};

const getMyContracts = async (req, res) => {
  try {
    const data = await hopDongService.getMyContracts(req.user);
    return res.status(200).json({
      success: true,
      message: "Lấy hợp đồng của tôi thành công",
      data,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getContractById = async (req, res) => {
  try {
    const data = await hopDongService.getContractById(req.user, req.params.id);
    return res.status(200).json({
      success: true,
      message: "Lấy chi tiết hợp đồng thành công",
      data,
    });
  } catch (error) {
    return res.status(404).json({ success: false, message: error.message });
  }
};

const getContractByProfileId = async (req, res) => {
  try {
    const data = await hopDongService.getContractByProfileId(
      req.user,
      req.params.profileId
    );
    return res.status(200).json({
      success: true,
      message: "Lấy hợp đồng theo hồ sơ thành công",
      data,
    });
  } catch (error) {
    return res.status(404).json({ success: false, message: error.message });
  }
};

const uploadSignedContract = async (req, res) => {
  try {
    const data = await hopDongService.uploadSignedContract(
      req.user,
      req.params.id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Upload hợp đồng đã ký thành công, đang chờ Admin xác nhận",
      data,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const confirmContract = async (req, res) => {
  try {
    const data = await hopDongService.confirmContract(
      req.user,
      req.params.id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Admin xác nhận hợp đồng thành công",
      data,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const cancelContract = async (req, res) => {
  try {
    const data = await hopDongService.cancelContract(
      req.user,
      req.params.id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Hủy hợp đồng thành công",
      data,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  createContract,
  getAllContracts,
  getMyContracts,
  getContractById,
  getContractByProfileId,
  uploadSignedContract,
  confirmContract,
  cancelContract,
};