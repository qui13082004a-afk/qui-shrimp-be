const { pondService } = require("../services");

const createPond = async (req, res) => {
  try {
    const pond = await pondService.createPond(
      req.user.id_nguoi_dung,
      req.body
    );

    return res.status(201).json({
      success: true,
      message: "Thêm ao nuôi thành công",
      data: pond,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getMyPonds = async (req, res) => {
  try {
    const ponds = await pondService.getMyPonds(req.user.id_nguoi_dung);

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách ao nuôi thành công",
      data: ponds,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getPondById = async (req, res) => {
  try {
    const pond = await pondService.getPondById(
      req.params.id,
      req.user.id_nguoi_dung
    );

    return res.status(200).json({
      success: true,
      message: "Lấy chi tiết ao nuôi thành công",
      data: pond,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

const updatePond = async (req, res) => {
  try {
    const pond = await pondService.updatePond(
      req.params.id,
      req.user.id_nguoi_dung,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Cập nhật ao nuôi thành công",
      data: pond,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const deletePond = async (req, res) => {
  try {
    await pondService.deletePond(
      req.params.id,
      req.user.id_nguoi_dung
    );

    return res.status(200).json({
      success: true,
      message: "Xóa ao nuôi thành công",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createPond,
  getMyPonds,
  getPondById,
  updatePond,
  deletePond,
};