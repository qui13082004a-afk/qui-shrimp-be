const {
  customerProfileRepository,
  pondRepository,
  cropSeasonRepository,
  debtExtensionRepository,
} = require("../repositories");

const createCustomerProfile = async (userId, data) => {
  const pond = await pondRepository.findById(data.id_ao);
  if (!pond) {
    throw new Error("Không tìm thấy thông tin ao nuôi trên hệ thống");
  }

  if (Number(pond.id_nguoi_dung) !== Number(userId)) {
    throw new Error("Bạn không có quyền đăng ký mua trả sau cho ao nuôi này");
  }

  const cropSeason = await cropSeasonRepository.findById(data.id_vu_nuoi);
  if (!cropSeason) {
    throw new Error("Không tìm thấy thông tin vụ nuôi yêu cầu");
  }

  if (Number(cropSeason.id_ao) !== Number(data.id_ao)) {
    throw new Error("Dữ liệu không khớp: Vụ nuôi không thuộc ao nuôi đã chọn");
  }

  if (cropSeason.trang_thai !== "dang_nuoi") {
    throw new Error("Chỉ được tạo hồ sơ mua trả sau cho vụ nuôi đang hoạt động");
  }

  const existedProfile = await customerProfileRepository.findByCropSeasonId(
    data.id_vu_nuoi
  );

  if (existedProfile) {
    throw new Error("Vụ nuôi này đã có hồ sơ mua trả sau");
  }

  return await customerProfileRepository.create({
    id_nguoi_dung: userId,
    id_ao: data.id_ao,
    id_vu_nuoi: data.id_vu_nuoi,
    id_chinh_sach: null,

    dinh_muc_cong_no: 0,
    han_muc_con_lai: 0,

    duoc_phep_tra_sau: false,
    bi_khoa_tra_sau: false,
    ly_do_khoa: null,

    han_thanh_toan: null,
    ngay_duyet: null,

    trang_thai_ho_so: "cho_kiem_tra",
    ly_do_tu_choi: null,

    anh_cccd_mat_truoc: data.anh_cccd_mat_truoc || null,
    anh_cccd_mat_sau: data.anh_cccd_mat_sau || null,
    anh_selfie: data.anh_selfie || null,

    trang_thai_xac_thuc: "chua_xac_thuc",
    ghi_chu: data.ghi_chu || null,
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

const getMyCustomerProfiles = async (userId) => {
  const profiles = await customerProfileRepository.findByUserId(userId);
  return await attachLatestExtensionDeadlineList(profiles);
};

const getAllCustomerProfiles = async () => {
  const profiles = await customerProfileRepository.findAll();
  return await attachLatestExtensionDeadlineList(profiles);
};

const getCustomerProfileById = async (user, id_ho_so) => {
  const profile = await customerProfileRepository.findById(id_ho_so);

  if (!profile) {
    throw new Error("Không tìm thấy hồ sơ khách hàng yêu cầu");
  }

  if (
    user.vai_tro !== "admin" &&
    user.vai_tro !== "nhan_vien_dinh_muc" &&
    Number(profile.id_nguoi_dung) !== Number(user.id_nguoi_dung)
  ) {
    throw new Error("Bạn không có quyền truy cập hồ sơ này");
  }

  return await attachLatestExtensionDeadline(profile);
};

const updateCustomerProfile = async (user, id_ho_so, data) => {
  const profile = await customerProfileRepository.findById(id_ho_so);

  if (!profile) {
    throw new Error("Không tìm thấy hồ sơ khách hàng cần cập nhật");
  }

  if (
    user.vai_tro !== "admin" &&
    user.vai_tro !== "nhan_vien_dinh_muc" &&
    Number(profile.id_nguoi_dung) !== Number(user.id_nguoi_dung)
  ) {
    throw new Error("Bạn không có quyền chỉnh sửa hồ sơ này");
  }

  let allowedFields = [];

  if (user.vai_tro === "admin") {
    allowedFields = [
      "trang_thai_ho_so",
      "ly_do_tu_choi",
      "bi_khoa_tra_sau",
      "ly_do_khoa",
      "ghi_chu",
    ];
  } else if (user.vai_tro === "nhan_vien_dinh_muc") {
    allowedFields = [
      "trang_thai_ho_so",
      "ghi_chu",
      "trang_thai_xac_thuc",
      "ly_do_xac_thuc_that_bai",
      "do_tuong_dong",
      "ngay_xac_thuc",
    ];
  } else {
    allowedFields = ["ghi_chu"];
  }

  allowedFields.forEach((field) => {
    if (data[field] !== undefined) {
      profile[field] = data[field];
    }
  });

  await profile.save();
  return profile;
};

/**
 * Tạm giữ để không vỡ route cũ.
 * Sau này khi có module Phiếu đề xuất hạn mức, hạn mức sẽ được duyệt ở service của Phiếu đề xuất.
 */
const approvePostpaid = async (user, id_ho_so, data) => {
  if (user.vai_tro !== "admin") {
    throw new Error("Chỉ Admin mới có quyền duyệt mua trả sau");
  }

  const profile = await customerProfileRepository.findById(id_ho_so);
  if (!profile) {
    throw new Error("Không tìm thấy hồ sơ khách hàng cần phê duyệt");
  }

  if (profile.trang_thai_ho_so === "tu_choi") {
    throw new Error("Hồ sơ đã bị từ chối, không thể duyệt");
  }

  const hanMuc = Number(data.dinh_muc_cong_no || 0);

  if (hanMuc <= 0) {
    throw new Error("Hạn mức được duyệt phải lớn hơn 0");
  }

  if (!data.han_thanh_toan) {
    throw new Error("Vui lòng nhập hạn thanh toán cho hồ sơ");
  }

  return await customerProfileRepository.update(id_ho_so, {
    id_chinh_sach: data.id_chinh_sach || profile.id_chinh_sach || null,
    dinh_muc_cong_no: hanMuc,
    han_muc_con_lai: hanMuc,
    duoc_phep_tra_sau: true,
    bi_khoa_tra_sau: false,
    ly_do_khoa: null,
    han_thanh_toan: data.han_thanh_toan,
    ngay_duyet: new Date(),
    trang_thai_ho_so: "da_duyet",
    ly_do_tu_choi: null,
    ghi_chu: data.ghi_chu || profile.ghi_chu,
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