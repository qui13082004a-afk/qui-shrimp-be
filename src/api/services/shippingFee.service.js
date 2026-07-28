const {
  businessAreaRepository,
  departurePointRepository,
  shippingFeeRepository,
} = require("../repositories");
const distanceService = require("./distance.service");
const boundaryLookupService = require("./boundaryLookup.service");

const validateAdmin = (user) => {
  if (!user || user.vai_tro !== "admin") {
    throw new Error("Chi Admin moi co quyen quan ly phi van chuyen");
  }
};

const toBoolean = (value, defaultValue = false) => {
  if (value === undefined || value === null || value === "") return defaultValue;
  return value === true || value === "true" || value === 1 || value === "1";
};

const toRequiredNumber = (value, fieldName) => {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) throw new Error(`${fieldName} khong hop le`);
  return number;
};

const toNullableNumber = (value, fieldName) => {
  if (value === undefined || value === null || value === "") return null;
  return toRequiredNumber(value, fieldName);
};

const validateRange = (tuKm, denKm) => {
  if (denKm !== null && denKm <= tuKm) {
    throw new Error("den_km phai lon hon tu_km");
  }
};

// Lay danh sach toan bo muc phi, co the kem bo loc theo khu vuc/trang thai neu can.
const getAllFees = async (filters = {}) => {
  return await shippingFeeRepository.findAll(filters);
};

// Lay chi tiet mot muc phi van chuyen theo id.
const getFeeById = async (id_muc_phi) => {
  const fee = await shippingFeeRepository.findById(id_muc_phi);
  if (!fee) throw new Error("Khong tim thay muc phi van chuyen");
  return fee;
};

// Admin tao moi muc phi van chuyen cho mot khu vuc kinh doanh.
const createFee = async (user, data) => {
  validateAdmin(user);

  const area = await businessAreaRepository.findById(data.id_khu_vuc);
  if (!area) throw new Error("Khong tim thay khu vuc kinh doanh");

  const tuKm = toRequiredNumber(data.tu_km, "tu_km");
  const denKm = toNullableNumber(data.den_km, "den_km");
  validateRange(tuKm, denKm);

  return await shippingFeeRepository.create({
    id_khu_vuc: data.id_khu_vuc,
    tu_km: tuKm,
    den_km: denKm,
    phi_co_dinh: toRequiredNumber(data.phi_co_dinh, "phi_co_dinh"),
    dang_hoat_dong: toBoolean(data.dang_hoat_dong, true),
  });
};

// Admin cap nhat muc phi van chuyen hien co.
const updateFee = async (user, id_muc_phi, data) => {
  validateAdmin(user);

  const current = await shippingFeeRepository.findById(id_muc_phi);
  if (!current) throw new Error("Khong tim thay muc phi can cap nhat");

  const updateData = {};
  const tuKm = data.tu_km !== undefined ? toRequiredNumber(data.tu_km, "tu_km") : Number(current.tu_km);
  const denKm = data.den_km !== undefined ? toNullableNumber(data.den_km, "den_km") : (current.den_km === null ? null : Number(current.den_km));
  validateRange(tuKm, denKm);

  if (data.tu_km !== undefined) updateData.tu_km = tuKm;
  if (data.den_km !== undefined) updateData.den_km = denKm;
  if (data.phi_co_dinh !== undefined) updateData.phi_co_dinh = toRequiredNumber(data.phi_co_dinh, "phi_co_dinh");
  if (data.dang_hoat_dong !== undefined) updateData.dang_hoat_dong = toBoolean(data.dang_hoat_dong);

  return await shippingFeeRepository.update(id_muc_phi, updateData);
};

// Kiem tra khu vuc co ton tai, dang hoat dong va duoc phep ban hang hay khong.
const validateActiveArea = (area) => {
  if (!area) throw new Error("Khong tim thay khu vuc kinh doanh");
  if (!area.dang_hoat_dong) throw new Error("Khu vuc hien khong hoat dong");
  if (!area.cho_phep_ban_hang) throw new Error("Khu vuc chua duoc phep ban hang");
};
const resolveServiceArea = async (data) => {
  // Uu tien xac dinh khu vuc theo tinh/thanh da duoc chon tu truoc.
  if (data.id_tinh_thanh) {
    const selectedProvinceArea = await businessAreaRepository.findByProvinceId(
      data.id_tinh_thanh
    );

    if (selectedProvinceArea) {
      validateActiveArea(selectedProvinceArea);

      return {
        area: selectedProvinceArea,
        boundary: {
          tim_thay: true,
          vi_do: data.vi_do,
          kinh_do: data.kinh_do,
          dia_gioi: selectedProvinceArea.TinhThanh
            ? {
                ma_tinh: selectedProvinceArea.TinhThanh.ma_tinh,
                ten_tinh: selectedProvinceArea.TinhThanh.ten_tinh,
              }
            : null,
        },
        // Dia chi da gan voi tinh/thanh dang phuc vu nen khong can kiem tra ban kinh.
        pham_vi_phuc_vu: "theo_dia_chi_da_luu",
        can_check_radius: false,
        thong_bao:
          "Dia chi giao hang da gan voi tinh/thanh dang phuc vu.",
      };
    }
  }

  // Neu khong xac dinh duoc theo tinh da chon, thu tra nguoc dia gioi tu toa do.
  const boundary = await boundaryLookupService.resolveCoordinate({
    vi_do: data.vi_do,
    kinh_do: data.kinh_do,
  });

  if (boundary.tim_thay && boundary.dia_gioi?.ma_tinh) {
    const provinceArea =
      (await businessAreaRepository.findByProvinceCode(
        boundary.dia_gioi.ma_tinh
      )) ||
      (await businessAreaRepository.findByProvinceName(
        boundary.dia_gioi.ten_tinh
      ));

    if (provinceArea && provinceArea.dang_hoat_dong && provinceArea.cho_phep_ban_hang) {
      return {
        area: provinceArea,
        boundary,
        // Chi can nam trong tinh/thanh dang phuc vu la van tiep nhan, khong ep kiem tra ban kinh.
        pham_vi_phuc_vu: "trong_tinh_phuc_vu",
        can_check_radius: false,
        thong_bao:
          "Dia diem nam trong tinh/thanh dang phuc vu. He thong van tiep nhan don neu khoang cach xa hon ban kinh cau hinh.",
      };
    }
  }

  // Truong hop khong nam trong tinh dang phuc vu nhung nguoi dung da chi ro khu vuc,
  // he thong van thu xu ly tiep nhung se bat buoc kiem tra ban kinh o buoc sau.
  if (data.id_khu_vuc) {
    const selectedArea = await businessAreaRepository.findById(data.id_khu_vuc);
    validateActiveArea(selectedArea);

    return {
      area: selectedArea,
      boundary,
      pham_vi_phuc_vu: boundary.tim_thay ? "ngoai_tinh_trong_ban_kinh" : "khong_xac_dinh_trong_ban_kinh",
      can_check_radius: true,
      thong_bao:
        "Dia diem khong thuoc tinh/thanh dang phuc vu da nhan dien, he thong se kiem tra ban kinh toi da.",
    };
  }

  // Khong tim thay khu vuc phuc vu phu hop.
  return {
    area: null,
    boundary,
    pham_vi_phuc_vu: boundary.tim_thay ? "ngoai_tinh_chua_cau_hinh" : "khong_xac_dinh",
    can_check_radius: true,
    thong_bao: "Dia diem chua thuoc khu vuc kinh doanh duoc cau hinh.",
  };
};

// Tinh phi ship theo diem xuat phat mac dinh cua he thong.
const calculateShippingFee = async (data) => {
  const viDo = Number(data.vi_do);
  const kinhDo = Number(data.kinh_do);

  if (!Number.isFinite(viDo) || viDo < -90 || viDo > 90) {
    throw new Error("Vi do khong hop le");
  }
  if (!Number.isFinite(kinhDo) || kinhDo < -180 || kinhDo > 180) {
    throw new Error("Kinh do khong hop le");
  }

  // Xac dinh diem giao hang co nam trong khu vuc phuc vu nao khong,
  // dong thoi tra ve thong tin co can kiem tra ban kinh hay khong.
  const serviceArea = await resolveServiceArea({
    ...data,
    vi_do: viDo,
    kinh_do: kinhDo,
  });

  if (!serviceArea.area) {
    throw new Error("Dia diem giao hang chua nam trong khu vuc ho tro");
  }

  const area = serviceArea.area;

  // Lay diem xuat phat mac dinh dang hoat dong de tinh khoang cach giao hang.
  const departurePoint = await departurePointRepository.findDefaultActive();
  if (!departurePoint) throw new Error("Chua cau hinh diem xuat phat mac dinh dang hoat dong");

  // Tinh khoang cach tu diem xuat phat den diem giao hang.
  const distance = await distanceService.calculateDistanceKm(
    { vi_do: departurePoint.vi_do, kinh_do: departurePoint.kinh_do },
    { vi_do: viDo, kinh_do: kinhDo }
  );

  const provinceRadius = area.ban_kinh_toi_da_km === null ? null : Number(area.ban_kinh_toi_da_km);
  const departureRadius = departurePoint.ban_kinh_toi_da_km === null ? null : Number(departurePoint.ban_kinh_toi_da_km);

  // Neu khu vuc bat buoc kiem tra ban kinh, thi khoang cach phai khong vuot qua
  // ban kinh toi da cua khu vuc phuc vu.
  if (serviceArea.can_check_radius && provinceRadius !== null && distance.distance_km > provinceRadius) {
    throw new Error("Khoang cach vuot ban kinh toi da cua khu vuc");
  }

  // Tiep tuc kiem tra them voi ban kinh toi da cua diem xuat phat.
  if (serviceArea.can_check_radius && departureRadius !== null && distance.distance_km > departureRadius) {
    throw new Error("Khoang cach vuot ban kinh toi da cua diem xuat phat");
  }

  // Tim muc phi phu hop theo khu vuc va khoang cach.
  // Neu khong co muc phi cu the thi dung phi van chuyen mac dinh cua khu vuc.
  const matchedFee = await shippingFeeRepository.findMatchedFee(area.id_khu_vuc, distance.distance_km);
  const shippingFee = matchedFee
    ? Number(matchedFee.phi_co_dinh)
    : Number(area.phi_van_chuyen_mac_dinh || 0);

  return {
    id_khu_vuc: area.id_khu_vuc,
    id_diem_xuat_phat: departurePoint.id_diem_xuat_phat,
    khoang_cach_km: distance.distance_km,
    distance_provider: distance.provider,
    phi_van_chuyen: shippingFee,
    muc_phi: matchedFee || null,
    pham_vi_phuc_vu: serviceArea.pham_vi_phuc_vu,
    thong_bao: serviceArea.thong_bao,
    dia_gioi: serviceArea.boundary.dia_gioi,
  };
};

// Tinh phi ship theo kho xuat thuc te da duoc chon/phan bo.
const calculateShippingFeeFromWarehouse = async ({ warehouse, ...data }) => {
  const viDo = Number(data.vi_do);
  const kinhDo = Number(data.kinh_do);

  if (!warehouse) throw new Error("Chua xac dinh kho xuat hang");
  if (!Number.isFinite(Number(warehouse.vi_do)) || !Number.isFinite(Number(warehouse.kinh_do))) {
    throw new Error("Kho xuat hang chua co toa do hop le");
  }
  if (!Number.isFinite(viDo) || viDo < -90 || viDo > 90) {
    throw new Error("Vi do khong hop le");
  }
  if (!Number.isFinite(kinhDo) || kinhDo < -180 || kinhDo > 180) {
    throw new Error("Kinh do khong hop le");
  }

  const serviceArea = await resolveServiceArea({
    ...data,
    vi_do: viDo,
    kinh_do: kinhDo,
  });

  if (!serviceArea.area) {
    throw new Error("Dia diem giao hang chua nam trong khu vuc ho tro");
  }

  const area = serviceArea.area;
  const distance = await distanceService.calculateDistanceKm(
    { vi_do: warehouse.vi_do, kinh_do: warehouse.kinh_do },
    { vi_do: viDo, kinh_do: kinhDo }
  );

  const provinceRadius = area.ban_kinh_toi_da_km === null ? null : Number(area.ban_kinh_toi_da_km);
  const warehouseRadius =
    warehouse.ban_kinh_phuc_vu === null || warehouse.ban_kinh_phuc_vu === undefined
      ? null
      : Number(warehouse.ban_kinh_phuc_vu);

  if (serviceArea.can_check_radius && provinceRadius !== null && distance.distance_km > provinceRadius) {
    throw new Error("Khoang cach vuot ban kinh toi da cua khu vuc");
  }
  if (serviceArea.can_check_radius && warehouseRadius !== null && distance.distance_km > warehouseRadius) {
    throw new Error("Khoang cach vuot ban kinh phuc vu cua kho xuat hang");
  }

  const matchedFee = await shippingFeeRepository.findMatchedFee(area.id_khu_vuc, distance.distance_km);
  const shippingFee = matchedFee
    ? Number(matchedFee.phi_co_dinh)
    : Number(area.phi_van_chuyen_mac_dinh || 0);

  return {
    id_khu_vuc: area.id_khu_vuc,
    id_diem_xuat_phat: null,
    khoang_cach_km: distance.distance_km,
    distance_provider: distance.provider,
    phi_van_chuyen: shippingFee,
    muc_phi: matchedFee || null,
    pham_vi_phuc_vu: serviceArea.pham_vi_phuc_vu,
    thong_bao: serviceArea.thong_bao,
    dia_gioi: serviceArea.boundary.dia_gioi,
    kho_xuat: {
      id_kho_hang: warehouse.id_kho_hang,
      ten_kho: warehouse.ten_kho,
      dia_chi: warehouse.dia_chi,
      vi_do: warehouse.vi_do,
      kinh_do: warehouse.kinh_do,
    },
  };
};

module.exports = {
  getAllFees,
  getFeeById,
  createFee,
  updateFee,
  calculateShippingFee,
  calculateShippingFeeFromWarehouse,
};
