const { customerProfileService } = require("../services");

const createCustomerProfile = async (req, res) => {
  try {
    const profile = await customerProfileService.createCustomerProfile(
      req.user.id_nguoi_dung,
      req.body
    );

    return res.status(201).json({
      success: true,
      message: "Tạo hồ sơ khách hàng thành công",
      data: profile,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getMyCustomerProfiles = async (req, res) => {
  try {
    const profiles = await customerProfileService.getMyCustomerProfiles(
      req.user.id_nguoi_dung
    );

    return res.status(200).json({
      success: true,
      message: "Lấy hồ sơ của tôi thành công",
      data: profiles,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getAllCustomerProfiles = async (req, res) => {
  try {
    const profiles = await customerProfileService.getAllCustomerProfiles();

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách hồ sơ khách hàng thành công",
      data: profiles,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getCustomerProfileById = async (req, res) => {
  try {
    const profile = await customerProfileService.getCustomerProfileById(
      req.user,
      req.params.id
    );

    return res.status(200).json({
      success: true,
      message: "Lấy chi tiết hồ sơ khách hàng thành công",
      data: profile,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

const updateCustomerProfile = async (req, res) => {
  try {
    const profile = await customerProfileService.updateCustomerProfile(
      req.user,
      req.params.id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Cập nhật hồ sơ khách hàng thành công",
      data: profile,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const approvePostpaid = async (req, res) => {
  try {
    const profile = await customerProfileService.approvePostpaid(
      req.user,
      req.params.id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Duyệt trả sau thành công",
      data: profile,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createCustomerProfile,
  getMyCustomerProfiles,
  getAllCustomerProfiles,
  getCustomerProfileById,
  updateCustomerProfile,
  approvePostpaid,
};