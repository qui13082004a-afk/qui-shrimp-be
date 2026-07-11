const { customerProfileService } = require("../services");

const filePath = (req, field) => {
  const file = req.files?.[field]?.[0];
  return file ? `/uploads/customer-profiles/${file.filename}` : null;
};

const toBoolean = (value) => value === true || value === "true" || value === "1" || value === 1;

const createCustomerProfile = async (req, res) => {
  try {
    const payload = {
      ...req.body,
      cam_ket_thong_tin: toBoolean(req.body.cam_ket_thong_tin),
      dong_y_xac_minh: toBoolean(req.body.dong_y_xac_minh),
      dong_y_dieu_khoan: toBoolean(req.body.dong_y_dieu_khoan),
      anh_cccd_mat_truoc: filePath(req, "anh_cccd_mat_truoc"),
      anh_cccd_mat_sau: filePath(req, "anh_cccd_mat_sau"),
      anh_selfie: filePath(req, "anh_selfie"),
      anh_bien_lai_tha_giong: filePath(req, "anh_bien_lai_tha_giong"),
      anh_ao_nuoi: filePath(req, "anh_ao_nuoi"),
    };
    const profile = await customerProfileService.createCustomerProfile(req.user.id_nguoi_dung, payload);
    return res.status(201).json({ success: true, message: "Gửi hồ sơ đăng ký mua trả sau thành công", data: profile });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const getMyCustomerProfiles = async (req, res) => {
  try { return res.json({ success: true, data: await customerProfileService.getMyCustomerProfiles(req.user.id_nguoi_dung) }); }
  catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};
const getAllCustomerProfiles = async (_req, res) => {
  try { return res.json({ success: true, data: await customerProfileService.getAllCustomerProfiles() }); }
  catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};
const getCustomerProfileById = async (req, res) => {
  try { return res.json({ success: true, data: await customerProfileService.getCustomerProfileById(req.user, req.params.id) }); }
  catch (error) { return res.status(404).json({ success: false, message: error.message }); }
};
const updateCustomerProfile = async (req, res) => {
  try { return res.json({ success: true, message: "Cập nhật hồ sơ thành công", data: await customerProfileService.updateCustomerProfile(req.user, req.params.id, req.body) }); }
  catch (error) { return res.status(400).json({ success: false, message: error.message }); }
};
const approvePostpaid = async (req, res) => {
  try { return res.json({ success: true, message: "Duyệt trả sau thành công", data: await customerProfileService.approvePostpaid(req.user, req.params.id, req.body) }); }
  catch (error) { return res.status(400).json({ success: false, message: error.message }); }
};

module.exports = { createCustomerProfile, getMyCustomerProfiles, getAllCustomerProfiles, getCustomerProfileById, updateCustomerProfile, approvePostpaid };