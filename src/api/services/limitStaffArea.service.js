const {
  authRepository,
  khuVucHoTroTraSauRepository,
  limitStaffAreaRepository,
} = require("../repositories");

const validateAdmin = (user) => {
  if (!user || user.vai_tro !== "admin") {
    throw new Error("Chi Admin moi co quyen phan vung nhan vien tham dinh");
  }
};

const getAssignments = async (user) => {
  validateAdmin(user);
  return limitStaffAreaRepository.findAll();
};

const assignStaffToArea = async (user, data) => {
  validateAdmin(user);

  const staff = await authRepository.findById(data.id_nguoi_dung);
  if (!staff) throw new Error("Khong tim thay nhan vien");
  if (staff.vai_tro !== "nhan_vien_dinh_muc") {
    throw new Error("Nguoi dung nay khong phai nhan vien tham dinh");
  }

  const area = await khuVucHoTroTraSauRepository.findById(data.id_khu_vuc);
  if (!area) throw new Error("Khong tim thay khu vuc ho tro tra sau");

  return limitStaffAreaRepository.upsert({
    id_nguoi_dung: data.id_nguoi_dung,
    id_khu_vuc: data.id_khu_vuc,
    trang_thai: data.trang_thai || "dang_phu_trach",
    ghi_chu: data.ghi_chu || null,
  });
};

const updateAssignment = async (user, id_phan_cong, data) => {
  validateAdmin(user);

  const patch = {};
  if (data.trang_thai !== undefined) patch.trang_thai = data.trang_thai;
  if (data.ghi_chu !== undefined) patch.ghi_chu = data.ghi_chu || null;

  const updated = await limitStaffAreaRepository.update(id_phan_cong, patch);
  if (!updated) throw new Error("Khong tim thay phan cong khu vuc");
  return updated;
};

module.exports = {
  getAssignments,
  assignStaffToArea,
  updateAssignment,
};
