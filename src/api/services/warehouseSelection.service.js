const inventoryRepository = require("../repositories/inventory.repository");
const distanceService = require("./distance.service");

const toNumber = (value) => Number(value || 0);

const hasCoordinates = (warehouse, destination) => {
  return (
    warehouse &&
    destination &&
    warehouse.vi_do !== null &&
    warehouse.vi_do !== undefined &&
    warehouse.kinh_do !== null &&
    warehouse.kinh_do !== undefined &&
    destination.vi_do !== null &&
    destination.vi_do !== undefined &&
    destination.kinh_do !== null &&
    destination.kinh_do !== undefined
  );
};

const calculateWarehouseDistance = async (warehouse, destination) => {
  if (!hasCoordinates(warehouse, destination)) {
    return {
      distance_km: null,
      provider: "unknown",
    };
  }

  return distanceService.calculateDistanceKm(
    {
      vi_do: warehouse.vi_do,
      kinh_do: warehouse.kinh_do,
    },
    {
      vi_do: destination.vi_do,
      kinh_do: destination.kinh_do,
    }
  );
};

const groupStocksByWarehouse = (stocks) => {
  const grouped = new Map();

  stocks.forEach((stock) => {
    const idKho = Number(stock.id_kho_hang);
    if (!grouped.has(idKho)) {
      grouped.set(idKho, {
        warehouse: stock.KhoHang,
        stocksByProduct: new Map(),
      });
    }

    grouped.get(idKho).stocksByProduct.set(Number(stock.id_san_pham), stock);
  });

  return Array.from(grouped.values());
};

const getAvailableQuantity = (stock) => {
  return Math.max(toNumber(stock.so_luong) - toNumber(stock.so_luong_giu), 0);
};

const canWarehouseFulfillAllItems = (warehouseGroup, items) => {
  return items.every((item) => {
    const stock = warehouseGroup.stocksByProduct.get(Number(item.id_san_pham));
    return stock && getAvailableQuantity(stock) >= Number(item.so_luong_dat);
  });
};

const getRequestedWarehouseIds = (items) => {
  return [
    ...new Set(
      items
        .map((item) => item.id_kho_hang || item.id_kho_khach_chon)
        .filter((id) => id !== null && id !== undefined && id !== "")
        .map((id) => Number(id))
    ),
  ];
};

const getRequestedWarehouseScore = (warehouseId, items) => {
  return items.reduce((score, item) => {
    const requestedWarehouseId = item.id_kho_hang || item.id_kho_khach_chon;
    if (!requestedWarehouseId) return score;
    return Number(requestedWarehouseId) === Number(warehouseId) ? score + 1 : score;
  }, 0);
};

const isWarehouseInsideRadius = (warehouse, distanceKm) => {
  const radius = warehouse.ban_kinh_phuc_vu;
  if (radius === null || radius === undefined || radius === "") return true;
  if (distanceKm === null) return true;
  return Number(distanceKm) <= Number(radius);
};

const chooseBestWarehouse = async ({ items, destination, transaction }) => {
  const productIds = [...new Set(items.map((item) => Number(item.id_san_pham)))];
  const requestedWarehouseIds = getRequestedWarehouseIds(items);
  const stocks = await inventoryRepository.findStocksForProductsForUpdate(
    productIds,
    transaction
  );

  if (!stocks.length) {
    const error = new Error("Chua cau hinh ton kho theo kho cho cac san pham trong don hang");
    error.code = "WAREHOUSE_STOCK_NOT_CONFIGURED";
    throw error;
  }

  const candidates = [];
  const warehouseGroups = groupStocksByWarehouse(stocks);

  for (const warehouseGroup of warehouseGroups) {
    const warehouse = warehouseGroup.warehouse;
    if (!warehouse) continue;

    const canFulfillAll = canWarehouseFulfillAllItems(warehouseGroup, items);
    if (!canFulfillAll) continue;

    const distance = await calculateWarehouseDistance(warehouse, destination);
    if (!isWarehouseInsideRadius(warehouse, distance.distance_km)) continue;

    candidates.push({
      warehouse,
      stocksByProduct: warehouseGroup.stocksByProduct,
      distance_km: distance.distance_km,
      distance_provider: distance.provider,
      requestedScore: getRequestedWarehouseScore(warehouse.id_kho_hang, items),
      isFullyRequestedWarehouse:
        requestedWarehouseIds.length === 1 &&
        Number(requestedWarehouseIds[0]) === Number(warehouse.id_kho_hang),
      priority: toNumber(warehouse.muc_do_uu_tien),
    });
  }

  if (!candidates.length) {
    const error = new Error("Khong co kho nao du ton kha dung de xuat toan bo don hang");
    error.code = "OUT_OF_STOCK";
    throw error;
  }

  candidates.sort((a, b) => {
    const distanceA = a.distance_km === null ? Number.MAX_SAFE_INTEGER : Number(a.distance_km);
    const distanceB = b.distance_km === null ? Number.MAX_SAFE_INTEGER : Number(b.distance_km);

    if (distanceA !== distanceB) return distanceA - distanceB;

    if (a.isFullyRequestedWarehouse !== b.isFullyRequestedWarehouse) {
      return a.isFullyRequestedWarehouse ? -1 : 1;
    }

    if (b.requestedScore !== a.requestedScore) return b.requestedScore - a.requestedScore;

    return b.priority - a.priority;
  });

  return candidates[0];
};

module.exports = {
  chooseBestWarehouse,
};
