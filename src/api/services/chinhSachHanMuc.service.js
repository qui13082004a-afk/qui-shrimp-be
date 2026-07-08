const chinhSachHanMucRepository = require("../repositories/chinhSachHanMuc.repository");

const VALID_STAGES = [
  "giai_doan_1",
  "giai_doan_2",
  "giai_doan_3",
  "giai_doan_4",
];

const validatePolicyPayload = (data) => {
  if (!data.ten_chinh_sach || !data.ten_chinh_sach.trim()) {
    throw new Error("Vui lòng nhập tên chính sách");
  }

  if (!VALID_STAGES.includes(data.giai_doan)) {
    throw new Error("Giai đoạn hạn mức không hợp lệ");
  }

  if (data.tu_ngay === undefined || data.den_ngay === undefined) {
    throw new Error("Vui lòng nhập khoảng ngày áp dụng");
  }

  const tuNgay = Number(data.tu_ngay);
  const denNgay = Number(data.den_ngay);
  const hanMucToiDa = Number(data.han_muc_toi_da || 0);

  if (Number.isNaN(tuNgay) || Number.isNaN(denNgay)) {
    throw new Error("Khoảng ngày áp dụng không hợp lệ");
  }

  if (tuNgay < 0 || denNgay < 0) {
    throw new Error("Khoảng ngày không được nhỏ hơn 0");
  }

  if (tuNgay > denNgay) {
    throw new Error("Từ ngày không được lớn hơn đến ngày");
  }

  if (hanMucToiDa <= 0) {
    throw new Error("Hạn mức tối đa phải lớn hơn 0");
  }
};

const createPolicy = async (user, data) => {
  if (user.vai_tro !== "admin") {
    throw new Error("Chỉ Admin mới có quyền tạo chính sách hạn mức");
  }

  validatePolicyPayload(data);

  return await chinhSachHanMucRepository.create({
    id_admin_cap_nhat: user.id_nguoi_dung,
    ten_chinh_sach: data.ten_chinh_sach.trim(),
    giai_doan: data.giai_doan,
    tu_ngay: Number(data.tu_ngay),
    den_ngay: Number(data.den_ngay),
    han_muc_toi_da: Number(data.han_muc_toi_da),
    trang_thai: data.trang_thai || "hoat_dong",
    ghi_chu: data.ghi_chu || null,
  });
};

const getAllPolicies = async () => {
  return await chinhSachHanMucRepository.findAll();
};

const getActivePolicies = async () => {
  return await chinhSachHanMucRepository.findActive();
};

const getPolicyById = async (id_chinh_sach) => {
  const policy = await chinhSachHanMucRepository.findById(id_chinh_sach);

  if (!policy) {
    throw new Error("Không tìm thấy chính sách hạn mức");
  }

  return policy;
};

const updatePolicy = async (user, id_chinh_sach, data) => {
  if (user.vai_tro !== "admin") {
    throw new Error("Chỉ Admin mới có quyền cập nhật chính sách hạn mức");
  }

  const policy = await chinhSachHanMucRepository.findById(id_chinh_sach);
  if (!policy) {
    throw new Error("Không tìm thấy chính sách hạn mức");
  }

  const updateData = {};

  if (data.ten_chinh_sach !== undefined) {
    if (!data.ten_chinh_sach.trim()) {
      throw new Error("Tên chính sách không được để trống");
    }
    updateData.ten_chinh_sach = data.ten_chinh_sach.trim();
  }

  if (data.giai_doan !== undefined) {
    if (!VALID_STAGES.includes(data.giai_doan)) {
      throw new Error("Giai đoạn hạn mức không hợp lệ");
    }
    updateData.giai_doan = data.giai_doan;
  }

  if (data.tu_ngay !== undefined) {
    updateData.tu_ngay = Number(data.tu_ngay);
  }

  if (data.den_ngay !== undefined) {
    updateData.den_ngay = Number(data.den_ngay);
  }

  const tuNgay =
    updateData.tu_ngay !== undefined ? updateData.tu_ngay : Number(policy.tu_ngay);
  const denNgay =
    updateData.den_ngay !== undefined ? updateData.den_ngay : Number(policy.den_ngay);

  if (tuNgay < 0 || denNgay < 0 || tuNgay > denNgay) {
    throw new Error("Khoảng ngày áp dụng không hợp lệ");
  }

  if (data.han_muc_toi_da !== undefined) {
    const hanMuc = Number(data.han_muc_toi_da);
    if (hanMuc <= 0) {
      throw new Error("Hạn mức tối đa phải lớn hơn 0");
    }
    updateData.han_muc_toi_da = hanMuc;
  }

  if (data.trang_thai !== undefined) {
    if (!["hoat_dong", "tam_dung"].includes(data.trang_thai)) {
      throw new Error("Trạng thái chính sách không hợp lệ");
    }
    updateData.trang_thai = data.trang_thai;
  }

  if (data.ghi_chu !== undefined) {
    updateData.ghi_chu = data.ghi_chu;
  }

  updateData.id_admin_cap_nhat = user.id_nguoi_dung;

  return await chinhSachHanMucRepository.update(id_chinh_sach, updateData);
};

const togglePolicyStatus = async (user, id_chinh_sach, trang_thai) => {
  if (user.vai_tro !== "admin") {
    throw new Error("Chỉ Admin mới có quyền thay đổi trạng thái chính sách");
  }

  if (!["hoat_dong", "tam_dung"].includes(trang_thai)) {
    throw new Error("Trạng thái chính sách không hợp lệ");
  }

  const policy = await chinhSachHanMucRepository.findById(id_chinh_sach);
  if (!policy) {
    throw new Error("Không tìm thấy chính sách hạn mức");
  }

  return await chinhSachHanMucRepository.update(id_chinh_sach, {
    trang_thai,
    id_admin_cap_nhat: user.id_nguoi_dung,
  });
};

module.exports = {
  createPolicy,
  getAllPolicies,
  getActivePolicies,
  getPolicyById,
  updatePolicy,
  togglePolicyStatus,
};