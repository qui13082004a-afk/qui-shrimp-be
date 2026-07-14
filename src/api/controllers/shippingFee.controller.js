const { shippingFeeService } = require("../services");

const getAllFees = async (req, res) => {
  try {
    const fees = await shippingFeeService.getAllFees(req.query);
    return res.status(200).json({
      success: true,
      message: "Lay danh sach muc phi van chuyen thanh cong",
      data: fees,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getFeeById = async (req, res) => {
  try {
    const fee = await shippingFeeService.getFeeById(req.params.id);
    return res.status(200).json({
      success: true,
      message: "Lay chi tiet muc phi van chuyen thanh cong",
      data: fee,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

const createFee = async (req, res) => {
  try {
    const fee = await shippingFeeService.createFee(req.user, req.body);
    return res.status(201).json({
      success: true,
      message: "Tao muc phi van chuyen thanh cong",
      data: fee,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const updateFee = async (req, res) => {
  try {
    const fee = await shippingFeeService.updateFee(req.user, req.params.id, req.body);
    return res.status(200).json({
      success: true,
      message: "Cap nhat muc phi van chuyen thanh cong",
      data: fee,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const calculateShippingFee = async (req, res) => {
  try {
    const result = await shippingFeeService.calculateShippingFee(req.body);
    return res.status(200).json({
      success: true,
      message: "Tinh phi van chuyen thanh cong",
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
  getAllFees,
  getFeeById,
  createFee,
  updateFee,
  calculateShippingFee,
};
