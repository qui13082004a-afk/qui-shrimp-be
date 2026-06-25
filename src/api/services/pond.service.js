const { pondRepository, cropSeasonRepository } = require("../repositories");

/**
 * TẠO MỚI AO NUÔI MỚI
 */
const createPond = async (userId, data) => {
  if (!data.ten_ao) {
    throw new Error("Tên ao không được để trống");
  }

  if (!data.dien_tich || Number(data.dien_tich) <= 0) {
    throw new Error("Diện tích ao phải là số dương lớn hơn 0");
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

/**
 * LẤY DANH SÁCH AO NUÔI CỦA TÔI
 */
const getMyPonds = async (userId) => {
  return await pondRepository.findByUserId(userId);
};

/**
 * XEM CHI TIẾT AO NUÔI QUA ID (Bảo mật IDOR Guard)
 */
const getPondById = async (id_ao, userId) => {
  const pond = await pondRepository.findById(id_ao);

  if (!pond) {
    throw new Error("Không tìm thấy thông tin ao nuôi yêu cầu");
  }

  if (Number(pond.id_nguoi_dung) !== Number(userId)) {
    throw new Error("Bạn không có quyền truy cập dữ liệu của ao nuôi này");
  }

  return pond;
};

/**
 * CẬP NHẬT THÔNG TIN AO NUÔI
 */
const updatePond = async (id_ao, userId, data) => {
  const pond = await pondRepository.findById(id_ao);

  if (!pond) {
    throw new Error("Không tìm thấy thông tin ao nuôi cần cập nhật");
  }
  if (Number(pond.id_nguoi_dung) !== Number(userId)) {
    throw new Error("Bạn không có quyền chỉnh sửa thông tin ao nuôi này");
  }

  if (data.dien_tich && Number(data.dien_tich) <= 0) {
    throw new Error("Diện tích ao nuôi cập nhật phải lớn hơn 0");
  }

  //Nếu muốn tạm ngưng ao, phải kiểm tra xem ao đó có vụ nuôi nào đang hoạt động hay không
  if (data.trang_thai_ao === "tam_ngung" && pond.trang_thai_ao !== "tam_ngung") {
    const activeCropSeason = await cropSeasonRepository.findActiveByPondId(id_ao);
    if (activeCropSeason) {
      throw new Error(
        `Không thể tạm ngưng ao nuôi này vì vụ nuôi "${activeCropSeason.ten_vu_nuoi}" trong ao vẫn đang diễn ra!`
      );
    }
  }

  return await pondRepository.update(id_ao, data);
};

/**
 * XÓA AO NUÔI (Bảo đảm ràng buộc toàn vẹn cơ sở dữ liệu)
 */
const deletePond = async (id_ao, userId) => {
  const pond = await pondRepository.findById(id_ao);

  if (!pond) {
    throw new Error("Không tìm thấy thông tin ao nuôi cần xóa");
  }
  if (Number(pond.id_nguoi_dung) !== Number(userId)) {
    throw new Error("Bạn không có quyền xóa ao nuôi này");
  }

  //Chặn xóa ao nuôi nếu ao này đã có  vụ nuôi (lịch sử mùa vụ)
  const cropSeasons = await cropSeasonRepository.findByPondId(id_ao);
  if (cropSeasons && cropSeasons.length > 0) {
    throw new Error(
      "Không thể xóa ao nuôi này do hệ thống ghi nhận đã có dữ liệu lịch sử vụ nuôi liên kết."
    );
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