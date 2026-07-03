const {
  customerProfileRepository,
  pondRepository,
  cropSeasonRepository,
  debtExtensionRepository,
} = require("../repositories");
/**
 * TẠO MỚI HỒ SƠ KHÁCH HÀNG (CẤP TÍN DỤNG DỰ THẢO)
 */
const createCustomerProfile = async (userId, data) => {
  // 1 Kiểm tra xem ao nuôi có tồn tại hay không
  const pond = await pondRepository.findById(data.id_ao);
  if (!pond) {
    throw new Error("Không tìm thấy thông tin ao nuôi trên hệ thống");
  }

  //Đảm bảo khách hàng chỉ được tạo hồ sơ cho ao của chính mình
  if (Number(pond.id_nguoi_dung) !== Number(userId)) {
    throw new Error("Bạn không có quyền đăng ký tín dụng cho ao nuôi này");
  }

  // Kiểm tra sự tồn tại của vụ nuôi
  const cropSeason = await cropSeasonRepository.findById(data.id_vu_nuoi);
  if (!cropSeason) {
    throw new Error("Không tìm thấy thông tin vụ nuôi yêu cầu");
  }

  //  Đảm bảo vụ nuôi phải thuộc về đúng ao nuôi đã chọn
  if (Number(cropSeason.id_ao) !== Number(data.id_ao)) {
    throw new Error("Dữ liệu không khớp: Vụ nuôi không thuộc về ao nuôi đã chọn");
  }

  // Chỉ cho phép mở hồ sơ trả sau đối với vụ nuôi đang hoạt động ('dang_nuoi')
  if (cropSeason.trang_thai !== "dang_nuoi") {
    throw new Error("Chỉ được phép tạo hồ sơ tín dụng cho các vụ nuôi đang hoạt động");
  }

  //  Một vụ nuôi chỉ được liên kết với duy nhất 1 hồ sơ khách hàng
  const existedProfile = await customerProfileRepository.findByCropSeasonId(data.id_vu_nuoi);
  if (existedProfile) {
    throw new Error("Vụ nuôi này đã được đăng ký hồ sơ khách hàng trước đó");
  }

  // Lưu dự thảo hồ sơ (Chờ Admin phê duyệt hạn mức công nợ)
  return await customerProfileRepository.create({
    id_nguoi_dung: userId,
    id_ao: data.id_ao,
    id_vu_nuoi: data.id_vu_nuoi,
    dinh_muc_cong_no: 0,
    duoc_phep_tra_sau: false,
    han_thanh_toan: null,
    ngay_duyet: null,
    ghi_chu: data.ghi_chu,
  });
};
const attachLatestExtensionDeadline = async (profile) => {
  if (!profile) return null;

  const plainProfile =
    typeof profile.toJSON === "function" ? profile.toJSON() : profile;

  const latestExtension =
    await debtExtensionRepository.findLatestApprovedByProfileId(
      plainProfile.id_ho_so
    );

  return {
    ...plainProfile,
    gia_han_moi_nhat: latestExtension || null,
    han_thanh_toan_goc: plainProfile.han_thanh_toan,
    han_thanh_toan_hien_tai: latestExtension
      ? latestExtension.han_de_xuat
      : plainProfile.han_thanh_toan,
  };
};

const attachLatestExtensionDeadlineList = async (profiles) => {
  return await Promise.all(
    profiles.map((profile) => attachLatestExtensionDeadline(profile))
  );
};
/**
 * LẤY DANH SÁCH HỒ SƠ CỦA TÔI (Dành cho Khách hàng)
 */
const getMyCustomerProfiles = async (userId) => {
  const profiles = await customerProfileRepository.findByUserId(userId);
  return await attachLatestExtensionDeadlineList(profiles);
};


/**
 * LẤY TOÀN BỘ HỒ SƠ HỆ THỐNG (Dành cho Admin)
 */
const getAllCustomerProfiles = async () => {
  const profiles = await customerProfileRepository.findAll();
  return await attachLatestExtensionDeadlineList(profiles);
};

/**
 * XEM CHI TIẾT HỒ SƠ THEO ID
 */
const getCustomerProfileById = async (user, id_ho_so) => {
  const profile = await customerProfileRepository.findById(id_ho_so);

  if (!profile) {
    throw new Error("Không tìm thấy hồ sơ khách hàng yêu cầu");
  }

  if (
    user.vai_tro !== "admin" &&
    Number(profile.id_nguoi_dung) !== Number(user.id_nguoi_dung)
  ) {
    throw new Error("Bạn không có quyền truy cập thông tin hồ sơ này");
  }

  return await attachLatestExtensionDeadline(profile);
};

/**
 * CẬP NHẬT HỒ SƠ KHÁCH HÀNG (Áp dụng Whitelist ngăn chặn Mass Assignment)
 */
const updateCustomerProfile = async (user, id_ho_so, data) => {
  const profile = await customerProfileRepository.findById(id_ho_so);

  if (!profile) {
    throw new Error("Không tìm thấy hồ sơ khách hàng cần cập nhật");
  }

  // Chỉ Admin hoặc chính chủ hồ sơ mới được sửa đổi
  if (user.vai_tro !== "admin" && Number(profile.id_nguoi_dung) !== Number(user.id_nguoi_dung)) {
    throw new Error("Bạn không có quyền chỉnh sửa hồ sơ này");
  }

  const allowedFields = user.vai_tro === "admin"
    ? ["dinh_muc_cong_no", "duoc_phep_tra_sau", "han_thanh_toan", "ghi_chu"] 
    : ["ghi_chu"]; 
  allowedFields.forEach((field) => {
    if (data[field] !== undefined) {
      profile[field] = data[field];
    }
  });

  await profile.save();
  return profile;
};

/**
 * DUYỆT CẤP HẠN MỨC TRẢ SAU (Chỉ dành cho Admin)
 */
const approvePostpaid = async (user, id_ho_so, data) => {
  // 1. BẢO MẬT: Kiểm tra vai trò thực thi
  if (user.vai_tro !== "admin") {
    throw new Error("Thao tác bị từ chối: Chỉ quản trị viên mới có quyền phê duyệt tín dụng trả sau");
  }

  const profile = await customerProfileRepository.findById(id_ho_so);
  if (!profile) {
    throw new Error("Không tìm thấy hồ sơ khách hàng cần phê duyệt");
  }
  //Tiến hành cập nhật trạng thái phê duyệt tín dụng hoạt động
  return await customerProfileRepository.update(id_ho_so, {
    dinh_muc_cong_no: data.dinh_muc_cong_no,
    duoc_phep_tra_sau: true,
    han_thanh_toan: data.han_thanh_toan,
    ngay_duyet: new Date(),
    ghi_chu: data.ghi_chu,
  });
};

module.exports = {
  createCustomerProfile,
  getMyCustomerProfiles,
  getAllCustomerProfiles,
  getCustomerProfileById,
  updateCustomerProfile,
  approvePostpaid,
};