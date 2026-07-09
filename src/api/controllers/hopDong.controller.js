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
    return res.status(400).json({
      success: false,
      message: error.message,
    });
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
    return res.status(403).json({
      success: false,
      message: error.message,
    });
  }
};

const getStaffContracts = async (req, res) => {
  try {
    const data = await hopDongService.getStaffContracts(req.user);

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách hợp đồng cho nhân viên thành công",
      data,
    });
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: error.message,
    });
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
    return res.status(500).json({
      success: false,
      message: error.message,
    });
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
    return res.status(404).json({
      success: false,
      message: error.message,
    });
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
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

const uploadSignedPdf = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng chọn file PDF hợp đồng đã ký",
      });
    }

    const data = await hopDongService.uploadSignedPdf(req.user, req.params.id, {
      file_hop_dong_da_ky: req.file.path,
      ngay_ky: req.body.ngay_ky || null,
      ghi_chu: req.body.ghi_chu || null,
    });

    return res.status(200).json({
      success: true,
      message: "Upload PDF hợp đồng đã ký thành công",
      data,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const uploadSignedImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng chọn ảnh hợp đồng đã ký",
      });
    }

    const data = await hopDongService.uploadSignedImage(
      req.user,
      req.params.id,
      {
        anh_hop_dong_da_ky: req.file.path,
        ngay_ky: req.body.ngay_ky || null,
        ghi_chu: req.body.ghi_chu || null,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Upload ảnh hợp đồng đã ký thành công",
      data,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
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
    return res.status(400).json({
      success: false,
      message: error.message,
    });
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
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const restoreContract = async (req, res) => {
  try {
    const data = await hopDongService.restoreContract(
      req.user,
      req.params.id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Khôi phục hợp đồng thành công",
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
  createContract,
  getAllContracts,
  getStaffContracts,
  getMyContracts,
  getContractById,
  getContractByProfileId,
  uploadSignedPdf,
  uploadSignedImage,
  confirmContract,
  cancelContract,
  restoreContract,
};