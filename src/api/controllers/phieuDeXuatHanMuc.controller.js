const phieuDeXuatHanMucService = require("../services/phieuDeXuatHanMuc.service");

const createProposal = async (req, res) => {
  try {
    const data = await phieuDeXuatHanMucService.createProposal(
      req.user,
      req.body,
      req.files || []
    );

    return res.status(201).json({
      success: true,
      message: "Lập phiếu đề xuất hạn mức thành công",
      data,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getAllProposals = async (req, res) => {
  try {
    const data = await phieuDeXuatHanMucService.getAllProposals(req.user);

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách phiếu đề xuất hạn mức thành công",
      data,
    });
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: error.message,
    });
  }
};

const getProposalById = async (req, res) => {
  try {
    const data = await phieuDeXuatHanMucService.getProposalById(
      req.user,
      req.params.id
    );

    return res.status(200).json({
      success: true,
      message: "Lấy chi tiết phiếu đề xuất hạn mức thành công",
      data,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

const getProposalsByProfileId = async (req, res) => {
  try {
    const data = await phieuDeXuatHanMucService.getProposalsByProfileId(
      req.user,
      req.params.profileId
    );

    return res.status(200).json({
      success: true,
      message: "Lấy phiếu đề xuất theo hồ sơ thành công",
      data,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const approveProposal = async (req, res) => {
  try {
    const data = await phieuDeXuatHanMucService.approveProposal(
      req.user,
      req.params.id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Duyệt phiếu đề xuất hạn mức thành công",
      data,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const rejectProposal = async (req, res) => {
  try {
    const data = await phieuDeXuatHanMucService.rejectProposal(
      req.user,
      req.params.id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Từ chối phiếu đề xuất hạn mức thành công",
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
  createProposal,
  getAllProposals,
  getProposalById,
  getProposalsByProfileId,
  approveProposal,
  rejectProposal,
};
