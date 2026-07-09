const {
  hopDongRepository,
  customerProfileRepository,
} = require("../repositories");

const canUploadContract = (user) => {
  return user.vai_tro === "nhan_vien_dinh_muc" || user.vai_tro === "admin";
};

const getNextStatusAfterUpload = (contract, newData = {}) => {
  const hasSignedImage =
    Boolean(newData.anh_hop_dong_da_ky) ||
    Boolean(contract.anh_hop_dong_da_ky);

  if (hasSignedImage) {
    return "cho_xac_nhan";
  }

  return contract.trang_thai || "cho_ky";
};

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

  return await hopDongRepository.create({
    id_ho_so: data.id_ho_so,

    file_hop_dong_mau: data.file_hop_dong_mau || null,
    file_hop_dong_da_ky: null,
    anh_hop_dong_da_ky: null,

    ngay_ky: null,
    trang_thai: "cho_ky",

    ghi_chu: data.ghi_chu || null,
    dieu_khoan_bo_sung: data.dieu_khoan_bo_sung || null,
  });
};

const getAllContracts = async (user) => {
  if (user.vai_tro !== "admin") {
    throw new Error("Bạn không có quyền xem toàn bộ hợp đồng");
  }

  return await hopDongRepository.findAll();
};

const getMyContracts = async (user) => {
  return await hopDongRepository.findByUserId(user.id_nguoi_dung);
};

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

  return contract;
};

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

  return contract;
};

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

  return await hopDongRepository.update(id_hop_dong, {
    file_hop_dong_da_ky: data.file_hop_dong_da_ky,
    id_nhan_vien_upload: user.id_nguoi_dung,
    ngay_upload: new Date(),
    ngay_ky: data.ngay_ky || contract.ngay_ky || new Date(),
    trang_thai: contract.trang_thai || "cho_ky",
    ghi_chu: data.ghi_chu || contract.ghi_chu,
  });
};

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

  return await hopDongRepository.update(id_hop_dong, {
    anh_hop_dong_da_ky: data.anh_hop_dong_da_ky,
    id_nhan_vien_upload: user.id_nguoi_dung,
    ngay_upload: new Date(),
    ngay_ky: data.ngay_ky || contract.ngay_ky || new Date(),
    trang_thai,
    ghi_chu: data.ghi_chu || contract.ghi_chu,
  });
};

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

  return await hopDongRepository.update(id_hop_dong, {
    id_admin_xac_nhan: user.id_nguoi_dung,
    ngay_xac_nhan: new Date(),
    trang_thai: "da_ky",
    ghi_chu: data.ghi_chu || contract.ghi_chu,
  });
};

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

  return await hopDongRepository.update(id_hop_dong, {
    trang_thai: "huy",
    ghi_chu: data.ghi_chu || contract.ghi_chu,
  });
};

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

  return await hopDongRepository.update(id_hop_dong, {
    trang_thai: "cho_ky",
    ghi_chu: data.ghi_chu || contract.ghi_chu,
  });
};

module.exports = {
  createContract,
  getAllContracts,
  getMyContracts,
  getContractById,
  getContractByProfileId,
  uploadSignedPdf,
  uploadSignedImage,
  confirmContract,
  cancelContract,
  restoreContract,
};