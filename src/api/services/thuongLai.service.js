const { thuongLaiRepository } = require("../repositories");

const createMerchant = async (user, data) => {
  if (user.vai_tro !== "admin" && user.vai_tro !== "nhan_vien_dinh_muc") {
    throw new Error("Bạn không có quyền tạo thương lái");
  }

  if (!data.ten_thuong_lai || !data.ten_thuong_lai.trim()) {
    throw new Error("Vui lòng nhập tên thương lái");
  }

  if (!data.so_dien_thoai || !/^0\d{9}$/.test(data.so_dien_thoai)) {
    throw new Error("Số điện thoại thương lái không hợp lệ");
  }

  const existed = await thuongLaiRepository.findByPhone(data.so_dien_thoai);

  if (existed) {
    throw new Error("Số điện thoại thương lái đã tồn tại");
  }

  return await thuongLaiRepository.create({
    ten_thuong_lai: data.ten_thuong_lai.trim(),
    so_dien_thoai: data.so_dien_thoai,
    dia_chi: data.dia_chi || null,
    ma_so_thue: data.ma_so_thue || null,
    trang_thai: data.trang_thai || "hoat_dong",
    so_lan_tham_gia: 0,
    so_lan_vi_pham: 0,
    ghi_chu: data.ghi_chu || null,
  });
};

const getAllMerchants = async (user) => {
  if (user.vai_tro !== "admin" && user.vai_tro !== "nhan_vien_dinh_muc") {
    throw new Error("Bạn không có quyền xem danh sách thương lái");
  }

  return await thuongLaiRepository.findAll();
};

const getActiveMerchants = async () => {
  return await thuongLaiRepository.findActive();
};

const getMerchantById = async (user, id_thuong_lai) => {
  if (user.vai_tro !== "admin" && user.vai_tro !== "nhan_vien_dinh_muc") {
    throw new Error("Bạn không có quyền xem thương lái");
  }

  const merchant = await thuongLaiRepository.findById(id_thuong_lai);

  if (!merchant) {
    throw new Error("Không tìm thấy thương lái");
  }

  return merchant;
};

const updateMerchant = async (user, id_thuong_lai, data) => {
  if (user.vai_tro !== "admin") {
    throw new Error("Chỉ Admin mới có quyền cập nhật thương lái");
  }

  const merchant = await thuongLaiRepository.findById(id_thuong_lai);

  if (!merchant) {
    throw new Error("Không tìm thấy thương lái");
  }

  const updateData = {};

  if (data.ten_thuong_lai !== undefined) {
    if (!data.ten_thuong_lai.trim()) {
      throw new Error("Tên thương lái không được để trống");
    }
    updateData.ten_thuong_lai = data.ten_thuong_lai.trim();
  }

  if (data.so_dien_thoai !== undefined) {
    if (!/^0\d{9}$/.test(data.so_dien_thoai)) {
      throw new Error("Số điện thoại thương lái không hợp lệ");
    }

    const existed = await thuongLaiRepository.findByPhone(data.so_dien_thoai);

    if (
      existed &&
      Number(existed.id_thuong_lai) !== Number(id_thuong_lai)
    ) {
      throw new Error("Số điện thoại thương lái đã tồn tại");
    }

    updateData.so_dien_thoai = data.so_dien_thoai;
  }

  if (data.dia_chi !== undefined) updateData.dia_chi = data.dia_chi;
  if (data.ma_so_thue !== undefined) updateData.ma_so_thue = data.ma_so_thue;
  if (data.ghi_chu !== undefined) updateData.ghi_chu = data.ghi_chu;

  return await thuongLaiRepository.update(id_thuong_lai, updateData);
};

const updateMerchantStatus = async (user, id_thuong_lai, data) => {
  if (user.vai_tro !== "admin") {
    throw new Error("Chỉ Admin mới có quyền đổi trạng thái thương lái");
  }

  const { trang_thai } = data;

  if (!["hoat_dong", "tam_khoa", "ngung_hop_tac"].includes(trang_thai)) {
    throw new Error("Trạng thái thương lái không hợp lệ");
  }

  const merchant = await thuongLaiRepository.findById(id_thuong_lai);

  if (!merchant) {
    throw new Error("Không tìm thấy thương lái");
  }

  return await thuongLaiRepository.update(id_thuong_lai, {
    trang_thai,
    ghi_chu: data.ghi_chu || merchant.ghi_chu,
  });
};

const increaseViolation = async (user, id_thuong_lai, data = {}) => {
  if (user.vai_tro !== "admin") {
    throw new Error("Chỉ Admin mới có quyền ghi nhận vi phạm thương lái");
  }

  const merchant = await thuongLaiRepository.findById(id_thuong_lai);

  if (!merchant) {
    throw new Error("Không tìm thấy thương lái");
  }

  const newViolationCount = Number(merchant.so_lan_vi_pham || 0) + 1;

  let newStatus = merchant.trang_thai;

  if (newViolationCount >= 3) {
    newStatus = "tam_khoa";
  }

  return await thuongLaiRepository.update(id_thuong_lai, {
    so_lan_vi_pham: newViolationCount,
    trang_thai: newStatus,
    ghi_chu: data.ghi_chu || merchant.ghi_chu,
  });
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