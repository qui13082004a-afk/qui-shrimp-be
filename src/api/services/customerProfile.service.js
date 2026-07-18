const {
  customerProfileRepository,
  pondRepository,
  cropSeasonRepository,
  debtExtensionRepository,
  khuVucHoTroTraSauRepository,
} = require("../repositories");
const notificationService = require("./notification.service");
const { getS3SignedUrl } = require("../../helpers/s3SignedUrl");

const safeNotifyProfile = async (callback) => {
  try {
    await callback();
  } catch (error) {
    console.error("Khong the gui thong bao ho so:", error.message);
  }
};

const requiredTextFields = [
  ["ho_ten", "Họ tên"], ["ngay_sinh", "Ngày sinh"], ["so_cccd", "Số CCCD"],
  ["so_dien_thoai", "Số điện thoại"], ["dia_chi_thuong_tru", "Địa chỉ thường trú"],
  ["tinh_thanh_ao", "Tỉnh/thành của ao"], ["quan_huyen_ao", "Quận/huyện của ao"],
  ["phuong_xa_ao", "Phường/xã của ao"], ["nguon_thu_nhap_tra_no", "Nguồn thu nhập trả nợ"],
  ["ngay_thu_hoach_du_kien", "Ngày thu hoạch dự kiến"], ["mat_hang_du_kien", "Mặt hàng dự kiến mua"],
];

// Số hồ sơ mua trả sau tối đa 1 khách hàng được phép có (không tính hồ sơ
// đã bị Admin từ chối - khách bị từ chối vẫn được nộp lại hồ sơ mới).
const MAX_ACTIVE_PROFILES = 2;

const normalizeText = (value) => String(value || "").trim().replace(/\s+/g, " ");

const parseMediaValue = (value) => {
  if (Array.isArray(value) || typeof value !== "string") return value;

  const trimmed = value.trim();
  if (!trimmed.startsWith("[") && !trimmed.startsWith("{")) return value;

  try {
    return JSON.parse(trimmed);
  } catch (_error) {
    return value;
  }
};

const signProfileMedia = async (profile) => {
  if (!profile) return null;

  const plain = typeof profile.toJSON === "function" ? profile.toJSON() : { ...profile };
  const mediaFields = [
    "anh_cccd_mat_truoc",
    "anh_cccd_mat_sau",
    "anh_bien_lai_tha_giong",
    "anh_ao_nuoi",
  ];

  await Promise.all(
    mediaFields.map(async (field) => {
      const value = parseMediaValue(plain[field]);
      if (!value) return;

      if (Array.isArray(value)) {
        plain[field] = await Promise.all(value.map((item) => getS3SignedUrl(item)));
        return;
      }

      plain[field] = await getS3SignedUrl(value);
    })
  );

  return plain;
};

const isValidPersonName = (value) => {
  const name = normalizeText(value);
  return (
    name.length >= 2 &&
    name.length <= 100 &&
    /^[A-Za-zÀ-ỹ\s]+$/.test(name) &&
    /[A-Za-zÀ-ỹ]/.test(name)
  );
};

const validateGuarantorData = (data) => {
  const hasGuarantorInfo = [
    data.nguoi_bao_lanh_ho_ten,
    data.nguoi_bao_lanh_sdt,
    data.nguoi_bao_lanh_cccd,
    data.nguoi_bao_lanh_quan_he,
  ].some((value) => normalizeText(value));

  if (!hasGuarantorInfo) return;

  if (!isValidPersonName(data.nguoi_bao_lanh_ho_ten)) {
    throw new Error("Ho ten nguoi bao lanh chi duoc nhap chu, tu 2 den 100 ky tu");
  }

  if (!/^0\d{9}$/.test(normalizeText(data.nguoi_bao_lanh_sdt))) {
    throw new Error("So dien thoai nguoi bao lanh phai gom 10 chu so va bat dau bang 0");
  }

  if (!/^\d{9}$|^\d{12}$/.test(normalizeText(data.nguoi_bao_lanh_cccd))) {
    throw new Error("So CCCD nguoi bao lanh phai gom 9 hoac 12 chu so");
  }

  if (
    normalizeText(data.nguoi_bao_lanh_quan_he) &&
    !isValidPersonName(data.nguoi_bao_lanh_quan_he)
  ) {
    throw new Error("Quan he voi khach hang chi duoc nhap chu, tu 2 den 100 ky tu");
  }
};

const validateCreateData = (data) => {
  for (const [field, label] of requiredTextFields) {
    if (!String(data[field] || "").trim()) throw new Error(`Vui lòng nhập ${label}`);
  }

  const positiveNumbers = [
    ["dien_tich_ao", "Diện tích ao"], ["so_vu_nuoi_moi_nam", "Số vụ nuôi mỗi năm"],
    ["san_luong_du_kien", "Sản lượng dự kiến"], ["kinh_nghiem_nuoi_nam", "Kinh nghiệm nuôi"],
    ["han_muc_mong_muon", "Hạn mức mong muốn"], ["thoi_han_tra_mong_muon", "Thời hạn trả mong muốn"],
  ];
  for (const [field, label] of positiveNumbers) {
    if (Number(data[field]) <= 0) throw new Error(`${label} phải lớn hơn 0`);
  }

  validateGuarantorData(data);

  if (!data.cam_ket_thong_tin || !data.dong_y_xac_minh || !data.dong_y_dieu_khoan) {
    throw new Error("Bạn phải đồng ý đầy đủ các cam kết trước khi gửi hồ sơ");
  }
};

const createCustomerProfile = async (userId, data) => {
  validateCreateData(data);

  const pond = await pondRepository.findById(data.id_ao);
  if (!pond) throw new Error("Không tìm thấy thông tin ao nuôi trên hệ thống");
  if (Number(pond.id_nguoi_dung) !== Number(userId)) throw new Error("Bạn không có quyền đăng ký trả sau cho ao nuôi này");

  const cropSeason = await cropSeasonRepository.findById(data.id_vu_nuoi);
  if (!cropSeason) throw new Error("Không tìm thấy thông tin vụ nuôi yêu cầu");
  if (Number(cropSeason.id_ao) !== Number(data.id_ao)) throw new Error("Vụ nuôi không thuộc ao nuôi đã chọn");
  if (cropSeason.trang_thai !== "dang_nuoi") throw new Error("Chỉ được đăng ký cho vụ nuôi đang hoạt động");

  const existed = await customerProfileRepository.findByCropSeasonId(data.id_vu_nuoi);
  if (existed) throw new Error("Vụ nuôi này đã có hồ sơ mua trả sau");

  const activeProfileCount = await customerProfileRepository.countByUserId(userId, ["tu_choi"]);
  if (activeProfileCount >= MAX_ACTIVE_PROFILES) {
    throw new Error(`Bạn chỉ được gửi tối đa ${MAX_ACTIVE_PROFILES} hồ sơ mua trả sau`);
  }

  let supportedArea = await khuVucHoTroTraSauRepository.findSupportedArea({
    tinh_thanh: data.tinh_thanh_ao,
    quan_huyen: data.quan_huyen_ao,
    phuong_xa: data.phuong_xa_ao,
  });

  if (!supportedArea) {
    const businessArea =
      await khuVucHoTroTraSauRepository.findSupportedBusinessAreaByProvince({
        tinh_thanh: data.tinh_thanh_ao,
      });

    if (businessArea) {
      supportedArea = await khuVucHoTroTraSauRepository.findOrCreateProvinceArea({
        tinh_thanh: data.tinh_thanh_ao,
        quan_huyen: data.quan_huyen_ao,
        phuong_xa: data.phuong_xa_ao,
      });
    }
  }

  if (!supportedArea) {
    throw new Error("Khu vực ao nuôi hiện chưa được Admin hỗ trợ mua trả sau");
  }

  const requiredImages = ["anh_cccd_mat_truoc", "anh_cccd_mat_sau", "anh_bien_lai_tha_giong"];
  for (const imageField of requiredImages) {
    if (!data[imageField]) throw new Error(`Thiếu ảnh bắt buộc: ${imageField}`);
  }

  const pondPlain = typeof pond.toJSON === "function" ? pond.toJSON() : pond;
  const pondDetailAddress = normalizeText(pondPlain.dia_chi_ao);

  const profile = await customerProfileRepository.create({
    ...data,
    dia_chi_chi_tiet_ao: pondDetailAddress || normalizeText(data.dia_chi_chi_tiet_ao),
    id_nguoi_dung: userId,
    id_khu_vuc: supportedArea.id_khu_vuc,
    id_chinh_sach: null,
    dinh_muc_cong_no: 0,
    duoc_phep_tra_sau: false,
    bi_khoa_tra_sau: false,
    han_thanh_toan: null,
    ngay_duyet: null,
    trang_thai_ho_so: "cho_kiem_tra",
  });

  await safeNotifyProfile(() =>
    notificationService.notifyAdmins({
      tieu_de: "Co ho so mua tra sau moi",
      noi_dung: `Khach hang ${data.ho_ten} vua gui ho so mua tra sau #${profile.id_ho_so}.`,
      loai: "ho_so",
      lien_ket: `/admin/ho-so-cong-no`,
    })
  );

  await safeNotifyProfile(() =>
    notificationService.notifyLimitStaffByArea({
      id_khu_vuc: supportedArea.id_khu_vuc,
      tieu_de: "Ho so can tham dinh trong khu vuc phu trach",
      noi_dung: `Ho so #${profile.id_ho_so} cua ${data.ho_ten} dang cho kiem tra tai khu vuc ${supportedArea.tinh_thanh}.`,
      loai: "ho_so",
      lien_ket: `/nhan-vien-dinh-muc/ho-so-tham-dinh`,
    })
  );

  return signProfileMedia(profile);
};

const attachLatestExtensionDeadline = async (profile) => {
  if (!profile) return null;
  const plain = await signProfileMedia(profile);
  const [latest, firstApproved] = await Promise.all([
    debtExtensionRepository.findLatestApprovedByProfileId(plain.id_ho_so),
    debtExtensionRepository.findFirstApprovedByProfileId(plain.id_ho_so),
  ]);

  return {
    ...plain,
    gia_han_moi_nhat: latest || null,
    han_thanh_toan_goc: firstApproved
      ? firstApproved.han_cu
      : plain.han_thanh_toan,
    han_thanh_toan_hien_tai: latest
      ? latest.han_de_xuat
      : plain.han_thanh_toan,
  };
};

const getMyCustomerProfiles = async (userId) => Promise.all((await customerProfileRepository.findByUserId(userId)).map(attachLatestExtensionDeadline));
const getAllCustomerProfiles = async () => Promise.all((await customerProfileRepository.findAll()).map(attachLatestExtensionDeadline));

const getCustomerProfileById = async (user, id) => {
  const profile = await customerProfileRepository.findById(id);
  if (!profile) throw new Error("Không tìm thấy hồ sơ khách hàng yêu cầu");
  if (!["admin", "nhan_vien_dinh_muc"].includes(user.vai_tro) && Number(profile.id_nguoi_dung) !== Number(user.id_nguoi_dung)) throw new Error("Bạn không có quyền truy cập hồ sơ này");
  return attachLatestExtensionDeadline(profile);
};

const updateCustomerProfile = async (user, id, data) => {
  const profile = await customerProfileRepository.findById(id);
  if (!profile) throw new Error("Không tìm thấy hồ sơ khách hàng cần cập nhật");
  if (!["admin", "nhan_vien_dinh_muc"].includes(user.vai_tro) && Number(profile.id_nguoi_dung) !== Number(user.id_nguoi_dung)) throw new Error("Bạn không có quyền chỉnh sửa hồ sơ này");

  const allowed = user.vai_tro === "admin"
    ? ["trang_thai_ho_so", "ly_do_tu_choi", "bi_khoa_tra_sau", "ly_do_khoa", "ghi_chu"]
    : user.vai_tro === "nhan_vien_dinh_muc"
      ? ["trang_thai_ho_so", "ghi_chu"]
      : ["zalo", "nguoi_mua_tom_du_kien", "nguoi_bao_lanh_ho_ten", "nguoi_bao_lanh_sdt", "nguoi_bao_lanh_cccd", "nguoi_bao_lanh_quan_he", "ghi_chu"];

  const patch = {};
  allowed.forEach((field) => { if (data[field] !== undefined) patch[field] = data[field]; });
  return customerProfileRepository.update(id, patch);
};

const approvePostpaid = async (user, id, data) => {
  if (user.vai_tro !== "admin") throw new Error("Chỉ Admin mới có quyền duyệt mua trả sau");
  const profile = await customerProfileRepository.findById(id);
  if (!profile) throw new Error("Không tìm thấy hồ sơ khách hàng cần phê duyệt");
  if (profile.trang_thai_ho_so === "tu_choi") throw new Error("Hồ sơ đã bị từ chối, không thể duyệt");
  const limit = Number(data.dinh_muc_cong_no || 0);
  if (limit <= 0) throw new Error("Hạn mức được duyệt phải lớn hơn 0");
  if (limit > Number(profile.han_muc_mong_muon)) throw new Error("Hạn mức duyệt không được vượt hạn mức khách hàng mong muốn");
  if (!data.han_thanh_toan) throw new Error("Vui lòng nhập hạn thanh toán");

  return customerProfileRepository.update(id, {
    id_chinh_sach: data.id_chinh_sach || profile.id_chinh_sach || null,
    dinh_muc_cong_no: limit,
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

module.exports = { createCustomerProfile, getMyCustomerProfiles, getAllCustomerProfiles, getCustomerProfileById, updateCustomerProfile, approvePostpaid };
