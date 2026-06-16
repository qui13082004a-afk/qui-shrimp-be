const {
  customerProfileRepository,
  pondRepository,
  cropSeasonRepository,
} = require("../repositories");

const createCustomerProfile = async (userId, data) => {
  if (!data.id_ao) {
    throw new Error("Vui lòng chọn ao nuôi");
  }

  if (!data.id_vu_nuoi) {
    throw new Error("Vui lòng chọn vụ nuôi");
  }

  const pond = await pondRepository.findById(data.id_ao);

  if (!pond) {
    throw new Error("Không tìm thấy ao nuôi");
  }

  if (Number(pond.id_nguoi_dung) !== Number(userId)) {
    throw new Error("Bạn không có quyền tạo hồ sơ cho ao này");
  }

  const cropSeason = await cropSeasonRepository.findById(data.id_vu_nuoi);

  if (!cropSeason) {
    throw new Error("Không tìm thấy vụ nuôi");
  }

  if (Number(cropSeason.id_ao) !== Number(data.id_ao)) {
    throw new Error("Vụ nuôi không thuộc ao đã chọn");
  }

  if (cropSeason.trang_thai !== "dang_nuoi") {
    throw new Error("Chỉ được tạo hồ sơ cho vụ nuôi đang hoạt động");
  }

  const existedProfile = await customerProfileRepository.findByCropSeasonId(
    data.id_vu_nuoi
  );

  if (existedProfile) {
    throw new Error("Vụ nuôi này đã có hồ sơ khách hàng");
  }

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

const getMyCustomerProfiles = async (userId) => {
  return await customerProfileRepository.findByUserId(userId);
};

const getAllCustomerProfiles = async () => {
  return await customerProfileRepository.findAll();
};

const getCustomerProfileById = async (user, id_ho_so) => {
  const profile = await customerProfileRepository.findById(id_ho_so);

  if (!profile) {
    throw new Error("Không tìm thấy hồ sơ khách hàng");
  }

  if (
    user.vai_tro !== "admin" &&
    Number(profile.id_nguoi_dung) !== Number(user.id_nguoi_dung)
  ) {
    throw new Error("Bạn không có quyền xem hồ sơ này");
  }

  return profile;
};

const updateCustomerProfile = async (user, id_ho_so, data) => {
  const profile = await customerProfileRepository.findById(id_ho_so);

  if (!profile) {
    throw new Error("Không tìm thấy hồ sơ khách hàng");
  }

  if (
    user.vai_tro !== "admin" &&
    Number(profile.id_nguoi_dung) !== Number(user.id_nguoi_dung)
  ) {
    throw new Error("Bạn không có quyền cập nhật hồ sơ này");
  }

  let updateData = {};

  if (user.vai_tro === "admin") {
    updateData = {
      dinh_muc_cong_no: data.dinh_muc_cong_no,
      duoc_phep_tra_sau: data.duoc_phep_tra_sau,
      han_thanh_toan: data.han_thanh_toan,
      ghi_chu: data.ghi_chu,
    };
  } else {
    updateData = {
      ghi_chu: data.ghi_chu,
    };
  }

  Object.keys(updateData).forEach((key) => {
    if (updateData[key] === undefined) {
      delete updateData[key];
    }
  });

  return await customerProfileRepository.update(id_ho_so, updateData);
};

const approvePostpaid = async (user, id_ho_so, data) => {
  if (user.vai_tro !== "admin") {
    throw new Error("Chỉ admin mới có quyền duyệt trả sau");
  }

  const profile = await customerProfileRepository.findById(id_ho_so);

  if (!profile) {
    throw new Error("Không tìm thấy hồ sơ khách hàng");
  }

  if (!data.dinh_muc_cong_no || Number(data.dinh_muc_cong_no) <= 0) {
    throw new Error("Định mức công nợ phải lớn hơn 0");
  }

  if (!data.han_thanh_toan) {
    throw new Error("Vui lòng nhập hạn thanh toán");
  }

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