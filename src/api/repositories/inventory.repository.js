const { Op } = require("sequelize");
const { TonKhoSanPham, KhoHang } = require("../models");

const findStocksForProductsForUpdate = async (productIds, transaction) => {
  return TonKhoSanPham.findAll({
    where: {
      id_san_pham: {
        [Op.in]: productIds,
      },
    },
    include: [
      {
        model: KhoHang,
        required: true,
      },
    ],
    transaction,
    lock: transaction ? transaction.LOCK.UPDATE : undefined,
  });
};

const findStockForUpdate = async (id_san_pham, id_kho_hang, transaction) => {
  return TonKhoSanPham.findOne({
    where: {
      id_san_pham,
      id_kho_hang,
    },
    transaction,
    lock: transaction ? transaction.LOCK.UPDATE : undefined,
  });
};

const updateStock = async (stock, data, transaction) => {
  await stock.update(data, { transaction });
  return stock;
};

const sumStockByProductId = async (id_san_pham, transaction = null) => {
  const total = await TonKhoSanPham.sum("so_luong", {
    where: { id_san_pham },
    transaction,
  });

  return Number(total || 0);
};

const syncProductTotalStock = async (id_san_pham, transaction = null) => {
  const totalStock = await sumStockByProductId(id_san_pham, transaction);
  return totalStock;
};

module.exports = {
  findStocksForProductsForUpdate,
  findStockForUpdate,
  updateStock,
  sumStockByProductId,
  syncProductTotalStock,
};
