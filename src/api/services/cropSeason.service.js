const { cropSeasonRepository, pondRepository } = require("../repositories");

/**
 * TẠO MỚI VỤ NUÔI (CROP SEASON)
 */
const createCropSeason = async (userId, data) => {

  // 1. NGHIỆP VỤ: Kiểm tra ao nuôi có tồn tại hay không
  const pond = await pondRepository.findById(data.id_ao);
  if (!pond) {
    throw new Error("Không tìm thấy thông tin ao nuôi trên hệ thống");
  }

  // 2. BẢO MẬT (IDOR Guard): Đảm bảo khách hàng chỉ được tạo vụ nuôi cho ao của chính mình
  if (Number(pond.id_nguoi_dung) !== Number(userId)) {
    throw new Error("Bạn không có quyền quản lý hoặc tạo vụ nuôi cho ao này");
  }

  // 3. NGHIỆP VỤ NUÔI TÔM: Một ao tại một thời điểm chỉ được phép có DUY NHẤT một vụ nuôi đang hoạt động ('dang_nuoi')
  const activeCropSeason = await cropSeasonRepository.findActiveByPondId(data.id_ao);
  if (activeCropSeason) {
    throw new Error(`Ao "${pond.ten_ao}" hiện đã có một vụ nuôi khác đang hoạt động ("${activeCropSeason.ten_vu_nuoi}"). Vui lòng kết thúc hoặc hủy vụ cũ trước khi mở vụ mới.`);
  }

  // 4. Tiến hành lưu xuống Database
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

/**
 * LẤY DANH SÁCH VỤ NUÔI THEO AO NUÔI
 */
const getCropSeasonsByPond = async (userId, id_ao) => {
  const pond = await pondRepository.findById(id_ao);

  if (!pond) {
    throw new Error("Không tìm thấy thông tin ao nuôi");
  }

  // Bảo mật: Đảm bảo khách hàng không xem trộm vụ nuôi của ao người khác
  if (Number(pond.id_nguoi_dung) !== Number(userId)) {
    throw new Error("Bạn không có quyền truy cập dữ liệu của ao nuôi này");
  }

  return await cropSeasonRepository.findByPondId(id_ao);
};

/**
 * LẤY CHI TIẾT MỘT VỤ NUÔI
 */
const getCropSeasonById = async (userId, id_vu_nuoi) => {
  const cropSeason = await cropSeasonRepository.findById(id_vu_nuoi);

  if (!cropSeason) {
    throw new Error("Không tìm thấy thông tin vụ nuôi yêu cầu");
  }

  // Bảo mật: Đối chiếu quyền sở hữu thông qua mối quan hệ liên kết (Association) AoNuoi
  if (!cropSeason.AoNuoi || Number(cropSeason.AoNuoi.id_nguoi_dung) !== Number(userId)) {
    throw new Error("Bạn không có quyền xem thông tin vụ nuôi này");
  }

  return cropSeason;
};

/**
 * CẬP NHẬT THÔNG TIN VỤ NUÔI
 */
const updateCropSeason = async (userId, id_vu_nuoi, data) => {
  const cropSeason = await cropSeasonRepository.findById(id_vu_nuoi);

  if (!cropSeason) {
    throw new Error("Không tìm thấy thông tin vụ nuôi cần cập nhật");
  }

  // Bảo mật: Kiểm tra quyền sở hữu
  if (!cropSeason.AoNuoi || Number(cropSeason.AoNuoi.id_nguoi_dung) !== Number(userId)) {
    throw new Error("Bạn không có quyền cập nhật vụ nuôi này");
  }
  if (data.trang_thai === "dang_nuoi" && cropSeason.trang_thai !== "dang_nuoi") {
    const activeCropSeason = await cropSeasonRepository.findActiveByPondId(cropSeason.id_ao);
    if (activeCropSeason && Number(activeCropSeason.id_vu_nuoi) !== Number(id_vu_nuoi)) {
      throw new Error("Không thể khôi phục trạng thái 'Đang nuôi' vì ao này hiện đã có một vụ khác đang hoạt động!");
    }
  }

  return await cropSeasonRepository.update(id_vu_nuoi, data);
};

/**
 * XÓA VỤ NUÔI (CÓ RÀNG BUỘC TOÀN VẸN)
 */
const deleteCropSeason = async (userId, id_vu_nuoi) => {
  const cropSeason = await cropSeasonRepository.findById(id_vu_nuoi);

  if (!cropSeason) {
    throw new Error("Không tìm thấy thông tin vụ nuôi cần xóa");
  }

  // Bảo mật: Kiểm tra quyền sở hữu
  if (!cropSeason.AoNuoi || Number(cropSeason.AoNuoi.id_nguoi_dung) !== Number(userId)) {
    throw new Error("Bạn không có quyền xóa vụ nuôi này");
  }

  //Chặn xóa vụ nuôi đang trong quá trình hoạt động ('dang_nuoi')
  if (cropSeason.trang_thai === "dang_nuoi") {
    throw new Error("Không thể xóa vụ nuôi đang hoạt động. Vui lòng cập nhật trạng thái vụ nuôi thành 'Đã thu hoạch' hoặc 'Hủy' trước khi xóa!");
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