const { departurePointService } = require("../services");

const getAllDeparturePoints = async (req, res) => {
  try {
    const points = await departurePointService.getAllDeparturePoints();
    return res.status(200).json({
      success: true,
      message: "Lay danh sach diem xuat phat thanh cong",
      data: points,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getDefaultDeparturePoint = async (req, res) => {
  try {
    const point = await departurePointService.getDefaultDeparturePoint();
    return res.status(200).json({
      success: true,
      message: "Lay diem xuat phat mac dinh thanh cong",
      data: point,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

const createDeparturePoint = async (req, res) => {
  try {
    const point = await departurePointService.createDeparturePoint(req.user, req.body);
    return res.status(201).json({
      success: true,
      message: "Tao diem xuat phat thanh cong",
      data: point,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const updateDeparturePoint = async (req, res) => {
  try {
    const point = await departurePointService.updateDeparturePoint(
      req.user,
      req.params.id,
      req.body
    );
    return res.status(200).json({
      success: true,
      message: "Cap nhat diem xuat phat thanh cong",
      data: point,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getAllDeparturePoints,
  getDefaultDeparturePoint,
  createDeparturePoint,
  updateDeparturePoint,
};
