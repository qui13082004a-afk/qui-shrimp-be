const { khuVucHoTroTraSauRepository } = require("../repositories");

const normalizeText = (value) => {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ");
};

const validateAdmin = (user) => {
  if (!user || user.vai_tro !== "admin") {
    throw new Error("Chi Admin moi co quyen quan ly khu vuc ho tro tra sau");
  }
};

const getAllAreas = async () => {
  return await khuVucHoTroTraSauRepository.findAll();
};

const getAreaById = async (id_khu_vuc) => {
  const area = await khuVucHoTroTraSauRepository.findById(id_khu_vuc);

  if (!area) {
    throw new Error("Khong tim thay khu vuc ho tro tra sau");
  }

  return area;
};

const createArea = async (user, data) => {
  validateAdmin(user);

  const tinhThanh = normalizeText(data.tinh_thanh);
  const quanHuyen =
    normalizeText(data.quan_huyen) || "Theo don vi hanh chinh 34 tinh";
  const phuongXa = normalizeText(data.phuong_xa);

  if (!tinhThanh) {
    throw new Error("Vui long nhap tinh hoac thanh pho");
  }

  const validStatuses = ["hoat_dong", "tam_ngung"];
  const trangThai = data.trang_thai || "hoat_dong";

  if (!validStatuses.includes(trangThai)) {
    throw new Error("Trang thai khu vuc khong hop le");
  }

  const existedArea = await khuVucHoTroTraSauRepository.findExactArea({
    tinh_thanh: tinhThanh,
    quan_huyen: quanHuyen,
    phuong_xa: phuongXa,
  });

  if (existedArea) {
    throw new Error("Khu vuc nay da ton tai tren he thong");
  }

  return await khuVucHoTroTraSauRepository.create({
    tinh_thanh: tinhThanh,
    quan_huyen: quanHuyen,
    phuong_xa: phuongXa || null,
    trang_thai: trangThai,
    ghi_chu: normalizeText(data.ghi_chu) || null,
  });
};

const updateArea = async (user, id_khu_vuc, data) => {
  validateAdmin(user);

  const currentArea = await khuVucHoTroTraSauRepository.findById(id_khu_vuc);

  if (!currentArea) {
    throw new Error("Khong tim thay khu vuc can cap nhat");
  }

  const updateData = {};

  if (data.tinh_thanh !== undefined) {
    const tinhThanh = normalizeText(data.tinh_thanh);

    if (!tinhThanh) {
      throw new Error("Tinh hoac thanh pho khong duoc de trong");
    }

    updateData.tinh_thanh = tinhThanh;
  }

  if (data.quan_huyen !== undefined) {
    updateData.quan_huyen =
      normalizeText(data.quan_huyen) || "Theo don vi hanh chinh 34 tinh";
  }

  if (data.phuong_xa !== undefined) {
    updateData.phuong_xa = normalizeText(data.phuong_xa) || null;
  }

  if (data.trang_thai !== undefined) {
    const validStatuses = ["hoat_dong", "tam_ngung"];

    if (!validStatuses.includes(data.trang_thai)) {
      throw new Error("Trang thai khu vuc khong hop le");
    }

    updateData.trang_thai = data.trang_thai;
  }

  if (data.ghi_chu !== undefined) {
    updateData.ghi_chu = normalizeText(data.ghi_chu) || null;
  }

  return await khuVucHoTroTraSauRepository.update(id_khu_vuc, updateData);
};

const deleteArea = async (user, id_khu_vuc) => {
  validateAdmin(user);

  const deleted = await khuVucHoTroTraSauRepository.remove(id_khu_vuc);

  if (!deleted) {
    throw new Error("Khong tim thay khu vuc can xoa");
  }

  return true;
};

const checkSupportedArea = async (data) => {
  const tinhThanh = normalizeText(data.tinh_thanh);
  const quanHuyen = normalizeText(data.quan_huyen);
  const phuongXa = normalizeText(data.phuong_xa);

  if (!tinhThanh) {
    throw new Error("Vui long nhap tinh hoac thanh pho cua ao nuoi");
  }

  const legacyArea = await khuVucHoTroTraSauRepository.findSupportedArea({
    tinh_thanh: tinhThanh,
    quan_huyen: quanHuyen,
    phuong_xa: phuongXa,
  });

  if (legacyArea) {
    return {
      duoc_ho_tro: true,
      khu_vuc: legacyArea,
      nguon_kiem_tra: "khu_vuc_ho_tro_tra_sau",
    };
  }

  return {
    duoc_ho_tro: false,
    khu_vuc: null,
    nguon_kiem_tra: "khu_vuc_ho_tro_tra_sau",
  };
};

module.exports = {
  getAllAreas,
  getAreaById,
  createArea,
  updateArea,
  deleteArea,
  checkSupportedArea,
};
