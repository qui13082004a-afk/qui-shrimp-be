const { KhoHang, TonKhoSanPham, SanPham } = require("../models");

const WAREHOUSE_ATTRIBUTES = [
  "id_kho_hang",
  "ten_kho",
  "dia_chi",
  "vi_do",
  "kinh_do",
  "ghi_chu",
  "trang_thai",
  "ngay_tao",
  "ngay_cap_nhat",
];

const findAllWarehouses = () => {
  return KhoHang.findAll({
    attributes: WAREHOUSE_ATTRIBUTES,
    order: [["id_kho_hang", "DESC"]],
  });
};

const findActiveWarehouses = () => {
  return KhoHang.findAll({
    where: { trang_thai: "hoat_dong" },
    attributes: WAREHOUSE_ATTRIBUTES,
    order: [["ten_kho", "ASC"]],
  });
};

const findWarehouseById = (id_kho_hang, transaction = null) => {
  return KhoHang.findByPk(id_kho_hang, {
    attributes: WAREHOUSE_ATTRIBUTES,
    transaction,
  });
};

const createWarehouse = (data, transaction = null) => {
  return KhoHang.create(data, { transaction });
};

const updateWarehouse = async (id_kho_hang, data, transaction = null) => {
  const warehouse = await KhoHang.findByPk(id_kho_hang, { transaction });
  if (!warehouse) return null;
  await warehouse.update(data, { transaction });
  return warehouse;
};

const findStock = (id_san_pham, id_kho_hang, transaction = null) => {
  return TonKhoSanPham.findOne({
    where: { id_san_pham, id_kho_hang },
    transaction,
  });
};

const upsertStock = async ({ id_san_pham, id_kho_hang, so_luong, ghi_chu }, transaction = null) => {
  const existed = await findStock(id_san_pham, id_kho_hang, transaction);
  if (existed) {
    await existed.update({ so_luong, ghi_chu }, { transaction });
    return existed;
  }

  return TonKhoSanPham.create(
    { id_san_pham, id_kho_hang, so_luong, ghi_chu },
    { transaction }
  );
};

const findStocksByProductId = (id_san_pham) => {
  return TonKhoSanPham.findAll({
    where: { id_san_pham },
    include: [{ model: KhoHang }],
    order: [[KhoHang, "ten_kho", "ASC"]],
  });
};

const findStocksByWarehouseId = (id_kho_hang) => {
  return TonKhoSanPham.findAll({
    where: { id_kho_hang },
    include: [{ model: SanPham }],
    order: [["id_ton_kho", "DESC"]],
  });
};

const sumStockByProductId = async (id_san_pham, transaction = null) => {
  const total = await TonKhoSanPham.sum("so_luong", {
    where: { id_san_pham },
    transaction,
  });
  return Number(total || 0);
};

module.exports = {
  findAllWarehouses,
  findActiveWarehouses,
  findWarehouseById,
  createWarehouse,
  updateWarehouse,
  upsertStock,
  findStocksByProductId,
  findStocksByWarehouseId,
  sumStockByProductId,
};
