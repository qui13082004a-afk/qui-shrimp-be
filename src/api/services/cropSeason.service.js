const { cropSeasonRepository, pondRepository } = require("../repositories");

const createCropSeason = async (userId, data) => {
  if (!data.id_ao) {
    throw new Error("Vui lòng chọn ao nuôi");
  }

  if (!data.ten_vu_nuoi) {
    throw new Error("Tên vụ nuôi không được để trống");
  }

  const pond = await pondRepository.findById(data.id_ao);

  if (!pond) {
    throw new Error("Không tìm thấy ao nuôi");
  }

  if (Number(pond.id_nguoi_dung) !== Number(userId)) {
    throw new Error("Bạn không có quyền tạo vụ nuôi cho ao này");
  }

  const activeCropSeason = await cropSeasonRepository.findActiveByPondId(
    data.id_ao
  );

  if (activeCropSeason) {
    throw new Error("Ao này đang có vụ nuôi hoạt động");
  }

  return await cropSeasonRepository.create({
    id_ao: data.id_ao,
    ten_vu_nuoi: data.ten_vu_nuoi,
    ngay_tha_giong: data.ngay_tha_giong,
    so_luong_giong: data.so_luong_giong,
    ngay_thu_hoach_du_kien: data.ngay_thu_hoach_du_kien,
    trang_thai: data.trang_thai || "dang_nuoi",
    ghi_chu: data.ghi_chu,
  });
};

const getCropSeasonsByPond = async (userId, id_ao) => {
  const pond = await pondRepository.findById(id_ao);

  if (!pond) {
    throw new Error("Không tìm thấy ao nuôi");
  }

  if (Number(pond.id_nguoi_dung) !== Number(userId)) {
    throw new Error("Bạn không có quyền xem vụ nuôi của ao này");
  }

  return await cropSeasonRepository.findByPondId(id_ao);
};

const getCropSeasonById = async (userId, id_vu_nuoi) => {
  const cropSeason = await cropSeasonRepository.findById(id_vu_nuoi);

  if (!cropSeason) {
    throw new Error("Không tìm thấy vụ nuôi");
  }

  if (Number(cropSeason.AoNuoi.id_nguoi_dung) !== Number(userId)) {
    throw new Error("Bạn không có quyền xem vụ nuôi này");
  }

  return cropSeason;
};

const updateCropSeason = async (userId, id_vu_nuoi, data) => {
  const cropSeason = await cropSeasonRepository.findById(id_vu_nuoi);

  if (!cropSeason) {
    throw new Error("Không tìm thấy vụ nuôi");
  }

  if (Number(cropSeason.AoNuoi.id_nguoi_dung) !== Number(userId)) {
    throw new Error("Bạn không có quyền cập nhật vụ nuôi này");
  }

  if (
    data.trang_thai &&
    !["dang_nuoi", "da_thu_hoach", "huy"].includes(data.trang_thai)
  ) {
    throw new Error("Trạng thái vụ nuôi không hợp lệ");
  }

  return await cropSeasonRepository.update(id_vu_nuoi, data);
};

const deleteCropSeason = async (userId, id_vu_nuoi) => {
  const cropSeason = await cropSeasonRepository.findById(id_vu_nuoi);

  if (!cropSeason) {
    throw new Error("Không tìm thấy vụ nuôi");
  }

  if (Number(cropSeason.AoNuoi.id_nguoi_dung) !== Number(userId)) {
    throw new Error("Bạn không có quyền xóa vụ nuôi này");
  }

  return await cropSeasonRepository.remove(id_vu_nuoi);
};

module.exports = {
  createCropSeason,
  getCropSeasonsByPond,
  getCropSeasonById,
  updateCropSeason,
  deleteCropSeason,
};