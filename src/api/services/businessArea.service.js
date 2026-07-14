const { businessAreaRepository, locationRepository } = require("../repositories");

const validateAdmin = (user) => {
  if (!user || user.vai_tro !== "admin") {
    throw new Error("Chi Admin moi co quyen quan ly khu vuc kinh doanh");
  }
};

const toBoolean = (value, defaultValue = false) => {
  if (value === undefined || value === null || value === "") return defaultValue;
  return value === true || value === "true" || value === 1 || value === "1";
};

const toNullablePositiveNumber = (value, fieldName) => {
  if (value === undefined || value === null || value === "") return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) {
    throw new Error(`${fieldName} khong hop le`);
  }
  return number;
};

const getAllAreas = async () => {
  return await businessAreaRepository.findAll();
};

const getAreaById = async (id_khu_vuc) => {
  const area = await businessAreaRepository.findById(id_khu_vuc);
  if (!area) throw new Error("Khong tim thay khu vuc kinh doanh");
  return area;
};

const createArea = async (user, data) => {
  validateAdmin(user);

  const province = await locationRepository.findProvinceById(data.id_tinh_thanh);
  if (!province) throw new Error("Khong tim thay tinh/thanh");

  const existed = await businessAreaRepository.findByProvinceId(data.id_tinh_thanh);
  if (existed) throw new Error("Tinh/thanh nay da co cau hinh khu vuc kinh doanh");

  return await businessAreaRepository.create({
    id_tinh_thanh: data.id_tinh_thanh,
    cho_phep_ban_hang: toBoolean(data.cho_phep_ban_hang, false),
    cho_phep_tra_sau: toBoolean(data.cho_phep_tra_sau, false),
    dang_hoat_dong: toBoolean(data.dang_hoat_dong, true),
    ban_kinh_toi_da_km: toNullablePositiveNumber(data.ban_kinh_toi_da_km, "Ban kinh toi da"),
    phi_van_chuyen_mac_dinh: toNullablePositiveNumber(data.phi_van_chuyen_mac_dinh, "Phi van chuyen mac dinh") || 0,
    ghi_chu: data.ghi_chu || null,
  });
};

const updateArea = async (user, id_khu_vuc, data) => {
  validateAdmin(user);

  const current = await businessAreaRepository.findById(id_khu_vuc);
  if (!current) throw new Error("Khong tim thay khu vuc kinh doanh can cap nhat");

  const updateData = {};
  if (data.cho_phep_ban_hang !== undefined) {
    updateData.cho_phep_ban_hang = toBoolean(data.cho_phep_ban_hang);
  }
  if (data.cho_phep_tra_sau !== undefined) {
    updateData.cho_phep_tra_sau = toBoolean(data.cho_phep_tra_sau);
  }
  if (data.dang_hoat_dong !== undefined) {
    updateData.dang_hoat_dong = toBoolean(data.dang_hoat_dong);
  }
  if (data.ban_kinh_toi_da_km !== undefined) {
    updateData.ban_kinh_toi_da_km = toNullablePositiveNumber(data.ban_kinh_toi_da_km, "Ban kinh toi da");
  }
  if (data.phi_van_chuyen_mac_dinh !== undefined) {
    updateData.phi_van_chuyen_mac_dinh = toNullablePositiveNumber(data.phi_van_chuyen_mac_dinh, "Phi van chuyen mac dinh") || 0;
  }
  if (data.ghi_chu !== undefined) {
    updateData.ghi_chu = data.ghi_chu || null;
  }

  return await businessAreaRepository.update(id_khu_vuc, updateData);
};

module.exports = {
  getAllAreas,
  getAreaById,
  createArea,
  updateArea,
};
