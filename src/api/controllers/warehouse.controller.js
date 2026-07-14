const { warehouseService } = require("../services");

const getWarehouses = async (req, res) => {
  try {
    const warehouses = await warehouseService.getWarehouses(req.query || {});
    return res.status(200).json({
      success: true,
      message: "Lay danh sach kho hang thanh cong",
      data: warehouses,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const createWarehouse = async (req, res) => {
  try {
    const warehouse = await warehouseService.createWarehouse(req.user, req.body);
    return res.status(201).json({
      success: true,
      message: "Tao kho hang thanh cong",
      data: warehouse,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const updateWarehouse = async (req, res) => {
  try {
    const warehouse = await warehouseService.updateWarehouse(
      req.user,
      req.params.id,
      req.body
    );
    return res.status(200).json({
      success: true,
      message: "Cap nhat kho hang thanh cong",
      data: warehouse,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const upsertProductStock = async (req, res) => {
  try {
    const stock = await warehouseService.upsertProductStock(req.user, req.body);
    return res.status(200).json({
      success: true,
      message: "Cap nhat ton kho san pham thanh cong",
      data: stock,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const getProductStocks = async (req, res) => {
  try {
    const stocks = await warehouseService.getProductStocks(req.params.productId);
    return res.status(200).json({
      success: true,
      message: "Lay ton kho theo san pham thanh cong",
      data: stocks,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const getWarehouseStocks = async (req, res) => {
  try {
    const stocks = await warehouseService.getWarehouseStocks(req.params.warehouseId);
    return res.status(200).json({
      success: true,
      message: "Lay ton kho theo kho thanh cong",
      data: stocks,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  getWarehouses,
  createWarehouse,
  updateWarehouse,
  upsertProductStock,
  getProductStocks,
  getWarehouseStocks,
};
