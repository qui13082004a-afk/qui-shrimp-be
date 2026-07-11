const {
  customerProfileRepository,
  pondRepository,
  cropSeasonRepository,
  debtExtensionRepository,
  khuVucHoTroTraSauRepository,
} = require("../repositories");

const requiredTextFields = [
  ["ho_ten", "Họ tên"], ["ngay_sinh", "Ngày sinh"], ["so_cccd", "Số CCCD"],
  ["so_dien_thoai", "Số điện thoại"], ["dia_chi_thuong_tru", "Địa chỉ thường trú"],
  ["tinh_thanh_ao", "Tỉnh/thành của ao"], ["quan_huyen_ao", "Quận/huyện của ao"],
  ["phuong_xa_ao", "Phường/xã của ao"], ["nguon_thu_nhap_tra_no", "Nguồn thu nhập trả nợ"],
  ["ngay_thu_hoach_du_kien", "Ngày thu hoạch dự kiến"], ["mat_hang_du_kien", "Mặt hàng dự kiến mua"],
];

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

  const supportedArea = await khuVucHoTroTraSauRepository.findSupportedArea({
    tinh_thanh: data.tinh_thanh_ao,
    quan_huyen: data.quan_huyen_ao,
    phuong_xa: data.phuong_xa_ao,
  });
  if (!supportedArea) {
    throw new Error("Khu vực ao nuôi hiện chưa được Admin hỗ trợ mua trả sau");
  }

  const requiredImages = ["anh_cccd_mat_truoc", "anh_cccd_mat_sau", "anh_selfie", "anh_bien_lai_tha_giong"];
  for (const imageField of requiredImages) {
    if (!data[imageField]) throw new Error(`Thiếu ảnh bắt buộc: ${imageField}`);
  }

  return customerProfileRepository.create({
    ...data,
    id_nguoi_dung: userId,
    id_khu_vuc: supportedArea.id_khu_vuc,
    id_chinh_sach: null,
    dinh_muc_cong_no: 0,
    duoc_phep_tra_sau: false,
    bi_khoa_tra_sau: false,
    han_thanh_toan: null,
    ngay_duyet: null,
    trang_thai_ho_so: "cho_kiem_tra",
    trang_thai_xac_thuc: "chua_xac_thuc",
  });
};

const attachLatestExtensionDeadline = async (profile) => {
  if (!profile) return null;
  const plain = typeof profile.toJSON === "function" ? profile.toJSON() : profile;
  const latest = await debtExtensionRepository.findLatestApprovedByProfileId(plain.id_ho_so);
  return { ...plain, gia_han_moi_nhat: latest || null, han_thanh_toan_goc: plain.han_thanh_toan, han_thanh_toan_hien_tai: latest ? latest.han_de_xuat : plain.han_thanh_toan };
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
      ? ["trang_thai_ho_so", "ghi_chu", "trang_thai_xac_thuc", "ly_do_xac_thuc_that_bai", "do_tuong_dong", "ngay_xac_thuc"]
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
  if (profile.trang_thai_xac_thuc !== "da_xac_thuc") throw new Error("Hồ sơ chưa hoàn tất xác thực CCCD và khuôn mặt");

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