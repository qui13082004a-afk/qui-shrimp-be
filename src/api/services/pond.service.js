const pondRepository = require("../repositories/pond.repository");

const createPond = async (userId, data) => {
  if (!data.ten_ao) {
    throw new Error("Tên ao không được để trống");
  }

  if (!data.dien_tich || Number(data.dien_tich) <= 0) {
    throw new Error("Diện tích ao phải lớn hơn 0");
  }

  return await pondRepository.create({
    id_nguoi_dung: userId,
    ten_ao: data.ten_ao,
    dien_tich: data.dien_tich,
    dia_chi_ao: data.dia_chi_ao,
    loai_hinh_nuoi: data.loai_hinh_nuoi,
    trang_thai_ao: data.trang_thai_ao || "dang_hoat_dong",
    ghi_chu: data.ghi_chu,
  });
};

const getMyPonds = async (userId) => {
  return await pondRepository.findByUserId(userId);
};

const getPondById = async (id_ao, userId) => {
  const pond = await pondRepository.findById(id_ao);

  if (!pond) {
    throw new Error("Không tìm thấy ao nuôi");
  }

  if (pond.id_nguoi_dung !== userId) {
    throw new Error("Bạn không có quyền xem ao nuôi này");
  }

  return pond;
};

const updatePond = async (id_ao, userId, data) => {
  const pond = await pondRepository.findById(id_ao);

  if (!pond) {
    throw new Error("Không tìm thấy ao nuôi");
  }

  if (pond.id_nguoi_dung !== userId) {
    throw new Error("Bạn không có quyền cập nhật ao nuôi này");
  }

  if (data.dien_tich && Number(data.dien_tich) <= 0) {
    throw new Error("Diện tích ao phải lớn hơn 0");
  }

  return await pondRepository.update(id_ao, data);
};

const deletePond = async (id_ao, userId) => {
  const pond = await pondRepository.findById(id_ao);

  if (!pond) {
    throw new Error("Không tìm thấy ao nuôi");
  }

  if (pond.id_nguoi_dung !== userId) {
    throw new Error("Bạn không có quyền xóa ao nuôi này");
  }

  return await pondRepository.remove(id_ao);
};

module.exports = {
  createPond,
  getMyPonds,
  getPondById,
  updatePond,
  deletePond,
};