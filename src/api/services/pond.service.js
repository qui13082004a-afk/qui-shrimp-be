const { sequelize } = require("../../config/database");
const { pondRepository, cropSeasonRepository } = require("../repositories");

const toNullableId = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
};

const toNullableCoordinate = (value, fieldName, min, max) => {
  if (value === undefined || value === null || value === "") return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max) {
    throw new Error(`${fieldName} khong hop le`);
  }
  return number;
};

const pickPondLocationFields = (data) => {
  const locationData = {};

  if (data.id_tinh_thanh !== undefined) {
    locationData.id_tinh_thanh = toNullableId(data.id_tinh_thanh);
  }
  if (data.id_phuong_xa !== undefined) {
    locationData.id_phuong_xa = toNullableId(data.id_phuong_xa);
  }
  if (data.vi_do !== undefined) {
    locationData.vi_do = toNullableCoordinate(data.vi_do, "Vi do", -90, 90);
  }
  if (data.kinh_do !== undefined) {
    locationData.kinh_do = toNullableCoordinate(data.kinh_do, "Kinh do", -180, 180);
  }

  return locationData;
};

const createPond = async (userId, data) => {
  if (!data.ten_ao) {
    throw new Error("Ten ao khong duoc de trong");
  }

  if (!data.dien_tich || Number(data.dien_tich) <= 0) {
    throw new Error("Dien tich ao phai la so duong lon hon 0");
  }

  return await pondRepository.create({
    id_nguoi_dung: userId,
    ten_ao: data.ten_ao,
    dien_tich: data.dien_tich,
    dia_chi_ao: data.dia_chi_ao,
    loai_hinh_nuoi: data.loai_hinh_nuoi,
    trang_thai_ao: data.trang_thai_ao || "dang_hoat_dong",
    ghi_chu: data.ghi_chu,
    ...pickPondLocationFields(data),
  });
};

const getMyPonds = async (userId) => {
  return await pondRepository.findByUserId(userId);
};

const getPondById = async (id_ao, userId) => {
  const pond = await pondRepository.findById(id_ao);

  if (!pond) {
    throw new Error("Khong tim thay thong tin ao nuoi yeu cau");
  }

  if (Number(pond.id_nguoi_dung) !== Number(userId)) {
    throw new Error("Ban khong co quyen truy cap du lieu cua ao nuoi nay");
  }

  return pond;
};

const updatePond = async (id_ao, userId, data) => {
  const pond = await pondRepository.findById(id_ao);

  if (!pond) {
    throw new Error("Khong tim thay thong tin ao nuoi can cap nhat");
  }
  if (Number(pond.id_nguoi_dung) !== Number(userId)) {
    throw new Error("Ban khong co quyen chinh sua thong tin ao nuoi nay");
  }

  if (data.dien_tich && Number(data.dien_tich) <= 0) {
    throw new Error("Dien tich ao nuoi cap nhat phai lon hon 0");
  }

  if (data.trang_thai_ao === "tam_ngung" && pond.trang_thai_ao !== "tam_ngung") {
    const activeCropSeason = await cropSeasonRepository.findActiveByPondId(id_ao);
    if (activeCropSeason) {
      throw new Error(
        `Khong the tam ngung ao nuoi nay vi vu nuoi "${activeCropSeason.ten_vu_nuoi}" trong ao van dang dien ra`
      );
    }
  }

  return await pondRepository.update(id_ao, {
    ...data,
    ...pickPondLocationFields(data),
  });
};

const deletePond = async (id_ao, userId) => {
  const pond = await pondRepository.findById(id_ao);

  if (!pond) {
    throw new Error("Khong tim thay thong tin ao nuoi can xoa");
  }
  if (Number(pond.id_nguoi_dung) !== Number(userId)) {
    throw new Error("Ban khong co quyen xoa ao nuoi nay");
  }

  const transaction = await sequelize.transaction();

  try {
    const orderCount = await cropSeasonRepository.countOrdersByPondId(
      id_ao,
      transaction
    );

    if (orderCount > 0) {
      throw new Error(
        "Khong the xoa ao nuoi nay vi vu nuoi trong ao da phat sinh don hang."
      );
    }

    await cropSeasonRepository.removeByPondId(id_ao, transaction);
    const deleted = await pondRepository.remove(id_ao, transaction);

    await transaction.commit();
    return deleted;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

module.exports = {
  createPond,
  getMyPonds,
  getPondById,
  updatePond,
  deletePond,
};
