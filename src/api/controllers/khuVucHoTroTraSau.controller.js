const {
  khuVucHoTroTraSauService,
} = require("../services");

const getAllAreas = async (req, res) => {
  try {
    const areas =
      await khuVucHoTroTraSauService.getAllAreas();

    return res.status(200).json({
      success: true,
      message:
        "Lấy danh sách khu vực hỗ trợ thành công",
      data: areas,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getActiveAreas = async (_req, res) => {
  try {
    const areas =
      await khuVucHoTroTraSauService.getActiveAreas();

    return res.status(200).json({
      success: true,
      message:
        "Lay danh sach khu vuc ho tro tra sau dang hoat dong thanh cong",
      data: areas,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getAreaById = async (req, res) => {
  try {
    const area =
      await khuVucHoTroTraSauService.getAreaById(
        req.params.id
      );

    return res.status(200).json({
      success: true,
      message:
        "Lấy chi tiết khu vực thành công",
      data: area,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

const createArea = async (req, res) => {
  try {
    const area =
      await khuVucHoTroTraSauService.createArea(
        req.user,
        req.body
      );

    return res.status(201).json({
      success: true,
      message:
        "Thêm khu vực hỗ trợ trả sau thành công",
      data: area,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const updateArea = async (req, res) => {
  try {
    const area =
      await khuVucHoTroTraSauService.updateArea(
        req.user,
        req.params.id,
        req.body
      );

    return res.status(200).json({
      success: true,
      message:
        "Cập nhật khu vực hỗ trợ thành công",
      data: area,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteArea = async (req, res) => {
  try {
    await khuVucHoTroTraSauService.deleteArea(
      req.user,
      req.params.id
    );

    return res.status(200).json({
      success: true,
      message:
        "Xóa khu vực hỗ trợ thành công",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const checkSupportedArea = async (
  req,
  res
) => {
  try {
    const result =
      await khuVucHoTroTraSauService.checkSupportedArea(
        req.body
      );

    return res.status(200).json({
      success: true,

      message: result.duoc_ho_tro
        ? "Địa chỉ ao nuôi nằm trong khu vực được hỗ trợ mua trả sau"
        : "Địa chỉ ao nuôi hiện chưa nằm trong khu vực được hỗ trợ mua trả sau",

      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getAllAreas,
  getActiveAreas,
  getAreaById,
  createArea,
  updateArea,
  deleteArea,
  checkSupportedArea,
};
