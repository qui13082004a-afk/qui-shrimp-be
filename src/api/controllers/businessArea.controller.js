const { businessAreaService } = require("../services");

const getAllAreas = async (req, res) => {
  try {
    const areas = await businessAreaService.getAllAreas();
    return res.status(200).json({
      success: true,
      message: "Lay danh sach khu vuc kinh doanh thanh cong",
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
    const area = await businessAreaService.getAreaById(req.params.id);
    return res.status(200).json({
      success: true,
      message: "Lay chi tiet khu vuc kinh doanh thanh cong",
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
    const area = await businessAreaService.createArea(req.user, req.body);
    return res.status(201).json({
      success: true,
      message: "Tao khu vuc kinh doanh thanh cong",
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
    const area = await businessAreaService.updateArea(
      req.user,
      req.params.id,
      req.body
    );
    return res.status(200).json({
      success: true,
      message: "Cap nhat khu vuc kinh doanh thanh cong",
      data: area,
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
  getAreaById,
  createArea,
  updateArea,
};
