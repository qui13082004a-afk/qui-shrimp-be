const { sequelize } = require("../../config/database");
const deliveryAddressRepository = require("../repositories/deliveryAddress.repository");
const locationRepository = require("../repositories/location.repository");
const locationService = require("./location.service");

const normalizeText = (value) => String(value || "").trim().replace(/\s+/g, " ");

const toCoordinate = (value, fieldName, min, max) => {
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max) {
    throw new Error(`${fieldName} khong hop le`);
  }
  return number;
};

const buildAddressData = async (user, data) => {
  const ten_nguoi_nhan = normalizeText(data.ten_nguoi_nhan || user.ho_ten);
  const so_dien_thoai = normalizeText(data.so_dien_thoai || user.so_dien_thoai);
  const dia_chi = normalizeText(data.dia_chi);
  const vi_do = toCoordinate(data.vi_do, "Vi do giao hang", -90, 90);
  const kinh_do = toCoordinate(data.kinh_do, "Kinh do giao hang", -180, 180);

  if (!ten_nguoi_nhan) throw new Error("Ten nguoi nhan khong duoc de trong");
  if (!so_dien_thoai) throw new Error("So dien thoai nhan hang khong duoc de trong");
  if (!dia_chi) throw new Error("Dia chi giao hang khong duoc de trong");

  let id_tinh_thanh = data.id_tinh_thanh || null;
  let id_phuong_xa = data.id_phuong_xa || null;

  try {
    const resolved = await locationService.resolveCoordinate({ vi_do, kinh_do });
    const boundary = resolved?.dia_gioi;

    if (boundary?.ma_tinh) {
      const province = await locationRepository.findProvinceByCode(
        boundary.ma_tinh
      );
      id_tinh_thanh = province?.id_tinh_thanh || id_tinh_thanh;
    }

    if (boundary?.ma_xa) {
      const ward = await locationRepository.findWardByCode(boundary.ma_xa);
      id_phuong_xa = ward?.id_phuong_xa || id_phuong_xa;
    }
  } catch {
    // Van cho luu dia chi neu toa do hop le nhung file boundary chua nhan dien duoc.
  }

  return {
    ten_nguoi_nhan,
    so_dien_thoai,
    dia_chi,
    id_tinh_thanh,
    id_phuong_xa,
    vi_do,
    kinh_do,
    ghi_chu: normalizeText(data.ghi_chu) || null,
  };
};

const getMyAddresses = (user) => {
  return deliveryAddressRepository.findByUserId(user.id_nguoi_dung);
};

const createMyAddress = async (user, data) => {
  const transaction = await sequelize.transaction();
  try {
    const activeCount = await deliveryAddressRepository.countActiveByUser(
      user.id_nguoi_dung,
      transaction
    );
    const la_mac_dinh = Boolean(data.la_mac_dinh) || activeCount === 0;

    if (la_mac_dinh) {
      await deliveryAddressRepository.unsetDefaultByUser(
        user.id_nguoi_dung,
        transaction
      );
    }

    const addressData = await buildAddressData(user, data);
    const address = await deliveryAddressRepository.create(
      {
        ...addressData,
        id_nguoi_dung: user.id_nguoi_dung,
        la_mac_dinh,
      },
      transaction
    );

    await transaction.commit();
    return deliveryAddressRepository.findByIdForUser(
      address.id_dia_chi,
      user.id_nguoi_dung
    );
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const updateMyAddress = async (user, id_dia_chi, data) => {
  const transaction = await sequelize.transaction();
  try {
    const address = await deliveryAddressRepository.findByIdForUser(
      id_dia_chi,
      user.id_nguoi_dung,
      transaction
    );
    if (!address) throw new Error("Khong tim thay dia chi giao hang");

    if (data.la_mac_dinh) {
      await deliveryAddressRepository.unsetDefaultByUser(
        user.id_nguoi_dung,
        transaction
      );
    }

    const addressData = await buildAddressData(user, {
      ...address.toJSON(),
      ...data,
    });

    await deliveryAddressRepository.update(
      address,
      {
        ...addressData,
        la_mac_dinh:
          data.la_mac_dinh === undefined
            ? address.la_mac_dinh
            : Boolean(data.la_mac_dinh),
      },
      transaction
    );

    await transaction.commit();
    return deliveryAddressRepository.findByIdForUser(
      id_dia_chi,
      user.id_nguoi_dung
    );
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const setDefaultAddress = async (user, id_dia_chi) => {
  const transaction = await sequelize.transaction();
  try {
    const address = await deliveryAddressRepository.findByIdForUser(
      id_dia_chi,
      user.id_nguoi_dung,
      transaction
    );
    if (!address) throw new Error("Khong tim thay dia chi giao hang");

    await deliveryAddressRepository.unsetDefaultByUser(
      user.id_nguoi_dung,
      transaction
    );
    await deliveryAddressRepository.update(
      address,
      { la_mac_dinh: true },
      transaction
    );

    await transaction.commit();
    return deliveryAddressRepository.findByIdForUser(
      id_dia_chi,
      user.id_nguoi_dung
    );
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const deleteMyAddress = async (user, id_dia_chi) => {
  const transaction = await sequelize.transaction();
  try {
    const address = await deliveryAddressRepository.findByIdForUser(
      id_dia_chi,
      user.id_nguoi_dung,
      transaction
    );
    if (!address) throw new Error("Khong tim thay dia chi giao hang");

    await deliveryAddressRepository.softDelete(address, transaction);
    await transaction.commit();
    return true;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

module.exports = {
  getMyAddresses,
  createMyAddress,
  updateMyAddress,
  setDefaultAddress,
  deleteMyAddress,
};
