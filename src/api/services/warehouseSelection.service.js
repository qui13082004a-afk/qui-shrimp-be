const inventoryRepository = require("../repositories/inventory.repository");
const distanceService = require("./distance.service");

const toNumber = (value) => Number(value || 0);

// Kiem tra kho va diem giao hang da co du toa do de tinh khoang cach hay chua.
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

// Tinh khoang cach tu kho den diem giao, neu thieu toa do thi tra ve unknown.
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

// Gom ton kho theo tung kho de de kiem tra kha nang dap ung don hang.
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

// So luong kha dung = ton kho hien tai - so luong dang giu cho don khac.
const getAvailableQuantity = (stock) => {
  return Math.max(toNumber(stock.so_luong) - toNumber(stock.so_luong_giu), 0);
};

// Kiem tra mot kho co du tat ca san pham trong don hang hay khong.
const canWarehouseFulfillAllItems = (warehouseGroup, items) => {
  return items.every((item) => {
    const stock = warehouseGroup.stocksByProduct.get(Number(item.id_san_pham));
    return stock && getAvailableQuantity(stock) >= Number(item.so_luong_dat);
  });
};

// Lay danh sach kho ma nguoi dung da chi dinh/uu tien tren tung mat hang.
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

// Tinh diem uu tien theo so luong mat hang muon lay tu mot kho cu the.
const getRequestedWarehouseScore = (warehouseId, items) => {
  return items.reduce((score, item) => {
    const requestedWarehouseId = item.id_kho_hang || item.id_kho_khach_chon;
    if (!requestedWarehouseId) return score;
    return Number(requestedWarehouseId) === Number(warehouseId) ? score + 1 : score;
  }, 0);
};

// Kiem tra kho co nam trong ban kinh phuc vu cho phep hay khong.
const isWarehouseInsideRadius = (warehouse, distanceKm) => {
  const radius = warehouse.ban_kinh_phuc_vu;
  if (radius === null || radius === undefined || radius === "") return true;
  if (distanceKm === null) return true;
  return Number(distanceKm) <= Number(radius);
};
// Chọn kho phù hợp nhất để xuất toàn bộ đơn hàng
const chooseBestWarehouse = async ({
  items,
  destination,
  transaction,
}) => {
  // Lấy danh sách ID sản phẩm và loại bỏ ID bị trùng
  const productIds = [
    ...new Set(
      items.map((item) => Number(item.id_san_pham))
    ),
  ];

  // Lấy các kho mà người dùng đã chọn hoặc ưu tiên
  const requestedWarehouseIds =
    getRequestedWarehouseIds(items);

  // Lấy tồn kho của các sản phẩm và khóa dữ liệu khi xử lý
  const stocks =
    await inventoryRepository.findStocksForProductsForUpdate(
      productIds,
      transaction
    );

  // Báo lỗi nếu sản phẩm chưa được cấu hình tồn kho
  if (!stocks.length) {
    const error = new Error(
      "Chưa cấu hình tồn kho theo kho cho các sản phẩm trong đơn hàng"
    );

    error.code = "WAREHOUSE_STOCK_NOT_CONFIGURED";
    throw error;
  }

  // Danh sách các kho có thể đáp ứng đơn hàng
  const candidates = [];

  // Gom tồn kho theo từng kho
  const warehouseGroups = groupStocksByWarehouse(stocks);
  // Kiểm tra lần lượt từng kho
  for (const warehouseGroup of warehouseGroups) {
    const warehouse = warehouseGroup.warehouse;

    // Bỏ qua nếu không có thông tin kho
    if (!warehouse) continue;

    // Kiểm tra kho có đủ tất cả sản phẩm không
    const canFulfillAll =
      canWarehouseFulfillAllItems(warehouseGroup, items);

    // Không đủ hàng thì bỏ qua kho này
    if (!canFulfillAll) continue;

    // Tính khoảng cách từ kho đến nơi giao hàng
    const distance = await calculateWarehouseDistance(
      warehouse,
      destination
    );

    // Bỏ qua nếu nơi giao nằm ngoài bán kính phục vụ
    if (
      !isWarehouseInsideRadius(
        warehouse,
        distance.distance_km
      )
    ) {
      continue;
    }

    // Thêm kho hợp lệ vào danh sách lựa chọn
    candidates.push({
      warehouse,

      // Tồn kho của từng sản phẩm tại kho
      stocksByProduct: warehouseGroup.stocksByProduct,

      // Khoảng cách từ kho đến nơi giao
      distance_km: distance.distance_km,

      // Nguồn dùng để tính khoảng cách
      distance_provider: distance.provider,

      // Điểm ưu tiên theo lựa chọn của người dùng
      requestedScore: getRequestedWarehouseScore(
        warehouse.id_kho_hang,
        items
      ),

      // Kiểm tra người dùng có chọn toàn bộ hàng từ kho này không
      isFullyRequestedWarehouse:
        requestedWarehouseIds.length === 1 &&
        Number(requestedWarehouseIds[0]) ===
          Number(warehouse.id_kho_hang),

      // Mức độ ưu tiên được cấu hình cho kho
      priority: toNumber(warehouse.muc_do_uu_tien),
    });
  }

  // Không có kho nào đủ điều kiện
  if (!candidates.length) {
    const error = new Error(
      "Không có kho nào đủ tồn kho để xuất toàn bộ đơn hàng"
    );

    error.code = "OUT_OF_STOCK";
    throw error;
  }
  // Sắp xếp để chọn kho phù hợp nhất
  candidates.sort((a, b) => {
    // Không tính được khoảng cách thì đưa kho xuống cuối
    const distanceA =
      a.distance_km === null
        ? Number.MAX_SAFE_INTEGER
        : Number(a.distance_km);

    const distanceB =
      b.distance_km === null
        ? Number.MAX_SAFE_INTEGER
        : Number(b.distance_km);

    // Ưu tiên kho gần nơi giao hơn
    if (distanceA !== distanceB) {
      return distanceA - distanceB;
    }

    // Nếu khoảng cách bằng nhau, ưu tiên kho người dùng chọn
    if (
      a.isFullyRequestedWarehouse !==
      b.isFullyRequestedWarehouse
    ) {
      return a.isFullyRequestedWarehouse ? -1 : 1;
    }

    // Tiếp theo, ưu tiên kho có điểm lựa chọn cao hơn
    if (b.requestedScore !== a.requestedScore) {
      return b.requestedScore - a.requestedScore;
    }

    // Cuối cùng, ưu tiên kho có mức ưu tiên cao hơn
    return b.priority - a.priority;
  });

  // Trả về kho phù hợp nhất
  return candidates[0];
};
module.exports = {
  chooseBestWarehouse,
};
