const inventoryRepository = require("../repositories/inventory.repository");

const toNumber = (value) => Number(value || 0);

// So luong kha dung = ton kho hien tai - so luong dang duoc giu cho cac don.
const getAvailableQuantity = (stock) => {
  return Math.max(toNumber(stock.so_luong) - toNumber(stock.so_luong_giu), 0);
};

// Giu ton kho cho don hang moi:
// - tang so_luong_giu
// - dong bo lai tong ton theo san pham
const reserveInventory = async ({ allocation, items, transaction }) => {
  const touchedProductIds = new Set();

  for (const item of items) {
    const idSanPham = Number(item.id_san_pham);
    const stock = allocation.stocksByProduct.get(idSanPham);
    const quantity = Number(item.so_luong_dat);

    if (!stock || getAvailableQuantity(stock) < quantity) {
      const error = new Error(`San pham ID ${idSanPham} khong du ton kha dung tai kho da chon`);
      error.code = "OUT_OF_STOCK";
      throw error;
    }

    await inventoryRepository.updateStock(
      stock,
      {
        so_luong_giu: toNumber(stock.so_luong_giu) + quantity,
      },
      transaction
    );

    touchedProductIds.add(idSanPham);
  }

  for (const idSanPham of touchedProductIds) {
    await inventoryRepository.syncProductTotalStock(idSanPham, transaction);
  }
};

// Tra lai ton kho da giu khi don bi huy hoac giao that bai.
// Neu da co phan ton bi tru thuc te thi cong tra lai vao so_luong.
const releaseInventory = async ({ order, transaction }) => {
  const details = order.ChiTietDonHangs || [];
  const touchedProductIds = new Set();

  for (const detail of details) {
    if (!detail.id_kho_xuat_thuc_te) continue;

    const stock = await inventoryRepository.findStockForUpdate(
      detail.id_san_pham,
      detail.id_kho_xuat_thuc_te,
      transaction
    );

    if (!stock) continue;

    const quantity = Number(detail.so_luong_dat);
    const currentStock = toNumber(stock.so_luong);
    const currentReserved = toNumber(stock.so_luong_giu);
    const reservedToRelease = Math.min(currentReserved, quantity);
    const deductedQuantity = quantity - reservedToRelease;

    await inventoryRepository.updateStock(
      stock,
      {
        so_luong: currentStock + deductedQuantity,
        so_luong_giu: Math.max(currentReserved - reservedToRelease, 0),
      },
      transaction
    );

    touchedProductIds.add(Number(detail.id_san_pham));
  }

  for (const idSanPham of touchedProductIds) {
    await inventoryRepository.syncProductTotalStock(idSanPham, transaction);
  }
};

// Chot xuat kho thuc te:
// - giam so_luong
// - giam so_luong_giu
// - tra ve danh sach ton kho sau khi xac nhan de canh bao ton thap
const confirmInventory = async ({ order, transaction }) => {
  const details = order.ChiTietDonHangs || [];
  const touchedProductIds = new Set();
  const confirmedStocks = [];

  for (const detail of details) {
    if (!detail.id_kho_xuat_thuc_te) continue;

    const stock = await inventoryRepository.findStockForUpdate(
      detail.id_san_pham,
      detail.id_kho_xuat_thuc_te,
      transaction
    );

    if (!stock) {
      const error = new Error(`Khong tim thay ton kho de xac nhan xuat san pham ID ${detail.id_san_pham}`);
      error.code = "INVENTORY_NOT_FOUND";
      throw error;
    }

    const quantity = Number(detail.so_luong_dat);
    const currentStock = toNumber(stock.so_luong);
    const currentReserved = toNumber(stock.so_luong_giu);
    const reservedToConfirm = Math.min(currentReserved, quantity);

    if (reservedToConfirm <= 0) {
      touchedProductIds.add(Number(detail.id_san_pham));
      continue;
    }

    if (currentStock < reservedToConfirm) {
      const error = new Error(`Ton kho khong du de xac nhan xuat san pham ID ${detail.id_san_pham}`);
      error.code = "OUT_OF_STOCK";
      throw error;
    }

    await inventoryRepository.updateStock(
      stock,
      {
        so_luong: currentStock - reservedToConfirm,
        so_luong_giu: Math.max(currentReserved - reservedToConfirm, 0),
      },
      transaction
    );

    touchedProductIds.add(Number(detail.id_san_pham));
    confirmedStocks.push({
      id_san_pham: Number(detail.id_san_pham),
      id_kho_hang: Number(detail.id_kho_xuat_thuc_te),
      so_luong: currentStock - reservedToConfirm,
      ton_kho_toi_thieu: toNumber(stock.ton_kho_toi_thieu),
    });
  }

  for (const idSanPham of touchedProductIds) {
    await inventoryRepository.syncProductTotalStock(idSanPham, transaction);
  }

  return confirmedStocks;
};

module.exports = {
  reserveInventory,
  releaseInventory,
  confirmInventory,
};
