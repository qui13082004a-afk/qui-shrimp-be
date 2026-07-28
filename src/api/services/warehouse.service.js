const { sequelize } = require("../../config/database");
const {
  warehouseRepository,
  productRepository,
  departurePointRepository,
} = require("../repositories");
const notificationService = require("./notification.service");

// Kiem tra quyen admin truoc khi cho phep thao tac quan ly kho.
const validateAdmin = (user) => {
  if (!user || user.vai_tro !== "admin") {
    throw new Error("Chi Admin moi co quyen quan ly kho hang");
  }
};

// Chuyen doi gia tri so co the bo trong, dung cho cac truong cau hinh kho.
const toNullableNumber = (value, fieldName, min, max) => {
  if (value === undefined || value === null || value === "") return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max) {
    throw new Error(`${fieldName} khong hop le`);
  }
  return number;
};

// Chuan hoa so luong ton kho, chi chap nhan so nguyen khong am.
const toStockNumber = (value) => {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0) {
    throw new Error("So luong ton kho khong hop le");
  }
  return number;
};

// Lay danh sach kho, co the loc chi cac kho dang hoat dong.
const getWarehouses = async (query = {}) => {
  if (query.activeOnly === "true") {
    return warehouseRepository.findActiveWarehouses();
  }
  return warehouseRepository.findAllWarehouses();
};

// Tao kho hang moi dua tren mot diem xuat phat/chi nhanh kinh doanh.
const createWarehouse = async (user, data) => {
  validateAdmin(user);

  if (!data.id_diem_xuat_phat) {
    throw new Error("Vui long chon dia chi kinh doanh cho kho hang");
  }

  const departurePoint = await departurePointRepository.findById(
    data.id_diem_xuat_phat
  );
  if (!departurePoint) throw new Error("Khong tim thay dia chi kinh doanh");

  return warehouseRepository.createWarehouse({
    ten_kho: data.ten_kho || departurePoint.ten_diem,
    id_diem_xuat_phat: departurePoint.id_diem_xuat_phat,
    dia_chi: departurePoint.dia_chi,
    vi_do: departurePoint.vi_do,
    kinh_do: departurePoint.kinh_do,
    ban_kinh_phuc_vu: toNullableNumber(
      data.ban_kinh_phuc_vu,
      "Ban kinh phuc vu",
      0,
      10000
    ),
    muc_do_uu_tien:
      toNullableNumber(data.muc_do_uu_tien, "Muc do uu tien", 0, 100000) || 0,
    ghi_chu: data.ghi_chu || null,
    trang_thai: data.trang_thai || "hoat_dong",
  });
};

// Cap nhat thong tin kho hang va dong bo lai dia chi/toa do neu doi diem xuat phat.
const updateWarehouse = async (user, id_kho_hang, data) => {
  validateAdmin(user);

  const patch = {};
  if (data.ten_kho !== undefined) {
    if (!String(data.ten_kho || "").trim()) {
      throw new Error("Ten kho khong duoc de trong");
    }
    patch.ten_kho = data.ten_kho;
  }
  if (data.id_diem_xuat_phat !== undefined) {
    const departurePoint = await departurePointRepository.findById(
      data.id_diem_xuat_phat
    );
    if (!departurePoint) throw new Error("Khong tim thay dia chi kinh doanh");

    patch.id_diem_xuat_phat = departurePoint.id_diem_xuat_phat;
    patch.dia_chi = departurePoint.dia_chi;
    patch.vi_do = departurePoint.vi_do;
    patch.kinh_do = departurePoint.kinh_do;
    if (data.ten_kho === undefined) patch.ten_kho = departurePoint.ten_diem;
  }
  if (data.ban_kinh_phuc_vu !== undefined) {
    patch.ban_kinh_phuc_vu = toNullableNumber(
      data.ban_kinh_phuc_vu,
      "Ban kinh phuc vu",
      0,
      10000
    );
  }
  if (data.muc_do_uu_tien !== undefined) {
    patch.muc_do_uu_tien = toNullableNumber(
      data.muc_do_uu_tien,
      "Muc do uu tien",
      0,
      100000
    ) || 0;
  }
  if (data.ghi_chu !== undefined) patch.ghi_chu = data.ghi_chu || null;
  if (data.trang_thai !== undefined) patch.trang_thai = data.trang_thai;

  const updated = await warehouseRepository.updateWarehouse(id_kho_hang, patch);
  if (!updated) throw new Error("Khong tim thay kho hang");
  return updated;
};

// Cap nhat ton kho cua mot san pham trong kho va gui canh bao neu cham muc toi thieu.
const upsertProductStock = async (user, data) => {
  validateAdmin(user);
  const product = await productRepository.findById(data.id_san_pham);
  if (!product) throw new Error("Khong tim thay san pham");

  const warehouse = await warehouseRepository.findWarehouseById(data.id_kho_hang);
  if (!warehouse) throw new Error("Khong tim thay kho hang");

  const stockQuantity = toStockNumber(data.so_luong);
  const minimumStock = toStockNumber(data.ton_kho_toi_thieu || 0);

  const transaction = await sequelize.transaction();
  try {
    const stock = await warehouseRepository.upsertStock(
      {
        id_san_pham: data.id_san_pham,
        id_kho_hang: data.id_kho_hang,
        so_luong: stockQuantity,
        ton_kho_toi_thieu: minimumStock,
        ghi_chu: data.ghi_chu || null,
      },
      transaction
    );

    await transaction.commit();

    if (minimumStock > 0 && stockQuantity <= minimumStock) {
      try {
        await notificationService.notifyAdmins({
          tieu_de: "Canh bao ton kho thap",
          noi_dung: `San pham "${product.ten_san_pham}" tai kho "${warehouse.ten_kho}" con ${stockQuantity}, bang hoac thap hon muc toi thieu ${minimumStock}.`,
          loai: "he_thong",
          lien_ket: "/admin/san-pham",
        });
      } catch (notificationError) {
        console.error("Khong the gui thong bao ton kho thap:", notificationError.message);
      }
    }

    return stock;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

// Lay ton kho cua mot san pham tren tat ca cac kho.
const getProductStocks = async (id_san_pham) => {
  return warehouseRepository.findStocksByProductId(id_san_pham);
};

// Lay danh sach ton kho cua tat ca san pham trong mot kho.
const getWarehouseStocks = async (id_kho_hang) => {
  return warehouseRepository.findStocksByWarehouseId(id_kho_hang);
};

module.exports = {
  getWarehouses,
  createWarehouse,
  updateWarehouse,
  upsertProductStock,
  getProductStocks,
  getWarehouseStocks,
};
