const {
  khuVucHoTroTraSauRepository,
} = require("../repositories");

const normalizeText = (value) => {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ");
};

const validateAdmin = (user) => {
  if (!user || user.vai_tro !== "admin") {
    throw new Error(
      "Chỉ Admin mới có quyền quản lý khu vực hỗ trợ trả sau"
    );
  }
};

const getAllAreas = async () => {
  return await khuVucHoTroTraSauRepository.findAll();
};

const getAreaById = async (id_khu_vuc) => {
  const area =
    await khuVucHoTroTraSauRepository.findById(
      id_khu_vuc
    );

  if (!area) {
    throw new Error(
      "Không tìm thấy khu vực hỗ trợ trả sau"
    );
  }

  return area;
};

const createArea = async (user, data) => {
  validateAdmin(user);

  const tinhThanh = normalizeText(
    data.tinh_thanh
  );

  const quanHuyen = normalizeText(
    data.quan_huyen
  );

  const phuongXa = normalizeText(
    data.phuong_xa
  );

  if (!tinhThanh) {
    throw new Error(
      "Vui lòng nhập tỉnh hoặc thành phố"
    );
  }

  if (!quanHuyen) {
    throw new Error(
      "Vui lòng nhập quận hoặc huyện"
    );
  }

  const validStatuses = [
    "hoat_dong",
    "tam_ngung",
  ];

  const trangThai =
    data.trang_thai || "hoat_dong";

  if (!validStatuses.includes(trangThai)) {
    throw new Error(
      "Trạng thái khu vực không hợp lệ"
    );
  }

  const existedArea =
    await khuVucHoTroTraSauRepository.findExactArea({
      tinh_thanh: tinhThanh,
      quan_huyen: quanHuyen,
      phuong_xa: phuongXa,
    });

  if (existedArea) {
    throw new Error(
      "Khu vực này đã tồn tại trên hệ thống"
    );
  }

  return await khuVucHoTroTraSauRepository.create({
    tinh_thanh: tinhThanh,
    quan_huyen: quanHuyen,
    phuong_xa: phuongXa || null,
    trang_thai: trangThai,
    ghi_chu:
      normalizeText(data.ghi_chu) || null,
  });
};

const updateArea = async (
  user,
  id_khu_vuc,
  data
) => {
  validateAdmin(user);

  const currentArea =
    await khuVucHoTroTraSauRepository.findById(
      id_khu_vuc
    );

  if (!currentArea) {
    throw new Error(
      "Không tìm thấy khu vực cần cập nhật"
    );
  }

  const updateData = {};

  if (data.tinh_thanh !== undefined) {
    const tinhThanh = normalizeText(
      data.tinh_thanh
    );

    if (!tinhThanh) {
      throw new Error(
        "Tỉnh hoặc thành phố không được để trống"
      );
    }

    updateData.tinh_thanh = tinhThanh;
  }

  if (data.quan_huyen !== undefined) {
    const quanHuyen = normalizeText(
      data.quan_huyen
    );

    if (!quanHuyen) {
      throw new Error(
        "Quận hoặc huyện không được để trống"
      );
    }

    updateData.quan_huyen = quanHuyen;
  }

  if (data.phuong_xa !== undefined) {
    updateData.phuong_xa =
      normalizeText(data.phuong_xa) || null;
  }

  if (data.trang_thai !== undefined) {
    const validStatuses = [
      "hoat_dong",
      "tam_ngung",
    ];

    if (
      !validStatuses.includes(
        data.trang_thai
      )
    ) {
      throw new Error(
        "Trạng thái khu vực không hợp lệ"
      );
    }

    updateData.trang_thai =
      data.trang_thai;
  }

  if (data.ghi_chu !== undefined) {
    updateData.ghi_chu =
      normalizeText(data.ghi_chu) || null;
  }

  return await khuVucHoTroTraSauRepository.update(
    id_khu_vuc,
    updateData
  );
};

const deleteArea = async (
  user,
  id_khu_vuc
) => {
  validateAdmin(user);

  const deleted =
    await khuVucHoTroTraSauRepository.remove(
      id_khu_vuc
    );

  if (!deleted) {
    throw new Error(
      "Không tìm thấy khu vực cần xóa"
    );
  }

  return true;
};

const checkSupportedArea = async (data) => {
  const tinhThanh = normalizeText(
    data.tinh_thanh
  );

  const quanHuyen = normalizeText(
    data.quan_huyen
  );

  const phuongXa = normalizeText(
    data.phuong_xa
  );

  if (!tinhThanh) {
    throw new Error(
      "Vui lòng nhập tỉnh hoặc thành phố của ao nuôi"
    );
  }

  if (!quanHuyen) {
    throw new Error(
      "Vui lòng nhập quận hoặc huyện của ao nuôi"
    );
  }

  const area =
    await khuVucHoTroTraSauRepository.findSupportedArea({
      tinh_thanh: tinhThanh,
      quan_huyen: quanHuyen,
      phuong_xa: phuongXa,
    });

  return {
    duoc_ho_tro: Boolean(area),
    khu_vuc: area || null,
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