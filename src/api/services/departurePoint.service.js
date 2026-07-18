const { sequelize } = require("../../config/database");
const { departurePointRepository } = require("../repositories");

const validateAdmin = (user) => {
  if (!user || user.vai_tro !== "admin") {
    throw new Error("Chi Admin moi co quyen quan ly diem xuat phat");
  }
};

const toBoolean = (value, defaultValue = false) => {
  if (value === undefined || value === null || value === "") return defaultValue;
  return value === true || value === "true" || value === 1 || value === "1";
};

const toCoordinate = (value, fieldName, min, max) => {
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max) {
    throw new Error(`${fieldName} khong hop le`);
  }
  return number;
};

const toNullablePositiveNumber = (value, fieldName) => {
  if (value === undefined || value === null || value === "") return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) {
    throw new Error(`${fieldName} khong hop le`);
  }
  return number;
};

const getAllDeparturePoints = async () => {
  return await departurePointRepository.findAll();
};

const getDefaultDeparturePoint = async () => {
  const point = await departurePointRepository.findDefaultActive();
  if (!point) throw new Error("Chua cau hinh diem xuat phat mac dinh dang hoat dong");
  return point;
};

const createDeparturePoint = async (user, data) => {
  validateAdmin(user);

  if (!String(data.ten_diem || "").trim()) throw new Error("Vui long nhap ten diem xuat phat");
  if (!String(data.dia_chi || "").trim()) throw new Error("Vui long nhap dia chi diem xuat phat");

  return await sequelize.transaction(async (transaction) => {
    const laMacDinh = toBoolean(data.la_mac_dinh, true);
    if (laMacDinh) await departurePointRepository.clearDefault(transaction);

    return await departurePointRepository.create({
      ten_diem: String(data.ten_diem).trim(),
      dia_chi: String(data.dia_chi).trim(),
      vi_do: toCoordinate(data.vi_do, "Vi do", -90, 90),
      kinh_do: toCoordinate(data.kinh_do, "Kinh do", -180, 180),
      ban_kinh_toi_da_km: toNullablePositiveNumber(data.ban_kinh_toi_da_km, "Ban kinh toi da"),
      dang_hoat_dong: toBoolean(data.dang_hoat_dong, true),
      la_mac_dinh: laMacDinh,
    }, transaction);
  });
};

const updateDeparturePoint = async (user, id_diem_xuat_phat, data) => {
  validateAdmin(user);

  const current = await departurePointRepository.findById(id_diem_xuat_phat);
  if (!current) throw new Error("Khong tim thay diem xuat phat can cap nhat");

  return await sequelize.transaction(async (transaction) => {
    const updateData = {};
    if (data.ten_diem !== undefined) updateData.ten_diem = String(data.ten_diem).trim();
    if (data.dia_chi !== undefined) updateData.dia_chi = String(data.dia_chi).trim();
    if (data.vi_do !== undefined) updateData.vi_do = toCoordinate(data.vi_do, "Vi do", -90, 90);
    if (data.kinh_do !== undefined) updateData.kinh_do = toCoordinate(data.kinh_do, "Kinh do", -180, 180);
    if (data.ban_kinh_toi_da_km !== undefined) {
      updateData.ban_kinh_toi_da_km = toNullablePositiveNumber(data.ban_kinh_toi_da_km, "Ban kinh toi da");
    }
    if (data.dang_hoat_dong !== undefined) updateData.dang_hoat_dong = toBoolean(data.dang_hoat_dong);
    if (data.la_mac_dinh !== undefined) {
      updateData.la_mac_dinh = toBoolean(data.la_mac_dinh);
      if (updateData.la_mac_dinh) await departurePointRepository.clearDefault(transaction);
    }

    return await departurePointRepository.update(id_diem_xuat_phat, updateData, transaction);
  });
};

module.exports = {
  getAllDeparturePoints,
  getDefaultDeparturePoint,
  createDeparturePoint,
  updateDeparturePoint,
};
