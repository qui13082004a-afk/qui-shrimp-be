const { cropSeasonRepository, pondRepository } = require("../repositories");

/**
 * TẠO MỚI VỤ NUÔI (CROP SEASON)
 */
const createCropSeason = async (userId, data) => {
  const pond = await pondRepository.findById(data.id_ao);
  if (!pond) {
    throw new Error("Không tìm thấy thông tin ao nuôi trên hệ thống");
  }
  if (Number(pond.id_nguoi_dung) !== Number(userId)) {
    throw new Error("Bạn không có quyền quản lý hoặc tạo vụ nuôi cho ao này");
  }
  const activeCropSeason = await cropSeasonRepository.findActiveByPondId(data.id_ao);
  if (activeCropSeason) {
    throw new Error(`Ao "${pond.ten_ao}" hiện đã có một vụ nuôi khác đang hoạt động ("${activeCropSeason.ten_vu_nuoi}"). Vui lòng kết thúc hoặc hủy vụ cũ trước khi mở vụ mới.`);
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

/**
 * LẤY DANH SÁCH VỤ NUÔI THEO AO NUÔI
 */
const getCropSeasonsByPond = async (userId, id_ao) => {
  const pond = await pondRepository.findById(id_ao);

  if (!pond) {
    throw new Error("Không tìm thấy thông tin ao nuôi");
  }
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
 * XÓA VỤ NUÔI 
 */
const deleteCropSeason = async (userId, id_vu_nuoi) => {
  const cropSeason = await cropSeasonRepository.findById(id_vu_nuoi);

  if (!cropSeason) {
    throw new Error("Không tìm thấy thông tin vụ nuôi cần xóa");
  }
  if (!cropSeason.AoNuoi || Number(cropSeason.AoNuoi.id_nguoi_dung) !== Number(userId)) {
    throw new Error("Bạn không có quyền xóa vụ nuôi này");
  }

  //Chặn xóa vụ nuôi đang trong quá trình hoạt động ('dang_nuoi')
  if (cropSeason.trang_thai === "dang_nuoi") {
    throw new Error("Không thể xóa vụ nuôi đang hoạt động. Vui lòng cập nhật trạng thái vụ nuôi thành 'Đã thu hoạch' hoặc 'Hủy' trước khi xóa!");
  }

  return await cropSeasonRepository.remove(id_vu_nuoi);
};
const toNumber = (value) => Number(value || 0);
//hàm tổng đơn hàng của vụ nuôi
const getSeasonOrderSummary = async (id_nguoi_dung, id_vu_nuoi) => {
  const season = await cropSeasonRepository.getSeasonOrderSummary(
    id_nguoi_dung,
    id_vu_nuoi
  );

  if (!season) {
    throw new Error("Không tìm thấy vụ nuôi hoặc bạn không có quyền xem");
  }

  const plain = season.toJSON();
  const orders = plain.DonHangs || [];

//filter()  → WHERE
  const validOrders = orders.filter(
    (order) =>
      !["da_huy", "giao_that_bai"].includes(order.trang_thai_don_hang)
  );
//reduce() cộng dồn → SUM()
  const tong_von = validOrders.reduce(
    (sum, order) => sum + toNumber(order.tong_thanh_toan),
    0
  );

  return {
    ten_vu_nuoi: plain.ten_vu_nuoi,
    ngay_tha_giong: plain.ngay_tha_giong,
    ao_nuoi: plain.AoNuoi
      ? {
        ten_ao: plain.AoNuoi.ten_ao,
      }
      : null,
      //.length → COUNT()
    tong_so_don: validOrders.length,
    tong_von,
    don_hoan_tat: validOrders.filter(
      (order) => order.trang_thai_don_hang === "hoan_tat"
    ).length,
    don_dang_xu_ly: validOrders.filter((order) =>
      ["cho_xu_ly", "cho_thanh_toan", "da_thanh_toan", "cho_giao", "dang_giao"]
        .includes(order.trang_thai_don_hang)
    ).length,

    orders: validOrders.map((order) => ({
      id_don_hang: order.id_don_hang,
      ngay_dat: order.ngay_dat,
      tong_tien: toNumber(order.tong_tien),
      phi_van_chuyen: toNumber(order.phi_van_chuyen),
      tong_thanh_toan: toNumber(order.tong_thanh_toan),
      hinh_thuc_thanh_toan: order.hinh_thuc_thanh_toan,
      trang_thai_don_hang: order.trang_thai_don_hang,

      san_pham: (order.ChiTietDonHangs || []).map((item) => ({
        id_chi_tiet: item.id_chi_tiet,
        ten_san_pham: item.SanPham?.ten_san_pham || "Sản phẩm không tồn tại",
        hinh_anh: item.SanPham?.hinh_anh || null,
        don_vi_tinh: item.SanPham?.don_vi_tinh || null,
        gia_ban: toNumber(item.gia_ban),
        so_luong_dat: item.so_luong_dat,
        thanh_tien: toNumber(item.thanh_tien),
      })),
    })),
  };
};
module.exports = {
  createCropSeason,
  getCropSeasonsByPond,
  getCropSeasonById,
  updateCropSeason,
  deleteCropSeason,
  getSeasonOrderSummary,
};
