const {
  hopDongRepository,
  customerProfileRepository,
} = require("../repositories");
const { getS3SignedUrl } = require("../../helpers/s3SignedUrl");

const signContractFiles = async (contract) => {
  if (!contract) return contract;

  const plainContract =
    typeof contract.toJSON === "function" ? contract.toJSON() : { ...contract };

  plainContract.file_hop_dong_da_ky = await getS3SignedUrl(
    plainContract.file_hop_dong_da_ky
  );
  plainContract.anh_hop_dong_da_ky = await getS3SignedUrl(
    plainContract.anh_hop_dong_da_ky
  );

  return plainContract;
};

const signContractListFiles = async (contracts) => {
  return Promise.all((contracts || []).map(signContractFiles));
};

// Kiem tra quyen upload hop dong da ky cho nhan vien dinh muc hoac admin.
const canUploadContract = (user) => {
  return user.vai_tro === "nhan_vien_dinh_muc" || user.vai_tro === "admin";
};

// Xac dinh trang thai tiep theo sau khi upload file/anh hop dong da ky.
const getNextStatusAfterUpload = (contract, newData = {}) => {
  const hasSignedImage =
    Boolean(newData.anh_hop_dong_da_ky) ||
    Boolean(contract.anh_hop_dong_da_ky);

  if (hasSignedImage) {
    return "cho_xac_nhan";
  }

  return contract.trang_thai || "cho_ky";
};

// Admin tao hop dong cho ho so mua tra sau da duoc duyet.
const createContract = async (user, data) => {
  if (user.vai_tro !== "admin") {
    throw new Error("Chỉ Admin mới có quyền tạo hợp đồng");
  }

  if (!data.id_ho_so) {
    throw new Error("Vui lòng chọn hồ sơ mua trả sau");
  }

  const profile = await customerProfileRepository.findById(data.id_ho_so);

  if (!profile) {
    throw new Error("Không tìm thấy hồ sơ mua trả sau");
  }

  if (!profile.duoc_phep_tra_sau || profile.trang_thai_ho_so !== "da_duyet") {
    throw new Error("Chỉ tạo hợp đồng cho hồ sơ đã được duyệt mua trả sau");
  }

  const existed = await hopDongRepository.findByProfileId(data.id_ho_so);

  if (existed) {
    throw new Error("Hồ sơ này đã có hợp đồng");
  }

  const contract = await hopDongRepository.create({
    id_ho_so: data.id_ho_so,

    file_hop_dong_mau: data.file_hop_dong_mau || null,
    file_hop_dong_da_ky: null,
    anh_hop_dong_da_ky: null,

    ngay_ky: null,
    trang_thai: "cho_ky",

    ghi_chu: data.ghi_chu || null,
    dieu_khoan_bo_sung: data.dieu_khoan_bo_sung || null,
  });

  return signContractFiles(contract);
};

// Admin lay danh sach tat ca hop dong trong he thong.
const getAllContracts = async (user) => {
  if (user.vai_tro !== "admin") {
    throw new Error("Bạn không có quyền xem toàn bộ hợp đồng");
  }

  const contracts = await hopDongRepository.findAll();
  return signContractListFiles(contracts);
};

/**
 * Danh sách hợp đồng dành cho Nhân viên định mức: xem để đi ký khách hàng
 * và upload ảnh/PDF hợp đồng đã ký. Admin cũng được phép xem.
 */
const getStaffContracts = async (user) => {
  if (user.vai_tro !== "nhan_vien_dinh_muc" && user.vai_tro !== "admin") {
    throw new Error("Bạn không có quyền xem danh sách hợp đồng này");
  }

  const contracts = await hopDongRepository.findAll();
  return signContractListFiles(contracts);
};

// Khach hang lay danh sach hop dong thuoc cac ho so cua minh.
const getMyContracts = async (user) => {
  const contracts = await hopDongRepository.findByUserId(user.id_nguoi_dung);
  return signContractListFiles(contracts);
};

// Lay chi tiet hop dong va kiem tra quyen xem theo vai tro/chu ho so.
const getContractById = async (user, id_hop_dong) => {
  const contract = await hopDongRepository.findById(id_hop_dong);

  if (!contract) {
    throw new Error("Không tìm thấy hợp đồng");
  }

  if (
    user.vai_tro !== "admin" &&
    user.vai_tro !== "nhan_vien_dinh_muc" &&
    Number(contract.HoSoKhachHang?.id_nguoi_dung) !==
      Number(user.id_nguoi_dung)
  ) {
    throw new Error("Bạn không có quyền xem hợp đồng này");
  }

  return signContractFiles(contract);
};

// Lay hop dong theo ho so mua tra sau va kiem tra quyen truy cap ho so.
const getContractByProfileId = async (user, id_ho_so) => {
  const profile = await customerProfileRepository.findById(id_ho_so);

  if (!profile) {
    throw new Error("Không tìm thấy hồ sơ mua trả sau");
  }

  if (
    user.vai_tro !== "admin" &&
    user.vai_tro !== "nhan_vien_dinh_muc" &&
    Number(profile.id_nguoi_dung) !== Number(user.id_nguoi_dung)
  ) {
    throw new Error("Bạn không có quyền xem hợp đồng của hồ sơ này");
  }

  const contract = await hopDongRepository.findByProfileId(id_ho_so);

  if (!contract) {
    throw new Error("Hồ sơ này chưa có hợp đồng");
  }

  return signContractFiles(contract);
};

// Nhan vien dinh muc hoac admin upload file PDF hop dong da ky.
const uploadSignedPdf = async (user, id_hop_dong, data) => {
  if (!canUploadContract(user)) {
    throw new Error("Chỉ nhân viên định mức hoặc Admin mới được upload hợp đồng");
  }

  if (!data.file_hop_dong_da_ky) {
    throw new Error("Vui lòng tải PDF hợp đồng đã ký");
  }

  const contract = await hopDongRepository.findById(id_hop_dong);

  if (!contract) {
    throw new Error("Không tìm thấy hợp đồng");
  }

  if (contract.trang_thai === "huy") {
    throw new Error("Hợp đồng đã bị hủy");
  }

  if (contract.trang_thai === "da_ky") {
    throw new Error("Hợp đồng đã được Admin xác nhận");
  }

  const updatedContract = await hopDongRepository.update(id_hop_dong, {
    file_hop_dong_da_ky: data.file_hop_dong_da_ky,
    id_nhan_vien_upload: user.id_nguoi_dung,
    ngay_upload: new Date(),
    ngay_ky: data.ngay_ky || contract.ngay_ky || new Date(),
    trang_thai: contract.trang_thai || "cho_ky",
    ghi_chu: data.ghi_chu || contract.ghi_chu,
  });

  return signContractFiles(updatedContract);
};

// Nhan vien dinh muc hoac admin upload anh hop dong da ky de cho admin xac nhan.
const uploadSignedImage = async (user, id_hop_dong, data) => {
  if (!canUploadContract(user)) {
    throw new Error("Chỉ nhân viên định mức hoặc Admin mới được upload hợp đồng");
  }

  if (!data.anh_hop_dong_da_ky) {
    throw new Error("Vui lòng tải ảnh hợp đồng đã ký");
  }

  const contract = await hopDongRepository.findById(id_hop_dong);

  if (!contract) {
    throw new Error("Không tìm thấy hợp đồng");
  }

  if (contract.trang_thai === "huy") {
    throw new Error("Hợp đồng đã bị hủy");
  }

  if (contract.trang_thai === "da_ky") {
    throw new Error("Hợp đồng đã được Admin xác nhận");
  }

  const trang_thai = getNextStatusAfterUpload(contract, {
    anh_hop_dong_da_ky: data.anh_hop_dong_da_ky,
  });

  const updatedContract = await hopDongRepository.update(id_hop_dong, {
    anh_hop_dong_da_ky: data.anh_hop_dong_da_ky,
    id_nhan_vien_upload: user.id_nguoi_dung,
    ngay_upload: new Date(),
    ngay_ky: data.ngay_ky || contract.ngay_ky || new Date(),
    trang_thai,
    ghi_chu: data.ghi_chu || contract.ghi_chu,
  });

  return signContractFiles(updatedContract);
};

// Admin xac nhan hop dong da co anh ky va chuyen trang thai sang da ky.
const confirmContract = async (user, id_hop_dong, data = {}) => {
  if (user.vai_tro !== "admin") {
    throw new Error("Chỉ Admin mới có quyền xác nhận hợp đồng");
  }

  const contract = await hopDongRepository.findById(id_hop_dong);

  if (!contract) {
    throw new Error("Không tìm thấy hợp đồng");
  }

  if (contract.trang_thai !== "cho_xac_nhan") {
    throw new Error("Chỉ xác nhận hợp đồng đang chờ xác nhận");
  }

  if (!contract.anh_hop_dong_da_ky) {
    throw new Error("Chưa upload ảnh hợp đồng đã ký");
  }

  const updatedContract = await hopDongRepository.update(id_hop_dong, {
    id_admin_xac_nhan: user.id_nguoi_dung,
    ngay_xac_nhan: new Date(),
    trang_thai: "da_ky",
    ghi_chu: data.ghi_chu || contract.ghi_chu,
  });

  return signContractFiles(updatedContract);
};

// Admin huy hop dong khi hop dong chua bi huy truoc do.
const cancelContract = async (user, id_hop_dong, data = {}) => {
  if (user.vai_tro !== "admin") {
    throw new Error("Chỉ Admin mới có quyền hủy hợp đồng");
  }

  const contract = await hopDongRepository.findById(id_hop_dong);

  if (!contract) {
    throw new Error("Không tìm thấy hợp đồng");
  }

  if (contract.trang_thai === "huy") {
    throw new Error("Hợp đồng đã bị hủy trước đó");
  }

  const updatedContract = await hopDongRepository.update(id_hop_dong, {
    trang_thai: "huy",
    ghi_chu: data.ghi_chu || contract.ghi_chu,
  });

  return signContractFiles(updatedContract);
};

// Admin khoi phuc hop dong da huy ve trang thai cho ky.
const restoreContract = async (user, id_hop_dong, data = {}) => {
  if (user.vai_tro !== "admin") {
    throw new Error("Chỉ Admin mới có quyền khôi phục hợp đồng");
  }

  const contract = await hopDongRepository.findById(id_hop_dong);

  if (!contract) {
    throw new Error("Không tìm thấy hợp đồng");
  }

  if (contract.trang_thai !== "huy") {
    throw new Error("Chỉ có thể khôi phục hợp đồng đã hủy");
  }

  const updatedContract = await hopDongRepository.update(id_hop_dong, {
    trang_thai: "cho_ky",
    ghi_chu: data.ghi_chu || contract.ghi_chu,
  });

  return signContractFiles(updatedContract);
};

module.exports = {
  createContract,
  getAllContracts,
  getStaffContracts,
  getMyContracts,
  getContractById,
  getContractByProfileId,
  uploadSignedPdf,
  uploadSignedImage,
  confirmContract,
  cancelContract,
  restoreContract,
};
