const thoaThuanBaBenService = require("../services/thoaThuanBaBen.service");

const requestAgreement = async (req, res) => {
  try {
    const data = await thoaThuanBaBenService.requestAgreement(req.user, req.body);
    return res.status(201).json({
      success: true,
      message: "Yêu cầu lập thỏa thuận ba bên thành công",
      data,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const prepareAgreement = async (req, res) => {
  try {
    const data = await thoaThuanBaBenService.prepareAgreement(
      req.user,
      req.params.id,
      req.body
    );
    return res.status(200).json({
      success: true,
      message: "Cập nhật thông tin thỏa thuận thành công",
      data,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const uploadSignedAgreement = async (req, res) => {
  try {
    const data = await thoaThuanBaBenService.uploadSignedAgreement(
      req.user,
      req.params.id,
      req.body
    );
    return res.status(200).json({
      success: true,
      message: "Upload thỏa thuận đã ký thành công",
      data,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const confirmAgreement = async (req, res) => {
  try {
    const data = await thoaThuanBaBenService.confirmAgreement(
      req.user,
      req.params.id,
      req.body
    );
    return res.status(200).json({
      success: true,
      message: "Xác nhận thỏa thuận ba bên thành công",
      data,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const cancelAgreement = async (req, res) => {
  try {
    const data = await thoaThuanBaBenService.cancelAgreement(
      req.user,
      req.params.id,
      req.body
    );
    return res.status(200).json({
      success: true,
      message: "Hủy thỏa thuận ba bên thành công",
      data,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const getAllAgreements = async (req, res) => {
  try {
    const data = await thoaThuanBaBenService.getAllAgreements(req.user);
    return res.status(200).json({
      success: true,
      message: "Lấy danh sách thỏa thuận thành công",
      data,
    });
  } catch (error) {
    return res.status(403).json({ success: false, message: error.message });
  }
};

const getMyAgreements = async (req, res) => {
  try {
    const data = await thoaThuanBaBenService.getMyAgreements(req.user);
    return res.status(200).json({
      success: true,
      message: "Lấy thỏa thuận của tôi thành công",
      data,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getAgreementById = async (req, res) => {
  try {
    const data = await thoaThuanBaBenService.getAgreementById(
      req.user,
      req.params.id
    );
    return res.status(200).json({
      success: true,
      message: "Lấy chi tiết thỏa thuận thành công",
      data,
    });
  } catch (error) {
    return res.status(404).json({ success: false, message: error.message });
  }
};

const getAgreementsByProfileId = async (req, res) => {
  try {
    const data = await thoaThuanBaBenService.getAgreementsByProfileId(
      req.user,
      req.params.profileId
    );
    return res.status(200).json({
      success: true,
      message: "Lấy thỏa thuận theo hồ sơ thành công",
      data,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  requestAgreement,
  prepareAgreement,
  uploadSignedAgreement,
  confirmAgreement,
  cancelAgreement,
  getAllAgreements,
  getMyAgreements,
  getAgreementById,
  getAgreementsByProfileId,
};