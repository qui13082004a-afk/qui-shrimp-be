const { sequelize } = require("../../config/database");
const {
  warehouseRepository,
  productRepository,
  departurePointRepository,
} = require("../repositories");

const validateAdmin = (user) => {
  if (!user || user.vai_tro !== "admin") {
    throw new Error("Chi Admin moi co quyen quan ly kho hang");
  }
};

const toNullableNumber = (value, fieldName, min, max) => {
  if (value === undefined || value === null || value === "") return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max) {
    throw new Error(`${fieldName} khong hop le`);
  }
  return number;
};

const toStockNumber = (value) => {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0) {
    throw new Error("So luong ton kho khong hop le");
  }
  return number;
};

const getWarehouses = async (query = {}) => {
  if (query.activeOnly === "true") {
    return warehouseRepository.findActiveWarehouses();
  }
  return warehouseRepository.findAllWarehouses();
};

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
    ghi_chu: data.ghi_chu || null,
    trang_thai: data.trang_thai || "hoat_dong",
  });
};

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
  if (data.ghi_chu !== undefined) patch.ghi_chu = data.ghi_chu || null;
  if (data.trang_thai !== undefined) patch.trang_thai = data.trang_thai;

  const updated = await warehouseRepository.updateWarehouse(id_kho_hang, patch);
  if (!updated) throw new Error("Khong tim thay kho hang");
  return updated;
};

const upsertProductStock = async (user, data) => {
  validateAdmin(user);
  const product = await productRepository.findById(data.id_san_pham);
  if (!product) throw new Error("Khong tim thay san pham");

  const warehouse = await warehouseRepository.findWarehouseById(data.id_kho_hang);
  if (!warehouse) throw new Error("Khong tim thay kho hang");

  const transaction = await sequelize.transaction();
  try {
    const stock = await warehouseRepository.upsertStock(
      {
        id_san_pham: data.id_san_pham,
        id_kho_hang: data.id_kho_hang,
        so_luong: toStockNumber(data.so_luong),
        ghi_chu: data.ghi_chu || null,
      },
      transaction
    );

    const totalStock = await warehouseRepository.sumStockByProductId(
      data.id_san_pham,
      transaction
    );

    await product.update({ ton_kho: totalStock }, { transaction });
    await transaction.commit();

    return stock;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const getProductStocks = async (id_san_pham) => {
  return warehouseRepository.findStocksByProductId(id_san_pham);
};

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
